import { useState } from 'react'
import { Sparkles, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import Modal from './Modal'
import useLibraryStore from '../store/useLibraryStore'
import { DEMO } from '../services/env'
import { testAiKey } from '../services/ai'

export default function SettingsModal({ onClose }) {
  const tmdbKey = useLibraryStore((s) => s.tmdbKey)
  const setTmdbKey = useLibraryStore((s) => s.setTmdbKey)
  const aiKey = useLibraryStore((s) => s.aiKey)
  const setAiKey = useLibraryStore((s) => s.setAiKey)
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

        <div>
          <div className="text-sm font-bold text-slate-700 mb-1 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            מפתח AI — זיהוי תמונות חכם (מומלץ מאוד!)
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed mb-2">
            עם מפתח Gemini <b>חינמי</b> (מ-aistudio.google.com → Get API key), האפליקציה מזהה
            מצילום המסך בבת אחת: מה זה (ספר/סרט/בילוי/מתכון/מוצר), מה השם, ואילו פרטים מופיעים —
            ומשלימה אוטומטית פרטים חסרים. בלי מפתח: קריאת טקסט בסיסית בלבד.
          </p>
          <div className="flex gap-2">
            <input
              value={gKey}
              onChange={(e) => setGKey(e.target.value)}
              placeholder="הדביקו כאן את מפתח ה-Gemini…"
              dir="ltr"
              className="flex-1 text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-indigo-400"
            />
            <button
              onClick={() => {
                setAiKey(gKey.trim())
                setGSaved(true)
                setTimeout(() => setGSaved(false), 1500)
              }}
              className="bg-indigo-600 text-white rounded-xl px-4 text-sm font-bold"
            >
              {gSaved ? '✓ נשמר' : 'שמירה'}
            </button>
          </div>
          <button
            onClick={runTest}
            disabled={testing || !gKey.trim()}
            className="mt-2 w-full flex items-center justify-center gap-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 disabled:opacity-50 rounded-xl py-2"
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
              className="flex-1 text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-indigo-400"
            />
            <button
              onClick={() => {
                setTmdbKey(key.trim())
                setSaved(true)
                setTimeout(() => setSaved(false), 1500)
              }}
              className="bg-indigo-600 text-white rounded-xl px-4 text-sm font-bold"
            >
              {saved ? '✓ נשמר' : 'שמירה'}
            </button>
          </div>
        </div>

        <div>
          <div className="text-sm font-bold text-slate-700 mb-1">נתונים</div>
          <p className="text-[11px] text-slate-400 leading-relaxed mb-2">
            הנתונים נשמרים כרגע במכשיר זה בלבד. סנכרון בין מכשירים עם חשבון אישי — בשלב הבא.
          </p>
          <div className="flex gap-2">
            <button
              onClick={seedDemo}
              className="flex-1 text-xs font-bold text-indigo-600 bg-indigo-50 rounded-xl py-2.5"
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
