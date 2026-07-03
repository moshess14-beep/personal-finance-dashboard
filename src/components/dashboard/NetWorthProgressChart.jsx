import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { TrendingUp } from 'lucide-react'
import { formatCurrency } from '../../utils/formatCurrency'
import { formatCompactCurrency } from '../../utils/formatCompactCurrency'

// Axis ticks stay compact (day+month) within a single year, but switch to
// including the year once history spans more than one - otherwise e.g. two
// "1 בינואר" points a year apart look identical on the axis.
const shortDateFormatter = new Intl.DateTimeFormat('he-IL', { day: 'numeric', month: 'short' })
const shortDateWithYearFormatter = new Intl.DateTimeFormat('he-IL', {
  day: 'numeric',
  month: 'short',
  year: '2-digit',
})
const fullDateFormatter = new Intl.DateTimeFormat('he-IL', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

function ProgressTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const row = payload[0].payload
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg dark:border-slate-700 dark:bg-slate-800">
      <p className="mb-0.5 text-slate-500 dark:text-slate-400">
        {fullDateFormatter.format(new Date(row.date))}
      </p>
      <p className="font-semibold tabular-nums text-slate-900 dark:text-white">
        {formatCurrency(row.netWorth)}
      </p>
    </div>
  )
}

export default function NetWorthProgressChart({ points, delay = 0 }) {
  const sorted = [...points]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((p) => ({
      date: p.date,
      netWorth: Number(p.totalAssets || 0) - Number(p.totalLiabilities || 0),
    }))

  const spansMultipleYears =
    new Set(sorted.map((p) => new Date(p.date).getFullYear())).size > 1
  const axisFormatter = spansMultipleYears ? shortDateWithYearFormatter : shortDateFormatter

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
    >
      <h2 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">
        התקדמות שווי נקי לאורך זמן
      </h2>

      {sorted.length < 2 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <TrendingUp className="size-8 text-slate-300 dark:text-slate-600" />
          <p className="max-w-xs text-sm text-slate-500 dark:text-slate-400">
            {sorted.length === 0
              ? 'עדיין אין נקודות היסטוריה.'
              : 'יש רק נקודה אחת עדיין.'}{' '}
            הוסף לפחות שתי נקודות היסטוריה כדי לראות את גרף ההתקדמות שלך.
          </p>
          <Link
            to="/history"
            className="mt-1 text-sm font-medium text-brand-600 hover:underline dark:text-brand-400"
          >
            להוספת נקודת היסטוריה
          </Link>
        </div>
      ) : (
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sorted} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
              <CartesianGrid
                strokeDasharray="0"
                vertical={false}
                className="stroke-slate-100 dark:stroke-slate-800"
              />
              <XAxis
                dataKey="date"
                tickFormatter={(d) => axisFormatter.format(new Date(d))}
                tick={{ fontSize: 11 }}
                className="fill-slate-400 dark:fill-slate-500"
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v) => formatCompactCurrency(v)}
                tick={{ fontSize: 11 }}
                className="fill-slate-400 dark:fill-slate-500"
                axisLine={false}
                tickLine={false}
                width={56}
              />
              <Tooltip content={<ProgressTooltip />} />
              <Line
                type="monotone"
                dataKey="netWorth"
                stroke="#6366f1"
                strokeWidth={2}
                dot={{ r: 3, fill: '#6366f1', strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  )
}
