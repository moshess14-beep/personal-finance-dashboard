import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useFinanceStore } from '../store/useFinanceStore'
import HistoryPointForm from '../components/history/HistoryPointForm'
import HistoryPointList from '../components/history/HistoryPointList'
import SuccessMessage from '../components/common/SuccessMessage'
import { useTransientMessage } from '../utils/useTransientMessage'

const dateFormatter = new Intl.DateTimeFormat('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })

export default function History() {
  const points = useFinanceStore((s) => s.historyPoints)
  const addHistoryPoint = useFinanceStore((s) => s.addHistoryPoint)
  const updateHistoryPoint = useFinanceStore((s) => s.updateHistoryPoint)
  const deleteHistoryPoint = useFinanceStore((s) => s.deleteHistoryPoint)

  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [message, showMessage] = useTransientMessage()

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">היסטוריה</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            נקודות זמן שהזנת ידנית, כדי לראות את ההתקדמות שלך לאורך זמן.
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
            הוסף נקודת היסטוריה
          </button>
        )}
      </div>

      <SuccessMessage message={message} />

      {showAddForm && (
        <HistoryPointForm
          submitLabel="הוסף נקודה"
          onSubmit={(data) => {
            addHistoryPoint(data)
            setShowAddForm(false)
            showMessage(`נקודת ההיסטוריה מ-${dateFormatter.format(new Date(data.date))} נוספה בהצלחה`)
          }}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      <HistoryPointList
        points={points}
        editingId={editingId}
        onStartEdit={(id) => {
          setShowAddForm(false)
          setEditingId(id)
        }}
        onSaveEdit={(id, data) => {
          updateHistoryPoint(id, data)
          setEditingId(null)
          showMessage(`נקודת ההיסטוריה מ-${dateFormatter.format(new Date(data.date))} עודכנה`)
        }}
        onCancelEdit={() => setEditingId(null)}
        onDelete={(id) => {
          const point = points.find((p) => p.id === id)
          deleteHistoryPoint(id)
          showMessage(
            point ? `נקודת ההיסטוריה מ-${dateFormatter.format(new Date(point.date))} נמחקה` : 'נקודת ההיסטוריה נמחקה',
          )
        }}
      />
    </div>
  )
}
