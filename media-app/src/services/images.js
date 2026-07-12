// אחסון תמונות (צילומי מסך של מתכונים/מוצרים/בילויים).
// תמיד נשמר עותק מקומי מהיר ב-IndexedDB (עובד גם בלי רשת); אם המשתמש מחובר לחשבון,
// נשמר גם עותק ב-Supabase Storage כדי שהתמונה תופיע גם במכשירים אחרים.
import { useEffect, useState } from 'react'

const DB_NAME = 'media-library-files'
const STORE = 'images'

// מותקן על ידי services/sync.js לאחר התחברות מוצלחת; null כשמנותקים
let cloudCtx = null
export function setImageCloudContext(ctx) {
  cloudCtx = ctx
}

let dbPromise = null
function db() {
  dbPromise ||= new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  return dbPromise
}

async function saveLocal(id, blob) {
  const d = await db()
  return new Promise((resolve, reject) => {
    const tx = d.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(blob, id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

async function getLocal(id) {
  const d = await db()
  return new Promise((resolve, reject) => {
    const rq = d.transaction(STORE).objectStore(STORE).get(id)
    rq.onsuccess = () => resolve(rq.result || null)
    rq.onerror = () => reject(rq.error)
  })
}

async function deleteLocal(id) {
  const d = await db()
  await new Promise((resolve) => {
    const tx = d.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).delete(id)
    tx.oncomplete = resolve
    tx.onerror = resolve
  })
}

const cloudPath = (userId, id) => `${userId}/${id}.jpg`

export async function saveImage(id, blob) {
  await saveLocal(id, blob)
  if (cloudCtx) {
    cloudCtx.supabase.storage
      .from('item-images')
      .upload(cloudPath(cloudCtx.userId, id), blob, { contentType: 'image/jpeg', upsert: true })
      .catch(() => {
        // כשלון העלאה לענן לא חוסם שמירה מקומית — התמונה עדיין זמינה במכשיר הזה
      })
  }
}

export async function getImage(id) {
  const local = await getLocal(id).catch(() => null)
  if (local) return local
  if (!cloudCtx) return null
  try {
    const { data, error } = await cloudCtx.supabase.storage
      .from('item-images')
      .download(cloudPath(cloudCtx.userId, id))
    if (error || !data) return null
    saveLocal(id, data).catch(() => {})
    return data
  } catch {
    return null
  }
}

export async function deleteImage(id) {
  if (!id) return
  await deleteLocal(id).catch(() => {})
  if (cloudCtx) {
    cloudCtx.supabase.storage.from('item-images').remove([cloudPath(cloudCtx.userId, id)]).catch(() => {})
  }
}

// מעלה תמונה שכבר קיימת מקומית לענן — משמש בסנכרון הראשוני אחרי התחברות,
// כדי שפריטים שנוצרו לפני החיבור לחשבון יקבלו גם הם עותק בענן.
export async function migrateLocalImageToCloud(id) {
  if (!cloudCtx) return
  const blob = await getLocal(id).catch(() => null)
  if (!blob) return
  await cloudCtx.supabase.storage
    .from('item-images')
    .upload(cloudPath(cloudCtx.userId, id), blob, { contentType: 'image/jpeg', upsert: true })
    .catch(() => {})
}

// הקטנת תמונה לפני שמירה/שליחה ל-AI (חוסך מקום ותעבורה)
export async function resizeImage(file, max = 1200, quality = 0.82) {
  try {
    const bmp = await createImageBitmap(file)
    const scale = Math.min(1, max / Math.max(bmp.width, bmp.height))
    const w = Math.round(bmp.width * scale)
    const h = Math.round(bmp.height * scale)
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    canvas.getContext('2d').drawImage(bmp, 0, 0, w, h)
    return await new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b || file), 'image/jpeg', quality),
    )
  } catch {
    return file
  }
}

// hook לטעינת תמונה שמורה כ-object URL
export function useItemImage(imageId) {
  const [url, setUrl] = useState(null)
  useEffect(() => {
    if (!imageId) {
      setUrl(null)
      return
    }
    let objectUrl = null
    let live = true
    getImage(imageId).then((blob) => {
      if (live && blob) {
        objectUrl = URL.createObjectURL(blob)
        setUrl(objectUrl)
      }
    })
    return () => {
      live = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [imageId])
  return url
}
