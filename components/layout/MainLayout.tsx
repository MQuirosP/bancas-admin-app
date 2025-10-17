// components/layout/MainLayout.tsx
import React, { ReactNode } from 'react';
import { YStack } from 'tamagui';
import { Header } from './Header';
import { Footer } from './Footer';
import Drawer from './Drawer';
import { useUIStore } from '../../store/ui.store';

interface MainLayoutProps {
  children: ReactNode;
}

/**
 * MainLayout: Componente centralizado que envuelve toda la aplicación
 * con Header, contenido y Footer inmutables.
 * 
 * Este componente se usa en app/_layout.tsx una sola vez para evitar
 * duplicación de Header/Footer en cada sección.
 */
export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { drawerOpen, closeDrawer } = useUIStore();

  return (
    <YStack flex={1}>
      {/* Header - Inmutable para toda la app */}
      <Header />

      {/* Contenido principal */}
      <YStack flex={1}>
        {children}
      </YStack>

      {/* Drawer superpuesto */}
      <Drawer isOpen={drawerOpen} onClose={closeDrawer} />

      {/* Footer - Inmutable para toda la app */}
      <Footer />
    </YStack>
  );
};