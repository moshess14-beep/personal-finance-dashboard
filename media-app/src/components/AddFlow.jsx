import { useEffect, useRef, useState } from 'react'
import { Search, Loader2, ChevronLeft, PencilLine, Sparkles } from 'lucide-react'
import Modal from './Modal'
import Cover from './Cover'
import SimpleForm from './SimpleForm'
import useLibraryStore from '../store/useLibraryStore'
import { searchAll, enrichCandidate } from '../services/search'
import { searchMusic, fetchLinkInfo, isListenLink, extractUrl, guessKindFromLink } from '../services/music'
import { extractTextFromImage, pickCandidateLines } from '../services/ocr'
import { analyzeImage, aiCompleteDetails, aiClassifyLink } from '../services/ai'
import { saveImage, resizeImage } from '../services/images'
import { TYPE_LABEL, TYPE_BADGE_STYLE, CREATOR_LABEL } from '../data/constants'
import { PLATFORM_BY_ID } from '../data/platforms'
import { DEMO } from '../services/env'

const STEP_TITLE = {
  analyze: 'מזהה את התמונה',
  ocr: 'זיהוי מתוך תמונה',
  query: 'חיפוש לפי שם',
  results: 'האם התכוונת ל…?',
  confirm: 'בדיקת הפרטים לפני שמירה',
  simple: 'פרטי ההמלצה',
  liveChoice: 'אמן או הופעה?',
  categoryChoice: 'לאיזו קטגוריה?',
  musicQuery: 'חיפוש שיר, אמן או פודקאסט',
  musicConfirm: 'פרטי ההאזנה',
  linkInput: 'הוספה מקישור',
  linkAnalyze: 'מזהה את הקישור',
}

const MUSIC_KINDS = ['שיר', 'אלבום', 'אמן', 'פודקאסט']

// מיפוי סיווג גס שה-AI מחזיר לקטגוריות ברירת המחדל, לפי מזהה (עמיד לשינוי שם התווית)
const GENERIC_SEED_MAP = { place: 'places', recipe: 'recipes', product: 'products', misc: 'misc' }
const LIVE_TYPES = ['artist', 'show']

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
  const norm = (s) =>
    (s || '').replace(/[^א-תa-z0-9\s]+/gi, ' ').replace(/\s+/g, ' ').trim().toLowerCase()
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

export default function AddFlow({ mode, file, category = null, sharedText = '', onClose, onSaved }) {
  const tmdbKey = useLibraryStore((s) => s.tmdbKey)
  const aiKey = useLibraryStore((s) => s.aiKey)
  const authUser = useLibraryStore((s) => s.authUser)
  const addItem = useLibraryStore((s) => s.addItem)
  const categories = useLibraryStore((s) => s.categories)

  // הזיהוי החכם זמין אם יש מפתח פרטי, או שמחוברים לחשבון (ואז הוא רץ דרך הפרוקסי המובנה)
  const canAi = DEMO || !!aiKey || !!authUser

  const forcedCategory = category ? categories.find((c) => c.id === category) : null
  const forcedGeneric = forcedCategory && !forcedCategory.builtin ? forcedCategory : null
  const forcedLive = forcedCategory?.id === 'live'
  const forcedMusic = !!forcedCategory?.builtin && (forcedCategory.types || []).includes('music')

  const [step, setStep] = useState(() => {
    if (mode === 'share') return 'analyze' // מוחלף מיד ב-useEffect לפי תוכן השיתוף
    if (mode === 'link') return 'linkInput'
    if (forcedMusic) return 'musicQuery' // האזנה — חיפוש ייעודי (גם לתמונה: השם מוקלד והתמונה נשמרת)
    if (mode === 'image') return canAi ? 'analyze' : 'ocr'
    if (forcedGeneric) return 'simple'
    if (forcedLive) return 'liveChoice'
    if (forcedCategory) return 'query' // ספרים/צפייה — לחיפוש ישיר
    return 'categoryChoice' // נפתח מהמסך הראשי, בלי הקשר — קודם בוחרים קטגוריה
  })
  const [imageUrl, setImageUrl] = useState(null)
  const [ocrProgress, setOcrProgress] = useState(0)
  const [ocrLines, setOcrLines] = useState(null)
  const [ocrText, setOcrText] = useState('')
  const [aiInfo, setAiInfo] = useState(null)
  const [autoSearching, setAutoSearching] = useState(false)
  const [autoIdentified, setAutoIdentified] = useState(false)
  const [query, setQuery] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [results, setResults] = useState(null)
  const [form, setForm] = useState(null)
  const [simple, setSimple] = useState(
    forcedGeneric ? { type: 'note', categoryId: forcedGeneric.id, categoryLabel: forcedGeneric.label, init: {} } : null,
  )
  const [musicForm, setMusicForm] = useState(null) // {title, creator, kind, coverUrl, link, loadingLink}
  const [musicResults, setMusicResults] = useState(null)
  const [musicSearching, setMusicSearching] = useState(false)
  const musicSeqRef = useRef(0)
  const [linkInput, setLinkInput] = useState('')
  const [pastedLink, setPastedLink] = useState('') // נשמר עם הפריט כשמנתבים לקטגוריה כללית

  // קישור/טקסט ששותפו לאפליקציה מבחוץ: קישור האזנה (יוטיוב/ספוטיפיי/אפל מיוזיק)
  // נקלט ישר לקטגוריית ההאזנה עם שליפת השם אוטומטית; כל טקסט אחר נכנס כחיפוש שם.
  useEffect(() => {
    if (mode !== 'share') return
    const url = extractUrl(sharedText)
    if (url && isListenLink(url)) {
      setMusicForm({
        title: '',
        creator: '',
        kind: guessKindFromLink(url),
        coverUrl: null,
        link: url,
        loadingLink: true,
      })
      setStep('musicConfirm')
      fetchLinkInfo(url).then((info) => {
        setMusicForm((f) =>
          f && {
            ...f,
            loadingLink: false,
            title: f.title || info?.title || '',
            creator: f.creator || info?.creator || '',
            coverUrl: f.coverUrl || info?.coverUrl || null,
          },
        )
      })
      return
    }
    // קישור שאינו האזנה (מוצר/ספר/מתכון/כתבה) — מנתבים לזיהוי הקישור המלא
    if (url) {
      analyzeLink(url)
      return
    }
    // טקסט חופשי — פותחים חיפוש שם עם הטקסט מוכן
    setQuery((sharedText || '').trim())
    setStep('query')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // זיהוי קישור שהודבק/שותף: האזנה נקלטת בלי AI; כל השאר מסווג עם AI (חיפוש גוגל)
  // ומנותב לקטגוריה המתאימה עם הפרטים והקישור. בלי AI — בחירת קטגוריה ידנית.
  async function analyzeLink(rawUrl) {
    const url = (rawUrl || '').trim()
    if (!url) return
    if (isListenLink(url)) {
      setMusicForm({
        title: '',
        creator: '',
        kind: guessKindFromLink(url),
        coverUrl: null,
        link: url,
        loadingLink: true,
      })
      setStep('musicConfirm')
      fetchLinkInfo(url).then((info) => {
        setMusicForm((f) =>
          f && {
            ...f,
            loadingLink: false,
            title: f.title || info?.title || '',
            creator: f.creator || info?.creator || '',
            coverUrl: f.coverUrl || info?.coverUrl || null,
          },
        )
      })
      return
    }
    setPastedLink(url)
    if (!canAi) {
      setQuery(slugTitle(url))
      setStep('categoryChoice')
      return
    }
    setStep('linkAnalyze')
    try {
      const genericCats = categories.filter((c) => !c.builtin).map((c) => ({ id: c.id, label: c.label }))
      const info = await aiClassifyLink(url, aiKey, genericCats)
      setAiInfo(info)
      const title = (info.title || '').trim()
      const cat = info.category
      if (cat === 'music' && title) {
        setMusicForm({
          title,
          creator: info.creator || '',
          kind: MUSIC_KINDS.includes(info.kind) ? info.kind : 'שיר',
          coverUrl: null,
          link: url,
        })
        setStep('musicConfirm')
        return
      }
      if (['book', 'movie', 'series'].includes(cat) && title) {
        setQuery(title)
        setAutoIdentified(true)
        doSearch(title, info.altTitle)
        return
      }
      const target = categories.find(
        (c) => !c.builtin && (c.id === cat || c.id === GENERIC_SEED_MAP[cat]),
      )
      if (target && title) {
        setSimple({
          type: 'note',
          categoryId: target.id,
          categoryLabel: target.label,
          init: {
            title,
            kind: info.kind || '',
            price: info.price || '',
            store: info.store || '',
            address: info.address || '',
            link: url,
            sourceText: '',
            fromAi: true,
          },
        })
        setStep('simple')
        return
      }
      // לא זוהה — בחירה ידנית, עם מה שכן נמצא
      setQuery(title)
      setStep('categoryChoice')
    } catch (e) {
      setError(`זיהוי הקישור נכשל: ${e.message || 'שגיאה'} — בחרו קטגוריה ידנית`)
      setQuery(slugTitle(url))
      setStep('categoryChoice')
    }
  }

  // חיפוש האזנה תוך כדי הקלדה (iTunes — חינמי, בלי מפתח)
  useEffect(() => {
    if (step !== 'musicQuery') return
    const text = query.trim()
    if (text.length < 2) {
      setMusicResults(null)
      setMusicSearching(false)
      return
    }
    const seq = ++musicSeqRef.current
    setMusicSearching(true)
    const timer = setTimeout(async () => {
      try {
        const results = await searchMusic(text)
        if (musicSeqRef.current !== seq) return
        setMusicResults(results)
      } catch {
        if (musicSeqRef.current === seq) setMusicResults([])
      }
      if (musicSeqRef.current === seq) setMusicSearching(false)
    }, 450)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, step])

  useEffect(() => {
    if (mode !== 'image' || !file) return
    const url = URL.createObjectURL(file)
    setImageUrl(url)
    // בקטגוריית האזנה אין צנרת זיהוי — המשתמש מחפש/מקליד את השם והתמונה נשמרת עם הפריט
    if (forcedMusic) return () => URL.revokeObjectURL(url)
    let cancelled = false

    async function pipeline() {
      // שלב 1: ניתוח עם AI (מפתח פרטי או פרוקסי מחשבון מחובר) — מזהה קטגוריה ופרטים בבת אחת
      let aiFailure = null
      if (canAi) {
        setStep('analyze')
        try {
          const genericCats = categories.filter((c) => !c.builtin).map((c) => ({ id: c.id, label: c.label }))
          const info = await analyzeImage(file, aiKey, genericCats)
          if (cancelled) return
          setAiInfo(info)
          if (routeAnalysis(info)) return
        } catch (e) {
          aiFailure = e
        }
        if (cancelled) return
      }
      // שלב 2: OCR מקומי (נופלים אליו גם אם ה-AI נכשל, וגם אם לא זיהה קטגוריה ברורה)
      let aiNote = null
      if (aiFailure) {
        const detail = aiFailure.detail ? ` (${aiFailure.detail})` : ''
        aiNote = `זיהוי ה-AI נכשל: ${aiFailure.message || 'שגיאה לא ידועה'}${detail}.`
        setError(`${aiNote} ממשיך בקריאת טקסט בסיסית…`)
      }
      await ocrPipeline(cancelled ? () => true : () => cancelled, aiNote)
    }

    function routeAnalysis(info) {
      const title = (info.title || '').trim()
      const cat = info.category
      // אם נפתח מתוך קטגוריה גנרית קבועה — תמיד לשם
      if (forcedGeneric) {
        openGenericWithInfo(forcedGeneric, info, title)
        return true
      }
      // ה-AI זיהה תוכן להאזנה (שיר/אלבום/פודקאסט, למשל צילום מסך מספוטיפיי)
      if (cat === 'music' && title) {
        setMusicForm({
          title,
          creator: info.creator || '',
          kind: 'שיר',
          coverUrl: null,
          link: '',
        })
        setStep('musicConfirm')
        return true
      }
      // ה-AI זיהה בבירור אמן או הופעה — פותחים ישר, בלי לשאול
      if (LIVE_TYPES.includes(cat) && title) {
        openLiveWithInfo(cat, info, title)
        return true
      }
      // נפתח מתוך קטגוריית הופעות חיות אבל ה-AI לא הכריע בין אמן להופעה
      if (forcedLive) {
        setStep('liveChoice')
        return true
      }
      if (['book', 'movie', 'series'].includes(cat) && title) {
        setQuery(title)
        setAutoIdentified(true)
        doSearch(title, info.altTitle)
        return true
      }
      // ה-AI מחזיר עכשיו את המזהה המדויק של הקטגוריה הכללית (דינמי, כולל קטגוריות שהמשתמש הוסיף/שינה שם) —
      // עם fallback לשמות הישנים הקבועים למקרה של תשובה ממטמון/מודל ישן.
      const seedId = GENERIC_SEED_MAP[cat]
      const target = categories.find((c) => !c.builtin && (c.id === cat || c.id === seedId))
      if (target && title) {
        openGenericWithInfo(target, info, title)
        return true
      }
      return false // unknown, או שהקטגוריה שזוהתה נמחקה — ניפול ל-OCR/בחירה ידנית
    }

    function openLiveWithInfo(type, info, title) {
      setSimple({ type, init: { title: title || '', sourceText: info?.rawText || '', fromAi: !!info } })
      setStep('simple')
    }

    function openGenericWithInfo(cat, info, title) {
      setSimple({
        type: 'note',
        categoryId: cat.id,
        categoryLabel: cat.label,
        init: {
          title: title || '',
          address: info?.address || '',
          price: info?.price || '',
          store: info?.store || '',
          sourceText: info?.rawText || '',
          fromAi: !!info,
        },
      })
      setStep('simple')
    }

    async function ocrPipeline(isCancelled, aiNote) {
      const withNote = (msg) => (aiNote ? `${aiNote} ${msg}` : msg)
      setStep('ocr')
      try {
        const text = await extractTextFromImage(file, (p) => !isCancelled() && setOcrProgress(p))
        if (isCancelled()) return
        setOcrText(text)
        const lines = pickCandidateLines(text)
        setOcrLines(lines)
        if (forcedGeneric) {
          setSimple({
            type: 'note',
            categoryId: forcedGeneric.id,
            categoryLabel: forcedGeneric.label,
            init: { sourceText: text, price: guessPrice(text) },
          })
          setStep('simple')
          return
        }
        if (forcedLive) {
          setStep('liveChoice')
          return
        }
        if (lines.length === 0) {
          setError(withNote('לא זוהה טקסט ברור בתמונה — אפשר להקליד את השם ידנית, או לבחור קטגוריה ידנית למטה'))
          return
        }
        setAutoSearching(true)
        try {
          const found = await autoSearchLines(lines)
          if (isCancelled()) return
          if (found) {
            setResults(found)
            setAutoIdentified(true)
            setStep('results')
            if (aiNote) setError(aiNote)
          } else {
            setError(withNote('לא זיהיתי לבד — בחרו שורה, הקלידו שם, או בחרו קטגוריה אחרת למטה'))
          }
        } catch {
          if (!isCancelled()) setError(withNote('החיפוש ברשת נכשל — בחרו שורה או הקלידו את השם'))
        }
        if (!isCancelled()) setAutoSearching(false)
      } catch {
        if (!isCancelled()) setError(withNote('קריאת התמונה נכשלה — אפשר להקליד את השם ידנית'))
      }
    }

    pipeline()
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

  async function doSearch(q, altTitle) {
    const text = (q ?? query).trim()
    if (!text) return
    setQuery(text)
    setBusy(true)
    setError(null)
    try {
      let r = await searchAll(text, tmdbKey)
      // אם אין תוצאות ויש שם באנגלית מהזיהוי — מנסים אותו אוטומטית
      if (r.books.length === 0 && r.screen.length === 0 && altTitle?.trim()) {
        r = await searchAll(altTitle.trim(), tmdbKey)
      }
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
    try {
      full = await aiCompleteDetails(full, aiKey) // משלים רק שדות שנשארו ריקים
    } catch {
      // גם בלי השלמת AI אפשר להמשיך
    }
    setForm(candidateToForm(full, 'confirmed'))
    setStep('confirm')
    setBusy(false)
  }

  function manualEntry() {
    setForm(candidateToForm({ type: 'movie', titleHe: query }, 'manual'))
    setStep('confirm')
  }

  // בחירת אמן/הופעה מתוך liveChoice, עם מה שכבר ידוע (שם/תמונה)
  function chooseLiveType(type) {
    setSimple({
      type,
      init: {
        title: query || aiInfo?.title || '',
        sourceText: ocrText || aiInfo?.rawText || '',
        fromAi: !!aiInfo,
      },
    })
    setStep('simple')
  }

  // שמירת פריט האזנה (שיר/אלבום/אמן/פודקאסט)
  async function saveMusic() {
    if (!musicForm?.title.trim()) {
      setError('חסר שם — זה השדה היחיד שחובה למלא')
      return
    }
    setBusy(true)
    let imageId = null
    try {
      if (file) {
        imageId = crypto.randomUUID()
        const resized = await resizeImage(file)
        await saveImage(imageId, resized)
      }
    } catch {
      // כישלון שמירת התמונה לא חוסם שמירת הפריט עצמו
    }
    addItem({
      type: 'music',
      titleHe: musicForm.title.trim(),
      creator: (musicForm.creator || '').trim(),
      kind: musicForm.kind || '',
      coverUrl: musicForm.coverUrl || null,
      link: musicForm.link || '',
      genres: [],
      identification: musicForm.fromSearch || musicForm.link ? 'confirmed' : 'manual',
      imageId,
      myNote: '',
    })
    setBusy(false)
    onSaved()
  }

  // בחירת קטגוריה חופשית מתוך categoryChoice (או שינוי דעה מכל שלב אחר)
  function routeToCategory(cat) {
    if (cat.builtin && (cat.types.includes('book') || cat.types.includes('movie'))) {
      const guess = (aiInfo?.title || query || '').trim()
      if (guess) doSearch(guess, aiInfo?.altTitle)
      else setStep('query')
      return
    }
    if (cat.builtin && cat.types.includes('music')) {
      setQuery((query || aiInfo?.title || '').trim())
      setStep('musicQuery')
      return
    }
    if (cat.id === 'live') {
      setStep('liveChoice')
      return
    }
    setSimple({
      type: 'note',
      categoryId: cat.id,
      categoryLabel: cat.label,
      init: {
        title: (query || aiInfo?.title || '').trim(),
        address: aiInfo?.address || '',
        price: aiInfo?.price || guessPrice(ocrText) || '',
        store: aiInfo?.store || '',
        link: pastedLink || '',
        sourceText: aiInfo?.rawText || ocrText || '',
        fromAi: !!aiInfo,
      },
    })
    setStep('simple')
  }

  async function save() {
    if (!form.titleHe.trim()) {
      setError('חסר שם — זה השדה היחיד שחובה למלא')
      return
    }
    setBusy(true)
    let imageId = null
    try {
      if (file) {
        imageId = crypto.randomUUID()
        const resized = await resizeImage(file)
        await saveImage(imageId, resized)
      }
    } catch {
      // כישלון שמירת התמונה לא חוסם שמירת הפריט עצמו
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
      imageId,
      myNote: '',
    })
    setBusy(false)
    onSaved()
  }

  async function saveSimple(itemData) {
    setBusy(true)
    try {
      if (file) {
        const imageId = crypto.randomUUID()
        const resized = await resizeImage(file)
        await saveImage(imageId, resized)
        itemData.imageId = imageId
      }
    } catch {
      // גם בלי שמירת התמונה — שומרים את הפריט
    }
    addItem(itemData)
    setBusy(false)
    onSaved()
  }

  const setF = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  // אם לא נפתחנו מתוך קטגוריה קבועה (גנרית או הופעות חיות) — תמיד אפשר לשנות דעה
  const categoryEscape = !forcedGeneric && !forcedLive && (
    <button
      onClick={() => setStep('categoryChoice')}
      className="w-full text-xs font-bold text-slate-500 bg-slate-100 rounded-xl py-2.5"
    >
      זו בכלל קטגוריה אחרת? בחירה מהרשימה
    </button>
  )

  return (
    <Modal title={STEP_TITLE[step]} onClose={onClose}>
      {error && (
        <div className="bg-rose-50 text-rose-600 text-xs rounded-xl px-3 py-2 mb-3 font-semibold">
          {error}
        </div>
      )}

      {step === 'analyze' && (
        <div className="space-y-3">
          {imageUrl && (
            <img
              src={imageUrl}
              className="w-full max-h-44 object-contain rounded-xl bg-slate-100"
              alt="התמונה שהועלתה"
            />
          )}
          <div className="flex items-center gap-2 text-sm text-teal-700 font-semibold">
            <Sparkles className="w-4 h-4 animate-pulse" />
            מזהה את התמונה: מה זה, איזו קטגוריה, ואילו פרטים…
          </div>
        </div>
      )}

      {step === 'categoryChoice' && (
        <div className="space-y-3">
          {imageUrl && (
            <img
              src={imageUrl}
              className="w-full max-h-40 object-contain rounded-xl bg-slate-100"
              alt="התמונה שהועלתה"
            />
          )}
          <p className="text-sm text-slate-500">לאיזו קטגוריה שייכת ההמלצה?</p>
          <div className="grid grid-cols-3 gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => routeToCategory(cat)}
                className="flex flex-col items-center gap-1 bg-slate-50 border border-slate-200 rounded-2xl py-3"
              >
                <span className="text-2xl">{cat.emoji}</span>
                <span className="text-[11px] font-bold text-slate-700 text-center leading-tight">
                  {cat.label}
                </span>
              </button>
            ))}
          </div>
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
                  className="h-full bg-teal-600 transition-all"
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
                            ? 'bg-teal-700 border-teal-700 text-white'
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
                tmdbKey={tmdbKey}
                onPick={chooseCandidate}
              />
              {categoryEscape}
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
            tmdbKey={tmdbKey}
            onPick={chooseCandidate}
          />
          <p className="text-[11px] text-slate-400 leading-relaxed">
            התוצאות מופיעות תוך כדי הקלדה — מספיק שם בלבד, נזהה אם זה ספר, סרט או סדרה ונשלים
            את שאר הפרטים אוטומטית.
          </p>
          {categoryEscape}
        </div>
      )}

      {step === 'linkInput' && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              value={linkInput}
              onChange={(e) => setLinkInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && analyzeLink(linkInput)}
              autoFocus
              dir="ltr"
              placeholder="https://…"
              className="flex-1 text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-teal-600"
            />
            <button
              onClick={() => analyzeLink(linkInput)}
              disabled={!/^https?:\/\/\S+/i.test(linkInput.trim())}
              className="bg-teal-700 disabled:bg-slate-300 text-white rounded-xl px-4 flex items-center gap-1.5 text-sm font-bold"
            >
              <Sparkles className="w-4 h-4" />
              זיהוי
            </button>
          </div>
          <button
            onClick={async () => {
              try {
                const text = await navigator.clipboard.readText()
                const url = extractUrl(text)
                if (url) {
                  setLinkInput(url)
                  analyzeLink(url)
                } else setError('לא נמצא קישור בלוח ההעתקה — הדביקו ידנית בשדה למעלה')
              } catch {
                setError('הדפדפן לא מאפשר קריאה מהלוח — הדביקו ידנית בשדה למעלה')
              }
            }}
            className="w-full text-xs font-bold text-teal-700 bg-teal-50 rounded-xl py-2.5"
          >
            📋 הדבקה מלוח ההעתקה
          </button>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            כל קישור מתקבל: מוצר מחנות, ספר, שיר או סרטון מיוטיוב/ספוטיפיי, מתכון, מקום…
            האפליקציה תזהה מה זה, תסווג לקטגוריה המתאימה ותמלא את הפרטים.
          </p>
          {categoryEscape}
        </div>
      )}

      {step === 'linkAnalyze' && (
        <div className="space-y-3">
          <div className="text-xs text-slate-400 break-all bg-slate-50 rounded-xl px-3 py-2" dir="ltr">
            {pastedLink}
          </div>
          <div className="flex items-center gap-2 text-sm text-teal-700 font-semibold">
            <Sparkles className="w-4 h-4 animate-pulse" />
            מזהה את הקישור: מה זה ולאיזו קטגוריה…
          </div>
        </div>
      )}

      {step === 'musicQuery' && (
        <div className="space-y-2">
          {imageUrl && (
            <img
              src={imageUrl}
              className="w-full max-h-40 object-contain rounded-xl bg-slate-100"
              alt="התמונה שהועלתה"
            />
          )}
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            placeholder="שם של שיר / אמן / אלבום / פודקאסט…"
            className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-teal-600"
          />
          <p className="text-[11px] text-slate-400 leading-relaxed">
            התוצאות מופיעות תוך כדי הקלדה. אפשר גם לשתף לאפליקציה קישור מיוטיוב או ספוטיפיי —
            והוא ייכנס לכאן אוטומטית.
          </p>
          {musicSearching && !musicResults?.length && (
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-semibold">
              <Loader2 className="w-3 h-3 animate-spin" /> מחפש…
            </div>
          )}
          {musicResults?.length > 0 && (
            <div className="space-y-1">
              {musicResults.map((r, i) => (
                <button
                  key={`${r.title}-${r.creator}-${i}`}
                  onClick={() => {
                    setMusicForm({ ...r, fromSearch: true })
                    setStep('musicConfirm')
                  }}
                  className="w-full flex items-center gap-2 text-right bg-slate-50 hover:bg-teal-50 rounded-xl px-2 py-1.5 transition"
                >
                  {r.coverUrl ? (
                    <img src={r.coverUrl} className="w-9 h-9 rounded-lg object-cover shrink-0" alt="" />
                  ) : (
                    <span className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                      🎧
                    </span>
                  )}
                  <span className="flex-1 min-w-0">
                    <span className="block text-xs font-bold text-slate-700 truncate">{r.title}</span>
                    {r.creator && (
                      <span className="block text-[11px] text-slate-400 truncate">{r.creator}</span>
                    )}
                  </span>
                  <span className="text-[10px] rounded-full px-1.5 py-0.5 font-bold shrink-0 bg-indigo-100 text-indigo-800">
                    {r.kind}
                  </span>
                </button>
              ))}
            </div>
          )}
          {musicResults?.length === 0 && !musicSearching && (
            <div className="text-[11px] text-slate-400 font-semibold">
              לא נמצאו תוצאות — אפשר להזין ידנית למטה
            </div>
          )}
          <button
            onClick={() => {
              setMusicForm({ title: query.trim(), creator: '', kind: 'שיר', coverUrl: null, link: '' })
              setStep('musicConfirm')
            }}
            className="w-full text-xs font-bold text-teal-700 bg-teal-50 rounded-xl py-2.5 flex items-center justify-center gap-1"
          >
            <PencilLine className="w-3.5 h-3.5" />
            הזנה ידנית
          </button>
          {categoryEscape}
        </div>
      )}

      {step === 'musicConfirm' && musicForm && (
        <div className="space-y-3">
          <div className="flex gap-3 items-start">
            {(musicForm.coverUrl || imageUrl) && (
              <img
                src={musicForm.coverUrl || imageUrl}
                className="w-20 h-20 rounded-xl object-cover bg-slate-100 shrink-0"
                alt=""
              />
            )}
            <div className="flex-1 space-y-2">
              {musicForm.loadingLink && (
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-semibold">
                  <Loader2 className="w-3 h-3 animate-spin" /> שולף את הפרטים מהקישור…
                </div>
              )}
              <Field
                label="שם *"
                value={musicForm.title}
                onChange={(e) => setMusicForm((f) => ({ ...f, title: e.target.value }))}
              />
              <Field
                label="אמן / יוצר"
                value={musicForm.creator}
                onChange={(e) => setMusicForm((f) => ({ ...f, creator: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 mb-1">מה זה?</div>
            <div className="flex flex-wrap gap-1.5">
              {MUSIC_KINDS.map((k) => (
                <button
                  key={k}
                  onClick={() => setMusicForm((f) => ({ ...f, kind: f.kind === k ? '' : k }))}
                  className={`text-xs rounded-full px-3 py-1.5 border font-semibold ${
                    musicForm.kind === k
                      ? 'bg-teal-700 border-teal-700 text-white'
                      : 'bg-white border-slate-200 text-slate-500'
                  }`}
                >
                  {k}
                </button>
              ))}
            </div>
          </div>
          {musicForm.link && (
            <div className="text-[11px] text-slate-400 leading-relaxed break-all">
              🔗 הקישור ששותף יישמר עם הפריט: {musicForm.link}
            </div>
          )}
          <button
            onClick={saveMusic}
            disabled={busy}
            className="w-full bg-teal-700 disabled:bg-slate-300 text-white font-bold rounded-2xl py-3 active:scale-[0.99] transition flex items-center justify-center gap-2"
          >
            {busy && <Loader2 className="w-4 h-4 animate-spin" />}
            שמירה בהאזנה
          </button>
          <button
            onClick={() => setStep('musicQuery')}
            className="w-full text-xs font-bold text-slate-500 bg-slate-100 rounded-xl py-2.5"
          >
            חזרה לחיפוש
          </button>
        </div>
      )}

      {step === 'results' && results && (
        <div className="space-y-4">
          {autoIdentified && (
            <div className="bg-teal-50 text-teal-800 text-xs rounded-xl px-3 py-2 font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
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
              className="flex-1 text-xs font-bold text-teal-700 bg-teal-50 rounded-xl py-2.5 flex items-center justify-center gap-1"
            >
              <PencilLine className="w-3.5 h-3.5" />
              הזנה ידנית
            </button>
          </div>
          {categoryEscape}
        </div>
      )}

      {step === 'confirm' && form && (
        <div className="space-y-3">
          <div className="flex gap-3">
            <Cover
              item={{ ...form, type: form.type }}
              className="w-20 aspect-[2/3] rounded-xl shrink-0"
              emojiSize="text-2xl"
            />
            <div className="flex-1 space-y-2">
              <div className="flex gap-1">
                {['book', 'movie', 'series'].map((value) => (
                  <button
                    key={value}
                    onClick={() => setForm((f) => ({ ...f, type: value }))}
                    className={`text-xs rounded-full px-3 py-1 border font-semibold ${
                      form.type === value
                        ? 'bg-teal-700 border-teal-700 text-white'
                        : 'bg-white border-slate-200 text-slate-500'
                    }`}
                  >
                    {TYPE_LABEL[value]}
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
              <Field
                label="אורך (דקות)"
                value={form.runtimeMinutes}
                onChange={setF('runtimeMinutes')}
                type="number"
              />
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
              className="w-full mt-0.5 text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-teal-600"
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
            disabled={busy}
            className="w-full bg-teal-700 disabled:bg-slate-300 text-white font-bold rounded-2xl py-3 active:scale-[0.99] transition flex items-center justify-center gap-2"
          >
            {busy && <Loader2 className="w-4 h-4 animate-spin" />}
            שמירה בספרייה
          </button>
        </div>
      )}

      {step === 'liveChoice' && (
        <div className="space-y-3">
          {imageUrl && (
            <img
              src={imageUrl}
              className="w-full max-h-44 object-contain rounded-xl bg-slate-100"
              alt="התמונה שהועלתה"
            />
          )}
          <p className="text-sm text-slate-500">איזה סוג המלצה זו?</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => chooseLiveType('artist')}
              className="bg-slate-50 border border-slate-200 rounded-2xl py-5 flex flex-col items-center gap-1.5 font-bold text-slate-700"
            >
              <span className="text-2xl">🎤</span>
              אמן / להקה
              <span className="text-[10px] font-normal text-slate-400">המלצה לגילוי, בלי תאריך</span>
            </button>
            <button
              onClick={() => chooseLiveType('show')}
              className="bg-slate-50 border border-slate-200 rounded-2xl py-5 flex flex-col items-center gap-1.5 font-bold text-slate-700"
            >
              <span className="text-2xl">🎫</span>
              הופעה קרובה
              <span className="text-[10px] font-normal text-slate-400">קונצרט, תיאטרון, הקרנה…</span>
            </button>
          </div>
        </div>
      )}

      {step === 'simple' && simple && (
        <SimpleForm
          type={simple.type}
          categoryId={simple.categoryId}
          categoryLabel={simple.categoryLabel}
          init={simple.init}
          imageUrl={imageUrl}
          imageFile={file}
          canAi={canAi}
          aiKey={aiKey}
          titleSuggestions={ocrLines || []}
          onSave={saveSimple}
          busy={busy}
        />
      )}
    </Modal>
  )
}

// ניחוש שם מתוך כתובת ה-URL עצמה (החלק האחרון בנתיב) — למקרה שאין AI זמין
function slugTitle(url) {
  try {
    const seg = decodeURIComponent(new URL(url).pathname.split('/').filter(Boolean).pop() || '')
    const t = seg.replace(/\.\w{2,5}$/, '').replace(/[-_+]/g, ' ').trim()
    return t.length > 2 && !/^\d+$/.test(t) ? t : ''
  } catch {
    return ''
  }
}

function guessPrice(text) {
  if (!text) return ''
  const m = text.match(/(\d{1,4}(?:[.,]\d{1,2})?)\s*(?:₪|ש"ח|שח)|(?:₪|ש"ח)\s*(\d{1,4}(?:[.,]\d{1,2})?)/)
  return m ? m[1] || m[2] : ''
}

function SearchBox({ query, setQuery, onSearch, busy, autoFocus, placeholder, tmdbKey, onPick }) {
  // הצעות תוך כדי הקלדה: אחרי הפסקה קצרה בהקלדה מחפשים ברקע ומציגים התאמות מיד,
  // בלי צורך ללחוץ "חיפוש". מונה רץ מוודא שתשובה איטית ישנה לא תדרוס חדשה.
  const [suggestions, setSuggestions] = useState(null)
  const [suggesting, setSuggesting] = useState(false)
  const seqRef = useRef(0)

  useEffect(() => {
    if (!onPick) return
    const text = query.trim()
    if (text.length < 2) {
      setSuggestions(null)
      setSuggesting(false)
      return
    }
    const seq = ++seqRef.current
    setSuggesting(true)
    const timer = setTimeout(async () => {
      try {
        const r = await searchAll(text, tmdbKey)
        if (seqRef.current !== seq) return
        setSuggestions([...r.screen, ...r.books].slice(0, 5))
      } catch {
        if (seqRef.current === seq) setSuggestions(null)
      }
      if (seqRef.current === seq) setSuggesting(false)
    }, 450)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  return (
    <div>
      <div className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSearch()}
          autoFocus={autoFocus}
          placeholder={placeholder}
          className="flex-1 text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-teal-600"
        />
        <button
          onClick={onSearch}
          disabled={busy || !query.trim()}
          className="bg-teal-700 disabled:bg-slate-300 text-white rounded-xl px-4 flex items-center gap-1.5 text-sm font-bold"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          חיפוש
        </button>
      </div>
      {onPick && suggesting && !suggestions?.length && (
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-semibold mt-1.5">
          <Loader2 className="w-3 h-3 animate-spin" /> מחפש תוך כדי הקלדה…
        </div>
      )}
      {onPick && suggestions?.length > 0 && (
        <div className="mt-1.5 space-y-1">
          {suggestions.map((c, i) => (
            <button
              key={`${c.source}-${c.externalId ?? i}`}
              onClick={() => {
                setSuggestions(null)
                onPick(c)
              }}
              disabled={busy}
              className="w-full flex items-center gap-2 text-right bg-slate-50 hover:bg-teal-50 rounded-xl px-2 py-1.5 transition disabled:opacity-50"
            >
              <Cover item={c} className="w-7 aspect-[2/3] rounded shrink-0" emojiSize="text-xs" />
              <span className="flex-1 min-w-0 text-xs font-bold text-slate-700 truncate">
                {c.titleHe}
              </span>
              <span
                className={`text-[10px] rounded-full px-1.5 py-0.5 font-bold shrink-0 ${TYPE_BADGE_STYLE[c.type] || 'bg-slate-200 text-slate-600'}`}
              >
                {TYPE_LABEL[c.type] || '?'}
              </span>
              {c.year && <span className="text-[10px] text-slate-400 shrink-0">{c.year}</span>}
            </button>
          ))}
        </div>
      )}
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
            className="w-full flex items-center gap-3 text-right bg-slate-50 hover:bg-teal-50 rounded-2xl p-2 transition disabled:opacity-50"
          >
            <Cover item={c} className="w-11 aspect-[2/3] rounded-lg shrink-0" emojiSize="text-lg" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-slate-800 truncate">{c.titleHe}</span>
                <span
                  className={`text-[10px] rounded-full px-1.5 py-0.5 font-bold shrink-0 ${TYPE_BADGE_STYLE[c.type] || 'bg-slate-200 text-slate-600'}`}
                >
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
        className="w-full mt-0.5 text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-teal-600"
      />
    </div>
  )
}
