// ניתוח תמונות והשלמת פרטים עם מודל AI (Gemini — מפתח חינמי מ-aistudio.google.com).
// המפתח נשמר מקומית בדפדפן בלבד. בלי מפתח האפליקציה נופלת ל-OCR מקומי.
import { DEMO } from './env'
import { resizeImage } from './images'
import { demoAnalyze } from '../data/demoData'

const MODEL = 'gemini-2.0-flash'

async function geminiJson(apiKey, parts, maxOutputTokens = 800) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens,
          responseMimeType: 'application/json',
        },
      }),
    },
  )
  if (!res.ok) throw new Error(`ai http ${res.status}`)
  const json = await res.json()
  const text = (json.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('')
  return JSON.parse(text.replace(/^```json?\s*/i, '').replace(/```\s*$/, '').trim())
}

// ניתוח צילום מסך: זיהוי קטגוריה + חילוץ פרטים, בקריאה אחת
export async function analyzeImage(file, apiKey) {
  if (DEMO) return demoAnalyze()
  if (!apiKey) throw new Error('no ai key')

  const blob = await resizeImage(file, 1024, 0.8)
  const base64 = await blobToBase64(blob)

  const prompt = `זהו צילום מסך של המלצה ששלחו למשתמש ישראלי (מוואטסאפ, רשת חברתית או אתר).
נתח את התמונה וחלץ את הפרטים. החזר JSON בלבד במבנה המדויק הזה:
{"category":"book|movie|series|place|recipe|product|unknown",
"title":"השם המרכזי (של הספר/סרט/מקום/מתכון/מוצר) בעברית כפי שמופיע או ידוע",
"altTitle":"השם באנגלית אם מופיע או ידוע לך בוודאות, אחרת מחרוזת ריקה",
"creator":"מחבר/במאי/יוצר אם מופיע או ידוע בוודאות, אחרת ריק",
"year":מספר או null,
"address":"אם זה מקום — כתובת/יישוב/אזור, אחרת ריק",
"price":מספר או null,
"store":"אם זה מוצר — שם החנות/אתר אם מופיע, אחרת ריק",
"rawText":"הטקסט המרכזי שמופיע בתמונה, עד 300 תווים",
"confidence":"high|medium|low"}
כללי סיווג: ספר=book, סרט=movie, סדרת טלוויזיה=series, מקום בילוי/מסעדה/מלון/צימר/אטרקציה/מסלול=place, מתכון או מנה להכנה ביתית=recipe, מוצר לקנייה=product.
חשוב: אל תמציא שם שלא נרמז בתמונה. אם אינך בטוח בקטגוריה — unknown ו-confidence נמוך.`

  const result = await geminiJson(apiKey, [
    { text: prompt },
    { inlineData: { mimeType: 'image/jpeg', data: base64 } },
  ])
  if (!result || typeof result !== 'object') throw new Error('ai bad response')
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

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}
