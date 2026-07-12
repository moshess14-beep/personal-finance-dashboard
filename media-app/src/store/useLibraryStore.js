import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { demoItems } from '../data/demoData'

const useLibraryStore = create(
  persist(
    (set) => ({
      items: [],
      tmdbKey: '',
      aiKey: '',
      seeded: false,

      addItem: (item) =>
        set((s) => ({
          items: [{ id: crypto.randomUUID(), createdAt: Date.now(), ...item }, ...s.items],
        })),

      updateItem: (id, patch) =>
        set((s) => ({
          items: s.items.map((it) => (it.id === id ? { ...it, ...patch } : it)),
        })),

      removeItem: (id) => set((s) => ({ items: s.items.filter((it) => it.id !== id) })),

      setTmdbKey: (tmdbKey) => set({ tmdbKey }),

      setAiKey: (aiKey) => set({ aiKey }),

      seedDemo: () =>
        set((s) => ({
          seeded: true,
          items: [
            ...s.items,
            ...demoItems.filter((d) => !s.items.some((it) => it.id === d.id)),
          ],
        })),

      clearAll: () => set({ items: [], seeded: false }),
    }),
    { name: 'media-library' },
  ),
)

export default useLibraryStore
