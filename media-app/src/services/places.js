// חיפוש מקומות וכתובות — OpenStreetMap Nominatim (ללא מפתח, תומך עברית)
import { DEMO } from './env'
import { demoPlaces } from '../data/demoData'

export async function searchPlaceAddress(query) {
  if (DEMO) return demoPlaces(query)
  const params = new URLSearchParams({
    format: 'jsonv2',
    limit: '5',
    'accept-language': 'he',
    q: query,
  })
  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`)
  if (!res.ok) throw new Error('nominatim failed')
  const json = await res.json()
  return json.map((p) => ({
    name: (p.name || '').trim() || p.display_name.split(',')[0].trim(),
    address: p.display_name,
  }))
}

export const mapsSearchUrl = (q) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`
