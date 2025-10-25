// store/theme.store.ts
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

type Theme = 'light' | 'dark'

const THEME_KEY = 'theme-storage'
const isValidTheme = (v: unknown): v is Theme => v === 'light' || v === 'dark'
const fallbackTheme: Theme = 'light'

// Storage por plataforma (web: localStorage; nativo: AsyncStorage)
const storage = createJSONStorage(() => {
  if (typeof window !== 'undefined' && 'localStorage' in window) {
    return window.localStorage
  }
  return AsyncStorage
})

interface ThemeState {
  theme: Theme
  setTheme: (theme: unknown) => void
  toggleTheme: () => void
  getSafeTheme: () => Theme
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: fallbackTheme,

      setTheme: (next) =>
        set(() => ({
          theme: isValidTheme(next) ? next : fallbackTheme,
        })),

      toggleTheme: () =>
        set((state) => ({
          theme: state.theme === 'light' ? 'dark' : 'light',
        })),

      // Útil para el _layout: garantiza un theme válido siempre
      getSafeTheme: () => {
        const { theme } = get()
        return isValidTheme(theme) ? theme : fallbackTheme
      },
    }),
    {
      name: THEME_KEY,
      storage,
      version: 1,
      // Por si en el futuro cambias el shape:
      migrate: (persisted: any, version) => {
        if (!persisted) return { theme: fallbackTheme }
        if (!isValidTheme(persisted.theme)) {
          persisted.theme = fallbackTheme
        }
        return persisted
      },
      // evitar serializar funciones, ya lo maneja createJSONStorage
      // partialize: (state) => ({ theme: state.theme }),
    }
  )
)
