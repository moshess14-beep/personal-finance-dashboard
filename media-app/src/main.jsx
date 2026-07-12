import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { DEMO } from './services/env'

document.documentElement.lang = 'he'
document.documentElement.dir = 'rtl'

// רישום ה-Service Worker (לשיתוף תמונות ולעבודה כאפליקציה מותקנת)
if (!DEMO && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {})
  })
}

createRoot(document.getElementById('root')).render(<App />)
