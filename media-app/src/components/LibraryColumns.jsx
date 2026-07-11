import { BookOpen, Clapperboard } from 'lucide-react'
import ItemCard from './ItemCard'

function Column({ icon, title, items, emptyText, onOpen }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2 px-1">
        {icon}
        <h2 className="font-bold text-slate-700 text-sm">{title}</h2>
        <span className="text-xs text-slate-400 font-semibold">({items.length})</span>
      </div>
      {items.length === 0 ? (
        <div className="bg-white/60 border border-dashed border-slate-300 rounded-2xl p-4 text-center text-xs text-slate-400 leading-relaxed">
          {emptyText}
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} onOpen={() => onOpen(item.id)} />
          ))}
        </div>
      )}
    </div>
  )
}

// שתי עמודות: ספרים בימין (ראשונה ב-RTL), סרטים וסדרות בשמאל
export default function LibraryColumns({ items, platformFilterActive, onOpen }) {
  const books = items.filter((i) => i.type === 'book')
  const screen = items.filter((i) => i.type !== 'book')

  return (
    <div className="grid grid-cols-2 gap-3 mt-5">
      <Column
        icon={<BookOpen className="w-4 h-4 text-amber-600" />}
        title="ספרים"
        items={books}
        emptyText={
          platformFilterActive
            ? 'סינון לפי פלטפורמת סטרימינג חל על סרטים וסדרות בלבד'
            : 'אין ספרים להצגה — העלו תמונה או הקלידו שם'
        }
        onOpen={onOpen}
      />
      <Column
        icon={<Clapperboard className="w-4 h-4 text-indigo-600" />}
        title="סרטים וסדרות"
        items={screen}
        emptyText="אין סרטים או סדרות להצגה — העלו תמונה או הקלידו שם"
        onOpen={onOpen}
      />
    </div>
  )
}
