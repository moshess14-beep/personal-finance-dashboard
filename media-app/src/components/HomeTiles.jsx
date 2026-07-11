import { ChevronLeft } from 'lucide-react'

function Tile({ gradient, emoji, title, subtitle, count, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`relative aspect-square rounded-3xl bg-gradient-to-br ${gradient} text-white shadow-md active:scale-[0.98] transition flex flex-col items-center justify-center gap-1.5 overflow-hidden`}
    >
      <span className="text-5xl drop-shadow">{emoji}</span>
      <span className="text-2xl font-black drop-shadow">{title}</span>
      {subtitle && <span className="text-xs font-semibold text-white/80 -mt-1">{subtitle}</span>}
      <span className="text-[11px] font-bold bg-white/20 rounded-full px-2.5 py-0.5 mt-1">
        {count} פריטים
      </span>
      <ChevronLeft className="absolute bottom-3 start-3 w-5 h-5 text-white/60" />
    </button>
  )
}

// מסך הפתיחה: שתי קטגוריות בלבד — ספרים (ימין) וסרטים (שמאל)
export default function HomeTiles({ bookCount, screenCount, onOpen }) {
  return (
    <div className="grid grid-cols-2 gap-3 mt-5">
      <Tile
        gradient="from-amber-400 to-orange-500"
        emoji="📚"
        title="ספרים"
        count={bookCount}
        onClick={() => onOpen('books')}
      />
      <Tile
        gradient="from-indigo-500 to-violet-600"
        emoji="🎬"
        title="סרטים"
        subtitle="וגם סדרות"
        count={screenCount}
        onClick={() => onOpen('screen')}
      />
    </div>
  )
}
