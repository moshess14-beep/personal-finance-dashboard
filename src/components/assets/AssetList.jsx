import AssetCard from './AssetCard'
import AssetForm from './AssetForm'
import { getCategoryColor } from '../../utils/categories'
import { formatCurrency } from '../../utils/formatCurrency'
import { useThemeStore } from '../../store/useThemeStore'

export default function AssetList({
  assets,
  categories,
  editingId,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
}) {
  const isDark = useThemeStore((s) => s.isDark)
  const mode = isDark ? 'dark' : 'light'

  const groups = categories.map((cat) => ({
    ...cat,
    items: assets.filter((a) => a.category === cat.id),
  })).filter((g) => g.items.length > 0)

  if (groups.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          עדיין אין נכסים. הוסף את הנכס הראשון שלך כדי להתחיל לעקוב אחרי ההון שלך.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {groups.map((group) => {
        const subtotal = group.items.reduce((sum, a) => sum + Number(a.value || 0), 0)
        return (
          <div key={group.id}>
            <div className="mb-2 flex items-center gap-2">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: getCategoryColor(categories, group.id, mode) }}
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
              {group.items.map((asset) =>
                editingId === asset.id ? (
                  <AssetForm
                    key={asset.id}
                    categories={categories}
                    initialValues={asset}
                    submitLabel="שמור שינויים"
                    onSubmit={(data) => onSaveEdit(asset.id, data)}
                    onCancel={onCancelEdit}
                  />
                ) : (
                  <AssetCard
                    key={asset.id}
                    asset={asset}
                    categories={categories}
                    onEdit={() => onStartEdit(asset.id)}
                    onDelete={() => onDelete(asset.id)}
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
