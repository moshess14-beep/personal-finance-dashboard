// JustWatch — מקור ללא מפתח לסרטים/סדרות: מטא-דאטה + זמינות סטרימינג בישראל
import { JW_GENRES_HE } from '../data/genres'

const JW_URL = 'https://apis.justwatch.com/graphql'

// שתי רמות שאילתה: מלאה (כולל קרדיטים וז'אנרים), ומינימלית כגיבוי אם הסכמה השתנתה
const FULL_FIELDS = `
  id
  objectType
  content(country: $country, language: $language) {
    title
    originalReleaseYear
    shortDescription
    posterUrl
    runtime
    genres { shortName }
    credits { role name }
  }
  ... on Show { totalSeasonCount }
  offers(country: $country, platform: WEB) {
    monetizationType
    package { clearName }
  }
`

const MIN_FIELDS = `
  id
  objectType
  content(country: $country, language: $language) {
    title
    originalReleaseYear
    shortDescription
    posterUrl
  }
  ... on Show { totalSeasonCount }
  offers(country: $country, platform: WEB) {
    monetizationType
    package { clearName }
  }
`

async function jwQuery(fields, searchQuery, first = 5) {
  const query = `query($country: Country!, $language: Language!, $first: Int!, $filter: TitleFilter) {
    popularTitles(country: $country, first: $first, filter: $filter) {
      edges { node { ${fields} } }
    }
  }`
  const res = await fetch(JW_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      variables: {
        country: 'IL',
        language: 'he',
        first,
        filter: { searchQuery },
      },
    }),
  })
  if (!res.ok) throw new Error(`jw http ${res.status}`)
  const json = await res.json()
  if (json.errors?.length || !json.data?.popularTitles) throw new Error('jw gql error')
  return json.data.popularTitles.edges.map((e) => e.node)
}

export async function searchJustWatch(searchQuery) {
  let nodes
  try {
    nodes = await jwQuery(FULL_FIELDS, searchQuery)
  } catch {
    nodes = await jwQuery(MIN_FIELDS, searchQuery)
  }
  return nodes.map(nodeToCandidate).filter(Boolean)
}

function nodeToCandidate(n) {
  const c = n.content || {}
  const type = n.objectType === 'MOVIE' ? 'movie' : n.objectType === 'SHOW' ? 'series' : null
  if (!type || !c.title) return null
  const director = (c.credits || []).find((p) => p.role === 'DIRECTOR')?.name || ''
  return {
    source: 'justwatch',
    externalId: n.id,
    type,
    titleHe: c.title,
    titleOriginal: '',
    creator: type === 'movie' ? director : '',
    year: c.originalReleaseYear || null,
    runtimeMinutes: type === 'movie' ? c.runtime || null : null,
    episodeRuntimeMinutes: type === 'series' ? c.runtime || null : null,
    seasons: n.totalSeasonCount || null,
    genres: (c.genres || [])
      .map((g) => JW_GENRES_HE[g.shortName] || null)
      .filter(Boolean)
      .slice(0, 3),
    summary: (c.shortDescription || '').slice(0, 400),
    coverUrl: jwPosterUrl(c.posterUrl),
    availability: mapOffers(n.offers),
  }
}

function jwPosterUrl(p) {
  if (!p) return null
  return `https://images.justwatch.com${p.replace('{profile}', 's332').replace('{format}', 'webp')}`
}

const KIND_HE = {
  FLATRATE: 'מנוי',
  ADS: 'חינם עם פרסומות',
  FREE: 'חינם',
  FAST: 'חינם',
  RENT: 'השכרה',
  BUY: 'קנייה',
}
const KIND_PRIORITY = ['FLATRATE', 'ADS', 'FREE', 'FAST', 'RENT', 'BUY']

const CLEARNAME_MAP = [
  [/netflix/i, 'netflix'],
  [/disney/i, 'disney'],
  [/amazon|prime video/i, 'amazon'],
  [/apple/i, 'appletv'],
  [/\byes\b/i, 'yes'],
  [/\bhot\b/i, 'hot'],
  [/cellcom/i, 'cellcom'],
  [/partner/i, 'partner'],
  [/sting/i, 'sting'],
]

function mapOffers(offers = []) {
  const seen = new Set()
  const out = []
  const sorted = [...offers].sort(
    (a, b) => KIND_PRIORITY.indexOf(a.monetizationType) - KIND_PRIORITY.indexOf(b.monetizationType),
  )
  for (const o of sorted) {
    const kind = KIND_HE[o.monetizationType]
    const clearName = o.package?.clearName || ''
    if (!kind || !clearName) continue
    const platform = CLEARNAME_MAP.find(([re]) => re.test(clearName))?.[1] || 'other'
    const key = platform === 'other' ? `other:${clearName}` : platform
    if (seen.has(key)) continue
    seen.add(key)
    out.push({ platform, kind, label: clearName, manual: false })
  }
  return out
}
