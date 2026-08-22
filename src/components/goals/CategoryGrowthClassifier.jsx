import { useFinanceStore } from '../../store/useFinanceStore'
import { getCategoryGrowthClass } from '../../utils/categories'

export default function CategoryGrowthClassifier() {
  const categories = useFinanceStore((s) => s.categories.assets)
  const setCategoryGrowthClass = useFinanceStore((s) => s.setCategoryGrowthClass)

  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">סיווג קטגוריות נכסים</h3>
      <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
        קובע לאיזה קצב צמיחה כל קטגוריה משויכת בתחזית - נדל"ן לפי קצב הנדל"ן, נכסים יציבים (כמו רכבים) לפי קצב משלהם, וכל השאר לפי קצב הנכסים בשוק ההון - רק מה שבאמת מושקע שם עולה בקצב הזה.
      </p>
      <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
        {categories.map((c) => {
          const growthClass = getCategoryGrowthClass(c)
          return (
            <div key={c.id} className="flex items-center justify-between gap-3 px-3 py-2">
              <span className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: c.color?.light }}
                  aria-hidden="true"
                />
                {c.label}
              </span>
              <div className="flex shrink-0 overflow-hidden rounded-lg border border-slate-300 text-xs font-medium dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setCategoryGrowthClass(c.id, 'realEstate')}
                  className={`px-2.5 py-1.5 transition-colors ${
                    growthClass === 'realEstate'
                      ? 'bg-brand-600 text-white'
                      : 'bg-white text-slate-500 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800'
                  }`}
                >
                  נדל"ן
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryGrowthClass(c.id, 'stable')}
                  className={`px-2.5 py-1.5 transition-colors ${
                    growthClass === 'stable'
                      ? 'bg-brand-600 text-white'
                      : 'bg-white text-slate-500 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800'
                  }`}
                >
                  נכס יציב
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryGrowthClass(c.id, 'other')}
                  className={`px-2.5 py-1.5 transition-colors ${
                    growthClass === 'other'
                      ? 'bg-brand-600 text-white'
                      : 'bg-white text-slate-500 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800'
                  }`}
                >
                  שוק ההון
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
