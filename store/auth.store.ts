// ❌ NO importes el icono como User si lo vas a usar como tipo
// import { User } from '@tamagui/lucide-icons'

// ✅ Importa el icono con otro nombre (si lo necesitas en este archivo)
import { User as UserIcon } from '@tamagui/lucide-icons'

// ✅ Importa el tipo real de usuario de tu app
import type { User } from '../types/auth.types'   // ajusta la ruta

import { create } from 'zustand'
import { secureStorage } from '../lib/secureStorage'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  setAuth: (user: User, token: string) => Promise<void>
  clearAuth: () => Promise<void>
  rehydrate: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: async (user, token) => {
    await secureStorage.setItem('auth_token', token)
    await secureStorage.setItem('user', JSON.stringify(user))
    set({ user, token, isAuthenticated: true, isLoading: false })
  },

  clearAuth: async () => {
    await secureStorage.removeItem('auth_token')
    await secureStorage.removeItem('user')
    set({ user: null, token: null, isAuthenticated: false })
  },

  rehydrate: async () => {
    try {
      const token = await secureStorage.getItem('auth_token')
      const userStr = await secureStorage.getItem('user')

      if (token && userStr) {
        const user: User = JSON.parse(userStr)
        set({ user, token, isAuthenticated: true, isLoading: false })
      } else {
        set({ isLoading: false })
      }
    } catch (error) {
      console.error('Error rehydrating auth:', error)
      set({ isLoading: false })
    }
  },
}))
