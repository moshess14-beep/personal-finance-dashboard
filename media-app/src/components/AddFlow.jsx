import { useEffect, useState } from 'react'
import { Search, Loader2, ChevronLeft, PencilLine } from 'lucide-react'
import Modal from './Modal'
import Cover from './Cover'
import useLibraryStore from '../store/useLibraryStore'
import { searchAll, enrichCandidate } from '../services/search'
import { extractTextFromImage, pickCandidateLines } from '../services/ocr'
import { TYPE_LABEL, TYPE_BADGE_STYLE, CREATOR_LABEL } from '../data/constants'
import { PLATFORM_BY_ID } from '../data/platforms'

const STEP_TITLE = {
  ocr: 'זיהוי מתוך תמונה',
  query: 'חיפוש לפי שם',
  results: 'האם התכוונת ל…?',
  confirm: 'בדיקת הפרטים לפני שמירה',
}

function candidateToForm(c, identification) {
  return {
    type: c.type && c.type !== 'unknown' ? c.type : 'movie',
    titleHe: c.titleHe || '',
    titleOriginal: c.titleOriginal || '',
    creator: c.creator || '',
    year: c.year || '',
    pages: c.pages || '',
    runtimeMinutes: c.runtimeMinutes || '',
    episodeRuntimeMinutes: c.episodeRuntimeMinutes || '',
    seasons: c.seasons || '',
    genresText: (c.genres || []).join(', '),
    summary: c.summary || '',
    coverUrl: c.coverUrl || null,
    availability: c.availability || [],
    identification,
    source: c.source || 'manual',
    externalId: c.externalId || null,
  }
}

// ניקוד התאמה בין שורת טקסט מהתמונה לשם תוצאה — לזיהוי אוטומטי
function titleScore(line, title) {
  const norm = (s) => (s || '').replace(/[^א-תa-z0-9\s]+/gi, ' ').replace(/\s+/g, ' ').trim().toLowerCase()
  const a = norm(line)
  const b = norm(title)
  if (!a || !b) return 0
  if (a === b) return 3
  if (a.includes(b) || b.includes(a)) return 2
  const ta = new Set(a.split(' '))
  const tb = b.split(' ')
  const overlap = tb.filter((t) => ta.has(t)).length
  if (overlap >= 2 || (tb.length > 0 && overlap / tb.length >= 0.6)) return 1
  return 0
}

export default function AddFlow({ mode, file, onClose, onSaved }) {
  const tmdbKey = useLibraryStore((s) => s.tmdbKey)
  const addItem = useLibraryStore((s) => s.addItem)

  const [step, setStep] = useState(mode === 'image' ? 'ocr' : 'query')
  const [imageUrl, setImageUrl] = useState(null)
  const [ocrProgress, setOcrProgress] = useState(0)
  const [ocrLines, setOcrLines] = useState(null)
  const [autoSearching, setAutoSearching] = useState(false)
  const [autoIdentified, setAutoIdentified] = useState(false)
  const [query, setQuery] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [results, setResults] = useState(null)
  const [form, setForm] = useState(null)

  useEffect(() => {
    if (mode !== 'image' || !file) return
    const url = URL.createObjectURL(file)
    setImageUrl(url)
    let cancelled = false
    extractTextFromImage(file, (p) => !cancelled && setOcrProgress(p))
      .then(async (text) => {
        if (cancelled) return
        const lines = pickCandidateLines(text)
        setOcrLines(lines)
        if (lines.length === 0) {
          setError('לא זוהה טקסט ברור בתמונה — אפשר להקליד את השם ידנית')
          return
        }
        // זיהוי אוטומטי: מחפשים ברשת את השורות המבטיחות בלי לשאול את המשתמש
        setAutoSearching(true)
        try {
          const found = await autoSearchLines(lines)
          if (cancelled) return
          if (found) {
            setResults(found)
            setAutoIdentified(true)
            setStep('results')
          } else {
            setError('לא זיהיתי לבד — בחרו את השורה שהיא שם היצירה, או תקנו ידנית')
          }
        } catch {
          if (!cancelled) setError('החיפוש ברשת נכשל — בחרו שורה או הקלידו את השם')
        }
        if (!cancelled) setAutoSearching(false)
      })
      .catch(
        () => !cancelled && setError('קריאת התמונה נכשלה — אפשר להקליד את השם ידנית'),
      )
    return () => {
      cancelled = true
      URL.revokeObjectURL(url)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, file])

  // מחפש כל שורה מבטיחה במקביל, מדרג לפי דמיון בין השורה לשם התוצאה
  async function autoSearchLines(lines) {
    const tried = lines.slice(0, 4)
    const settled = await Promise.allSettled(tried.map((l) => searchAll(l, tmdbKey)))
    const scored = []
    settled.forEach((s, i) => {
      if (s.status !== 'fulfilled') return
      for (const group of ['books', 'screen']) {
        for (const c of s.value[group]) {
          const score = titleScore(tried[i], c.titleHe)
          if (score > 0) scored.push({ c, score, group })
        }
      }
    })
    if (scored.length === 0) return null
    scored.sort((a, b) => b.score - a.score)
    const seen = new Set()
    const books = []
    const screen = []
    for (const { c, group } of scored) {
      const key = `${group}|${c.type}|${(c.titleHe || '').trim()}|${c.year || ''}`
      if (seen.has(key)) continue
      seen.add(key)
      ;(group === 'books' ? books : screen).push(c)
    }
    return { books: books.slice(0, 4), screen: screen.slice(0, 4) }
  }

  async function doSearch(q) {
    const text = (q ?? query).trim()
    if (!text) return
    setQuery(text)
    setBusy(true)
    setError(null)
    try {
      const r = await searchAll(text, tmdbKey)
      setResults(r)
      setStep('results')
      if (r.books.length === 0 && r.screen.length === 0)
        setError('לא נמצאו התאמות — נסו ניסוח אחר או הזנה ידנית')
    } catch {
      setError('החיפוש נכשל — בדקו את החיבור לרשת ונסו שוב')
    }
    setBusy(false)
  }

  async function chooseCandidate(c) {
    setBusy(true)
    let full = c
    try {
      full = await enrichCandidate(c, tmdbKey)
    } catch {
      // נמשיך עם הנתונים החלקיים מהחיפוש
    }
    setForm(candidateToForm(full, 'confirmed'))
    setStep('confirm')
    setBusy(false)
  }

  function manualEntry() {
    setForm(candidateToForm({ type: 'movie', titleHe: query }, 'manual'))
    setStep('confirm')
  }

  function save() {
    if (!form.titleHe.trim()) {
      setError('חסר שם — זה השדה היחיד שחובה למלא')
      return
    }
    addItem({
      type: form.type,
      titleHe: form.titleHe.trim(),
      titleOriginal: form.titleOriginal.trim(),
      creator: form.creator.trim(),
      year: parseInt(form.year) || null,
      pages: form.type === 'book' ? parseInt(form.pages) || null : null,
      runtimeMinutes: form.type === 'movie' ? parseInt(form.runtimeMinutes) || null : null,
      episodeRuntimeMinutes:
        form.type === 'series' ? parseInt(form.episodeRuntimeMinutes) || null : null,
      seasons: form.type === 'series' ? parseInt(form.seasons) || null : null,
      genres: form.genresText.split(',').map((g) => g.trim()).filter(Boolean),
      summary: form.summary,
      coverUrl: form.coverUrl,
      availability: form.availability,
      identification: form.identification,
      source: form.source,
      externalId: form.externalId,
      status: 'רוצה',
      myRating: 0,
      myNote: '',
    })
    onSaved()
  }

  const setF = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  return (
    <Modal title={STEP_TITLE[step]} onClose={onClose}>
      {error && (
        <div className="bg-rose-50 text-rose-600 text-xs rounded-xl px-3 py-2 mb-3 font-semibold">
          {error}
        </div>
      )}

      {step === 'ocr' && (
        <div className="space-y-3">
          {imageUrl && (
            <img
              src={imageUrl}
              className="w-full max-h-44 object-contain rounded-xl bg-slate-100"
              alt="התמונה שהועלתה"
            />
          )}
          {ocrLines === null ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-slate-500 font-semibold">
                <Loader2 className="w-4 h-4 animate-spin" />
                קורא את הטקסט מהתמונה… {Math.round(ocrProgress * 100)}%
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 transition-all"
                  style={{ width: `${ocrProgress * 100}%` }}
                />
              </div>
            </div>
          ) : autoSearching ? (
            <div className="flex items-center gap-2 text-sm text-slate-500 font-semibold">
              <Loader2 className="w-4 h-4 animate-spin" />
              מזהה אוטומטית את היצירה ומחפש ברשת…
            </div>
          ) : (
            <>
              {ocrLines.length > 0 && (
                <div>
                  <div className="text-xs font-bold text-slate-500 mb-1.5">
                    איזו שורה היא שם הספר / הסרט / הסדרה? הקישו עליה:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {ocrLines.map((line) => (
                      <button
                        key={line}
                        onClick={() => setQuery(line)}
                        className={`text-xs rounded-full px-3 py-1.5 border font-semibold ${
                          query === line
                            ? 'bg-indigo-600 border-indigo-600 text-white'
                            : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}
                      >
                        {line}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <SearchBox
                query={query}
                setQuery={setQuery}
                onSearch={() => doSearch()}
                busy={busy}
                placeholder="או הקלידו/תקנו את השם כאן"
              />
            </>
          )}
        </div>
      )}

      {step === 'query' && (
        <div className="space-y-2">
          <SearchBox
            query={query}
            setQuery={setQuery}
            onSearch={() => doSearch()}
            busy={busy}
            autoFocus
            placeholder="שם של ספר / סרט / סדרה…"
          />
          <p className="text-[11px] text-slate-400 leading-relaxed">
            מספיק שם בלבד — נזהה אם זה ספר, סרט או סדרה ונשלים את שאר הפרטים אוטומטית.
          </p>
        </div>
      )}

      {step === 'results' && results && (
        <div className="space-y-4">
          {autoIdentified && (
            <div className="bg-indigo-50 text-indigo-700 text-xs rounded-xl px-3 py-2 font-semibold">
              זיהיתי אוטומטית מתוך התמונה — בחרו את ההתאמה הנכונה:
            </div>
          )}
          {busy && (
            <div className="flex items-center gap-2 text-sm text-slate-500 font-semibold">
              <Loader2 className="w-4 h-4 animate-spin" /> טוען פרטים…
            </div>
          )}
          {results.books.length > 0 && (
            <CandidateGroup
              title="📖 ספרים"
              candidates={results.books}
              onPick={chooseCandidate}
              disabled={busy}
            />
          )}
          {results.screen.length > 0 && (
            <CandidateGroup
              title="🎬 סרטים וסדרות"
              candidates={results.screen}
              onPick={chooseCandidate}
              disabled={busy}
            />
          )}
          <div className="flex gap-2 pt-1">
            {mode === 'image' && ocrLines?.length > 0 && (
              <button
                onClick={() => {
                  setAutoIdentified(false)
                  setStep('ocr')
                }}
                className="flex-1 text-xs font-bold text-slate-500 bg-slate-100 rounded-xl py-2.5"
              >
                בחירה מהטקסט שזוהה
              </button>
            )}
            <button
              onClick={() => setStep('query')}
              className="flex-1 text-xs font-bold text-slate-500 bg-slate-100 rounded-xl py-2.5"
            >
              חיפוש אחר
            </button>
            <button
              onClick={manualEntry}
              className="flex-1 text-xs font-bold text-indigo-600 bg-indigo-50 rounded-xl py-2.5 flex items-center justify-center gap-1"
            >
              <PencilLine className="w-3.5 h-3.5" />
              אף אחת מהאפשרויות — הזנה ידנית
            </button>
          </div>
        </div>
      )}

      {step === 'confirm' && form && (
        <div className="space-y-3">
          <div className="flex gap-3">
            <Cover item={{ ...form, type: form.type }} className="w-20 aspect-[2/3] rounded-xl shrink-0" emojiSize="text-2xl" />
            <div className="flex-1 space-y-2">
              <div className="flex gap-1">
                {Object.entries(TYPE_LABEL).map(([value, label]) => (
                  <button
                    key={value}
                    onClick={() => setForm((f) => ({ ...f, type: value }))}
                    className={`text-xs rounded-full px-3 py-1 border font-semibold ${
                      form.type === value
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'bg-white border-slate-200 text-slate-500'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <Field label="שם *" value={form.titleHe} onChange={setF('titleHe')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Field label={CREATOR_LABEL[form.type]} value={form.creator} onChange={setF('creator')} />
            <Field label="שנה" value={form.year} onChange={setF('year')} type="number" />
            {form.type === 'book' && (
              <Field label="עמודים" value={form.pages} onChange={setF('pages')} type="number" />
            )}
            {form.type === 'movie' && (
              <Field label="אורך (דקות)" value={form.runtimeMinutes} onChange={setF('runtimeMinutes')} type="number" />
            )}
            {form.type === 'series' && (
              <Field label="עונות" value={form.seasons} onChange={setF('seasons')} type="number" />
            )}
            {form.type === 'series' && (
              <Field
                label="אורך פרק (דקות)"
                value={form.episodeRuntimeMinutes}
                onChange={setF('episodeRuntimeMinutes')}
                type="number"
              />
            )}
            <Field label="ז'אנרים (מופרדים בפסיק)" value={form.genresText} onChange={setF('genresText')} />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-400">תקציר</label>
            <textarea
              value={form.summary}
              onChange={setF('summary')}
              rows={3}
              className="w-full mt-0.5 text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-indigo-400"
            />
          </div>

          {form.availability.length > 0 && (
            <div className="bg-slate-50 rounded-xl px-3 py-2">
              <div className="text-[11px] font-bold text-slate-400 mb-1">זמין לצפייה ב־</div>
              <div className="flex flex-wrap gap-1.5">
                {form.availability.map((a, i) => {
                  const p = PLATFORM_BY_ID[a.platform]
                  return (
                    <span
                      key={`${a.platform}-${a.label || i}`}
                      className="flex items-center gap-1 text-xs bg-white border border-slate-200 rounded-full px-2 py-0.5 font-semibold text-slate-600"
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ background: p?.color || '#94a3b8' }}
                      />
                      {p?.label || a.label} · {a.kind}
                    </span>
                  )
                })}
              </div>
            </div>
          )}

          <button
            onClick={save}
            className="w-full bg-indigo-600 text-white font-bold rounded-2xl py-3 active:scale-[0.99] transition"
          >
            שמירה בספרייה
          </button>
        </div>
      )}
    </Modal>
  )
}

function SearchBox({ query, setQuery, onSearch, busy, autoFocus, placeholder }) {
  return (
    <div className="flex gap-2">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onSearch()}
        autoFocus={autoFocus}
        placeholder={placeholder}
        className="flex-1 text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-indigo-400"
      />
      <button
        onClick={onSearch}
        disabled={busy || !query.trim()}
        className="bg-indigo-600 disabled:bg-slate-300 text-white rounded-xl px-4 flex items-center gap-1.5 text-sm font-bold"
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        חיפוש
      </button>
    </div>
  )
}

function CandidateGroup({ title, candidates, onPick, disabled }) {
  return (
    <div>
      <div className="text-xs font-bold text-slate-500 mb-1.5">{title}</div>
      <div className="space-y-2">
        {candidates.map((c, i) => (
          <button
            key={`${c.source}-${c.externalId ?? i}`}
            onClick={() => onPick(c)}
            disabled={disabled}
            className="w-full flex items-center gap-3 text-right bg-slate-50 hover:bg-indigo-50 rounded-2xl p-2 transition disabled:opacity-50"
          >
            <Cover item={c} className="w-11 aspect-[2/3] rounded-lg shrink-0" emojiSize="text-lg" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-slate-800 truncate">{c.titleHe}</span>
                <span className={`text-[10px] rounded-full px-1.5 py-0.5 font-bold shrink-0 ${TYPE_BADGE_STYLE[c.type] || 'bg-slate-200 text-slate-600'}`}>
                  {TYPE_LABEL[c.type] || '?'}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 truncate">
                {[c.year, c.creator].filter(Boolean).join(' · ')}
              </div>
              {c.summary && (
                <div className="text-[11px] text-slate-400 line-clamp-2 leading-snug mt-0.5">
                  {c.summary}
                </div>
              )}
            </div>
            <ChevronLeft className="w-4 h-4 text-slate-300 shrink-0" />
          </button>
        ))}
      </div>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text' }) {
  return (
    <div>
      <label className="text-[11px] font-bold text-slate-400">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        className="w-full mt-0.5 text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-indigo-400"
      />
    </div>
  )
}
