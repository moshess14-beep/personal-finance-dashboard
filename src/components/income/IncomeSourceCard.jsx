import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { formatCurrency } from '../../utils/formatCurrency'
import { formatRelativeDate } from '../../utils/formatDate'
import { getCategoryColor } from '../../utils/categories'
import { useThemeStore } from '../../store/useThemeStore'

export default function IncomeSourceCard({ source, categories, onEdit, onDelete }) {
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const isDark = useThemeStore((s) => s.isDark)
  const color = getCategoryColor(categories, source.category, isDark ? 'dark' : 'light')

  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
      <span
        className="size-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 truncate text-sm font-medium text-slate-900 dark:text-white">
          {source.name}
          <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-normal text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            {source.incomeType === 'assets' ? 'נכסים' : 'עבודה'}
          </span>
        </p>
        {source.note && (
          <p className="truncate text-xs text-slate-500 dark:text-slate-400">{source.note}</p>
        )}
      </div>
      <div>
        <p className="whitespace-nowrap text-sm font-semibold tabular-nums text-slate-900 dark:text-white">
          {formatCurrency(source.amount)}
        </p>
        <p className="whitespace-nowrap text-[11px] text-slate-400 dark:text-slate-500">
          עודכן {formatRelativeDate(source.updatedAt)}
        </p>
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onEdit}
          aria-label="ערוך מקור הכנסה"
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
            aria-label="מחק מקור הכנסה"
            className="inline-flex size-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-loss/10 hover:text-loss dark:text-slate-400"
          >
            <Trash2 className="size-4" />
          </button>
        )}
      </div>
    </div>
  )
}
