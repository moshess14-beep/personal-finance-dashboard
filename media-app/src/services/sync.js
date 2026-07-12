// אורקסטרציית הסנכרון בין מכשירים: אימות, משיכה+מיזוג ראשוני, דחיפת שינויים,
// ועדכונים חיים (Realtime) כשמכשיר אחר משנה משהו.
import { getSupabase } from './supabase'
import useLibraryStore, { setSyncHooks } from '../store/useLibraryStore'
import { setImageCloudContext, migrateLocalImageToCloud } from './images'
import { setAiProxy } from './ai'

let channel = null
let connectedUserId = null

function client() {
  const { supabaseUrl, supabaseAnonKey } = useLibraryStore.getState()
  return getSupabase(supabaseUrl, supabaseAnonKey)
}

// קוראים פעם אחת מ-App.jsx כשהאפליקציה עולה, ובכל פעם שההגדרות של Supabase משתנות
export async function connectSync() {
  const supabase = client()
  if (!supabase) {
    useLibraryStore.setState({ syncStatus: 'off', authUser: null })
    return
  }
  useLibraryStore.setState({ syncStatus: 'connecting' })
  const {
    data: { session },
  } = await supabase.auth.getSession()
  await handleSession(supabase, session)
  supabase.auth.onAuthStateChange((_event, s) => handleSession(supabase, s))
}

async function handleSession(supabase, session) {
  const user = session?.user || null
  useLibraryStore.setState({ authUser: user ? { id: user.id, email: user.email } : null })

  if (!user) {
    teardown()
    useLibraryStore.setState({ syncStatus: 'off', syncError: null })
    return
  }
  if (connectedUserId === user.id) return // כבר מסונכרן עם המשתמש הזה, אין מה לעשות שוב
  connectedUserId = user.id

  useLibraryStore.setState({ syncStatus: 'syncing', syncError: null })
  try {
    await pullAndMerge(supabase, user.id)
    setImageCloudContext({ supabase, userId: user.id })
    enableAiProxy(supabase)
    installHooks(supabase, user.id)
    setupRealtime(supabase, user.id)
    useLibraryStore.setState({ syncStatus: 'synced' })
  } catch (e) {
    useLibraryStore.setState({ syncStatus: 'error', syncError: e.message || 'שגיאת סנכרון' })
  }
}

async function pullAndMerge(supabase, userId) {
  const { items: localItems, aiKey, tmdbKey, categories } = useLibraryStore.getState()

  const [itemsRes, settingsRes] = await Promise.all([
    supabase.from('items').select('id,data').eq('user_id', userId),
    supabase.from('settings').select('data').eq('user_id', userId).maybeSingle(),
  ])
  if (itemsRes.error) throw itemsRes.error
  if (settingsRes.error && settingsRes.error.code !== 'PGRST116') throw settingsRes.error

  const remoteItems = (itemsRes.data || []).map((r) => r.data)
  const remoteIds = new Set(remoteItems.map((it) => it.id))
  // פריטים שקיימים רק במכשיר הזה (למשל נוצרו לפני החיבור לחשבון) — נשמרים ומועלים לענן
  const localOnly = localItems.filter((it) => !remoteIds.has(it.id))
  const merged = [...remoteItems, ...localOnly].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
  useLibraryStore.getState().replaceItems(merged)

  if (localOnly.length > 0) {
    const now = new Date().toISOString()
    await supabase
      .from('items')
      .upsert(localOnly.map((it) => ({ id: it.id, user_id: userId, data: it, updated_at: now })))
    setImageCloudContext({ supabase, userId })
    for (const it of localOnly) {
      if (it.imageId) migrateLocalImageToCloud(it.imageId).catch(() => {})
    }
  }

  const remoteSettings = settingsRes.data?.data || {}
  const mergedSettings = {
    aiKey: remoteSettings.aiKey || aiKey || '',
    tmdbKey: remoteSettings.tmdbKey || tmdbKey || '',
    categories: remoteSettings.categories?.length ? remoteSettings.categories : categories,
  }
  useLibraryStore.setState(mergedSettings)
  await supabase
    .from('settings')
    .upsert({ user_id: userId, data: mergedSettings, updated_at: new Date().toISOString() })
}

// שם פונקציית ה-Edge בפועל בפרויקט Supabase. שים לב: לוח הבקרה של Supabase לא תמיד
// מכבד את השם שמוזן בשדה "Function name" לפני הפריסה — לפעמים נשאר השם האוטומטי
// שהוצע (כמו "clever-worker"). אם זה קורה, אין צורך לפרוס מחדש: פשוט מעדכנים כאן
// את השם לזה שמופיע בפועל בכתובת ה-Invoke בלוח הבקרה.
const AI_FUNCTION_NAME = 'clever-worker'

// מפעיל את הזיהוי החכם המובנה: מכאן ואילך קריאות ה-AI עוברות דרך פונקציית ה-Edge
// של הפרויקט (שמחזיקה את מפתח ה-Gemini בשרת), כך שאין צורך להזין מפתח בכל מכשיר.
function enableAiProxy(supabase) {
  const { supabaseUrl, supabaseAnonKey } = useLibraryStore.getState()
  if (!supabaseUrl) return
  setAiProxy({
    supabase,
    functionsUrl: `${supabaseUrl.replace(/\/+$/, '')}/functions/v1/${AI_FUNCTION_NAME}`,
    anonKey: supabaseAnonKey,
  })
}

function installHooks(supabase, userId) {
  setSyncHooks({
    onAdd: (item) => pushItem(supabase, userId, item),
    onUpdate: (item) => pushItem(supabase, userId, item),
    onRemove: (id) =>
      supabase
        .from('items')
        .delete()
        .eq('id', id)
        .eq('user_id', userId)
        .then(({ error }) => reportError(error)),
    onSettingsChange: (settings) =>
      supabase
        .from('settings')
        .upsert({ user_id: userId, data: settings, updated_at: new Date().toISOString() })
        .then(({ error }) => reportError(error)),
  })
}

function pushItem(supabase, userId, item) {
  supabase
    .from('items')
    .upsert({ id: item.id, user_id: userId, data: item, updated_at: new Date().toISOString() })
    .then(({ error }) => reportError(error))
}

function reportError(error) {
  if (error) useLibraryStore.setState({ syncStatus: 'error', syncError: error.message })
  else if (useLibraryStore.getState().syncStatus === 'error')
    useLibraryStore.setState({ syncStatus: 'synced', syncError: null })
}

function setupRealtime(supabase, userId) {
  teardownRealtime()
  channel = supabase
    .channel(`items-${userId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'items', filter: `user_id=eq.${userId}` },
      (payload) => {
        const { items } = useLibraryStore.getState()
        if (payload.eventType === 'DELETE') {
          useLibraryStore.getState().replaceItems(items.filter((it) => it.id !== payload.old.id))
          return
        }
        const incoming = payload.new.data
        const exists = items.some((it) => it.id === incoming.id)
        useLibraryStore
          .getState()
          .replaceItems(
            exists ? items.map((it) => (it.id === incoming.id ? incoming : it)) : [incoming, ...items],
          )
      },
    )
    .subscribe()
}

function teardownRealtime() {
  if (channel) {
    channel.unsubscribe()
    channel = null
  }
}

function teardown() {
  teardownRealtime()
  connectedUserId = null
  setSyncHooks(null)
  setImageCloudContext(null)
  setAiProxy(null)
}

export async function signUp(email, password) {
  const supabase = client()
  if (!supabase) return { error: 'לא הוגדר חיבור ל-Supabase' }
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) return { error: error.message }
  if (!data.session) return { needsConfirmation: true }
  return {}
}

export async function signIn(email, password) {
  const supabase = client()
  if (!supabase) return { error: 'לא הוגדר חיבור ל-Supabase' }
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: error.message }
  return {}
}

export async function signOutUser() {
  const supabase = client()
  await supabase?.auth.signOut()
}
