// Per-item comparison of a full snapshot against the one before it, so the
// Snapshots screen can show *what moved* the net worth between two closes -
// not just the headline delta. Only works when both snapshots carry frozen
// item breakdowns (a "full" close). Totals-only snapshots (manual backfills or
// migrated V1.2 points) return { hasBreakdown: false }.
//
// `impact` is the net-worth effect of each row: an asset going up helps, a
// liability going up hurts. Callers color by impact, not by the raw delta.
export function diffSnapshots(curr, prev) {
  if (!curr || !Array.isArray(curr.assets)) return { hasBreakdown: false, rows: [] }
  if (!prev || !Array.isArray(prev.assets)) return { hasBreakdown: false, rows: [] }

  const prevValue = new Map()
  for (const a of prev.assets || []) prevValue.set(a.id, Number(a.value || 0))
  for (const l of prev.liabilities || []) prevValue.set(l.id, Number(l.value || 0))

  const rows = []
  const collect = (list, kind) => {
    for (const it of list || []) {
      const from = prevValue.has(it.id) ? prevValue.get(it.id) : 0
      const to = Number(it.value || 0)
      if (from === to) continue
      const delta = to - from
      rows.push({
        id: it.id,
        name: it.name,
        kind,
        from,
        to,
        delta,
        impact: kind === 'liability' ? -delta : delta,
        isNew: !prevValue.has(it.id),
      })
    }
  }
  collect(curr.assets, 'asset')
  collect(curr.liabilities, 'liability')

  rows.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
  return { hasBreakdown: true, rows }
}
