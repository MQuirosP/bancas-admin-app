// tamagui.config.ts
import { createTamagui } from 'tamagui'
import { config as base } from '@tamagui/config/v3'

const themes = {
  light: {
    ...base.themes.light,

    // Tus tokens semánticos:
    headerBg: '#0B1220',
    headerHover: 'rgba(255,255,255,0.06)',
    headerTitle: '#ffffff',

    background: '#ffffff',
    backgroundHover: '#f8f9fa',
    backgroundPress: '#e9ecef',
    backgroundFocus: '#dee2e6',
    backgroundStrong: '#f1f3f5',
    backgroundTransparent: 'rgba(0,0,0,0.05)',

    color: '#000000',
    textPrimary: '#1a1a1a',
    textSecondary: '#4b5563',
    textTertiary: '#9ca3af',
    colorIcon: '#ffffff',

    borderColor: '#e5e7eb',
    borderColorHover: '#d1d5db',
    borderColorFocus: '#9ca3af',
    borderColorPress: '#6b7280',

    placeholderColor: '#9ca3af',
    outlineColor: '#4f46e5',

    primary: '#4f46e5',
    primaryHover: '#4338ca',
    primaryPress: '#3730a3',

    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',

    // (Opcional) Garantiza explícitamente la escala cyan usada en UI (1..12)
    cyan1:   '#ecfeff',
    cyan2:   '#cffafe',
    cyan3:   '#cffafe',
    cyan4:   '#a5f3fc',
    cyan5:   '#67e8f9',
    cyan6:   '#22d3ee',
    cyan7:   '#06b6d4',
    cyan8:   '#0891b2',
    cyan9:   '#0e7490',
    cyan10:  '#06b6d4',
    cyan11:  '#0891b2',
    cyan12:  '#083344',
    indigo3: '#e0e7ff',
    // usado en UI como fondo suave del badge/icono
    indigo4: '#c7d2fe',
    indigo10:'#4f46e5',
  },

  dark: {
    ...base.themes.dark,

    headerBg: '#0B1220',
    headerHover: 'rgba(255,255,255,0.06)',
    headerTitle: '#ffffff',

    background: '#121214',
    backgroundHover: '#1a1a1d',
    backgroundPress: '#25252a',
    backgroundFocus: '#2a2a2f',
    backgroundStrong: '#1a1a1d',
    backgroundTransparent: 'rgba(255,255,255,0.05)',

    color: '#ffffff',
    textPrimary: '#f5f5f5',
    textSecondary: '#d4d4d8',
    textTertiary: '#a1a1aa',
    colorIcon: '#121212',

    borderColor: '#2a2a2f',
    borderColorHover: '#35353a',
    borderColorFocus: '#404045',
    borderColorPress: '#4a4a4f',

    placeholderColor: '#71717a',
    outlineColor: '#6366f1',

    primary: '#6366f1',
    primaryHover: '#818cf8',
    primaryPress: '#4f46e5',

    success: '#34d399',
    warning: '#fbbf24',
    error: '#f87171',
    info: '#60a5fa',

    // (Opcional) Garantiza explícitamente la escala cyan usada en UI (1..12)
    cyan1:   '#083344',
    cyan2:   '#0b3f4a',
    cyan3:   '#164e63',
    cyan4:   '#155e75',
    cyan5:   '#0e7490',
    cyan6:   '#0891b2',
    cyan7:   '#06b6d4',
    cyan8:   '#22d3ee',
    cyan9:   '#67e8f9',
    cyan10:  '#22d3ee',
    cyan11:  '#a5f3fc',
    cyan12:  '#cffafe',
    indigo3: '#312e81',
    // usado en UI como fondo suave del badge/icono
    indigo4: '#3730a3',
    indigo10:'#6366f1',
  },
}

const appConfig = createTamagui({
  ...base,
  themes,
})

export type Conf = typeof appConfig
declare module 'tamagui' { interface TamaguiCustomConfig extends Conf {} }
export default appConfig
