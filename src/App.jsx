import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import NavBar from './components/layout/NavBar'
import { useThemeStore, applyThemeClass } from './store/useThemeStore'
import Dashboard from './routes/Dashboard'
import Assets from './routes/Assets'
import Liabilities from './routes/Liabilities'
import Savings from './routes/Savings'

function App() {
  const isDark = useThemeStore((s) => s.isDark)

  useEffect(() => {
    applyThemeClass(isDark)
  }, [isDark])

  return (
    <div className="min-h-svh">
      <NavBar />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/assets" element={<Assets />} />
          <Route path="/liabilities" element={<Liabilities />} />
          <Route path="/savings" element={<Savings />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
