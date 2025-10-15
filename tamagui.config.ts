// tamagui.config.ts
import { createTamagui, createTokens } from 'tamagui'
import { shorthands } from '@tamagui/shorthands'
import { themes as baseThemes } from '@tamagui/themes'

// (Opcional) tokens mínimos — puedes ampliarlos luego
const tokens = createTokens({
  color: {
    // puedes dejar vacíos si usas los de @tamagui/themes
  },
  space: { 0: 0, 1: 4, 2: 8, 3: 12, 4: 16, 5: 20 },
  size: { 0: 0, 1: 4, 2: 8, 3: 12, 4: 16, 5: 20 },
  radius: { 0: 0, 1: 4, 2: 8 },
  zIndex: { 0: 0, 1: 10, 2: 20 },
  // define al menos una font si usas <Text />
  // fonts: puedes usar las de @tamagui/fonts más adelante
})

// Extiende los themes base (light/dark ya traen todas las claves obligatorias)
const themes = {
  ...baseThemes,

  light: {
    ...baseThemes.light,
    primary: '#3b82f6',   // Azul
    secondary: '#64748b', // Gris
    success: '#10b981',   // Verde
    error: '#ef4444',     // Rojo
    warning: '#f59e0b',   // Naranja
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
  // (Opcional pero útil si quieres que siga prefers-color-scheme)
  // shouldAddPrefersColorThemes: true,
})

export type AppConfig = typeof config

declare module 'tamagui' {
  // Esto hace que TypeScript conozca tus themes y tokens
  interface TamaguiCustomConfig extends AppConfig {}
}

export default config
