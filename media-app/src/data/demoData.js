// נתוני דוגמה — משמשים במצב הדגמה (Artifact) וכן בכפתור "טען נתוני דוגמה" בהגדרות

const now = Date.now()
const day = 24 * 60 * 60 * 1000

export const demoItems = [
  {
    id: 'demo-b1',
    type: 'book',
    titleHe: 'קיצור תולדות האנושות',
    titleOriginal: 'Sapiens',
    creator: 'יובל נח הררי',
    year: 2011,
    pages: 464,
    genres: ['עיון', 'היסטוריה'],
    summary: 'מסע מרתק בתולדות המין האנושי — מהמהפכה הקוגניטיבית ועד למהפכה המדעית.',
    status: 'הושלם',
    myRating: 5,
    identification: 'confirmed',
    availability: [],
    createdAt: now - 40 * day,
  },
  {
    id: 'demo-b2',
    type: 'book',
    titleHe: 'האלכימאי',
    titleOriginal: 'O Alquimista',
    creator: 'פאולו קואלו',
    year: 1988,
    pages: 167,
    genres: ['פרוזה', 'מסע רוחני'],
    summary: 'סיפורו של סנטיאגו, רועה צאן אנדלוסי שיוצא למסע בעקבות חלום אל הפירמידות במצרים.',
    status: 'רוצה',
    identification: 'confirmed',
    availability: [],
    createdAt: now - 12 * day,
  },
  {
    id: 'demo-b3',
    type: 'book',
    titleHe: '1984',
    titleOriginal: 'Nineteen Eighty-Four',
    creator: "ג'ורג' אורוול",
    year: 1949,
    pages: 328,
    genres: ['מדע בדיוני', 'קלאסיקה'],
    summary: 'רומן דיסטופי על משטר טוטליטרי שמפקח על כל צעד ומחשבה של אזרחיו.',
    status: 'בתהליך',
    identification: 'confirmed',
    availability: [],
    createdAt: now - 8 * day,
  },
  {
    id: 'demo-b4',
    type: 'book',
    titleHe: 'הכוח של הרגל',
    titleOriginal: 'The Power of Habit',
    creator: "צ'ארלס דוהיג",
    year: 2012,
    pages: 371,
    genres: ['עיון', 'פסיכולוגיה'],
    summary: 'איך הרגלים נוצרים, איך הם עובדים במוח, ואיך אפשר לשנות אותם.',
    status: 'רוצה',
    identification: 'confirmed',
    availability: [],
    createdAt: now - 3 * day,
  },
  {
    id: 'demo-m1',
    type: 'movie',
    titleHe: 'פורסט גאמפ',
    titleOriginal: 'Forrest Gump',
    creator: 'רוברט זמקיס',
    year: 1994,
    runtimeMinutes: 142,
    genres: ['דרמה', 'רומנטיקה'],
    summary: 'סיפור חייו יוצא הדופן של פורסט גאמפ, שנקלע בתמימותו לרגעים המכוננים של ההיסטוריה האמריקאית.',
    status: 'הושלם',
    myRating: 5,
    identification: 'confirmed',
    availability: [
      { platform: 'netflix', kind: 'מנוי', manual: false },
      { platform: 'appletv', kind: 'השכרה', manual: false },
    ],
    createdAt: now - 30 * day,
  },
  {
    id: 'demo-m2',
    type: 'movie',
    titleHe: 'לה לה לנד',
    titleOriginal: 'La La Land',
    creator: "דמיאן שאזל",
    year: 2016,
    runtimeMinutes: 128,
    genres: ['רומנטיקה', 'מוזיקה'],
    summary: 'פסנתרן ג׳אז ושחקנית שאפתנית מתאהבים בלוס אנג׳לס, בין חלומות לקריירה.',
    status: 'רוצה',
    identification: 'confirmed',
    availability: [{ platform: 'amazon', kind: 'מנוי', manual: false }],
    createdAt: now - 10 * day,
  },
  {
    id: 'demo-m3',
    type: 'movie',
    titleHe: 'בחזרה לעתיד',
    titleOriginal: 'Back to the Future',
    creator: 'רוברט זמקיס',
    year: 1985,
    runtimeMinutes: 116,
    genres: ['מדע בדיוני', 'הרפתקאות'],
    summary: 'מרטי מקפליי נשלח בטעות שלושים שנה אחורה בזמן במכונת זמן שבנה המדען דוק בראון.',
    status: 'רוצה',
    identification: 'confirmed',
    availability: [{ platform: 'netflix', kind: 'מנוי', manual: false }],
    createdAt: now - 6 * day,
  },
  {
    id: 'demo-s1',
    type: 'series',
    titleHe: 'שטיסל',
    titleOriginal: 'Shtisel',
    creator: 'יהונתן אינדורסקי ואורי אלון',
    year: 2013,
    seasons: 3,
    episodeRuntimeMinutes: 45,
    genres: ['דרמה'],
    summary: 'חיי משפחה חרדית בשכונת גאולה בירושלים — בין מסורת, אהבה ואמנות.',
    status: 'הושלם',
    myRating: 5,
    identification: 'confirmed',
    availability: [{ platform: 'netflix', kind: 'מנוי', manual: false }],
    createdAt: now - 20 * day,
  },
  {
    id: 'demo-s2',
    type: 'series',
    titleHe: 'פאודה',
    titleOriginal: 'Fauda',
    creator: 'ליאור רז ואבי יששכרוף',
    year: 2015,
    seasons: 4,
    episodeRuntimeMinutes: 40,
    genres: ['מתח', 'אקשן'],
    summary: 'יחידת מסתערבים ישראלית בפעילות מבצעית — מתח, נאמנות ומחיר אישי.',
    status: 'בתהליך',
    identification: 'confirmed',
    availability: [{ platform: 'netflix', kind: 'מנוי', manual: false }],
    createdAt: now - 5 * day,
  },
  {
    id: 'demo-p1',
    type: 'place',
    titleHe: 'גן לאומי עין גדי',
    address: 'עין גדי, מדבר יהודה',
    region: 'דרום',
    placeTypes: ['טבע ומסלולים'],
    audiences: ['עם הילדים', 'כל המשפחה'],
    summary: 'מסלולי מים ומפלים בלב המדבר — נחל דוד ונחל ערוגות.',
    status: 'הושלם',
    myRating: 5,
    identification: 'confirmed',
    createdAt: now - 15 * day,
  },
  {
    id: 'demo-p2',
    type: 'place',
    titleHe: 'מוזיאון המדע בלומפילד',
    address: 'רחוב המוזיאונים 3, ירושלים',
    region: 'ירושלים והסביבה',
    placeTypes: ['מוזיאון ותרבות', 'אטרקציה'],
    audiences: ['עם הילדים'],
    summary: 'מוזיאון אינטראקטיבי — מומלץ ליום גשום עם הילדים.',
    status: 'רוצה',
    identification: 'manual',
    createdAt: now - 4 * day,
  },
  {
    id: 'demo-p3',
    type: 'place',
    titleHe: 'צימר נוף לחרמון',
    address: 'נווה אטי"ב, רמת הגולן',
    region: 'צפון',
    placeTypes: ['לינה'],
    audiences: ['זוגי'],
    summary: "המלצה מחברים — ג'קוזי ונוף מטורף.",
    status: 'רוצה',
    identification: 'manual',
    createdAt: now - 2 * day,
  },
  {
    id: 'demo-r1',
    type: 'recipe',
    titleHe: 'שקשוקה עם פטה וזעתר',
    dishType: 'ארוחת בוקר',
    kashrut: 'חלבי',
    tags: ['מהיר וקל', 'ילדים אוהבים'],
    sourceText: 'שקשוקה מנצחת: רסק, 4 ביצים, פטה מעל, זעתר בסוף. 20 דקות והכול מוכן.',
    status: 'הושלם',
    myRating: 4,
    identification: 'manual',
    createdAt: now - 9 * day,
  },
  {
    id: 'demo-r2',
    type: 'recipe',
    titleHe: 'עוגת שוקולד בלי קמח',
    dishType: 'קינוח',
    kashrut: 'פרווה',
    tags: ['אירוח', 'אפייה'],
    sourceText: 'עוגת השוקולד שכולם מבקשים את המתכון — בלי קמח, 5 מרכיבים בלבד.',
    status: 'רוצה',
    identification: 'manual',
    createdAt: now - day,
  },
  {
    id: 'demo-pr1',
    type: 'product',
    titleHe: 'קומקום שקט עם בקרת טמפרטורה',
    productCategory: 'מטבח',
    price: 189,
    store: 'KSP',
    summary: 'ההמלצה מהקבוצה של השכונה — שקט ומדויק לתה.',
    status: 'רוצה',
    identification: 'manual',
    createdAt: now - 6 * day,
  },
  {
    id: 'demo-pr2',
    type: 'product',
    titleHe: 'בקבוק טרמי לילדים',
    productCategory: 'ילדים',
    price: 45,
    store: 'עזריאלי אונליין',
    status: 'הושלם',
    myRating: 4,
    identification: 'manual',
    createdAt: now - 18 * day,
  },
  {
    id: 'demo-a1',
    type: 'artist',
    titleHe: 'נועה קירל',
    genres: ['פופ'],
    summary: 'המלצה מחברה — הסינגלים החדשים שווים האזנה.',
    status: 'רוצה',
    identification: 'manual',
    createdAt: now - 7 * day,
  },
  {
    id: 'demo-a2',
    type: 'artist',
    titleHe: 'דודו טסה',
    genres: ["ג'אז", 'מזרחית'],
    status: 'הושלם',
    myRating: 5,
    identification: 'manual',
    createdAt: now - 25 * day,
  },
  {
    id: 'demo-sh1',
    type: 'show',
    titleHe: 'עידן רייכל בהיכל התרבות',
    showType: 'הופעה מוזיקלית',
    creator: 'עידן רייכל',
    eventDate: new Date(now + 12 * day).toISOString().slice(0, 10),
    eventTime: '21:00',
    address: 'היכל התרבות, תל אביב',
    price: 220,
    status: 'בתהליך',
    identification: 'manual',
    createdAt: now - 3 * day,
  },
  {
    id: 'demo-sh2',
    type: 'show',
    titleHe: 'המלט — תיאטרון הבימה',
    showType: 'תיאטרון',
    eventDate: new Date(now + 30 * day).toISOString().slice(0, 10),
    address: 'תיאטרון הבימה, תל אביב',
    price: 160,
    status: 'רוצה',
    identification: 'manual',
    createdAt: now - day,
  },
  {
    id: 'demo-sh3',
    type: 'show',
    titleHe: 'פסטיבל קולנוע ירושלים — הקרנת חוץ',
    showType: 'הקרנה / קולנוע',
    eventDate: new Date(now - 5 * day).toISOString().slice(0, 10),
    address: 'סינמטק ירושלים',
    status: 'הושלם',
    myRating: 4,
    identification: 'manual',
    createdAt: now - 20 * day,
  },
]

// טקסט שמוחזר מ"קריאת תמונה" מדומה במצב הדגמה
export const demoOcrText = 'חייבים לראות!! 🎬\nפורסט גאמפ\nסרט מושלם לערב שישי'

// מאגר מועמדים לחיפוש מדומה
const demoPool = {
  books: [
    {
      source: 'demo', type: 'book', titleHe: 'פורסט גאמפ (הספר)', titleOriginal: 'Forrest Gump',
      creator: 'וינסטון גרום', year: 1986, pages: 228, genres: ['פרוזה'],
      summary: 'הרומן הסאטירי שעליו מבוסס הסרט המפורסם.',
    },
    {
      source: 'demo', type: 'book', titleHe: 'הנסיך הקטן', titleOriginal: 'Le Petit Prince',
      creator: 'אנטואן דה סנט-אכזופרי', year: 1943, pages: 96, genres: ['קלאסיקה'],
      summary: 'נסיך קטן מכוכב רחוק מלמד טייס שהתרסק במדבר מה באמת חשוב בחיים.',
    },
    {
      source: 'demo', type: 'book', titleHe: 'סיפור על אהבה וחושך', creator: 'עמוס עוז',
      year: 2002, pages: 593, genres: ['ביוגרפיה', 'פרוזה'],
      summary: 'סיפורה של משפחה ירושלמית אחת וסיפורה של מדינה בראשיתה.',
    },
  ],
  screen: [
    {
      source: 'demo', type: 'movie', titleHe: 'פורסט גאמפ', titleOriginal: 'Forrest Gump',
      creator: 'רוברט זמקיס', year: 1994, runtimeMinutes: 142, genres: ['דרמה', 'רומנטיקה'],
      summary: 'סיפור חייו יוצא הדופן של פורסט גאמפ.',
      availability: [
        { platform: 'netflix', kind: 'מנוי', manual: false },
        { platform: 'appletv', kind: 'השכרה', manual: false },
      ],
    },
    {
      source: 'demo', type: 'series', titleHe: 'הכתר', titleOriginal: 'The Crown',
      creator: 'פיטר מורגן', year: 2016, seasons: 6, episodeRuntimeMinutes: 58, genres: ['דרמה', 'היסטוריה'],
      summary: 'חייה של המלכה אליזבת השנייה, מחתונתה ועד ימינו.',
      availability: [{ platform: 'netflix', kind: 'מנוי', manual: false }],
    },
    {
      source: 'demo', type: 'movie', titleHe: 'קזבלנקה', titleOriginal: 'Casablanca',
      creator: 'מייקל קרטיז', year: 1942, runtimeMinutes: 102, genres: ['רומנטיקה', 'קלאסיקה'],
      summary: 'ריק בליין נאלץ לבחור בין אהבתו לבין עזרה לבעלה של אהובתו להימלט מקזבלנקה.',
      availability: [{ platform: 'appletv', kind: 'השכרה', manual: false }],
    },
  ],
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

export async function demoSearch(query) {
  await sleep(700)
  const q = query.trim()
  const match = (arr) =>
    arr.filter(
      (c) =>
        c.titleHe.includes(q) ||
        q.includes(c.titleHe.replace(/\s*\(.*\)$/, '')) ||
        (c.titleOriginal || '').toLowerCase().includes(q.toLowerCase()),
    )
  let books = match(demoPool.books)
  let screen = match(demoPool.screen)
  if (books.length === 0 && screen.length === 0) {
    books = demoPool.books.slice(0, 2)
    screen = demoPool.screen.slice(0, 2)
  }
  return { books, screen }
}

export async function demoOcr(onProgress) {
  for (let i = 1; i <= 10; i++) {
    await sleep(130)
    onProgress(i / 10)
  }
  return demoOcrText
}

// רענון זמינות מדומה במצב הדגמה
export async function demoAvailability(item) {
  await sleep(900)
  if (item.availability?.length) return item.availability.filter((a) => !a.manual)
  return [{ platform: 'netflix', kind: 'מנוי', manual: false }]
}

// ניתוח תמונה מדומה במצב הדגמה (במקום Gemini)
export async function demoAnalyze() {
  await sleep(1400)
  return {
    category: 'movie',
    title: 'פורסט גאמפ',
    altTitle: 'Forrest Gump',
    creator: '',
    year: 1994,
    address: '',
    price: null,
    store: '',
    rawText: demoOcrText,
    confidence: 'high',
  }
}

// חיפוש כתובת מדומה במצב הדגמה (במקום Nominatim)
export async function demoPlaces(query) {
  await sleep(600)
  return [
    { name: query, address: `${query}, ישראל` },
    { name: `${query} (אתר נוסף)`, address: `${query}, אזור הצפון, ישראל` },
  ]
}
