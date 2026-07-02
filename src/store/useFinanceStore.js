import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const now = () => new Date().toISOString()

export const useFinanceStore = create(
  persist(
    (set, get) => ({
      assets: [],
      liabilities: [],
      monthlySavings: { totalAmount: 0, note: '' },

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

      replaceAll: (data) =>
        set({
          assets: data.assets ?? [],
          liabilities: data.liabilities ?? [],
          monthlySavings: data.monthlySavings ?? { totalAmount: 0, note: '' },
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
