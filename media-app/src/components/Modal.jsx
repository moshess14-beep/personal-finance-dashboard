import { X } from 'lucide-react'

export default function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center" dir="rtl">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-md max-h-[88vh] rounded-t-3xl sm:rounded-3xl flex flex-col overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 shrink-0">
          <h2 className="font-bold text-slate-800">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:bg-slate-100"
            aria-label="סגירה"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto p-4 pb-6">{children}</div>
      </div>
    </div>
  )
}
