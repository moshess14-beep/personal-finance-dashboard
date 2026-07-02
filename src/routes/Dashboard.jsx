import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Landmark, CreditCard, PiggyBank } from 'lucide-react'
import {
  useFinanceStore,
  selectTotalAssets,
  selectTotalLiabilities,
  selectTotalMonthlySavings,
  selectNetWorth,
} from '../store/useFinanceStore'
import { formatCurrency } from '../utils/formatCurrency'
import { ASSET_CATEGORIES, LIABILITY_CATEGORIES } from '../utils/categories'
import NetWorthHero from '../components/dashboard/NetWorthHero'
import StatCard from '../components/dashboard/StatCard'
import CategoryDonutChart from '../components/dashboard/CategoryDonutChart'
import AssetsVsLiabilitiesMeter from '../components/dashboard/AssetsVsLiabilitiesMeter'
import BackupControls from '../components/common/BackupControls'

export default function Dashboard() {
  const assets = useFinanceStore((s) => s.assets)
  const liabilities = useFinanceStore((s) => s.liabilities)
  const totalAssets = useFinanceStore(selectTotalAssets)
  const totalLiabilities = useFinanceStore(selectTotalLiabilities)
  const totalMonthlySavings = useFinanceStore(selectTotalMonthlySavings)
  const netWorth = useFinanceStore(selectNetWorth)
  const recordNetWorthSnapshot = useFinanceStore((s) => s.recordNetWorthSnapshot)

  // Lightweight daily history point, so a trend is always available on the
  // hero without requiring the (later) explicit quarterly-snapshot flow.
  useEffect(() => {
    recordNetWorthSnapshot(netWorth)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [netWorth])

  const hasAnyData = assets.length > 0 || liabilities.length > 0

  return (
    <div className="space-y-4">
      <NetWorthHero />

      {!hasAnyData && (
        <p className="-mt-2 text-center text-sm text-slate-400 dark:text-slate-500">
          עדיין אין נתונים. התחל ב
          <Link to="/assets" className="mx-1 text-brand-600 hover:underline dark:text-brand-400">
            הוספת נכס
          </Link>
          כדי לראות את הדשבורד קם לחיים.
        </p>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          icon={Landmark}
          label="סך נכסים"
          value={formatCurrency(totalAssets)}
          subLabel={`${assets.length} נכסים רשומים`}
          delay={0.05}
        />
        <StatCard
          icon={CreditCard}
          label="סך התחייבויות"
          value={formatCurrency(totalLiabilities)}
          subLabel={`${liabilities.length} התחייבויות רשומות`}
          delay={0.1}
        />
        <StatCard
          icon={PiggyBank}
          label="חיסכון חודשי"
          value={formatCurrency(totalMonthlySavings)}
          subLabel={`כ־${formatCurrency(totalMonthlySavings * 12)} בשנה`}
          delay={0.15}
          to="/savings"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <CategoryDonutChart
          title="חלוקת נכסים לפי קטגוריה"
          items={assets}
          categories={ASSET_CATEGORIES}
          delay={0.2}
        />
        <CategoryDonutChart
          title="חלוקת התחייבויות לפי קטגוריה"
          items={liabilities}
          categories={LIABILITY_CATEGORIES}
          delay={0.25}
        />
      </div>

      <AssetsVsLiabilitiesMeter
        totalAssets={totalAssets}
        totalLiabilities={totalLiabilities}
        delay={0.3}
      />

      <BackupControls />
    </div>
  )
}
