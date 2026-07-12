import { useState } from 'react'
import { Star, Trash2, RefreshCw, Loader2, MapPin, ExternalLink } from 'lucide-react'
import Modal from './Modal'
import Cover from './Cover'
import useLibraryStore from '../store/useLibraryStore'
import { fetchAvailability } from '../services/search'
import { useItemImage, deleteImage } from '../services/images'
import { mapsSearchUrl } from '../services/places'
import {
  STATUSES,
  TYPE_LABEL,
  TYPE_BADGE_STYLE,
  CREATOR_LABEL,
  statusLabel,
} from '../data/constants'
import { PLATFORMS, PLATFORM_BY_ID } from '../data/platforms'
import {
  PLACE_TYPES,
  AUDIENCES,
  REGIONS,
  DISH_TYPES,
  KASHRUT,
  RECIPE_TAGS,
  PRODUCT_CATEGORIES,
} from '../data/taxonomies'

function ToggleChips({ label, options, selected, onToggle, single }) {
  const isSelected = (opt) => (single ? selected === opt : (selected || []).includes(opt))
  return (
    <div>
      <div className="text-[11px] font-bold text-slate-400 mb-1.5">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onToggle(opt)}
            className={`text-xs rounded-full px-3 py-1.5 border font-semibold transition ${
              isSelected(opt)
                ? 'bg-indigo-600 border-indigo-600 text-white'
                : 'bg-white border-slate-200 text-slate-400'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function ItemDetail({ item, onClose }) {
  const updateItem = useLibraryStore((s) => s.updateItem)
  const removeItem = useLibraryStore((s) => s.removeItem)
  const tmdbKey = useLibraryStore((s) => s.tmdbKey)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [note, setNote] = useState(item.myNote || '')
  const [checking, setChecking] = useState(false)
  const [checkResult, setCheckResult] = useState(null)

  const isScreen = item.type === 'movie' || item.type === 'series'
  const availability = item.availability || []
  const storedImage = useItemImage(item.imageId)

  const toggleMulti = (key) => (opt) => {
    const current = item[key] || []
    updateItem(item.id, {
      [key]: current.includes(opt) ? current.filter((o) => o !== opt) : [...current, opt],
    })
  }
  const toggleSingle = (key) => (opt) =>
    updateItem(item.id, { [key]: item[key] === opt ? null : opt })

  async function checkAvailability() {
    setChecking(true)
    setCheckResult(null)
    try {
      const { availability: fresh, found } = await fetchAvailability(item, tmdbKey)
      const manual = availability.filter((a) => a.manual)
      const merged = [
        ...fresh.filter((f) => !manual.some((m) => m.platform === f.platform)),
        ...manual,
      ]
      updateItem(item.id, { availability: merged, availabilityCheckedAt: Date.now() })
      if (fresh.length > 0) setCheckResult('עודכן ✓')
      else if (found) setCheckResult('לא זמין כרגע בשירותי הסטרימינג בישראל')
      else setCheckResult('לא נמצאה יצירה תואמת — אפשר לסמן ידנית למטה')
    } catch {
      setCheckResult('לא הצלחתי להתחבר לשירות הזמינות כרגע — אפשר לנסות שוב או לסמן ידנית')
    }
    setChecking(false)
  }

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
    item.type === 'series' && item.episodeRuntimeMinutes
      ? `כ־${item.episodeRuntimeMinutes} דק' לפרק`
      : null,
    item.type === 'product' && item.price ? `₪${item.price}` : null,
    item.type === 'product' && item.store ? item.store : null,
  ].filter(Boolean)

  const mapsHref =
    item.type === 'place'
      ? item.mapsUrl || mapsSearchUrl(`${item.titleHe} ${item.address || ''}`.trim())
      : null

  return (
    <Modal title="פרטי ההמלצה" onClose={onClose}>
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
            {item.creator && CREATOR_LABEL[item.type] && (
              <div className="text-sm text-slate-600 mt-1">
                <span className="text-slate-400 text-xs">{CREATOR_LABEL[item.type]}: </span>
                {item.creator}
              </div>
            )}
            {metaParts.length > 0 && (
              <div className="text-xs text-slate-500 mt-1">{metaParts.join(' · ')}</div>
            )}
            {item.type === 'place' && item.address && (
              <div className="text-xs text-slate-500 mt-1 flex items-start gap-1">
                <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-600" />
                <span className="line-clamp-2">{item.address}</span>
              </div>
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

        {(item.type === 'place' || item.type === 'product') && (
          <div className="flex gap-2">
            {mapsHref && (
              <a
                href={mapsHref}
                target="_blank"
                rel="noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 text-sm font-bold text-white bg-emerald-600 rounded-2xl py-2.5"
              >
                <MapPin className="w-4 h-4" />
                פתיחה במפות
              </a>
            )}
            {item.type === 'product' && item.buyUrl && (
              <a
                href={item.buyUrl}
                target="_blank"
                rel="noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 text-sm font-bold text-white bg-sky-600 rounded-2xl py-2.5"
              >
                <ExternalLink className="w-4 h-4" />
                לקנייה
              </a>
            )}
          </div>
        )}

        {storedImage && (
          <img
            src={storedImage}
            className="w-full max-h-80 object-contain rounded-2xl bg-slate-100"
            alt={item.titleHe}
          />
        )}

        {item.summary && (
          <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 rounded-xl px-3 py-2">
            {item.summary}
          </p>
        )}

        {item.sourceText && (
          <details className="bg-slate-50 rounded-xl px-3 py-2">
            <summary className="text-[11px] font-bold text-slate-400 cursor-pointer">
              הטקסט שזוהה מהתמונה
            </summary>
            <p className="text-xs text-slate-500 leading-relaxed mt-1.5 whitespace-pre-wrap">
              {item.sourceText}
            </p>
          </details>
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
                {statusLabel(item.type, s)}
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
                    (item.myRating || 0) >= n ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {item.type === 'place' && (
          <>
            <ToggleChips label="סוג הבילוי" options={PLACE_TYPES} selected={item.placeTypes} onToggle={toggleMulti('placeTypes')} />
            <ToggleChips label="מתאים ל..." options={AUDIENCES} selected={item.audiences} onToggle={toggleMulti('audiences')} />
            <ToggleChips label="אזור" options={REGIONS} selected={item.region} onToggle={toggleSingle('region')} single />
          </>
        )}

        {item.type === 'recipe' && (
          <>
            <ToggleChips label="סוג המנה" options={DISH_TYPES} selected={item.dishType} onToggle={toggleSingle('dishType')} single />
            <ToggleChips label="כשרות" options={KASHRUT} selected={item.kashrut} onToggle={toggleSingle('kashrut')} single />
            <ToggleChips label="תגיות" options={RECIPE_TAGS} selected={item.tags} onToggle={toggleMulti('tags')} />
          </>
        )}

        {item.type === 'product' && (
          <>
            <ToggleChips label="קטגוריה" options={PRODUCT_CATEGORIES} selected={item.productCategory} onToggle={toggleSingle('productCategory')} single />
            <div className="grid grid-cols-2 gap-2">
              <EditableField
                label="מחיר (₪)"
                type="number"
                value={item.price ?? ''}
                onSave={(v) => updateItem(item.id, { price: parseFloat(v) || null })}
              />
              <EditableField
                label="חנות / אתר"
                value={item.store || ''}
                onSave={(v) => updateItem(item.id, { store: v.trim() })}
              />
            </div>
            <EditableField
              label="קישור לקנייה"
              value={item.buyUrl || ''}
              dir="ltr"
              placeholder="https://..."
              onSave={(v) => updateItem(item.id, { buyUrl: v.trim() })}
            />
          </>
        )}

        {isScreen && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="text-[11px] font-bold text-slate-400">
                זמין לצפייה ב־ <span className="font-normal">(הקישו כדי לסמן/לבטל ידנית)</span>
              </div>
              <button
                onClick={checkAvailability}
                disabled={checking}
                className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 bg-indigo-50 rounded-full px-2.5 py-1 disabled:opacity-50"
              >
                {checking ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <RefreshCw className="w-3 h-3" />
                )}
                בדיקת זמינות עכשיו
              </button>
            </div>
            {checkResult && (
              <div className="text-[11px] text-slate-500 font-semibold mb-1.5">{checkResult}</div>
            )}
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
              {availability
                .filter((a) => a.platform === 'other')
                .map((a, i) => (
                  <span
                    key={`other-${i}`}
                    className="flex items-center gap-1.5 text-xs rounded-full px-3 py-1.5 border border-slate-300 bg-slate-100 text-slate-600 font-semibold"
                  >
                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                    {a.label}
                    {a.kind !== 'מנוי' && <span className="text-[10px] opacity-75">({a.kind})</span>}
                  </span>
                ))}
            </div>
            {item.availabilityCheckedAt && (
              <div className="text-[10px] text-slate-400 mt-1.5">
                נבדק לאחרונה: {new Date(item.availabilityCheckedAt).toLocaleDateString('he-IL')}
              </div>
            )}
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
            deleteImage(item.imageId)
            removeItem(item.id)
            onClose()
          }}
          className={`w-full flex items-center justify-center gap-1.5 text-sm font-bold rounded-2xl py-2.5 transition ${
            confirmDelete ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-500'
          }`}
        >
          <Trash2 className="w-4 h-4" />
          {confirmDelete ? 'בטוח? הקישו שוב למחיקה סופית' : 'מחיקה מההמלצות'}
        </button>
      </div>
    </Modal>
  )
}

function EditableField({ label, value, onSave, type = 'text', dir, placeholder }) {
  const [v, setV] = useState(String(value))
  return (
    <div>
      <label className="text-[11px] font-bold text-slate-400">{label}</label>
      <input
        type={type}
        value={v}
        dir={dir}
        placeholder={placeholder}
        onChange={(e) => setV(e.target.value)}
        onBlur={() => onSave(v)}
        className="w-full mt-0.5 text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-indigo-400"
      />
    </div>
  )
}
