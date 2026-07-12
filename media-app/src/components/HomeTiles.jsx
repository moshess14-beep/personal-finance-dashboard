import { ChevronLeft } from 'lucide-react'
import { CATEGORIES } from '../data/constants'

function Tile({ category, count, onClick, wide }) {
  return (
    <button
      onClick={onClick}
      className={`relative rounded-3xl bg-gradient-to-br ${category.gradient} text-white shadow-md active:scale-[0.98] transition overflow-hidden ${
        wide
          ? 'col-span-2 flex items-center justify-center gap-4 py-5'
          : 'aspect-square flex flex-col items-center justify-center gap-1'
      }`}
    >
      <span className={wide ? 'text-4xl drop-shadow' : 'text-4xl drop-shadow'}>{category.emoji}</span>
      <span className={wide ? 'text-right' : 'text-center'}>
        <span className="block text-xl font-black drop-shadow">{category.label}</span>
        <span className="block text-[11px] font-semibold text-white/80">{category.sub}</span>
      </span>
      <span className="text-[11px] font-bold bg-white/20 rounded-full px-2.5 py-0.5 mt-0.5">
        {count}
      </span>
      <ChevronLeft className="absolute bottom-3 start-3 w-5 h-5 text-white/60" />
    </button>
  )
}

// מסך הבית: חמש קטגוריות ההמלצות
export default function HomeTiles({ items, onOpen }) {
  const countFor = (cat) => items.filter((it) => cat.types.includes(it.type)).length
  return (
    <div className="grid grid-cols-2 gap-3 mt-5">
      {CATEGORIES.map((cat, i) => (
        <Tile
          key={cat.id}
          category={cat}
          count={countFor(cat)}
          onClick={() => onOpen(cat.id)}
          wide={i === CATEGORIES.length - 1 && CATEGORIES.length % 2 === 1}
        />
      ))}
    </div>
  )
}
