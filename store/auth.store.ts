// store/auth.store.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/auth.service';

// 👇 Importar tipos desde auth.types.ts
import { User, UserRole } from '../types/auth.types';

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // ✅ Métodos
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setAuth: (user: User, token: string, refreshToken?: string) => Promise<void>;
  clearAuth: () => Promise<void>;
  setUser: (user: User) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // ✅ Guarda user + tokens y marca autenticado
      setAuth: async (user: User, token: string, refreshToken?: string) => {
        set({
          user,
          token,
          refreshToken: refreshToken || null,
          isAuthenticated: true,
          error: null,
        });
      },

      // ✅ Limpia todo el estado de auth
      clearAuth: async () => {
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          error: null,
        });
      },

      // ✅ Flujo de login corregido
      login: async (username: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          console.log('🔐 Intentando login con:', username);

          // 1) /auth/login
          const loginResponse = await authService.login(username, password);
          console.log('✅ Login exitoso');

          if (!loginResponse?.success || !loginResponse.data?.accessToken) {
            throw new Error('Respuesta de login inválida');
          }

          const { accessToken, refreshToken } = loginResponse.data;

          // 2) Guardar SOLO el token en el store ANTES de /auth/me
          //    para que apiClient añada Authorization automáticamente
          useAuthStore.setState({ token: accessToken });

          // 3) /auth/me (no pases token; lo lee el apiClient del store)
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

          // 4) Persistir todo junto y marcar autenticado
          await get().setAuth(user, accessToken, refreshToken || undefined);

          set({ isLoading: false });
          console.log('✅ Login completado exitosamente');
          console.log(`🎯 Rol del usuario: ${user.role}`);
        } catch (error: any) {
          console.error('❌ Error en login:', error);

          const errorMessage = error?.message || 'Error al iniciar sesión';

          // Limpia estado y propaga error
          set({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
          });

          throw error;
        }
      },

      // ✅ Logout sin pasar token (apiClient lo añade si existe)
      logout: async () => {
        try {
          console.log('🚪 Cerrando sesión...');
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
    }
  )
);

// Export types
export type { User, UserRole };
