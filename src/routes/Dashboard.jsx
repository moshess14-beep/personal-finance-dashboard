import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useShallow } from 'zustand/react/shallow'
import { Landmark, CreditCard, PiggyBank, Wallet, TrendingUp } from 'lucide-react'
import {
  useFinanceStore,
  selectTotalAssets,
  selectTotalLiabilities,
  selectTotalMonthlySavings,
  selectTotalMonthlyIncome,
  selectWorkIncome,
  selectAssetIncome,
  selectMonthlyNetWorthGrowth,
  selectNetWorth,
} from '../store/useFinanceStore'
import { formatCurrency } from '../utils/formatCurrency'
import { summarizeByCategory } from '../utils/aggregations'
import NetWorthHero from '../components/dashboard/NetWorthHero'
import StatCard from '../components/dashboard/StatCard'
import NetWorthProgressChart from '../components/dashboard/NetWorthProgressChart'
import CategoryDonutChart from '../components/dashboard/CategoryDonutChart'
import AssetsVsLiabilitiesMeter from '../components/dashboard/AssetsVsLiabilitiesMeter'
import IncomeBreakdownMeter from '../components/dashboard/IncomeBreakdownMeter'
import BackupControls from '../components/common/BackupControls'

const sinceDateFormatter = new Intl.DateTimeFormat('he-IL', { day: 'numeric', month: 'short', year: '2-digit' })

export default function Dashboard() {
  const assets = useFinanceStore((s) => s.assets)
  const liabilities = useFinanceStore((s) => s.liabilities)
  const incomeSources = useFinanceStore((s) => s.incomeSources)
  const historyPoints = useFinanceStore((s) => s.historyPoints)
  const assetCategories = useFinanceStore((s) => s.categories.assets)
  const liabilityCategories = useFinanceStore((s) => s.categories.liabilities)
  const incomeCategories = useFinanceStore((s) => s.categories.income)
  const totalAssets = useFinanceStore(selectTotalAssets)
  const totalLiabilities = useFinanceStore(selectTotalLiabilities)
  const totalMonthlySavings = useFinanceStore(selectTotalMonthlySavings)
  const totalMonthlyIncome = useFinanceStore(selectTotalMonthlyIncome)
  const workIncome = useFinanceStore(selectWorkIncome)
  const assetIncome = useFinanceStore(selectAssetIncome)
  const monthlyGrowth = useFinanceStore(useShallow(selectMonthlyNetWorthGrowth))
  const netWorth = useFinanceStore(selectNetWorth)
  const recordNetWorthSnapshot = useFinanceStore((s) => s.recordNetWorthSnapshot)

  // Lightweight daily history point, so a trend is always available on the
  // hero without requiring an explicit history point.
  useEffect(() => {
    recordNetWorthSnapshot(netWorth)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [netWorth])

  const hasAnyData = assets.length > 0 || liabilities.length > 0
  const topIncomeCategory = summarizeByCategory(incomeSources, incomeCategories, 'light', 'amount')[0]

  // The chart should always reach "now", not stop at whatever date the last
  // manual history point happens to be. historyPoints themselves are frozen
  // snapshots and must never be mutated here - this only appends an extra,
  // unsaved point built from the live totals for rendering.
  const todayStr = new Date().toISOString().slice(0, 10)
  const hasTodayHistoryPoint = historyPoints.some((p) => p.date === todayStr)
  const chartPoints =
    historyPoints.length > 0 && !hasTodayHistoryPoint
      ? [...historyPoints, { id: 'live-today', date: todayStr, totalAssets, totalLiabilities, isLive: true }]
      : historyPoints

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

      <NetWorthProgressChart points={chartPoints} delay={0.05} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          icon={Landmark}
          label="סך נכסים"
          value={formatCurrency(totalAssets)}
          subLabel={`${assets.length} נכסים רשומים`}
          delay={0.1}
        />
        <StatCard
          icon={CreditCard}
          label="סך התחייבויות"
          value={formatCurrency(totalLiabilities)}
          subLabel={`${liabilities.length} התחייבויות רשומות`}
          delay={0.13}
        />
        <StatCard
          icon={Wallet}
          label="הכנסה חודשית"
          value={formatCurrency(totalMonthlyIncome)}
          subLabel={
            topIncomeCategory
              ? `בעיקר ${topIncomeCategory.label} (${topIncomeCategory.percent.toFixed(0)}%)`
              : 'לחודש'
          }
          delay={0.16}
          to="/income"
        />
        <StatCard
          icon={PiggyBank}
          label="חיסכון חודשי"
          value={formatCurrency(totalMonthlySavings)}
          subLabel={`כ־${formatCurrency(totalMonthlySavings * 12)} בשנה`}
          delay={0.19}
          to="/savings"
        />
        <StatCard
          icon={TrendingUp}
          label="גידול חודשי בהון"
          value={monthlyGrowth ? formatCurrency(monthlyGrowth.amount) : 'אין מספיק נתונים'}
          valueClassName={
            monthlyGrowth ? (monthlyGrowth.amount >= 0 ? 'text-gain' : 'text-loss') : undefined
          }
          subLabel={
            monthlyGrowth
              ? `${monthlyGrowth.amount >= 0 ? '+' : ''}${monthlyGrowth.percent.toFixed(1)}% בחודש, לעומת ${sinceDateFormatter.format(new Date(monthlyGrowth.sinceDate))}`
              : 'נדרשת נקודת היסטוריה בת 14+ יום'
          }
          delay={0.22}
          to="/history"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <CategoryDonutChart
          title="חלוקת נכסים לפי קטגוריה"
          items={assets}
          categories={assetCategories}
          delay={0.24}
        />
        <CategoryDonutChart
          title="חלוקת התחייבויות לפי קטגוריה"
          items={liabilities}
          categories={liabilityCategories}
          delay={0.28}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <AssetsVsLiabilitiesMeter
          totalAssets={totalAssets}
          totalLiabilities={totalLiabilities}
          delay={0.32}
        />
        <IncomeBreakdownMeter workIncome={workIncome} assetIncome={assetIncome} delay={0.34} />
      </div>

      <BackupControls />
    </div>
  )
}
