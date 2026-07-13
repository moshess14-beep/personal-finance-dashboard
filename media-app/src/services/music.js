// חיפוש מוזיקה ופודקאסטים + קליטת קישורי האזנה ששותפו לאפליקציה.
// החיפוש רץ מול iTunes Search API — חינמי, בלי מפתח, תומך CORS ומכסה היטב גם
// מוזיקה ישראלית ופודקאסטים. פרטי קישור ששותף נשלפים דרך oEmbed של הפלטפורמה.
import { DEMO } from './env'

const DEMO_RESULTS = [
  { kind: 'שיר', title: 'שיר לדוגמה', creator: 'אמן הדגמה', coverUrl: null, year: 2024, link: '' },
  { kind: 'אלבום', title: 'אלבום לדוגמה', creator: 'להקת הדגמה', coverUrl: null, year: 2023, link: '' },
  { kind: 'פודקאסט', title: 'פודקאסט לדוגמה', creator: 'מגיש הדגמה', coverUrl: null, year: null, link: '' },
]

export async function searchMusic(query) {
  if (DEMO) return DEMO_RESULTS
  const [music, podcasts] = await Promise.all([
    itunesQuery(query, 'music', 6).catch(() => []),
    itunesQuery(query, 'podcast', 3).catch(() => []),
  ])
  return [...music, ...podcasts]
}

async function itunesQuery(term, media, limit) {
  const params = new URLSearchParams({ term, media, limit: String(limit), country: 'IL' })
  const res = await fetch(`https://itunes.apple.com/search?${params}`)
  if (!res.ok) throw new Error('itunes failed')
  const json = await res.json()
  return (json.results || [])
    .map((r) => ({
      kind:
        r.kind === 'podcast'
          ? 'פודקאסט'
          : r.wrapperType === 'collection'
            ? 'אלבום'
            : r.wrapperType === 'artist'
              ? 'אמן'
              : 'שיר',
      title: r.trackName || r.collectionName || r.artistName || '',
      creator: r.wrapperType === 'artist' ? '' : r.artistName || '',
      coverUrl: (r.artworkUrl100 || '').replace('100x100', '300x300') || null,
      year: r.releaseDate ? parseInt(r.releaseDate.slice(0, 4)) || null : null,
      link: r.trackViewUrl || r.collectionViewUrl || r.artistLinkUrl || '',
    }))
    .filter((x) => x.title)
}

// חילוץ ה-URL הראשון מתוך טקסט ששותף (אנדרואיד שולח לרוב "כותרת + קישור" בשדה אחד)
export function extractUrl(text) {
  const m = (text || '').match(/https?:\/\/\S+/)
  return m ? m[0] : null
}

// האם הקישור שייך לפלטפורמת האזנה שאנחנו יודעים לקלוט לקטגוריית ההאזנה
export function isListenLink(url) {
  return /youtube\.com|youtu\.be|open\.spotify\.com|music\.apple\.com/i.test(url || '')
}

// ניחוש סוג ראשוני מהקישור עצמו — המשתמש תמיד יכול לשנות במסך האישור
export function guessKindFromLink(url) {
  if (/open\.spotify\.com\/(episode|show)/i.test(url)) return 'פודקאסט'
  if (/open\.spotify\.com\/album/i.test(url)) return 'אלבום'
  if (/open\.spotify\.com\/artist/i.test(url)) return 'אמן'
  return 'שיר'
}

// שליפת שם/יוצר/תמונה מקישור ששותף, דרך נקודת ה-oEmbed הציבורית של הפלטפורמה.
// נכשל בשקט (null) — במקרה כזה המשתמש פשוט ימלא את השם ידנית.
export async function fetchLinkInfo(url) {
  let endpoint = null
  if (/youtube\.com|youtu\.be/i.test(url))
    endpoint = `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(url)}`
  else if (/open\.spotify\.com/i.test(url))
    endpoint = `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`
  if (!endpoint) return null
  try {
    const res = await fetch(endpoint)
    if (!res.ok) return null
    const json = await res.json()
    return {
      title: json.title || '',
      creator: json.author_name || '',
      coverUrl: json.thumbnail_url || null,
    }
  } catch {
    return null
  }
}
