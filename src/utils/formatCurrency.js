const formatter = new Intl.NumberFormat('he-IL', {
  style: 'currency',
  currency: 'ILS',
  maximumFractionDigits: 0,
})

export function formatCurrency(value) {
  return formatter.format(Number(value) || 0)
}
