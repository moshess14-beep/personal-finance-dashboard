import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { demoItems } from '../data/demoData'

// הוקים שמותקנים על ידי services/sync.js אחרי התחברות מוצלחת — לא חלק מה-state
// הריאקטיבי של zustand (רק פונקציות, אין טעם לשמור/לסריאלז אותן).
let syncHooks = null
export function setSyncHooks(hooks) {
  syncHooks = hooks
}

const useLibraryStore = create(
  persist(
    (set, get) => ({
      items: [],
      tmdbKey: '',
      aiKey: '',
      seeded: false,

      // הגדרות חיבור לסנכרון בענן (Supabase) — מוזנות במסך ההגדרות
      supabaseUrl: '',
      supabaseAnonKey: '',

      // מצב חיבור חי — לא נשמר בין טעינות, מחושב מחדש כל פעם דרך services/sync.js
      authUser: null, // { id, email } | null
      syncStatus: 'off', // 'off' | 'connecting' | 'syncing' | 'synced' | 'error'
      syncError: null,

      addItem: (item) => {
        const full = { id: crypto.randomUUID(), createdAt: Date.now(), ...item }
        set((s) => ({ items: [full, ...s.items] }))
        syncHooks?.onAdd?.(full)
        return full
      },

      updateItem: (id, patch) => {
        let updated = null
        set((s) => ({
          items: s.items.map((it) => {
            if (it.id !== id) return it
            updated = { ...it, ...patch }
            return updated
          }),
        }))
        if (updated) syncHooks?.onUpdate?.(updated)
      },

      removeItem: (id) => {
        set((s) => ({ items: s.items.filter((it) => it.id !== id) }))
        syncHooks?.onRemove?.(id)
      },

      // עדכון מלא של הרשימה — משמש רק לסנכרון (מיזוג מקומי+ענן, עדכון realtime)
      replaceItems: (items) => set({ items }),

      setTmdbKey: (tmdbKey) => {
        set({ tmdbKey })
        syncHooks?.onSettingsChange?.({ aiKey: get().aiKey, tmdbKey })
      },

      setAiKey: (aiKey) => {
        set({ aiKey })
        syncHooks?.onSettingsChange?.({ aiKey, tmdbKey: get().tmdbKey })
      },

      setSupabaseConfig: (supabaseUrl, supabaseAnonKey) => set({ supabaseUrl, supabaseAnonKey }),

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
    {
      name: 'media-library',
      partialize: (s) => ({
        items: s.items,
        tmdbKey: s.tmdbKey,
        aiKey: s.aiKey,
        seeded: s.seeded,
        supabaseUrl: s.supabaseUrl,
        supabaseAnonKey: s.supabaseAnonKey,
      }),
    },
  ),
)

export default useLibraryStore
