import { Settings } from 'lucide-react'
import { DEMO } from '../services/env'

export default function Header({ onSettings }) {
  return (
    <header className="bg-gradient-to-l from-slate-950 via-slate-900 to-teal-900 text-white">
      <div className="max-w-lg mx-auto px-4 pt-5 pb-4 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-black flex items-center gap-2">
            ✨ ההמלצות שלי
            {DEMO && (
              <span className="text-[10px] font-bold bg-white/20 rounded-full px-2 py-0.5">
                גרסת הדגמה
              </span>
            )}
          </h1>
          <p className="text-xs text-white/80 mt-1">
            קריאה · צפייה · בילויים · מתכונים · מוצרים · הופעות חיות
          </p>
        </div>
        <button
          onClick={onSettings}
          className="p-2 bg-white/15 rounded-full hover:bg-white/25"
          aria-label="הגדרות"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </header>
  )
}
