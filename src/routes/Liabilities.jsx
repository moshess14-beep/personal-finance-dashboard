import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useFinanceStore } from '../store/useFinanceStore'
import LiabilityForm from '../components/liabilities/LiabilityForm'
import LiabilityList from '../components/liabilities/LiabilityList'
import LiabilityCategorySummary from '../components/liabilities/LiabilityCategorySummary'
import { formatCurrency } from '../utils/formatCurrency'

export default function Liabilities() {
  const liabilities = useFinanceStore((s) => s.liabilities)
  const addLiability = useFinanceStore((s) => s.addLiability)
  const updateLiability = useFinanceStore((s) => s.updateLiability)
  const deleteLiability = useFinanceStore((s) => s.deleteLiability)

  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const total = liabilities.reduce((sum, l) => sum + Number(l.value || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">התחייבויות</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            סך הכול: <span className="font-semibold tabular-nums">{formatCurrency(total)}</span>
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
            הוסף התחייבות
          </button>
        )}
      </div>

      {showAddForm && (
        <LiabilityForm
          submitLabel="הוסף התחייבות"
          onSubmit={(data) => {
            addLiability(data)
            setShowAddForm(false)
          }}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      <LiabilityCategorySummary liabilities={liabilities} />

      <LiabilityList
        liabilities={liabilities}
        editingId={editingId}
        onStartEdit={(id) => {
          setShowAddForm(false)
          setEditingId(id)
        }}
        onSaveEdit={(id, data) => {
          updateLiability(id, data)
          setEditingId(null)
        }}
        onCancelEdit={() => setEditingId(null)}
        onDelete={(id) => deleteLiability(id)}
      />
    </div>
  )
}
