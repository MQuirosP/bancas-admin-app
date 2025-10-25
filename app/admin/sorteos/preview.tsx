// app/admin/sorteos/preview.tsx
import React, { useState, useMemo } from 'react'
import {
  YStack,
  XStack,
  Text,
  Button,
  Input,
  ScrollView,
  Spinner,
  Checkbox,
  Separator,
  Card,
} from 'tamagui'
import { ArrowLeft, Calendar, Check, CheckCircle2, RefreshCw } from '@tamagui/lucide-icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useLocalSearchParams } from 'expo-router'
import { apiClient } from '@/lib/api.client'
import { useToast } from '@/hooks/useToast'
import { useConfirm } from '@/components/ui/Confirm'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { safeBack } from '@/lib/navigation'

interface PreviewSorteo {
  name: string
  scheduledAt: string
  loteriaId?: string
}

interface PreviewResponse {
  success?: boolean
  data: PreviewSorteo[]
  meta?: {
    count: number
    from: string
    to: string
  }
}

interface SeedResponse {
  created: number
  skipped: number
  details?: {
    created: PreviewSorteo[]
    skipped: PreviewSorteo[]
  }
}

export default function PreviewSorteosScreen() {
  const { loteriaId, loteriaName } = useLocalSearchParams<{ loteriaId: string; loteriaName: string }>()
  const toast = useToast()
  const qc = useQueryClient()
  const { confirm, ConfirmRoot } = useConfirm()

  const [days, setDays] = useState('7')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Fetch preview
  const { data, isLoading, isFetching, refetch } = useQuery<PreviewResponse>({
    queryKey: ['sorteos', 'preview', loteriaId, days],
    queryFn: async () => {
      const res = await apiClient.get<PreviewResponse>(
        `/loterias/${loteriaId}/preview_schedule`,
        { days: Number(days) || 7, limit: 200 }
      )
      return res
    },
    enabled: !!loteriaId,
    staleTime: 0,
  })

  // Ordenar por scheduledAt (más pronto primero)
  const sortedOccurrences = useMemo(() => {
    if (!data?.data) return []
    return [...data.data].sort((a, b) => {
      return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
    })
  }, [data])

  // Mutation seed
  const mSeed = useMutation<SeedResponse, Error, string[]>({
    mutationFn: async (scheduledDates) => {
      const qs = apiClient.buildQueryString({ days: Number(days) || 7, limit: 200 })
      const res = await apiClient.post<SeedResponse>(
        `/loterias/${loteriaId}/seed_sorteos${qs}`,
        { scheduledDates }
      )
      return res
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ['sorteos'] })
      toast.success(`Sorteos creados: ${result.created}, Omitidos: ${result.skipped}`)
      setSelectedIds(new Set())
      safeBack('/admin/sorteos')
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Error al crear sorteos')
    },
  })

  const handleToggleAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(sortedOccurrences.map((_, idx) => String(idx))))
    } else {
      setSelectedIds(new Set())
    }
  }

  const handleToggle = (idx: number) => {
    const key = String(idx)
    const newSet = new Set(selectedIds)
    if (newSet.has(key)) {
      newSet.delete(key)
    } else {
      newSet.add(key)
    }
    setSelectedIds(newSet)
  }

  const handleSeed = async () => {
    const selected = sortedOccurrences.filter((_, idx) => selectedIds.has(String(idx)))
    if (selected.length === 0) {
      toast.error('Selecciona al menos un sorteo')
      return
    }

    const ok = await confirm({
      title: 'Confirmar creación de sorteos',
      description: `¿Crear ${selected.length} sorteo(s) para "${loteriaName}"?\n\nEsto creará sorteos en estado SCHEDULED.`,
      okText: `Crear ${selected.length} sorteo(s)`,
      cancelText: 'Cancelar',
    })

    if (ok) {
      const scheduledDates = selected.map((s) => s.scheduledAt)
      mSeed.mutate(scheduledDates)
    }
  }

  const allChecked = selectedIds.size === sortedOccurrences.length && sortedOccurrences.length > 0
  const someChecked = selectedIds.size > 0 && selectedIds.size < sortedOccurrences.length

  return (
    <ScrollView flex={1} backgroundColor="$background" contentContainerStyle={{ flexGrow: 1 }}>
      <YStack flex={1} padding="$4" gap="$4" maxWidth={1200} alignSelf="center" width="100%">
        {/* Header */}
        <XStack justifyContent="space-between" ai="center" gap="$3" flexWrap="wrap">
          <XStack ai="center" gap="$2">
            <Button
              size="$3"
              icon={ArrowLeft}
              onPress={() => safeBack('/admin/sorteos')}
              chromeless
            >
              Volver
            </Button>
            <Text fontSize="$8" fontWeight="bold">Preview de Sorteos</Text>
          </XStack>
        </XStack>

        {/* Info */}
        <Card padding="$3" bg="$blue2" borderColor="$blue6" borderWidth={1}>
          <XStack ai="center" gap="$2">
            <Calendar size={20} color="$blue11" />
            <YStack flex={1}>
              <Text fontSize="$5" fontWeight="700" color="$blue11">
                {loteriaName}
              </Text>
              <Text fontSize="$2" color="$blue10">
                Previsualiza los próximos sorteos que se generarían según las reglas de esta lotería
              </Text>
            </YStack>
          </XStack>
        </Card>

        {/* Controles */}
        <Card padding="$4" borderColor="$borderColor" borderWidth={1}>
          <XStack gap="$3" ai="center" flexWrap="wrap">
            <Text fontSize="$4" fontWeight="600">Días a previsualizar:</Text>
            <Input
              size="$3"
              width={100}
              value={days}
              onChangeText={setDays}
              keyboardType="number-pad"
              maxLength={3}
            />
            <Button
              size="$3"
              icon={RefreshCw}
              onPress={() => refetch()}
              disabled={isFetching}
            >
              {isFetching ? 'Actualizando...' : 'Actualizar'}
            </Button>

            {data?.meta && (
              <XStack flex={1} jc="flex-end" gap="$2">
                <Text fontSize="$3" color="$textSecondary">
                  {data.meta.count} sorteo(s) • {format(parseISO(data.meta.from), 'd MMM', { locale: es })} - {format(parseISO(data.meta.to), 'd MMM yyyy', { locale: es })}
                </Text>
              </XStack>
            )}
          </XStack>
        </Card>

        {/* Lista de sorteos */}
        {isLoading ? (
          <Card padding="$6" ai="center" jc="center">
            <Spinner size="large" />
            <Text color="$textSecondary" mt="$3">Cargando preview...</Text>
          </Card>
        ) : !data || sortedOccurrences.length === 0 ? (
          <Card padding="$6" ai="center" jc="center" borderColor="$borderColor" borderWidth={1}>
            <Text fontSize="$5" fontWeight="600">Sin resultados</Text>
            <Text color="$textSecondary" mt="$2">
              No se generaron sorteos. Verifica las reglas de la lotería.
            </Text>
          </Card>
        ) : (
          <>
            {/* Header con checkbox "Todos" */}
            <Card padding="$3" bg="$gray2" borderColor="$borderColor" borderWidth={1}>
              <XStack ai="center" gap="$3">
                <Checkbox
                  size="$5"
                  checked={allChecked}
                  onCheckedChange={handleToggleAll}
                >
                  <Checkbox.Indicator>
                    {someChecked ? <Text fontWeight="700">-</Text> : <Check size={20} />}
                  </Checkbox.Indicator>
                </Checkbox>
                <Text fontWeight="700" flex={1} fontSize="$5">
                  Seleccionar todos ({sortedOccurrences.length})
                </Text>
                <Text fontSize="$4" color="$blue11" fontWeight="600">
                  {selectedIds.size} seleccionado(s)
                </Text>
              </XStack>
            </Card>

            <YStack gap="$2">
              {sortedOccurrences.map((sorteo, idx) => {
                const isChecked = selectedIds.has(String(idx))
                const date = parseISO(sorteo.scheduledAt)
                const formattedDate = format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })
                const formattedTime = format(date, 'HH:mm', { locale: es })

                return (
                  <Card
                    key={idx}
                    padding="$4"
                    bg={isChecked ? '$blue2' : '$background'}
                    borderColor={isChecked ? '$blue8' : '$borderColor'}
                    borderWidth={isChecked ? 2 : 1}
                    pressStyle={{ backgroundColor: isChecked ? '$blue3' : '$backgroundPress' }}
                    onPress={() => handleToggle(idx)}
                    cursor="pointer"
                  >
                    <XStack gap="$3" ai="center">
                      <Checkbox
                        size="$5"
                        checked={isChecked}
                        onCheckedChange={() => handleToggle(idx)}
                      >
                        <Checkbox.Indicator>
                          <Check size={20} />
                        </Checkbox.Indicator>
                      </Checkbox>

                      <YStack flex={1} gap="$1">
                        <Text fontWeight="600" fontSize="$5">
                          {sorteo.name}
                        </Text>
                        <Text fontSize="$3" color="$textSecondary" textTransform="capitalize">
                          {formattedDate}
                        </Text>
                      </YStack>

                      <XStack ai="center" gap="$2" bg={isChecked ? '$blue4' : '$gray3'} px="$3" py="$2" br="$3">
                        <Calendar size={18} color={isChecked ? '$blue11' : '$gray11'} />
                        <Text fontWeight="700" fontSize="$6" color={isChecked ? '$blue11' : '$gray11'}>
                          {formattedTime}
                        </Text>
                      </XStack>
                    </XStack>
                  </Card>
                )
              })}
            </YStack>

            <Separator />

            {/* Botones de acción */}
            <XStack gap="$3" jc="flex-end" flexWrap="wrap">
              <Button
                size="$3"
                onPress={() => safeBack('/admin/sorteos')}
                disabled={mSeed.isPending}
              >
                Cancelar
              </Button>

              <Button
                size="$3"
                bg="$green4"
                borderColor="$green8"
                borderWidth={1}
                icon={CheckCircle2}
                onPress={handleSeed}
                disabled={selectedIds.size === 0 || mSeed.isPending}
                hoverStyle={{ bg: '$green5' }}
                pressStyle={{ bg: '$green6' }}
              >
                {mSeed.isPending ? (
                  <>
                    <Spinner size="small" />
                    <Text ml="$2">Creando...</Text>
                  </>
                ) : (
                  `Crear ${selectedIds.size} sorteo(s)`
                )}
              </Button>
            </XStack>
          </>
        )}

        <ConfirmRoot />
      </YStack>
    </ScrollView>
  )
}
