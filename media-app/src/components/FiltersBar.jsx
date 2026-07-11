import { useMemo } from 'react'
import { SlidersHorizontal } from 'lucide-react'
import { PLATFORMS } from '../data/platforms'

const TYPE_OPTIONS = [
  { value: 'all', label: 'הכול' },
  { value: 'book', label: 'ספרים' },
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

export default function FiltersBar({ items, filters, setFilters, shownCount }) {
  const genres = useMemo(
    () =>
      [...new Set(items.flatMap((i) => i.genres || []))].sort((a, b) =>
        a.localeCompare(b, 'he'),
      ),
    [items],
  )

  const toggle = (key, value) =>
    setFilters((f) => ({ ...f, [key]: f[key] === value ? (key === 'type' ? 'all' : null) : value }))

  return (
    <div
      className="fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur border-t border-slate-200 pb-[env(safe-area-inset-bottom)]"
      dir="rtl"
    >
      <div className="max-w-lg mx-auto px-3 py-2 space-y-1.5">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-slate-400 shrink-0" />
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {TYPE_OPTIONS.map((opt) => (
              <Chip
                key={opt.value}
                active={filters.type === opt.value}
                onClick={() => setFilters((f) => ({ ...f, type: opt.value }))}
              >
                {opt.label}
              </Chip>
            ))}
          </div>
          <span className="ms-auto text-[11px] text-slate-400 shrink-0 font-semibold">
            {shownCount} פריטים
          </span>
        </div>

        {genres.length > 0 && (
          <ChipRow label="ז'אנר">
            {genres.map((g) => (
              <Chip key={g} active={filters.genre === g} onClick={() => toggle('genre', g)}>
                {g}
              </Chip>
            ))}
          </ChipRow>
        )}

        <ChipRow label="זמין ב־">
          {PLATFORMS.map((p) => (
            <Chip
              key={p.id}
              color={p.color}
              active={filters.platform === p.id}
              onClick={() => toggle('platform', p.id)}
            >
              {p.label}
            </Chip>
          ))}
        </ChipRow>
      </div>
    </div>
  )
}
