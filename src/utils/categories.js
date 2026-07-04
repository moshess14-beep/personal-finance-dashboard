// Chart colors follow a validated 8-hue categorical palette (see dataviz skill):
// fixed order, checked for CVD-safe adjacency + contrast in light & dark mode.
// Categories beyond the 8-hue budget fold into a shared muted "other" tone —
// they stay distinct rows in the data (name + icon), just not distinct hues.
export const MUTED_COLOR = { light: '#78716c', dark: '#a8a29e' }
const MUTED = MUTED_COLOR

// These are seed/default lists only, used to build the store's initial
// `categories` state. Once loaded, the store's copies are the live data -
// users can rename, hide, delete or add to them. Nothing in the app should
// import these directly except the store itself.
export const DEFAULT_ASSET_CATEGORIES = [
  { id: 'realEstate', label: 'נדל"ן', color: { light: '#2a78d6', dark: '#3987e5' } },
  { id: 'bankAccounts', label: 'חשבונות בנק', color: { light: '#1baf7a', dark: '#199e70' } },
  { id: 'pension', label: 'פנסיה', color: { light: '#eda100', dark: '#c98500' } },
  { id: 'cash', label: 'מזומן', color: { light: '#008300', dark: '#008300' } },
  { id: 'kerenHishtalmut', label: 'קרן השתלמות', color: { light: '#4a3aa7', dark: '#9085e9' } },
  { id: 'gemel', label: 'קופות גמל', color: { light: '#e87ba4', dark: '#d55181' } },
  { id: 'childSavings', label: 'חיסכון לכל ילד', color: { light: '#eb6834', dark: '#d95926' } },
  { id: 'investments', label: 'תיק השקעות', color: MUTED },
  { id: 'vehicles', label: 'רכבים', color: MUTED },
  { id: 'expensiveEquipment', label: 'ציוד יקר', color: MUTED },
  { id: 'other', label: 'אחר', color: MUTED },
]

export const DEFAULT_LIABILITY_CATEGORIES = [
  { id: 'mortgage', label: 'משכנתא', color: { light: '#e34948', dark: '#e66767' } },
  { id: 'loan', label: 'הלוואה', color: { light: '#eb6834', dark: '#d95926' } },
  { id: 'carLoan', label: 'הלוואת רכב', color: { light: '#e87ba4', dark: '#d55181' } },
  { id: 'familyLoan', label: 'הלוואת משפחה', color: { light: '#4a3aa7', dark: '#9085e9' } },
  { id: 'other', label: 'אחר', color: MUTED },
]

export const DEFAULT_SAVINGS_CATEGORIES = [
  { id: 'pension', label: 'פנסיה', color: { light: '#eda100', dark: '#c98500' } },
  { id: 'kerenHishtalmut', label: 'קרן השתלמות', color: { light: '#4a3aa7', dark: '#9085e9' } },
  { id: 'childSavings', label: 'חיסכון לכל ילד', color: { light: '#eb6834', dark: '#d95926' } },
  { id: 'loanPrincipal', label: 'החזר קרן הלוואה', color: { light: '#1baf7a', dark: '#199e70' } },
  { id: 'independentDeposit', label: 'הפקדה עצמאית', color: { light: '#e87ba4', dark: '#d55181' } },
  { id: 'other', label: 'אחר', color: MUTED },
]

export const DEFAULT_INCOME_CATEGORIES = [
  { id: 'work', label: 'עבודה', color: { light: '#2a78d6', dark: '#3987e5' } },
  { id: 'business', label: 'עסק', color: { light: '#1baf7a', dark: '#199e70' } },
  { id: 'rental', label: 'שכירות', color: { light: '#eda100', dark: '#c98500' } },
  { id: 'benefits', label: 'קצבאות', color: { light: '#008300', dark: '#008300' } },
  { id: 'capitalMarket', label: 'שוק ההון', color: { light: '#4a3aa7', dark: '#9085e9' } },
  { id: 'other', label: 'אחר', color: MUTED },
]

export function getCategoryColor(categories, id, mode = 'light') {
  return categories.find((c) => c.id === id)?.color?.[mode] ?? MUTED[mode]
}
