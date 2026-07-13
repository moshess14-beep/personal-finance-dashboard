import { useEffect, useMemo, useState } from 'react'
import { Plus, ListTree } from 'lucide-react'
import useLibraryStore from './store/useLibraryStore'
import Header from './components/Header'
import AddBar from './components/AddBar'
import HomeTiles from './components/HomeTiles'
import CategoryView from './components/CategoryView'
import FiltersBar from './components/FiltersBar'
import AddFlow from './components/AddFlow'
import ItemDetail from './components/ItemDetail'
import SettingsModal from './components/SettingsModal'
import CategoryManagerModal from './components/CategoryManagerModal'
import Modal from './components/Modal'
import { DEMO } from './services/env'
import { consumeSharedImage } from './services/shareTarget'
import { connectSync } from './services/sync'

// התאמת פריט לערך סינון, לפי מפתח הפילטר
const MATCHERS = {
  type: (it, v) => v === 'all' || it.type === v,
  genre: (it, v) => (it.genres || []).includes(v),
  platform: (it, v) => (it.availability || []).some((a) => a.platform === v),
  showType: (it, v) => it.showType === v,
  kind: (it, v) => it.kind === v,
  tag: (it, v) => (it.tags || []).includes(v),
}

function sortByMode(items, sort) {
  const arr = [...items]
  switch (sort) {
    case 'title':
      return arr.sort((a, b) => (a.titleHe || '').localeCompare(b.titleHe || '', 'he'))
    case 'date': {
      // הופעות קרובות קודם (הקרובה ביותר ראשונה), אחריהן הופעות שעברו (האחרונה ראשונה),
      // ובסוף פריטים בלי תאריך (אמנים), לפי החדש ביותר
      const today = new Date().toISOString().slice(0, 10)
      const withDate = arr.filter((x) => x.eventDate)
      const noDate = arr.filter((x) => !x.eventDate)
      const upcoming = withDate
        .filter((x) => x.eventDate >= today)
        .sort((a, b) => (a.eventDate < b.eventDate ? -1 : 1))
      const past = withDate
        .filter((x) => x.eventDate < today)
        .sort((a, b) => (a.eventDate > b.eventDate ? -1 : 1))
      return [...upcoming, ...past, ...noDate]
    }
    default:
      return arr // 'recent' — הסדר המקורי כבר מהחדש לישן
  }
}

// פריטים שסומנו כבוצעו יורדים תמיד לסוף הרשימה (בכל מיון), כדי שהמסך יתמקד במה שעוד לפני
function sortItems(items, sort) {
  const active = items.filter((it) => !it.completed)
  const done = items.filter((it) => it.completed)
  return [...sortByMode(active, sort), ...sortByMode(done, sort)]
}

export default function App() {
  const items = useLibraryStore((s) => s.items)
  const categories = useLibraryStore((s) => s.categories)
  const seeded = useLibraryStore((s) => s.seeded)
  const seedDemo = useLibraryStore((s) => s.seedDemo)
  const migrateLegacyItems = useLibraryStore((s) => s.migrateLegacyItems)
  const ensureBuiltinCategories = useLibraryStore((s) => s.ensureBuiltinCategories)

  const [view, setView] = useState(null) // null (מסך פתיחה) | מזהה קטגוריה
  const [filters, setFilters] = useState({})
  const [sort, setSort] = useState('recent')
  const [addFlow, setAddFlow] = useState(null) // {mode, file?, category?}
  const [showAddChooser, setShowAddChooser] = useState(false)
  const [openItemId, setOpenItemId] = useState(null)
  const [showSettings, setShowSettings] = useState(false)
  const [showCategoryManager, setShowCategoryManager] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    migrateLegacyItems()
    ensureBuiltinCategories()
    if (DEMO && !seeded && items.length === 0) seedDemo()
    if (!DEMO) connectSync()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // שיתוף מאפליקציה אחרת → פתיחת זרימת ההוספה: תמונה (גוגל תמונות / וואטסאפ),
  // או קישור/טקסט (יוטיוב, ספוטיפיי וכו' — נכנסים להאזנה או לחיפוש שם)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('shared') === '1') {
      consumeSharedImage().then((file) => {
        if (file) setAddFlow({ mode: 'image', file, category: null })
        window.history.replaceState(null, '', window.location.pathname)
      })
      return
    }
    const sharedText = params.get('shared-text')
    if (sharedText) {
      window.history.replaceState(null, '', window.location.pathname)
      setAddFlow({ mode: 'share', sharedText, category: null })
    }
  }, [])

  const category = view ? categories.find((c) => c.id === view) : null

  const categoryItems = useMemo(
    () =>
      category
        ? items.filter((it) => (category.builtin ? category.types.includes(it.type) : it.categoryId === category.id))
        : [],
    [items, category],
  )

  const filtered = useMemo(
    () =>
      categoryItems.filter((it) =>
        Object.entries(filters).every(([key, value]) => {
          if (value == null) return true
          const match = MATCHERS[key]
          return match ? match(it, value) : true
        }),
      ),
    [categoryItems, filters],
  )

  const sorted = useMemo(() => sortItems(filtered, sort), [filtered, sort])

  const openItem = items.find((it) => it.id === openItemId)

  const openCategory = (id) => {
    setFilters({})
    setSort(id === 'live' ? 'date' : 'recent')
    setView(id)
  }

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2200)
  }

  const startAdd = (flow) => {
    setShowAddChooser(false)
    setAddFlow({ category: view, ...flow })
  }

  return (
    <div className={`min-h-screen ${view ? 'pb-48' : 'pb-10'}`}>
      <Header onSettings={() => setShowSettings(true)} />

      <main className="max-w-lg mx-auto px-3">
        {view === null ? (
          <>
            <AddBar
              onImage={(file) => startAdd({ mode: 'image', file, category: null })}
              onName={() => startAdd({ mode: 'name', category: null })}
              onLink={() => startAdd({ mode: 'link', category: null })}
            />
            <div className="flex justify-end mt-3">
              <button
                onClick={() => setShowCategoryManager(true)}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-500 bg-white border border-slate-200 rounded-full px-3 py-1.5"
              >
                <ListTree className="w-3.5 h-3.5" />
                ניהול קטגוריות
              </button>
            </div>
            <HomeTiles categories={categories} items={items} onOpen={openCategory} />
          </>
        ) : (
          <CategoryView
            category={category}
            items={sorted}
            totalCount={categoryItems.length}
            onBack={() => setView(null)}
            onOpenItem={setOpenItemId}
          />
        )}
      </main>

      {view !== null && (
        <>
          <FiltersBar
            category={category}
            items={categoryItems}
            filters={filters}
            setFilters={setFilters}
            sort={sort}
            setSort={setSort}
            shownCount={sorted.length}
          />
          <button
            onClick={() => setShowAddChooser(true)}
            className="fixed bottom-40 start-4 z-30 p-3.5 rounded-full bg-teal-700 text-white shadow-lg active:scale-95 transition"
            aria-label="הוספת פריט"
          >
            <Plus className="w-6 h-6" />
          </button>
        </>
      )}

      {showAddChooser && (
        <Modal
          title={`הוספה ל${category?.label || 'המלצות'}`}
          onClose={() => setShowAddChooser(false)}
        >
          <AddBar
            onImage={(file) => startAdd({ mode: 'image', file })}
            onName={() => startAdd({ mode: 'name' })}
            onLink={() => startAdd({ mode: 'link' })}
          />
        </Modal>
      )}

      {addFlow && (
        <AddFlow
          {...addFlow}
          onClose={() => setAddFlow(null)}
          onSaved={() => {
            setAddFlow(null)
            showToast('נשמר בהמלצות ✓')
          }}
        />
      )}
      {openItem && <ItemDetail item={openItem} onClose={() => setOpenItemId(null)} />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      {showCategoryManager && <CategoryManagerModal onClose={() => setShowCategoryManager(false)} />}

      {toast && (
        <div className="fixed bottom-40 inset-x-0 flex justify-center z-50 pointer-events-none">
          <div className="bg-emerald-600 text-white px-4 py-2 rounded-full shadow-lg text-sm font-bold">
            {toast}
          </div>
        </div>
      )}
    </div>
  )
}
