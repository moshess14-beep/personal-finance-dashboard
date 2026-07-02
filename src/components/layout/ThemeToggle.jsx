import { Moon, Sun } from 'lucide-react'
import { useThemeStore } from '../../store/useThemeStore'

export default function ThemeToggle() {
  const isDark = useThemeStore((s) => s.isDark)
  const toggle = useThemeStore((s) => s.toggle)

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? 'עבור למצב בהיר' : 'עבור למצב כהה'}
      className="inline-flex size-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
    >
      {isDark ? <Sun className="size-5" /> : <Moon className="size-5" />}
    </button>
  )
}
