import { Star } from 'lucide-react'
import Cover from './Cover'
import { STATUS_STYLE } from '../data/constants'
import { PLATFORM_BY_ID } from '../data/platforms'

function metaLine(item) {
  const parts = []
  if (item.year) parts.push(item.year)
  if (item.type === 'book' && item.pages) parts.push(`${item.pages} עמ'`)
  if (item.type === 'movie' && item.runtimeMinutes) parts.push(`${item.runtimeMinutes} דק'`)
  if (item.type === 'series' && item.seasons) parts.push(`${item.seasons} עונות`)
  return parts.join(' · ')
}

export default function ItemCard({ item, onOpen }) {
  return (
    <button
      onClick={onOpen}
      className="w-full text-right bg-white rounded-2xl shadow-sm overflow-hidden active:scale-[0.98] transition"
    >
      <Cover item={item} className="w-full aspect-[2/3]" />
      <div className="p-2">
        <div className="font-bold text-sm text-slate-800 leading-snug line-clamp-2">
          {item.titleHe}
        </div>
        <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{metaLine(item)}</div>

        {item.genres?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {item.genres.slice(0, 2).map((g) => (
              <span key={g} className="text-[10px] bg-slate-100 text-slate-500 rounded-full px-1.5 py-0.5">
                {g}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-1 mt-1.5 min-h-4">
          <span className={`text-[10px] rounded-full px-1.5 py-0.5 font-semibold ${STATUS_STYLE[item.status] || STATUS_STYLE['רוצה']}`}>
            {item.status || 'רוצה'}
          </span>
          {item.myRating > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] text-amber-500 font-bold">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              {item.myRating}
            </span>
          )}
          <span className="ms-auto flex items-center gap-0.5">
            {(item.availability || []).slice(0, 4).map((a) => {
              const p = PLATFORM_BY_ID[a.platform]
              if (!p) return null
              return (
                <span
                  key={a.platform}
                  title={`${p.label} (${a.kind})`}
                  className="w-2.5 h-2.5 rounded-full border border-white shadow-sm"
                  style={{ background: p.color }}
                />
              )
            })}
          </span>
        </div>
      </div>
    </button>
  )
}
