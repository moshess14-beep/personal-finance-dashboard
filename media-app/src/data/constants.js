export const STATUSES = ['רוצה', 'בתהליך', 'הושלם', 'נטשתי']

export const STATUS_STYLE = {
  'רוצה': 'bg-slate-100 text-slate-600',
  'בתהליך': 'bg-amber-100 text-amber-700',
  'הושלם': 'bg-emerald-100 text-emerald-700',
  'נטשתי': 'bg-rose-100 text-rose-600',
}

export const TYPE_LABEL = {
  book: 'ספר',
  movie: 'סרט',
  series: 'סדרה',
  place: 'בילוי',
  recipe: 'מתכון',
  product: 'מוצר',
  artist: 'אמן',
  show: 'הופעה',
}

// פלטת התגים — משפחת כחול/שחור/ירקרק אחידה ואלגנטית
export const TYPE_BADGE_STYLE = {
  book: 'bg-slate-200 text-slate-700',
  movie: 'bg-blue-100 text-blue-800',
  series: 'bg-cyan-100 text-cyan-800',
  place: 'bg-emerald-100 text-emerald-800',
  recipe: 'bg-teal-100 text-teal-800',
  product: 'bg-sky-100 text-sky-800',
  artist: 'bg-blue-200 text-blue-900',
  show: 'bg-teal-200 text-teal-900',
}

export const CREATOR_LABEL = { book: 'מחבר/ת', movie: 'במאי/ת', series: 'יוצר/ת', show: 'מבצע/ת' }

// שש קטגוריות האפליקציה — מסך הבית והניווט נבנים מכאן
export const CATEGORIES = [
  {
    id: 'books',
    label: 'קריאה',
    sub: 'ספרים',
    emoji: '📚',
    types: ['book'],
    gradient: 'from-slate-700 to-slate-900',
  },
  {
    id: 'screen',
    label: 'צפייה',
    sub: 'סרטים וסדרות',
    emoji: '🎬',
    types: ['movie', 'series'],
    gradient: 'from-blue-800 to-slate-950',
  },
  {
    id: 'places',
    label: 'בילויים',
    sub: 'טיולים ומקומות',
    emoji: '🌄',
    types: ['place'],
    gradient: 'from-teal-600 to-emerald-950',
  },
  {
    id: 'recipes',
    label: 'מתכונים',
    sub: 'מהמלצות ששלחו לי',
    emoji: '🍳',
    types: ['recipe'],
    gradient: 'from-cyan-700 to-slate-900',
  },
  {
    id: 'products',
    label: 'מוצרים',
    sub: 'קניות מומלצות',
    emoji: '🛍️',
    types: ['product'],
    gradient: 'from-sky-700 to-blue-950',
  },
  {
    id: 'live',
    label: 'הופעות חיות',
    sub: 'מוזיקה, תיאטרון והקרנות',
    emoji: '🎤',
    types: ['artist', 'show'],
    gradient: 'from-emerald-600 to-teal-950',
  },
]

export const CATEGORY_BY_ID = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]))

// תוויות סטטוס מותאמות לקטגוריה (הערך השמור זהה, רק התצוגה משתנה)
const STATUS_LABELS = {
  place: { 'רוצה': 'רוצים ללכת', 'בתהליך': 'בתכנון', 'הושלם': 'היינו', 'נטשתי': 'ירד מהפרק' },
  recipe: { 'רוצה': 'לנסות', 'בתהליך': 'בהכנה', 'הושלם': 'ניסינו', 'נטשתי': 'לא עבד' },
  product: { 'רוצה': 'לקנות', 'בתהליך': 'בהתלבטות', 'הושלם': 'נקנה', 'נטשתי': 'ויתרנו' },
  artist: { 'רוצה': 'לגלות', 'בתהליך': 'מקשיב/ה', 'הושלם': 'מכיר/ה', 'נטשתי': 'לא בשבילי' },
  show: { 'רוצה': 'רוצים ללכת', 'בתהליך': 'נרכש כרטיס', 'הושלם': 'היינו', 'נטשתי': 'ירד מהפרק' },
}

export const statusLabel = (type, status) => STATUS_LABELS[type]?.[status] || status

// מיון בתוך קטגוריה
export const SORT_OPTIONS = [
  { value: 'recent', label: 'החדש ביותר' },
  { value: 'title', label: 'לפי שם' },
  { value: 'rating', label: 'לפי דירוג' },
]

export const SORT_OPTIONS_LIVE = [
  { value: 'date', label: 'לפי תאריך' },
  ...SORT_OPTIONS,
]
