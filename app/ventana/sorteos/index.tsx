import React, { useMemo, useState } from 'react'
import { YStack, XStack, Text, ScrollView, Spinner } from 'tamagui'
import { Card, Select, Input, Button } from '@/components/ui'
import { useQuery } from '@tanstack/react-query'
import { SorteosApi } from '@/lib/api.sorteos'
import type { Sorteo } from '@/types/models.types'
import { Check, ChevronDown, RefreshCw } from '@tamagui/lucide-icons'

export default function VentanaSorteosScreen() {
  const [status, setStatus] = useState<'SCHEDULED' | 'OPEN' | 'EVALUATED' | 'CLOSED'>('OPEN')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const params = useMemo(() => ({ page, pageSize: 20, status, search: search || undefined }), [page, status, search])
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['sorteos', 'ventana', params],
    queryFn: () => SorteosApi.list(params),
    staleTime: 60_000,
  })

  const items: Sorteo[] = (data as any)?.data ?? []
  const meta = (data as any)?.meta

  return (
    <ScrollView flex={1} backgroundColor="$background">
      <YStack padding="$4" gap="$4" maxWidth={1200} alignSelf="center" width="100%">
        <XStack jc="space-between" ai="center" gap="$3" flexWrap="wrap">
          <Text fontSize="$8" fontWeight="bold" color="$color">Sorteos</Text>
          {isFetching && <Spinner size="small" />}
        </XStack>

        <Card padding="$3" borderColor="$borderColor" borderWidth={1}>
          <XStack gap="$3" flexWrap="wrap" ai="flex-end">
            {/* Status */}
            <YStack gap="$1" minWidth={220}>
              <Text fontSize="$3">Estado</Text>
              <Select value={status} onValueChange={(v) => setStatus(v as any)}>
                <Select.Trigger iconAfter={ChevronDown} width={220} height={36} br="$4" bw={1} bc="$borderColor" backgroundColor="$background">
                  <Select.Value />
                </Select.Trigger>
                <Select.Content zIndex={200000}>
                  <Select.Viewport>
                    {([
                      { value: 'SCHEDULED', label: 'Programado' },
                      { value: 'OPEN', label: 'Abierto' },
                      { value: 'EVALUATED', label: 'Evaluado' },
                      { value: 'CLOSED', label: 'Cerrado' },
                    ] as const).map((it, idx) => (
                      <Select.Item key={it.value} value={it.value} index={idx}>
                        <Select.ItemText>{it.label}</Select.ItemText>
                        <Select.ItemIndicator ml="auto"><Check size={16} /></Select.ItemIndicator>
                      </Select.Item>
                    ))}
                  </Select.Viewport>
                </Select.Content>
              </Select>
            </YStack>

            {/* Search */}
            <YStack gap="$1" minWidth={220}>
              <Text fontSize="$3">Buscar</Text>
              <Input width={260} height={36} value={search} onChangeText={setSearch} placeholder="Nombre o código" />
            </YStack>

            <YStack gap="$1">
              <Text fontSize="$3" opacity={0}>Acción</Text>
              <Button height={36} px="$4" icon={RefreshCw} onPress={() => { setPage(1); refetch() }}
                backgroundColor="$green4" borderColor="$green8" borderWidth={1}
                hoverStyle={{ backgroundColor: '$green5' }} pressStyle={{ backgroundColor: '$green6' }}
              >
                Refrescar
              </Button>
            </YStack>
          </XStack>
        </Card>

        <YStack gap="$3">
          {isLoading ? (
            <Spinner />
          ) : items.length === 0 ? (
            <Card padding="$4" ai="center">
              <Text color="$textSecondary">No hay sorteos</Text>
            </Card>
          ) : (
            items.map((s) => {
              const loteriaName = s.loteria?.name || s.loteriaId
              const scheduled = s.scheduledAt ? new Date(s.scheduledAt) : null
              const scheduledLabel = scheduled ? scheduled.toLocaleString() : '—'
              const statusBadge = (() => {
                switch (s.status) {
                  case 'OPEN': return { bg: '$green4', bc: '$green8', color: '$green11' }
                  case 'EVALUATED': return { bg: '$yellow4', bc: '$yellow8', color: '$yellow11' }
                  case 'CLOSED': return { bg: '$red4', bc: '$red8', color: '$red11' }
                  default: return { bg: '$gray4', bc: '$gray8', color: '$gray11' }
                }
              })()
              return (
                <Card key={s.id} padding="$3" borderColor="$borderColor" borderWidth={1}>
                  <XStack jc="space-between" ai="center" gap="$3" flexWrap="wrap">
                    <YStack gap="$1">
                      <Text fontSize="$5" fontWeight="700">{s.name}</Text>
                      <Text fontSize="$3" color="$textSecondary">{loteriaName} • {scheduledLabel}</Text>
                    </YStack>
                    <YStack>
                      <YStack px="$2" py="$1" br="$2" bw={1} {...statusBadge} ai="flex-end">
                        <Text fontSize="$2" fontWeight="700" color={statusBadge.color}>{s.status}</Text>
                      </YStack>
                    </YStack>
                  </XStack>
                </Card>
              )
            })
          )}
        </YStack>

        {meta?.totalPages > 1 && (
          <XStack gap="$2" jc="center" mt="$4" ai="center">
            <Button size="$2" variant="secondary" disabled={page <= 1} onPress={() => setPage((p) => Math.max(1, p - 1))}>
              Anterior
            </Button>
            <Card padding="$2" px="$4" bg="$backgroundHover" borderColor="$borderColor" borderWidth={1}>
              <Text fontSize="$3">Página {meta.page} de {meta.totalPages} • {items.length} de {meta.total}</Text>
            </Card>
            <Button size="$2" variant="secondary" disabled={page >= (meta.totalPages || 1)} onPress={() => setPage((p) => Math.min(p + 1, meta.totalPages || p + 1))}>
              Siguiente
            </Button>
          </XStack>
        )}
      </YStack>
    </ScrollView>
  )
}

