import { motion } from 'framer-motion'
import { Flag, PartyPopper } from 'lucide-react'
import { formatCurrency } from '../../utils/formatCurrency'
import { formatMonthsAsDuration } from '../../utils/formatDuration'

// The most motivating number on the page, so it leads: a near, concrete
// milestone with a real time estimate ("1.5M ₪, in about 1 year 2 months")
// reads very differently than an abstract multi-decade FI target - this is
// deliberately the biggest element on the screen, with the overall target
// demoted below it.
export default function NextMilestoneHero({ milestone, monthsToReach, netWorth, delay = 0 }) {
  if (!milestone) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay }}
        className="rounded-2xl border border-gain/30 bg-gain/5 p-6 text-center dark:bg-gain/10"
      >
        <PartyPopper className="mx-auto mb-2 size-8 text-gain" />
        <p className="text-lg font-bold text-slate-900 dark:text-white">כל יעדי הביניים הושגו!</p>
      </motion.div>
    )
  }

  const progressPct = milestone.amount > 0 ? Math.min(100, Math.max(0, (netWorth / milestone.amount) * 100)) : 0
  const duration = formatMonthsAsDuration(monthsToReach)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="rounded-2xl border border-brand-200 bg-gradient-to-l from-brand-50 to-white p-6 text-center dark:border-brand-500/30 dark:from-brand-500/10 dark:to-slate-900"
    >
      <p className="mb-1 flex items-center justify-center gap-1.5 text-sm font-semibold text-brand-700 dark:text-brand-300">
        <Flag className="size-4" />
        היעד הבא · {milestone.label}
      </p>
      <p className="bg-gradient-to-b from-slate-900 to-slate-600 bg-clip-text text-5xl font-bold tracking-tight text-transparent sm:text-6xl dark:from-white dark:to-slate-300">
        {formatCurrency(milestone.amount)}
      </p>
      <p className="mt-2 text-lg font-semibold text-slate-700 dark:text-slate-300">
        {monthsToReach != null ? <>הערכת זמן: בעוד {duration}</> : 'לא צפוי להגיע בהנחות הנוכחיות תוך 60 שנה'}
      </p>

      <div className="mx-auto mt-5 max-w-sm">
        <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div className="h-full rounded-full bg-brand-600" style={{ width: `${progressPct}%` }} />
        </div>
        <div className="mt-1.5 flex justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>{formatCurrency(netWorth)} היום</span>
          <span>{progressPct.toFixed(0)}%</span>
        </div>
      </div>
    </motion.div>
  )
}
