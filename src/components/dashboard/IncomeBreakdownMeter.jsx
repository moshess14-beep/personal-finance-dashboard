import { motion } from 'framer-motion'
import { Wallet } from 'lucide-react'
import { formatCurrency } from '../../utils/formatCurrency'

export default function IncomeBreakdownMeter({ workIncome, assetIncome, delay = 0 }) {
  const total = workIncome + assetIncome
  const assetPct = total > 0 ? (assetIncome / total) * 100 : 0
  const workPct = total > 0 ? 100 - assetPct : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Wallet className="size-4 text-slate-500 dark:text-slate-400" />
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
          עבודה מול נכסים בהכנסה
        </h2>
        {total > 0 && (
          <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
            {assetPct.toFixed(0)}% מהנכסים
          </span>
        )}
      </div>

      {total > 0 ? (
        <>
          <div className="flex h-3.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <motion.div
              className="bg-brand-500"
              initial={{ width: 0 }}
              animate={{ width: `${workPct}%` }}
              transition={{ duration: 0.6, delay: delay + 0.1 }}
            />
            <motion.div
              className="bg-gain"
              initial={{ width: 0 }}
              animate={{ width: `${assetPct}%` }}
              transition={{ duration: 0.6, delay: delay + 0.1 }}
            />
          </div>
          <div className="mt-2 flex justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>עבודה · {formatCurrency(workIncome)}</span>
            <span>נכסים · {formatCurrency(assetIncome)}</span>
          </div>
        </>
      ) : (
        <>
          <div className="h-3.5 rounded-full bg-slate-100 dark:bg-slate-800" />
          <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
            עדיין אין מקורות הכנסה להשוואה
          </p>
        </>
      )}
    </motion.div>
  )
}
