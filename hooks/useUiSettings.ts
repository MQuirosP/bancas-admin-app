// src/hooks/useUiSettings.ts
export type TimeFormat = '24h' | '12h'

/**
 * Hook simple para centralizar preferencias de UI.
 * Luego lo puedes conectar a tu store/global config.
 */
export function useUiSettings() {
  // TODO: cámbialo cuando tengas configuración real del sistema
  const timeFormat: TimeFormat = '24h' // o '12h'
  const timePickerMode: 'picker' | 'fields' = 'picker' // web: usa <input type="time">; native: fields
  const minuteStep = 5 // para flechitas (fields)

  return { timeFormat, timePickerMode, minuteStep }
}
