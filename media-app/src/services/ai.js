// ניתוח תמונות והשלמת פרטים עם מודל AI (Gemini — מפתח חינמי מ-aistudio.google.com).
// המפתח נשמר מקומית בדפדפן בלבד. בלי מפתח האפליקציה נופלת ל-OCR מקומי.
import { DEMO } from './env'
import { resizeImage } from './images'
import { demoAnalyze } from '../data/demoData'

// גוגל מחליפה/מוציאה משימוש שמות מודל קונקרטיים עם הזמן (למשל gemini-1.5-flash).
// gemini-flash-latest הוא alias יציב שגוגל מתחזקת ומצביע תמיד על המודל המהיר הנוכחי —
// לכן הוא ראשון. שאר השמות הם רשת ביטחון למקרה שהאלias עדיין לא נתמך במפתח מסוים.
const MODEL_CANDIDATES = ['gemini-flash-latest', 'gemini-2.5-flash', 'gemini-2.0-flash']

// שגיאה עם פירוט טכני, כדי שאפשר יהיה להציג למשתמש מה בדיוק השתבש
export class AiError extends Error {
  constructor(message, detail) {
    super(message)
    this.detail = detail
  }
}

async function callModelRaw(model, apiKey, parts, maxOutputTokens, includeThinkingConfig) {
  const generationConfig = {
    temperature: 0.1,
    maxOutputTokens,
    responseMimeType: 'application/json',
  }
  // דגמי 2.5 מפעילים ברירת מחדל "חשיבה" שצורכת חלק ניכר ממכסת הטוקנים לפני התשובה
  // עצמה — במשימת חילוץ נתונים דטרמיניסטית זו לא נחוצה, ורק מסכנת תשובה ריקה.
  if (includeThinkingConfig) generationConfig.thinkingConfig = { thinkingBudget: 0 }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts }], generationConfig }),
    },
  )
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
  if (!text) {
    const err = new Error(`empty response (finishReason: ${finishReason || 'none'})`)
    err.finishReason = finishReason
    err.emptyResponse = true
    throw err
  }
  try {
    return JSON.parse(text.replace(/^```json?\s*/i, '').replace(/```\s*$/, '').trim())
  } catch {
    const err = new Error('bad json in response')
    err.bodyText = text.slice(0, 300)
    throw err
  }
}

async function callModel(model, apiKey, parts, maxOutputTokens) {
  try {
    return await callModelRaw(model, apiKey, parts, maxOutputTokens, true)
  } catch (e) {
    // אם השדה thinkingConfig עצמו נדחה (400) או שהתשובה עדיין יצאה ריקה —
    // ניסיון נוסף על אותו מודל בלי הגבלת החשיבה, עם מכסת טוקנים גדולה יותר
    if (e.status === 400 || e.emptyResponse) {
      return await callModelRaw(model, apiKey, parts, Math.max(maxOutputTokens, 500), false)
    }
    throw e
  }
}

// מודל שהתגלה בהצלחה בקריאה קודמת — משתמשים בו ראשון בפעם הבאה כדי לחסוך ניסיונות
let discoveredModel = null

// ניסיון אחרון: שואלים את גוגל בעצמה אילו מודלים זמינים למפתח הזה,
// ובוחרים את הראשון שתומך ב-generateContent ("flash" עדיף, מהיר וזול).
async function discoverModel(apiKey) {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`,
    )
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

async function geminiJson(apiKey, parts, maxOutputTokens = 800) {
  const queue = [...new Set([discoveredModel, ...MODEL_CANDIDATES].filter(Boolean))]
  let lastErr
  for (const model of queue) {
    try {
      const result = await callModel(model, apiKey, parts, maxOutputTokens)
      discoveredModel = model
      return result
    } catch (e) {
      lastErr = e
      // 404 = המודל הזה לא קיים; 429 = יכול להיות מכסה ספציפית לדגם הזה —
      // בשני המקרים שווה לנסות את המודל הבא ברשימה לפני שמוותרים.
      if (e.status !== 404 && e.status !== 429) break
    }
  }
  // כל השמות הידועים נכשלו ב"לא נמצא" — לפני שמוותרים, שואלים את גוגל מה כן זמין
  if (lastErr?.status === 404) {
    const found = await discoverModel(apiKey)
    if (found && !queue.includes(found)) {
      try {
        const result = await callModel(found, apiKey, parts, maxOutputTokens)
        discoveredModel = found
        return result
      } catch (e) {
        lastErr = e
      }
    }
  }
  const status = lastErr?.status
  let userMessage
  if (status === 400) userMessage = 'המפתח לא תקין (בקשה שגויה) — ודאו שהעתקתם אותו במלואו'
  else if (status === 401 || status === 403)
    userMessage = 'המפתח נדחה — ייתכן שהוא שגוי, לא הופעל, או שהמכסה החינמית נגמרה'
  else if (status === 429) userMessage = 'חריגה ממכסת הבקשות החינמית לעת עתה — נסו שוב בעוד כמה דקות'
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

// ניתוח צילום מסך: זיהוי קטגוריה + חילוץ פרטים, בקריאה אחת
export async function analyzeImage(file, apiKey) {
  if (DEMO) return demoAnalyze()
  if (!apiKey) throw new AiError('לא הוזן מפתח AI', 'no key')

  const blob = await resizeImage(file, 1024, 0.8)
  const base64 = await blobToBase64(blob)

  const prompt = `זהו צילום מסך של המלצה ששלחו למשתמש ישראלי (מוואטסאפ, רשת חברתית או אתר).
נתח את התמונה וחלץ את הפרטים. החזר JSON בלבד במבנה המדויק הזה:
{"category":"book|movie|series|place|recipe|product|artist|show|unknown",
"title":"השם המרכזי (של הספר/סרט/מקום/מתכון/מוצר/אמן/הופעה) בעברית כפי שמופיע או ידוע",
"altTitle":"השם באנגלית אם מופיע או ידוע לך בוודאות, אחרת מחרוזת ריקה",
"creator":"מחבר/במאי/יוצר/מבצע אם מופיע או ידוע בוודאות, אחרת ריק",
"year":מספר או null,
"address":"אם זה מקום או הופעה — כתובת/יישוב/אולם, אחרת ריק",
"price":מספר או null,
"store":"אם זה מוצר — שם החנות/אתר אם מופיע, אחרת ריק",
"rawText":"הטקסט המרכזי שמופיע בתמונה, עד 300 תווים",
"confidence":"high|medium|low"}
כללי סיווג: ספר=book, סרט=movie, סדרת טלוויזיה=series, מקום בילוי/מסעדה/מלון/צימר/אטרקציה/מסלול=place, מתכון או מנה להכנה ביתית=recipe, מוצר לקנייה=product, המלצה על אמן/זמר/להקה חדשים לגילוי (בלי אירוע קונקרטי)=artist, כרטיס/פרסום להופעה קונקרטית עם תאריך — קונצרט, הצגת תיאטרון, הקרנת קולנוע, סטנדאפ, מחול=show.
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
  if (DEMO || !apiKey) return candidate
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
השלם אך ורק את השדות הבאים, במדויק: ${missing.join(', ')}.
החזר JSON בלבד:
{"year":מספר|null,"creator":"שם בעברית"|null,"pages":מספר|null,"runtimeMinutes":מספר|null,"seasons":מספר|null,"episodeRuntimeMinutes":מספר|null,"genres":["עד 3 ז'אנרים בעברית"]|null,"summary":"תקציר בעברית עד 200 תווים"|null}
כלל ברזל: אם אינך בטוח בערך — החזר null. עדיף שדה ריק מנתון שגוי.`

  try {
    const data = await geminiJson(apiKey, [{ text: prompt }])
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

// בדיקת תקינות מהירה של המפתח, ללא תמונה — למסך ההגדרות
export async function testAiKey(apiKey) {
  if (DEMO) return true
  if (!apiKey) throw new AiError('לא הוזן מפתח', 'no key')
  const result = await geminiJson(apiKey, [
    { text: 'החזר JSON בדיוק כך: {"ok":true}' },
  ], 50)
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
