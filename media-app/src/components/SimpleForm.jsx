import { useState } from 'react'
import { Loader2, MapPin, Search } from 'lucide-react'
import { searchPlaceAddress, mapsSearchUrl } from '../services/places'
import {
  PLACE_TYPES,
  AUDIENCES,
  REGIONS,
  DISH_TYPES,
  KASHRUT,
  RECIPE_TAGS,
  PRODUCT_CATEGORIES,
  MUSIC_GENRES,
  SHOW_TYPES,
} from '../data/taxonomies'
import { TYPE_LABEL, CREATOR_LABEL } from '../data/constants'

function ToggleChips({ label, options, selected, onToggle, single }) {
  const isSelected = (opt) => (single ? selected === opt : (selected || []).includes(opt))
  return (
    <div>
      <div className="text-[11px] font-bold text-slate-400 mb-1">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onToggle(opt)}
            className={`text-xs rounded-full px-3 py-1.5 border font-semibold transition ${
              isSelected(opt)
                ? 'bg-teal-700 border-teal-700 text-white'
                : 'bg-white border-slate-200 text-slate-500'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', placeholder, dir }) {
  return (
    <div>
      <label className="text-[11px] font-bold text-slate-400">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        dir={dir}
        className="w-full mt-0.5 text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-teal-600"
      />
    </div>
  )
}

const HAS_ADDRESS = ['place', 'show']

// טופס הוספה לבילוי / מתכון / מוצר / אמן / הופעה — עם התמונה שהועלתה והצעות מהזיהוי
export default function SimpleForm({ type, init, imageUrl, titleSuggestions, onSave, busy }) {
  const [f, setF] = useState({
    title: init?.title || '',
    address: init?.address || '',
    region: init?.region || null,
    placeTypes: init?.placeTypes || [],
    audiences: init?.audiences || [],
    dishType: init?.dishType || null,
    kashrut: init?.kashrut || null,
    tags: init?.tags || [],
    price: init?.price || '',
    store: init?.store || '',
    buyUrl: init?.buyUrl || '',
    productCategory: init?.productCategory || null,
    genres: init?.genres || [],
    creator: init?.creator || '',
    showType: init?.showType || null,
    eventDate: init?.eventDate || '',
    eventTime: init?.eventTime || '',
    ticketUrl: init?.ticketUrl || '',
    note: '',
  })
  const [error, setError] = useState(null)
  const [addressResults, setAddressResults] = useState(null)
  const [searchingAddress, setSearchingAddress] = useState(false)

  const set = (key) => (e) => setF((s) => ({ ...s, [key]: e.target.value }))
  const toggleMulti = (key) => (opt) =>
    setF((s) => ({
      ...s,
      [key]: s[key].includes(opt) ? s[key].filter((o) => o !== opt) : [...s[key], opt],
    }))
  const toggleSingle = (key) => (opt) =>
    setF((s) => ({ ...s, [key]: s[key] === opt ? null : opt }))

  async function findAddress() {
    const q = (f.address || f.title).trim()
    if (!q) return
    setSearchingAddress(true)
    setAddressResults(null)
    try {
      const results = await searchPlaceAddress(q)
      setAddressResults(results.length ? results : [])
    } catch {
      setAddressResults([])
    }
    setSearchingAddress(false)
  }

  function save() {
    if (!f.title.trim()) {
      setError('חסר שם — זה השדה היחיד שחובה')
      return
    }
    setError(null)
    onSave({
      type,
      titleHe: f.title.trim(),
      address: f.address.trim(),
      mapsUrl:
        HAS_ADDRESS.includes(type) && f.title ? mapsSearchUrl(`${f.title} ${f.address}`.trim()) : '',
      region: f.region,
      placeTypes: f.placeTypes,
      audiences: f.audiences,
      dishType: f.dishType,
      kashrut: f.kashrut,
      tags: f.tags,
      price: parseFloat(String(f.price).replace(',', '.')) || null,
      store: f.store.trim(),
      buyUrl: f.buyUrl.trim(),
      productCategory: f.productCategory,
      genres: type === 'artist' ? f.genres : [],
      creator: type === 'show' ? f.creator.trim() : '',
      showType: f.showType,
      eventDate: f.eventDate,
      eventTime: f.eventTime,
      ticketUrl: f.ticketUrl.trim(),
      myNote: f.note.trim(),
      sourceText: init?.sourceText || '',
      status: 'רוצה',
      myRating: 0,
      identification: init?.fromAi ? 'auto' : 'manual',
      availability: [],
    })
  }

  const namePlaceholder = {
    place: 'למשל: חוף הבונים',
    recipe: 'למשל: פסטה ברוטב עגבניות',
    product: 'למשל: מחבת גריל',
    artist: 'למשל: נועה קירל',
    show: 'למשל: הופעה של עידן רייכל',
  }[type]

  return (
    <div className="space-y-3">
      {error && (
        <div className="bg-rose-50 text-rose-600 text-xs rounded-xl px-3 py-2 font-semibold">
          {error}
        </div>
      )}

      {imageUrl && (
        <img
          src={imageUrl}
          className="w-full max-h-40 object-contain rounded-xl bg-slate-100"
          alt="התמונה שהועלתה"
        />
      )}

      {titleSuggestions?.length > 0 && !f.title && (
        <div>
          <div className="text-[11px] font-bold text-slate-400 mb-1">
            מה השם? הקישו על שורה מהתמונה או הקלידו:
          </div>
          <div className="flex flex-wrap gap-1.5">
            {titleSuggestions.map((line) => (
              <button
                key={line}
                type="button"
                onClick={() => setF((s) => ({ ...s, title: line }))}
                className="text-xs rounded-full px-3 py-1.5 border bg-slate-50 border-slate-200 text-slate-600 font-semibold"
              >
                {line}
              </button>
            ))}
          </div>
        </div>
      )}

      <Field label={`שם ה${TYPE_LABEL[type]} *`} value={f.title} onChange={set('title')} placeholder={namePlaceholder} />

      {type === 'show' && (
        <div className="grid grid-cols-2 gap-2">
          <Field label="תאריך" value={f.eventDate} onChange={set('eventDate')} type="date" />
          <Field label="שעה (אופציונלי)" value={f.eventTime} onChange={set('eventTime')} type="time" />
        </div>
      )}

      {type === 'show' && (
        <Field label={CREATOR_LABEL.show} value={f.creator} onChange={set('creator')} placeholder="מי מופיע/ה?" />
      )}

      {HAS_ADDRESS.includes(type) && (
        <div>
          <label className="text-[11px] font-bold text-slate-400">
            {type === 'show' ? 'מקום ההופעה' : 'כתובת / אזור'}
          </label>
          <div className="flex gap-2 mt-0.5">
            <input
              value={f.address}
              onChange={set('address')}
              placeholder="אפשר להשאיר ריק ולחפש"
              className="flex-1 text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-teal-600"
            />
            <button
              type="button"
              onClick={findAddress}
              disabled={searchingAddress || (!f.address.trim() && !f.title.trim())}
              className="bg-emerald-600 disabled:bg-slate-300 text-white rounded-xl px-3 flex items-center gap-1 text-xs font-bold"
            >
              {searchingAddress ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Search className="w-3.5 h-3.5" />
              )}
              חיפוש
            </button>
          </div>
          {addressResults !== null && (
            <div className="mt-1.5 space-y-1">
              {addressResults.length === 0 ? (
                <div className="text-[11px] text-slate-400 font-semibold">
                  לא נמצאה כתובת — אפשר להקליד ידנית
                </div>
              ) : (
                addressResults.map((r, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setF((s) => ({ ...s, address: r.address }))
                      setAddressResults(null)
                    }}
                    className="w-full text-right text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl px-3 py-2 flex items-start gap-1.5"
                  >
                    <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{r.address}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {type === 'place' && (
        <>
          <ToggleChips label="סוג הבילוי" options={PLACE_TYPES} selected={f.placeTypes} onToggle={toggleMulti('placeTypes')} />
          <ToggleChips label="מתאים ל..." options={AUDIENCES} selected={f.audiences} onToggle={toggleMulti('audiences')} />
          <ToggleChips label="אזור" options={REGIONS} selected={f.region} onToggle={toggleSingle('region')} single />
        </>
      )}

      {type === 'recipe' && (
        <>
          <ToggleChips label="סוג המנה" options={DISH_TYPES} selected={f.dishType} onToggle={toggleSingle('dishType')} single />
          <ToggleChips label="כשרות" options={KASHRUT} selected={f.kashrut} onToggle={toggleSingle('kashrut')} single />
          <ToggleChips label="תגיות" options={RECIPE_TAGS} selected={f.tags} onToggle={toggleMulti('tags')} />
        </>
      )}

      {type === 'product' && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <Field label="מחיר (₪)" value={f.price} onChange={set('price')} type="number" />
            <Field label="חנות / אתר" value={f.store} onChange={set('store')} />
          </div>
          <Field
            label="קישור לקנייה (אופציונלי)"
            value={f.buyUrl}
            onChange={set('buyUrl')}
            placeholder="https://..."
            dir="ltr"
          />
          <ToggleChips label="קטגוריה" options={PRODUCT_CATEGORIES} selected={f.productCategory} onToggle={toggleSingle('productCategory')} single />
        </>
      )}

      {type === 'artist' && (
        <ToggleChips label="סגנון" options={MUSIC_GENRES} selected={f.genres} onToggle={toggleMulti('genres')} />
      )}

      {type === 'show' && (
        <>
          <ToggleChips label="סוג" options={SHOW_TYPES} selected={f.showType} onToggle={toggleSingle('showType')} single />
          <div className="grid grid-cols-2 gap-2">
            <Field label="מחיר כרטיס (₪, אופציונלי)" value={f.price} onChange={set('price')} type="number" />
            <Field
              label="קישור לכרטיסים (אופציונלי)"
              value={f.ticketUrl}
              onChange={set('ticketUrl')}
              placeholder="https://..."
              dir="ltr"
            />
          </div>
        </>
      )}

      <div>
        <label className="text-[11px] font-bold text-slate-400">הערה (מי המליץ? למה שווה?)</label>
        <textarea
          value={f.note}
          onChange={set('note')}
          rows={2}
          className="w-full mt-0.5 text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-teal-600"
        />
      </div>

      <button
        onClick={save}
        disabled={busy}
        className="w-full bg-teal-700 disabled:bg-slate-300 text-white font-bold rounded-2xl py-3 active:scale-[0.99] transition flex items-center justify-center gap-2"
      >
        {busy && <Loader2 className="w-4 h-4 animate-spin" />}
        שמירה בהמלצות
      </button>
    </div>
  )
}
