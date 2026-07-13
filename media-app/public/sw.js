// Service Worker — מאפשר שיתוף ישירות מאפליקציות אחרות אל תוך האפליקציה, דרך יעד
// השיתוף (Share Target) שמוגדר במניפסט: תמונות (גוגל תמונות, וואטסאפ) וגם
// קישורים/טקסט (יוטיוב, ספוטיפיי, כל אפליקציה עם כפתור שיתוף).
const SHARE_CACHE = 'shared-media'

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  if (event.request.method === 'POST' && url.pathname.endsWith('/share-target')) {
    event.respondWith(handleShare(event.request))
  }
})

async function handleShare(request) {
  try {
    const formData = await request.formData()
    const file = formData.get('image')
    if (file && file.size > 0) {
      const cache = await caches.open(SHARE_CACHE)
      await cache.put(
        'shared-image',
        new Response(file, { headers: { 'content-type': file.type || 'image/jpeg' } }),
      )
      return Response.redirect('./?shared=1', 303)
    }
    // שיתוף טקסט/קישור: אנדרואיד שם את ה-URL לרוב בשדה text, לפעמים ב-url או ב-title
    const text = [formData.get('title'), formData.get('text'), formData.get('url')]
      .filter(Boolean)
      .join(' ')
      .trim()
    if (text) return Response.redirect(`./?shared-text=${encodeURIComponent(text)}`, 303)
  } catch {
    // אם השיתוף נכשל — פשוט נפתח את האפליקציה רגיל
  }
  return Response.redirect('./', 303)
}
