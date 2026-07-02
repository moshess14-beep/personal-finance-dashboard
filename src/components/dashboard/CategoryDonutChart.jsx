import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { motion } from 'framer-motion'
import { summarizeByCategory } from '../../utils/aggregations'
import { formatCurrency } from '../../utils/formatCurrency'
import { formatCompactCurrency } from '../../utils/formatCompactCurrency'
import { useThemeStore } from '../../store/useThemeStore'

function DonutTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const row = payload[0].payload
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg dark:border-slate-700 dark:bg-slate-800">
      <p className="mb-0.5 flex items-center gap-1.5 font-medium text-slate-900 dark:text-white">
        <span className="size-2 rounded-full" style={{ backgroundColor: row.color }} />
        {row.label}
      </p>
      <p className="font-semibold tabular-nums text-slate-700 dark:text-slate-200">
        {formatCurrency(row.total)} · {row.percent.toFixed(0)}%
      </p>
    </div>
  )
}

export default function CategoryDonutChart({ title, items, categories, delay = 0 }) {
  const isDark = useThemeStore((s) => s.isDark)
  const rows = summarizeByCategory(items, categories, isDark ? 'dark' : 'light')
  const total = rows.reduce((sum, r) => sum + r.total, 0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
    >
      <h2 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">{title}</h2>

      {rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-400 dark:text-slate-500">
          עדיין אין נתונים להצגה
        </p>
      ) : (
        <div className="flex items-center gap-5">
          <div className="relative size-32 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={rows}
                  dataKey="total"
                  nameKey="label"
                  innerRadius="68%"
                  outerRadius="100%"
                  startAngle={90}
                  endAngle={-270}
                  stroke="none"
                >
                  {rows.map((row) => (
                    <Cell key={row.id} fill={row.color} />
                  ))}
                </Pie>
                <Tooltip content={<DonutTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                {formatCompactCurrency(total)}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">סה"כ</span>
            </div>
          </div>

          <ul className="min-w-0 flex-1 space-y-1.5">
            {rows.map((row) => (
              <li key={row.id} className="flex items-center gap-2 text-xs">
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: row.color }}
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1 truncate text-slate-600 dark:text-slate-300">
                  {row.label}
                </span>
                <span className="whitespace-nowrap tabular-nums text-slate-400 dark:text-slate-500">
                  {row.percent.toFixed(0)}%
                </span>
                <span className="whitespace-nowrap font-semibold tabular-nums text-slate-800 dark:text-slate-100">
                  {formatCompactCurrency(row.total)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  )
}
