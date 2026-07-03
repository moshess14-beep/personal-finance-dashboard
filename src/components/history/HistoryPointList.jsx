import HistoryPointCard from './HistoryPointCard'
import HistoryPointForm from './HistoryPointForm'

export default function HistoryPointList({
  points,
  editingId,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
}) {
  if (points.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          עדיין אין נקודות היסטוריה. הוסף נקודה כדי להתחיל לבנות את גרף ההתקדמות שלך.
        </p>
      </div>
    )
  }

  const sorted = [...points].sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div className="space-y-2">
      {sorted.map((point) =>
        editingId === point.id ? (
          <HistoryPointForm
            key={point.id}
            initialValues={point}
            submitLabel="שמור שינויים"
            onSubmit={(data) => onSaveEdit(point.id, data)}
            onCancel={onCancelEdit}
          />
        ) : (
          <HistoryPointCard
            key={point.id}
            point={point}
            onEdit={() => onStartEdit(point.id)}
            onDelete={() => onDelete(point.id)}
          />
        ),
      )}
    </div>
  )
}
