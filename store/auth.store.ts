// store/auth.store.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type UserRole = 'ADMIN' | 'VENTANA' | 'VENDEDOR';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  bancaId?: string;
  ventanaId?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (username: string, password: string) => {
        set({ isLoading: true });
        
        try {
          // TODO: Reemplazar con llamada real a tu API
          // const response = await fetch('https://tu-api.com/auth/login', {
          //   method: 'POST',
          //   headers: { 'Content-Type': 'application/json' },
          //   body: JSON.stringify({ username, password }),
          // });
          // const data = await response.json();
          
          // SIMULACIÓN - Eliminar esto cuando conectes la API real
          await new Promise((resolve) => setTimeout(resolve, 1000));
          
          // Simular diferentes roles según el usuario
          let mockUser: User;
          let mockToken = 'mock-jwt-token-' + Date.now();
          
          if (username === 'admin') {
            mockUser = {
              id: '1',
              username: 'admin',
              name: 'Administrador',
              role: 'ADMIN',
            };
          } else if (username === 'ventana') {
            mockUser = {
              id: '2',
              username: 'ventana',
              name: 'Usuario Ventana',
              role: 'VENTANA',
              bancaId: 'banca-1',
              ventanaId: 'ventana-1',
            };
          } else {
            mockUser = {
              id: '3',
              username: username,
              name: 'Vendedor',
              role: 'VENDEDOR',
              ventanaId: 'ventana-1',
            };
          }

          set({
            user: mockUser,
            token: mockToken,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          console.error('Error en login:', error);
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },

      setUser: (user: User) => {
        set({ user });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);