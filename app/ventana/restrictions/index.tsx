import React, { useState } from 'react'
import { ScrollView, YStack, XStack, Text, Spinner, useTheme } from 'tamagui'
import { Button, Card, Input, Select } from '@/components/ui'
import { useQuery } from '@tanstack/react-query'
import { Check, ChevronDown, ArrowLeft } from '@tamagui/lucide-icons'
import { listRestrictions } from '@/lib/api.restrictions'
import type { RestrictionRule } from '@/types/models.types'
import ActiveBadge from '@/components/ui/ActiveBadge'
import { formatCurrency } from '@/utils/formatters'
import { safeBack } from '../../../lib/navigation'

export default function VentanaRestrictionsScreen() {
  const theme = useTheme()
  const iconColor = (theme?.color as any)?.get?.() ?? '#000'
  // filtros remotos mínimos (solo lectura)
  const [scope, setScope] = useState<'all' | 'cutoff' | 'amount'>('all')
  const [searchNumber, setSearchNumber] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['restrictions', 'ventana', { scope, searchNumber, page }],
    queryFn: () =>
      listRestrictions({
        page,
        pageSize: 20,
        number: searchNumber || undefined,
        hasCutoff: scope === 'cutoff' ? true : undefined,
        hasAmount: scope === 'amount' ? true : undefined,
      }),
    staleTime: 60_000,
  })

  const items: RestrictionRule[] = (data as any)?.data ?? []
  const meta = (data as any)?.meta

  return (
    <ScrollView flex={1} backgroundColor="$background">
      <YStack padding="$4" gap="$4" maxWidth={1000} alignSelf="center" width="100%">
        {/* Header */}
        <XStack jc="space-between" ai="center" gap="$3" flexWrap="wrap">
          <XStack ai="center" gap="$2">
            <Button
              size="$3"
              icon={(p: any) => <ArrowLeft {...p} size={24} color={iconColor} />}
              onPress={() => safeBack('/ventana')}
              backgroundColor="transparent"
              borderWidth={0}
              hoverStyle={{ backgroundColor: 'transparent' }}
              pressStyle={{ scale: 0.98 }}
            />
            <Text fontSize="$8" fontWeight="bold" color="$color">
              Restricciones (Listero)
            </Text>
          </XStack>
        </XStack>

        {/* Toolbar de filtros (solo lectura) */}
        <Card padding="$3" borderColor="$borderColor" borderWidth={1}>
          <XStack gap="$3" flexWrap="wrap" ai="flex-end">
            {/* Tipo */}
            <YStack gap="$1" minWidth={220}>
              <Text fontSize="$3">Tipo</Text>
              <Select value={scope} onValueChange={(v) => setScope(v as any)}>
                <Select.Trigger
                  iconAfter={ChevronDown}
                  width={220}
                  height={36}
                  br="$4"
                  bw={1}
                  bc="$borderColor"
                  backgroundColor="$background"
                >
                  <Select.Value />
                </Select.Trigger>
                <Select.Content zIndex={200000}>
                  <Select.Viewport>
                    <Select.Group>
                      <Select.Item value="all" index={0}>
                        <Select.ItemText>Todas</Select.ItemText>
                        <Select.ItemIndicator ml="auto"><Check size={16} /></Select.ItemIndicator>
                      </Select.Item>
                      <Select.Item value="amount" index={1}>
                        <Select.ItemText>Montos</Select.ItemText>
                        <Select.ItemIndicator ml="auto"><Check size={16} /></Select.ItemIndicator>
                      </Select.Item>
                      <Select.Item value="cutoff" index={2}>
                        <Select.ItemText>Corte de venta</Select.ItemText>
                        <Select.ItemIndicator ml="auto"><Check size={16} /></Select.ItemIndicator>
                      </Select.Item>
                    </Select.Group>
                  </Select.Viewport>
                </Select.Content>
              </Select>
            </YStack>

            {/* Número */}
            <YStack gap="$1" minWidth={220}>
              <Text fontSize="$3">Número</Text>
              <Input
                width={220}
                height={36}
                placeholder="0..99"
                value={searchNumber}
                onChangeText={setSearchNumber}
                maxLength={2}
                keyboardType="number-pad"
              />
            </YStack>

            <YStack gap="$1">
              <Text fontSize="$3" opacity={0}>Aplicar</Text>
              <Button
                height={36}
                px="$4"
                backgroundColor="$gray4"
                borderColor="$gray8"
                borderWidth={1}
                hoverStyle={{ backgroundColor: '$gray5' }}
                onPress={() => setPage(1)}
              >
                Aplicar
              </Button>
            </YStack>

            {isFetching && <Spinner size="small" />}
          </XStack>
        </Card>

        {/* Lista */}
        <YStack gap="$3">
          {isLoading ? (
            <Spinner />
          ) : items.length === 0 ? (
            <Card padding="$4" ai="center">
              <Text color="$textSecondary">No hay reglas</Text>
            </Card>
          ) : (
            items.map((r: RestrictionRule) => {
              const titulo = r.number != null ? `Número ${r.number}` : 'Regla genérica'
              const subtitulo =
                r.salesCutoffMinutes != null
                  ? `Corte de venta: ${r.salesCutoffMinutes} min`
                  : `Montos máximos: por jugada = ${r.maxAmount != null ? formatCurrency(r.maxAmount as any) : '—'} · total = ${r.maxTotal != null ? formatCurrency(r.maxTotal as any) : '—'}`

              return (
                <Card
                  key={r.id}
                  padding="$3"
                  borderColor="$borderColor"
                  borderWidth={1}
                  pressStyle={{
                    backgroundColor: '$backgroundPress',
                    borderColor: '$borderColorHover',
                    scale: 0.98,
                  }}
                >
                  <XStack jc="space-between" ai="center" gap="$3" flexWrap="wrap">
                    <YStack gap="$2" f={1} minWidth={260}>
                      <XStack ai="center" gap="$3" fw="wrap">
                        <Text fontSize="$6" fontWeight="800">{titulo}</Text>
                        <ActiveBadge active={!!r.isActive} />
                      </XStack>
                      <Text color="$textSecondary">{subtitulo}</Text>
                    </YStack>
                  </XStack>
                </Card>
              )
            })
          )}
        </YStack>

        {/* Paginación */}
        {meta?.totalPages > 1 && (
          <XStack gap="$2" ai="center" jc="center">
            <Button size="$2" variant="secondary" disabled={page <= 1} onPress={() => setPage((p) => Math.max(1, p - 1))}>
              Anterior
            </Button>
            <Text>
              {meta?.page} / {meta?.totalPages}
            </Text>
            <Button size="$2" variant="secondary" disabled={page >= meta?.totalPages} onPress={() => setPage((p) => Math.min(meta?.totalPages || p + 1, p + 1))}>
              Siguiente
            </Button>
          </XStack>
        )}
      </YStack>
    </ScrollView>
  )
}
