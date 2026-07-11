// מיפוי מזהי ז'אנרים של TMDB לעברית (תוצאות חיפוש מחזירות מזהים בלבד)
export const TMDB_GENRES_HE = {
  movie: {
    28: 'אקשן',
    12: 'הרפתקאות',
    16: 'אנימציה',
    35: 'קומדיה',
    80: 'פשע',
    99: 'דוקומנטרי',
    18: 'דרמה',
    10751: 'משפחה',
    14: 'פנטזיה',
    36: 'היסטוריה',
    27: 'אימה',
    10402: 'מוזיקה',
    9648: 'מסתורין',
    10749: 'רומנטיקה',
    878: 'מדע בדיוני',
    10770: 'סרט טלוויזיה',
    53: 'מותחן',
    10752: 'מלחמה',
    37: 'מערבון',
  },
  tv: {
    10759: 'אקשן והרפתקאות',
    16: 'אנימציה',
    35: 'קומדיה',
    80: 'פשע',
    99: 'דוקומנטרי',
    18: 'דרמה',
    10751: 'משפחה',
    10762: 'ילדים',
    9648: 'מסתורין',
    10763: 'חדשות',
    10764: 'ריאליטי',
    10765: 'מד"ב ופנטזיה',
    10766: 'אופרת סבון',
    10767: 'אירוח',
    10768: 'מלחמה ופוליטיקה',
    37: 'מערבון',
  },
}

// מיפוי קודי ז'אנר של JustWatch לעברית
export const JW_GENRES_HE = {
  act: 'אקשן',
  ani: 'אנימציה',
  cmy: 'קומדיה',
  crm: 'פשע',
  doc: 'דוקומנטרי',
  drm: 'דרמה',
  eur: 'אירופאי',
  fml: 'משפחה',
  fnt: 'פנטזיה',
  hst: 'היסטוריה',
  hrr: 'אימה',
  msc: 'מוזיקה',
  mys: 'מסתורין',
  rma: 'רומנטיקה',
  scf: 'מדע בדיוני',
  spt: 'ספורט',
  trl: 'מותחן',
  war: 'מלחמה',
  wsn: 'מערבון',
  rly: 'ריאליטי',
}

// תרגום קטגוריות נפוצות של Google Books לעברית
const GBOOKS_CATEGORY_HE = {
  'fiction': 'פרוזה',
  'juvenile fiction': 'ילדים ונוער',
  'juvenile nonfiction': 'עיון לילדים ונוער',
  'biography & autobiography': 'ביוגרפיה',
  'history': 'היסטוריה',
  'business & economics': 'כלכלה ועסקים',
  'self-help': 'עזרה עצמית',
  'psychology': 'פסיכולוגיה',
  'philosophy': 'פילוסופיה',
  'religion': 'דת ורוח',
  'science': 'מדע',
  'social science': 'חברה',
  'cooking': 'בישול',
  'travel': 'טיולים',
  'poetry': 'שירה',
  'drama': 'דרמה',
  'comics & graphic novels': 'קומיקס',
  'literary criticism': 'ביקורת ספרות',
  'political science': 'פוליטיקה',
  'health & fitness': 'בריאות',
}

export function translateBookCategory(cat) {
  if (!cat) return null
  const key = cat.split('/')[0].trim().toLowerCase()
  return GBOOKS_CATEGORY_HE[key] || cat
}
