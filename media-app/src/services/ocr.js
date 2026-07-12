import { DEMO } from './env'
import { demoOcr } from '../data/demoData'

// קריאת טקסט מצילום מסך. בגרסה הנוכחית: OCR מקומי בדפדפן (Tesseract, עברית+אנגלית).
// בשלב הבא: זיהוי חכם דרך מודל ראייה בצד שרת (מדויק יותר, מזהה גם סוג היצירה).
export async function extractTextFromImage(file, onProgress) {
  if (DEMO) return demoOcr(onProgress)

  const { default: Tesseract } = await import('tesseract.js')
  const { data } = await Tesseract.recognize(file, 'heb+eng', {
    logger: (m) => {
      if (m.status === 'recognizing text') onProgress(m.progress || 0)
    },
  })
  return data.text || ''
}

// חילוץ שורות שסביר שהן שם היצירה, לבחירת המשתמש.
// מסנן בקשיחות רעשי OCR: שורות קצרות מדי, שורות שרובן סימנים/ספרות, וג'יבריש.
export function pickCandidateLines(text) {
  const candidates = text
    .split('\n')
    .map((l) => l.replace(/[|_~^*#=<>{}[\]\\/]+/g, ' ').replace(/\s+/g, ' ').trim())
    .filter((l) => {
      if (l.length < 3 || l.length > 50) return false
      const letters = (l.match(/[א-תA-Za-z]/g) || []).length
      if (letters < 3) return false
      // לפחות 60% מהתווים (ללא רווחים) הם אותיות — מסנן שורות של סימנים וספרות
      const dense = l.replace(/\s/g, '')
      if (letters / dense.length < 0.6) return false
      // מסנן "מילים" של אות בודדת חוזרת (רעש OCR קלאסי)
      const words = l.split(' ')
      const realWords = words.filter((w) => (w.match(/[א-תA-Za-z]/g) || []).length >= 2)
      return realWords.length >= 1 && realWords.length >= words.length / 2
    })
  // מיון: שורות עם יותר מילים אמיתיות ובאורך סביר של כותרת — קודם
  const score = (l) => {
    const words = l.split(' ').length
    return (words >= 2 && words <= 6 ? 2 : 0) + (l.length >= 6 && l.length <= 30 ? 1 : 0)
  }
  return [...new Set(candidates)].sort((a, b) => score(b) - score(a)).slice(0, 6)
}
