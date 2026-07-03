import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { formatCurrency } from '../../utils/formatCurrency'
import { formatRelativeDate } from '../../utils/formatDate'
import { getCategoryColor, LIABILITY_CATEGORIES } from '../../utils/categories'
import { useThemeStore } from '../../store/useThemeStore'

export default function LiabilityCard({ liability, onEdit, onDelete }) {
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const isDark = useThemeStore((s) => s.isDark)
  const color = getCategoryColor(LIABILITY_CATEGORIES, liability.category, isDark ? 'dark' : 'light')

  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
      <span
        className="size-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
          {liability.name}
        </p>
        {liability.notes && (
          <p className="truncate text-xs text-slate-500 dark:text-slate-400">{liability.notes}</p>
        )}
      </div>
      <div>
        <p className="whitespace-nowrap text-sm font-semibold tabular-nums text-slate-900 dark:text-white">
          {formatCurrency(liability.value)}
        </p>
        <p className="whitespace-nowrap text-[11px] text-slate-400 dark:text-slate-500">
          עודכן {formatRelativeDate(liability.updatedAt)}
        </p>
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onEdit}
          aria-label="ערוך התחייבות"
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
            aria-label="מחק התחייבות"
            className="inline-flex size-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-loss/10 hover:text-loss dark:text-slate-400"
          >
            <Trash2 className="size-4" />
          </button>
        )}
      </div>
    </div>
  )
}
