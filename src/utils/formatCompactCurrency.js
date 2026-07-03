import { formatCurrency } from './formatCurrency'

// Built on Intl.NumberFormat (like formatCurrency) rather than manual string
// concatenation - manually building "₪-460K" breaks in RTL: the browser's
// bidi algorithm reorders the minus sign and digits unpredictably when a
// plain '-' is mixed with LTR digits inside RTL text. Intl's currency
// formatter inserts the correct directional marks automatically.
const compactK = new Intl.NumberFormat('he-IL', {
  style: 'currency',
  currency: 'ILS',
  notation: 'compact',
  maximumFractionDigits: 0,
})
const compactM = new Intl.NumberFormat('he-IL', {
  style: 'currency',
  currency: 'ILS',
  notation: 'compact',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

export function formatCompactCurrency(value) {
  const n = Number(value) || 0
  const abs = Math.abs(n)
  if (abs >= 1_000_000) return compactM.format(n)
  if (abs >= 1_000) return compactK.format(n)
  return formatCurrency(n)
}
