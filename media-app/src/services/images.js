// אחסון תמונות (צילומי מסך של מתכונים/מוצרים/בילויים) ב-IndexedDB —
// localStorage קטן מדי לתמונות, ולכן המטא-דאטה נשאר שם והתמונות כאן.
import { useEffect, useState } from 'react'

const DB_NAME = 'media-library-files'
const STORE = 'images'

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

export async function saveImage(id, blob) {
  const d = await db()
  return new Promise((resolve, reject) => {
    const tx = d.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(blob, id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function getImage(id) {
  const d = await db()
  return new Promise((resolve, reject) => {
    const rq = d.transaction(STORE).objectStore(STORE).get(id)
    rq.onsuccess = () => resolve(rq.result || null)
    rq.onerror = () => reject(rq.error)
  })
}

export async function deleteImage(id) {
  if (!id) return
  try {
    const d = await db()
    await new Promise((resolve) => {
      const tx = d.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).delete(id)
      tx.oncomplete = resolve
      tx.onerror = resolve
    })
  } catch {
    // מחיקת תמונה היא ניקיון בלבד — לא חוסמים על כישלון
  }
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
