// store/auth.store.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/auth.service';
import { User, UserRole } from '../types/auth.types';

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
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

      login: async (username: string, password: string) => {
        set({ isLoading: true, error: null });
        
        try {
          console.log('🔐 Intentando login con:', username);

          // 1. Llamar a /auth/login
          const loginResponse = await authService.login(username, password);
          console.log('✅ Login exitoso');

          if (!loginResponse.success || !loginResponse.data.accessToken) {
            throw new Error('Respuesta de login inválida');
          }

          const { accessToken, refreshToken } = loginResponse.data;

          // 2. Llamar a /auth/me para obtener información del usuario
          console.log('📡 Obteniendo información del usuario...');
          const meResponse = await authService.me(accessToken);

          if (!meResponse.success || !meResponse.data) {
            throw new Error('Error al obtener información del usuario');
          }

          const user = meResponse.data;
          console.log('✅ Usuario obtenido:', {
            username: user.username,
            role: user.role,
            name: user.name,
          });

          // 3. Guardar en el store
          set({
            user,
            token: accessToken,
            refreshToken: refreshToken || null,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          console.log('✅ Login completado exitosamente');
          console.log(`🎯 Rol del usuario: ${user.role}`);
        } catch (error: any) {
          console.error('❌ Error en login:', error);
          
          const errorMessage = error.message || 'Error al iniciar sesión';
          
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

      logout: async () => {
        const { token } = get();
        
        try {
          console.log('🚪 Cerrando sesión...');
          
          if (token) {
            // Llamar a /auth/logout en el backend
            await authService.logout(token);
          }
          
          console.log('✅ Logout exitoso');
        } catch (error) {
          console.error('⚠️ Error en logout (continuando):', error);
          // Continuamos con el logout local aunque falle el servidor
        } finally {
          // Limpiar el store
          set({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
            error: null,
          });
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
