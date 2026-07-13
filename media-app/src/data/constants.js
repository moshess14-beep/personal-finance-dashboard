// תוויות סוג פריט. 'note' הוא הסוג הגנרי (בילויים/מתכונים/מוצרים/קטגוריות
// מותאמות-אישית) — בפועל תמיד מוצג לצידו שם הקטגוריה הספציפית שהמשתמש הגדיר.
export const TYPE_LABEL = {
  book: 'ספר',
  movie: 'סרט',
  series: 'סדרה',
  artist: 'אמן',
  show: 'הופעה',
  music: 'האזנה',
  note: 'פריט',
}

// פלטת התגים — משפחת כחול/שחור/ירקרק אחידה ואלגנטית
export const TYPE_BADGE_STYLE = {
  book: 'bg-slate-200 text-slate-700',
  movie: 'bg-blue-100 text-blue-800',
  series: 'bg-cyan-100 text-cyan-800',
  artist: 'bg-blue-200 text-blue-900',
  show: 'bg-teal-200 text-teal-900',
  music: 'bg-indigo-100 text-indigo-800',
  note: 'bg-slate-200 text-slate-700',
}

export const CREATOR_LABEL = {
  book: 'מחבר/ת',
  movie: 'במאי/ת',
  series: 'יוצר/ת',
  show: 'מבצע/ת',
  music: 'אמן/ית',
}

// מיון בתוך קטגוריה
export const SORT_OPTIONS = [
  { value: 'recent', label: 'החדש ביותר' },
  { value: 'title', label: 'לפי שם' },
]

export const SORT_OPTIONS_LIVE = [{ value: 'date', label: 'לפי תאריך' }, ...SORT_OPTIONS]

// הפועל שמוצג בכפתור "סימון כ..." אחרי שההמלצה מומשה בפועל
export const DONE_VERB = {
  book: 'קראתי',
  movie: 'ראיתי',
  series: 'ראיתי',
  artist: 'הכרתי',
  show: 'הייתי',
  music: 'האזנתי',
  note: 'בוצע',
}

// קטגוריות ברירת מחדל — נטענות פעם אחת לתוך ה-store, ומשם המשתמש יכול
// לערוך שם/אימוג'י, למחוק (חוץ מ-builtin) ולהוסיף קטגוריות חדשות משלו.
// קטגוריית builtin=true מחוברת לסוגי פריט "חכמים" (חיפוש/AI ייעודי) ולא ניתנת
// למחיקה; קטגוריות רגילות תמיד מסוג הפריט הגנרי 'note'.
export const DEFAULT_CATEGORIES = [
  {
    id: 'books',
    label: 'קריאה',
    sub: 'ספרים',
    emoji: '📚',
    builtin: true,
    types: ['book'],
    gradient: 'from-slate-700 to-slate-900',
  },
  {
    id: 'screen',
    label: 'צפייה',
    sub: 'סרטים וסדרות',
    emoji: '🎬',
    builtin: true,
    types: ['movie', 'series'],
    gradient: 'from-blue-800 to-slate-950',
  },
  {
    id: 'listening',
    label: 'האזנה',
    sub: 'מוזיקה ופודקאסטים',
    emoji: '🎧',
    builtin: true,
    types: ['music'],
    gradient: 'from-indigo-700 to-slate-950',
  },
  {
    id: 'live',
    label: 'הופעות חיות',
    sub: 'מוזיקה, תיאטרון והקרנות',
    emoji: '🎤',
    builtin: true,
    types: ['artist', 'show'],
    gradient: 'from-emerald-600 to-teal-950',
  },
  {
    id: 'places',
    label: 'בילויים',
    sub: 'טיולים ומקומות',
    emoji: '🌄',
    builtin: false,
    types: ['note'],
    gradient: 'from-teal-600 to-emerald-950',
  },
  {
    id: 'recipes',
    label: 'מתכונים',
    sub: 'מהמלצות ששלחו לי',
    emoji: '🍳',
    builtin: false,
    types: ['note'],
    gradient: 'from-cyan-700 to-slate-900',
  },
  {
    id: 'products',
    label: 'מוצרים',
    sub: 'קניות מומלצות',
    emoji: '🛍️',
    builtin: false,
    types: ['note'],
    gradient: 'from-sky-700 to-blue-950',
  },
  {
    id: 'misc',
    label: 'שונות',
    sub: 'אפליקציות, בעלי מקצוע ועוד',
    emoji: '📌',
    builtin: false,
    types: ['note'],
    gradient: 'from-slate-600 to-slate-950',
  },
  {
    id: 'music-styles',
    label: 'סגנונות מוזיקה',
    sub: "ז'אנרים לגלות",
    emoji: '🎧',
    builtin: false,
    types: ['note'],
    gradient: 'from-indigo-700 to-slate-950',
  },
  {
    id: 'jewelry',
    label: 'תכשיטים',
    sub: 'עיצובים שאהבתי',
    emoji: '💍',
    builtin: false,
    types: ['note'],
    gradient: 'from-violet-800 to-slate-950',
  },
]

// גוונים להצעה בעת יצירת קטגוריה חדשה — אותה משפחה אלגנטית
export const GRADIENT_CHOICES = [
  'from-slate-700 to-slate-900',
  'from-blue-800 to-slate-950',
  'from-teal-600 to-emerald-950',
  'from-cyan-700 to-slate-900',
  'from-sky-700 to-blue-950',
  'from-emerald-600 to-teal-950',
  'from-indigo-700 to-slate-950',
  'from-violet-800 to-slate-950',
]
