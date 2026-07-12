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

const EMPTY_FILTERS = { type: 'all', genre: null, platform: null }

export default function App() {
  const items = useLibraryStore((s) => s.items)
  const seeded = useLibraryStore((s) => s.seeded)
  const seedDemo = useLibraryStore((s) => s.seedDemo)

  const [view, setView] = useState(null) // null (מסך פתיחה) | 'books' | 'screen'
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [addFlow, setAddFlow] = useState(null) // {mode:'image', file} | {mode:'name'}
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
      if (file) setAddFlow({ mode: 'image', file })
      window.history.replaceState(null, '', window.location.pathname)
    })
  }, [])

  const books = useMemo(() => items.filter((it) => it.type === 'book'), [items])
  const screen = useMemo(() => items.filter((it) => it.type !== 'book'), [items])

  const categoryItems = view === 'books' ? books : screen

  const filtered = useMemo(
    () =>
      categoryItems.filter((it) => {
        if (view === 'screen' && filters.type !== 'all' && it.type !== filters.type) return false
        if (filters.genre && !(it.genres || []).includes(filters.genre)) return false
        if (
          filters.platform &&
          !(it.availability || []).some((a) => a.platform === filters.platform)
        )
          return false
        return true
      }),
    [categoryItems, filters, view],
  )

  const openItem = items.find((it) => it.id === openItemId)

  const openCategory = (v) => {
    setFilters(EMPTY_FILTERS)
    setView(v)
  }

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2200)
  }

  const startAdd = (flow) => {
    setShowAddChooser(false)
    setAddFlow(flow)
  }

  return (
    <div className={`min-h-screen ${view ? 'pb-44' : 'pb-10'}`}>
      <Header onSettings={() => setShowSettings(true)} />

      <main className="max-w-lg mx-auto px-3">
        {view === null ? (
          <>
            <AddBar
              onImage={(file) => startAdd({ mode: 'image', file })}
              onName={() => startAdd({ mode: 'name' })}
            />
            <HomeTiles
              bookCount={books.length}
              screenCount={screen.length}
              onOpen={openCategory}
            />
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
            className="fixed bottom-36 start-4 z-30 w-13 h-13 p-3.5 rounded-full bg-indigo-600 text-white shadow-lg active:scale-95 transition"
            aria-label="הוספת פריט"
          >
            <Plus className="w-6 h-6" />
          </button>
        </>
      )}

      {showAddChooser && (
        <Modal title="הוספת פריט חדש" onClose={() => setShowAddChooser(false)}>
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
            showToast('נשמר בספרייה ✓')
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
