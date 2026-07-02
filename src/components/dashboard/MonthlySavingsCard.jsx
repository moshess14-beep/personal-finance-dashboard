import { useState } from 'react'
import { PiggyBank, Pencil, Check, X } from 'lucide-react'
import { useFinanceStore } from '../../store/useFinanceStore'
import { formatCurrency } from '../../utils/formatCurrency'

export default function MonthlySavingsCard() {
  const monthlySavings = useFinanceStore((s) => s.monthlySavings)
  const setMonthlySavings = useFinanceStore((s) => s.setMonthlySavings)
  const [editing, setEditing] = useState(false)
  const [amount, setAmount] = useState(monthlySavings.totalAmount)
  const [note, setNote] = useState(monthlySavings.note)

  function startEdit() {
    setAmount(monthlySavings.totalAmount)
    setNote(monthlySavings.note)
    setEditing(true)
  }

  function save(e) {
    e.preventDefault()
    setMonthlySavings({ totalAmount: Number(amount) || 0, note: note.trim() })
    setEditing(false)
  }

  if (editing) {
    return (
      <form
        onSubmit={save}
        className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
      >
        <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
          חיסכון חודשי כולל (₪)
        </label>
        <input
          autoFocus
          type="number"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="mb-3 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-950"
        />
        <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
          ממה זה מורכב? (לא חובה)
        </label>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="למשל: פנסיה, קרן השתלמות, חיסכון לילדים"
          className="mb-3 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-950"
        />
        <div className="flex items-center gap-2">
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700"
          >
            <Check className="size-4" />
            שמור
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <X className="size-4" />
            ביטול
          </button>
        </div>
      </form>
    )
  }

  const annual = monthlySavings.totalAmount * 12

  return (
    <div className="group relative rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <button
        type="button"
        onClick={startEdit}
        aria-label="ערוך חיסכון חודשי"
        className="absolute end-3 top-3 inline-flex size-7 items-center justify-center rounded-lg text-slate-400 opacity-0 transition-opacity hover:bg-slate-100 hover:text-slate-900 group-hover:opacity-100 dark:hover:bg-slate-800 dark:hover:text-white"
      >
        <Pencil className="size-3.5" />
      </button>

      <div className="mb-2 flex items-center gap-2 text-slate-500 dark:text-slate-400">
        <PiggyBank className="size-4" />
        <span className="text-xs font-medium">חיסכון חודשי</span>
      </div>

      {monthlySavings.totalAmount > 0 ? (
        <>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {formatCurrency(monthlySavings.totalAmount)}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            כ־{formatCurrency(annual)} בשנה{monthlySavings.note ? ` · ${monthlySavings.note}` : ''}
          </p>
        </>
      ) : (
        <button
          type="button"
          onClick={startEdit}
          className="text-sm text-brand-600 hover:underline dark:text-brand-400"
        >
          הזן את החיסכון החודשי שלך
        </button>
      )}
    </div>
  )
}
