import { useRef, useState } from 'react'
import { Download, Upload, ShieldCheck, TriangleAlert } from 'lucide-react'
import { useFinanceStore, BACKUP_DATA_KEYS } from '../../store/useFinanceStore'

function isValidBackup(data) {
  return (
    data &&
    typeof data === 'object' &&
    Array.isArray(data.assets) &&
    Array.isArray(data.liabilities)
  )
}

export default function BackupControls() {
  const fileInputRef = useRef(null)
  const [pendingImport, setPendingImport] = useState(null)
  const [status, setStatus] = useState(null) // { type: 'success' | 'error', message }

  function handleExport() {
    const state = useFinanceStore.getState()
    const backup = Object.fromEntries(BACKUP_DATA_KEYS.map((key) => [key, state[key]]))
    backup.exportedAt = new Date().toISOString()
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const dateStr = new Date().toISOString().slice(0, 10)
    a.href = url
    a.download = `גיבוי-מעקב-הון-${dateStr}.json`
    a.click()
    URL.revokeObjectURL(url)
    setStatus({ type: 'success', message: 'קובץ הגיבוי הורד בהצלחה' })
  }

  function handleFileSelected(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result)
        if (!isValidBackup(parsed)) {
          setStatus({ type: 'error', message: 'הקובץ שנבחר אינו קובץ גיבוי תקין' })
          return
        }
        setPendingImport(parsed)
        setStatus(null)
      } catch {
        setStatus({ type: 'error', message: 'לא ניתן לקרוא את הקובץ — ודא שזה קובץ JSON תקין' })
      }
    }
    reader.readAsText(file)
  }

  function confirmImport() {
    useFinanceStore.getState().replaceAll(pendingImport)
    setPendingImport(null)
    setStatus({ type: 'success', message: 'הנתונים שוחזרו בהצלחה מהגיבוי' })
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <h2 className="mb-1 text-sm font-semibold text-slate-900 dark:text-white">
        גיבוי ושחזור נתונים
      </h2>
      <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
        כל הנתונים שלך שמורים רק בדפדפן הזה. מומלץ להוריד גיבוי מדי פעם ולשמור אותו במקום בטוח.
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleExport}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700"
        >
          <Download className="size-4" />
          הורדת גיבוי
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3.5 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <Upload className="size-4" />
          שחזור מגיבוי
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          onChange={handleFileSelected}
          className="hidden"
        />
      </div>

      {pendingImport && (
        <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-3 dark:border-amber-500/30 dark:bg-amber-500/10">
          <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-amber-800 dark:text-amber-300">
            <TriangleAlert className="size-4" />
            שחזור הגיבוי יחליף את כל הנתונים הנוכחיים באפליקציה. להמשיך?
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={confirmImport}
              className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700"
            >
              כן, שחזר מהגיבוי
            </button>
            <button
              type="button"
              onClick={() => setPendingImport(null)}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-500/10"
            >
              ביטול
            </button>
          </div>
        </div>
      )}

      {status && (
        <p
          className={`mt-3 flex items-center gap-1.5 text-xs ${
            status.type === 'success' ? 'text-gain' : 'text-loss'
          }`}
        >
          {status.type === 'success' ? (
            <ShieldCheck className="size-3.5" />
          ) : (
            <TriangleAlert className="size-3.5" />
          )}
          {status.message}
        </p>
      )}
    </div>
  )
}
