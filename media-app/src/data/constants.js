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
}

export const TYPE_BADGE_STYLE = {
  book: 'bg-amber-100 text-amber-800',
  movie: 'bg-indigo-100 text-indigo-700',
  series: 'bg-teal-100 text-teal-700',
  place: 'bg-emerald-100 text-emerald-700',
  recipe: 'bg-rose-100 text-rose-700',
  product: 'bg-sky-100 text-sky-700',
}

export const CREATOR_LABEL = { book: 'מחבר/ת', movie: 'במאי/ת', series: 'יוצר/ת' }

// חמש קטגוריות האפליקציה — מסך הבית והניווט נבנים מכאן
export const CATEGORIES = [
  {
    id: 'books',
    label: 'קריאה',
    sub: 'ספרים',
    emoji: '📚',
    types: ['book'],
    gradient: 'from-amber-400 to-orange-500',
  },
  {
    id: 'screen',
    label: 'צפייה',
    sub: 'סרטים וסדרות',
    emoji: '🎬',
    types: ['movie', 'series'],
    gradient: 'from-indigo-500 to-violet-600',
  },
  {
    id: 'places',
    label: 'בילויים',
    sub: 'טיולים ומקומות',
    emoji: '🌄',
    types: ['place'],
    gradient: 'from-emerald-400 to-teal-600',
  },
  {
    id: 'recipes',
    label: 'מתכונים',
    sub: 'מהמלצות ששלחו לי',
    emoji: '🍳',
    types: ['recipe'],
    gradient: 'from-rose-400 to-pink-600',
  },
  {
    id: 'products',
    label: 'מוצרים',
    sub: 'קניות מומלצות',
    emoji: '🛍️',
    types: ['product'],
    gradient: 'from-sky-500 to-blue-600',
  },
]

export const CATEGORY_BY_ID = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]))

// תוויות סטטוס מותאמות לקטגוריה (הערך השמור זהה, רק התצוגה משתנה)
const STATUS_LABELS = {
  place: { 'רוצה': 'רוצים ללכת', 'בתהליך': 'בתכנון', 'הושלם': 'היינו', 'נטשתי': 'ירד מהפרק' },
  recipe: { 'רוצה': 'לנסות', 'בתהליך': 'בהכנה', 'הושלם': 'ניסינו', 'נטשתי': 'לא עבד' },
  product: { 'רוצה': 'לקנות', 'בתהליך': 'בהתלבטות', 'הושלם': 'נקנה', 'נטשתי': 'ויתרנו' },
}

export const statusLabel = (type, status) => STATUS_LABELS[type]?.[status] || status
