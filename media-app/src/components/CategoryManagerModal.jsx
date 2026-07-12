import { useState } from 'react'
import { Lock, Trash2, Plus, Check } from 'lucide-react'
import Modal from './Modal'
import useLibraryStore from '../store/useLibraryStore'
import { GRADIENT_CHOICES } from '../data/constants'

function EmojiField({ value, onChange }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value.slice(0, 2))}
      className="w-11 shrink-0 text-center text-lg border border-slate-200 rounded-xl py-1.5 focus:outline-teal-600"
    />
  )
}

function CategoryRow({ cat, itemCount, onUpdate, onDelete }) {
  const [label, setLabel] = useState(cat.label)
  const [emoji, setEmoji] = useState(cat.emoji)
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <div className="bg-slate-50 rounded-2xl p-2.5 space-y-2">
      <div className="flex items-center gap-2">
        <EmojiField value={emoji} onChange={(v) => { setEmoji(v); onUpdate({ emoji: v }) }} />
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onBlur={() => onUpdate({ label: label.trim() || cat.label })}
          className="flex-1 text-sm font-bold border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-teal-600"
        />
        {cat.builtin ? (
          <span title="קטגוריית ליבה — לא ניתנת למחיקה" className="p-2 text-slate-300">
            <Lock className="w-4 h-4" />
          </span>
        ) : (
          <button
            onClick={() => (confirmDelete ? onDelete() : setConfirmDelete(true))}
            className={`p-2 rounded-full ${confirmDelete ? 'bg-rose-600 text-white' : 'text-rose-400 hover:bg-rose-50'}`}
            aria-label="מחיקת קטגוריה"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
      {confirmDelete && (
        <div className="text-[11px] text-rose-600 font-semibold bg-rose-50 rounded-xl px-3 py-2">
          {itemCount > 0
            ? `הקטגוריה מכילה ${itemCount} פריטים — מחיקתה תמחק גם אותם. הקישו שוב על הפח לאישור, או לחצו מחוץ לשדה לביטול.`
            : 'הקישו שוב על הפח לאישור המחיקה.'}
        </div>
      )}
    </div>
  )
}

function NewCategoryForm({ onAdd, onCancel }) {
  const [label, setLabel] = useState('')
  const [emoji, setEmoji] = useState('🏷️')
  const [gradient, setGradient] = useState(GRADIENT_CHOICES[0])

  return (
    <div className="bg-slate-50 rounded-2xl p-3 space-y-2">
      <div className="flex items-center gap-2">
        <EmojiField value={emoji} onChange={setEmoji} />
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="שם הקטגוריה"
          autoFocus
          className="flex-1 text-sm font-bold border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-teal-600"
        />
      </div>
      <div className="flex gap-1.5">
        {GRADIENT_CHOICES.map((g) => (
          <button
            key={g}
            onClick={() => setGradient(g)}
            className={`w-7 h-7 rounded-full bg-gradient-to-br ${g} flex items-center justify-center ${
              gradient === g ? 'ring-2 ring-offset-1 ring-teal-600' : ''
            }`}
          >
            {gradient === g && <Check className="w-3.5 h-3.5 text-white" />}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => label.trim() && onAdd({ label: label.trim(), emoji, gradient })}
          disabled={!label.trim()}
          className="flex-1 bg-teal-700 disabled:bg-slate-300 text-white rounded-xl py-2 text-sm font-bold"
        >
          הוספה
        </button>
        <button
          onClick={onCancel}
          className="text-xs font-bold text-slate-500 bg-slate-100 rounded-xl py-2 px-4"
        >
          ביטול
        </button>
      </div>
    </div>
  )
}

export default function CategoryManagerModal({ onClose }) {
  const categories = useLibraryStore((s) => s.categories)
  const items = useLibraryStore((s) => s.items)
  const addCategory = useLibraryStore((s) => s.addCategory)
  const updateCategory = useLibraryStore((s) => s.updateCategory)
  const removeCategory = useLibraryStore((s) => s.removeCategory)
  const [adding, setAdding] = useState(false)

  const countFor = (cat) =>
    items.filter((it) => (cat.builtin ? cat.types.includes(it.type) : it.categoryId === cat.id)).length

  return (
    <Modal title="ניהול קטגוריות" onClose={onClose}>
      <div className="space-y-3">
        <p className="text-[11px] text-slate-400 leading-relaxed">
          אפשר לשנות שם ואימוג'י לכל קטגוריה. קטגוריות ליבה (עם 🔒) — קריאה, צפייה והופעות
          חיות — כוללות חיפוש וזיהוי אוטומטי ולכן לא ניתנות למחיקה; שאר הקטגוריות אפשר
          להוסיף, לערוך ולמחוק בחופשיות.
        </p>

        <div className="space-y-2">
          {categories.map((cat) => (
            <CategoryRow
              key={cat.id}
              cat={cat}
              itemCount={countFor(cat)}
              onUpdate={(patch) => updateCategory(cat.id, patch)}
              onDelete={() => removeCategory(cat.id, { deleteItems: true })}
            />
          ))}
        </div>

        {adding ? (
          <NewCategoryForm
            onAdd={(cat) => {
              addCategory(cat)
              setAdding(false)
            }}
            onCancel={() => setAdding(false)}
          />
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="w-full flex items-center justify-center gap-1.5 text-sm font-bold text-teal-700 bg-teal-50 rounded-2xl py-2.5"
          >
            <Plus className="w-4 h-4" />
            קטגוריה חדשה
          </button>
        )}
      </div>
    </Modal>
  )
}
