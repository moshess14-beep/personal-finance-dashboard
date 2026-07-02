import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const now = () => new Date().toISOString()

export const useFinanceStore = create(
  persist(
    (set) => ({
      assets: [],
      liabilities: [],
      monthlySavings: { totalAmount: 0, note: '' },
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

      setMonthlySavings: (patch) =>
        set((s) => ({ monthlySavings: { ...s.monthlySavings, ...patch } })),

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
          monthlySavings: data.monthlySavings ?? { totalAmount: 0, note: '' },
          netWorthHistory: data.netWorthHistory ?? [],
        }),
    }),
    { name: 'pfd-finance-data' },
  ),
)

export const selectTotalAssets = (s) =>
  s.assets.reduce((sum, a) => sum + Number(a.value || 0), 0)

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
