import { ASSET_CATEGORIES } from '../../utils/categories'
import { summarizeByCategory } from '../../utils/aggregations'
import { formatCurrency } from '../../utils/formatCurrency'
import { useThemeStore } from '../../store/useThemeStore'

export default function AssetCategorySummary({ assets }) {
  const isDark = useThemeStore((s) => s.isDark)
  const rows = summarizeByCategory(assets, ASSET_CATEGORIES, isDark ? 'dark' : 'light')

  if (rows.length === 0) return null

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">
        סיכום לפי קטגוריה
      </h2>
      <ul className="grid gap-2 sm:grid-cols-2">
        {rows.map((row) => (
          <li key={row.id} className="flex items-center gap-2 text-sm">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: row.color }}
              aria-hidden="true"
            />
            <span className="min-w-0 flex-1 truncate text-slate-700 dark:text-slate-300">
              {row.label}
            </span>
            <span className="whitespace-nowrap tabular-nums text-slate-500 dark:text-slate-400">
              {row.percent.toFixed(0)}%
            </span>
            <span className="whitespace-nowrap font-medium tabular-nums text-slate-900 dark:text-white">
              {formatCurrency(row.total)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
