import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const now = () => new Date().toISOString()

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

      addAsset: (asset) =>
        set((s) => ({
          assets: [
            ...s.assets,
            { id: crypto.randomUUID(), notes: '', updatedAt: now(), ...asset },
          ],
        })),
      updateAsset: (id, patch) =>
        set((s) => ({
          assets: s.assets.map((a) =>
            a.id === id ? { ...a, ...patch, updatedAt: now() } : a,
          ),
        })),
      deleteAsset: (id) =>
        set((s) => ({ assets: s.assets.filter((a) => a.id !== id) })),

      addLiability: (liability) =>
        set((s) => ({
          liabilities: [
            ...s.liabilities,
            { id: crypto.randomUUID(), notes: '', updatedAt: now(), ...liability },
          ],
        })),
      updateLiability: (id, patch) =>
        set((s) => ({
          liabilities: s.liabilities.map((l) =>
            l.id === id ? { ...l, ...patch, updatedAt: now() } : l,
          ),
        })),
      deleteLiability: (id) =>
        set((s) => ({ liabilities: s.liabilities.filter((l) => l.id !== id) })),

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
        set((s) => ({
          incomeSources: [
            ...s.incomeSources,
            { id: crypto.randomUUID(), note: '', updatedAt: now(), ...source },
          ],
        })),
      updateIncomeSource: (id, patch) =>
        set((s) => ({
          incomeSources: s.incomeSources.map((c) =>
            c.id === id ? { ...c, ...patch, updatedAt: now() } : c,
          ),
        })),
      deleteIncomeSource: (id) =>
        set((s) => ({
          incomeSources: s.incomeSources.filter((c) => c.id !== id),
        })),

      addHistoryPoint: (point) =>
        set((s) => ({
          historyPoints: [
            ...s.historyPoints,
            { id: crypto.randomUUID(), note: '', updatedAt: now(), ...point },
          ],
        })),
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
