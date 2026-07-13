import { useState } from 'react'
import { useItemImage } from '../services/images'

const EMOJI = {
  book: '📖',
  movie: '🎬',
  series: '📺',
  artist: '🎤',
  show: '🎫',
  music: '🎧',
  note: '🏷️',
}
const GRADIENT = {
  book: 'from-slate-600 to-slate-800',
  movie: 'from-blue-700 to-slate-900',
  series: 'from-blue-600 to-cyan-800',
  artist: 'from-emerald-500 to-teal-800',
  show: 'from-teal-600 to-slate-900',
  music: 'from-indigo-600 to-slate-900',
  note: 'from-slate-600 to-slate-800',
}

// category (אופציונלי) — עבור פריטים מסוג 'note' משתמשים באימוג'י/גוון של הקטגוריה שלהם
export default function Cover({ item, category, className = '', emojiSize = 'text-3xl' }) {
  const [broken, setBroken] = useState(false)
  const storedUrl = useItemImage(item.imageId)
  const src = storedUrl || (!broken && item.coverUrl) || null

  const emoji = (item.type === 'note' && category?.emoji) || EMOJI[item.type] || '🎬'
  const gradient = (item.type === 'note' && category?.gradient) || GRADIENT[item.type] || GRADIENT.movie

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
      className={`bg-gradient-to-br ${gradient} flex flex-col items-center justify-center gap-1 p-1 ${className}`}
    >
      <span className={emojiSize}>{emoji}</span>
      <span className="text-[10px] font-bold text-white/95 text-center leading-tight line-clamp-2 drop-shadow">
        {item.titleHe}
      </span>
    </div>
  )
}
