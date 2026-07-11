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

// חילוץ שורות שסביר שהן שם היצירה, לבחירת המשתמש
export function pickCandidateLines(text) {
  const lines = text
    .split('\n')
    .map((l) => l.replace(/[|_~^*#=]+/g, ' ').replace(/\s+/g, ' ').trim())
    .filter((l) => {
      const letters = (l.match(/[א-תA-Za-z]/g) || []).length
      return l.length >= 2 && l.length <= 60 && letters >= 2
    })
  return [...new Set(lines)].slice(0, 8)
}
