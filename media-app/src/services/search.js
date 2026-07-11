import { DEMO } from './env'
import { TMDB_GENRES_HE, translateBookCategory } from '../data/genres'
import { TMDB_PROVIDER_MAP } from '../data/platforms'
import { demoSearch } from '../data/demoData'

// חיפוש מאוחד: ספרים (Google Books) + סרטים/סדרות (TMDB אם יש מפתח, אחרת ויקיפדיה עברית)
export async function searchAll(query, tmdbKey) {
  if (DEMO) return demoSearch(query)

  const [books, screenRaw] = await Promise.all([
    searchBooks(query).catch(() => []),
    searchScreen(query, tmdbKey).catch(() => []),
  ])
  // ויקיפדיה עשויה להחזיר גם ספרים — ממיינים לקבוצה הנכונה
  const wikiBooks = screenRaw.filter((c) => c.type === 'book')
  const screen = screenRaw.filter((c) => c.type !== 'book')
  return { books: [...books, ...wikiBooks], screen }
}

// ---------- ספרים: Google Books (ללא מפתח) ----------

async function searchBooks(query) {
  let results = await gbooksQuery(query, true)
  if (results.length === 0) results = await gbooksQuery(query, false)
  return results
}

async function gbooksQuery(query, hebrewOnly) {
  const params = new URLSearchParams({
    q: query,
    maxResults: '6',
    printType: 'books',
  })
  if (hebrewOnly) params.set('langRestrict', 'iw')
  const res = await fetch(`https://www.googleapis.com/books/v1/volumes?${params}`)
  if (!res.ok) throw new Error('gbooks failed')
  const json = await res.json()
  return (json.items || []).map((v) => {
    const info = v.volumeInfo || {}
    return {
      source: 'gbooks',
      externalId: v.id,
      type: 'book',
      titleHe: info.title || '',
      titleOriginal: '',
      creator: (info.authors || []).join(', '),
      year: info.publishedDate ? parseInt(info.publishedDate.slice(0, 4)) || null : null,
      pages: info.pageCount || null,
      genres: (info.categories || []).map(translateBookCategory).filter(Boolean).slice(0, 3),
      summary: (info.description || '').slice(0, 400),
      coverUrl: info.imageLinks?.thumbnail?.replace('http://', 'https://') || null,
    }
  })
}

// ---------- סרטים וסדרות ----------

async function searchScreen(query, tmdbKey) {
  if (tmdbKey) {
    try {
      return await searchScreenTmdb(query, tmdbKey)
    } catch {
      return searchScreenWiki(query)
    }
  }
  return searchScreenWiki(query)
}

async function searchScreenTmdb(query, key) {
  const params = new URLSearchParams({
    query,
    language: 'he-IL',
    include_adult: 'false',
    api_key: key,
  })
  const res = await fetch(`https://api.themoviedb.org/3/search/multi?${params}`)
  if (!res.ok) throw new Error('tmdb failed')
  const json = await res.json()
  return (json.results || [])
    .filter((x) => x.media_type === 'movie' || x.media_type === 'tv')
    .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
    .slice(0, 6)
    .map((x) => ({
      source: 'tmdb',
      externalId: x.id,
      type: x.media_type === 'movie' ? 'movie' : 'series',
      titleHe: x.title || x.name || '',
      titleOriginal: x.original_title || x.original_name || '',
      year: parseInt((x.release_date || x.first_air_date || '').slice(0, 4)) || null,
      genres: (x.genre_ids || [])
        .map((id) => TMDB_GENRES_HE[x.media_type === 'movie' ? 'movie' : 'tv'][id])
        .filter(Boolean)
        .slice(0, 3),
      summary: (x.overview || '').slice(0, 400),
      coverUrl: x.poster_path ? `https://image.tmdb.org/t/p/w342${x.poster_path}` : null,
    }))
}

// גיבוי ללא מפתח: ויקיפדיה עברית (מידע חלקי — ללא אורך/זמינות)
async function searchScreenWiki(query) {
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    origin: '*',
    generator: 'search',
    gsrsearch: query,
    gsrlimit: '8',
    prop: 'pageimages|description',
    piprop: 'thumbnail',
    pithumbsize: '300',
  })
  const res = await fetch(`https://he.wikipedia.org/w/api.php?${params}`)
  if (!res.ok) throw new Error('wiki failed')
  const json = await res.json()
  const pages = Object.values(json.query?.pages || {}).sort((a, b) => a.index - b.index)
  return pages
    .map((p) => {
      const desc = p.description || ''
      let type = null
      if (/סדר(ה|ת)/.test(desc)) type = 'series'
      else if (/סרט/.test(desc)) type = 'movie'
      else if (/ספר|רומן|נובלה/.test(desc)) type = 'book'
      if (!type) return null
      const year = (desc.match(/(19|20)\d{2}/) || [])[0]
      return {
        source: 'wiki',
        externalId: p.pageid,
        type,
        titleHe: p.title.replace(/\s*\(.*?\)\s*$/, ''),
        titleOriginal: '',
        creator: '',
        year: year ? +year : null,
        genres: [],
        summary: desc,
        coverUrl: p.thumbnail?.source || null,
        partial: true,
      }
    })
    .filter(Boolean)
    .slice(0, 6)
}

// ---------- העשרה בבחירת מועמד ----------

// TMDB: פרטים מלאים (אורך/עונות/יוצר) + זמינות סטרימינג בישראל
export async function enrichCandidate(candidate, tmdbKey) {
  if (DEMO) return candidate
  if (candidate.source !== 'tmdb' || !tmdbKey) return candidate

  const kind = candidate.type === 'movie' ? 'movie' : 'tv'
  const params = new URLSearchParams({
    api_key: tmdbKey,
    language: 'he-IL',
    append_to_response: 'credits,watch/providers',
  })
  const res = await fetch(`https://api.themoviedb.org/3/${kind}/${candidate.externalId}?${params}`)
  if (!res.ok) return candidate
  const d = await res.json()

  const out = { ...candidate }
  if (kind === 'movie') {
    out.runtimeMinutes = d.runtime || null
    out.creator = d.credits?.crew?.find((p) => p.job === 'Director')?.name || candidate.creator
  } else {
    out.seasons = d.number_of_seasons || null
    out.isEnded = d.status === 'Ended'
    out.creator = d.created_by?.[0]?.name || candidate.creator
  }
  if (d.genres?.length) out.genres = d.genres.map((g) => g.name)
  if (d.overview) out.summary = d.overview.slice(0, 400)
  out.availability = mapProviders(d['watch/providers']?.results?.IL)
  return out
}

function mapProviders(il) {
  if (!il) return []
  const seen = new Set()
  const out = []
  for (const [tmdbKind, heKind] of [['flatrate', 'מנוי'], ['rent', 'השכרה'], ['buy', 'קנייה']]) {
    for (const p of il[tmdbKind] || []) {
      const platform = TMDB_PROVIDER_MAP[p.provider_id]
      if (platform && !seen.has(platform)) {
        seen.add(platform)
        out.push({ platform, kind: heKind, manual: false })
      }
    }
  }
  return out
}
