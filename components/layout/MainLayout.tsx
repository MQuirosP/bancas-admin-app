// components/layout/MainLayout.tsx
import React, { ReactNode } from 'react'
import { YStack, Theme } from 'tamagui'
import { Header } from './Header'
import { Footer } from './Footer'
import Drawer from './Drawer'
import { useUIStore } from '../../store/ui.store'
import { useThemeStore } from '../../store/theme.store' // ← añade esto

interface MainLayoutProps {
  children: ReactNode
}

/**
 * Shell único: Header + Drawer + Footer.
 * Aplica Theme global aquí para no repetirlo en cada layout de grupo.
 */
export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { drawerOpen, closeDrawer } = useUIStore()
  const { theme } = useThemeStore() // ← lee el tema aquí

  return (
    <YStack flex={1}>
      <Header />
      <Theme name={theme}>
        <YStack flex={1}>
          {children}
        </YStack>
      </Theme>
      <Drawer isOpen={drawerOpen} onClose={closeDrawer} />
      <Footer />
    </YStack>
  )
}
