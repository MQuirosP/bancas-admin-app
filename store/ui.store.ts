// store/ui.store.ts
import { create } from 'zustand';

interface UIState {
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void; // 🔥 Asegurarse de que existe
}

export const useUIStore = create<UIState>((set) => ({
  drawerOpen: false,
  
  openDrawer: () => set({ drawerOpen: true }),
  
  closeDrawer: () => set({ drawerOpen: false }),
  
  // 🔥 FUNCIÓN TOGGLE - Esta es la clave
  toggleDrawer: () => set((state) => ({ drawerOpen: !state.drawerOpen })),
}));