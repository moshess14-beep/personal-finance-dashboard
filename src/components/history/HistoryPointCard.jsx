import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { formatCurrency } from '../../utils/formatCurrency'

const dateFormatter = new Intl.DateTimeFormat('he-IL', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

export default function HistoryPointCard({ point, onEdit, onDelete }) {
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const netWorth = Number(point.totalAssets || 0) - Number(point.totalLiabilities || 0)

  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
          {dateFormatter.format(new Date(point.date))}
        </p>
        <p className="truncate text-xs text-slate-500 dark:text-slate-400">
          נכסים {formatCurrency(point.totalAssets)} · התחייבויות {formatCurrency(point.totalLiabilities)}
          {point.note ? ` · ${point.note}` : ''}
        </p>
      </div>
      <p className="whitespace-nowrap text-sm font-semibold tabular-nums text-slate-900 dark:text-white">
        {formatCurrency(netWorth)}
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onEdit}
          aria-label="ערוך נקודת היסטוריה"
          className="inline-flex size-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          <Pencil className="size-4" />
        </button>
        {confirmingDelete ? (
          <button
            type="button"
            onClick={() => onDelete()}
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
            aria-label="מחק נקודת היסטוריה"
            className="inline-flex size-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-loss/10 hover:text-loss dark:text-slate-400"
          >
            <Trash2 className="size-4" />
          </button>
        )}
      </div>
    </div>
  )
}
