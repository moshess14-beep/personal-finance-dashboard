import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

export default function StatCard({ icon: Icon, dotColor, label, value, valueClassName, subLabel, delay = 0, to }) {
  const content = (
    <>
      <div className="mb-2 flex items-center gap-2 text-slate-500 dark:text-slate-400">
        {Icon ? (
          <Icon className="size-4" />
        ) : (
          <span className="size-2 rounded-full" style={{ backgroundColor: dotColor }} aria-hidden="true" />
        )}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${valueClassName ?? 'text-slate-900 dark:text-white'}`}>
        {value}
      </p>
      {subLabel && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{subLabel}</p>}
    </>
  )

  const className =
    'block rounded-2xl border border-slate-200 bg-white p-4 transition-transform hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900 dark:hover:shadow-none'

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
    >
      {to ? (
        <Link to={to} className={className}>
          {content}
        </Link>
      ) : (
        <div className={className}>{content}</div>
      )}
    </motion.div>
  )
}
