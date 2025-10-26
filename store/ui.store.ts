// store/ui.store.ts
import { create } from 'zustand';

interface UIState {
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void; // 🔥 Asegurarse de que existe

  // Rango de comparación para KPIs del dashboard (por defecto: hoy vs ayer)
  compareRange: 'yesterday' | 'last7' | 'last30';
  setCompareRange: (r: UIState['compareRange']) => void;
}

export const useUIStore = create<UIState>((set) => ({
  drawerOpen: false,
  
  openDrawer: () => set({ drawerOpen: true }),
  
  closeDrawer: () => set({ drawerOpen: false }),
  
  // 🔥 FUNCIÓN TOGGLE - Esta es la clave
  toggleDrawer: () => set((state) => ({ drawerOpen: !state.drawerOpen })),

  // KPIs: rango comparable configurable
  compareRange: 'yesterday',
  setCompareRange: (r) => set({ compareRange: r }),
}));
