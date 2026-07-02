import { motion } from 'framer-motion'
import { Scale } from 'lucide-react'

export default function AssetsVsLiabilitiesMeter({ totalAssets, totalLiabilities, delay = 0 }) {
  const total = totalAssets + totalLiabilities
  const assetsPct = total > 0 ? (totalAssets / total) * 100 : 0
  const liabilitiesPct = total > 0 ? 100 - assetsPct : 0
  const ratio = totalLiabilities > 0 ? totalAssets / totalLiabilities : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Scale className="size-4 text-slate-500 dark:text-slate-400" />
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
          נכסים מול התחייבויות
        </h2>
        {ratio !== null && (
          <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
            פי {ratio.toFixed(2)} יותר נכסים
          </span>
        )}
      </div>

      {total > 0 ? (
        <>
          <div className="flex h-3.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <motion.div
              className="bg-gain"
              initial={{ width: 0 }}
              animate={{ width: `${assetsPct}%` }}
              transition={{ duration: 0.6, delay: delay + 0.1 }}
            />
            <motion.div
              className="bg-loss"
              initial={{ width: 0 }}
              animate={{ width: `${liabilitiesPct}%` }}
              transition={{ duration: 0.6, delay: delay + 0.1 }}
            />
          </div>
          <div className="mt-2 flex justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>נכסים · {assetsPct.toFixed(0)}%</span>
            <span>התחייבויות · {liabilitiesPct.toFixed(0)}%</span>
          </div>
        </>
      ) : (
        <>
          <div className="h-3.5 rounded-full bg-slate-100 dark:bg-slate-800" />
          <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
            עדיין אין נתונים להשוואה
          </p>
        </>
      )}
    </motion.div>
  )
}
