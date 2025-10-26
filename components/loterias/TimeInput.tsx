import React, { useMemo } from 'react'
import { XStack, Input, Select, Text } from 'tamagui'
import { Button } from '@/components/ui'
import { ChevronDown } from '@tamagui/lucide-icons'
import { Platform } from 'react-native'

type Ampm = 'AM' | 'PM'

type Props = {
  value?: string            // "HH:MM" en 24h (siempre se emite en 24h hacia arriba)
  onChange: (v: string) => void
  format?: '24h' | '12h'    // cómo se muestra
  w?: number | string
  /** 'picker' usa <input type="time"> en web; 'fields' usa 2 inputs + steppers */
  mode?: 'picker' | 'fields'
  /** paso de minutos para los steppers (fields) */
  minuteStep?: number
}

function pad(n: number) { return String(n).padStart(2, '0') }
function clamp(n: number, min: number, max: number) { return Math.max(min, Math.min(max, n)) }

export default function TimeInput({
  value,
  onChange,
  format = '24h',
  w = 180,
  mode = 'picker',
  minuteStep = 5,
}: Props) {
  // --- PARSE 24H SIEMPRE
  const [hh, mm] = useMemo(() => {
    if (!value) return [0, 0]
    const [h, m] = value.split(':').map(x => parseInt(x, 10))
    return [isNaN(h) ? 0 : clamp(h, 0, 23), isNaN(m) ? 0 : clamp(m, 0, 59)]
  }, [value])

  const { h12, ampm } = useMemo(() => {
    if (format === '24h') return { h12: hh, ampm: 'AM' as Ampm }
    const _ampm: Ampm = hh >= 12 ? 'PM' : 'AM'
    let hour12 = hh % 12
    if (hour12 === 0) hour12 = 12
    return { h12: hour12, ampm: _ampm }
  }, [hh, format])

  const to24From12 = (h12: number, ap: Ampm) => (ap === 'AM' ? (h12 === 12 ? 0 : h12) : (h12 === 12 ? 12 : h12 + 12))
  const emit24 = (H: number, M: number) => onChange(`${pad(clamp(H,0,23))}:${pad(clamp(M,0,59))}`)

  // --- HANDLERS
  const setHourTxt = (txt: string) => {
    const n = parseInt((txt ?? '').replace(/\D+/g, ''), 10)
    if (isNaN(n)) return
    if (format === '24h') {
      emit24(n, mm)
    } else {
      const safe12 = clamp(n, 1, 12)
      emit24(to24From12(safe12, ampm), mm)
    }
  }
  const setMinuteTxt = (txt: string) => {
    const n = parseInt((txt ?? '').replace(/\D+/g, ''), 10)
    if (isNaN(n)) return
    emit24(hh, n)
  }
  const step = (dh: number, dm: number) => {
    // convertir a total minutos, sumar, normalizar
    let total = hh * 60 + mm + dh * 60 + dm
    total = ((total % (24*60)) + (24*60)) % (24*60) // wrap 0..1439
    const H = Math.floor(total / 60)
    const M = total % 60
    emit24(H, M)
  }
  const setAmPm = (ap: Ampm) => {
    if (format === '24h') return
    emit24(to24From12(h12, ap), mm)
  }

  // --- UI: MODO PICKER (solo Web)
  if (Platform.OS === 'web' && mode === 'picker') {
    return (
      <XStack
        gap="$2"
        ai="center"
        w={w}
        position="relative"
        borderWidth={1}
        borderColor="$borderColor"
        borderRadius="$3"
        backgroundColor="$background"
        height={36}
        px="$2"
      >
        <input
          type="time"
          step={60}
          value={`${pad(hh)}:${pad(mm)}`}
          onChange={(e) => {
            const v = (e.target as HTMLInputElement).value // "HH:MM"
            const [H,M] = v.split(':').map(n => parseInt(n,10))
            emit24(isNaN(H)?0:H, isNaN(M)?0:M)
          }}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            background: 'transparent',
            color: 'inherit',
            outline: 'none',
            padding: '0 6px',
          }}
        />
      </XStack>
    )
  }

  // --- UI: MODO FIELDS (cross-plat) + steppers + AM/PM opcional
  return (
    <XStack gap="$2" ai="center" w={w}>
      {/* Hora */}
      <XStack ai="center" gap="$1">
        <Button size="$1" onPress={() => step(-1,0)} aria-label="hora -">-</Button>
        <Input
          keyboardType="number-pad"
          inputMode="numeric"
          value={String(format === '24h' ? hh : h12)}
          onChangeText={setHourTxt}
          w={60}
          placeholder="hh"
        />
        <Button size="$1" onPress={() => step(+1,0)} aria-label="hora +">+</Button>
      </XStack>

      <Text>:</Text>

      {/* Minuto */}
      <XStack ai="center" gap="$1">
        <Button size="$1" onPress={() => step(0, -minuteStep)} aria-label="min -">-</Button>
        <Input
          keyboardType="number-pad"
          inputMode="numeric"
          value={pad(mm)}
          onChangeText={setMinuteTxt}
          w={60}
          placeholder="mm"
        />
        <Button size="$1" onPress={() => step(0, +minuteStep)} aria-label="min +">+</Button>
      </XStack>

      {/* AM/PM */}
      {format === '12h' && (
        <Select value={hh >= 12 ? 'PM' : 'AM'} onValueChange={(v) => setAmPm(v as Ampm)}>
          <Select.Trigger iconAfter={ChevronDown} bw={1} bc="$borderColor" w={70} h={36}>
            <Select.Value />
          </Select.Trigger>
          <Select.Content>
            <Select.Viewport>
              <Select.Item value="AM" index={0}><Select.ItemText>AM</Select.ItemText></Select.Item>
              <Select.Item value="PM" index={1}><Select.ItemText>PM</Select.ItemText></Select.Item>
            </Select.Viewport>
          </Select.Content>
        </Select>
      )}
    </XStack>
  )
}
