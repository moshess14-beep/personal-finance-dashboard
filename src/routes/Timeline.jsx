import { Landmark, CreditCard, Wallet, History as HistoryIcon, Clock } from 'lucide-react'
import { useFinanceStore } from '../store/useFinanceStore'

const ENTITY_ICON = {
  asset: Landmark,
  liability: CreditCard,
  income: Wallet,
  historyPoint: HistoryIcon,
}

const ACTION_LABEL = {
  created: { text: 'נוסף', className: 'text-gain bg-gain/10' },
  updated: { text: 'עודכן', className: 'text-brand-600 bg-brand-50 dark:text-brand-300 dark:bg-brand-500/15' },
  deleted: { text: 'נמחק', className: 'text-loss bg-loss/10' },
}

const dayFormatter = new Intl.DateTimeFormat('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })
const timeFormatter = new Intl.DateTimeFormat('he-IL', { hour: '2-digit', minute: '2-digit' })

function groupByDay(entries) {
  const groups = new Map()
  for (const entry of entries) {
    const dayKey = entry.timestamp.slice(0, 10)
    if (!groups.has(dayKey)) groups.set(dayKey, [])
    groups.get(dayKey).push(entry)
  }
  return [...groups.entries()].sort((a, b) => b[0].localeCompare(a[0]))
}

export default function Timeline() {
  const activityLog = useFinanceStore((s) => s.activityLog)
  const sorted = [...activityLog].sort((a, b) => b.timestamp.localeCompare(a.timestamp))
  const groups = groupByDay(sorted)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">ציר זמן</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          רשימה כרונולוגית של כל העדכונים באפליקציה.
        </p>
      </div>

      {groups.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-300 p-10 text-center dark:border-slate-700">
          <Clock className="size-8 text-slate-300 dark:text-slate-600" />
          <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">
            עדיין אין פעילות רשומה. ברגע שתוסיף או תעדכן נכס, התחייבות, הכנסה או נקודת היסטוריה — זה יופיע כאן.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map(([dayKey, entries]) => (
            <div key={dayKey}>
              <h2 className="mb-2 text-xs font-semibold text-slate-400 dark:text-slate-500">
                {dayFormatter.format(new Date(dayKey))}
              </h2>
              <div className="space-y-2">
                {entries.map((entry) => {
                  const Icon = ENTITY_ICON[entry.entityType] ?? Clock
                  const action = ACTION_LABEL[entry.action] ?? { text: entry.action, className: '' }
                  return (
                    <div
                      key={entry.id}
                      className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900"
                    >
                      <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                        <Icon className="size-4" />
                      </span>
                      <p className="min-w-40 flex-1 text-sm text-slate-700 dark:text-slate-300">
                        {entry.summary}
                      </p>
                      <span
                        className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${action.className}`}
                      >
                        {action.text}
                      </span>
                      <span className="whitespace-nowrap text-xs text-slate-400 dark:text-slate-500">
                        {timeFormatter.format(new Date(entry.timestamp))}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
