import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ComposedChart,
  Area,
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

// Axis always shows month + year (never just a bare month name, which is
// ambiguous once history spans more than one year).
const axisFormatter = new Intl.DateTimeFormat('he-IL', { month: 'short', year: 'numeric' })
const fullDateFormatter = new Intl.DateTimeFormat('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })

const GAIN_COLOR = '#0ca30c'
const LOSS_COLOR = '#d03b3b'

function ProgressTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const row = payload[0].payload
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg dark:border-slate-700 dark:bg-slate-800">
      <p className="mb-0.5 flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
        {fullDateFormatter.format(new Date(row.date))}
        {row.isLive && (
          <span className="rounded-full bg-brand-50 px-1.5 py-0.5 text-[10px] font-medium text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
            היום
          </span>
        )}
      </p>
      <p className="font-semibold tabular-nums text-slate-900 dark:text-white">
        {formatCurrency(row.netWorth)}
      </p>
    </div>
  )
}

function makeDot(color) {
  return function ChartDot(props) {
    const { cx, cy, payload } = props
    if (payload.isLive) {
      return (
        <g>
          <circle cx={cx} cy={cy} r={7} fill="white" stroke={color} strokeWidth={2.5} className="dark:fill-slate-900" />
          <circle cx={cx} cy={cy} r={2.5} fill={color} />
        </g>
      )
    }
    return <circle cx={cx} cy={cy} r={3} fill={color} strokeWidth={0} />
  }
}

export default function NetWorthProgressChart({ points, delay = 0 }) {
  const sorted = [...points]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((p) => ({
      date: p.date,
      netWorth: Number(p.totalAssets || 0) - Number(p.totalLiabilities || 0),
      isLive: Boolean(p.isLive),
    }))

  const trendColor =
    sorted.length >= 2 && sorted.at(-1).netWorth < sorted[0].netWorth ? LOSS_COLOR : GAIN_COLOR
  const gradientId = trendColor === GAIN_COLOR ? 'netWorthGradientGain' : 'netWorthGradientLoss'

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
              : 'יש רק נקודה אחת עדיין, מתאריך היום.'}{' '}
            הוסף לפחות נקודת היסטוריה אחת מהעבר כדי לראות את גרף ההתקדמות שלך.
          </p>
          <Link
            to="/history"
            className="mt-1 text-sm font-medium text-brand-600 hover:underline dark:text-brand-400"
          >
            להוספת נקודת היסטוריה
          </Link>
        </div>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={sorted} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={trendColor} stopOpacity={0.22} />
                  <stop offset="100%" stopColor={trendColor} stopOpacity={0} />
                </linearGradient>
              </defs>
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
                minTickGap={24}
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
              <Area
                type="monotone"
                dataKey="netWorth"
                stroke="none"
                fill={`url(#${gradientId})`}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="netWorth"
                stroke={trendColor}
                strokeWidth={2.5}
                strokeLinecap="round"
                dot={makeDot(trendColor)}
                activeDot={{ r: 5 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  )
}
