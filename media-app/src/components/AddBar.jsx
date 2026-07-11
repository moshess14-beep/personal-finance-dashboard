import { useRef } from 'react'
import { Camera, Keyboard } from 'lucide-react'

export default function AddBar({ onImage, onName }) {
  const fileRef = useRef(null)

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
      <button
        onClick={onName}
        className="w-full bg-white border border-slate-200 text-slate-600 rounded-2xl py-2.5 flex items-center justify-center gap-2 text-sm font-semibold active:scale-[0.99] transition"
      >
        <Keyboard className="w-4 h-4" />
        או: הקלדת שם של ספר / סרט / סדרה
      </button>
    </div>
  )
}
