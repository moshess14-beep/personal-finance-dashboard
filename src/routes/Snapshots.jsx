import { useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { Plus, Camera } from 'lucide-react'
import {
  useFinanceStore,
  selectSnapshotsSorted,
  getSnapshotTotals,
} from '../store/useFinanceStore'
import SnapshotCard from '../components/snapshots/SnapshotCard'
import ManualSnapshotForm from '../components/snapshots/ManualSnapshotForm'
import SuccessMessage from '../components/common/SuccessMessage'
import { useTransientMessage } from '../utils/useTransientMessage'

const dateFormatter = new Intl.DateTimeFormat('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })

export default function Snapshots() {
  const sortedAsc = useFinanceStore(useShallow(selectSnapshotsSorted))
  const addManualSnapshot = useFinanceStore((s) => s.addManualSnapshot)
  const updateSnapshot = useFinanceStore((s) => s.updateSnapshot)
  const deleteSnapshot = useFinanceStore((s) => s.deleteSnapshot)

  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [expandedId, setExpandedId] = useState(null)
  const [message, showMessage] = useTransientMessage()

  // Newest first for display, but keep each snapshot's chronological
  // predecessor so the delta and comparison are against the *previous* point.
  const rows = sortedAsc
    .map((snap, i) => ({
      snap,
      prev: i > 0 ? sortedAsc[i - 1] : null,
    }))
    .reverse()

  function fmt(dateStr) {
    return dateFormatter.format(new Date(dateStr))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">צילומי מצב</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            כל סגירת תקופה נשמרת כאן כצילום מתוארך. פתח צילום כדי לראות מה השתנה מהקודם.
          </p>
        </div>
        {!showAddForm && (
          <button
            type="button"
            onClick={() => {
              setEditingId(null)
              setShowAddForm(true)
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3.5 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Plus className="size-4" />
            צילום היסטורי ידני
          </button>
        )}
      </div>

      <SuccessMessage message={message} />

      {showAddForm && (
        <ManualSnapshotForm
          submitLabel="הוסף צילום"
          onSubmit={(data) => {
            addManualSnapshot(data)
            setShowAddForm(false)
            showMessage(`הצילום מ-${fmt(data.date)} נוסף בהצלחה`)
          }}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {rows.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-300 p-10 text-center dark:border-slate-700">
          <Camera className="size-8 text-slate-300 dark:text-slate-600" />
          <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">
            עדיין אין צילומי מצב. סגור תקופה מלוח הבקרה, או הוסף צילום היסטורי ידני מתאריך שעבר.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {rows.map(({ snap, prev }) => {
            const delta = prev ? getSnapshotTotals(snap).netWorth - getSnapshotTotals(prev).netWorth : null
            const isManual = !Array.isArray(snap.assets)
            if (editingId === snap.id) {
              const totals = getSnapshotTotals(snap)
              return (
                <ManualSnapshotForm
                  key={snap.id}
                  submitLabel="שמור שינויים"
                  totalsEditable={isManual}
                  readOnlyNetWorth={totals.netWorth}
                  initialValues={
                    isManual
                      ? {
                          date: snap.date,
                          totalAssets: String(totals.totalAssets),
                          totalLiabilities: String(totals.totalLiabilities),
                          note: snap.note || '',
                        }
                      : { date: snap.date, note: snap.note || '' }
                  }
                  onSubmit={(data) => {
                    updateSnapshot(snap.id, data)
                    setEditingId(null)
                    showMessage(`הצילום מ-${fmt(data.date)} עודכן`)
                  }}
                  onCancel={() => setEditingId(null)}
                />
              )
            }
            return (
              <SnapshotCard
                key={snap.id}
                snapshot={snap}
                prevSnapshot={prev}
                delta={delta}
                expanded={expandedId === snap.id}
                onToggle={() => setExpandedId((id) => (id === snap.id ? null : snap.id))}
                onEdit={() => {
                  setShowAddForm(false)
                  setEditingId(snap.id)
                }}
                onDelete={() => {
                  deleteSnapshot(snap.id)
                  showMessage(`הצילום מ-${fmt(snap.date)} נמחק`)
                }}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
