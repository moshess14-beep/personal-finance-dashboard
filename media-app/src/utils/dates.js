// תווית ימים עד אירוע, לפי תאריך בפורמט YYYY-MM-DD
export function daysUntilLabel(dateStr) {
  if (!dateStr) return null
  const target = new Date(`${dateStr}T00:00:00`)
  if (Number.isNaN(target.getTime())) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const days = Math.round((target - today) / 86400000)
  if (days < 0) return { text: 'עבר', tone: 'past' }
  if (days === 0) return { text: 'היום!', tone: 'today' }
  if (days === 1) return { text: 'מחר', tone: 'soon' }
  if (days <= 7) return { text: `בעוד ${days} ימים`, tone: 'soon' }
  return { text: formatEventDate(dateStr), tone: 'later' }
}

export function formatEventDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(`${dateStr}T00:00:00`)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })
}
