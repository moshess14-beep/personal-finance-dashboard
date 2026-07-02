import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Landmark, CreditCard, PiggyBank, TrendingUp } from 'lucide-react'
import ThemeToggle from './ThemeToggle'

const LINKS = [
  { to: '/', label: 'לוח בקרה', icon: LayoutDashboard, end: true },
  { to: '/assets', label: 'נכסים', icon: Landmark },
  { to: '/liabilities', label: 'התחייבויות', icon: CreditCard },
  { to: '/savings', label: 'חיסכון חודשי', icon: PiggyBank },
]

function NavItem({ to, label, icon: Icon, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      aria-label={label}
      className={({ isActive }) =>
        [
          'flex shrink-0 items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors sm:px-3',
          isActive
            ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white',
        ].join(' ')
      }
    >
      <Icon className="size-4.5" />
      <span className="hidden sm:inline">{label}</span>
    </NavLink>
  )
}

export default function NavBar() {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex shrink-0 items-center gap-2 font-semibold text-slate-900 dark:text-white">
          <TrendingUp className="size-5 text-brand-600 dark:text-brand-400" />
          <span className="hidden sm:inline">מעקב הון אישי</span>
        </div>
        <nav className="flex items-center gap-1 overflow-x-auto">
          {LINKS.map((link) => (
            <NavItem key={link.to} {...link} />
          ))}
        </nav>
        <ThemeToggle />
      </div>
    </header>
  )
}
