// components/sorteos/SorteoForm.tsx
import React, { useMemo, useState, useEffect, useCallback } from 'react'
import {
  YStack, XStack, Text, Card, Input, Button, Spinner, Select, Sheet, Adapt, styled
} from 'tamagui'
import { z } from 'zod'
import { ChevronDown, Check } from '@tamagui/lucide-icons'
import { useToast } from '@/hooks/useToast'
import { isDirty as isDirtyUtil } from '@/utils/forms/dirty'
import { useQuery } from '@tanstack/react-query'
import { MultipliersApi } from '@/lib/api.multipliers'
import type { Loteria, Sorteo } from '@/types/models.types'
import { Platform } from 'react-native'

/* ----------------------------- Utils de fecha ----------------------------- */

function pad(n: number) { return String(n).padStart(2, '0') }

function formatWithOffset(d: Date): string {
  const year = d.getFullYear()
  const month = pad(d.getMonth() + 1)
  const day = pad(d.getDate())
  const hours = pad(d.getHours())
  const minutes = pad(d.getMinutes())
  const seconds = pad(d.getSeconds())
  const tzOffsetMin = -d.getTimezoneOffset()
  const sign = tzOffsetMin >= 0 ? '+' : '-'
  const abs = Math.abs(tzOffsetMin)
  const tzH = pad(Math.floor(abs / 60))
  const tzM = pad(abs % 60)
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${sign}:${tzM === '00' ? tzH : tzH}:${tzM}`.replace('::', ':')
}

function toLocalInputValue(iso?: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const year = d.getFullYear()
  const month = pad(d.getMonth() + 1)
  const day = pad(d.getDate())
  const hours = pad(d.getHours())
  const minutes = pad(d.getMinutes())
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

function fromLocalInputValue(v: string): string {
  const d = new Date(v) // local time
  if (isNaN(d.getTime())) return ''
  d.setSeconds(0, 0)
  return formatWithOffset(d)
}

function splitLocalDateTime(local: string) {
  if (!local) return { date: '', time: '' }
  const [date, time] = local.split('T')
  return { date: date ?? '', time: time ?? '' }
}

function joinLocalDateTime(date: string, time: string) {
  if (!date) return ''
  return fromLocalInputValue(`${date}T${(time || '00:00')}`)
}


/* ----------------------------- Inputs web nativos ----------------------------- */

function DateTimeLocalInput(props: any) {
  return (
    <XStack
      position="relative"
      borderWidth={1}
      borderColor="$borderColor"
      borderRadius="$3"
      backgroundColor="$background"
      width={260}
      hoverStyle={{ backgroundColor: '$backgroundHover' }}
    >
      <input
        style={{
          width: '100%',
          height: '100%',
          padding: '10px',
          paddingLeft: '12px',
          paddingRight: '12px',
          border: 'none',
          background: 'transparent',
          color: 'inherit',
          outline: 'none',
          // Este filtro puede cambiar el color del icono en algunos navegadores
          colorScheme: 'dark', // Intentar modo oscuro para el icono
          // Otra opción es usar webkit appearance
          WebkitAppearance: 'none',
        }}
        {...props}
      />
    </XStack>
  );
}

const DateInput = styled(Input, {
  name: 'DateInput',
  bw: 1,
  bc: '$borderColor',
  br: '$3',
  bg: '$background',
  color: '$color',
  px: '$3',
  py: 10,
  width: 160,
  hoverStyle: { bg: '$backgroundHover' },
  focusStyle: { outlineWidth: 2, outlineStyle: 'solid', outlineColor: '$outlineColor' },
})

const TimeInput = styled(Input, {
  name: 'TimeInput',
  bw: 1,
  bc: '$borderColor',
  br: '$3',
  bg: '$background',
  color: '$color',
  px: '$3',
  py: 10,
  width: 110,
  hoverStyle: { bg: '$backgroundHover' },
  focusStyle: { outlineWidth: 2, outlineStyle: 'solid', outlineColor: '$outlineColor' },
})

/* ------------------------- DateTime Field (cross-plat) ------------------------- */

function DateTimeField({
  label,
  value,             // ISO con offset
  onChange,
  error,
  minWidth = 260,
}: {
  label: string
  value?: string
  onChange: (isoWithOffset: string) => void
  error?: string
  minWidth?: number
}) {
  const [open, setOpen] = useState(false)

  if (Platform.OS === 'web') {
    // Detecta soporte de datetime-local (Safari lo degrada a 'text')
    const supportsDateTimeLocal = React.useMemo(() => {
      try {
        const i = document.createElement('input')
        i.setAttribute('type', 'datetime-local')
        return i.type === 'datetime-local'
      } catch { return false }
    }, [])

    const local = toLocalInputValue(value)
    const { date, time } = splitLocalDateTime(local)

    return (
      <YStack gap="$2" minWidth={minWidth} flexShrink={0} flexGrow={1}>
        <Text fontWeight="600">{label}</Text>

        {supportsDateTimeLocal ? (
          // ✅ Camino con picker nativo si está soportado (Chrome/Edge)
          <XStack gap="$2" ai="center" fw="wrap">
            <DateTimeLocalInput
              type="datetime-local"
              step={60}
              value={toLocalInputValue(value)}
              onChange={(e: any) => {
                const raw = e?.target?.value as string
                const iso = raw ? fromLocalInputValue(raw) : ''
                onChange(iso)
              }}
            />
            <Button
              size="$2"
              onPress={() => onChange(formatWithOffset(new Date()))}
              bg="$gray4"
              borderColor="$gray8"
              borderWidth={1}
              hoverStyle={{ bg: '$gray5', scale: 1.02 }}
              pressStyle={{ scale: 0.98 }}
            >
              <Text>Ahora</Text>
            </Button>
          </XStack>
        ) : (
          // 🔁 Fallback para Safari: date + time nativos (sí tienen picker)
          <XStack gap="$2" ai="center" fw="wrap">
            <DateInput
              type="date"
              value={date}
              onChange={(e: any) => {
                const newDate = e?.target?.value as string
                const iso = joinLocalDateTime(newDate, time)
                onChange(iso)
              }}
            />
            <TimeInput
              type="time"
              step={60}
              value={time}
              onChange={(e: any) => {
                const newTime = e?.target?.value as string
                const iso = joinLocalDateTime(date, newTime)
                onChange(iso)
              }}
            />
            <Button
              size="$2"
              onPress={() => onChange(formatWithOffset(new Date()))}
              bg="$gray4"
              borderColor="$gray8"
              borderWidth={1}
              hoverStyle={{ bg: '$gray5', scale: 1.02 }}
              pressStyle={{ scale: 0.98 }}
            >
              <Text>Ahora</Text>
            </Button>
          </XStack>
        )}

        {!!error && <Text color="$error">{error}</Text>}
        <Text color="$gray11" fontSize="$2">Se guarda con tu zona horaria local.</Text>
      </YStack>
    )
  }

  // Nativo
  const DateTimePickerNative = require('@react-native-community/datetimepicker').default
  const initialDate = useMemo(() => {
    const d = value ? new Date(value) : new Date()
    return isNaN(d.getTime()) ? new Date() : d
  }, [value])

  return (
    <YStack gap="$2" minWidth={minWidth} flexShrink={0} flexGrow={1}>
      <Text fontWeight="600">{label}</Text>
      <XStack gap="$2" fw="wrap" ai="center">
        <Input
          value={toLocalInputValue(value)}
          editable={false}
          placeholder="Selecciona fecha y hora"
          width={220}
        />
        <Button
          onPress={() => setOpen(true)}
          bg="$blue4"
          borderColor="$blue8"
          hoverStyle={{ bg: '$blue5', scale: 1.02 }}
          pressStyle={{ scale: 0.98 }}
        >
          <Text>Elegir</Text>
        </Button>
      </XStack>
      {!!error && <Text color="$error">{error}</Text>}
      <Text color="$gray11" fontSize="$2">Se guardará con tu zona horaria local.</Text>

      <Sheet open={open} onOpenChange={setOpen} snapPoints={[50]} modal dismissOnSnapToBottom animation="quick">
        <Sheet.Frame p="$4" gap="$3">
          <Text fontWeight="700" fontSize="$6">Selecciona fecha y hora</Text>
          <DateTimePickerNative
            value={initialDate}
            mode="datetime"
            display="spinner"
            onChange={(ev: any, selected?: Date) => {
              if (!selected) return
              onChange(formatWithOffset(selected))
            }}
          />
          <XStack jc="flex-end" gap="$2">
            <Button onPress={() => setOpen(false)} bg="$background" borderColor="$borderColor" borderWidth={1}>
              <Text>Cerrar</Text>
            </Button>
          </XStack>
        </Sheet.Frame>
        <Sheet.Overlay />
      </Sheet>
    </YStack>
  )
}

/* --------------------------------- Schema/UI --------------------------------- */

const schema = z.object({
  name: z.string().trim().min(1, 'Nombre requerido').max(100, 'Máximo 100'),
  loteriaId: z.string().uuid('Lotería inválida'),
  scheduledAt: z.string().trim().min(10, 'Fecha/hora requerida'),
  extraMultiplierId: z.string().uuid().optional().or(z.literal('').transform(() => undefined)),
  extraOutcomeCode: z.string().trim().max(20).optional().or(z.literal('').transform(() => undefined)),
})
export type SorteoFormValues = z.infer<typeof schema>

type Props = {
  mode: 'create' | 'edit'
  initial?: Partial<Sorteo> | null
  loterias: Pick<Loteria, 'id' | 'name'>[]
  submitting?: boolean
  onSubmit: (v: SorteoFormValues) => Promise<void> | void
  onCancel?: () => void
}

export default function SorteoForm({ mode, initial, loterias, submitting, onSubmit, onCancel }: Props) {
  const toast = useToast()
  const isEdit = mode === 'edit'

  const initialUI = useMemo(() => ({
    name: initial?.name ?? '',
    loteriaId: initial?.loteriaId ?? (loterias[0]?.id ?? ''),
    scheduledAt: initial?.scheduledAt ?? '',
    extraMultiplierId: initial?.extraMultiplierId ?? '',
    extraOutcomeCode: initial?.extraOutcomeCode ?? '',
  }), [initial, loterias])

  const [values, setValues] = useState(initialUI)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => { setValues(initialUI); setErrors({}) }, [initialUI])

  const setField = useCallback(<K extends keyof typeof values>(k: K, v: (typeof values)[K]) => {
    setValues(prev => ({ ...prev, [k]: v }))
  }, [])

  // Multiplicadores REVENTADO de la lotería seleccionada
  const { data: multResp, isLoading: loadingMult, isError: multError } = useQuery({
    enabled: !!values.loteriaId,
    queryKey: ['multipliers', 'by-loteria', { loteriaId: values.loteriaId, kind: 'REVENTADO' }],
    queryFn: () => MultipliersApi.list({ loteriaId: values.loteriaId, kind: 'REVENTADO' }),
    staleTime: 60_000,
  })

  const multipliers = useMemo(() => {
    const payload = multResp as any
    const base = Array.isArray(payload) ? payload : (payload?.data ?? [])
    return (base ?? []).filter((m: any) => (m?.isActive ?? true) === true)
  }, [multResp])

  const isMultiplierDisabled = !values.loteriaId || loadingMult || !!multError

  const canSubmit = useMemo(() => {
    if (!values.name.trim()) return false
    if (!values.loteriaId) return false
    if (!values.scheduledAt.trim()) return false
    return true
  }, [values])

  const isDirty = useMemo(() => {
    if (!isEdit) return true
    return isDirtyUtil(values, initialUI, (v) => ({
      name: v.name.trim(),
      loteriaId: v.loteriaId,
      scheduledAt: v.scheduledAt.trim(),
      extraMultiplierId: v.extraMultiplierId || undefined,
      extraOutcomeCode: v.extraOutcomeCode || undefined,
    }))
  }, [values, initialUI, isEdit])

  const handleSubmit = async () => {
    setErrors({})
    const parsed = schema.safeParse(values)
    if (!parsed.success) {
      const e: Record<string, string> = {}
      parsed.error.issues.forEach(i => { const k = String(i.path[0]); e[k] = i.message })
      setErrors(e); toast.error('Revisa los campos'); return
    }
    if (isEdit && !isDirty) { toast.info('No hay cambios para guardar'); return }
    await onSubmit(parsed.data)
  }

  return (
    <Card padding="$4">
      <YStack gap="$4">
        {/* Fila 1: Nombre + Lotería */}
        <XStack gap="$3" fw="wrap" ai="flex-start">
          <YStack gap="$2" minWidth={260} flex={1}>
            <Text fontWeight="600">Nombre *</Text>
            <Input
              placeholder="Sorteo 7pm"
              value={values.name}
              onChangeText={(t) => setField('name', t)}
              focusStyle={{ outlineWidth: 2, outlineStyle: 'solid', outlineColor: '$outlineColor' }}
            />
            {!!errors.name && <Text color="$error">{errors.name}</Text>}
          </YStack>

          <YStack gap="$2" minWidth={260} flex={1}>
            <Text fontWeight="600">Lotería *</Text>
            <Select value={values.loteriaId} onValueChange={(v) => setField('loteriaId', v)}>
              <Select.Trigger bw={1} bc="$borderColor" px="$3" iconAfter={ChevronDown}>
                <Select.Value placeholder="Selecciona lotería" />
              </Select.Trigger>
              <Adapt when="sm">
                <Sheet modal snapPoints={[50]} dismissOnSnapToBottom>
                  <Sheet.Frame ai="center" jc="center"><Adapt.Contents /></Sheet.Frame>
                  <Sheet.Overlay />
                </Sheet>
              </Adapt>
              <Select.Content zIndex={1_000_000}>
                <Select.ScrollUpButton />
                <Select.Viewport>
                  {loterias.map((l, i) => (
                    <Select.Item key={l.id} index={i} value={l.id}>
                      <Select.ItemText>{l.name}</Select.ItemText>
                      <Select.ItemIndicator ml="auto"><Check size={16} /></Select.ItemIndicator>
                    </Select.Item>
                  ))}
                </Select.Viewport>
                <Select.ScrollDownButton />
              </Select.Content>
            </Select>
            {!!errors.loteriaId && <Text color="$error">{errors.loteriaId}</Text>}
          </YStack>
        </XStack>

        {/* Fila 2: Programado para + Multiplicador extra */}
        <XStack gap="$3" fw="wrap" ai="flex-start">
          <DateTimeField
            label="Programado para *"
            value={values.scheduledAt}
            onChange={(iso) => setField('scheduledAt', iso)}
            error={errors.scheduledAt}
            minWidth={260}
          />

          <YStack gap="$2" minWidth={260} flex={1}>
            <Text fontWeight="600">Multiplicador extra (opcional)</Text>
            <Select
              value={values.extraMultiplierId || ''}
              onValueChange={(v) => setField('extraMultiplierId', v || '')}
            >
              <Select.Trigger
                bw={1}
                bc="$borderColor"
                px="$3"
                iconAfter={ChevronDown}
                disabled={isMultiplierDisabled}
                aria-disabled={isMultiplierDisabled}
              >
                <Select.Value placeholder={loadingMult ? 'Cargando…' : 'REVENTADO (opcional)'} />
              </Select.Trigger>

              <Adapt when="sm">
                <Sheet modal snapPoints={[50]} dismissOnSnapToBottom>
                  <Sheet.Frame ai="center" jc="center"><Adapt.Contents /></Sheet.Frame>
                  <Sheet.Overlay />
                </Sheet>
              </Adapt>

              <Select.Content zIndex={1_000_000}>
                <Select.ScrollUpButton />
                <Select.Viewport>
                  <Select.Item value="" index={0}>
                    <Select.ItemText>Ninguno</Select.ItemText>
                    <Select.ItemIndicator ml="auto"><Check size={16} /></Select.ItemIndicator>
                  </Select.Item>
                  {multipliers.map((m: any, idx: number) => (
                    <Select.Item key={m.id} value={m.id} index={idx + 1}>
                      <Select.ItemText>{m.name} — X{m.valueX}</Select.ItemText>
                      <Select.ItemIndicator ml="auto"><Check size={16} /></Select.ItemIndicator>
                    </Select.Item>
                  ))}
                </Select.Viewport>
                <Select.ScrollDownButton />
              </Select.Content>
            </Select>
            <Text color="$textSecondary" fontSize="$2">
              Si aplica “reventado”, selecciona el multiplicador correspondiente.
            </Text>
          </YStack>
        </XStack>

        {/* Acciones */}
        <XStack jc="flex-end" gap="$2" fw="wrap">
          {onCancel && (
            <Button
              onPress={onCancel}
              disabled={!!submitting}
              bg="$gray4"
              borderColor="$gray8"
              borderWidth={1}
            >
              <Text>Cancelar</Text>
            </Button>
          )}
          <Button
            onPress={handleSubmit}
            disabled={!canSubmit || !!submitting}
            bg="$blue4"
            borderColor="$blue8"
            borderWidth={1}
          >
            {submitting ? <Spinner size="small" /> : <Text>Guardar</Text>}
          </Button>
        </XStack>
      </YStack>
    </Card>
  )
}
