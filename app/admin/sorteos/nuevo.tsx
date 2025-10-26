// app/admin/sorteos/nuevo.tsx
import React, { useMemo, useState, useEffect, useRef } from 'react'
import { YStack, XStack, Text, Spinner, Select, Sheet, Adapt, ScrollView, Separator } from 'tamagui'
import { Card, Input, Button } from '@/components/ui'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { ChevronDown } from '@tamagui/lucide-icons'
import { useToast } from '@/hooks/useToast'
import { SorteosApi } from '@/lib/api.sorteos'
import { LoteriasApi } from '@/lib/api.loterias'
import { goToList, safeBack } from '@/lib/navigation'
import { compact } from '@/utils/object'
import type { Loteria } from '@/types/models.types'
import { Platform } from 'react-native'

/** ─────────────── Utilidades fecha/hora (local ⇄ ISO) ─────────────── **/
function pad(n: number) { return String(n).padStart(2, '0') }

function splitLocalFromISO(iso?: string) {
  if (!iso) return { date: '', time: '' }
  const d = new Date(iso)
  if (isNaN(d.getTime())) return { date: '', time: '' }
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`
  return { date, time }
}

function joinLocalToISO(date: string, time: string) {
  if (!date) return ''
  const v = `${date}T${time || '00:00'}`
  const d = new Date(v) // interpreta en hora local
  if (isNaN(d.getTime())) return ''
  d.setSeconds(0, 0)
  return d.toISOString()
}

// dd/mm/YYYY hh:mm a.m./p.m. (desde ISO)
function formatLocalPretty(iso?: string) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  const dd = pad(d.getDate())
  const mm = pad(d.getMonth() + 1)
  const yyyy = d.getFullYear()
  let h = d.getHours()
  const ampm = h >= 12 ? 'p.m.' : 'a.m.'
  h = h % 12
  if (h === 0) h = 12
  const hh = String(h).padStart(2, '0')
  const min = pad(d.getMinutes())
  return `${dd}/${mm}/${yyyy} ${hh}:${min} ${ampm}`
}

/** ─────────────── Botones Fecha/Hora (web) con input oculto ─────────────── **/
function WebDateButton({
  value,
  onChange,
  placeholder = 'Seleccionar fecha',
}: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const ref = useRef<HTMLInputElement | null>(null)
  return (
    <YStack gap="$1" width={120}>
      <input
        ref={ref}
        type="date"
        value={value}
        onChange={(e) => onChange(e.currentTarget.value)}
        style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0, height: 0 }}
      />
      <Button
        height={36}
        px="$3"
        bg="$background"
        bw={1}
        bc="$borderColor"
        hoverStyle={{ bg: '$backgroundHover' }}
        onPress={() => {
          const el = ref.current
          // @ts-ignore
          if (el?.showPicker) el.showPicker(); else { el?.click(); el?.focus() }
        }}
      >
        <Text>Fecha</Text>
      </Button>
      <Text fontSize="$2" color="$textSecondary">{value || placeholder}</Text>
    </YStack>
  )
}

function WebTimeButton({
  value,
  onChange,
  placeholder = 'Seleccionar hora',
}: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const ref = useRef<HTMLInputElement | null>(null)
  const [local, setLocal] = useState(value)
  useEffect(() => { setLocal(value) }, [value])

  return (
    <YStack gap="$1" width={120}>
      <input
        ref={ref}
        type="time"
        step={60}
        value={local}
        onChange={(e) => {
          const raw = e.currentTarget.value // "HH:MM"
          setLocal(raw)
          onChange(raw)
        }}
        style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0, height: 0 }}
      />
      <Button
        height={36}
        px="$3"
        bg="$background"
        bw={1}
        bc="$borderColor"
        hoverStyle={{ bg: '$backgroundHover' }}
        onPress={() => {
          const el = ref.current
          // @ts-ignore
          if (el?.showPicker) el.showPicker(); else { el?.click(); el?.focus() }
        }}
      >
        <Text>Hora</Text>
      </Button>
      <Text fontSize="$2" color="$textSecondary">{local || placeholder}</Text>
    </YStack>
  )
}

export default function NuevoSorteoScreen() {
  const router = useRouter()
  const toast = useToast()
  const qc = useQueryClient()

  const { data: lotResp, isLoading: loadingLoterias, isError: lotError, refetch: refetchLoterias } = useQuery({
    queryKey: ['loterias', 'list', { page: 1, pageSize: 100 }],
    queryFn: () => LoteriasApi.list({ page: 1, pageSize: 100 }),
    staleTime: 60_000,
  })
  const loterias = useMemo<Loteria[]>(() => lotResp?.data ?? [], [lotResp])

  const [values, setValues] = useState({
    name: '',
    loteriaId: '',
    scheduledAt: '', // ISO (UTC) que se enviará al BE
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Estados locales separados (fecha / hora)
  const init = splitLocalFromISO(values.scheduledAt)
  const [dateLocal, setDateLocal] = useState(init.date)
  const [timeLocal, setTimeLocal] = useState(init.time)

  useEffect(() => {
    const { date, time } = splitLocalFromISO(values.scheduledAt)
    setDateLocal(date)
    setTimeLocal(time)
  }, [values.scheduledAt])

  const setField = <K extends keyof typeof values>(k: K, v: (typeof values)[K]) =>
    setValues((s) => ({ ...s, [k]: v }))

  const updateISOFromLocal = (date: string, time: string) => {
    setValues(s => ({ ...s, scheduledAt: joinLocalToISO(date, time) }))
  }

  const mCreate = useMutation({
    mutationFn: () => {
      const body = compact({
        name: values.name.trim(),
        loteriaId: values.loteriaId,
        scheduledAt: values.scheduledAt,
      })
      return SorteosApi.create(body as any)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sorteos'] })
      toast.success('Sorteo creado')
      goToList('/admin/sorteos')
    },
    onError: (e: any) => toast.error(e?.message || 'No fue posible crear'),
  })

  const handleSave = () => {
    setErrors({})
    if (!values.name.trim()) { setErrors(e => ({ ...e, name: 'Requerido' })); return }
    if (!values.loteriaId) { setErrors(e => ({ ...e, loteriaId: 'Selecciona una lotería' })); return }
    if (!values.scheduledAt) { setErrors(e => ({ ...e, scheduledAt: 'Fecha/hora requerida' })); return }
    mCreate.mutate()
  }

  // Native pickers (solo si no es web)
  const DateTimePicker = Platform.OS !== 'web'
    ? require('@react-native-community/datetimepicker').default
    : null
  const [openDate, setOpenDate] = useState(false)
  const [openTime, setOpenTime] = useState(false)

  const now = new Date()
  const nativeCurrent = useMemo(() => {
    const d = values.scheduledAt ? new Date(values.scheduledAt) : now
    return isNaN(d.getTime()) ? now : d
  }, [values.scheduledAt])

  return (
    <ScrollView flex={1} backgroundColor="$background">
      <YStack padding="$4" gap="$4" maxWidth={1200} alignSelf="center" width="100%">

        {/* Header */}
        <XStack jc="space-between" ai="center" gap="$3" flexWrap="wrap">
          <Text fontSize="$8" fontWeight="bold">Nuevo Sorteo</Text>
          {loadingLoterias && <Spinner size="small" />}
        </XStack>

        <Card padding="$4" bg="$backgroundHover" borderColor="$borderColor" borderWidth={1}>
          <YStack gap="$4">

            {/* ─────────────── Fila 1: Nombre + Lotería ─────────────── */}
            <XStack gap="$3" fw="wrap" ai="flex-start" jc="space-between">
              {/* Nombre */}
              <YStack gap="$1" flex={1} minWidth={260} maxWidth={360}>
                <Text fontWeight="600">Nombre *</Text>
                <Input
                  width="100%"
                  value={values.name}
                  onChangeText={(t) => setField('name', t)}
                  placeholder="Nombre del sorteo"
                />
                {!!errors.name && <Text color="$error">{errors.name}</Text>}
              </YStack>

              {/* Lotería */}
              <YStack gap="$1" flex={1} minWidth={260} maxWidth={360}>
                <Text fontWeight="600">Lotería *</Text>
                <Select
                  value={values.loteriaId}
                  onValueChange={(v) => setField('loteriaId', v)}
                >
                  <Select.Trigger
                    width="100%"
                    bw={1}
                    bc="$borderColor"
                    bg="$background"
                    px="$3"
                    iconAfter={ChevronDown}
                    disabled={!!loadingLoterias || !!lotError}
                  >
                    <Select.Value
                      placeholder={
                        loadingLoterias
                          ? 'Cargando…'
                          : lotError
                            ? 'Error — reintentar'
                            : (loterias.length ? 'Selecciona lotería' : 'Sin loterías')
                      }
                    />
                  </Select.Trigger>

                  <Adapt when="sm">
                    <Sheet modal snapPoints={[50]} dismissOnSnapToBottom>
                      <Sheet.Frame ai="center" jc="center">
                        <Adapt.Contents />
                      </Sheet.Frame>
                      <Sheet.Overlay />
                    </Sheet>
                  </Adapt>

                  <Select.Content zIndex={1_000_000}>
                    <Select.ScrollUpButton />
                    <Select.Viewport>
                      {loterias.map((l, i) => (
                        <Select.Item key={l.id} index={i} value={l.id}>
                          <Select.ItemText>{l.name}</Select.ItemText>
                        </Select.Item>
                      ))}
                    </Select.Viewport>
                    <Select.ScrollDownButton />
                  </Select.Content>
                </Select>

                {!!lotError && (
                  <XStack gap="$2" ai="center" mt="$2">
                    <Button size="$2" onPress={() => refetchLoterias()}><Text>Reintentar</Text></Button>
                  </XStack>
                )}
                {!!errors.loteriaId && <Text color="$error">{errors.loteriaId}</Text>}
              </YStack>
            </XStack>

            <Separator />

            {/* ───── Fila 2: Programado para (Fecha + Hora con botones) ───── */}
            <YStack gap="$2">
              <Text fontWeight="600">Programado para *</Text>

              {Platform.OS === 'web' ? (
                <XStack gap="$4" ai="flex-start" fw="wrap" jc="flex-start">
                  <WebDateButton
                    value={dateLocal}
                    onChange={(d) => { setDateLocal(d); updateISOFromLocal(d, timeLocal) }}
                  />
                  <WebTimeButton
                    value={timeLocal}
                    onChange={(t) => { setTimeLocal(t); updateISOFromLocal(dateLocal, t) }}
                  />
                </XStack>
              ) : (
                <>
                  <XStack gap="$4" ai="flex-start" fw="wrap" jc="flex-start">
                    {/* Fecha (nativo) */}
                    <YStack gap="$1" width={120}>
                      <Button
                        height={36}
                        px="$3"
                        onPress={() => setOpenDate(true)}
                        bg="$background"
                        bw={1}
                        bc="$borderColor"
                        hoverStyle={{ bg: '$backgroundHover' }}
                      >
                        <Text>Fecha</Text>
                      </Button>
                      <Text fontSize="$2" color="$textSecondary">{dateLocal || 'Seleccionar fecha'}</Text>
                    </YStack>

                    {/* Hora (nativo) */}
                    <YStack gap="$1" width={120}>
                      <Button
                        height={36}
                        px="$3"
                        onPress={() => setOpenTime(true)}
                        bg="$background"
                        bw={1}
                        bc="$borderColor"
                        hoverStyle={{ bg: '$backgroundHover' }}
                      >
                        <Text>Hora</Text>
                      </Button>
                      <Text fontSize="$2" color="$textSecondary">{timeLocal || 'Seleccionar hora'}</Text>
                    </YStack>
                  </XStack>

                  {DateTimePicker && openDate && (
                    <DateTimePicker
                      value={nativeCurrent}
                      mode="date"
                      display="default"
                      onChange={(_e: any, selected?: Date) => {
                        setOpenDate(false)
                        if (!selected) return
                        const d = `${selected.getFullYear()}-${pad(selected.getMonth() + 1)}-${pad(selected.getDate())}`
                        setDateLocal(d); updateISOFromLocal(d, timeLocal)
                      }}
                    />
                  )}

                  {DateTimePicker && openTime && (
                    <DateTimePicker
                      value={nativeCurrent}
                      mode="time"
                      is24Hour
                      display="default"
                      onChange={(_e: any, selected?: Date) => {
                        setOpenTime(false)
                        if (!selected) return
                        const t = `${pad(selected.getHours())}:${pad(selected.getMinutes())}`
                        setTimeLocal(t); updateISOFromLocal(dateLocal, t)
                      }}
                    />
                  )}
                </>
              )}

              {/* Mostrar selección en local y con formato solicitado */}
              <Text fontSize="$2" color="$textSecondary">
                Fecha seleccionada: {formatLocalPretty(values.scheduledAt)}
              </Text>
              {!!errors.scheduledAt && <Text color="$error">{errors.scheduledAt}</Text>}
            </YStack>
          </YStack>
        </Card>

        {/* Acciones */}
        <XStack gap="$3" jc="flex-end" flexWrap="wrap">
          <Button
            minWidth={120}
            px="$4"
            onPress={() => safeBack('/admin/sorteos')}
            backgroundColor="$gray4"
            borderColor="$gray8"
            borderWidth={1}
            hoverStyle={{ scale: 1.02 }}
            pressStyle={{ scale: 0.98 }}
          >
            <Text>Cancelar</Text>
          </Button>

          <Button
            minWidth={120}
            px="$4"
            onPress={handleSave}
            disabled={mCreate.isPending}
            bg="$blue4"
            borderColor="$blue8"
            borderWidth={1}
          >
            {mCreate.isPending ? <Spinner size="small" /> : <Text>Guardar</Text>}
          </Button>
        </XStack>
      </YStack>
    </ScrollView>
  )
}
