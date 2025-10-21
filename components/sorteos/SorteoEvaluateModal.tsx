// components/sorteos/SorteoEvaluateModal.tsx
import React, { useState } from 'react'
import { YStack, XStack, Card, Text, Input, Button, Spinner, Separator } from 'tamagui'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/useToast'
import { SorteosApi } from '@/lib/api.sorteos'
import type { Sorteo } from '@/types/models.types'

type Props = {
  sorteoId: string
  onClose: () => void
  /** Permite recibir el sorteo ya evaluado (opcional) */
  onSuccess?: (updated?: Sorteo) => void
}

export default function SorteoEvaluateModal({ sorteoId, onClose, onSuccess }: Props) {
  const qc = useQueryClient()
  const toast = useToast()

  const [values, setValues] = useState<{
    winningNumber: string
    extraMultiplierId?: string | null
    extraOutcomeCode?: string | null
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
      // Invalida lista y detalle
      qc.invalidateQueries({ queryKey: ['sorteos'] })
      qc.setQueryData(['sorteos', sorteoId], updated)
      toast.success('Sorteo evaluado')
      onSuccess?.(updated) // 👈 aquí pasamos el sorteo actualizado
    },
    onError: (e: any) => toast.error(e?.message || 'No fue posible evaluar'),
  })

  const handleEvaluate = () => {
    setErrors({})
    const nn = values.winningNumber.trim()
    if (!nn) {
      setErrors((e) => ({ ...e, winningNumber: 'Requerido' }))
      return
    }
    if (!/^\d{2}$/.test(nn)) {
      setErrors((e) => ({ ...e, winningNumber: 'Debe ser 2 dígitos (00–99)' }))
      return
    }
    mEvaluate.mutate()
  }

  return (
    <Card
      elevate
      padding="$4"
      bg="$background"
      borderColor="$borderColor"
      borderWidth={1}
    >
      <YStack gap="$3">
        <Text fontSize="$6" fontWeight="700">Evaluar sorteo</Text>

        <YStack gap="$1">
          <Text fontWeight="600">Número ganador *</Text>
          <Input
            placeholder="00–99"
            keyboardType="number-pad"
            maxLength={2}
            value={values.winningNumber}
            onChangeText={(t) => setField('winningNumber', t.replace(/[^0-9]/g, '').slice(0, 2))}
            autoCapitalize="none"
          />
          {!!errors.winningNumber && <Text color="$error">{errors.winningNumber}</Text>}
        </YStack>

        <YStack gap="$1">
          <Text fontWeight="600">Multiplicador extra (opcional)</Text>
          <Input
            placeholder="extraMultiplierId"
            value={values.extraMultiplierId ?? ''}
            onChangeText={(t) => setField('extraMultiplierId', t.trim() ? t : null)}
            autoCapitalize="none"
          />
          <Text color="$textSecondary">Si aplica “reventado”, coloca el ID del multiplicador.</Text>
        </YStack>

        <YStack gap="$1">
          <Text fontWeight="600">Etiqueta extra (opcional)</Text>
          <Input
            placeholder="Etiqueta/nota (p. ej. REVENTADO)"
            value={values.extraOutcomeCode ?? ''}
            onChangeText={(t) => setField('extraOutcomeCode', t.trim() ? t : null)}
            autoCapitalize="characters"
          />
        </YStack>

        <Separator />

        <XStack gap="$2" jc="flex-end" fw="wrap">
          <Button
            onPress={onClose}
            bg="$background"
            borderColor="$borderColor"
            borderWidth={1}
            hoverStyle={{ bg: '$backgroundHover', scale: 1.02 }}
            pressStyle={{ scale: 0.98 }}
          >
            <Text>Cancelar</Text>
          </Button>

          <Button onPress={handleEvaluate} disabled={mEvaluate.isPending} px="$4" minWidth={140}>
            {mEvaluate.isPending ? <Spinner size="small" /> : <Text>Evaluar</Text>}
          </Button>
        </XStack>
      </YStack>
    </Card>
  )
}
