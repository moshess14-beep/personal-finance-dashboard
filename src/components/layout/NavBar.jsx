import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Target,
  CalendarCheck,
  Landmark,
  CreditCard,
  PiggyBank,
  Wallet,
  Camera,
  Clock,
  TrendingUp,
} from 'lucide-react'
import ThemeToggle from './ThemeToggle'

const LINKS = [
  { to: '/', label: 'לוח בקרה', icon: LayoutDashboard, end: true },
  { to: '/goals', label: 'עצמאות כלכלית', icon: Target },
  { to: '/update', label: 'עדכון תקופתי', icon: CalendarCheck },
  { to: '/assets', label: 'נכסים', icon: Landmark },
  { to: '/liabilities', label: 'התחייבויות', icon: CreditCard },
  { to: '/income', label: 'הכנסות', icon: Wallet },
  { to: '/savings', label: 'חיסכון חודשי', icon: PiggyBank },
  { to: '/history', label: 'צילומי מצב', icon: Camera },
  { to: '/timeline', label: 'ציר זמן', icon: Clock },
]

function NavItem({ to, label, icon: Icon, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      aria-label={label}
      className={({ isActive }) =>
        [
          'flex shrink-0 items-center gap-2 rounded-lg px-1.5 py-1.5 text-sm font-medium transition-colors sm:px-2.5 sm:py-2',
          isActive
            ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white',
        ].join(' ')
      }
    >
      <Icon className="size-4 sm:size-4.5" />
      <span className="hidden xl:inline">{label}</span>
    </NavLink>
  )
}

export default function NavBar() {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-2 py-2.5 sm:gap-4 sm:px-4 sm:py-3">
        <div className="hidden shrink-0 items-center gap-2 font-semibold text-slate-900 md:flex dark:text-white">
          <TrendingUp className="size-5 text-brand-600 dark:text-brand-400" />
          <span>מעקב הון אישי</span>
        </div>
        <nav className="flex min-w-0 items-center gap-0.5 overflow-x-auto sm:gap-1">
          {LINKS.map((link) => (
            <NavItem key={link.to} {...link} />
          ))}
        </nav>
        <ThemeToggle />
      </div>
    </header>
  )
}
