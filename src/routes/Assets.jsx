import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useFinanceStore } from '../store/useFinanceStore'
import AssetForm from '../components/assets/AssetForm'
import AssetList from '../components/assets/AssetList'
import AssetCategorySummary from '../components/assets/AssetCategorySummary'
import SuccessMessage from '../components/common/SuccessMessage'
import { formatCurrency } from '../utils/formatCurrency'
import { useTransientMessage } from '../utils/useTransientMessage'

export default function Assets() {
  const assets = useFinanceStore((s) => s.assets)
  const addAsset = useFinanceStore((s) => s.addAsset)
  const updateAsset = useFinanceStore((s) => s.updateAsset)
  const deleteAsset = useFinanceStore((s) => s.deleteAsset)

  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [message, showMessage] = useTransientMessage()

  const total = assets.reduce((sum, a) => sum + Number(a.value || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">נכסים</h1>
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
            הוסף נכס
          </button>
        )}
      </div>

      <SuccessMessage message={message} />

      {showAddForm && (
        <AssetForm
          submitLabel="הוסף נכס"
          onSubmit={(data) => {
            addAsset(data)
            setShowAddForm(false)
            showMessage(`הנכס "${data.name}" נוסף בהצלחה`)
          }}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      <AssetCategorySummary assets={assets} />

      <AssetList
        assets={assets}
        editingId={editingId}
        onStartEdit={(id) => {
          setShowAddForm(false)
          setEditingId(id)
        }}
        onSaveEdit={(id, data) => {
          updateAsset(id, data)
          setEditingId(null)
          showMessage(`השינויים ב"${data.name}" נשמרו`)
        }}
        onCancelEdit={() => setEditingId(null)}
        onDelete={(id) => {
          const asset = assets.find((a) => a.id === id)
          deleteAsset(id)
          showMessage(asset ? `הנכס "${asset.name}" נמחק` : 'הנכס נמחק')
        }}
      />
    </div>
  )
}
