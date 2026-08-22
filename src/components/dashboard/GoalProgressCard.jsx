import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Target, ArrowLeft } from 'lucide-react'
import { useFinanceStore, selectEffectiveTarget, selectNetWorth } from '../../store/useFinanceStore'
import { formatCurrency } from '../../utils/formatCurrency'

export default function GoalProgressCard({ delay = 0 }) {
  const target = useFinanceStore(selectEffectiveTarget)
  const netWorth = useFinanceStore(selectNetWorth)
  const progressPct = target > 0 ? Math.min(100, Math.max(0, (netWorth / target) * 100)) : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
    >
      <Link
        to="/goals"
        className="block rounded-2xl border border-slate-200 bg-white p-5 transition-transform hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900 dark:hover:shadow-none"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
              <Target className="size-4.5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                {progressPct.toFixed(0)}% מהיעד לעצמאות כלכלית
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                {formatCurrency(netWorth)} מתוך {formatCurrency(target)}
              </p>
            </div>
          </div>
          <ArrowLeft className="size-4 shrink-0 text-slate-400 dark:text-slate-500" />
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div className="h-full rounded-full bg-brand-600" style={{ width: `${progressPct}%` }} />
        </div>
      </Link>
    </motion.div>
  )
}
