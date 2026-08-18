import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { CalendarCheck, ArrowLeft, TriangleAlert } from 'lucide-react'
import {
  useFinanceStore,
  selectDaysSinceLastSnapshot,
  selectLatestSnapshot,
} from '../../store/useFinanceStore'

const dateFormatter = new Intl.DateTimeFormat('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })
const NUDGE_AFTER_DAYS = 30

export default function PeriodUpdateCard({ delay = 0 }) {
  const daysSince = useFinanceStore(selectDaysSinceLastSnapshot)
  const latest = useFinanceStore(selectLatestSnapshot)
  const snapshotCount = useFinanceStore((s) => s.snapshots.length)

  const hasSnapshots = snapshotCount > 0
  const overdue = daysSince !== null && daysSince >= NUDGE_AFTER_DAYS

  let sub
  if (!hasSnapshots) {
    sub = 'עדיין לא צילמת מצב. עדכון תקופתי אחד ייצור נקודת פתיחה להיסטוריה שלך.'
  } else if (daysSince === 0) {
    sub = `הצילום האחרון נשמר היום (${dateFormatter.format(new Date(latest.date))}).`
  } else {
    sub = `עברו ${daysSince} ימים מאז הצילום האחרון (${dateFormatter.format(new Date(latest.date))}).`
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className="overflow-hidden rounded-2xl border border-brand-200 bg-gradient-to-l from-brand-50 to-white dark:border-brand-500/30 dark:from-brand-500/10 dark:to-slate-900"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white">
            <CalendarCheck className="size-5" />
          </span>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">עדכון תקופתי</h2>
            <p className="mt-0.5 max-w-md text-sm text-slate-600 dark:text-slate-300">{sub}</p>
            {overdue && (
              <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                <TriangleAlert className="size-3.5 shrink-0" />
                כדאי לעדכן — עברה תקופה מאז הצילום האחרון
              </p>
            )}
          </div>
        </div>
        <Link
          to="/update"
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          {hasSnapshots ? 'עדכון וסגירת תקופה' : 'עדכון תקופתי ראשון'}
          <ArrowLeft className="size-4" />
        </Link>
      </div>
    </motion.div>
  )
}
