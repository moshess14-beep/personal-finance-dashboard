import { useState } from 'react'
import { X } from 'lucide-react'

// עריכת תגיות חופשיות: המשתמש מקליד ומוסיף, ולא בוחר מתוך רשימה סגורה מראש
export default function TagEditor({ label = 'תגיות', tags, onChange, placeholder = 'הוספת תגית…' }) {
  const [input, setInput] = useState('')

  const add = () => {
    const v = input.trim()
    if (v && !tags.includes(v)) onChange([...tags, v])
    setInput('')
  }

  return (
    <div>
      <div className="text-[11px] font-bold text-slate-400 mb-1">{label}</div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-1.5">
          {tags.map((t) => (
            <span
              key={t}
              className="flex items-center gap-1 text-xs bg-slate-100 text-slate-600 rounded-full px-2.5 py-1 font-semibold"
            >
              {t}
              <button onClick={() => onChange(tags.filter((x) => x !== t))} aria-label={`הסרת ${t}`}>
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              add()
            }
          }}
          placeholder={placeholder}
          className="flex-1 text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-teal-600"
        />
        <button
          onClick={add}
          type="button"
          className="bg-slate-100 text-slate-600 rounded-xl px-4 text-sm font-bold"
        >
          הוספה
        </button>
      </div>
    </div>
  )
}
