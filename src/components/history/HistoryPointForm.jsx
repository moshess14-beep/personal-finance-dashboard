import { useState } from 'react'
import { Check, X } from 'lucide-react'
import { formatCurrency } from '../../utils/formatCurrency'

const today = () => new Date().toISOString().slice(0, 10)
const EMPTY = { date: today(), totalAssets: '', totalLiabilities: '', note: '' }

export default function HistoryPointForm({ initialValues, onSubmit, onCancel, submitLabel }) {
  const [values, setValues] = useState(() => ({ ...EMPTY, ...initialValues }))
  const [error, setError] = useState('')

  function handleChange(field, val) {
    setValues((v) => ({ ...v, [field]: val }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!values.date) {
      setError('צריך לבחור תאריך')
      return
    }
    if (values.totalAssets === '' || Number.isNaN(Number(values.totalAssets))) {
      setError('צריך להזין סך נכסים מספרי')
      return
    }
    if (values.totalLiabilities === '' || Number.isNaN(Number(values.totalLiabilities))) {
      setError('צריך להזין סך התחייבויות מספרי')
      return
    }
    onSubmit({
      date: values.date,
      totalAssets: Number(values.totalAssets),
      totalLiabilities: Number(values.totalLiabilities),
      note: values.note.trim(),
    })
  }

  const netWorth = (Number(values.totalAssets) || 0) - (Number(values.totalLiabilities) || 0)

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-2"
    >
      <div className="sm:col-span-1">
        <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
          תאריך
        </label>
        <input
          autoFocus
          type="date"
          value={values.date}
          onChange={(e) => handleChange('date', e.target.value)}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-950"
        />
      </div>

      <div className="sm:col-span-1">
        <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
          שווי נקי (מחושב אוטומטית)
        </label>
        <p className="rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm font-semibold tabular-nums text-slate-700 dark:border-slate-700 dark:text-slate-200">
          {formatCurrency(netWorth)}
        </p>
      </div>

      <div className="sm:col-span-1">
        <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
          סך נכסים (₪)
        </label>
        <input
          type="number"
          inputMode="decimal"
          value={values.totalAssets}
          onChange={(e) => handleChange('totalAssets', e.target.value)}
          placeholder="0"
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-950"
        />
      </div>

      <div className="sm:col-span-1">
        <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
          סך התחייבויות (₪)
        </label>
        <input
          type="number"
          inputMode="decimal"
          value={values.totalLiabilities}
          onChange={(e) => handleChange('totalLiabilities', e.target.value)}
          placeholder="0"
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-950"
        />
      </div>

      <div className="sm:col-span-2">
        <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
          הערה (לא חובה)
        </label>
        <input
          type="text"
          value={values.note}
          onChange={(e) => handleChange('note', e.target.value)}
          placeholder="למשל: סוף רבעון 2, לפני קניית הרכב"
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-950"
        />
      </div>

      {error && (
        <p className="text-sm text-loss sm:col-span-2" role="alert">
          {error}
        </p>
      )}

      <div className="flex items-center gap-2 sm:col-span-2">
        <button
          type="submit"
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700"
        >
          <Check className="size-4" />
          {submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          <X className="size-4" />
          ביטול
        </button>
      </div>
    </form>
  )
}
