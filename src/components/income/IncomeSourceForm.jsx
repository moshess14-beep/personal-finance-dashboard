import { useState } from 'react'
import { Check, X } from 'lucide-react'
import { INCOME_CATEGORIES } from '../../utils/categories'

const EMPTY = { name: '', category: INCOME_CATEGORIES[0].id, amount: '', note: '' }

export default function IncomeSourceForm({ initialValues, onSubmit, onCancel, submitLabel }) {
  const [values, setValues] = useState(() => ({ ...EMPTY, ...initialValues }))
  const [error, setError] = useState('')

  function handleChange(field, val) {
    setValues((v) => ({ ...v, [field]: val }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!values.name.trim()) {
      setError('צריך להזין שם למקור ההכנסה')
      return
    }
    if (values.amount === '' || Number.isNaN(Number(values.amount))) {
      setError('צריך להזין סכום חודשי מספרי')
      return
    }
    onSubmit({
      name: values.name.trim(),
      category: values.category,
      amount: Number(values.amount),
      note: values.note.trim(),
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-2"
    >
      <div className="sm:col-span-1">
        <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
          שם מקור ההכנסה
        </label>
        <input
          autoFocus
          type="text"
          value={values.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="למשל: משכורת משה, שכירות מהדירה"
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-950"
        />
      </div>

      <div className="sm:col-span-1">
        <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
          קטגוריה
        </label>
        <select
          value={values.category}
          onChange={(e) => handleChange('category', e.target.value)}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-950"
        >
          {INCOME_CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <div className="sm:col-span-1">
        <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
          סכום חודשי (₪)
        </label>
        <input
          type="number"
          inputMode="decimal"
          value={values.amount}
          onChange={(e) => handleChange('amount', e.target.value)}
          placeholder="0"
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-950"
        />
      </div>

      <div className="sm:col-span-1">
        <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
          הערה (לא חובה)
        </label>
        <input
          type="text"
          value={values.note}
          onChange={(e) => handleChange('note', e.target.value)}
          placeholder="פרטים נוספים"
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
