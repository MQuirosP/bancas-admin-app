import React, { useMemo } from 'react'
import { Platform, ViewStyle } from 'react-native'
import { Text, YStack } from 'tamagui'
import { Button } from './Button'

type Mode = 'date' | 'time' | 'datetime'

export type DatePickerProps = {
  value?: Date | null
  onChange: (d: Date) => void
  mode?: Mode
  placeholder?: string
  style?: ViewStyle
}

/**
 * Formatea una fecha para el input web en zona horaria local
 * Esto asegura que la fecha se muestre correctamente sin problemas de conversión UTC
 */
function formatForWeb(value?: Date | null, mode: Mode = 'date') {
  if (!value) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  // Usar métodos locales para evitar problemas de zona horaria
  const yyyy = value.getFullYear()
  const mm = pad(value.getMonth() + 1)
  const dd = pad(value.getDate())
  const hh = pad(value.getHours())
  const mi = pad(value.getMinutes())
  if (mode === 'date') return `${yyyy}-${mm}-${dd}`
  if (mode === 'time') return `${hh}:${mi}`
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`
}

export const DatePicker: React.FC<DatePickerProps> = ({ value, onChange, mode = 'date', placeholder = 'Seleccionar', style }) => {
  const inputType = useMemo(() => (mode === 'date' ? 'date' : mode === 'time' ? 'time' : 'datetime-local'), [mode])

  if (Platform.OS === 'web') {
    const webValue = formatForWeb(value ?? null, mode)

    // Inyecta una regla CSS única para asegurar color del placeholder en web
    if (typeof document !== 'undefined' && !document.getElementById('datePickerPlaceholderStyle')) {
      const styleTag = document.createElement('style')
      styleTag.id = 'datePickerPlaceholderStyle'
      styleTag.innerHTML = `
        .ui-date-picker::placeholder { color: var(--color-color); opacity: 1; }
        .ui-date-picker::-webkit-input-placeholder { color: var(--color-color); opacity: 1; }
        .ui-date-picker::-moz-placeholder { color: var(--color-color); opacity: 1; }
        .ui-date-picker:-ms-input-placeholder { color: var(--color-color); opacity: 1; }
      `
      document.head.appendChild(styleTag)
    }

    return (
      <YStack style={style}>
        <input
          className="ui-date-picker"
          type={inputType as any}
          value={webValue}
          placeholder={placeholder}
          onChange={(e) => {
            const v = e.currentTarget.value
            if (!v) return
            
            let d: Date
            if (mode === 'date') {
              // Crear la fecha como medianoche en zona horaria local para evitar problemas de conversión
              // El input type="date" devuelve formato YYYY-MM-DD
              const [year, month, day] = v.split('-').map(Number)
              d = new Date(year, month - 1, day, 0, 0, 0, 0) // month es 0-indexed
            } else if (mode === 'datetime') {
              // El input type="datetime-local" devuelve formato YYYY-MM-DDTHH:mm
              const [datePart, timePart] = v.split('T')
              const [year, month, day] = datePart.split('-').map(Number)
              const [hours, minutes] = timePart ? timePart.split(':').map(Number) : [0, 0]
              d = new Date(year, month - 1, day, hours, minutes, 0, 0) // month es 0-indexed
            } else {
              // mode === 'time' - formato HH:mm
              const [hours, minutes] = v.split(':').map(Number)
              d = new Date()
              d.setHours(hours, minutes, 0, 0)
            }
            
            if (!isNaN(d.getTime())) onChange(d)
          }}
          style={{
            padding: 10,
            borderWidth: 1,
            borderColor: 'var(--color-borderColor)',
            backgroundColor: 'var(--color-background)',
            borderRadius: 6,
            color: 'var(--color-color)',
            caretColor: 'var(--color-color)'
          }}
        />
      </YStack>
    )
  }

  // nativo (ios/android)
  // Cargar dinámicamente para evitar problemas de web
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const NativePicker = require('@react-native-community/datetimepicker').default
  return (
    <NativePicker
      mode={mode === 'datetime' ? 'datetime' : mode}
      value={value ?? new Date()}
      onChange={(_e: any, d?: Date) => d && onChange(d)}
      style={style}
      {...(Platform.OS === 'ios' ? { textColor: '#ffffff' } : {})}
    />
  )
}

export default DatePicker
