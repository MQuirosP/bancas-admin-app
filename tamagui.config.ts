// tamagui.config.ts
import { config } from '@tamagui/config/v3';
import { createTamagui } from 'tamagui';

const appConfig = createTamagui({
  ...config,
  themes: {
    light: {
      background: '#ffffff',
      backgroundHover: '#f8f9fa',
      backgroundPress: '#e9ecef',
      backgroundFocus: '#dee2e6',
      backgroundStrong: '#f1f3f5',
      backgroundTransparent: 'rgba(0,0,0,0.05)',
      color: '#000000',
      colorHover: '#262626',
      colorPress: '#000000',
      colorFocus: '#000000',
      colorTransparent: 'rgba(0,0,0,0)',
      borderColor: '#e5e7eb',
      borderColorHover: '#d1d5db',
      borderColorFocus: '#9ca3af',
      borderColorPress: '#6b7280',
      placeholderColor: '#9ca3af',
      
      // Colores de texto específicos
      textPrimary: '#1a1a1a',      // Texto principal - NEGRO en light
      textSecondary: '#4b5563',    // Texto secundario - gris oscuro
      textTertiary: '#9ca3af',     // Texto terciario - gris medio
      
      // Colores de marca
      primary: '#4f46e5',          // Índigo
      primaryHover: '#4338ca',
      primaryPress: '#3730a3',
      
      // Estados
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
      
      // Rojos para errores
      red10: '#ef4444',
      red11: '#dc2626',
    },
    dark: {
      background: '#121214',           // Casi negro
      backgroundHover: '#1a1a1d',      // Gris muy oscuro
      backgroundPress: '#25252a',      // Gris oscuro hover
      backgroundFocus: '#2a2a2f',      // Gris oscuro focus
      backgroundStrong: '#1a1a1d',     // Para cards/footer/header
      backgroundTransparent: 'rgba(255,255,255,0.05)',
      color: '#ffffff',
      colorHover: '#f5f5f5',
      colorPress: '#ffffff',
      colorFocus: '#ffffff',
      colorTransparent: 'rgba(255,255,255,0)',
      borderColor: '#2a2a2f',
      borderColorHover: '#35353a',
      borderColorFocus: '#404045',
      borderColorPress: '#4a4a4f',
      placeholderColor: '#71717a',
      
      // Colores de texto específicos para tema oscuro
      textPrimary: '#f5f5f5',      // Texto principal - BLANCO en dark
      textSecondary: '#d4d4d8',    // Texto secundario - gris muy claro
      textTertiary: '#a1a1aa',     // Texto terciario - gris claro
      
      // Colores de marca
      primary: '#6366f1',          // Índigo más claro
      primaryHover: '#818cf8',
      primaryPress: '#4f46e5',
      
      // Estados
      success: '#34d399',
      warning: '#fbbf24',
      error: '#f87171',
      info: '#60a5fa',
      
      // Rojos para errores
      red10: '#f87171',
      red11: '#ef4444',
    },
  },
});

type Conf = typeof appConfig;

declare module 'tamagui' {
  interface TamaguiCustomConfig extends Conf {}
}

export default appConfig;