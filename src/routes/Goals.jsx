import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Target, Pencil, Check, X, RotateCcw, Sparkles } from 'lucide-react'
import {
  useFinanceStore,
  selectNetConsumption,
  selectCalculatedTarget,
  selectEffectiveTarget,
  selectNetWorth,
  selectRealEstateValue,
  selectOtherAssetsValue,
  selectTotalLiabilities,
  selectManualMonthlySavings,
  selectTotalLoanPrincipalPaydown,
} from '../store/useFinanceStore'
import { formatCurrency } from '../utils/formatCurrency'
import { simulateNetWorth, projectGoalTimeline, monthsToReachAmount } from '../utils/goalProjection'
import { buildMilestones, upcomingMilestones } from '../utils/milestones'
import { formatMonthsAsDuration } from '../utils/formatDuration'
import NextMilestoneHero from '../components/goals/NextMilestoneHero'
import UpcomingMilestonesList from '../components/goals/UpcomingMilestonesList'
import GoalProjectionChart from '../components/goals/GoalProjectionChart'
import CategoryGrowthClassifier from '../components/goals/CategoryGrowthClassifier'
import SuccessMessage from '../components/common/SuccessMessage'
import { useTransientMessage } from '../utils/useTransientMessage'

const MAX_YEARS = 60

function RateField({ label, value, onChange, suffix = '%' }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">{label}</span>
      <div className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-950">
        <input
          type="number"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
          className="w-full bg-transparent text-sm font-semibold tabular-nums outline-none"
        />
        <span className="text-xs text-slate-400 dark:text-slate-500">{suffix}</span>
      </div>
    </label>
  )
}

export default function Goals() {
  const assets = useFinanceStore((s) => s.assets)
  const liabilities = useFinanceStore((s) => s.liabilities)
  const goal = useFinanceStore((s) => s.financialGoal)
  const setFinancialGoal = useFinanceStore((s) => s.setFinancialGoal)

  const netConsumption = useFinanceStore(selectNetConsumption)
  const calculatedTarget = useFinanceStore(selectCalculatedTarget)
  const effectiveTarget = useFinanceStore(selectEffectiveTarget)
  const netWorth = useFinanceStore(selectNetWorth)
  const realEstateValue = useFinanceStore(selectRealEstateValue)
  const otherAssetsValue = useFinanceStore(selectOtherAssetsValue)
  const liabilitiesValue = useFinanceStore(selectTotalLiabilities)
  const manualSavings = useFinanceStore(selectManualMonthlySavings)
  const principalPaydown = useFinanceStore(selectTotalLoanPrincipalPaydown)

  const [message, showMessage] = useTransientMessage()
  const [editingTarget, setEditingTarget] = useState(false)
  const [targetDraft, setTargetDraft] = useState('')

  // The what-if playground: starts from the saved assumptions + today's real
  // savings rate, but never writes back to the store until the user
  // explicitly saves it - dragging these around is exploration, not editing.
  const [whatIf, setWhatIf] = useState(() => ({
    monthlySavings: manualSavings,
    inflationRate: goal.inflationRate,
    realEstateRate: goal.realEstateGrowthRate,
    otherRate: goal.otherGrowthRate,
  }))

  // Only the three rates are persistable assumptions - monthlySavings here is
  // always hypothetical (real savings are edited on the Savings screen), so
  // it's tracked separately and never blocks the "saved" state.
  const ratesDirty =
    Number(whatIf.inflationRate) !== goal.inflationRate ||
    Number(whatIf.realEstateRate) !== goal.realEstateGrowthRate ||
    Number(whatIf.otherRate) !== goal.otherGrowthRate
  const savingsIsHypothetical = Number(whatIf.monthlySavings) !== manualSavings
  const isDirty = ratesDirty || savingsIsHypothetical

  // One net-worth trajectory drives everything below - the overall
  // (inflation-adjusted) goal and every fixed-amount milestone all read from
  // the same simulated path, so they can never disagree with each other.
  const trajectory = useMemo(
    () =>
      simulateNetWorth({
        realEstateValue,
        otherAssetsValue,
        liabilitiesValue,
        annualNewSavings: (Number(whatIf.monthlySavings) || 0) * 12,
        annualPrincipalPaydown: principalPaydown * 12,
        realEstateRate: Number(whatIf.realEstateRate) || 0,
        otherRate: Number(whatIf.otherRate) || 0,
        maxYears: MAX_YEARS,
      }),
    [realEstateValue, otherAssetsValue, liabilitiesValue, principalPaydown, whatIf],
  )

  const projection = useMemo(
    () =>
      projectGoalTimeline({
        trajectory,
        target: effectiveTarget,
        inflationRate: Number(whatIf.inflationRate) || 0,
      }),
    [trajectory, effectiveTarget, whatIf.inflationRate],
  )

  const milestones = useMemo(() => buildMilestones(effectiveTarget), [effectiveTarget])
  const upcoming = useMemo(() => upcomingMilestones(milestones, netWorth, 4), [milestones, netWorth])
  const milestoneRows = useMemo(
    () => upcoming.map((milestone) => ({ milestone, monthsToReach: monthsToReachAmount(trajectory, milestone.amount) })),
    [upcoming, trajectory],
  )
  const nextMilestoneRow = milestoneRows[0] ?? null

  const hasAnyData = assets.length > 0 || liabilities.length > 0
  const progressPct = effectiveTarget > 0 ? Math.min(100, Math.max(0, (netWorth / effectiveTarget) * 100)) : 0

  // The full MAX_YEARS series is what crossingMonth is computed against, but
  // charting all of it once the goal is reached early squashes the
  // interesting part: compounding at 10%/year over 60 years dwarfs a
  // ~25-year crossing point on the same axis. Show a few years of context
  // past the goal instead of the whole tail; only show the full range when
  // the goal isn't reached within it.
  const chartSeries =
    projection.crossingMonth != null
      ? projection.series.slice(0, Math.min(projection.series.length, projection.crossingMonth + 60))
      : projection.series

  function resetWhatIf() {
    setWhatIf({
      monthlySavings: manualSavings,
      inflationRate: goal.inflationRate,
      realEstateRate: goal.realEstateGrowthRate,
      otherRate: goal.otherGrowthRate,
    })
  }

  function saveWhatIfAsDefault() {
    setFinancialGoal({
      inflationRate: Number(whatIf.inflationRate) || 0,
      realEstateGrowthRate: Number(whatIf.realEstateRate) || 0,
      otherGrowthRate: Number(whatIf.otherRate) || 0,
    })
    showMessage('ההנחות נשמרו כברירת מחדל')
  }

  function startEditTarget() {
    setTargetDraft(String(Math.round(effectiveTarget)))
    setEditingTarget(true)
  }

  function saveManualTarget() {
    const num = Number(targetDraft)
    if (!Number.isNaN(num) && num > 0) {
      setFinancialGoal({ mode: 'manual', manualTarget: num })
      showMessage('היעד עודכן')
    }
    setEditingTarget(false)
  }

  function resetToCalculated() {
    setFinancialGoal({ mode: 'auto', manualTarget: null })
    showMessage('היעד חוזר לחישוב אוטומטי')
  }

  if (!hasAnyData) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <Target className="mx-auto mb-3 size-9 text-slate-300 dark:text-slate-600" />
        <h1 className="text-lg font-bold text-slate-900 dark:text-white">אין עדיין מספיק נתונים ליעד</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          כדי לחשב יעד עצמאות כלכלית צריך לפחות נכס אחד. התחל ב
          <Link to="/assets" className="mx-1 text-brand-600 hover:underline dark:text-brand-400">
            הוספת נכס
          </Link>
          .
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Target className="size-5 text-brand-600 dark:text-brand-400" />
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">עצמאות כלכלית</h1>
      </div>

      <SuccessMessage message={message} />

      {/* the near, motivating milestone leads the page */}
      <NextMilestoneHero
        milestone={nextMilestoneRow?.milestone ?? null}
        monthsToReach={nextMilestoneRow?.monthsToReach ?? null}
        netWorth={netWorth}
      />

      <UpcomingMilestonesList rows={milestoneRows} />

      {/* overall FI target - secondary, smaller than the milestone above */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">היעד הכללי לעצמאות כלכלית</p>
            {editingTarget ? (
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="number"
                  autoFocus
                  value={targetDraft}
                  onChange={(e) => setTargetDraft(e.target.value)}
                  className="w-36 rounded-lg border border-brand-500 bg-white px-3 py-1.5 text-base font-bold tabular-nums outline-none focus:ring-2 focus:ring-brand-500/20 dark:bg-slate-950"
                />
                <button
                  type="button"
                  onClick={saveManualTarget}
                  aria-label="שמור יעד"
                  className="inline-flex size-8 items-center justify-center rounded-lg bg-brand-600 text-white hover:bg-brand-700"
                >
                  <Check className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setEditingTarget(false)}
                  aria-label="בטל"
                  className="inline-flex size-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="size-4" />
                </button>
              </div>
            ) : (
              <p className="text-xl font-bold tabular-nums text-slate-900 dark:text-white">
                {formatCurrency(effectiveTarget)}
              </p>
            )}
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
              {goal.mode === 'manual'
                ? 'יעד מותאם אישית'
                : `מחושב אוטומטית: הכנסה חודשית פחות חיסכון (${formatCurrency(netConsumption)} צריכה נטו) × 300`}
            </p>
          </div>
          {!editingTarget && (
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={startEditTarget}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <Pencil className="size-3.5" />
                עריכת יעד
              </button>
              {goal.mode === 'manual' && (
                <button
                  type="button"
                  onClick={resetToCalculated}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <RotateCcw className="size-3.5" />
                  חזרה לחישוב אוטומטי ({formatCurrency(calculatedTarget)})
                </button>
              )}
            </div>
          )}
        </div>

        <div className="mt-4">
          <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${progressPct}%` }} />
          </div>
          <div className="mt-1.5 flex justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>{formatCurrency(netWorth)} היום</span>
            <span>{progressPct.toFixed(1)}% מהיעד הכללי</span>
          </div>
        </div>
      </div>

      {/* projection summary + chart */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-1 text-sm font-semibold text-slate-900 dark:text-white">תחזית התקדמות ליעד הכללי</h2>
        <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
          {projection.crossingMonth === 0 ? (
            <span className="font-semibold text-gain">כבר הגעת ליעד! 🎉</span>
          ) : projection.crossingMonth != null ? (
            <>
              בקצב הנוכחי תגיע ליעד הכללי בעוד{' '}
              <span className="font-semibold text-slate-900 dark:text-white">
                {formatMonthsAsDuration(projection.crossingMonth)}
              </span>
              , כשהיעד יעמוד אז על{' '}
              <span className="font-semibold text-slate-900 dark:text-white">
                {formatCurrency(projection.series[projection.crossingMonth].target)}
              </span>
              .
            </>
          ) : (
            `לא צפוי להגיע ליעד תוך ${MAX_YEARS} שנה בהנחות הנוכחיות - נסה להגדיל את קצב החיסכון במחשבון למטה.`
          )}
        </p>
        <GoalProjectionChart series={chartSeries} crossingMonth={projection.crossingMonth} />
      </div>

      {/* what-if calculator */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-1 flex items-center gap-2">
          <Sparkles className="size-4 text-brand-600 dark:text-brand-400" />
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">מחשבון "מה אם"</h2>
        </div>
        <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
          שנה חיסכון חודשי או קצבי צמיחה, וראה איך זה משפיע על היעד הבא ועל התחזית הכללית - בלי לשמור כלום, עד שתבחר.
        </p>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <label className="col-span-2 block sm:col-span-1">
            <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
              חיסכון חודשי (₪)
            </span>
            <input
              type="number"
              inputMode="decimal"
              value={whatIf.monthlySavings}
              onChange={(e) =>
                setWhatIf((v) => ({ ...v, monthlySavings: e.target.value === '' ? '' : Number(e.target.value) }))
              }
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold tabular-nums outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-950"
            />
            {savingsIsHypothetical && (
              <span className="mt-1 block text-[11px] text-slate-400 dark:text-slate-500">
                בפועל היום: {formatCurrency(manualSavings)}. לשינוי אמיתי - מסך חיסכון.
              </span>
            )}
          </label>
          <RateField
            label="קצב נדל״ן"
            value={whatIf.realEstateRate}
            onChange={(v) => setWhatIf((s) => ({ ...s, realEstateRate: v }))}
          />
          <RateField
            label="קצב נכסים אחרים"
            value={whatIf.otherRate}
            onChange={(v) => setWhatIf((s) => ({ ...s, otherRate: v }))}
          />
          <RateField
            label="אינפלציה"
            value={whatIf.inflationRate}
            onChange={(v) => setWhatIf((s) => ({ ...s, inflationRate: v }))}
          />
        </div>

        {isDirty && (
          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 p-3 dark:border-brand-500/30 dark:bg-brand-500/10">
            <p className="flex-1 text-xs text-brand-800 dark:text-brand-300">
              {ratesDirty
                ? 'אלה הנחות זמניות לבדיקה בלבד - ההנחות השמורות לא השתנו.'
                : 'זו בדיקה עם חיסכון היפותטי - החיסכון בפועל לא השתנה.'}
            </p>
            {ratesDirty && (
              <button
                type="button"
                onClick={saveWhatIfAsDefault}
                className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700"
              >
                שמור קצבים כברירת מחדל
              </button>
            )}
            <button
              type="button"
              onClick={resetWhatIf}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-brand-800 hover:bg-brand-100 dark:text-brand-300 dark:hover:bg-brand-500/10"
            >
              איפוס
            </button>
          </div>
        )}
      </div>

      <CategoryGrowthClassifier />
    </div>
  )
}
