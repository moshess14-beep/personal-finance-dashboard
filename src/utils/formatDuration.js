// Formats a number of months as a Hebrew duration string, handling the
// dual-form grammar Hebrew requires for exactly two of something (שנתיים,
// חודשיים - not "2 שנים"/"2 חודשים").
export function formatMonthsAsDuration(totalMonths) {
  if (totalMonths == null) return null
  if (totalMonths <= 0) return 'כבר עכשיו'

  const years = Math.floor(totalMonths / 12)
  const months = totalMonths % 12

  const yearsText = years === 0 ? '' : years === 1 ? 'שנה' : years === 2 ? 'שנתיים' : `${years} שנים`
  const monthsText = months === 0 ? '' : months === 1 ? 'חודש' : months === 2 ? 'חודשיים' : `${months} חודשים`

  if (yearsText && monthsText) return `${yearsText} ו${monthsText}`
  return yearsText || monthsText
}
