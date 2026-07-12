import { useState } from 'react'
import { Sparkles, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import Modal from './Modal'
import AccountSection from './AccountSection'
import useLibraryStore from '../store/useLibraryStore'
import { DEMO } from '../services/env'
import { testAiKey } from '../services/ai'

export default function SettingsModal({ onClose }) {
  const tmdbKey = useLibraryStore((s) => s.tmdbKey)
  const setTmdbKey = useLibraryStore((s) => s.setTmdbKey)
  const aiKey = useLibraryStore((s) => s.aiKey)
  const setAiKey = useLibraryStore((s) => s.setAiKey)
  const authUser = useLibraryStore((s) => s.authUser)
  const seedDemo = useLibraryStore((s) => s.seedDemo)
  const clearAll = useLibraryStore((s) => s.clearAll)
  const [key, setKey] = useState(tmdbKey)
  const [gKey, setGKey] = useState(aiKey)
  const [saved, setSaved] = useState(false)
  const [gSaved, setGSaved] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState(null) // {ok, message}

  async function runTest() {
    setTesting(true)
    setTestResult(null)
    try {
      await testAiKey(gKey.trim())
      setTestResult({ ok: true, message: 'החיבור תקין! הזיהוי החכם מוכן לשימוש.' })
    } catch (e) {
      setTestResult({
        ok: false,
        message: [e.message, e.detail].filter(Boolean).join(' — '),
      })
    }
    setTesting(false)
  }

  return (
    <Modal title="הגדרות" onClose={onClose}>
      <div className="space-y-5">
        {DEMO && (
          <div className="bg-amber-50 text-amber-700 text-xs rounded-xl px-3 py-2 leading-relaxed font-semibold">
            זוהי גרסת הדגמה: החיפוש וקריאת התמונה מדומים, ונתוני דוגמה נטענים אוטומטית.
            בגרסה המלאה החיפוש רץ מול מקורות אמיתיים.
          </div>
        )}

        {!DEMO && <AccountSection />}

        <div>
          <div className="text-sm font-bold text-slate-700 mb-1 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-teal-600" />
            זיהוי תמונות חכם
          </div>
          {!DEMO && authUser ? (
            <div className="bg-emerald-50 text-emerald-700 text-xs rounded-xl px-3 py-2 leading-relaxed font-semibold mb-2 flex items-start gap-1.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                הזיהוי החכם <b>מובנה ופעיל</b> דרך החשבון שלכם — אין צורך במפתח. מעלים צילום מסך
                והאפליקציה מזהה לבד מה זה, מה השם והפרטים.
              </span>
            </div>
          ) : (
            <p className="text-[11px] text-slate-400 leading-relaxed mb-2">
              הזיהוי החכם <b>מובנה</b> — פשוט התחברו לחשבון למעלה והוא יעבוד לבד, בלי מפתח. (עד
              שמתחברים, אפשר להזין מפתח Gemini פרטי כאן למטה כדי להפעיל אותו כבר עכשיו.)
            </p>
          )}
          {!DEMO && (
            <details className="mb-1">
              <summary className="text-[11px] text-slate-400 font-semibold cursor-pointer">
                הפעלת הזיהוי המובנה (התקנה חד-פעמית בשרת)
              </summary>
              <ol className="text-[11px] text-slate-400 leading-relaxed list-decimal ps-4 space-y-0.5 mt-1.5">
                <li>
                  בלוח הבקרה של Supabase → <b>Edge Functions</b> → יצירת פונקציה חדשה בשם{' '}
                  <code dir="ltr" className="bg-slate-100 rounded px-1">
                    gemini
                  </code>
                </li>
                <li>
                  מדביקים את תוכן הקובץ{' '}
                  <code dir="ltr" className="bg-slate-100 rounded px-1">
                    supabase/functions/gemini/index.ts
                  </code>{' '}
                  ולוחצים Deploy
                </li>
                <li>
                  לב שים: לפעמים Supabase לא משנה את הכתובת בפועל לשם שהזנתם — בודקים בכתובת
                  ה-Invoke בעמוד הפונקציה מה השם האמיתי, ומעדכנים בהתאם את מפתח הקבוע{' '}
                  <code dir="ltr" className="bg-slate-100 rounded px-1">
                    AI_FUNCTION_NAME
                  </code>{' '}
                  בקובץ{' '}
                  <code dir="ltr" className="bg-slate-100 rounded px-1">
                    src/services/sync.js
                  </code>
                </li>
                <li>
                  ב-Edge Functions → Secrets מוסיפים סוד בשם{' '}
                  <code dir="ltr" className="bg-slate-100 rounded px-1">
                    GEMINI_API_KEY
                  </code>{' '}
                  עם מפתח Gemini חינמי (מ-aistudio.google.com)
                </li>
                <li>זהו — מעכשיו כל מי שמתחבר לחשבון נהנה מהזיהוי בלי להזין מפתח.</li>
              </ol>
            </details>
          )}
          <details className="mb-1">
            <summary className="text-[11px] text-slate-400 font-semibold cursor-pointer">
              מפתח Gemini פרטי (לא חובה)
            </summary>
            <p className="text-[11px] text-slate-400 leading-relaxed mt-1.5 mb-2">
              רק אם רוצים להשתמש במכסה נפרדת משלכם (מפתח חינמי מ-aistudio.google.com → Get API key).
              אם מזינים מפתח, הוא גובר על הזיהוי המובנה.
            </p>
            <div className="flex gap-2">
              <input
                value={gKey}
                onChange={(e) => setGKey(e.target.value)}
                placeholder="הדביקו כאן מפתח Gemini (אופציונלי)…"
                dir="ltr"
                className="flex-1 text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-teal-600"
              />
              <button
                onClick={() => {
                  setAiKey(gKey.trim())
                  setGSaved(true)
                  setTimeout(() => setGSaved(false), 1500)
                }}
                className="bg-teal-700 text-white rounded-xl px-4 text-sm font-bold"
              >
                {gSaved ? '✓ נשמר' : 'שמירה'}
              </button>
            </div>
          </details>
          <button
            onClick={runTest}
            disabled={testing || (!gKey.trim() && !authUser && !DEMO)}
            className="mt-2 w-full flex items-center justify-center gap-1.5 text-xs font-bold text-teal-700 bg-teal-50 disabled:opacity-50 rounded-xl py-2"
          >
            {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            בדיקת חיבור
          </button>
          {testResult && (
            <div
              className={`mt-2 flex items-start gap-1.5 text-xs rounded-xl px-3 py-2 font-semibold leading-relaxed ${
                testResult.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'
              }`}
            >
              {testResult.ok ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}
        </div>

        <div>
          <div className="text-sm font-bold text-slate-700 mb-1">מפתח TMDB (אופציונלי)</div>
          <p className="text-[11px] text-slate-400 leading-relaxed mb-2">
            בדרך כלל אין צורך: פרטי סרטים וסדרות — כולל <b>זמינות בפלטפורמות סטרימינג בישראל</b> —
            מגיעים אוטומטית ללא מפתח. מפתח חינמי מאתר themoviedb.org משמש כמקור גיבוי נוסף
            ומשלים פרטים כמו במאי ותקציר מורחב.
          </p>
          <div className="flex gap-2">
            <input
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="הדביקו כאן את המפתח…"
              dir="ltr"
              className="flex-1 text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-teal-600"
            />
            <button
              onClick={() => {
                setTmdbKey(key.trim())
                setSaved(true)
                setTimeout(() => setSaved(false), 1500)
              }}
              className="bg-teal-700 text-white rounded-xl px-4 text-sm font-bold"
            >
              {saved ? '✓ נשמר' : 'שמירה'}
            </button>
          </div>
        </div>

        <div>
          <div className="text-sm font-bold text-slate-700 mb-1">נתונים</div>
          <p className="text-[11px] text-slate-400 leading-relaxed mb-2">
            הנתונים נשמרים במכשיר זה, ואם מחוברים לחשבון — גם בענן ומסתנכרנים אוטומטית.
          </p>
          <div className="flex gap-2">
            <button
              onClick={seedDemo}
              className="flex-1 text-xs font-bold text-teal-700 bg-teal-50 rounded-xl py-2.5"
            >
              טעינת נתוני דוגמה
            </button>
            <button
              onClick={() => {
                if (!confirmClear) {
                  setConfirmClear(true)
                  return
                }
                clearAll()
                setConfirmClear(false)
              }}
              className={`flex-1 text-xs font-bold rounded-xl py-2.5 ${
                confirmClear ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-500'
              }`}
            >
              {confirmClear ? 'בטוח? הקישו שוב' : 'מחיקת כל הנתונים'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
