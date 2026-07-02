import { formatCurrency } from './formatCurrency'

export function formatCompactCurrency(value) {
  const n = Number(value) || 0
  const abs = Math.abs(n)
  if (abs >= 1_000_000) return `₪${(n / 1_000_000).toFixed(2).replace(/\.?0+$/, '')}M`
  if (abs >= 1_000) return `₪${Math.round(n / 1000)}K`
  return formatCurrency(n)
}
