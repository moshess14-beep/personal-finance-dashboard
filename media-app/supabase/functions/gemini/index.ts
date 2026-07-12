// פונקציית Edge שמתווכת בין האפליקציה ל-Gemini. מטרתה: להחזיק את מפתח ה-Gemini בשרת
// (כסוד GEMINI_API_KEY) במקום בדפדפן, כך שהזיהוי החכם "מובנה" ומשותף לכל המשתמשים
// המחוברים — בלי שאיש יזין מפתח משלו, ובלי לחשוף את המפתח באתר הציבורי.
//
// אבטחה: הפונקציה מקבלת רק משתמשים מחוברים באמת (getUser על ה-JWT). מפתח ה-anon
// הציבורי אינו משתמש — ולכן נדחה. הנתיבים מוגבלים לקריאות generateContent ורשימת מודלים
// בלבד, כדי שלא ניתן יהיה להפוך אותה לפרוקסי כללי.
//
// פריסה (חד-פעמית, דרך לוח הבקרה של Supabase או ה-CLI) + הגדרת הסוד:
//   supabase functions deploy gemini
//   supabase secrets set GEMINI_API_KEY=<המפתח-מ-aistudio.google.com>
import { createClient } from 'jsr:@supabase/supabase-js@2'

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// נתיבים מותרים בלבד: models (רשימה) או models/<name>:generateContent
const ALLOWED_PATH = /^models(\/[A-Za-z0-9._-]+:generateContent)?$/

function json(obj: unknown, status: number) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405)

  // מוודאים שהקורא הוא משתמש מחובר אמיתי (ולא מפתח ה-anon הציבורי)
  const authHeader = req.headers.get('Authorization') || ''
  const token = authHeader.replace(/^Bearer\s+/i, '').trim()
  if (!token) return json({ error: 'missing authorization' }, 401)

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
  )
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token)
  if (authError || !user) return json({ error: 'unauthorized' }, 401)

  const geminiKey = Deno.env.get('GEMINI_API_KEY')
  if (!geminiKey) return json({ error: 'server is missing GEMINI_API_KEY' }, 500)

  let payload: { path?: string; init?: { method?: string; body?: string | null } }
  try {
    payload = await req.json()
  } catch {
    return json({ error: 'bad request body' }, 400)
  }

  const path = String(payload?.path || '')
  if (!ALLOWED_PATH.test(path)) return json({ error: 'path not allowed' }, 400)

  const method = payload?.init?.method || 'GET'
  const body = payload?.init?.body ?? null
  const sep = path.includes('?') ? '&' : '?'

  const upstream = await fetch(`${GEMINI_BASE}/${path}${sep}key=${encodeURIComponent(geminiKey)}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: method === 'GET' ? undefined : body,
  })

  // מעבירים את תשובת גוגל כמות שהיא, כולל קוד הסטטוס — כדי שלוגיקת הניסיון-החוזר בצד
  // הלקוח (404 → מודל אחר, 429 → מכסה) תמשיך לעבוד בדיוק כמו בקריאה ישירה.
  const text = await upstream.text()
  return new Response(text, {
    status: upstream.status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
})
