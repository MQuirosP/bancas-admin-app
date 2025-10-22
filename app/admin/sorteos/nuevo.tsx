// app/admin/sorteos/nuevo.tsx
import React, { useMemo, useState } from 'react'
import {
  YStack, XStack, Text, Card, Input, Button, Spinner,
  Select, Sheet, Adapt, ScrollView, Separator
} from 'tamagui'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { ChevronDown } from '@tamagui/lucide-icons'
import { useToast } from '@/hooks/useToast'
import { SorteosApi } from '@/lib/api.sorteos'
import { LoteriasApi } from '@/lib/api.loterias'
import { goToList, safeBack } from '@/lib/navigation'
import { compact } from '@/utils/object'
import type { Loteria } from '@/types/models.types'

/** ─────────────────────── Utilidades tiempo (web) ─────────────────────── **/
function toLocalInputValue(d: Date | null) {
  // datetime-local espera "YYYY-MM-DDTHH:mm" en hora local
  if (!d) return ''
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 16)
}
function fromLocalInputValue(v: string): Date | null {
  // v en formato "YYYY-MM-DDTHH:mm" (local)
  if (!v) return null
  const d = new Date(v)
  return isNaN(d.getTime()) ? null : d
}
function toISO(d: Date | null) {
  return d ? d.toISOString() : ''
}

/** ─────────────── Picker web compacto: ocupa 100% de su columna ─────────────── **/
function DateTimeLocalCompact({
  value,
  onChange,
}: {
  value: string
  onChange: (nextLocal: string) => void
}) {
  return (
    <XStack
      borderWidth={1}
      borderColor="$borderColor"
      borderRadius="$3"
      backgroundColor="$background"
      hoverStyle={{ backgroundColor: '$backgroundHover' }}
      px="$3"
      py={10}
      width="100%"
    >
      <input
        type="datetime-local"
        value={value}
        onChange={(e) => onChange(e.currentTarget.value)}
        style={{
          width: '100%',
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

  // Estado de fecha (web) para el control visual; de aquí derivamos el ISO
  const [dateValue, setDateValue] = useState<Date | null>(null)

  const setField = <K extends keyof typeof values>(k: K, v: (typeof values)[K]) =>
    setValues((s) => ({ ...s, [k]: v }))

  const setDate = (d: Date | null) => {
    setDateValue(d)
    setField('scheduledAt', toISO(d))
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

    if (!values.name.trim()) {
      setErrors((e) => ({ ...e, name: 'Requerido' }))
      return
    }
    if (!values.loteriaId) {
      setErrors((e) => ({ ...e, loteriaId: 'Selecciona una lotería' }))
      return
    }
    if (!values.scheduledAt) {
      setErrors((e) => ({ ...e, scheduledAt: 'Fecha/hora requerida' }))
      return
    }

    mCreate.mutate()
  }

  return (
    <ScrollView flex={1} backgroundColor="$background">
      <YStack padding="$4" gap="$4" maxWidth={720} alignSelf="center" width="100%">
        {/* Header */}
        <XStack jc="space-between" ai="center" gap="$3" flexWrap="wrap">
          <Text fontSize="$8" fontWeight="bold">Nuevo Sorteo</Text>
          {loadingLoterias && <Spinner size="small" />}
        </XStack>

        <Card padding="$4" bg="$backgroundHover" borderColor="$borderColor" borderWidth={1}>
          <YStack gap="$4">
            {/* ─────────────── Fila 1: Nombre + Lotería ─────────────── */}
            <XStack gap="$3" fw="wrap" ai="flex-start" jc="space-between">
              {/* Columna: Nombre */}
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

              {/* Columna: Lotería */}
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

            {/* ───── Fila 2: Programado para + Botón (pegados, no a la derecha) ───── */}
            <YStack gap="$1">
              <Text fontWeight="600">Programado para *</Text>

              <XStack gap="$3" ai="center" fw="wrap" jc="flex-start">
                {/* Columna: Picker datetime */}
                <YStack flex={1} minWidth={260} maxWidth={360}>
                  <DateTimeLocalCompact
                    value={toLocalInputValue(dateValue)}
                    onChange={(rawLocal) => setDate(fromLocalInputValue(rawLocal))}
                  />
                </YStack>

                {/* Columna: Botón acción (ancho fijo y pegado al picker) */}
                <YStack width={160}>
                  <Button
                    width="100%"
                    onPress={() => {
                      const now = new Date()
                      setDate(now)
                    }}
                    bg="$background"
                    borderColor="$borderColor"
                    borderWidth={1}
                    hoverStyle={{ bg: '$backgroundHover' }}
                    pressStyle={{ bg: '$backgroundPress' }}
                  >
                    <Text>Usar ahora</Text>
                  </Button>
                </YStack>
              </XStack>

              {/* Mostrar lo que se enviará */}
              <Text fontSize="$2" color="$textSecondary">
                ISO a enviar: {values.scheduledAt || '—'}
              </Text>

              {!!errors.scheduledAt && <Text color="$error">{errors.scheduledAt}</Text>}
              <Text color="$textSecondary">Al guardar, se envía el valor en ISO (UTC).</Text>
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
            color="$background"
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
          >
            {mCreate.isPending ? <Spinner size="small" /> : <Text>Guardar</Text>}
          </Button>
        </XStack>
      </YStack>
    </ScrollView>
  )
}
