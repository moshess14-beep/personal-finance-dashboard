import { useState } from 'react'
import Modal from './Modal'
import useLibraryStore from '../store/useLibraryStore'
import { DEMO } from '../services/env'

export default function SettingsModal({ onClose }) {
  const tmdbKey = useLibraryStore((s) => s.tmdbKey)
  const setTmdbKey = useLibraryStore((s) => s.setTmdbKey)
  const seedDemo = useLibraryStore((s) => s.seedDemo)
  const clearAll = useLibraryStore((s) => s.clearAll)
  const [key, setKey] = useState(tmdbKey)
  const [saved, setSaved] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)

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
          <div className="text-sm font-bold text-slate-700 mb-1">מפתח TMDB (לסרטים וסדרות)</div>
          <p className="text-[11px] text-slate-400 leading-relaxed mb-2">
            עם מפתח חינמי מאתר themoviedb.org מתקבלים פרטים מלאים בעברית — כולל אורך, ז'אנרים,
            פוסטרים <b>וזמינות בפלטפורמות סטרימינג בישראל</b>. בלי מפתח, המידע על סרטים וסדרות
            מגיע מוויקיפדיה העברית והוא חלקי.
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
