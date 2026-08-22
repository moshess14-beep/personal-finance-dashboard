import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Flag, ArrowLeft } from 'lucide-react'
import {
  useFinanceStore,
  selectEffectiveTarget,
  selectNetWorth,
  selectRealEstateValue,
  selectOtherAssetsValue,
  selectTotalLiabilities,
  selectManualMonthlySavings,
  selectTotalLoanPrincipalPaydown,
} from '../../store/useFinanceStore'
import { formatCurrency } from '../../utils/formatCurrency'
import { simulateNetWorth, monthsToReachAmount } from '../../utils/goalProjection'
import { buildMilestones, upcomingMilestones } from '../../utils/milestones'
import { formatMonthsAsDuration } from '../../utils/formatDuration'

// Mirrors the Goals screen's hierarchy: the near milestone is the motivating
// number, so it leads here too, with overall-target progress as a smaller
// secondary line rather than the headline.
export default function GoalProgressCard({ delay = 0 }) {
  const target = useFinanceStore(selectEffectiveTarget)
  const netWorth = useFinanceStore(selectNetWorth)
  const goal = useFinanceStore((s) => s.financialGoal)
  const realEstateValue = useFinanceStore(selectRealEstateValue)
  const otherAssetsValue = useFinanceStore(selectOtherAssetsValue)
  const liabilitiesValue = useFinanceStore(selectTotalLiabilities)
  const manualSavings = useFinanceStore(selectManualMonthlySavings)
  const principalPaydown = useFinanceStore(selectTotalLoanPrincipalPaydown)

  const progressPct = target > 0 ? Math.min(100, Math.max(0, (netWorth / target) * 100)) : 0

  const nextMilestoneRow = useMemo(() => {
    const milestones = buildMilestones(target)
    const [nextMilestone] = upcomingMilestones(milestones, netWorth, 1)
    if (!nextMilestone) return null
    const trajectory = simulateNetWorth({
      realEstateValue,
      otherAssetsValue,
      liabilitiesValue,
      annualNewSavings: manualSavings * 12,
      annualPrincipalPaydown: principalPaydown * 12,
      realEstateRate: goal.realEstateGrowthRate,
      otherRate: goal.otherGrowthRate,
      maxYears: 60,
    })
    return { milestone: nextMilestone, monthsToReach: monthsToReachAmount(trajectory, nextMilestone.amount) }
  }, [target, netWorth, realEstateValue, otherAssetsValue, liabilitiesValue, manualSavings, principalPaydown, goal])

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
              <Flag className="size-4.5" />
            </span>
            {nextMilestoneRow ? (
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  יעד הבא: {nextMilestoneRow.milestone.label} · {formatCurrency(nextMilestoneRow.milestone.amount)}
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  {nextMilestoneRow.monthsToReach != null
                    ? `הערכת זמן: בעוד ${formatMonthsAsDuration(nextMilestoneRow.monthsToReach)}`
                    : 'לא צפוי תוך 60 שנה בהנחות הנוכחיות'}
                </p>
              </div>
            ) : (
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {progressPct.toFixed(0)}% מהיעד לעצמאות כלכלית
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  {formatCurrency(netWorth)} מתוך {formatCurrency(target)}
                </p>
              </div>
            )}
          </div>
          <ArrowLeft className="size-4 shrink-0 text-slate-400 dark:text-slate-500" />
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div className="h-full rounded-full bg-brand-600" style={{ width: `${progressPct}%` }} />
        </div>
        <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">
          {progressPct.toFixed(0)}% מהיעד הכללי ({formatCurrency(target)})
        </p>
      </Link>
    </motion.div>
  )
}
