import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { formatCurrency } from '../utils/formatCurrency'

const now = () => new Date().toISOString()

// Single source of truth for which store keys are actual user data (as
// opposed to actions/functions). Backup export and replaceAll both derive
// from this list, so adding a new persisted array only means adding it here
// once - not also remembering to touch the export code separately.
export const BACKUP_DATA_KEYS = [
  'assets',
  'liabilities',
  'savingsComponents',
  'incomeSources',
  'historyPoints',
  'netWorthHistory',
  'activityLog',
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
          const item = { id: crypto.randomUUID(), notes: '', updatedAt: now(), ...liability }
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
          const item = { id: crypto.randomUUID(), note: '', updatedAt: now(), ...source }
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

export const selectTotalMonthlySavings = (s) =>
  s.savingsComponents.reduce((sum, c) => sum + Number(c.amount || 0), 0)

export const selectTotalMonthlyIncome = (s) =>
  s.incomeSources.reduce((sum, c) => sum + Number(c.amount || 0), 0)

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

// Monthly net worth growth, normalized from the two most recent history
// points. Requires a real gap between them (>= 14 days) so a couple of
// points entered minutes apart doesn't extrapolate into a wild number.
// Returns null when there isn't enough data yet - callers show "אין מספיק
// נתונים" in that case. Returns a fresh object each call; wrap with
// zustand's useShallow when selecting this directly in a component.
export const selectMonthlyNetWorthGrowth = (s) => {
  if (s.historyPoints.length < 2) return null
  const sorted = [...s.historyPoints].sort((a, b) => a.date.localeCompare(b.date))
  const [prev, latest] = sorted.slice(-2)
  const daysDiff = (new Date(latest.date) - new Date(prev.date)) / 86_400_000
  if (daysDiff < 14) return null

  const netWorthPrev = Number(prev.totalAssets || 0) - Number(prev.totalLiabilities || 0)
  const netWorthLatest = Number(latest.totalAssets || 0) - Number(latest.totalLiabilities || 0)
  const totalDelta = netWorthLatest - netWorthPrev
  const monthlyAmount = totalDelta / (daysDiff / 30.44)
  const percent = netWorthPrev !== 0 ? (monthlyAmount / Math.abs(netWorthPrev)) * 100 : 0

  return { amount: monthlyAmount, percent }
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
