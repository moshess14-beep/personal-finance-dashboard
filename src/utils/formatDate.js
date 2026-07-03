const dateFormatter = new Intl.DateTimeFormat('he-IL', { day: 'numeric', month: 'long' })
const dateFormatterWithYear = new Intl.DateTimeFormat('he-IL', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

export function formatRelativeDate(isoString) {
  if (!isoString) return ''
  const date = new Date(isoString)
  const now = new Date()
  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const diffDays = Math.round((startOfDay(now) - startOfDay(date)) / 86_400_000)

  if (diffDays === 0) return 'היום'
  if (diffDays === 1) return 'אתמול'
  if (diffDays > 1 && diffDays < 7) return `לפני ${diffDays} ימים`

  const formatter = date.getFullYear() === now.getFullYear() ? dateFormatter : dateFormatterWithYear
  return formatter.format(date)
}
