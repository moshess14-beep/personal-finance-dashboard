// שולף תמונה שהמשתמש שיתף לאפליקציה (דרך ה-Service Worker) וממיר אותה לקובץ
export async function consumeSharedImage() {
  try {
    if (!('caches' in window)) return null
    const cache = await caches.open('shared-media')
    const res = await cache.match('shared-image')
    if (!res) return null
    const blob = await res.blob()
    await cache.delete('shared-image')
    return new File([blob], 'shared.jpg', { type: blob.type || 'image/jpeg' })
  } catch {
    return null
  }
}

// קורא תמונה מלוח ההעתקה (הדבקה), אם יש
export async function readClipboardImage() {
  if (!navigator.clipboard?.read) throw new Error('unsupported')
  const items = await navigator.clipboard.read()
  for (const item of items) {
    const type = item.types.find((t) => t.startsWith('image/'))
    if (type) {
      const blob = await item.getType(type)
      return new File([blob], 'pasted.png', { type: blob.type || 'image/png' })
    }
  }
  return null
}
