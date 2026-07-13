// ניתוח תמונות והשלמת פרטים עם מודל AI (Gemini — מפתח חינמי מ-aistudio.google.com).
// המפתח נשמר מקומית בדפדפן בלבד. בלי מפתח האפליקציה נופלת ל-OCR מקומי.
import { DEMO } from './env'
import { resizeImage } from './images'
import { demoAnalyze } from '../data/demoData'

// גוגל מחליפה/מוציאה משימוש שמות מודל קונקרטיים עם הזמן (למשל gemini-1.5-flash).
// gemini-flash-latest הוא alias יציב שגוגל מתחזקת ומצביע תמיד על המודל המהיר הנוכחי —
// לכן הוא ראשון. דגמי ה-lite אחריו הם רשת הביטחון המרכזית: מכסה חינמית גדולה פי כמה
// ועומס נמוך בהרבה, כך שכשהמודל הראשי עמוס (503) או שמכסתו נגמרה (429) — עוברים
// אליהם אוטומטית באותה בקשה, והזיהוי ממשיך לעבוד.
const MODEL_CANDIDATES = [
  'gemini-flash-latest',
  'gemini-2.5-flash',
  'gemini-flash-lite-latest',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash',
]

// שגיאה עם פירוט טכני, כדי שאפשר יהיה להציג למשתמש מה בדיוק השתבש
export class AiError extends Error {
  constructor(message, detail) {
    super(message)
    this.detail = detail
  }
}

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta'

// תעבורת ה-AI. כברירת מחדל הבקשות עוברות דרך פונקציית Edge של Supabase שמחזיקה את מפתח
// ה-Gemini בשרת (מובנה, משותף לכל המשתמשים המחוברים) — כך שאיש לא צריך להזין מפתח בעצמו.
// אם משתמש בכל זאת הזין מפתח פרטי משלו, הבקשה יוצאת ישירות לגוגל עם המפתח הזה.
let aiProxy = null // { supabase, functionsUrl, anonKey } | null
export function setAiProxy(ctx) {
  aiProxy = ctx
}
// האם הזיהוי החכם זמין בכלל — מפתח פרטי, פרוקסי מחשבון מחובר, או מצב הדגמה
export function aiReady(ownKey) {
  return DEMO || !!ownKey || !!aiProxy
}

// מבצע בקשת HTTP ל-Gemini ומחזיר Response רגיל — ישירות עם מפתח פרטי, או דרך הפרוקסי.
// שני המסלולים מחזירים את אותו מבנה תשובה (ואת קוד הסטטוס המקורי), כך שכל לוגיקת
// הניתוח/הניסיון-החוזר/הגילוי שמעל נשארת זהה בלי קשר לאיזה מסלול נבחר.
async function geminiFetch(ownKey, path, init) {
  if (ownKey) {
    const sep = path.includes('?') ? '&' : '?'
    return fetch(`${GEMINI_BASE}/${path}${sep}key=${encodeURIComponent(ownKey)}`, init)
  }
  if (!aiProxy) {
    const e = new Error('no ai transport (not logged in and no key)')
    e.status = 0
    throw e
  }
  const {
    data: { session },
  } = await aiProxy.supabase.auth.getSession()
  const token = session?.access_token
  if (!token) {
    const e = new Error('not authenticated')
    e.status = 401
    throw e
  }
  return fetch(aiProxy.functionsUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: aiProxy.anonKey,
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ path, init: { method: init?.method || 'GET', body: init?.body || null } }),
  })
}

async function callModelRaw(model, apiKey, parts, maxOutputTokens, includeThinkingConfig, useSearch) {
  const generationConfig = {
    temperature: 0.1,
    maxOutputTokens,
  }
  // מצב חיפוש (Search Grounding) אינו נתמך יחד עם מצב JSON מובנה — לכן במצב חיפוש
  // מבקשים JSON בפרומפט בלבד ומחלצים אותו מהטקסט עם parseJsonLoose.
  if (!useSearch) generationConfig.responseMimeType = 'application/json'
  // דגמי 2.5 מפעילים ברירת מחדל "חשיבה" שצורכת חלק ניכר ממכסת הטוקנים לפני התשובה
  // עצמה — במשימת חילוץ נתונים דטרמיניסטית זו לא נחוצה, ורק מסכנת תשובה ריקה.
  if (includeThinkingConfig) generationConfig.thinkingConfig = { thinkingBudget: 0 }

  const body = { contents: [{ parts }], generationConfig }
  // עיגון בחיפוש גוגל: המודל מחפש ברשת בעצמו ועונה על סמך תוצאות עדכניות —
  // משמש לזיהוי מוצרים (מותג/דגם/מחיר) ולהשלמת פרטים מדויקת יותר.
  if (useSearch) body.tools = [{ google_search: {} }]

  const res = await geminiFetch(apiKey, `models/${model}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    let bodyText = ''
    try {
      bodyText = (await res.text()).slice(0, 300)
    } catch {
      // אין מה לעשות אם גם קריאת גוף התשובה נכשלת
    }
    const err = new Error(`http ${res.status}`)
    err.status = res.status
    err.bodyText = bodyText
    throw err
  }
  const json = await res.json()
  const candidate = json.candidates?.[0]
  const finishReason = candidate?.finishReason
  const text = (candidate?.content?.parts || []).map((p) => p.text || '').join('')
  // MAX_TOKENS = התשובה נקטעה (לרוב כי המודל "חשב" ובזבז את מכסת הטוקנים) — ניתן לניסיון חוזר
  const truncated = finishReason === 'MAX_TOKENS'
  if (!text) {
    const err = new Error(`empty response (finishReason: ${finishReason || 'none'})`)
    err.finishReason = finishReason
    err.retryable = true
    throw err
  }
  try {
    return parseJsonLoose(text)
  } catch {
    const err = new Error(`bad json in response (finishReason: ${finishReason || 'none'})`)
    err.bodyText = text.slice(0, 300)
    err.retryable = truncated
    throw err
  }
}

// חלק מהמודלים מוסיפים משפט/גדר קוד סביב ה-JSON למרות responseMimeType — מנקים
// גדרות קוד, ואם עדיין לא תקין, שולפים את תת-המחרוזת בין הסוגריים המסולסלים הראשון והאחרון
function parseJsonLoose(text) {
  const cleaned = text.replace(/```json?/gi, '').replace(/```/g, '').trim()
  try {
    return JSON.parse(cleaned)
  } catch {
    const start = cleaned.indexOf('{')
    const end = cleaned.lastIndexOf('}')
    if (start === -1 || end === -1 || end <= start) throw new Error('no json object found')
    return JSON.parse(cleaned.slice(start, end + 1))
  }
}

async function callModel(model, apiKey, parts, maxOutputTokens, useSearch) {
  try {
    return await callModelRaw(model, apiKey, parts, maxOutputTokens, true, useSearch)
  } catch (e) {
    // ניסיון חוזר על אותו מודל אם: השדה thinkingConfig נדחה (400), התשובה יצאה ריקה,
    // או שהתשובה נקטעה (MAX_TOKENS). מודלים מסוימים לא מכבדים thinkingBudget=0 ומבזבזים
    // טוקנים על "חשיבה", ולכן נותנים מכסה נדיבה בהרבה ומבטלים את הגבלת החשיבה.
    if (e.status === 400 || e.retryable) {
      return await callModelRaw(model, apiKey, parts, Math.max(maxOutputTokens * 4, 4096), false, useSearch)
    }
    throw e
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// מודל שהתגלה בהצלחה בקריאה קודמת — משתמשים בו ראשון בפעם הבאה כדי לחסוך ניסיונות
let discoveredModel = null

// ניסיון אחרון: שואלים את גוגל בעצמה אילו מודלים זמינים למפתח הזה,
// ובוחרים את הראשון שתומך ב-generateContent ("flash" עדיף, מהיר וזול).
async function discoverModel(apiKey) {
  try {
    const res = await geminiFetch(apiKey, 'models', undefined)
    if (!res.ok) return null
    const json = await res.json()
    const models = (json.models || []).filter((m) =>
      (m.supportedGenerationMethods || []).includes('generateContent'),
    )
    const pick = models.find((m) => /flash/i.test(m.name)) || models[0]
    return pick ? pick.name.replace(/^models\//, '') : null
  } catch {
    return null
  }
}

// מכסת ברירת מחדל נדיבה: מודלי 2.5 סופרים גם טוקני "חשיבה" בתוך המכסה, ולכן ערך
// נמוך מדי קוטע את התשובה עוד לפני שנכתב ה-JSON.
async function geminiJson(apiKey, parts, maxOutputTokens = 4096, useSearch = false) {
  const queue = [...new Set([discoveredModel, ...MODEL_CANDIDATES].filter(Boolean))]
  let lastErr
  // אם דילגנו על מודל בגלל עומס/מכסה זמניים (ולא כי הוא לא קיים) — לא קובעים את
  // מודל-הגיבוי שהצליח כמועדף הקבוע, כדי לחזור למודל האיכותי כשהעומס יחלוף.
  let transientSkip = false
  for (const model of queue) {
    try {
      const result = await callModel(model, apiKey, parts, maxOutputTokens, useSearch)
      if (!transientSkip) discoveredModel = model
      return result
    } catch (e) {
      lastErr = e
      // 503/500 = עומס זמני על שרתי גוגל (נפוץ במסלול החינמי) — ממתינים רגע ומנסים
      // שוב פעם אחת על אותו מודל לפני שעוברים הלאה.
      if (e.status === 503 || e.status === 500) {
        await sleep(1500)
        try {
          const result = await callModel(model, apiKey, parts, maxOutputTokens, useSearch)
          if (!transientSkip) discoveredModel = model
          return result
        } catch (e2) {
          lastErr = e2
        }
      }
      if ([429, 500, 503].includes(lastErr?.status)) transientSkip = true
      // 404 = המודל הזה לא קיים; 429 = מכסה ספציפית לדגם; 500/503 = עומס —
      // בכל המקרים האלה שווה לנסות את המודל הבא ברשימה לפני שמוותרים.
      if (![404, 429, 500, 503].includes(lastErr?.status)) break
    }
  }
  // כל השמות הידועים נכשלו ב"לא נמצא" — לפני שמוותרים, שואלים את גוגל מה כן זמין
  if (lastErr?.status === 404) {
    const found = await discoverModel(apiKey)
    if (found && !queue.includes(found)) {
      try {
        const result = await callModel(found, apiKey, parts, maxOutputTokens, useSearch)
        discoveredModel = found
        return result
      } catch (e) {
        lastErr = e
      }
    }
  }
  const status = lastErr?.status
  const usingProxy = !apiKey // בלי מפתח פרטי — הבקשה עברה דרך הפרוקסי המובנה
  let userMessage
  if (status === 400)
    userMessage = usingProxy
      ? 'בקשה שגויה לשירות הזיהוי'
      : 'המפתח לא תקין (בקשה שגויה) — ודאו שהעתקתם אותו במלואו'
  else if (status === 401 || status === 403)
    userMessage = usingProxy
      ? 'החיבור לזיהוי נדחה — ייתכן שצריך להתחבר מחדש לחשבון, או שהזיהוי המובנה עדיין לא הותקן בשרת'
      : 'המפתח נדחה — ייתכן שהוא שגוי, לא הופעל, או שהמכסה החינמית נגמרה'
  else if (status === 404 && usingProxy)
    userMessage = 'הזיהוי המובנה עדיין לא הותקן בשרת (פונקציית ה-Edge חסרה)'
  else if (status === 429) userMessage = 'חריגה ממכסת הבקשות החינמית לעת עתה — נסו שוב בעוד כמה דקות'
  else if (status === 503 || status === 500)
    userMessage = 'שרתי הזיהוי של גוגל עמוסים כרגע — זה זמני ולא קשור למכסה, נסו שוב בעוד רגע'
  else if (status) userMessage = `שגיאת שרת (${status})`
  else userMessage = 'לא הצלחתי להתחבר לשירות הזיהוי (בעיית רשת)'
  throw new AiError(userMessage, [
    lastErr?.message,
    lastErr?.status ? `status ${lastErr.status}` : null,
    lastErr?.bodyText,
  ]
    .filter(Boolean)
    .join(' · '))
}

// ניתוח צילום מסך: זיהוי קטגוריה + חילוץ פרטים, בקריאה אחת.
// genericCategories: רשימת הקטגוריות הכלליות הקיימות כרגע אצל המשתמש ({id,label}) —
// מוזרקת דינמית כדי שה-AI יזהה גם קטגוריות חדשות/משונות-שם, לא רק רשימה קבועה בקוד.
export async function analyzeImage(file, apiKey, genericCategories = []) {
  if (DEMO) return demoAnalyze()
  if (!apiKey && !aiProxy)
    throw new AiError('הזיהוי החכם עוד לא מוכן — התחברו לחשבון כדי להפעיל אותו', 'no key & no proxy')

  const blob = await resizeImage(file, 1024, 0.8)
  const base64 = await blobToBase64(blob)

  const genericIds = genericCategories.map((c) => c.id)
  const genericEnum = genericIds.length ? genericIds.join('|') + '|' : ''
  const genericList = genericCategories.map((c) => `${c.id}=${c.label}`).join(', ')

  const prompt = `זהו צילום מסך של המלצה ששלחו למשתמש ישראלי (מוואטסאפ, רשת חברתית או אתר).
נתח את התמונה וחלץ את הפרטים. החזר JSON בלבד במבנה המדויק הזה:
{"category":"book|movie|series|artist|show|${genericEnum}unknown",
"title":"השם המרכזי (של הספר/סרט/אמן/הופעה/הפריט) בעברית כפי שמופיע או ידוע",
"altTitle":"השם באנגלית אם מופיע או ידוע לך בוודאות, אחרת מחרוזת ריקה",
"creator":"מחבר/במאי/יוצר/מבצע אם מופיע או ידוע בוודאות, אחרת ריק",
"year":מספר או null,
"address":"אם זה מקום או הופעה — כתובת/יישוב/אולם, אחרת ריק",
"price":מספר או null,
"store":"אם זה מוצר או פריט לקנייה — שם החנות/אתר אם מופיע, אחרת ריק",
"rawText":"הטקסט המרכזי שמופיע בתמונה, עד 300 תווים",
"confidence":"high|medium|low"}
כללי סיווג: ספר=book, סרט=movie, סדרת טלוויזיה=series, המלצה על אמן/זמר/להקה חדשים לגילוי (בלי אירוע קונקרטי)=artist, כרטיס/פרסום להופעה קונקרטית עם תאריך — קונצרט, הצגת תיאטרון, הקרנת קולנוע, סטנדאפ, מחול=show.
בנוסף, למשתמש יש את הקטגוריות הכלליות הבאות (מזהה=שם): ${genericList || 'אין כרגע'}. אם התוכן מתאים לאחת מהן יותר מכל קטגוריה אחרת — החזר בשדה category את המזהה המדויק שלה (למשל "${genericIds[0] || 'places'}"), לא את השם שלה.
זו יכולה להיות גם תמונת פוסטר/כריכה רשמית עם טקסט מעוצב או אלכסוני — קראו את הטקסט הוויזואלי בעיון, לא רק טקסט ישר.
חשוב: אל תמציא שם שלא נרמז בתמונה. אם אינך בטוח בקטגוריה — unknown ו-confidence נמוך.`

  const result = await geminiJson(apiKey, [
    { text: prompt },
    { inlineData: { mimeType: 'image/jpeg', data: base64 } },
  ])
  if (!result || typeof result !== 'object') throw new AiError('תשובה לא תקינה מהשירות', 'bad shape')
  return result
}

// השלמת שדות חסרים בלבד עבור ספר/סרט/סדרה, אחרי שהמקורות הרשמיים לא סיפקו הכול
export async function aiCompleteDetails(candidate, apiKey) {
  if (DEMO || (!apiKey && !aiProxy)) return candidate
  if (!['book', 'movie', 'series'].includes(candidate.type)) return candidate

  const missing = []
  if (!candidate.year) missing.push('year')
  if (!candidate.creator) missing.push('creator')
  if (candidate.type === 'book' && !candidate.pages) missing.push('pages')
  if (candidate.type === 'movie' && !candidate.runtimeMinutes) missing.push('runtimeMinutes')
  if (candidate.type === 'series' && !candidate.seasons) missing.push('seasons')
  if (candidate.type === 'series' && !candidate.episodeRuntimeMinutes)
    missing.push('episodeRuntimeMinutes')
  if (!(candidate.genres || []).length) missing.push('genres')
  if (!candidate.summary) missing.push('summary')
  if (missing.length === 0) return candidate

  const typeHe = { book: 'ספר', movie: 'סרט', series: 'סדרה' }[candidate.type]
  const prompt = `${typeHe} בשם "${candidate.titleHe}"${candidate.titleOriginal ? ` (באנגלית: ${candidate.titleOriginal})` : ''}${candidate.year ? ` משנת ${candidate.year}` : ''}.
חפש בגוגל כדי לוודא את הפרטים, והשלם אך ורק את השדות הבאים, במדויק: ${missing.join(', ')}.
החזר JSON בלבד:
{"year":מספר|null,"creator":"שם בעברית"|null,"pages":מספר|null,"runtimeMinutes":מספר|null,"seasons":מספר|null,"episodeRuntimeMinutes":מספר|null,"genres":["עד 3 ז'אנרים בעברית"]|null,"summary":"תקציר בעברית עד 200 תווים"|null}
כלל ברזל: אם אינך בטוח בערך — החזר null. עדיף שדה ריק מנתון שגוי.`

  try {
    // עם עיגון בחיפוש גוגל — הפרטים מגיעים מהרשת ולא רק מהזיכרון של המודל
    const data = await geminiJson(apiKey, [{ text: prompt }], 4096, true)
    const out = { ...candidate }
    let changed = false
    for (const key of missing) {
      const v = data[key]
      if (v != null && v !== '' && !(Array.isArray(v) && v.length === 0)) {
        out[key] = key === 'genres' ? v.slice(0, 3) : v
        changed = true
      }
    }
    if (changed) out.aiAssisted = true
    return out
  } catch {
    return candidate
  }
}

// זיהוי מוצר/פריט מדויק בעזרת חיפוש גוגל (Search Grounding): המודל מקבל את התמונה
// ואת מה שכבר ידוע, מחפש ברשת בעצמו, ומחזיר מותג/דגם/מחיר/חנות/קישור.
// משמש בכפתור "השלמה חכמה מהרשת" בטופס ההוספה הכללי (מוצרים וכו').
export async function aiWebEnrichNote(current, file, apiKey) {
  if (DEMO) return null
  if (!apiKey && !aiProxy)
    throw new AiError('הזיהוי החכם לא זמין — התחברו לחשבון או הזינו מפתח', 'no key & no proxy')

  const known = [
    current.title ? `שם/תיאור שכבר ידוע: "${current.title}"` : null,
    current.kind ? `סוג: ${current.kind}` : null,
    current.store ? `חנות/מקור: ${current.store}` : null,
    current.sourceText ? `טקסט שזוהה בתמונה: ${current.sourceText.slice(0, 250)}` : null,
  ]
    .filter(Boolean)
    .join('\n')

  const parts = [
    {
      text: `לפניך פריט/מוצר שמשתמש ישראלי רוצה לשמור כהמלצה.${file ? ' מצורפת תמונה שלו.' : ''}
${known ? known + '\n' : ''}זהה את המוצר המדויק ככל האפשר: הסתכל על הלוגו, הצורה והכיתוב${file ? ' בתמונה' : ''}, וחפש בגוגל כדי למצוא את היצרן והדגם המדויקים ופרטים עדכניים.
החזר JSON בלבד במבנה הזה:
{"title":"שם מלא ומדויק בעברית: סוג + מותג + דגם (למשל: מכונת קפה דלונגי Magnifica S ECAM22.110)",
"brand":"שם המותג/היצרן"|null,
"model":"שם/מספר הדגם המדויק"|null,
"kind":"סוג הפריט במילה-שתיים (למשל: מכונת קפה)"|null,
"price":מחיר משוער בש"ח בישראל, כמספר|null,
"store":"חנות או אתר שמוכרים אותו בישראל"|null,
"link":"קישור לעמוד המוצר שמרכז את הפרטים הטכניים — עדיפות לעמוד באתר היצרן או בחנות מוכרת"|null,
"summary":"2-3 משפטים על המוצר ותכונותיו העיקריות"|null,
"specs":[{"label":"שם המאפיין בעברית","value":"הערך"}],
"confidence":"high|medium|low"}
בשדה specs החזר מפרט טכני בסיסי כמו בעמוד מוצר של חנות: עד 10 מאפיינים רלוונטיים לסוג המוצר
(למשל: הספק, קיבולת/נפח, מידות, משקל, חומר, צבע, סוללה, קישוריות, אחריות). אם לא נמצא מפרט אמין — החזר [].
כלל ברזל: אם אינך בטוח בדגם המדויק — מלא את מה שכן בטוח (מותג/סוג) והחזר null בשאר. אל תמציא דגם, מחיר או נתוני מפרט.`,
    },
  ]
  if (file) {
    const blob = await resizeImage(file, 1024, 0.8)
    parts.push({ inlineData: { mimeType: 'image/jpeg', data: await blobToBase64(blob) } })
  }

  const data = await geminiJson(apiKey, parts, 4096, true)
  if (!data || typeof data !== 'object') throw new AiError('תשובה לא תקינה מהשירות', 'bad shape')
  return data
}

// בדיקת תקינות מהירה של המפתח, ללא תמונה — למסך ההגדרות
export async function testAiKey(apiKey) {
  if (DEMO) return true
  if (!apiKey && !aiProxy)
    throw new AiError('התחברו לחשבון או הזינו מפתח כדי לבדוק את החיבור', 'no key & no proxy')
  const result = await geminiJson(apiKey, [{ text: 'החזר JSON בדיוק כך: {"ok":true}' }])
  if (!result?.ok) throw new AiError('תשובה לא צפויה מהשירות', JSON.stringify(result))
  return true
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}
