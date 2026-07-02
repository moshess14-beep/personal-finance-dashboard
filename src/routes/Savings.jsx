import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useFinanceStore, selectTotalMonthlySavings } from '../store/useFinanceStore'
import SavingsComponentForm from '../components/savings/SavingsComponentForm'
import SavingsComponentList from '../components/savings/SavingsComponentList'
import SavingsCategorySummary from '../components/savings/SavingsCategorySummary'
import { formatCurrency } from '../utils/formatCurrency'

export default function Savings() {
  const components = useFinanceStore((s) => s.savingsComponents)
  const total = useFinanceStore(selectTotalMonthlySavings)
  const addSavingsComponent = useFinanceStore((s) => s.addSavingsComponent)
  const updateSavingsComponent = useFinanceStore((s) => s.updateSavingsComponent)
  const deleteSavingsComponent = useFinanceStore((s) => s.deleteSavingsComponent)

  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState(null)

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

      {showAddForm && (
        <SavingsComponentForm
          submitLabel="הוסף רכיב"
          onSubmit={(data) => {
            addSavingsComponent(data)
            setShowAddForm(false)
          }}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      <SavingsCategorySummary components={components} />

      <SavingsComponentList
        components={components}
        editingId={editingId}
        onStartEdit={(id) => {
          setShowAddForm(false)
          setEditingId(id)
        }}
        onSaveEdit={(id, data) => {
          updateSavingsComponent(id, data)
          setEditingId(null)
        }}
        onCancelEdit={() => setEditingId(null)}
        onDelete={(id) => deleteSavingsComponent(id)}
      />
    </div>
  )
}
