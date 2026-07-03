import IncomeSourceCard from './IncomeSourceCard'
import IncomeSourceForm from './IncomeSourceForm'
import { INCOME_CATEGORIES, getCategoryColor } from '../../utils/categories'
import { formatCurrency } from '../../utils/formatCurrency'
import { useThemeStore } from '../../store/useThemeStore'

export default function IncomeSourceList({
  sources,
  editingId,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
}) {
  const isDark = useThemeStore((s) => s.isDark)
  const mode = isDark ? 'dark' : 'light'

  const groups = INCOME_CATEGORIES.map((cat) => ({
    ...cat,
    items: sources.filter((s) => s.category === cat.id),
  })).filter((g) => g.items.length > 0)

  if (groups.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          עדיין אין מקורות הכנסה. הוסף את המקור הראשון (למשל משכורת) כדי לראות את ההכנסה החודשית הכוללת.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {groups.map((group) => {
        const subtotal = group.items.reduce((sum, s) => sum + Number(s.amount || 0), 0)
        return (
          <div key={group.id}>
            <div className="mb-2 flex items-center gap-2">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: getCategoryColor(INCOME_CATEGORIES, group.id, mode) }}
                aria-hidden="true"
              />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                {group.label}
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                ({group.items.length})
              </span>
              <span className="ms-auto text-sm font-medium tabular-nums text-slate-600 dark:text-slate-300">
                {formatCurrency(subtotal)}
              </span>
            </div>
            <div className="space-y-2">
              {group.items.map((source) =>
                editingId === source.id ? (
                  <IncomeSourceForm
                    key={source.id}
                    initialValues={source}
                    submitLabel="שמור שינויים"
                    onSubmit={(data) => onSaveEdit(source.id, data)}
                    onCancel={onCancelEdit}
                  />
                ) : (
                  <IncomeSourceCard
                    key={source.id}
                    source={source}
                    onEdit={() => onStartEdit(source.id)}
                    onDelete={() => onDelete(source.id)}
                  />
                ),
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
