import { ArrowRight } from 'lucide-react'
import ItemCard from './ItemCard'
import { CATEGORY_BY_ID } from '../data/constants'

export default function CategoryView({ view, items, totalCount, onBack, onOpenItem }) {
  const category = CATEGORY_BY_ID[view]

  return (
    <div className="mt-4">
      <div className="flex items-center gap-1.5 px-1">
        <button
          onClick={onBack}
          className="p-2 -ms-2 rounded-full text-slate-500 hover:bg-slate-200"
          aria-label="חזרה למסך הראשי"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
        <span className="text-lg">{category.emoji}</span>
        <h2 className="font-black text-lg text-slate-800">{category.label}</h2>
        <span className="text-xs text-slate-400 font-semibold">{category.sub}</span>
        <span className="text-sm text-slate-400 font-bold ms-auto">({items.length})</span>
      </div>

      {items.length === 0 ? (
        <div className="bg-white/60 border border-dashed border-slate-300 rounded-2xl p-6 text-center text-sm text-slate-400 leading-relaxed mt-3">
          {totalCount === 0
            ? 'אין עדיין פריטים בקטגוריה — הוסיפו עם כפתור ה-+ או העלו תמונה מהמסך הראשי'
            : 'אין פריטים שמתאימים לסינון הנוכחי'}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 mt-3">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} onOpen={() => onOpenItem(item.id)} />
          ))}
        </div>
      )}
    </div>
  )
}
