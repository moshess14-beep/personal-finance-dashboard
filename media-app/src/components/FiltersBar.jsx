import { useMemo } from 'react'
import { SlidersHorizontal, ArrowDownWideNarrow } from 'lucide-react'
import { PLATFORMS } from '../data/platforms'
import { SORT_OPTIONS, SORT_OPTIONS_LIVE } from '../data/constants'
import { MUSIC_GENRES, SHOW_TYPES } from '../data/taxonomies'

const TYPE_TOGGLE_OPTIONS = {
  screen: [
    { value: 'all', label: 'הכול' },
    { value: 'movie', label: 'סרטים' },
    { value: 'series', label: 'סדרות' },
  ],
  live: [
    { value: 'all', label: 'הכול' },
    { value: 'artist', label: 'אמנים' },
    { value: 'show', label: 'הופעות' },
  ],
}

function Chip({ active, onClick, children, color }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 flex items-center gap-1.5 text-xs rounded-full px-3 py-1 border font-semibold transition ${
        active
          ? 'bg-teal-700 border-teal-700 text-white'
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

// שורות הסינון לכל קטגוריה. built-in (ספרים/צפייה/הופעות) מקבלות סינון ייעודי;
// קטגוריות רגילות מקבלות סינון גנרי לפי "סוג" ותגיות חופשיות שנגזרות מהפריטים בפועל.
function rowsFor(category, items) {
  if (category.id === 'books') {
    return [{ key: 'genre', label: "ז'אנר", options: uniqueValues(items, 'genres') }]
  }
  if (category.id === 'screen') {
    return [
      { key: 'genre', label: "ז'אנר", options: uniqueValues(items, 'genres') },
      { key: 'platform', label: 'זמין ב־', options: PLATFORMS, platform: true },
    ]
  }
  if (category.id === 'live') {
    return [
      { key: 'genre', label: 'סגנון', options: MUSIC_GENRES },
      { key: 'showType', label: 'סוג', options: SHOW_TYPES },
    ]
  }
  return [
    { key: 'kind', label: 'סוג', options: uniqueValues(items, 'kind') },
    { key: 'tag', label: 'תגית', options: uniqueValues(items, 'tags') },
  ]
}

function uniqueValues(items, field) {
  const values = items.flatMap((i) => {
    const v = i[field]
    return Array.isArray(v) ? v : v ? [v] : []
  })
  return [...new Set(values)].sort((a, b) => a.localeCompare(b, 'he'))
}

export default function FiltersBar({ category, items, filters, setFilters, sort, setSort, shownCount }) {
  const rows = useMemo(() => rowsFor(category, items).filter((r) => r.options.length > 0), [category, items])
  const typeOptions = TYPE_TOGGLE_OPTIONS[category.id]
  const sortOptions = category.id === 'live' ? SORT_OPTIONS_LIVE : SORT_OPTIONS

  const toggle = (key, value) =>
    setFilters((f) => ({ ...f, [key]: f[key] === value ? null : value }))

  return (
    <div
      className="fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur border-t border-slate-200 pb-[env(safe-area-inset-bottom)]"
      dir="rtl"
    >
      <div className="max-w-lg mx-auto px-3 py-2 space-y-1.5">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-slate-400 shrink-0" />
          {typeOptions ? (
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {typeOptions.map((opt) => (
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

        <div className="flex items-center gap-1.5">
          <ArrowDownWideNarrow className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-[11px] font-bold text-slate-400 shrink-0">מיון:</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg px-2 py-1 border-0 focus:outline-teal-600"
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
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
