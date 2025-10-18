// store/auth.store.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/auth.service';
import { clearTokens } from '../lib/auth.token';
import { User, UserRole } from '../types/auth.types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

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

      // ✅ Solo guarda el user, NO tokens
      setAuth: (user: User) => {
        set({
          user,
          isAuthenticated: true,
          error: null,
        });
      },

      // ✅ Limpia estado Y tokens de SecureStore
      clearAuth: async () => {
        await clearTokens();
        set({
          user: null,
          isAuthenticated: false,
          error: null,
        });
      },

      // ✅ Login completo
      login: async (username: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          console.log('🔐 Intentando login con:', username);

          // 1) authService.login() ya guarda tokens en auth.token.ts
          const loginResponse = await authService.login(username, password);
          console.log('✅ Login exitoso');

          if (!loginResponse?.success || !loginResponse.data?.accessToken) {
            throw new Error('Respuesta de login inválida');
          }

          // 2) Obtener información del usuario
          console.log('📡 Obteniendo información del usuario...');
          const meResponse = await authService.me();

          if (!meResponse?.success || !meResponse.data) {
            throw new Error('Error al obtener información del usuario');
          }

          const user = meResponse.data;
          console.log('✅ Usuario obtenido:', {
            username: user.username,
            role: user.role,
            name: user.name,
          });

          // 3) Guardar solo el usuario en el store
          get().setAuth(user);

          set({ isLoading: false });
          console.log('✅ Login completado exitosamente');
          console.log(`🎯 Rol del usuario: ${user.role}`);
        } catch (error: any) {
          console.error('❌ Error en login:', error);

          const errorMessage = error?.message || 'Error al iniciar sesión';

          // Limpia estado
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
          });

          throw error;
        }
      },

      // ✅ Logout
      logout: async () => {
        try {
          console.log('🚪 Cerrando sesión...');
          // authService.logout() ya limpia tokens de auth.token.ts
          await authService.logout();
          console.log('✅ Logout exitoso');
        } catch (error) {
          console.error('⚠️ Error en logout (continuando):', error);
        } finally {
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
      // ✅ Solo persistir user e isAuthenticated
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export type { User, UserRole };