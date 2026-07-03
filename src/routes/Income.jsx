import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useFinanceStore, selectTotalMonthlyIncome } from '../store/useFinanceStore'
import IncomeSourceForm from '../components/income/IncomeSourceForm'
import IncomeSourceList from '../components/income/IncomeSourceList'
import IncomeCategorySummary from '../components/income/IncomeCategorySummary'
import { formatCurrency } from '../utils/formatCurrency'

export default function Income() {
  const sources = useFinanceStore((s) => s.incomeSources)
  const total = useFinanceStore(selectTotalMonthlyIncome)
  const addIncomeSource = useFinanceStore((s) => s.addIncomeSource)
  const updateIncomeSource = useFinanceStore((s) => s.updateIncomeSource)
  const deleteIncomeSource = useFinanceStore((s) => s.deleteIncomeSource)

  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState(null)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">הכנסות חודשיות</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            סך הכול לחודש: <span className="font-semibold tabular-nums">{formatCurrency(total)}</span>
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
            הוסף מקור הכנסה
          </button>
        )}
      </div>

      {showAddForm && (
        <IncomeSourceForm
          submitLabel="הוסף מקור הכנסה"
          onSubmit={(data) => {
            addIncomeSource(data)
            setShowAddForm(false)
          }}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      <IncomeCategorySummary sources={sources} />

      <IncomeSourceList
        sources={sources}
        editingId={editingId}
        onStartEdit={(id) => {
          setShowAddForm(false)
          setEditingId(id)
        }}
        onSaveEdit={(id, data) => {
          updateIncomeSource(id, data)
          setEditingId(null)
        }}
        onCancelEdit={() => setEditingId(null)}
        onDelete={(id) => deleteIncomeSource(id)}
      />
    </div>
  )
}
