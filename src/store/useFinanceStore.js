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
  'historyPoints',
  'netWorthHistory',
  'activityLog',
  'categories',
]

function activityEntry(entityType, action, summary) {
  return { id: crypto.randomUUID(), entityType, action, summary, timestamp: now() }
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
      historyPoints: [],
      netWorthHistory: [],
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

      addHistoryPoint: (point) =>
        set((s) => {
          const item = { id: crypto.randomUUID(), note: '', updatedAt: now(), ...point }
          const netWorth = Number(item.totalAssets || 0) - Number(item.totalLiabilities || 0)
          return {
            historyPoints: [...s.historyPoints, item],
            activityLog: [
              ...s.activityLog,
              activityEntry(
                'historyPoint',
                'created',
                `נוספה נקודת היסטוריה ל-${item.date} (שווי נקי: ${formatCurrency(netWorth)})`,
              ),
            ],
          }
        }),
      updateHistoryPoint: (id, patch) =>
        set((s) => ({
          historyPoints: s.historyPoints.map((p) =>
            p.id === id ? { ...p, ...patch, updatedAt: now() } : p,
          ),
        })),
      deleteHistoryPoint: (id) =>
        set((s) => ({
          historyPoints: s.historyPoints.filter((p) => p.id !== id),
        })),

      recordNetWorthSnapshot: (netWorth) =>
        set((s) => {
          const today = new Date().toISOString().slice(0, 10)
          const history = s.netWorthHistory.filter((h) => h.date !== today)
          history.push({ date: today, netWorth })
          history.sort((a, b) => a.date.localeCompare(b.date))
          return { netWorthHistory: history }
        }),

      replaceAll: (data) =>
        set({
          assets: data.assets ?? [],
          liabilities: data.liabilities ?? [],
          savingsComponents:
            data.savingsComponents ?? monthlySavingsToComponents(data.monthlySavings),
          incomeSources: data.incomeSources ?? [],
          historyPoints: data.historyPoints ?? [],
          netWorthHistory: data.netWorthHistory ?? [],
          activityLog: data.activityLog ?? [],
          categories: data.categories ?? DEFAULT_CATEGORIES,
        }),
    }),
    {
      name: 'pfd-finance-data',
      version: 1,
      migrate: (persistedState, version) => {
        if (version === 0) {
          const { monthlySavings, ...rest } = persistedState ?? {}
          return { ...rest, savingsComponents: monthlySavingsToComponents(monthlySavings) }
        }
        return persistedState
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

// Growth since the last manually-entered history point - the literal total
// change and percent, not normalized into a "monthly rate". An earlier
// version divided the total change by elapsed months, which produced a
// number with no intuitive meaning once the anchor was more than a few
// weeks old (e.g. "18,687 ₪/month" derived from a point 2.5 years back reads
// as a real monthly figure but is actually a multi-year average - see PR
// discussion). A true monthly growth metric needs an actual monthly
// cadence (V2's month-close flow) to mean anything; until then this shows
// exactly what it says. Returns null when there's no past history point to
// compare against - callers show an empty state in that case. Returns a
// fresh object each call; wrap with zustand's useShallow when selecting
// this directly in a component.
export const selectNetWorthGrowthSinceLastPoint = (s) => {
  const todayStr = new Date().toISOString().slice(0, 10)
  const anchor = [...s.historyPoints]
    .filter((p) => p.date < todayStr)
    .sort((a, b) => b.date.localeCompare(a.date))[0]
  if (!anchor) return null

  const anchorNetWorth = Number(anchor.totalAssets || 0) - Number(anchor.totalLiabilities || 0)
  const liveNetWorth = selectNetWorth(s)
  const delta = liveNetWorth - anchorNetWorth
  const percent = anchorNetWorth !== 0 ? (delta / Math.abs(anchorNetWorth)) * 100 : 0

  return { delta, percent, sinceDate: anchor.date }
}

// Trend vs the most recent *previous* day we have a recorded snapshot for.
// Today's own snapshot (recorded on this render) never counts as "previous".
export const selectNetWorthTrend = (s) => {
  const today = new Date().toISOString().slice(0, 10)
  const past = s.netWorthHistory.filter((h) => h.date < today)
  if (past.length === 0) return null
  const previous = past[past.length - 1]
  const current = selectNetWorth(s)
  const delta = current - previous.netWorth
  const percent = previous.netWorth !== 0 ? (delta / Math.abs(previous.netWorth)) * 100 : 0
  return { delta, percent, sinceDate: previous.date }
}
