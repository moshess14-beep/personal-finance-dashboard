import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const prefersDark = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-color-scheme: dark)').matches

export const useThemeStore = create(
  persist(
    (set, get) => ({
      isDark: prefersDark(),
      toggle: () => set({ isDark: !get().isDark }),
    }),
    { name: 'pfd-theme' },
  ),
)

export function applyThemeClass(isDark) {
  document.documentElement.classList.toggle('dark', isDark)
}
