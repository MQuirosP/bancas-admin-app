import { create } from 'zustand';

interface UIState {
  drawerOpen: boolean;
  theme: 'light' | 'dark';
  fontSize: 'small' | 'medium' | 'large';
  toggleDrawer: () => void;
  closeDrawer: () => void;
  openDrawer: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setFontSize: (size: 'small' | 'medium' | 'large') => void;
}

export const useUIStore = create<UIState>((set) => ({
  drawerOpen: false,
  theme: 'light',
  fontSize: 'medium',

  toggleDrawer: () => set((state) => ({ drawerOpen: !state.drawerOpen })),
  closeDrawer: () => set({ drawerOpen: false }),
  openDrawer: () => set({ drawerOpen: true }),
  setTheme: (theme) => set({ theme }),
  setFontSize: (fontSize) => set({ fontSize }),
}));