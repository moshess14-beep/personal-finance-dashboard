import { Circle } from 'lucide-react'
import { formatCurrency } from '../../utils/formatCurrency'
import { formatMonthsAsDuration } from '../../utils/formatDuration'

// The trail of milestones after the immediate next one, so progress feels
// like a path rather than a single far-off number. `rows` is an array of
// { milestone, monthsToReach } for the upcoming milestones (the first one is
// the same milestone NextMilestoneHero already shows big, listed here too
// for continuity with the ones after it).
export default function UpcomingMilestonesList({ rows }) {
  if (rows.length === 0) return null

  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">יעדי ביניים קרובים</h3>
      <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
        {rows.map(({ milestone, monthsToReach }, i) => (
          <div key={milestone.id} className="flex items-center gap-3 px-4 py-2.5">
            {i === 0 ? (
              <Circle className="size-3.5 shrink-0 fill-brand-600 text-brand-600" />
            ) : (
              <Circle className="size-3.5 shrink-0 text-slate-300 dark:text-slate-600" />
            )}
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-700 dark:text-slate-300">
              {milestone.label}
            </span>
            <span className="whitespace-nowrap text-sm font-semibold tabular-nums text-slate-900 dark:text-white">
              {formatCurrency(milestone.amount)}
            </span>
            <span className="whitespace-nowrap text-xs text-slate-400 dark:text-slate-500">
              {monthsToReach != null ? `בעוד ${formatMonthsAsDuration(monthsToReach)}` : '60+ שנה'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
