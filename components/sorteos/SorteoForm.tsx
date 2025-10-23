// components/sorteos/SorteoForm.tsx
import React, { useMemo, useState, useEffect, useCallback } from 'react'
import {
  YStack, XStack, Text, Card, Input, Button, Spinner, Select, Sheet, Adapt
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
  // ISO local con offset: YYYY-MM-DDTHH:mm:ss+HH:MM
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${sign}${tzH}:${tzM}`
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

/* --------------------------- Inputs web (nativos) -------------------------- */

function WebDateInput({
  value,
  onChange,
  placeholder,
  width = 160,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  width?: number
}) {
  return (
    <XStack
      position="relative"
      borderWidth={1}
      borderColor="$borderColor"
      borderRadius="$3"
      backgroundColor="$background"
      width={width}
      height={36}
      hoverStyle={{ backgroundColor: '$backgroundHover' }}
    >
      <input
        type="date"
        value={value}
        onChange={(e) => onChange((e.target as HTMLInputElement).value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          height: '100%',
          padding: '0 12px',
          border: 'none',
          background: 'transparent',
          color: 'inherit',
          outline: 'none',
          WebkitAppearance: 'none',
        }}
      />
    </XStack>
  )
}

function WebTimeInput({
  value,
  onChange,
  placeholder,
  width = 110,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  width?: number
}) {
  return (
    <XStack
      position="relative"
      borderWidth={1}
      borderColor="$borderColor"
      borderRadius="$3"
      backgroundColor="$background"
      width={width}
      height={36}
      hoverStyle={{ backgroundColor: '$backgroundHover' }}
    >
      <input
        type="time"
        step={60}
        value={value}
        onChange={(e) => onChange((e.target as HTMLInputElement).value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          height: '100%',
          padding: '0 12px',
          border: 'none',
          background: 'transparent',
          color: 'inherit',
          outline: 'none',
          WebkitAppearance: 'none',
        }}
      />
    </XStack>
  )
}

/* --------------------- Selector de fecha/hora (cross-plat) -------------------- */

function ScheduleFields({
  label,
  isoValue,
  onChange,
  error,
}: {
  label: string
  isoValue: string
  onChange: (iso: string) => void
  error?: string
}) {
  const local = toLocalInputValue(isoValue)
  const { date, time } = splitLocalDateTime(local)

  // WEB: dos inputs separados
  if (Platform.OS === 'web') {
    return (
      <YStack gap="$2" minWidth={260} flexGrow={1} flexShrink={0}>
        <Text fontWeight="600">{label}</Text>
        <XStack gap="$3" ai="center" fw="wrap">
          <WebDateInput
            value={date}
            onChange={(newDate) => onChange(joinLocalDateTime(newDate, time))}
            placeholder="YYYY-MM-DD"
          />
          <WebTimeInput
            value={time}
            onChange={(newTime) => onChange(joinLocalDateTime(date, newTime))}
            placeholder="HH:MM"
          />
          <Button
            size="$2"
            height={36}
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
        {!!error && <Text color="$error">{error}</Text>}
        <Text color="$textSecondary" fontSize="$2">Se guarda con tu zona horaria local.</Text>
      </YStack>
    )
  }

  // NATIVE: dos pickers (date y time) invocados con botones
  const DateTimePicker = require('@react-native-community/datetimepicker').default
  const [openDate, setOpenDate] = useState(false)
  const [openTime, setOpenTime] = useState(false)

  const current = useMemo(() => {
    const d = local ? new Date(local) : new Date()
    return isNaN(d.getTime()) ? new Date() : d
  }, [local])

  return (
    <YStack gap="$2" minWidth={260} flexGrow={1} flexShrink={0}>
      <Text fontWeight="600">{label}</Text>
      <XStack gap="$3" ai="center" fw="wrap">
        <Input
          width={160}
          height={36}
          value={date}
          editable={false}
          placeholder="YYYY-MM-DD"
        />
        <Button
          height={36}
          onPress={() => setOpenDate(true)}
          bg="$background"
          bw={1}
          bc="$borderColor"
          hoverStyle={{ bg: '$backgroundHover' }}
        >
          <Text>Elegir fecha</Text>
        </Button>

        <Input
          width={110}
          height={36}
          value={time}
          editable={false}
          placeholder="HH:MM"
        />
        <Button
          height={36}
          onPress={() => setOpenTime(true)}
          bg="$background"
          bw={1}
          bc="$borderColor"
          hoverStyle={{ bg: '$backgroundHover' }}
        >
          <Text>Elegir hora</Text>
        </Button>

        <Button
          size="$2"
          height={36}
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

      {!!error && <Text color="$error">{error}</Text>}
      <Text color="$textSecondary" fontSize="$2">Se guardará con tu zona horaria local.</Text>

      {openDate && (
        <DateTimePicker
          value={current}
          mode="date"
          display="default"
          onChange={(_e: any, selected?: Date) => {
            setOpenDate(false)
            if (!selected) return
            const y = selected.getFullYear()
            const m = pad(selected.getMonth() + 1)
            const d = pad(selected.getDate())
            onChange(joinLocalDateTime(`${y}-${m}-${d}`, time))
          }}
        />
      )}

      {openTime && (
        <DateTimePicker
          value={current}
          mode="time"
          is24Hour
          display="default"
          onChange={(_e: any, selected?: Date) => {
            setOpenTime(false)
            if (!selected) return
            const hh = pad(selected.getHours())
            const mm = pad(selected.getMinutes())
            onChange(joinLocalDateTime(date || toLocalInputValue(new Date().toISOString()).split('T')[0], `${hh}:${mm}`))
          }}
        />
      )}
    </YStack>
  )
}

/* --------------------------------- Schema/UI --------------------------------- */

const schema = z.object({
  name: z.string().trim().min(1, 'Nombre requerido').max(100, 'Máximo 100'),
  loteriaId: z.string().uuid('Lotería inválida'),
  scheduledAt: z.string().trim().min(10, 'Fecha/hora requerida'),
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

        {/* Fila 2: Programado para (Fecha + Hora) */}
        <XStack gap="$3" fw="wrap" ai="flex-start">
          <ScheduleFields
            label="Programado para *"
            isoValue={values.scheduledAt}
            onChange={(iso) => setField('scheduledAt', iso)}
            error={errors.scheduledAt}
          />
          {/* Si decides reactivar el multiplicador, queda tu bloque comentado aquí */}
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
              height={36}
              px="$4"
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
            height={36}
            px="$4"
          >
            {submitting ? <Spinner size="small" /> : <Text>Guardar</Text>}
          </Button>
        </XStack>
      </YStack>
    </Card>
  )
}
