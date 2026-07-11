import { useState } from 'react'
import { Star, Trash2 } from 'lucide-react'
import Modal from './Modal'
import Cover from './Cover'
import useLibraryStore from '../store/useLibraryStore'
import { STATUSES, TYPE_LABEL, TYPE_BADGE_STYLE, CREATOR_LABEL } from '../data/constants'
import { PLATFORMS, PLATFORM_BY_ID } from '../data/platforms'

export default function ItemDetail({ item, onClose }) {
  const updateItem = useLibraryStore((s) => s.updateItem)
  const removeItem = useLibraryStore((s) => s.removeItem)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [note, setNote] = useState(item.myNote || '')

  const isScreen = item.type !== 'book'
  const availability = item.availability || []

  const togglePlatform = (platformId) => {
    const has = availability.some((a) => a.platform === platformId)
    updateItem(item.id, {
      availability: has
        ? availability.filter((a) => a.platform !== platformId)
        : [...availability, { platform: platformId, kind: 'מנוי', manual: true }],
    })
  }

  const metaParts = [
    item.year,
    item.type === 'book' && item.pages ? `${item.pages} עמ'` : null,
    item.type === 'movie' && item.runtimeMinutes ? `${item.runtimeMinutes} דק'` : null,
    item.type === 'series' && item.seasons ? `${item.seasons} עונות` : null,
  ].filter(Boolean)

  return (
    <Modal title="פרטי הפריט" onClose={onClose}>
      <div className="space-y-4">
        <div className="flex gap-3">
          <Cover item={item} className="w-24 aspect-[2/3] rounded-xl shrink-0" />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-black text-lg text-slate-800 leading-tight">{item.titleHe}</h3>
              <span className={`text-[10px] rounded-full px-1.5 py-0.5 font-bold ${TYPE_BADGE_STYLE[item.type]}`}>
                {TYPE_LABEL[item.type]}
              </span>
            </div>
            {item.titleOriginal && (
              <div className="text-xs text-slate-400 mt-0.5" dir="ltr">
                {item.titleOriginal}
              </div>
            )}
            {item.creator && (
              <div className="text-sm text-slate-600 mt-1">
                <span className="text-slate-400 text-xs">{CREATOR_LABEL[item.type]}: </span>
                {item.creator}
              </div>
            )}
            {metaParts.length > 0 && (
              <div className="text-xs text-slate-500 mt-1">{metaParts.join(' · ')}</div>
            )}
            {item.genres?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {item.genres.map((g) => (
                  <span key={g} className="text-[10px] bg-slate-100 text-slate-500 rounded-full px-2 py-0.5 font-semibold">
                    {g}
                  </span>
                ))}
              </div>
            )}
            {item.identification === 'auto' && (
              <div className="text-[10px] text-amber-600 bg-amber-50 rounded-full px-2 py-0.5 inline-block mt-2 font-bold">
                זוהה אוטומטית — כדאי לוודא שהפרטים נכונים
              </div>
            )}
          </div>
        </div>

        {item.summary && (
          <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 rounded-xl px-3 py-2">
            {item.summary}
          </p>
        )}

        <div>
          <div className="text-[11px] font-bold text-slate-400 mb-1.5">סטטוס</div>
          <div className="flex gap-1.5">
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => updateItem(item.id, { status: s })}
                className={`flex-1 text-xs rounded-xl py-2 border font-bold transition ${
                  item.status === s
                    ? 'bg-indigo-600 border-indigo-600 text-white'
                    : 'bg-white border-slate-200 text-slate-500'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="text-[11px] font-bold text-slate-400 mb-1.5">הדירוג שלי</div>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => updateItem(item.id, { myRating: item.myRating === n ? 0 : n })}
                aria-label={`דירוג ${n}`}
              >
                <Star
                  className={`w-7 h-7 ${
                    (item.myRating || 0) >= n
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-slate-200'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {isScreen && (
          <div>
            <div className="text-[11px] font-bold text-slate-400 mb-1.5">
              זמין לצפייה ב־ <span className="font-normal">(הקישו כדי לסמן/לבטל ידנית)</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {PLATFORMS.map((p) => {
                const entry = availability.find((a) => a.platform === p.id)
                return (
                  <button
                    key={p.id}
                    onClick={() => togglePlatform(p.id)}
                    className={`flex items-center gap-1.5 text-xs rounded-full px-3 py-1.5 border font-semibold transition ${
                      entry
                        ? 'bg-slate-800 border-slate-800 text-white'
                        : 'bg-white border-slate-200 text-slate-400'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                    {p.label}
                    {entry && entry.kind !== 'מנוי' && (
                      <span className="text-[10px] opacity-75">({entry.kind})</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <div>
          <div className="text-[11px] font-bold text-slate-400 mb-1">הערה אישית</div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onBlur={() => updateItem(item.id, { myNote: note })}
            rows={2}
            placeholder="מי המליץ? למה שווה? …"
            className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-indigo-400"
          />
        </div>

        <button
          onClick={() => {
            if (!confirmDelete) {
              setConfirmDelete(true)
              return
            }
            removeItem(item.id)
            onClose()
          }}
          className={`w-full flex items-center justify-center gap-1.5 text-sm font-bold rounded-2xl py-2.5 transition ${
            confirmDelete ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-500'
          }`}
        >
          <Trash2 className="w-4 h-4" />
          {confirmDelete ? 'בטוח? הקישו שוב למחיקה סופית' : 'מחיקה מהספרייה'}
        </button>
      </div>
    </Modal>
  )
}
