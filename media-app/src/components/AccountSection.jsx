import { useState } from 'react'
import { Cloud, Loader2, CheckCircle2, XCircle, LogOut, ChevronDown } from 'lucide-react'
import useLibraryStore from '../store/useLibraryStore'
import { connectSync, signUp, signIn, signOutUser } from '../services/sync'

const SYNC_STATUS_TEXT = {
  synced: 'מסונכרן ✓',
  syncing: 'מסנכרן…',
  connecting: 'מתחבר…',
  error: 'שגיאת סנכרון',
  off: '',
}

export default function AccountSection() {
  const supabaseUrl = useLibraryStore((s) => s.supabaseUrl)
  const supabaseAnonKey = useLibraryStore((s) => s.supabaseAnonKey)
  const setSupabaseConfig = useLibraryStore((s) => s.setSupabaseConfig)
  const authUser = useLibraryStore((s) => s.authUser)
  const syncStatus = useLibraryStore((s) => s.syncStatus)
  const syncError = useLibraryStore((s) => s.syncError)

  const [url, setUrl] = useState(supabaseUrl)
  const [anonKey, setAnonKey] = useState(supabaseAnonKey)
  const [showEditConfig, setShowEditConfig] = useState(!supabaseUrl)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [authMsg, setAuthMsg] = useState(null) // {ok, text}

  const configured = !!(supabaseUrl && supabaseAnonKey)

  function saveConfig() {
    setSupabaseConfig(url.trim(), anonKey.trim())
    setShowEditConfig(false)
    connectSync()
  }

  async function doSignUp() {
    if (!email.trim() || !password.trim()) return
    setBusy(true)
    setAuthMsg(null)
    const res = await signUp(email.trim(), password)
    if (res.error) setAuthMsg({ ok: false, text: res.error })
    else if (res.needsConfirmation)
      setAuthMsg({ ok: true, text: 'נרשמת! בדקו את המייל ואשרו את החשבון, ואז התחברו למטה.' })
    else setAuthMsg({ ok: true, text: 'נרשמת והתחברת ✓' })
    setBusy(false)
  }

  async function doSignIn() {
    if (!email.trim() || !password.trim()) return
    setBusy(true)
    setAuthMsg(null)
    const res = await signIn(email.trim(), password)
    if (res.error) setAuthMsg({ ok: false, text: res.error })
    setBusy(false)
  }

  return (
    <div>
      <div className="text-sm font-bold text-slate-700 mb-1 flex items-center gap-1.5">
        <Cloud className="w-4 h-4 text-teal-600" />
        חשבון וסנכרון בין מכשירים
      </div>

      {authUser ? (
        <div className="space-y-2">
          <p className="text-[11px] text-slate-400 leading-relaxed">
            מחוברים כ־<b dir="ltr">{authUser.email}</b>. כל הנתונים — כולל מפתחות ה-AI וה-TMDB —
            מסתנכרנים אוטומטית לכל מכשיר שמתחברים בו לאותו חשבון.
          </p>
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-bold rounded-full px-2.5 py-1 ${
                syncStatus === 'error'
                  ? 'bg-rose-50 text-rose-600'
                  : syncStatus === 'synced'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-slate-100 text-slate-500'
              }`}
            >
              {syncStatus === 'syncing' || syncStatus === 'connecting' ? (
                <Loader2 className="w-3 h-3 inline animate-spin me-1" />
              ) : null}
              {SYNC_STATUS_TEXT[syncStatus]}
            </span>
            {syncError && <span className="text-[11px] text-rose-500">{syncError}</span>}
          </div>
          <button
            onClick={() => signOutUser()}
            className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-500 bg-slate-100 rounded-xl py-2 px-4"
          >
            <LogOut className="w-3.5 h-3.5" />
            התנתקות
          </button>
        </div>
      ) : configured && !showEditConfig ? (
        <div className="space-y-2">
          <p className="text-[11px] text-slate-400 leading-relaxed">
            הירשמו או התחברו כדי שהספרייה תסתנכרן אוטומטית בין הנייד, הטאבלט והמחשב.
          </p>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="אימייל"
            type="email"
            dir="ltr"
            className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-teal-600"
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="סיסמה (לפחות 6 תווים)"
            type="password"
            dir="ltr"
            className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-teal-600"
          />
          {authMsg && (
            <div
              className={`flex items-start gap-1.5 text-xs rounded-xl px-3 py-2 font-semibold leading-relaxed ${
                authMsg.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'
              }`}
            >
              {authMsg.ok ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <span>{authMsg.text}</span>
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={doSignIn}
              disabled={busy}
              className="flex-1 bg-teal-700 disabled:bg-slate-300 text-white rounded-xl py-2 text-sm font-bold"
            >
              התחברות
            </button>
            <button
              onClick={doSignUp}
              disabled={busy}
              className="flex-1 bg-white border border-teal-700 disabled:border-slate-300 disabled:text-slate-300 text-teal-700 rounded-xl py-2 text-sm font-bold"
            >
              הרשמה
            </button>
          </div>
          <button
            onClick={() => setShowEditConfig(true)}
            className="text-[11px] text-slate-400 font-semibold underline"
          >
            שינוי חיבור Supabase
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-[11px] text-slate-400 leading-relaxed">
            הסנכרון פועל דרך <b>Supabase</b> — שירות חינמי (בדומה ל-Gemini). הקמה חד-פעמית של
            כ-5 דקות:
          </p>
          <ol className="text-[11px] text-slate-400 leading-relaxed list-decimal ps-4 space-y-0.5">
            <li>
              הרשמה ב-
              <a
                href="https://supabase.com"
                target="_blank"
                rel="noreferrer"
                className="text-teal-700 font-bold underline"
              >
                supabase.com
              </a>{' '}
              ויצירת פרויקט חדש (חינמי)
            </li>
            <li>בהגדרות הפרויקט (Project Settings → API) מעתיקים את ה-Project URL ואת ה-anon key</li>
            <li>
              ב-SQL Editor מדביקים את תוכן הקובץ{' '}
              <code dir="ltr" className="bg-slate-100 rounded px-1">
                media-app/supabase/schema.sql
              </code>{' '}
              ולוחצים Run — זה יוצר את הטבלאות וההרשאות
            </li>
            <li>מדביקים כאן למטה את ה-URL וה-anon key</li>
          </ol>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://xxxxx.supabase.co"
            dir="ltr"
            className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-teal-600"
          />
          <input
            value={anonKey}
            onChange={(e) => setAnonKey(e.target.value)}
            placeholder="anon public key"
            dir="ltr"
            className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-teal-600"
          />
          <div className="flex gap-2">
            <button
              onClick={saveConfig}
              disabled={!url.trim() || !anonKey.trim()}
              className="flex-1 bg-teal-700 disabled:bg-slate-300 text-white rounded-xl py-2 text-sm font-bold"
            >
              חיבור
            </button>
            {configured && (
              <button
                onClick={() => setShowEditConfig(false)}
                className="flex items-center justify-center gap-1 text-xs font-bold text-slate-500 bg-slate-100 rounded-xl py-2 px-3"
              >
                <ChevronDown className="w-3.5 h-3.5" />
                ביטול
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
