import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { formatCurrency } from '../utils/formatCurrency'
import {
  DEFAULT_ASSET_CATEGORIES,
  DEFAULT_LIABILITY_CATEGORIES,
  DEFAULT_SAVINGS_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
  MUTED_COLOR,
} from '../utils/categories'

const now = () => new Date().toISOString()

const DEFAULT_CATEGORIES = {
  assets: DEFAULT_ASSET_CATEGORIES,
  liabilities: DEFAULT_LIABILITY_CATEGORIES,
  income: DEFAULT_INCOME_CATEGORIES,
  savings: DEFAULT_SAVINGS_CATEGORIES,
}

// Single source of truth for which store keys are actual user data (as
// opposed to actions/functions). Backup export derives from this list, so
// adding a new persisted field only means adding it here once - not also
// remembering to touch the export code separately. replaceAll (backup
// import) still needs its own fallback line per key below, since a few
// keys need non-empty-array defaults for old backups that predate them.
export const BACKUP_DATA_KEYS = [
  'assets',
  'liabilities',
  'savingsComponents',
  'incomeSources',
  'snapshots',
  'activityLog',
  'categories',
]

function activityEntry(entityType, action, summary) {
  return { id: crypto.randomUUID(), entityType, action, summary, timestamp: now() }
}

// A snapshot always exposes totals. A "full" snapshot (from a period close)
// carries frozen copies of the item arrays and derives its totals from them,
// so editing a snapshot's items can never drift from its headline numbers. A
// "totals-only" snapshot (a manual historical backfill, or a migrated V1.2
// history point) has null arrays and stores the totals directly. This helper
// is the single place both cases resolve to numbers.
export function getSnapshotTotals(snap) {
  if (Array.isArray(snap.assets)) {
    const totalAssets = snap.assets.reduce((sum, a) => sum + Number(a.value || 0), 0)
    const totalLiabilities = (snap.liabilities || []).reduce((sum, l) => sum + Number(l.value || 0), 0)
    return { totalAssets, totalLiabilities, netWorth: totalAssets - totalLiabilities }
  }
  const totalAssets = Number(snap.totalAssets || 0)
  const totalLiabilities = Number(snap.totalLiabilities || 0)
  return { totalAssets, totalLiabilities, netWorth: totalAssets - totalLiabilities }
}

// Converts the old V1.2 historyPoints (totals-only manual points) into
// totals-only snapshots, so upgrading the app or importing an old backup
// keeps every past point the user entered.
function historyPointsToSnapshots(historyPoints) {
  if (!Array.isArray(historyPoints)) return []
  return historyPoints.map((p) => ({
    id: p.id || crypto.randomUUID(),
    date: p.date,
    note: p.note || '',
    createdAt: p.updatedAt || now(),
    assets: null,
    liabilities: null,
    savingsComponents: null,
    incomeSources: null,
    totalAssets: Number(p.totalAssets || 0),
    totalLiabilities: Number(p.totalLiabilities || 0),
  }))
}

// Converts the old single-field monthlySavings shape (pre savingsComponents
// list) into one component, so upgrading the app or importing an old backup
// never silently drops what the user already entered.
function monthlySavingsToComponents(monthlySavings) {
  if (!monthlySavings?.totalAmount) return []
  return [
    {
      id: crypto.randomUUID(),
      name: monthlySavings.note || 'חיסכון חודשי',
      category: 'other',
      amount: Number(monthlySavings.totalAmount) || 0,
      note: '',
      updatedAt: now(),
    },
  ]
}

export const useFinanceStore = create(
  persist(
    (set) => ({
      assets: [],
      liabilities: [],
      savingsComponents: [],
      incomeSources: [],
      snapshots: [],
      activityLog: [],
      categories: DEFAULT_CATEGORIES,

      // New user-created categories always get the shared muted color -
      // the palette reserves a fixed set of distinct hues for the built-in
      // categories (see utils/categories.js), so overflow categories share
      // one muted tone rather than diluting the palette.
      addCategory: (domain, label) =>
        set((s) => ({
          categories: {
            ...s.categories,
            [domain]: [
              ...s.categories[domain],
              { id: crypto.randomUUID(), label: label.trim(), color: MUTED_COLOR, hidden: false },
            ],
          },
        })),
      renameCategory: (domain, id, label) =>
        set((s) => ({
          categories: {
            ...s.categories,
            [domain]: s.categories[domain].map((c) => (c.id === id ? { ...c, label: label.trim() } : c)),
          },
        })),
      toggleCategoryHidden: (domain, id) =>
        set((s) => ({
          categories: {
            ...s.categories,
            [domain]: s.categories[domain].map((c) => (c.id === id ? { ...c, hidden: !c.hidden } : c)),
          },
        })),
      // Deleting a category that's still in use on real items would strand
      // them with an unknown category id - callers must check usage first
      // (and offer "hide" instead). This only guards the last-one-standing
      // case, so there's always at least one category to assign to.
      deleteCategory: (domain, id) =>
        set((s) => {
          const list = s.categories[domain]
          if (list.length <= 1) return s
          return { categories: { ...s.categories, [domain]: list.filter((c) => c.id !== id) } }
        }),

      addAsset: (asset) =>
        set((s) => {
          const item = { id: crypto.randomUUID(), notes: '', updatedAt: now(), ...asset }
          return {
            assets: [...s.assets, item],
            activityLog: [
              ...s.activityLog,
              activityEntry('asset', 'created', `נוסף נכס: ${item.name} (${formatCurrency(item.value)})`),
            ],
          }
        }),
      updateAsset: (id, patch) =>
        set((s) => {
          const assets = s.assets.map((a) => (a.id === id ? { ...a, ...patch, updatedAt: now() } : a))
          const item = assets.find((a) => a.id === id)
          return {
            assets,
            activityLog: item
              ? [
                  ...s.activityLog,
                  activityEntry('asset', 'updated', `עודכן נכס: ${item.name} (${formatCurrency(item.value)})`),
                ]
              : s.activityLog,
          }
        }),
      deleteAsset: (id) =>
        set((s) => {
          const item = s.assets.find((a) => a.id === id)
          return {
            assets: s.assets.filter((a) => a.id !== id),
            activityLog: item
              ? [...s.activityLog, activityEntry('asset', 'deleted', `נמחק נכס: ${item.name}`)]
              : s.activityLog,
          }
        }),

      addLiability: (liability) =>
        set((s) => {
          const item = {
            id: crypto.randomUUID(),
            notes: '',
            monthlyPayment: 0,
            principalPortion: 0,
            interestPortion: 0,
            updatedAt: now(),
            ...liability,
          }
          return {
            liabilities: [...s.liabilities, item],
            activityLog: [
              ...s.activityLog,
              activityEntry('liability', 'created', `נוספה התחייבות: ${item.name} (${formatCurrency(item.value)})`),
            ],
          }
        }),
      updateLiability: (id, patch) =>
        set((s) => {
          const liabilities = s.liabilities.map((l) =>
            l.id === id ? { ...l, ...patch, updatedAt: now() } : l,
          )
          const item = liabilities.find((l) => l.id === id)
          return {
            liabilities,
            activityLog: item
              ? [
                  ...s.activityLog,
                  activityEntry('liability', 'updated', `עודכנה התחייבות: ${item.name} (${formatCurrency(item.value)})`),
                ]
              : s.activityLog,
          }
        }),
      deleteLiability: (id) =>
        set((s) => {
          const item = s.liabilities.find((l) => l.id === id)
          return {
            liabilities: s.liabilities.filter((l) => l.id !== id),
            activityLog: item
              ? [...s.activityLog, activityEntry('liability', 'deleted', `נמחקה התחייבות: ${item.name}`)]
              : s.activityLog,
          }
        }),

      addSavingsComponent: (component) =>
        set((s) => ({
          savingsComponents: [
            ...s.savingsComponents,
            { id: crypto.randomUUID(), note: '', updatedAt: now(), ...component },
          ],
        })),
      updateSavingsComponent: (id, patch) =>
        set((s) => ({
          savingsComponents: s.savingsComponents.map((c) =>
            c.id === id ? { ...c, ...patch, updatedAt: now() } : c,
          ),
        })),
      deleteSavingsComponent: (id) =>
        set((s) => ({
          savingsComponents: s.savingsComponents.filter((c) => c.id !== id),
        })),

      addIncomeSource: (source) =>
        set((s) => {
          const item = { id: crypto.randomUUID(), note: '', incomeType: 'work', updatedAt: now(), ...source }
          return {
            incomeSources: [...s.incomeSources, item],
            activityLog: [
              ...s.activityLog,
              activityEntry('income', 'created', `נוסף מקור הכנסה: ${item.name} (${formatCurrency(item.amount)})`),
            ],
          }
        }),
      updateIncomeSource: (id, patch) =>
        set((s) => {
          const incomeSources = s.incomeSources.map((c) =>
            c.id === id ? { ...c, ...patch, updatedAt: now() } : c,
          )
          const item = incomeSources.find((c) => c.id === id)
          return {
            incomeSources,
            activityLog: item
              ? [
                  ...s.activityLog,
                  activityEntry('income', 'updated', `עודכן מקור הכנסה: ${item.name} (${formatCurrency(item.amount)})`),
                ]
              : s.activityLog,
          }
        }),
      deleteIncomeSource: (id) =>
        set((s) => {
          const item = s.incomeSources.find((c) => c.id === id)
          return {
            incomeSources: s.incomeSources.filter((c) => c.id !== id),
            activityLog: item
              ? [...s.activityLog, activityEntry('income', 'deleted', `נמחק מקור הכנסה: ${item.name}`)]
              : s.activityLog,
          }
        }),

      // The core V2 action. The ritual collects only the values the user
      // actually changed (id -> new value maps); this applies them to the
      // live state and then freezes a full, deep-copied snapshot of the
      // resulting state, stamped with the chosen date. Upsert by date: closing
      // twice for the same date replaces that date's snapshot rather than
      // duplicating it.
      closePeriod: ({ date, note = '', assetValues = {}, liabilityValues = {}, savingsValues = {}, incomeValues = {} }) =>
        set((s) => {
          const stamp = now()
          const applyValues = (list, values, field) =>
            list.map((it) =>
              values[it.id] != null && values[it.id] !== ''
                ? { ...it, [field]: Number(values[it.id]) || 0, updatedAt: stamp }
                : it,
            )
          const assets = applyValues(s.assets, assetValues, 'value')
          const liabilities = applyValues(s.liabilities, liabilityValues, 'value')
          const savingsComponents = applyValues(s.savingsComponents, savingsValues, 'amount')
          const incomeSources = applyValues(s.incomeSources, incomeValues, 'amount')

          const snapshot = {
            id: crypto.randomUUID(),
            date,
            note: note.trim(),
            createdAt: stamp,
            assets: structuredClone(assets),
            liabilities: structuredClone(liabilities),
            savingsComponents: structuredClone(savingsComponents),
            incomeSources: structuredClone(incomeSources),
          }
          const netWorth = getSnapshotTotals(snapshot).netWorth
          const snapshots = [...s.snapshots.filter((x) => x.date !== date), snapshot].sort((a, b) =>
            a.date.localeCompare(b.date),
          )
          return {
            assets,
            liabilities,
            savingsComponents,
            incomeSources,
            snapshots,
            activityLog: [
              ...s.activityLog,
              activityEntry('snapshot', 'created', `נסגרה תקופה ונשמר צילום ל-${date} (שווי נקי: ${formatCurrency(netWorth)})`),
            ],
          }
        }),

      // A manual, totals-only historical point - for backfilling dates from
      // before the app was tracking (e.g. "end of 2022"). No per-item
      // breakdown, just the headline totals.
      addManualSnapshot: ({ date, totalAssets, totalLiabilities, note = '' }) =>
        set((s) => {
          const snapshot = {
            id: crypto.randomUUID(),
            date,
            note: note.trim(),
            createdAt: now(),
            assets: null,
            liabilities: null,
            savingsComponents: null,
            incomeSources: null,
            totalAssets: Number(totalAssets) || 0,
            totalLiabilities: Number(totalLiabilities) || 0,
          }
          const netWorth = getSnapshotTotals(snapshot).netWorth
          const snapshots = [...s.snapshots.filter((x) => x.date !== date), snapshot].sort((a, b) =>
            a.date.localeCompare(b.date),
          )
          return {
            snapshots,
            activityLog: [
              ...s.activityLog,
              activityEntry('snapshot', 'created', `נוסף צילום היסטורי ל-${date} (שווי נקי: ${formatCurrency(netWorth)})`),
            ],
          }
        }),

      updateSnapshot: (id, patch) =>
        set((s) => ({
          snapshots: s.snapshots
            .map((snap) => (snap.id === id ? { ...snap, ...patch } : snap))
            .sort((a, b) => a.date.localeCompare(b.date)),
        })),

      deleteSnapshot: (id) =>
        set((s) => {
          const item = s.snapshots.find((x) => x.id === id)
          return {
            snapshots: s.snapshots.filter((x) => x.id !== id),
            activityLog: item
              ? [...s.activityLog, activityEntry('snapshot', 'deleted', `נמחק צילום מצב מ-${item.date}`)]
              : s.activityLog,
          }
        }),

      replaceAll: (data) =>
        set({
          assets: data.assets ?? [],
          liabilities: data.liabilities ?? [],
          savingsComponents:
            data.savingsComponents ?? monthlySavingsToComponents(data.monthlySavings),
          incomeSources: data.incomeSources ?? [],
          // Old backups (pre-V2) carry historyPoints instead of snapshots.
          snapshots: data.snapshots ?? historyPointsToSnapshots(data.historyPoints),
          activityLog: data.activityLog ?? [],
          categories: data.categories ?? DEFAULT_CATEGORIES,
        }),
    }),
    {
      name: 'pfd-finance-data',
      version: 2,
      migrate: (persistedState, version) => {
        let state = persistedState ?? {}
        if (version === 0) {
          const { monthlySavings, ...rest } = state
          state = { ...rest, savingsComponents: monthlySavingsToComponents(monthlySavings) }
        }
        if (version < 2) {
          // V1.2's historyPoints + the auto netWorthHistory both collapse into
          // the single snapshots series. historyPoints become totals-only
          // snapshots; netWorthHistory (a throwaway auto log) is dropped.
          const { historyPoints, netWorthHistory: _dropped, ...rest } = state
          void _dropped
          state = { ...rest, snapshots: historyPointsToSnapshots(historyPoints) }
        }
        return state
      },
    },
  ),
)

export const selectTotalAssets = (s) =>
  s.assets.reduce((sum, a) => sum + Number(a.value || 0), 0)

// Manually-entered savings components only - not exported, since nothing
// outside this file needs just the manual portion; selectTotalMonthlySavings
// below is the one everything else should read.
const selectManualMonthlySavings = (s) =>
  s.savingsComponents.reduce((sum, c) => sum + Number(c.amount || 0), 0)

// Paying down loan principal *is* saving (it grows net worth the same way
// a deposit does) - summed straight from liabilities so the user never has
// to enter the same number in two places. This is the one place that
// number is computed; everything that shows "monthly savings" reads it
// through selectTotalMonthlySavings below.
export const selectTotalLoanPrincipalPaydown = (s) =>
  s.liabilities.reduce((sum, l) => sum + Number(l.principalPortion || 0), 0)

export const selectTotalMonthlySavings = (s) =>
  selectManualMonthlySavings(s) + selectTotalLoanPrincipalPaydown(s)

export const selectTotalMonthlyIncome = (s) =>
  s.incomeSources.reduce((sum, c) => sum + Number(c.amount || 0), 0)

// incomeType is optional on older entries (added after incomeSources
// already existed) - treated as 'work' when absent rather than requiring a
// migration, consistent with how other optional per-item fields are read.
export const selectWorkIncome = (s) =>
  s.incomeSources
    .filter((c) => (c.incomeType || 'work') === 'work')
    .reduce((sum, c) => sum + Number(c.amount || 0), 0)

export const selectAssetIncome = (s) =>
  s.incomeSources
    .filter((c) => c.incomeType === 'assets')
    .reduce((sum, c) => sum + Number(c.amount || 0), 0)

// Most recent updatedAt across all live financial data (not history points,
// which are deliberate past checkpoints rather than "current" records).
export const selectLastUpdatedAt = (s) => {
  const timestamps = [...s.assets, ...s.liabilities, ...s.savingsComponents, ...s.incomeSources]
    .map((item) => item.updatedAt)
    .filter(Boolean)
  if (timestamps.length === 0) return null
  return timestamps.reduce((latest, ts) => (ts > latest ? ts : latest))
}

export const selectTotalLiabilities = (s) =>
  s.liabilities.reduce((sum, l) => sum + Number(l.value || 0), 0)

export const selectNetWorth = (s) =>
  selectTotalAssets(s) - selectTotalLiabilities(s)

export const selectSnapshotsSorted = (s) =>
  [...s.snapshots].sort((a, b) => a.date.localeCompare(b.date))

export const selectLatestSnapshot = (s) => {
  const sorted = selectSnapshotsSorted(s)
  return sorted.length ? sorted[sorted.length - 1] : null
}

// Whole days since the most recent snapshot's date - drives the "time for a
// periodic update" nudge. Null when there are no snapshots yet. A plain
// number, so no useShallow needed.
export const selectDaysSinceLastSnapshot = (s) => {
  const latest = selectLatestSnapshot(s)
  if (!latest) return null
  return Math.floor((Date.now() - new Date(latest.date).getTime()) / 86_400_000)
}

// Growth of the live net worth versus the most recent snapshot - the literal
// total change and percent, never normalized into a per-month rate (see the
// V1 fix that removed the misleading "monthly" framing). This is the single
// progress metric the hero and the dashboard KPI both read. Returns null when
// there's no snapshot to compare against. Returns a fresh object each call;
// wrap with zustand's useShallow when selecting this directly in a component.
export const selectNetWorthGrowthSinceLastSnapshot = (s) => {
  const latest = selectLatestSnapshot(s)
  if (!latest) return null
  const anchorNetWorth = getSnapshotTotals(latest).netWorth
  const liveNetWorth = selectNetWorth(s)
  const delta = liveNetWorth - anchorNetWorth
  const percent = anchorNetWorth !== 0 ? (delta / Math.abs(anchorNetWorth)) * 100 : 0
  return { delta, percent, sinceDate: latest.date }
}

// The net-worth line for the dashboard chart: one point per snapshot, plus a
// live "today" point built from the current state whenever the newest
// snapshot isn't already dated today. The live point is never persisted - the
// stored snapshots stay frozen. This is a *pure* builder, not a reactive
// selector, because it maps snapshots to fresh point objects each call:
// selecting it directly (even via useShallow) would loop, since useShallow
// compares array elements by reference. Callers pass the stable `snapshots`
// array and the live net worth and wrap it in useMemo.
export function buildNetWorthChartSeries(snapshots, liveNetWorth) {
  const todayStr = new Date().toISOString().slice(0, 10)
  const points = [...snapshots]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((snap) => ({
      date: snap.date,
      netWorth: getSnapshotTotals(snap).netWorth,
      isLive: false,
    }))
  if (!points.some((p) => p.date === todayStr)) {
    points.push({ date: todayStr, netWorth: liveNetWorth, isLive: true })
  }
  return points.sort((a, b) => a.date.localeCompare(b.date))
}
