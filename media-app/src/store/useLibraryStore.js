import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { demoItems } from '../data/demoData'
import { DEFAULT_CATEGORIES } from '../data/constants'

// הוקים שמותקנים על ידי services/sync.js אחרי התחברות מוצלחת — לא חלק מה-state
// הריאקטיבי של zustand (רק פונקציות, אין טעם לשמור/לסריאלז אותן).
let syncHooks = null
export function setSyncHooks(hooks) {
  syncHooks = hooks
}

const GENERIC_LEGACY_TYPES = { place: 'places', recipe: 'recipes', product: 'products' }

// המרת פריטים ישנים (מלפני מערכת הקטגוריות הגמישה) לצורה החדשה: place/recipe/product
// הופכים לסוג הגנרי 'note' עם categoryId, וסטטוס/דירוג ישנים הופכים ל-completed+liked.
function migrateItem(it) {
  let out = { ...it }
  const newCategoryId = GENERIC_LEGACY_TYPES[it.type]
  if (newCategoryId) {
    out = {
      id: it.id,
      createdAt: it.createdAt,
      type: 'note',
      categoryId: newCategoryId,
      titleHe: it.titleHe,
      myNote: it.myNote || '',
      sourceText: it.sourceText || '',
      imageId: it.imageId || null,
      extraImageIds: it.extraImageIds || [],
      address: it.address || '',
      mapsUrl: it.mapsUrl || '',
      price: it.price ?? null,
      store: it.store || '',
      link: it.buyUrl || it.link || '',
      kind:
        it.type === 'place'
          ? (it.placeTypes || [])[0] || ''
          : it.type === 'recipe'
            ? it.dishType || ''
            : it.productCategory || '',
      tags: [
        ...(it.type === 'place'
          ? [...(it.placeTypes || []).slice(1), ...(it.audiences || []), ...(it.region ? [it.region] : [])]
          : []),
        ...(it.type === 'recipe' ? [...(it.kashrut ? [it.kashrut] : []), ...(it.tags || [])] : []),
      ].filter(Boolean),
      identification: it.identification,
      source: it.source,
    }
  }
  const hadRating = typeof it.myRating === 'number' && it.myRating > 0
  out.completed = it.status === 'הושלם' || hadRating || !!it.completed
  out.liked = it.liked ?? (hadRating ? (it.myRating >= 4 ? true : it.myRating <= 2 ? false : null) : null)
  out.extraImageIds = out.extraImageIds || it.extraImageIds || []
  delete out.status
  delete out.myRating
  delete out.placeTypes
  delete out.audiences
  delete out.region
  delete out.dishType
  delete out.kashrut
  delete out.productCategory
  delete out.buyUrl
  return out
}

const useLibraryStore = create(
  persist(
    (set, get) => ({
      items: [],
      tmdbKey: '',
      aiKey: '',
      seeded: false,
      migratedV2: false,
      categories: DEFAULT_CATEGORIES,

      // הגדרות חיבור לסנכרון בענן (Supabase) — מוזנות במסך ההגדרות
      supabaseUrl: '',
      supabaseAnonKey: '',

      // מצב חיבור חי — לא נשמר בין טעינות, מחושב מחדש כל פעם דרך services/sync.js
      authUser: null, // { id, email } | null
      syncStatus: 'off', // 'off' | 'connecting' | 'syncing' | 'synced' | 'error'
      syncError: null,

      migrateLegacyItems: () => {
        if (get().migratedV2) return
        set((s) => ({ items: s.items.map(migrateItem), migratedV2: true }))
      },

      addItem: (item) => {
        const full = {
          extraImageIds: [],
          completed: false,
          liked: null,
          id: crypto.randomUUID(),
          createdAt: Date.now(),
          ...item,
        }
        set((s) => ({ items: [full, ...s.items] }))
        syncHooks?.onAdd?.(full)
        return full
      },

      updateItem: (id, patch) => {
        let updated = null
        set((s) => ({
          items: s.items.map((it) => {
            if (it.id !== id) return it
            updated = { ...it, ...patch }
            return updated
          }),
        }))
        if (updated) syncHooks?.onUpdate?.(updated)
      },

      removeItem: (id) => {
        set((s) => ({ items: s.items.filter((it) => it.id !== id) }))
        syncHooks?.onRemove?.(id)
      },

      // עדכון מלא של הרשימה — משמש רק לסנכרון (מיזוג מקומי+ענן, עדכון realtime)
      replaceItems: (items) => set({ items }),

      settingsSnapshot: () => {
        const { aiKey, tmdbKey, categories } = get()
        return { aiKey, tmdbKey, categories }
      },

      setTmdbKey: (tmdbKey) => {
        set({ tmdbKey })
        syncHooks?.onSettingsChange?.(get().settingsSnapshot())
      },

      setAiKey: (aiKey) => {
        set({ aiKey })
        syncHooks?.onSettingsChange?.(get().settingsSnapshot())
      },

      setSupabaseConfig: (supabaseUrl, supabaseAnonKey) => set({ supabaseUrl, supabaseAnonKey }),

      // --- ניהול קטגוריות ---
      addCategory: (cat) => {
        const full = {
          id: crypto.randomUUID(),
          builtin: false,
          types: ['note'],
          sub: '',
          emoji: '🏷️',
          gradient: 'from-slate-700 to-slate-900',
          ...cat,
        }
        set((s) => ({ categories: [...s.categories, full] }))
        syncHooks?.onSettingsChange?.(get().settingsSnapshot())
        return full
      },

      updateCategory: (id, patch) => {
        set((s) => ({
          categories: s.categories.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        }))
        syncHooks?.onSettingsChange?.(get().settingsSnapshot())
      },

      removeCategory: (id, { deleteItems = false } = {}) => {
        const cat = get().categories.find((c) => c.id === id)
        if (!cat || cat.builtin) return
        const toRemove = deleteItems ? get().items.filter((it) => it.categoryId === id).map((it) => it.id) : []
        set((s) => ({
          categories: s.categories.filter((c) => c.id !== id),
          items: deleteItems ? s.items.filter((it) => it.categoryId !== id) : s.items,
        }))
        toRemove.forEach((itemId) => syncHooks?.onRemove?.(itemId))
        syncHooks?.onSettingsChange?.(get().settingsSnapshot())
      },

      seedDemo: () =>
        set((s) => ({
          seeded: true,
          items: [
            ...s.items,
            ...demoItems.filter((d) => !s.items.some((it) => it.id === d.id)),
          ],
        })),

      clearAll: () => set({ items: [], seeded: false }),
    }),
    {
      name: 'media-library',
      partialize: (s) => ({
        items: s.items,
        tmdbKey: s.tmdbKey,
        aiKey: s.aiKey,
        seeded: s.seeded,
        migratedV2: s.migratedV2,
        categories: s.categories,
        supabaseUrl: s.supabaseUrl,
        supabaseAnonKey: s.supabaseAnonKey,
      }),
    },
  ),
)

export default useLibraryStore
