import { useState } from 'react'

const EMOJI = { book: '📖', movie: '🎬', series: '📺' }
const GRADIENT = {
  book: 'from-amber-200 to-orange-400',
  movie: 'from-indigo-300 to-violet-500',
  series: 'from-teal-300 to-cyan-500',
}

export default function Cover({ item, className = '', emojiSize = 'text-3xl' }) {
  const [broken, setBroken] = useState(false)

  if (item.coverUrl && !broken) {
    return (
      <img
        src={item.coverUrl}
        onError={() => setBroken(true)}
        className={`object-cover bg-slate-200 ${className}`}
        alt={item.titleHe}
      />
    )
  }
  return (
    <div
      className={`bg-gradient-to-br ${GRADIENT[item.type] || GRADIENT.movie} flex flex-col items-center justify-center gap-1 p-1 ${className}`}
    >
      <span className={emojiSize}>{EMOJI[item.type] || '🎬'}</span>
      <span className="text-[10px] font-bold text-white/95 text-center leading-tight line-clamp-2 drop-shadow">
        {item.titleHe}
      </span>
    </div>
  )
}
