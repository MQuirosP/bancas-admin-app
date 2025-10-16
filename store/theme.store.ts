// store/theme.store.ts
import { create } from 'zustand';
import { useColorScheme } from 'react-native';

type ThemeMode = 'light' | 'dark';

interface ThemeState {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: (useColorScheme() as ThemeMode) || 'light',
  
  setTheme: (theme: ThemeMode) => set({ theme }),
  
  toggleTheme: () =>
    set((state) => ({
      theme: state.theme === 'light' ? 'dark' : 'light',
    })),
}));