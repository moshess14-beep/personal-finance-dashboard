import { ChevronRight, ChevronLeft } from 'lucide-react'

// Picking a date from several years back with a plain <input type="date">
// means clicking through the calendar month by month. This adds a year
// dropdown (jump straight to any year) and prev/next-year buttons (skip a
// full year at a time) alongside the native input, which still supports
// typing a full date directly from the keyboard.
function shiftYear(value, delta) {
  const [y, m, d] = value.split('-')
  const newYear = String(Number(y) + delta).padStart(4, '0')
  return `${newYear}-${m}-${d}`
}

export default function DateField({ value, onChange, yearsBack = 20, yearsForward = 1 }) {
  const currentYear = Number(value.split('-')[0])
  const thisYear = new Date().getFullYear()
  const years = []
  for (let y = thisYear + yearsForward; y >= thisYear - yearsBack; y--) years.push(y)

  return (
    <div className="flex items-center gap-1.5">
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-950"
      />
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() => onChange(shiftYear(value, -1))}
          aria-label="שנה קודמת"
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-slate-300 text-slate-500 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          <ChevronRight className="size-4" />
        </button>
        <select
          value={currentYear}
          onChange={(e) => onChange(shiftYear(value, Number(e.target.value) - currentYear))}
          aria-label="בחר שנה"
          className="rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-950"
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => onChange(shiftYear(value, 1))}
          aria-label="שנה הבאה"
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-slate-300 text-slate-500 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          <ChevronLeft className="size-4" />
        </button>
      </div>
    </div>
  )
}
