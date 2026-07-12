import { useEffect, useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import useLibraryStore from './store/useLibraryStore'
import Header from './components/Header'
import AddBar from './components/AddBar'
import HomeTiles from './components/HomeTiles'
import CategoryView from './components/CategoryView'
import FiltersBar from './components/FiltersBar'
import AddFlow from './components/AddFlow'
import ItemDetail from './components/ItemDetail'
import SettingsModal from './components/SettingsModal'
import Modal from './components/Modal'
import { DEMO } from './services/env'
import { consumeSharedImage } from './services/shareTarget'
import { CATEGORY_BY_ID } from './data/constants'

// התאמת פריט לערך סינון, לפי מפתח הפילטר
const MATCHERS = {
  type: (it, v) => v === 'all' || it.type === v,
  genre: (it, v) => (it.genres || []).includes(v),
  platform: (it, v) => (it.availability || []).some((a) => a.platform === v),
  placeType: (it, v) => (it.placeTypes || []).includes(v),
  audience: (it, v) => (it.audiences || []).includes(v),
  region: (it, v) => it.region === v,
  dishType: (it, v) => it.dishType === v,
  kashrut: (it, v) => it.kashrut === v,
  tag: (it, v) => (it.tags || []).includes(v),
  productCategory: (it, v) => it.productCategory === v,
}

export default function App() {
  const items = useLibraryStore((s) => s.items)
  const seeded = useLibraryStore((s) => s.seeded)
  const seedDemo = useLibraryStore((s) => s.seedDemo)

  const [view, setView] = useState(null) // null (מסך פתיחה) | מזהה קטגוריה
  const [filters, setFilters] = useState({})
  const [addFlow, setAddFlow] = useState(null) // {mode, file?, category?}
  const [showAddChooser, setShowAddChooser] = useState(false)
  const [openItemId, setOpenItemId] = useState(null)
  const [showSettings, setShowSettings] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (DEMO && !seeded && items.length === 0) seedDemo()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // תמונה ששותפה מאפליקציה אחרת (גוגל תמונות / וואטסאפ) → פתיחת זרימת ההוספה
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('shared') !== '1') return
    consumeSharedImage().then((file) => {
      if (file) setAddFlow({ mode: 'image', file, category: null })
      window.history.replaceState(null, '', window.location.pathname)
    })
  }, [])

  const category = view ? CATEGORY_BY_ID[view] : null

  const categoryItems = useMemo(
    () => (category ? items.filter((it) => category.types.includes(it.type)) : []),
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

  const openItem = items.find((it) => it.id === openItemId)

  const openCategory = (id) => {
    setFilters({})
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
            />
            <HomeTiles items={items} onOpen={openCategory} />
          </>
        ) : (
          <CategoryView
            view={view}
            items={filtered}
            totalCount={categoryItems.length}
            onBack={() => setView(null)}
            onOpenItem={setOpenItemId}
          />
        )}
      </main>

      {view !== null && (
        <>
          <FiltersBar
            mode={view}
            items={categoryItems}
            filters={filters}
            setFilters={setFilters}
            shownCount={filtered.length}
          />
          <button
            onClick={() => setShowAddChooser(true)}
            className="fixed bottom-40 start-4 z-30 p-3.5 rounded-full bg-indigo-600 text-white shadow-lg active:scale-95 transition"
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
