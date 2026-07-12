import { useState } from 'react'
import { useItemImage } from '../services/images'

const EMOJI = {
  book: '📖',
  movie: '🎬',
  series: '📺',
  place: '🌄',
  recipe: '🍳',
  product: '🛍️',
}
const GRADIENT = {
  book: 'from-amber-200 to-orange-400',
  movie: 'from-indigo-300 to-violet-500',
  series: 'from-teal-300 to-cyan-500',
  place: 'from-emerald-300 to-teal-500',
  recipe: 'from-rose-300 to-pink-500',
  product: 'from-sky-300 to-blue-500',
}

export default function Cover({ item, className = '', emojiSize = 'text-3xl' }) {
  const [broken, setBroken] = useState(false)
  const storedUrl = useItemImage(item.imageId)
  const src = storedUrl || (!broken && item.coverUrl) || null

  if (src) {
    return (
      <img
        src={src}
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
