import { Check, ThumbsUp, ThumbsDown } from 'lucide-react'
import Cover from './Cover'
import useLibraryStore from '../store/useLibraryStore'
import { PLATFORM_BY_ID } from '../data/platforms'
import { daysUntilLabel } from '../utils/dates'

function metaLine(item, category) {
  const parts = []
  switch (item.type) {
    case 'book':
      if (item.year) parts.push(item.year)
      if (item.pages) parts.push(`${item.pages} עמ'`)
      break
    case 'movie':
      if (item.year) parts.push(item.year)
      if (item.runtimeMinutes) parts.push(`${item.runtimeMinutes} דק'`)
      break
    case 'series':
      if (item.year) parts.push(item.year)
      if (item.seasons) parts.push(`${item.seasons} עונות`)
      if (item.episodeRuntimeMinutes) parts.push(`${item.episodeRuntimeMinutes} דק' לפרק`)
      break
    case 'artist':
      if (item.genres?.length) parts.push(item.genres[0])
      break
    case 'show':
      if (item.showType) parts.push(item.showType)
      if (item.creator) parts.push(item.creator)
      break
    case 'note':
      if (item.kind) parts.push(item.kind)
      else if (category) parts.push(category.label)
      if (item.price) parts.push(`₪${item.price}`)
      else if (item.address) parts.push(item.address)
      break
  }
  return parts.join(' · ')
}

function chips(item) {
  if (item.type === 'note') return item.tags || []
  return item.genres || []
}

const DATE_BADGE_STYLE = {
  today: 'bg-teal-700 text-white',
  soon: 'bg-emerald-100 text-emerald-800',
  later: 'bg-slate-100 text-slate-500',
  past: 'bg-slate-100 text-slate-400',
}

export default function ItemCard({ item, onOpen }) {
  const categories = useLibraryStore((s) => s.categories)
  const category = item.type === 'note' ? categories.find((c) => c.id === item.categoryId) : null
  const dateBadge = item.type === 'show' ? daysUntilLabel(item.eventDate) : null

  return (
    <button
      onClick={onOpen}
      className={`w-full text-right bg-white rounded-2xl shadow-sm overflow-hidden active:scale-[0.98] transition ${
        item.completed ? 'opacity-60 grayscale-[0.6]' : ''
      }`}
    >
      <Cover item={item} category={category} className="w-full aspect-[2/3]" />
      <div className="p-2">
        <div className="font-bold text-sm text-slate-800 leading-snug line-clamp-2">
          {item.titleHe}
        </div>
        <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
          {metaLine(item, category)}
        </div>

        {dateBadge && !item.completed && (
          <span
            className={`inline-block text-[10px] rounded-full px-1.5 py-0.5 font-bold mt-1 ${DATE_BADGE_STYLE[dateBadge.tone]}`}
          >
            {dateBadge.text}
          </span>
        )}

        {chips(item).length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {chips(item)
              .slice(0, 2)
              .map((g) => (
                <span
                  key={g}
                  className="text-[10px] bg-slate-100 text-slate-500 rounded-full px-1.5 py-0.5"
                >
                  {g}
                </span>
              ))}
          </div>
        )}

        <div className="flex items-center gap-1 mt-1.5 min-h-4">
          {item.completed && (
            <span className="flex items-center gap-0.5 text-[10px] rounded-full px-1.5 py-0.5 font-semibold bg-slate-100 text-slate-500">
              <Check className="w-3 h-3" />
              בוצע
            </span>
          )}
          {item.completed && item.liked === true && (
            <ThumbsUp className="w-3.5 h-3.5 text-emerald-600 fill-emerald-100" />
          )}
          {item.completed && item.liked === false && (
            <ThumbsDown className="w-3.5 h-3.5 text-rose-500 fill-rose-100" />
          )}
          <span className="ms-auto flex items-center gap-0.5">
            {(item.availability || []).slice(0, 4).map((a, i) => {
              const p = PLATFORM_BY_ID[a.platform]
              return (
                <span
                  key={`${a.platform}-${a.label || i}`}
                  title={`${p?.label || a.label || ''} (${a.kind})`}
                  className="w-2.5 h-2.5 rounded-full border border-white shadow-sm"
                  style={{ background: p?.color || '#94a3b8' }}
                />
              )
            })}
          </span>
        </div>
      </div>
    </button>
  )
}
