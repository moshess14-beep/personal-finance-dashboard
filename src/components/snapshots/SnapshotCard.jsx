import { useState } from 'react'
import { ChevronDown, Pencil, Trash2, Camera } from 'lucide-react'
import { getSnapshotTotals } from '../../store/useFinanceStore'
import { formatCurrency } from '../../utils/formatCurrency'
import { diffSnapshots } from '../../utils/snapshotDiff'

const dayFmt = new Intl.DateTimeFormat('he-IL', { day: '2-digit' })
const monthFmt = new Intl.DateTimeFormat('he-IL', { month: 'short', year: '2-digit' })
const fullFmt = new Intl.DateTimeFormat('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })

export default function SnapshotCard({ snapshot, prevSnapshot, delta, expanded, onToggle, onEdit, onDelete }) {
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const totals = getSnapshotTotals(snapshot)
  const isManual = !Array.isArray(snapshot.assets)
  const diff = diffSnapshots(snapshot, prevSnapshot)
  const d = new Date(snapshot.date)

  return (
    <div
      className={`rounded-xl border bg-white transition-colors dark:bg-slate-900 ${
        expanded ? 'border-brand-500 shadow-sm shadow-brand-500/10' : 'border-slate-200 dark:border-slate-800'
      }`}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          type="button"
          onClick={onToggle}
          className="flex min-w-0 flex-1 items-center gap-3 text-start"
          aria-expanded={expanded}
        >
          <span className="flex size-11 shrink-0 flex-col items-center justify-center rounded-lg bg-brand-50 leading-none text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
            <span className="text-base font-bold tabular-nums">{dayFmt.format(d)}</span>
            <span className="text-[10px] font-semibold">{monthFmt.format(d)}</span>
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold tabular-nums text-slate-900 dark:text-white">
              {formatCurrency(totals.netWorth)}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              {fullFmt.format(d)}
              {isManual && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  <Camera className="size-2.5" /> סה"כ בלבד
                </span>
              )}
            </span>
          </span>
        </button>

        {delta !== null && (
          <span
            className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold ${
              delta >= 0 ? 'bg-gain/10 text-gain' : 'bg-loss/10 text-loss'
            }`}
          >
            {delta >= 0 ? '▲' : '▼'} {delta >= 0 ? '+' : ''}
            {formatCurrency(delta)}
          </span>
        )}

        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            onClick={onEdit}
            aria-label="ערוך צילום"
            className="inline-flex size-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <Pencil className="size-4" />
          </button>
          {confirmingDelete ? (
            <button
              type="button"
              onClick={onDelete}
              onBlur={() => setConfirmingDelete(false)}
              autoFocus
              className="whitespace-nowrap rounded-lg bg-loss px-2 py-1.5 text-xs font-medium text-white"
            >
              לאשר מחיקה?
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              aria-label="מחק צילום"
              className="inline-flex size-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-loss/10 hover:text-loss dark:text-slate-400"
            >
              <Trash2 className="size-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onToggle}
            aria-label={expanded ? 'סגור פירוט' : 'פתח פירוט'}
            className="inline-flex size-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ChevronDown className={`size-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-slate-100 px-4 py-3 dark:border-slate-800">
          <div className="mb-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
            <span>
              נכסים: <span className="font-semibold tabular-nums text-slate-700 dark:text-slate-300">{formatCurrency(totals.totalAssets)}</span>
            </span>
            <span>
              התחייבויות: <span className="font-semibold tabular-nums text-slate-700 dark:text-slate-300">{formatCurrency(totals.totalLiabilities)}</span>
            </span>
            {snapshot.note && <span>הערה: {snapshot.note}</span>}
          </div>

          {!diff.hasBreakdown ? (
            <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
              {isManual
                ? 'צילום היסטורי ידני — שומר סך הכול בלבד, ללא פירוט לפי פריט.'
                : 'אין צילום קודם עם פירוט להשוואה מולו.'}
            </p>
          ) : diff.rows.length === 0 ? (
            <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
              אף פריט לא השתנה לעומת הצילום הקודם.
            </p>
          ) : (
            <div className="space-y-1">
              <p className="mb-1 text-xs font-semibold text-slate-500 dark:text-slate-400">מה השתנה לעומת הצילום הקודם</p>
              {diff.rows.map((row) => (
                <div key={row.id} className="flex items-center justify-between gap-3 py-1 text-sm">
                  <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                    {row.name}
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">
                      {row.kind === 'asset' ? 'נכס' : 'התחייבות'}
                    </span>
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="tabular-nums text-xs text-slate-400 dark:text-slate-500">
                      {formatCurrency(row.from)} ← {formatCurrency(row.to)}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        row.impact >= 0 ? 'bg-gain/10 text-gain' : 'bg-loss/10 text-loss'
                      }`}
                    >
                      {row.delta >= 0 ? '+' : ''}
                      {formatCurrency(row.delta)}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
