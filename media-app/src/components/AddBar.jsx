import { useRef, useState } from 'react'
import { Camera, Keyboard, ClipboardPaste } from 'lucide-react'
import { readClipboardImage } from '../services/shareTarget'

export default function AddBar({ onImage, onName }) {
  const fileRef = useRef(null)
  const [msg, setMsg] = useState(null)

  async function paste() {
    setMsg(null)
    try {
      const file = await readClipboardImage()
      if (file) onImage(file)
      else setMsg('לא נמצאה תמונה בלוח ההעתקה')
    } catch {
      setMsg('הדפדפן לא מאפשר גישה ללוח — נסו "העלה תמונה"')
    }
  }

  return (
    <div className="mt-4 space-y-2">
      <button
        onClick={() => fileRef.current?.click()}
        className="w-full bg-gradient-to-l from-indigo-600 to-violet-600 text-white rounded-2xl py-4 flex items-center justify-center gap-2.5 font-bold text-lg shadow-md active:scale-[0.99] transition"
      >
        <Camera className="w-6 h-6" />
        העלה תמונה של המלצה
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onImage(f)
          e.target.value = ''
        }}
      />
      <div className="flex gap-2">
        <button
          onClick={paste}
          className="flex-1 bg-white border border-slate-200 text-slate-600 rounded-2xl py-2.5 flex items-center justify-center gap-2 text-sm font-semibold active:scale-[0.99] transition"
        >
          <ClipboardPaste className="w-4 h-4" />
          הדבקת תמונה
        </button>
        <button
          onClick={onName}
          className="flex-1 bg-white border border-slate-200 text-slate-600 rounded-2xl py-2.5 flex items-center justify-center gap-2 text-sm font-semibold active:scale-[0.99] transition"
        >
          <Keyboard className="w-4 h-4" />
          הקלדת שם
        </button>
      </div>
      <p className="text-[11px] text-slate-400 text-center leading-relaxed">
        טיפ: מגוגל תמונות או וואטסאפ אפשר לשתף צילום ישירות לאפליקציה דרך כפתור השיתוף
      </p>
      {msg && <p className="text-[11px] text-rose-500 text-center font-semibold">{msg}</p>}
    </div>
  )
}
