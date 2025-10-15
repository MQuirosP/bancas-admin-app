// tamagui.config.ts
import { createTamagui, createTokens } from 'tamagui'
import { shorthands } from '@tamagui/shorthands'

// ⬅️ IMPORTA tokens y themes base
import { tokens as baseTokens, themes as baseThemes } from '@tamagui/themes'

import { createAnimations } from '@tamagui/animations-react-native'

const BASE = 16

const colors = {
  dark: {
    50: '#0a0a0b',
    100: '#121214',
    200: '#1a1a1d',
    300: '#25252a',
    400: '#35353d',
    500: '#4a4a56',
    600: '#6b6b7a',
    700: '#8a8a9a',
    800: '#b4b4c5',
    900: '#e8e8f0',
  },
  primary: { DEFAULT: '#6366f1', light: '#818cf8', dark: '#4f46e5' },
  success: { DEFAULT: '#10b981', light: '#34d399', dark: '#059669' },
  error:   { DEFAULT: '#ef4444', light: '#f87171', dark: '#dc2626' },
  warning: { DEFAULT: '#f59e0b', light: '#fbbf24', dark: '#d97706' },
}

// ⬅️ define SOLO tus tokens custom (no reemplaces los base)
const customTokens = createTokens({
  color: {
    backgroundDark: colors.dark[100],
    backgroundElevated: colors.dark[200],
    backgroundHover: colors.dark[300],
    borderSubtle: colors.dark[400],
    textPrimary: colors.dark[900],
    textSecondary: colors.dark[800],
    textTertiary: colors.dark[600],

    primary: colors.primary.DEFAULT,
    primaryLight: colors.primary.light,
    primaryDark: colors.primary.dark,
    success: colors.success.DEFAULT,
    error: colors.error.DEFAULT,
    warning: colors.warning.DEFAULT,

    outlineColor: colors.primary.DEFAULT, // para focus/outline
  },
  space: { 0:0, 1:4, 2:8, 3:12, 4:BASE, 5:20, 6:24, 8:32, 10:40, 12:48, 16:64, true: BASE },
  size:  { 0:0, 1:4, 2:8, 3:12, 4:BASE, 5:20, 6:24, 8:32, true: BASE },
  radius:{ 0:0, 1:4, 2:8, 3:12, 4:16, true: 8 },
  zIndex:{ 0:0, 1:10, 2:20, header:100, drawer:200, modal:300 },
})

const animations = createAnimations({
  quick: { type: 'spring', damping: 20, mass: 1.1, stiffness: 250 },
  smooth:{ type: 'spring', damping: 25, mass: 1, stiffness: 200 },
})

// overrides para dark/light
const darkOverrides = {
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

  headerBg: colors.dark[200],
  footerBg: colors.dark[200],
  drawerBg: colors.dark[200],
  cardBg: colors.dark[200],
  shadowColor: 'rgba(0,0,0,0.5)',

  outlineColor: '$outlineColor',
}

export const config = createTamagui({
  // ⬅️ MEZCLA tokens base + tus tokens
  tokens: {
    ...baseTokens,
    color: {
      ...baseTokens.color,       // ← trae $blue1..$blue12, $green*, $purple*, $orange*...
      ...customTokens.color,     // ← tus overrides se aplican después
    },
    space:  { ...baseTokens.space,  ...customTokens.space },
    size:   { ...baseTokens.size,   ...customTokens.size },
    radius: { ...baseTokens.radius, ...customTokens.radius },
    zIndex: { ...baseTokens.zIndex, ...customTokens.zIndex },
  },

  // ⬅️ MEZCLA themes base + tus overrides
  themes: {
    ...baseThemes,                     // conserva blue/green/purple/orange, etc.
    dark:  { ...baseThemes.dark,  ...darkOverrides },
    light: { ...baseThemes.light, ...darkOverrides }, // mismo look por ahora
  },

  shorthands,
  animations,
  media: {
    xs:{ maxWidth:660 }, sm:{ maxWidth:860 }, md:{ maxWidth:980 },
    lg:{ maxWidth:1280 }, xl:{ maxWidth:1420 },
    gtXs:{ minWidth:661 }, gtSm:{ minWidth:861 }, gtMd:{ minWidth:981 }, gtLg:{ minWidth:1281 },
    short:{ maxHeight:820 }, tall:{ minHeight:820 },
    hoverNone:{ hover:'none' }, pointerCoarse:{ pointer:'coarse' },
  },
})

export type AppConfig = typeof config
declare module 'tamagui' { interface TamaguiCustomConfig extends AppConfig {} }
export default config
