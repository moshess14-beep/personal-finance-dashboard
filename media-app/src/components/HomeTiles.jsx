import { useItemImage } from '../services/images'

// תמונה בודדת בתוך פסיפס הקטגוריה — צילום שמור (imageId) או עטיפה מהרשת (coverUrl)
function Thumb({ item }) {
  const stored = useItemImage(item.imageId)
  const src = stored || item.coverUrl
  if (!src) return <div className="w-full h-full bg-slate-200" />
  return <img src={src} className="w-full h-full object-cover" alt="" loading="lazy" />
}

// כרטיס קטגוריה בסגנון Airbnb/Pinterest: פסיפס של תמונות מהפריטים בקטגוריה למעלה,
// והשם והכמות למטה. קטגוריה ריקה מציגה גוון רקע עם האימוג'י.
function CategoryTile({ category, items, onClick }) {
  const catItems = items.filter((it) =>
    category.builtin ? category.types.includes(it.type) : it.categoryId === category.id,
  )
  const covers = catItems.filter((it) => it.imageId || it.coverUrl).slice(0, 4)
  const count = catItems.length

  return (
    <button onClick={onClick} className="text-right active:scale-[0.98] transition">
      <div className="relative rounded-2xl overflow-hidden shadow-sm aspect-[4/3] bg-slate-100">
        {covers.length === 0 ? (
          <div className={`w-full h-full bg-gradient-to-br ${category.gradient} flex items-center justify-center`}>
            <span className="text-5xl drop-shadow-lg">{category.emoji}</span>
          </div>
        ) : covers.length === 1 ? (
          <Thumb item={covers[0]} />
        ) : (
          <div className="grid grid-cols-2 grid-rows-2 gap-0.5 w-full h-full">
            {Array.from({ length: 4 }).map((_, i) =>
              covers[i] ? (
                <Thumb key={i} item={covers[i]} />
              ) : (
                <div key={i} className={`bg-gradient-to-br ${category.gradient}`} />
              ),
            )}
          </div>
        )}
        <span className="absolute top-2 end-2 text-[11px] font-bold bg-white/90 backdrop-blur text-slate-700 rounded-full px-2 py-0.5 shadow-sm">
          {count}
        </span>
      </div>
      <div className="px-0.5 mt-2">
        <div className="flex items-center gap-1.5">
          <span className="text-base">{category.emoji}</span>
          <span className="font-black text-slate-800 leading-tight">{category.label}</span>
        </div>
        {category.sub && (
          <div className="text-[11px] text-slate-400 font-semibold mt-0.5">{category.sub}</div>
        )}
      </div>
    </button>
  )
}

// מסך הבית: קטגוריות ההמלצות של המשתמש (ניתנות לעריכה — ראו CategoryManagerModal)
export default function HomeTiles({ categories, items, onOpen }) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-5 mt-5">
      {categories.map((cat) => (
        <CategoryTile key={cat.id} category={cat} items={items} onClick={() => onOpen(cat.id)} />
      ))}
    </div>
  )
}
