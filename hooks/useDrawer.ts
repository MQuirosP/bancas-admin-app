// hooks/useDrawer.ts
import { useUIStore } from '../store/ui.store';

export function useDrawer() {
  const { drawerOpen, openDrawer, closeDrawer, toggleDrawer } = useUIStore();

  return {
    isOpen: drawerOpen,
    open: openDrawer,
    close: closeDrawer,
    toggle: toggleDrawer,
  };
}