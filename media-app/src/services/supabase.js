// חיבור ל-Supabase — מסד נתונים, אימות ואחסון תמונות, כדי שהמידע יסתנכרן בין מכשירים.
// ה-URL והמפתח הציבורי (anon key) מוזנים במסך ההגדרות ונשמרים מקומית; שניהם בטוחים
// לחשיפה בצד הלקוח כי כל הגישה בפועל מוגנת ב-Row Level Security בצד השרת.
import { createClient } from '@supabase/supabase-js'

let client = null
let clientKey = ''

export function getSupabase(url, anonKey) {
  if (!url || !anonKey) return null
  const key = `${url}|${anonKey}`
  if (client && clientKey === key) return client
  try {
    client = createClient(url, anonKey, { auth: { persistSession: true, autoRefreshToken: true } })
    clientKey = key
    return client
  } catch {
    return null
  }
}
