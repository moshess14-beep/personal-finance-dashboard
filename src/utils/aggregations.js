export function summarizeByCategory(items, categories, mode = 'light', valueKey = 'value') {
  const totalsById = new Map()
  for (const item of items) {
    const prev = totalsById.get(item.category) || 0
    totalsById.set(item.category, prev + Number(item[valueKey] || 0))
  }
  const grandTotal = [...totalsById.values()].reduce((a, b) => a + b, 0)

  return categories
    .map((c) => {
      const total = totalsById.get(c.id) || 0
      return {
        id: c.id,
        label: c.label,
        color: c.color[mode],
        total,
        percent: grandTotal > 0 ? (total / grandTotal) * 100 : 0,
      }
    })
    .filter((c) => c.total > 0)
    .sort((a, b) => b.total - a.total)
}
