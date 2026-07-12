import { useState } from 'react'
import { useItemImage } from '../services/images'

const EMOJI = {
  book: '📖',
  movie: '🎬',
  series: '📺',
  place: '🌄',
  recipe: '🍳',
  product: '🛍️',
  artist: '🎤',
  show: '🎫',
}
const GRADIENT = {
  book: 'from-slate-600 to-slate-800',
  movie: 'from-blue-700 to-slate-900',
  series: 'from-blue-600 to-cyan-800',
  place: 'from-teal-500 to-emerald-800',
  recipe: 'from-cyan-600 to-slate-800',
  product: 'from-sky-600 to-blue-900',
  artist: 'from-emerald-500 to-teal-800',
  show: 'from-teal-600 to-slate-900',
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
