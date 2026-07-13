// קישורי חיפוש חיצוניים ללא צורך במפתח/API — תבניות URL בלבד
export const youtubeSearchUrl = (q) =>
  `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`

export const spotifySearchUrl = (q) => `https://open.spotify.com/search/${encodeURIComponent(q)}`

export const googleSearchUrl = (q) => `https://www.google.com/search?q=${encodeURIComponent(q)}`

// השוואת מחירים בזאפ — תמיד מעודכן, בלי תלות ב-AI
export const zapSearchUrl = (q) => `https://www.zap.co.il/search.aspx?keyword=${encodeURIComponent(q)}`

// חיפוש מוצרים בגוגל (טאב Shopping) — מחירים חיים מהחנויות עצמן
export const googleShoppingUrl = (q) =>
  `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(q)}`
