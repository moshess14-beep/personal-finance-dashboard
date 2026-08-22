import { useMemo } from 'react'
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
  selectNetWorth,
  selectNetWorthGrowthSinceLastSnapshot,
  buildNetWorthChartSeries,
} from '../store/useFinanceStore'
import { formatCurrency } from '../utils/formatCurrency'
import { summarizeByCategory } from '../utils/aggregations'
import NetWorthHero from '../components/dashboard/NetWorthHero'
import PeriodUpdateCard from '../components/dashboard/PeriodUpdateCard'
import GoalProgressCard from '../components/dashboard/GoalProgressCard'
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
  const assetCategories = useFinanceStore((s) => s.categories.assets)
  const liabilityCategories = useFinanceStore((s) => s.categories.liabilities)
  const incomeCategories = useFinanceStore((s) => s.categories.income)
  const totalAssets = useFinanceStore(selectTotalAssets)
  const totalLiabilities = useFinanceStore(selectTotalLiabilities)
  const totalMonthlySavings = useFinanceStore(selectTotalMonthlySavings)
  const totalMonthlyIncome = useFinanceStore(selectTotalMonthlyIncome)
  const workIncome = useFinanceStore(selectWorkIncome)
  const assetIncome = useFinanceStore(selectAssetIncome)
  const growth = useFinanceStore(useShallow(selectNetWorthGrowthSinceLastSnapshot))
  const snapshots = useFinanceStore((s) => s.snapshots)
  const netWorth = useFinanceStore(selectNetWorth)
  const chartSeries = useMemo(() => buildNetWorthChartSeries(snapshots, netWorth), [snapshots, netWorth])

  const hasAnyData = assets.length > 0 || liabilities.length > 0
  const topIncomeCategory = summarizeByCategory(incomeSources, incomeCategories, 'light', 'amount')[0]

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

      {hasAnyData && (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <PeriodUpdateCard delay={0.04} />
          <GoalProgressCard delay={0.06} />
        </div>
      )}

      <NetWorthProgressChart points={chartSeries} delay={0.05} />

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
          label="גידול מאז הצילום האחרון"
          value={
            growth
              ? `${growth.delta >= 0 ? '+' : ''}${formatCurrency(growth.delta)}`
              : 'אין עדיין צילום'
          }
          valueClassName={growth ? (growth.delta >= 0 ? 'text-gain' : 'text-loss') : undefined}
          subLabel={
            growth
              ? `${growth.delta >= 0 ? '+' : ''}${growth.percent.toFixed(1)}% מאז ${sinceDateFormatter.format(new Date(growth.sinceDate))}`
              : 'סגור תקופה כדי לראות גידול'
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
