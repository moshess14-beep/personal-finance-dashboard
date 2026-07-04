import { useState } from 'react'
import { Settings2, Plus, Pencil, Check, X, Eye, EyeOff, Trash2 } from 'lucide-react'
import { useFinanceStore } from '../../store/useFinanceStore'
import { useThemeStore } from '../../store/useThemeStore'
import { getCategoryColor } from '../../utils/categories'

// Shared across Assets/Liabilities/Income/Savings screens. `domain` selects
// which category list in the store to manage ('assets' | 'liabilities' |
// 'income' | 'savings'); `items` is that screen's current data, used only
// to count usage so a category still assigned to real items can't be
// deleted out from under them (hiding is offered instead).
export default function CategoryManager({ domain, items }) {
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [newLabel, setNewLabel] = useState('')

  const isDark = useThemeStore((s) => s.isDark)
  const categories = useFinanceStore((s) => s.categories[domain])
  const addCategory = useFinanceStore((s) => s.addCategory)
  const renameCategory = useFinanceStore((s) => s.renameCategory)
  const toggleCategoryHidden = useFinanceStore((s) => s.toggleCategoryHidden)
  const deleteCategory = useFinanceStore((s) => s.deleteCategory)

  const usageCount = (id) => items.filter((item) => item.category === id).length

  function startEdit(c) {
    setEditingId(c.id)
    setEditValue(c.label)
  }

  function saveEdit() {
    if (editValue.trim()) renameCategory(domain, editingId, editValue)
    setEditingId(null)
  }

  function handleAdd(e) {
    e.preventDefault()
    if (!newLabel.trim()) return
    addCategory(domain, newLabel)
    setNewLabel('')
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-1.5 px-4 py-3 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
      >
        <Settings2 className="size-4" />
        ניהול קטגוריות
      </button>

      {open && (
        <div className="border-t border-slate-200 p-4 dark:border-slate-800">
          <ul className="mb-3 space-y-1.5">
            {categories.map((c) => {
              const count = usageCount(c.id)
              const canDelete = count === 0 && categories.length > 1
              return (
                <li key={c.id} className="flex items-center gap-2 text-sm">
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: getCategoryColor(categories, c.id, isDark ? 'dark' : 'light') }}
                    aria-hidden="true"
                  />
                  {editingId === c.id ? (
                    <>
                      <input
                        autoFocus
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                        className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-950"
                      />
                      <button
                        type="button"
                        onClick={saveEdit}
                        aria-label="שמור שם קטגוריה"
                        className="inline-flex size-7 items-center justify-center rounded-lg text-gain hover:bg-gain/10"
                      >
                        <Check className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        aria-label="בטל עריכה"
                        className="inline-flex size-7 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <X className="size-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <span
                        className={`min-w-0 flex-1 truncate ${c.hidden ? 'text-slate-400 line-through dark:text-slate-600' : 'text-slate-700 dark:text-slate-300'}`}
                      >
                        {c.label}
                      </span>
                      {count > 0 && (
                        <span className="whitespace-nowrap text-xs text-slate-400 dark:text-slate-500">
                          {count} פריטים
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => startEdit(c)}
                        aria-label={`ערוך את הקטגוריה ${c.label}`}
                        className="inline-flex size-7 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleCategoryHidden(domain, c.id)}
                        aria-label={c.hidden ? `הצג את הקטגוריה ${c.label}` : `הסתר את הקטגוריה ${c.label}`}
                        title={c.hidden ? 'הצג ברשימת הבחירה' : 'הסתר מרשימת הבחירה'}
                        className="inline-flex size-7 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                      >
                        {c.hidden ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => canDelete && deleteCategory(domain, c.id)}
                        disabled={!canDelete}
                        aria-label={`מחק את הקטגוריה ${c.label}`}
                        title={count > 0 ? 'לא ניתן למחוק - יש פריטים בקטגוריה זו. אפשר להסתיר אותה במקום.' : 'מחק קטגוריה'}
                        className="inline-flex size-7 items-center justify-center rounded-lg text-slate-500 hover:bg-loss/10 hover:text-loss disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-500 dark:text-slate-400"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </>
                  )}
                </li>
              )
            })}
          </ul>

          <form onSubmit={handleAdd} className="flex gap-2">
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="שם קטגוריה חדשה"
              className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-950"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700"
            >
              <Plus className="size-3.5" />
              הוסף
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
