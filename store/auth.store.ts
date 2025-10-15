import { create } from 'zustand';
import { User } from '@/types/auth.types';
import { secureStorage } from '@/lib/secureStorage';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: User, token: string) => Promise<void>;
  clearAuth: () => Promise<void>;
  rehydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: async (user, token) => {
    await secureStorage.setItem('auth_token', token);
    await secureStorage.setItem('user', JSON.stringify(user));
    set({ user, token, isAuthenticated: true });
  },

  clearAuth: async () => {
    await secureStorage.removeItem('auth_token');
    await secureStorage.removeItem('user');
    set({ user: null, token: null, isAuthenticated: false });
  },

  rehydrate: async () => {
    try {
      const token = await secureStorage.getItem('auth_token');
      const userStr = await secureStorage.getItem('user');

      if (token && userStr) {
        const user = JSON.parse(userStr);
        set({ user, token, isAuthenticated: true, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Error rehydrating auth:', error);
      set({ isLoading: false });
    }
  },
}));