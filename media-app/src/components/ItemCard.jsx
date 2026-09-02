import { useState } from 'react'
import { Check, ThumbsUp, ThumbsDown, MoreHorizontal, Archive, ArchiveRestore, Trash2 } from 'lucide-react'
import Cover from './Cover'
import useLibraryStore from '../store/useLibraryStore'
import { deleteImage } from '../services/images'
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
    case 'music':
      if (item.kind) parts.push(item.kind)
      if (item.creator) parts.push(item.creator)
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
  later: 'bg-white/90 text-slate-600',
  past: 'bg-white/90 text-slate-400',
}

export default function ItemCard({ item, onOpen }) {
  const categories = useLibraryStore((s) => s.categories)
  const archiveItem = useLibraryStore((s) => s.archiveItem)
  const unarchiveItem = useLibraryStore((s) => s.unarchiveItem)
  const removeItem = useLibraryStore((s) => s.removeItem)
  const category = item.type === 'note' ? categories.find((c) => c.id === item.categoryId) : null
  const dateBadge = item.type === 'show' ? daysUntilLabel(item.eventDate) : null

  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const closeMenu = () => {
    setMenuOpen(false)
    setConfirmDelete(false)
  }

  const handleDelete = (e) => {
    e.stopPropagation()
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    deleteImage(item.imageId)
    ;(item.extraImageIds || []).forEach((id) => deleteImage(id))
    removeItem(item.id)
  }

  return (
    <div
      onClick={onOpen}
      className={`group relative w-full text-right bg-white rounded-2xl shadow-sm hover:shadow-md overflow-hidden active:scale-[0.98] transition cursor-pointer ${
        item.completed ? 'opacity-70' : ''
      }`}
    >
      <div className="relative">
        <Cover item={item} category={category} className="w-full aspect-[3/4]" />

        {/* כפתור פעולות מהיר על הכרטיס — העברה לארכיון/שחזור ומחיקה, בלי לפתוח את הפריט */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            setMenuOpen((o) => !o)
            setConfirmDelete(false)
          }}
          className="absolute top-2 start-2 w-8 h-8 rounded-full bg-white/90 backdrop-blur text-slate-700 shadow-md flex items-center justify-center active:scale-90 transition"
          aria-label="אפשרויות"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>

        {dateBadge && !item.completed && (
          <span
            className={`absolute top-2 end-2 text-[10px] rounded-full px-2 py-0.5 font-bold shadow-sm ${DATE_BADGE_STYLE[dateBadge.tone]}`}
          >
            {dateBadge.text}
          </span>
        )}

        {item.completed && (
          <span className="absolute bottom-2 end-2 flex items-center gap-1 bg-white/90 backdrop-blur rounded-full px-2 py-0.5 shadow-sm">
            <Check className="w-3 h-3 text-slate-500" />
            {item.liked === true && <ThumbsUp className="w-3 h-3 text-emerald-600 fill-emerald-100" />}
            {item.liked === false && <ThumbsDown className="w-3 h-3 text-rose-500 fill-rose-100" />}
          </span>
        )}

        {menuOpen && (
          <>
            {/* שכבת רקע לסגירת התפריט בלחיצה מחוץ לו */}
            <div
              className="fixed inset-0 z-10"
              onClick={(e) => {
                e.stopPropagation()
                closeMenu()
              }}
            />
            <div
              className="absolute top-11 start-2 z-20 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden min-w-36"
              onClick={(e) => e.stopPropagation()}
            >
              {item.archived ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    unarchiveItem(item.id)
                    closeMenu()
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 text-right"
                >
                  <ArchiveRestore className="w-4 h-4 text-teal-600" />
                  שחזור מהארכיון
                </button>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    archiveItem(item.id)
                    closeMenu()
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 text-right"
                >
                  <Archive className="w-4 h-4 text-slate-500" />
                  העברה לארכיון
                </button>
              )}
              <button
                onClick={handleDelete}
                className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm font-semibold text-right border-t border-slate-100 ${
                  confirmDelete ? 'bg-rose-600 text-white' : 'text-rose-500 hover:bg-rose-50'
                }`}
              >
                <Trash2 className="w-4 h-4" />
                {confirmDelete ? 'בטוח? הקישו שוב' : 'מחיקה'}
              </button>
            </div>
          </>
        )}
      </div>

      <div className="p-2.5">
        <div className="font-bold text-sm text-slate-800 leading-snug line-clamp-2">
          {item.titleHe}
        </div>
        <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
          {metaLine(item, category)}
        </div>

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

        {(item.availability || []).length > 0 && (
          <div className="flex items-center gap-0.5 mt-1.5">
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
          </div>
        )}
      </div>
    </div>
  )
}
