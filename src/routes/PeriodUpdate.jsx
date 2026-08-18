import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  CalendarCheck,
  ArrowLeft,
  ArrowRight,
  Check,
  Landmark,
  CreditCard,
  Wallet,
  PiggyBank,
} from 'lucide-react'
import {
  useFinanceStore,
  selectLatestSnapshot,
  getSnapshotTotals,
} from '../store/useFinanceStore'
import { formatCurrency } from '../utils/formatCurrency'
import { formatRelativeDate } from '../utils/formatDate'
import DateField from '../components/common/DateField'

const today = () => new Date().toISOString().slice(0, 10)
const num = (v) => Number(v) || 0

const STEPS = ['תאריך', 'עדכון', 'סקירה']

// Turns a live list into an { [id]: string } draft of its current values.
function seedDraft(list, field) {
  return Object.fromEntries(list.map((it) => [it.id, String(it[field] ?? '')]))
}
// Only the entries the user actually changed (numeric compare vs the original).
function changedValues(draft, list, field) {
  const out = {}
  for (const it of list) {
    if (num(draft[it.id]) !== num(it[field])) out[it.id] = draft[it.id]
  }
  return out
}

function EditGroup({ icon: Icon, title, items, field, draft, setDraft }) {
  if (items.length === 0) return null
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <Icon className="size-4 text-slate-500 dark:text-slate-400" />
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
      </div>
      <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
        {items.map((it) => {
          const changed = num(draft[it.id]) !== num(it[field])
          return (
            <div key={it.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
              <div className="min-w-32 flex-1">
                <p className="text-sm font-medium text-slate-900 dark:text-white">{it.name}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  ערך קודם: <span className="tabular-nums">{formatCurrency(it[field])}</span>
                  {it.updatedAt && <> · עודכן {formatRelativeDate(it.updatedAt)}</>}
                </p>
              </div>
              {changed && (
                <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
                  שונה
                </span>
              )}
              <input
                type="number"
                inputMode="decimal"
                dir="ltr"
                value={draft[it.id]}
                onChange={(e) => setDraft((d) => ({ ...d, [it.id]: e.target.value }))}
                className={`w-32 rounded-lg border bg-white px-3 py-2 text-sm font-semibold tabular-nums outline-none focus:ring-2 focus:ring-brand-500/20 dark:bg-slate-950 ${
                  changed
                    ? 'border-brand-500 text-slate-900 dark:text-white'
                    : 'border-slate-300 text-slate-500 dark:border-slate-700 dark:text-slate-400'
                }`}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function PeriodUpdate() {
  const navigate = useNavigate()
  const assets = useFinanceStore((s) => s.assets)
  const liabilities = useFinanceStore((s) => s.liabilities)
  const savingsComponents = useFinanceStore((s) => s.savingsComponents)
  const incomeSources = useFinanceStore((s) => s.incomeSources)
  const closePeriod = useFinanceStore((s) => s.closePeriod)
  const latest = useFinanceStore(selectLatestSnapshot)

  const [step, setStep] = useState(0)
  const [date, setDate] = useState(today())
  const [note, setNote] = useState('')
  const [includeFlow, setIncludeFlow] = useState(false)
  const [assetDraft, setAssetDraft] = useState(() => seedDraft(assets, 'value'))
  const [liabDraft, setLiabDraft] = useState(() => seedDraft(liabilities, 'value'))
  const [savingsDraft, setSavingsDraft] = useState(() => seedDraft(savingsComponents, 'amount'))
  const [incomeDraft, setIncomeDraft] = useState(() => seedDraft(incomeSources, 'amount'))

  const hasBalanceData = assets.length > 0 || liabilities.length > 0

  // Resulting net worth from the draft values (live preview during the ritual).
  const draftNetWorth = useMemo(() => {
    const a = assets.reduce((sum, it) => sum + num(assetDraft[it.id]), 0)
    const l = liabilities.reduce((sum, it) => sum + num(liabDraft[it.id]), 0)
    return a - l
  }, [assets, liabilities, assetDraft, liabDraft])

  const anchorNetWorth = latest ? getSnapshotTotals(latest).netWorth : null
  const delta = anchorNetWorth !== null ? draftNetWorth - anchorNetWorth : null

  // The changed rows, for the review step.
  const changes = useMemo(() => {
    const rows = []
    const collect = (list, draft, field) => {
      for (const it of list) {
        if (num(draft[it.id]) !== num(it[field])) {
          rows.push({ id: it.id, name: it.name, from: num(it[field]), to: num(draft[it.id]) })
        }
      }
    }
    collect(assets, assetDraft, 'value')
    collect(liabilities, liabDraft, 'value')
    if (includeFlow) {
      collect(savingsComponents, savingsDraft, 'amount')
      collect(incomeSources, incomeDraft, 'amount')
    }
    return rows
  }, [assets, liabilities, savingsComponents, incomeSources, assetDraft, liabDraft, savingsDraft, incomeDraft, includeFlow])

  function handleClose() {
    closePeriod({
      date,
      note,
      assetValues: changedValues(assetDraft, assets, 'value'),
      liabilityValues: changedValues(liabDraft, liabilities, 'value'),
      savingsValues: includeFlow ? changedValues(savingsDraft, savingsComponents, 'amount') : {},
      incomeValues: includeFlow ? changedValues(incomeDraft, incomeSources, 'amount') : {},
    })
    navigate('/')
  }

  if (!hasBalanceData) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <CalendarCheck className="mx-auto mb-3 size-9 text-slate-300 dark:text-slate-600" />
        <h1 className="text-lg font-bold text-slate-900 dark:text-white">אין עדיין מה לצלם</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          כדי לסגור תקופה צריך לפחות נכס או התחייבות אחת. התחל ב
          <Link to="/assets" className="mx-1 text-brand-600 hover:underline dark:text-brand-400">
            הוספת נכס
          </Link>
          .
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* header + progress */}
      <div>
        <div className="flex items-center gap-2 text-slate-900 dark:text-white">
          <CalendarCheck className="size-5 text-brand-600 dark:text-brand-400" />
          <h1 className="text-xl font-bold">עדכון תקופתי</h1>
        </div>
        <ol className="mt-4 flex items-center gap-2">
          {STEPS.map((label, i) => (
            <li key={label} className="flex flex-1 items-center gap-2">
              <span
                className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  i <= step
                    ? 'bg-brand-600 text-white'
                    : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                }`}
              >
                {i < step ? <Check className="size-3.5" /> : i + 1}
              </span>
              <span
                className={`text-xs font-medium ${
                  i <= step ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                {label}
              </span>
              {i < STEPS.length - 1 && (
                <span className="mx-1 h-px flex-1 bg-slate-200 dark:bg-slate-800" />
              )}
            </li>
          ))}
        </ol>
      </div>

      {/* STEP 1 — date & scope */}
      {step === 0 && (
        <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
              תאריך הצילום — מתי המצב הזה מייצג
            </label>
            <DateField value={date} onChange={setDate} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
              הערה (לא חובה)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="למשל: סוף רבעון 3, אחרי בונוס"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-950"
            />
          </div>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/40">
            <input
              type="checkbox"
              checked={includeFlow}
              onChange={(e) => setIncludeFlow(e.target.checked)}
              className="mt-0.5 size-4 accent-brand-600"
            />
            <span className="text-sm text-slate-700 dark:text-slate-300">
              לעדכן גם הכנסות וחיסכון חודשי
              <span className="block text-xs text-slate-400 dark:text-slate-500">
                לרוב מספיק נכסים והתחייבויות. סמן אם גם התזרים החודשי השתנה.
              </span>
            </span>
          </label>
        </div>
      )}

      {/* STEP 2 — review & update */}
      {step === 1 && (
        <div className="space-y-5">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            עדכן רק את מה שהשתנה — השאר את הערכים הקבועים כמו שהם.
          </p>
          <EditGroup icon={Landmark} title="נכסים" items={assets} field="value" draft={assetDraft} setDraft={setAssetDraft} />
          <EditGroup icon={CreditCard} title="התחייבויות" items={liabilities} field="value" draft={liabDraft} setDraft={setLiabDraft} />
          {includeFlow && (
            <>
              <EditGroup icon={Wallet} title="הכנסות חודשיות" items={incomeSources} field="amount" draft={incomeDraft} setDraft={setIncomeDraft} />
              <EditGroup icon={PiggyBank} title="חיסכון חודשי" items={savingsComponents} field="amount" draft={savingsDraft} setDraft={setSavingsDraft} />
            </>
          )}
          <div className="sticky bottom-0 rounded-xl border border-slate-200 bg-white/95 p-3 text-center text-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
            <span className="text-slate-500 dark:text-slate-400">שווי נקי מעודכן: </span>
            <span className="font-bold tabular-nums text-slate-900 dark:text-white">{formatCurrency(draftNetWorth)}</span>
          </div>
        </div>
      )}

      {/* STEP 3 — review & confirm */}
      {step === 2 && (
        <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 text-center dark:border-slate-800 dark:bg-slate-900">
          <div>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">השווי הנקי בצילום זה</p>
            <p className="my-1 text-4xl font-bold tabular-nums text-slate-900 dark:text-white">{formatCurrency(draftNetWorth)}</p>
            {delta !== null ? (
              <span
                className={`inline-flex items-center gap-1 text-sm font-semibold ${delta >= 0 ? 'text-gain' : 'text-loss'}`}
              >
                {delta >= 0 ? '+' : ''}
                {formatCurrency(delta)} מאז הצילום הקודם
              </span>
            ) : (
              <span className="text-sm text-slate-400 dark:text-slate-500">הצילום הראשון שלך — נקודת הפתיחה</span>
            )}
          </div>

          <div className="text-start">
            {changes.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                לא שינית ערכים — הצילום ישמור את המצב הנוכחי כפי שהוא לתאריך שבחרת.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
                {changes.map((c) => {
                  const d = c.to - c.from
                  return (
                    <div key={c.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                      <span className="font-medium text-slate-700 dark:text-slate-300">{c.name}</span>
                      <span className="flex items-center gap-2">
                        <span className="tabular-nums text-slate-400 dark:text-slate-500">
                          {formatCurrency(c.from)} ← {formatCurrency(c.to)}
                        </span>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${d >= 0 ? 'bg-gain/10 text-gain' : 'bg-loss/10 text-loss'}`}>
                          {d >= 0 ? '+' : ''}
                          {formatCurrency(d)}
                        </span>
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* nav buttons */}
      <div className="flex items-center justify-between gap-3">
        {step === 0 ? (
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            ביטול
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <ArrowRight className="size-4" />
            חזרה
          </button>
        )}

        {step < 2 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s + 1)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            המשך
            <ArrowLeft className="size-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleClose}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            <Check className="size-4" />
            סגירת התקופה וקיבוע הצילום
          </button>
        )}
      </div>
    </div>
  )
}
