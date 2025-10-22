// components/sorteos/SorteoEvaluateModal.tsx
import React, { useMemo, useState } from 'react'
import {
  YStack,
  XStack,
  Card,
  Text,
  Input,
  Button,
  Spinner,
  Separator,
  Select,
  Sheet,
} from 'tamagui'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/useToast'
import { SorteosApi } from '@/lib/api.sorteos'
import { MultipliersApi } from '@/lib/api.multipliers'
import type { Sorteo } from '@/types/models.types'
import { Check, ChevronDown } from '@tamagui/lucide-icons'

type Props = {
  sorteoId: string
  onClose: () => void
  onSuccess?: (updated?: Sorteo) => void
}

export default function SorteoEvaluateModal({ sorteoId, onClose, onSuccess }: Props) {
  const qc = useQueryClient()
  const toast = useToast()

  // Trae el sorteo para obtener loteriaId
  const { data: sorteo, isLoading: loadingSorteo } = useQuery({
    queryKey: ['sorteos', sorteoId],
    queryFn: () => SorteosApi.get(sorteoId),
    staleTime: 30_000,
  })
  const loteriaId = (sorteo as any)?.loteriaId as string | undefined

  // Multiplicadores tipo REVENTADO de esa lotería (solo activos los filtramos en front)
  const {
    data: multResp,
    isLoading: loadingMult,
    isError: multError,
  } = useQuery({
    enabled: !!loteriaId,
    queryKey: ['multipliers', 'select', { loteriaId, kind: 'REVENTADO' }],
    queryFn: () => MultipliersApi.list({ loteriaId, kind: 'REVENTADO' }),
    staleTime: 60_000,
  })

  const multipliers = useMemo(() => {
    const payload = multResp as any
    const base = Array.isArray(payload) ? payload : (payload?.data ?? [])
    return (base ?? []).filter((m: any) => (m?.isActive ?? true) === true)
  }, [multResp])

  // ❗️Deshabilita el select cuando no hay lotería, está cargando o dio error
  const isMultiplierDisabled = !loteriaId || loadingMult || !!multError

  const [values, setValues] = useState<{
    winningNumber: string
    extraMultiplierId: string | null
    extraOutcomeCode: string | null
  }>({
    winningNumber: '',
    extraMultiplierId: null,
    extraOutcomeCode: null,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const setField = <K extends keyof typeof values>(k: K, v: (typeof values)[K]) =>
    setValues((s) => ({ ...s, [k]: v }))

  const mEvaluate = useMutation({
    mutationFn: () =>
      SorteosApi.evaluate(sorteoId, {
        winningNumber: values.winningNumber.trim(),
        extraMultiplierId: values.extraMultiplierId || null,
        extraOutcomeCode: values.extraOutcomeCode || null,
      }),
    onSuccess: (updated: Sorteo) => {
      qc.invalidateQueries({ queryKey: ['sorteos'] })
      qc.setQueryData(['sorteos', sorteoId], updated)
      toast.success('Sorteo evaluado')
      onSuccess?.(updated)
    },
    onError: (e: any) => toast.error(e?.message || 'No fue posible evaluar'),
  })

  const handleEvaluate = () => {
    setErrors({})
    const nn = values.winningNumber.trim()
    if (!nn) return setErrors({ winningNumber: 'Requerido' })
    if (!/^\d{2}$/.test(nn)) return setErrors({ winningNumber: 'Debe ser 2 dígitos (00–99)' })
    mEvaluate.mutate()
  }

  const isBusy = mEvaluate.isPending || loadingSorteo

  return (
    <Card elevate padding="$4" bg="$background" borderColor="$borderColor" borderWidth={1}>
      <YStack gap="$3">
        <Text fontSize="$6" fontWeight="700">Evaluar sorteo</Text>

        {/* Fila compacta con wrap: número, select multiplicador y etiqueta */}
        <XStack gap="$3" fw="wrap" ai="flex-end">
          {/* Número ganador */}
          <YStack gap="$1" minWidth={140} flexShrink={0}>
            <Text fontWeight="600">Número ganador *</Text>
            <Input
              placeholder="00–99"
              keyboardType="number-pad"
              maxLength={2}
              value={values.winningNumber}
              onChangeText={(t) =>
                setField('winningNumber', t.replace(/[^0-9]/g, '').slice(0, 2))
              }
              autoCapitalize="none"
            />
            {!!errors.winningNumber && <Text color="$error">{errors.winningNumber}</Text>}
          </YStack>

          {/* Multiplicador extra (REVENTADO) */}
          <YStack gap="$1" minWidth={220} flexShrink={0}>
            <Text fontWeight="600">Multiplicador extra (opcional)</Text>
            <Select
              value={values.extraMultiplierId ?? ''}
              onValueChange={(v: string) => {
                if (isMultiplierDisabled) return
                setField('extraMultiplierId', v || null)
              }}
            >
              <Select.Trigger
                width={220}
                iconAfter={ChevronDown}
                br="$3"
                bw={1}
                bc="$borderColor"
                bg="$background"
                hoverStyle={{ bg: '$backgroundHover' }}
                disabled={isMultiplierDisabled}
                aria-disabled={isMultiplierDisabled}
              >
                <Select.Value
                  placeholder={loadingMult ? 'Cargando…' : 'REVENTADO (opcional)'}
                />
              </Select.Trigger>

              <Select.Adapt when="sm">
                <Sheet modal dismissOnSnapToBottom animation="quick">
                  <Sheet.Frame p="$4">
                    <Select.Adapt.Contents />
                  </Sheet.Frame>
                  <Sheet.Overlay />
                </Sheet>
              </Select.Adapt>

              <Select.Content zIndex={1000}>
                <Select.ScrollUpButton />
                <Select.Viewport>
                  <Select.Item value="" index={0}>
                    <Select.ItemText>Ninguno</Select.ItemText>
                    <Select.ItemIndicator ml="auto">
                      <Check size={16} />
                    </Select.ItemIndicator>
                  </Select.Item>
                  {multipliers.map((m: any, idx: number) => (
                    <Select.Item key={m.id} value={m.id} index={idx + 1}>
                      <Select.ItemText>{m.name} — X{m.valueX}</Select.ItemText>
                      <Select.ItemIndicator ml="auto">
                        <Check size={16} />
                      </Select.ItemIndicator>
                    </Select.Item>
                  ))}
                </Select.Viewport>
                <Select.ScrollDownButton />
              </Select.Content>
            </Select>
          </YStack>

          {/* Etiqueta extra (opcional) */}
          <YStack gap="$1" minWidth={220} flexShrink={0}>
            <Text fontWeight="600">Etiqueta extra (opcional)</Text>
            <Input
              placeholder="Ej. REVENTADO"
              value={values.extraOutcomeCode ?? ''}
              onChangeText={(t) => setField('extraOutcomeCode', t.trim() ? t : null)}
              autoCapitalize="characters"
            />
          </YStack>
        </XStack>

        {/* Leyenda debajo de los select */}
        <Text color="$textSecondary" fontSize="$2">
          Si aplica “reventado”, selecciona el multiplicador correspondiente.
        </Text>

        <Separator />

        <XStack gap="$2" jc="flex-end" fw="wrap">
          <Button
            onPress={onClose}
            bg="$background"
            borderColor="$borderColor"
            borderWidth={1}
            hoverStyle={{ bg: '$backgroundHover', scale: 1.02 }}
            pressStyle={{ scale: 0.98 }}
            disabled={isBusy}
          >
            <Text>Cancelar</Text>
          </Button>

        <Button onPress={handleEvaluate} disabled={isBusy} px="$4" minWidth={140}>
            {isBusy ? <Spinner size="small" /> : <Text>Evaluar</Text>}
          </Button>
        </XStack>
      </YStack>
    </Card>
  )
}
