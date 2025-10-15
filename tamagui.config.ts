// tamagui.config.ts
import { createTamagui, createTokens } from 'tamagui'
import { shorthands } from '@tamagui/shorthands'
import { themes as baseThemes } from '@tamagui/themes'
import { createAnimations } from '@tamagui/animations-react-native'

const BASE = 16 // tamaño base para size/space

const tokens = createTokens({
  color: {},
  space: {
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: BASE,
    5: 20,
    true: BASE,     // ✅ requerido por Tamagui
  },
  size: {
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: BASE,
    5: 20,
    true: BASE,     // ✅ requerido por Tamagui
  },
  radius: {
    0: 0,
    1: 4,
    2: 8,
    true: 4,        // ✅ recomendable (radio base)
  },
  zIndex: { 0: 0, 1: 10, 2: 20 },
})

const animations = createAnimations({
  quick: { type: 'spring', damping: 20, mass: 1.1, stiffness: 250 },
  // bouncy: { type: 'spring', damping: 10, mass: 0.9, stiffness: 120 },
})

const themes = {
  ...baseThemes,
  light: {
    ...baseThemes.light,
    primary: '#3b82f6',
    secondary: '#64748b',
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
  },
  dark: {
    ...baseThemes.dark,
    primary: '#60a5fa',
    secondary: '#94a3b8',
    success: '#34d399',
    error: '#f87171',
    warning: '#fbbf24',
  },
}

export const config = createTamagui({
  tokens,
  themes,
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
