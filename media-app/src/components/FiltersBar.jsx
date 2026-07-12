import { useMemo } from 'react'
import { SlidersHorizontal } from 'lucide-react'
import { PLATFORMS } from '../data/platforms'
import {
  PLACE_TYPES,
  AUDIENCES,
  REGIONS,
  DISH_TYPES,
  KASHRUT,
  RECIPE_TAGS,
  PRODUCT_CATEGORIES,
} from '../data/taxonomies'

const SCREEN_TYPE_OPTIONS = [
  { value: 'all', label: 'הכול' },
  { value: 'movie', label: 'סרטים' },
  { value: 'series', label: 'סדרות' },
]

function Chip({ active, onClick, children, color }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 flex items-center gap-1.5 text-xs rounded-full px-3 py-1 border font-semibold transition ${
        active
          ? 'bg-indigo-600 border-indigo-600 text-white'
          : 'bg-white border-slate-200 text-slate-600'
      }`}
    >
      {color && <span className="w-2 h-2 rounded-full" style={{ background: color }} />}
      {children}
    </button>
  )
}

function ChipRow({ label, children }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] font-bold text-slate-400 w-12 shrink-0">{label}</span>
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">{children}</div>
    </div>
  )
}

// שורות הסינון לכל קטגוריה
function rowsFor(mode, genres) {
  switch (mode) {
    case 'books':
      return [{ key: 'genre', label: "ז'אנר", options: genres }]
    case 'screen':
      return [
        { key: 'genre', label: "ז'אנר", options: genres },
        { key: 'platform', label: 'זמין ב־', options: PLATFORMS, platform: true },
      ]
    case 'places':
      return [
        { key: 'placeType', label: 'סוג', options: PLACE_TYPES },
        { key: 'audience', label: 'למי', options: AUDIENCES },
        { key: 'region', label: 'אזור', options: REGIONS },
      ]
    case 'recipes':
      return [
        { key: 'dishType', label: 'מנה', options: DISH_TYPES },
        { key: 'kashrut', label: 'כשרות', options: KASHRUT },
        { key: 'tag', label: 'תגית', options: RECIPE_TAGS },
      ]
    case 'products':
      return [{ key: 'productCategory', label: 'קטגוריה', options: PRODUCT_CATEGORIES }]
    default:
      return []
  }
}

export default function FiltersBar({ mode, items, filters, setFilters, shownCount }) {
  const genres = useMemo(
    () =>
      [...new Set(items.flatMap((i) => i.genres || []))].sort((a, b) => a.localeCompare(b, 'he')),
    [items],
  )

  const toggle = (key, value) =>
    setFilters((f) => ({ ...f, [key]: f[key] === value ? null : value }))

  const rows = rowsFor(mode, genres).filter((r) => r.options.length > 0)

  return (
    <div
      className="fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur border-t border-slate-200 pb-[env(safe-area-inset-bottom)]"
      dir="rtl"
    >
      <div className="max-w-lg mx-auto px-3 py-2 space-y-1.5">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-slate-400 shrink-0" />
          {mode === 'screen' ? (
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {SCREEN_TYPE_OPTIONS.map((opt) => (
                <Chip
                  key={opt.value}
                  active={(filters.type || 'all') === opt.value}
                  onClick={() => setFilters((f) => ({ ...f, type: opt.value }))}
                >
                  {opt.label}
                </Chip>
              ))}
            </div>
          ) : (
            <span className="text-[11px] font-bold text-slate-400">סינון</span>
          )}
          <span className="ms-auto text-[11px] text-slate-400 shrink-0 font-semibold">
            {shownCount} פריטים
          </span>
        </div>

        {rows.map((row) => (
          <ChipRow key={row.key} label={row.label}>
            {row.options.map((opt) => {
              const value = row.platform ? opt.id : opt
              const label = row.platform ? opt.label : opt
              return (
                <Chip
                  key={value}
                  color={row.platform ? opt.color : undefined}
                  active={filters[row.key] === value}
                  onClick={() => toggle(row.key, value)}
                >
                  {label}
                </Chip>
              )
            })}
          </ChipRow>
        ))}
      </div>
    </div>
  )
}
