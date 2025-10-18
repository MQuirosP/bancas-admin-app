// tamagui.config.ts
import { config } from '@tamagui/config/v3';
import { createTamagui } from 'tamagui';

const appConfig = createTamagui({
  ...config,
  themes: {
    light: {
      // ==================== HEADER ====================
      headerBg: '#0B1220',
      headerHover: 'rgba(255,255,255,0.06)',
      headerTitle: '#ffffff',
      
      // ==================== BACKGROUNDS ====================
      background: '#ffffff',
      backgroundHover: '#f8f9fa',
      backgroundPress: '#e9ecef',
      backgroundFocus: '#dee2e6',
      backgroundStrong: '#f1f3f5',
      backgroundTransparent: 'rgba(0,0,0,0.05)',
      
      // ==================== COLORES GENERALES ====================
      color: '#000000',
      colorHover: '#262626',
      colorPress: '#000000',
      colorFocus: '#000000',
      colorTransparent: 'rgba(0,0,0,0)',
      
      // ==================== BORDES ====================
      borderColor: '#e5e7eb',
      borderColorHover: '#d1d5db',
      borderColorFocus: '#9ca3af',
      borderColorPress: '#6b7280',
      
      // ==================== INPUTS ====================
      placeholderColor: '#9ca3af',
      outlineColor: '#4f46e5',

      // ==================== TEXTO ====================
      textPrimary: '#1a1a1a',
      textSecondary: '#4b5563',
      textTertiary: '#9ca3af',

      // ==================== COLORES DE MARCA ====================
      primary: '#4f46e5',
      primaryHover: '#4338ca',
      primaryPress: '#3730a3',

      // ==================== ESTADOS ====================
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',

      // ==================== COLORES ADICIONALES ====================
      red3: '#fecaca',
      red4: '#fca5a5',
      red9: '#f87171',
      red10: '#ef4444',
      red11: '#dc2626',
      
      blue3: '#dbeafe',
      blue4: '#bfdbfe',
      blue9: '#3b82f6',
      blue10: '#2563eb',
      blue11: '#1e3a8a',
      
      green3: '#d1fae5',
      green4: '#a7f3d0',
      green9: '#34d399',
      green10: '#10b981',
      green11: '#065f46',
      
      purple3: '#e9d5ff',
      purple4: '#d8b4fe',
      purple9: '#a855f7',
      purple10: '#9333ea',
      purple11: '#7e22ce',
      
      gray3: '#f3f4f6',
      gray4: '#e5e7eb',
      gray9: '#6b7280',
      gray10: '#4b5563',
      gray11: '#374151',
      
      cyan3: '#cffafe',
      cyan4: '#a5f3fc',
      cyan9: '#22d3ee',
      cyan10: '#06b6d4',
      cyan11: '#0891b2',
      
      pink3: '#fce7f3',
      pink4: '#fbcfe8',
      pink9: '#f472b6',
      pink10: '#ec4899',
      pink11: '#db2777',
      
      orange3: '#fed7aa',
      orange4: '#fdba74',
      orange9: '#fb923c',
      orange10: '#f97316',
      orange11: '#ea580c',
      
      indigo3: '#e0e7ff',
      indigo4: '#c7d2fe',
      indigo9: '#6366f1',
      indigo10: '#4f46e5',
      indigo11: '#4338ca',
      
      yellow3: '#fef3c7',
      yellow4: '#fde68a',
      yellow9: '#fbbf24',
      yellow10: '#f59e0b',
      yellow11: '#d97706',
      
      shadowColor: 'rgba(0,0,0,0.1)',
    },
    dark: {
      // ==================== HEADER ====================
      headerBg: '#0B1220',
      headerHover: 'rgba(255,255,255,0.06)',
      headerTitle: '#ffffff',
      
      // ==================== BACKGROUNDS ====================
      background: '#121214',
      backgroundHover: '#1a1a1d',
      backgroundPress: '#25252a',
      backgroundFocus: '#2a2a2f',
      backgroundStrong: '#1a1a1d',
      backgroundTransparent: 'rgba(255,255,255,0.05)',
      
      // ==================== COLORES GENERALES ====================
      color: '#ffffff',
      colorHover: '#f5f5f5',
      colorPress: '#ffffff',
      colorFocus: '#ffffff',
      colorTransparent: 'rgba(255,255,255,0)',
      
      // ==================== BORDES ====================
      borderColor: '#2a2a2f',
      borderColorHover: '#35353a',
      borderColorFocus: '#404045',
      borderColorPress: '#4a4a4f',
      
      // ==================== INPUTS ====================
      placeholderColor: '#71717a',
      outlineColor: '#6366f1',

      // ==================== TEXTO ====================
      textPrimary: '#f5f5f5',
      textSecondary: '#d4d4d8',
      textTertiary: '#a1a1aa',

      // ==================== COLORES DE MARCA ====================
      primary: '#6366f1',
      primaryHover: '#818cf8',
      primaryPress: '#4f46e5',

      // ==================== ESTADOS ====================
      success: '#34d399',
      warning: '#fbbf24',
      error: '#f87171',
      info: '#60a5fa',

      // ==================== COLORES ADICIONALES ====================
      red3: '#7f1d1d',
      red4: '#991b1b',
      red9: '#f87171',
      red10: '#ef4444',
      red11: '#dc2626',
      
      blue3: '#1e3a8a',
      blue4: '#1e40af',
      blue9: '#60a5fa',
      blue10: '#3b82f6',
      blue11: '#dbeafe',
      
      green3: '#064e3b',
      green4: '#065f46',
      green9: '#34d399',
      green10: '#10b981',
      green11: '#d1fae5',
      
      purple3: '#581c87',
      purple4: '#6b21a8',
      purple9: '#c084fc',
      purple10: '#a855f7',
      purple11: '#e9d5ff',
      
      gray3: '#1f2937',
      gray4: '#374151',
      gray9: '#9ca3af',
      gray10: '#d1d5db',
      gray11: '#e5e7eb',
      
      cyan3: '#164e63',
      cyan4: '#155e75',
      cyan9: '#67e8f9',
      cyan10: '#22d3ee',
      cyan11: '#cffafe',
      
      pink3: '#831843',
      pink4: '#9f1239',
      pink9: '#f9a8d4',
      pink10: '#f472b6',
      pink11: '#fce7f3',
      
      orange3: '#7c2d12',
      orange4: '#9a3412',
      orange9: '#fdba74',
      orange10: '#fb923c',
      orange11: '#fed7aa',
      
      indigo3: '#312e81',
      indigo4: '#3730a3',
      indigo9: '#818cf8',
      indigo10: '#6366f1',
      indigo11: '#e0e7ff',
      
      yellow3: '#78350f',
      yellow4: '#92400e',
      yellow9: '#fde68a',
      yellow10: '#fbbf24',
      yellow11: '#fef3c7',
      
      shadowColor: 'rgba(0,0,0,0.5)',
    },
  },
});

type Conf = typeof appConfig;

declare module 'tamagui' {
  interface TamaguiCustomConfig extends Conf {}
}

export default appConfig;