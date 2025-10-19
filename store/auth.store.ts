// store/auth.store.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/auth.service';
import { clearTokens } from '../lib/auth.token';
import { User, UserRole } from '../types/auth.types';

// 1) Amplía el estado
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  /** 👈 NUEVO: true mientras rehidrata desde AsyncStorage */
  isHydrating: boolean;

  // Métodos
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setAuth: (user: User) => void;
  clearAuth: () => Promise<void>;
  setUser: (user: User) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // 👇 inicia en true hasta que termine la hidratación
      isHydrating: true,

      setAuth: (user: User) => {
        set({
          user,
          isAuthenticated: true,
          error: null,
        });
      },

      clearAuth: async () => {
        await clearTokens();
        set({
          user: null,
          isAuthenticated: false,
          error: null,
        });
      },

      login: async (username: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const loginResponse = await authService.login(username, password);
          if (!loginResponse?.success || !loginResponse.data?.accessToken) {
            throw new Error('Respuesta de login inválida');
          }
          const meResponse = await authService.me();
          if (!meResponse?.success || !meResponse.data) {
            throw new Error('Error al obtener información del usuario');
          }
          const user = meResponse.data;
          get().setAuth(user);
          set({ isLoading: false });
        } catch (error: any) {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: error?.message || 'Error al iniciar sesión',
          });
          throw error;
        }
      },

      logout: async () => {
        try {
          await authService.logout();
        } catch {}
        finally {
          await get().clearAuth();
        }
      },

      setUser: (user: User) => {
        set({ user });
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Solo persistimos lo que hace falta
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// 2) Suscribimos eventos del persist para controlar hidratación
useAuthStore.persist?.onHydrate?.(() => {
  useAuthStore.setState({ isHydrating: true });
});
useAuthStore.persist?.onFinishHydration?.(() => {
  const s = useAuthStore.getState();
  useAuthStore.setState({
    isHydrating: false,
    isAuthenticated: !!s.user,
  });
});

// 3) (opcional) helper por si prefieres derivarlo
export const authHasHydrated = () =>
  useAuthStore.persist?.hasHydrated?.() ?? false;

export type { User, UserRole };
