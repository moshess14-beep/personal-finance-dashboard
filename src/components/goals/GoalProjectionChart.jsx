import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceDot,
  ResponsiveContainer,
} from 'recharts'
import { formatCurrency } from '../../utils/formatCurrency'
import { formatCompactCurrency } from '../../utils/formatCompactCurrency'

const thisYear = new Date().getFullYear()

function ProjectionTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const row = payload[0].payload
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg dark:border-slate-700 dark:bg-slate-800">
      <p className="mb-1 font-medium text-slate-500 dark:text-slate-400">שנת {thisYear + row.year}</p>
      <p className="font-semibold tabular-nums text-brand-600 dark:text-brand-400">
        שווי נקי: {formatCurrency(row.netWorth)}
      </p>
      <p className="font-semibold tabular-nums text-slate-500 dark:text-slate-400">
        יעד: {formatCurrency(row.target)}
      </p>
    </div>
  )
}

export default function GoalProjectionChart({ series, crossingYear }) {
  const crossingPoint = crossingYear != null ? series.find((p) => p.year === crossingYear) : null

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={series} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
          <defs>
            <linearGradient id="goalNetWorthGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.18} />
              <stop offset="100%" stopColor="#4f46e5" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="0" vertical={false} className="stroke-slate-100 dark:stroke-slate-800" />
          <XAxis
            dataKey="year"
            tickFormatter={(y) => thisYear + y}
            tick={{ fontSize: 11 }}
            className="fill-slate-400 dark:fill-slate-500"
            axisLine={false}
            tickLine={false}
            minTickGap={28}
          />
          <YAxis
            tickFormatter={(v) => formatCompactCurrency(v)}
            tick={{ fontSize: 11 }}
            className="fill-slate-400 dark:fill-slate-500"
            axisLine={false}
            tickLine={false}
            width={56}
          />
          <Tooltip content={<ProjectionTooltip />} />
          <Area type="monotone" dataKey="netWorth" stroke="none" fill="url(#goalNetWorthGradient)" isAnimationActive={false} />
          <Line
            type="monotone"
            dataKey="target"
            stroke="#94a3b8"
            strokeWidth={2}
            strokeDasharray="5 4"
            dot={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="netWorth"
            stroke="#4f46e5"
            strokeWidth={2.5}
            strokeLinecap="round"
            dot={false}
            activeDot={{ r: 4 }}
            isAnimationActive={false}
          />
          {crossingPoint && (
            <ReferenceDot
              x={crossingPoint.year}
              y={crossingPoint.netWorth}
              r={6}
              fill="#0ca30c"
              stroke="white"
              strokeWidth={2}
              isFront
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
