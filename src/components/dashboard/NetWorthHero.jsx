import { motion } from 'framer-motion'
import { useShallow } from 'zustand/react/shallow'
import { TrendingUp, TrendingDown } from 'lucide-react'
import {
  useFinanceStore,
  selectNetWorth,
  selectNetWorthGrowthSinceLastSnapshot,
  selectLastUpdatedAt,
} from '../../store/useFinanceStore'
import { formatCurrency } from '../../utils/formatCurrency'
import { formatRelativeDate } from '../../utils/formatDate'
import { useCountUp } from '../../utils/useCountUp'

const sinceFormatter = new Intl.DateTimeFormat('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })

export default function NetWorthHero() {
  const netWorth = useFinanceStore(selectNetWorth)
  // Fresh object each call; useShallow keeps the reference stable when the
  // contents haven't actually changed, otherwise useSyncExternalStore treats
  // it as "always changing" and loops.
  const trend = useFinanceStore(useShallow(selectNetWorthGrowthSinceLastSnapshot))
  const assetsCount = useFinanceStore((s) => s.assets.length)
  const liabilitiesCount = useFinanceStore((s) => s.liabilities.length)
  const lastUpdatedAt = useFinanceStore(selectLastUpdatedAt)
  const animated = useCountUp(netWorth)

  const isPositiveTrend = trend && trend.delta >= 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="py-6 text-center"
    >
      <p className="mb-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
        השווי הנקי שלי
      </p>
      <p
        className="bg-gradient-to-b from-slate-900 to-slate-600 bg-clip-text text-5xl font-bold tracking-tight text-transparent sm:text-6xl dark:from-white dark:to-slate-300"
        style={{ fontVariantNumeric: 'proportional-nums' }}
      >
        {formatCurrency(animated)}
      </p>

      <div className="mt-3 flex items-center justify-center gap-3 text-sm">
        {trend ? (
          <span
            className={`inline-flex items-center gap-1 font-medium tabular-nums ${
              isPositiveTrend ? 'text-gain' : 'text-loss'
            }`}
          >
            {isPositiveTrend ? <TrendingUp className="size-4" /> : <TrendingDown className="size-4" />}
            {isPositiveTrend ? '+' : ''}
            {formatCurrency(trend.delta)} ({isPositiveTrend ? '+' : ''}
            {trend.percent.toFixed(1)}%) מאז הצילום ב־{sinceFormatter.format(new Date(trend.sinceDate))}
          </span>
        ) : (
          <span className="text-slate-400 dark:text-slate-500">
            אין עדיין צילום מצב להשוואה — סגירת תקופה תיצור נקודת התחלה
          </span>
        )}
      </div>

      <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
        מבוסס על {assetsCount} נכסים ו־{liabilitiesCount} התחייבויות
        {lastUpdatedAt && <> · עודכן לאחרונה {formatRelativeDate(lastUpdatedAt)}</>}
      </p>
    </motion.div>
  )
}
