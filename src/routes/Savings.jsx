import { useState } from 'react'
import { Plus, Landmark } from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  useFinanceStore,
  selectTotalMonthlySavings,
  selectTotalLoanPrincipalPaydown,
} from '../store/useFinanceStore'
import SavingsComponentForm from '../components/savings/SavingsComponentForm'
import SavingsComponentList from '../components/savings/SavingsComponentList'
import CategorySummary from '../components/common/CategorySummary'
import CategoryManager from '../components/common/CategoryManager'
import SuccessMessage from '../components/common/SuccessMessage'
import { formatCurrency } from '../utils/formatCurrency'
import { useTransientMessage } from '../utils/useTransientMessage'

export default function Savings() {
  const components = useFinanceStore((s) => s.savingsComponents)
  const categories = useFinanceStore((s) => s.categories.savings)
  const total = useFinanceStore(selectTotalMonthlySavings)
  const loanPrincipal = useFinanceStore(selectTotalLoanPrincipalPaydown)
  const addSavingsComponent = useFinanceStore((s) => s.addSavingsComponent)
  const updateSavingsComponent = useFinanceStore((s) => s.updateSavingsComponent)
  const deleteSavingsComponent = useFinanceStore((s) => s.deleteSavingsComponent)

  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [message, showMessage] = useTransientMessage()

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">חיסכון חודשי</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            סך הכול לחודש:{' '}
            <span className="font-semibold tabular-nums">{formatCurrency(total)}</span>
            {' · '}
            כ־{formatCurrency(total * 12)} בשנה
          </p>
        </div>
        {!showAddForm && (
          <button
            type="button"
            onClick={() => {
              setEditingId(null)
              setShowAddForm(true)
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700"
          >
            <Plus className="size-4" />
            הוסף רכיב חיסכון
          </button>
        )}
      </div>

      <SuccessMessage message={message} />

      {loanPrincipal > 0 && (
        <div className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-800 dark:bg-slate-800/40">
          <Landmark className="mt-0.5 size-4 shrink-0 text-slate-400 dark:text-slate-500" />
          <p className="text-slate-600 dark:text-slate-300">
            מתוך הסכום למעלה,{' '}
            <span className="font-semibold tabular-nums text-slate-900 dark:text-white">
              {formatCurrency(loanPrincipal)}
            </span>{' '}
            הם ירידת קרן מהלוואות - מחושבים אוטומטית מתוך{' '}
            <Link to="/liabilities" className="text-brand-600 hover:underline dark:text-brand-400">
              מסך ההתחייבויות
            </Link>
            , כדי שלא תצטרך להזין אותם פעם נוספת כאן.
          </p>
        </div>
      )}

      {showAddForm && (
        <SavingsComponentForm
          categories={categories}
          submitLabel="הוסף רכיב"
          onSubmit={(data) => {
            addSavingsComponent(data)
            setShowAddForm(false)
            showMessage(`הרכיב "${data.name}" נוסף בהצלחה`)
          }}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      <CategoryManager domain="savings" items={components} />

      <CategorySummary items={components} categories={categories} valueKey="amount" />

      <SavingsComponentList
        components={components}
        categories={categories}
        editingId={editingId}
        onStartEdit={(id) => {
          setShowAddForm(false)
          setEditingId(id)
        }}
        onSaveEdit={(id, data) => {
          updateSavingsComponent(id, data)
          setEditingId(null)
          showMessage(`השינויים ב"${data.name}" נשמרו`)
        }}
        onCancelEdit={() => setEditingId(null)}
        onDelete={(id) => {
          const component = components.find((c) => c.id === id)
          deleteSavingsComponent(id)
          showMessage(component ? `הרכיב "${component.name}" נמחק` : 'הרכיב נמחק')
        }}
      />
    </div>
  )
}
