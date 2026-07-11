import { useEffect, useMemo, useState } from 'react'
import useLibraryStore from './store/useLibraryStore'
import Header from './components/Header'
import AddBar from './components/AddBar'
import LibraryColumns from './components/LibraryColumns'
import FiltersBar from './components/FiltersBar'
import AddFlow from './components/AddFlow'
import ItemDetail from './components/ItemDetail'
import SettingsModal from './components/SettingsModal'
import { DEMO } from './services/env'

export default function App() {
  const items = useLibraryStore((s) => s.items)
  const seeded = useLibraryStore((s) => s.seeded)
  const seedDemo = useLibraryStore((s) => s.seedDemo)

  const [filters, setFilters] = useState({ type: 'all', genre: null, platform: null })
  const [addFlow, setAddFlow] = useState(null) // {mode:'image', file} | {mode:'name'}
  const [openItemId, setOpenItemId] = useState(null)
  const [showSettings, setShowSettings] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (DEMO && !seeded && items.length === 0) seedDemo()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = useMemo(
    () =>
      items.filter((it) => {
        if (filters.type !== 'all' && it.type !== filters.type) return false
        if (filters.genre && !(it.genres || []).includes(filters.genre)) return false
        if (filters.platform && !(it.availability || []).some((a) => a.platform === filters.platform))
          return false
        return true
      }),
    [items, filters],
  )

  const openItem = items.find((it) => it.id === openItemId)

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2200)
  }

  return (
    <div className="min-h-screen pb-44">
      <Header onSettings={() => setShowSettings(true)} />

      <main className="max-w-lg mx-auto px-3">
        <AddBar
          onImage={(file) => setAddFlow({ mode: 'image', file })}
          onName={() => setAddFlow({ mode: 'name' })}
        />
        <LibraryColumns
          items={filtered}
          platformFilterActive={!!filters.platform}
          onOpen={setOpenItemId}
        />
      </main>

      <FiltersBar
        items={items}
        filters={filters}
        setFilters={setFilters}
        shownCount={filtered.length}
      />

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
