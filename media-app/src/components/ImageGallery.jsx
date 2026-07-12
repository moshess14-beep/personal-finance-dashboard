import { useRef } from 'react'
import { X, ImagePlus, Loader2 } from 'lucide-react'
import { useItemImage } from '../services/images'

function Thumb({ id, onRemove }) {
  const url = useItemImage(id)
  if (!url) return null
  return (
    <div className="relative shrink-0">
      <img src={url} className="w-20 h-20 object-cover rounded-xl bg-slate-100" alt="" />
      <button
        onClick={onRemove}
        className="absolute -top-1.5 -end-1.5 bg-rose-600 text-white rounded-full p-1 shadow"
        aria-label="הסרת תמונה"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  )
}

// גלריית תמונות נוספות לכל פריט — מעבר לצילום המסך המקורי
export default function ImageGallery({ imageIds, onAdd, onRemove, busy }) {
  const fileRef = useRef(null)

  return (
    <div>
      <div className="text-[11px] font-bold text-slate-400 mb-1.5">תמונות נוספות</div>
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {imageIds.map((id) => (
          <Thumb key={id} id={id} onRemove={() => onRemove(id)} />
        ))}
        <button
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="shrink-0 w-20 h-20 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 disabled:opacity-50"
        >
          {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImagePlus className="w-5 h-5" />}
        </button>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onAdd(f)
          e.target.value = ''
        }}
      />
    </div>
  )
}
