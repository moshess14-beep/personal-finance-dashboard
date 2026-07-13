import { useState } from 'react'
import { Loader2, MapPin, Search, Sparkles } from 'lucide-react'
import { searchPlaceAddress, mapsSearchUrl } from '../services/places'
import { aiWebEnrichNote } from '../services/ai'
import { MUSIC_GENRES, SHOW_TYPES } from '../data/taxonomies'
import { CREATOR_LABEL } from '../data/constants'
import TagEditor from './TagEditor'

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

// טופס הוספה: 'note' הוא הטופס הגנרי לכל קטגוריה רגילה (בילויים/מתכונים/מוצרים/שונות/...),
// 'artist' ו-'show' נשארים טפסים ייעודיים תחת קטגוריית הופעות חיות.
// עם התמונה שהועלתה והצעות שם מתוך הזיהוי.
export default function SimpleForm({ type, categoryId, categoryLabel, init, imageUrl, imageFile, canAi, aiKey, titleSuggestions, onSave, busy }) {
  const [f, setF] = useState({
    title: init?.title || '',
    kind: init?.kind || '',
    tags: init?.tags || [],
    address: init?.address || '',
    price: init?.price || '',
    store: init?.store || '',
    link: init?.link || '',
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
  const [enriching, setEnriching] = useState(false)
  const [enrichMsg, setEnrichMsg] = useState(null) // {ok, text}
  const [titleProposal, setTitleProposal] = useState(null)

  // "השלמה חכמה מהרשת": שולחים את התמונה + מה שכבר הוקלד ל-AI עם חיפוש גוגל,
  // והוא מזהה מותג/דגם/מחיר/חנות. ממלאים רק שדות ריקים; שם משופר מוצע ולא נכפה.
  async function smartFill() {
    setEnriching(true)
    setEnrichMsg(null)
    setError(null)
    try {
      const data = await aiWebEnrichNote(
        { title: f.title, kind: f.kind, store: f.store, sourceText: init?.sourceText || '' },
        imageFile || null,
        aiKey,
      )
      const found = []
      if (data.brand) found.push(`מותג: ${data.brand}`)
      if (data.model) found.push(`דגם: ${data.model}`)
      setF((s) => {
        const next = { ...s }
        if (!s.title.trim() && data.title) next.title = data.title
        if (!s.kind.trim() && data.kind) next.kind = data.kind
        if (!s.price && data.price != null) next.price = data.price
        if (!s.store.trim() && data.store) next.store = data.store
        if (!s.link.trim() && data.link) next.link = data.link
        return next
      })
      if (data.title && f.title.trim() && data.title.trim() !== f.title.trim())
        setTitleProposal(data.title.trim())
      setEnrichMsg({
        ok: true,
        text:
          (found.length ? `זוהה — ${found.join(' · ')}. ` : 'הפרטים הושלמו. ') +
          (data.confidence === 'low' ? 'רמת הוודאות נמוכה — כדאי לבדוק לפני שמירה.' : 'בדקו ותקנו אם צריך.'),
      })
    } catch (e) {
      setEnrichMsg({ ok: false, text: e.message || 'ההשלמה מהרשת נכשלה — נסו שוב' })
    }
    setEnriching(false)
  }

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
    const base = {
      titleHe: f.title.trim(),
      myNote: f.note.trim(),
      sourceText: init?.sourceText || '',
      identification: init?.fromAi ? 'auto' : 'manual',
      availability: [],
    }
    if (type === 'note') {
      onSave({
        ...base,
        type: 'note',
        categoryId,
        kind: f.kind.trim(),
        tags: f.tags,
        address: f.address.trim(),
        mapsUrl: f.title ? mapsSearchUrl(`${f.title} ${f.address}`.trim()) : '',
        price: parseFloat(String(f.price).replace(',', '.')) || null,
        store: f.store.trim(),
        link: f.link.trim(),
      })
      return
    }
    onSave({
      ...base,
      type,
      genres: type === 'artist' ? f.genres : [],
      creator: type === 'show' ? f.creator.trim() : '',
      showType: f.showType,
      eventDate: f.eventDate,
      eventTime: f.eventTime,
      price: parseFloat(String(f.price).replace(',', '.')) || null,
      ticketUrl: f.ticketUrl.trim(),
    })
  }

  const namePlaceholder =
    type === 'artist' ? 'למשל: נועה קירל' : type === 'show' ? 'למשל: הופעה של עידן רייכל' : 'שם ספציפי'

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

      <Field
        label={`שם ${type === 'note' ? categoryLabel || '' : ''} *`}
        value={f.title}
        onChange={set('title')}
        placeholder={namePlaceholder}
      />

      {type === 'note' && canAi && (
        <div>
          <button
            type="button"
            onClick={smartFill}
            disabled={enriching || (!f.title.trim() && !imageFile)}
            className="w-full flex items-center justify-center gap-1.5 text-xs font-bold text-teal-700 bg-teal-50 disabled:opacity-50 rounded-xl py-2.5"
          >
            {enriching ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            {enriching ? 'מחפש ברשת את המותג, הדגם והפרטים…' : 'השלמה חכמה מהרשת (מותג, דגם, מחיר…)'}
          </button>
          {titleProposal && (
            <button
              type="button"
              onClick={() => {
                setF((s) => ({ ...s, title: titleProposal }))
                setTitleProposal(null)
              }}
              className="mt-1.5 w-full text-right text-xs bg-amber-50 text-amber-800 rounded-xl px-3 py-2 font-semibold leading-relaxed"
            >
              נמצא שם מדויק יותר — הקישו כדי להחליף: <b>{titleProposal}</b>
            </button>
          )}
          {enrichMsg && (
            <div
              className={`mt-1.5 text-xs rounded-xl px-3 py-2 font-semibold leading-relaxed ${
                enrichMsg.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'
              }`}
            >
              {enrichMsg.text}
            </div>
          )}
        </div>
      )}

      {type === 'show' && (
        <div className="grid grid-cols-2 gap-2">
          <Field label="תאריך" value={f.eventDate} onChange={set('eventDate')} type="date" />
          <Field label="שעה (אופציונלי)" value={f.eventTime} onChange={set('eventTime')} type="time" />
        </div>
      )}

      {type === 'show' && (
        <Field label={CREATOR_LABEL.show} value={f.creator} onChange={set('creator')} placeholder="מי מופיע/ה?" />
      )}

      {type === 'note' && (
        <Field
          label="סוג (למשל: קוסמטיקה, טבע ומסלולים, עיקרית…)"
          value={f.kind}
          onChange={set('kind')}
          placeholder="אופציונלי — קטגוריה רחבה יותר"
        />
      )}

      {(type === 'note' || type === 'show') && (
        <div>
          <label className="text-[11px] font-bold text-slate-400">
            {type === 'show' ? 'מקום ההופעה' : 'כתובת (אופציונלי)'}
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

      {type === 'note' && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <Field label="מחיר (₪, אופציונלי)" value={f.price} onChange={set('price')} type="number" />
            <Field label="חנות / מקור" value={f.store} onChange={set('store')} />
          </div>
          <Field
            label="קישור (אופציונלי)"
            value={f.link}
            onChange={set('link')}
            placeholder="https://..."
            dir="ltr"
          />
          <TagEditor tags={f.tags} onChange={(tags) => setF((s) => ({ ...s, tags }))} />
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
