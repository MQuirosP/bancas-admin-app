// tamagui.config.ts
import { createTamagui, createTokens } from 'tamagui'
import { shorthands } from '@tamagui/shorthands'
import { themes as baseThemes } from '@tamagui/themes'
import { createAnimations } from '@tamagui/animations-react-native'

const BASE = 16

// 🎨 Paleta de colores personalizada - Oscuro elegante minimalista
const colors = {
  // Grises oscuros (base)
  dark: {
    50: '#0a0a0b',   // Casi negro
    100: '#121214',  // Fondo principal
    200: '#1a1a1d',  // Fondo elevado (header, footer, cards)
    300: '#25252a',  // Hover states
    400: '#35353d',  // Borders sutiles
    500: '#4a4a56',  // Texto secundario
    600: '#6b6b7a',  // Texto terciario
    700: '#8a8a9a',  // Iconos inactivos
    800: '#b4b4c5',  // Texto normal
    900: '#e8e8f0',  // Texto principal
  },
  // Acentos
  primary: {
    DEFAULT: '#6366f1',  // Índigo moderno
    light: '#818cf8',
    dark: '#4f46e5',
  },
  success: {
    DEFAULT: '#10b981',
    light: '#34d399',
    dark: '#059669',
  },
  error: {
    DEFAULT: '#ef4444',
    light: '#f87171',
    dark: '#dc2626',
  },
  warning: {
    DEFAULT: '#f59e0b',
    light: '#fbbf24',
    dark: '#d97706',
  },
}

const tokens = createTokens({
  color: {
    // Colores base
    backgroundDark: colors.dark[100],
    backgroundElevated: colors.dark[200],
    backgroundHover: colors.dark[300],
    borderSubtle: colors.dark[400],
    textPrimary: colors.dark[900],
    textSecondary: colors.dark[800],
    textTertiary: colors.dark[600],
    
    // Acentos
    primary: colors.primary.DEFAULT,
    primaryLight: colors.primary.light,
    primaryDark: colors.primary.dark,
    success: colors.success.DEFAULT,
    error: colors.error.DEFAULT,
    warning: colors.warning.DEFAULT,

    // ✅ NUEVO: token requerido por tus estilos para focus/outline
    outlineColor: colors.primary.DEFAULT,
  },
  space: {
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: BASE,
    5: 20,
    6: 24,
    8: 32,
    10: 40,
    12: 48,
    16: 64,
    true: BASE,
  },
  size: {
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: BASE,
    5: 20,
    6: 24,
    8: 32,
    true: BASE,
  },
  radius: {
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    true: 8,
  },
  zIndex: { 
    0: 0, 
    1: 10, 
    2: 20,
    header: 100,
    drawer: 200,
    modal: 300,
  },
})

const animations = createAnimations({
  quick: { type: 'spring', damping: 20, mass: 1.1, stiffness: 250 },
  smooth: { type: 'spring', damping: 25, mass: 1, stiffness: 200 },
})

// Tema oscuro personalizado
const darkTheme = {
  background: colors.dark[100],
  backgroundHover: colors.dark[300],
  backgroundPress: colors.dark[400],
  backgroundFocus: colors.dark[300],
  backgroundStrong: colors.dark[200],
  backgroundTransparent: 'rgba(0,0,0,0.5)',
  
  color: colors.dark[900],
  colorHover: colors.dark[900],
  colorPress: colors.dark[800],
  colorFocus: colors.dark[900],
  colorTransparent: 'rgba(255,255,255,0.1)',
  
  borderColor: colors.dark[400],
  borderColorHover: colors.dark[500],
  borderColorFocus: colors.primary.DEFAULT,
  borderColorPress: colors.dark[500],
  
  placeholderColor: colors.dark[600],
  
  // Colores semánticos
  primary: colors.primary.DEFAULT,
  primaryHover: colors.primary.light,
  
  secondary: colors.dark[600],
  secondaryHover: colors.dark[700],
  
  success: colors.success.DEFAULT,
  successHover: colors.success.light,
  
  error: colors.error.DEFAULT,
  errorHover: colors.error.light,
  
  warning: colors.warning.DEFAULT,
  warningHover: colors.warning.light,
  
  // Tokens personalizados
  headerBg: colors.dark[200],
  footerBg: colors.dark[200],
  drawerBg: colors.dark[200],
  cardBg: colors.dark[200],
  
  shadowColor: 'rgba(0,0,0,0.5)',

  // ✅ NUEVO: clave de theme que referencia el token
  outlineColor: '$outlineColor',
}

export const config = createTamagui({
  tokens,
  themes: {
    dark: darkTheme,
    light: darkTheme, // Por ahora ambos usan el tema oscuro
  },
  shorthands,
  animations,
  media: {
    xs: { maxWidth: 660 },
    sm: { maxWidth: 860 },
    md: { maxWidth: 980 },
    lg: { maxWidth: 1280 },
    xl: { maxWidth: 1420 },
    gtXs: { minWidth: 661 },
    gtSm: { minWidth: 861 },
    gtMd: { minWidth: 981 },
    gtLg: { minWidth: 1281 },
    short: { maxHeight: 820 },
    tall: { minHeight: 820 },
    hoverNone: { hover: 'none' },
    pointerCoarse: { pointer: 'coarse' },
  },
})

export type AppConfig = typeof config
declare module 'tamagui' {
  interface TamaguiCustomConfig extends AppConfig {}
}
export default config
