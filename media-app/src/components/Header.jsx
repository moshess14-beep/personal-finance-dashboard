import { Settings, Cloud, CloudOff, Loader2, CloudAlert } from 'lucide-react'
import { DEMO } from '../services/env'
import useLibraryStore from '../store/useLibraryStore'

const SYNC_BADGE = {
  synced: { Icon: Cloud, text: 'מסונכרן', cls: 'bg-emerald-50 text-emerald-700' },
  syncing: { Icon: Loader2, text: 'מסנכרן…', cls: 'bg-slate-100 text-slate-500', spin: true },
  connecting: { Icon: Loader2, text: 'מתחבר…', cls: 'bg-slate-100 text-slate-500', spin: true },
  error: { Icon: CloudAlert, text: 'שגיאת סנכרון', cls: 'bg-rose-50 text-rose-600' },
}

export default function Header({ onSettings }) {
  const authUser = useLibraryStore((s) => s.authUser)
  const syncStatus = useLibraryStore((s) => s.syncStatus)
  const badge = authUser ? SYNC_BADGE[syncStatus] : null

  return (
    <header className="bg-white/90 backdrop-blur sticky top-0 z-20 border-b border-slate-100">
      <div className="max-w-lg mx-auto px-4 pt-4 pb-3 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2 text-slate-900">
            <span className="text-teal-600">✨</span>
            ההמלצות שלי
            {DEMO && (
              <span className="text-[10px] font-bold bg-slate-100 text-slate-500 rounded-full px-2 py-0.5">
                גרסת הדגמה
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5 font-medium">
            כל מה ששווה לזכור — במקום אחד
          </p>
          {badge && (
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-bold rounded-full px-2 py-0.5 mt-1.5 ${badge.cls}`}
            >
              <badge.Icon className={`w-3 h-3 ${badge.spin ? 'animate-spin' : ''}`} />
              {badge.text}
            </span>
          )}
          {!authUser && !DEMO && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold rounded-full px-2 py-0.5 mt-1.5 bg-slate-100 text-slate-400">
              <CloudOff className="w-3 h-3" />
              לא מסונכרן
            </span>
          )}
        </div>
        <button
          onClick={onSettings}
          className="p-2.5 bg-slate-100 rounded-full text-slate-600 hover:bg-slate-200 active:scale-95 transition"
          aria-label="הגדרות"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </header>
  )
}
