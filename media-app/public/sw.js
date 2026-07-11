// Service Worker — מאפשר "שיתוף תמונה" ישירות מאפליקציות אחרות (גוגל תמונות, וואטסאפ)
// אל תוך האפליקציה, דרך יעד השיתוף (Share Target) שמוגדר במניפסט.
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
    if (file) {
      const cache = await caches.open(SHARE_CACHE)
      await cache.put(
        'shared-image',
        new Response(file, { headers: { 'content-type': file.type || 'image/jpeg' } }),
      )
    }
  } catch {
    // אם השיתוף נכשל — פשוט נפתח את האפליקציה רגיל
  }
  return Response.redirect('./?shared=1', 303)
}
