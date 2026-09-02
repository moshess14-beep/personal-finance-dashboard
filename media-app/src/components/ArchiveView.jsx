import { ArrowRight, Archive } from 'lucide-react'
import ItemCard from './ItemCard'

// מסך הארכיון: כל הפריטים שהועברו לארכיון, מקובצים תחת הקטגוריה המקורית שלהם.
// מכל כרטיס אפשר לשחזר (דרך תפריט ה-⋯) או לפתוח לצפייה מלאה.
export default function ArchiveView({ items, categories, onOpenItem, onClose }) {
  const groups = categories
    .map((cat) => ({
      cat,
      items: items.filter((it) =>
        cat.builtin ? cat.types.includes(it.type) : it.categoryId === cat.id,
      ),
    }))
    .filter((g) => g.items.length > 0)

  return (
    <div className="fixed inset-0 z-40 bg-slate-50 overflow-y-auto" dir="rtl">
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-lg mx-auto px-3 py-3 flex items-center gap-2">
          <button
            onClick={onClose}
            className="p-2 -ms-2 rounded-full text-slate-500 hover:bg-slate-100"
            aria-label="חזרה"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <Archive className="w-5 h-5 text-slate-600" />
          <h2 className="font-black text-lg text-slate-800">ארכיון</h2>
          <span className="text-sm text-slate-400 font-bold ms-auto">({items.length})</span>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-3 pb-10">
        {groups.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-8 text-center text-sm text-slate-400 leading-relaxed mt-6">
            אין פריטים בארכיון. אפשר להעביר פריט לארכיון דרך כפתור ה-⋯ שעל הכרטיס.
          </div>
        ) : (
          groups.map(({ cat, items: catItems }) => (
            <section key={cat.id} className="mt-5">
              <div className="flex items-center gap-1.5 px-1 mb-2">
                <span className="text-lg">{cat.emoji}</span>
                <h3 className="font-black text-base text-slate-800">{cat.label}</h3>
                <span className="text-xs text-slate-400 font-bold ms-auto">({catItems.length})</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {catItems.map((item) => (
                  <ItemCard key={item.id} item={item} onOpen={() => onOpenItem(item.id)} />
                ))}
              </div>
            </section>
          ))
        )}
      </main>
    </div>
  )
}
