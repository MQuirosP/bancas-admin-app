// app/admin/restrictions/index.tsx
import React, { useMemo, useState } from 'react'
import {
  ScrollView,
  YStack,
  XStack,
  Text,
  Button,
  Card,
  Input,
  Select,
  Spinner,
} from 'tamagui'
import { useRouter } from 'expo-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Check, ChevronDown, Plus, Trash2, RotateCcw } from '@tamagui/lucide-icons'
import { listRestrictions, deleteRestriction, restoreRestriction } from '@/lib/api.restrictions'
import type { RestrictionRule } from '@/types/models.types'
import { useToast } from '@/hooks/useToast'
import ActiveBadge from '@/components/ui/ActiveBadge'

// preferir nombre, luego código; jamás mostrar ID
const pickNameOrCode = (name?: string | null, code?: string | null) =>
  (name && name.trim()) || (code && code.trim()) || ''

/**
 * Intenta obtener label de banca/ventana/usuario desde varias formas:
 * - objeto anidado: r.banca?.name / .code
 * - campos planos: bancaName/bancaCode, etc.
 * - si no hay nada, retorna '' para no mostrar la leyenda
 */
function resolveEntityLabel(
  r: any,
  key: 'banca' | 'ventana' | 'user'
): string {
  const obj = r?.[key]
  const fromObj = pickNameOrCode(obj?.name, obj?.code)
  if (fromObj) return fromObj

  const nameField = r?.[`${key}Name`]
  const codeField = r?.[`${key}Code`]
  const fromFlat = pickNameOrCode(nameField, codeField)
  if (fromFlat) return fromFlat

  return ''
}

const labelIf = (prefix: string, value?: string | null) =>
  value ? (
    <Text color="$textSecondary" fontSize="$2">
      <Text fontWeight="700">{prefix}</Text> {value}
    </Text>
  ) : null

export default function RestrictionsListScreen() {
  const router = useRouter()
  const toast = useToast()
  const qc = useQueryClient()

  // filtros remotos
  const [scope, setScope] = useState<'all' | 'cutoff' | 'amount'>('all')
  const [searchNumber, setSearchNumber] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['restrictions', { scope, searchNumber, page }],
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

  const delMut = useMutation({
    mutationFn: (id: string) => deleteRestriction(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['restrictions'] })
      toast.success('Restricción desactivada')
    },
    onError: (e: any) => toast.error(e?.message ?? 'Error al desactivar'),
  })

  const restoreMut = useMutation({
    mutationFn: (id: string) => restoreRestriction(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['restrictions'] })
      toast.success('Restricción restaurada')
    },
    onError: (e: any) => toast.error(e?.message ?? 'Error al restaurar'),
  })

  return (
    <ScrollView flex={1} backgroundColor="$background">
      <YStack padding="$4" gap="$4" maxWidth={1000} alignSelf="center" width="100%">
        {/* Header */}
        <XStack jc="space-between" ai="center" gap="$3" flexWrap="wrap">
          <Text fontSize="$8" fontWeight="bold" color="$color">
            Reglas de Restricción
          </Text>
          <Button
            icon={Plus}
            backgroundColor="$blue4"
            borderColor="$blue8"
            borderWidth={1}
            hoverStyle={{ backgroundColor: '$blue5' }}
            onPress={() => router.push('/admin/restrictions/nueva')}
          >
            Nueva Regla
          </Button>
        </XStack>

        {/* Toolbar (perfectamente alineada) */}
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
                  bg="$background"
                >
                  <Select.Value />
                </Select.Trigger>
                <Select.Content zIndex={200000}>
                  <Select.Viewport>
                    <Select.Group>
                      <Select.Item value="all" index={0}>
                        <Select.ItemText>Todas</Select.ItemText>
                        <Select.ItemIndicator ml="auto">
                          <Check size={16} />
                        </Select.ItemIndicator>
                      </Select.Item>
                      <Select.Item value="amount" index={1}>
                        <Select.ItemText>Montos</Select.ItemText>
                        <Select.ItemIndicator ml="auto">
                          <Check size={16} />
                        </Select.ItemIndicator>
                      </Select.Item>
                      <Select.Item value="cutoff" index={2}>
                        <Select.ItemText>Corte de venta</Select.ItemText>
                        <Select.ItemIndicator ml="auto">
                          <Check size={16} />
                        </Select.ItemIndicator>
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
                placeholder="0..999"
                value={searchNumber}
                onChangeText={setSearchNumber}
                maxLength={3}
                keyboardType="number-pad"
              />
            </YStack>

            {/* Aplicar */}
            <YStack gap="$1">
              <Text fontSize="$3" opacity={0}>
                Aplicar
              </Text>
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
              const banca = resolveEntityLabel(r as any, 'banca')
              const ventana = resolveEntityLabel(r as any, 'ventana')
              const usuario = resolveEntityLabel(r as any, 'user')

              const titulo = r.number != null ? `Número ${r.number}` : 'Regla genérica'
              const subtitulo =
                r.salesCutoffMinutes != null
                  ? `Corte de venta: ${r.salesCutoffMinutes} min`
                  : `Montos máximos: por jugada = ${r.maxAmount ?? '—'} · total = ${r.maxTotal ?? '—'}`

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
                  onPress={() => router.push(`/admin/restrictions/${r.id}`)}
                >
                  <XStack jc="space-between" ai="center" gap="$3" flexWrap="wrap">
                    {/* Info */}
                    <YStack gap="$2" f={1} minWidth={260}>
                      {/* Título + badge */}
                      <XStack ai="center" gap="$3" fw="wrap">
                        <Text fontSize="$6" fontWeight="800">
                          {titulo}
                        </Text>
                        <ActiveBadge active={!!r.isActive} />
                      </XStack>

                      <Text color="$textSecondary">{subtitulo}</Text>

                      <XStack gap="$4" fw="wrap">
                        {labelIf('Banca:', banca)}
                        {labelIf('Ventana:', ventana)}
                        {labelIf('Usuario:', usuario)}
                      </XStack>
                    </YStack>

                    {/* Acción (a la derecha) */}
                    <XStack>
                      {!r.isActive ? (
                        <Button
                          icon={RotateCcw}
                          onPress={(e: any) => {
                            e?.stopPropagation?.()
                            restoreMut.mutate(r.id)
                          }}
                          disabled={restoreMut.isPending}
                        >
                          Restaurar
                        </Button>
                      ) : (
                        <Button
                          icon={Trash2}
                          backgroundColor="$red4"
                          borderColor="$red8"
                          borderWidth={1}
                          hoverStyle={{ backgroundColor: '$red5' }}
                          onPress={(e: any) => {
                            e?.stopPropagation?.()
                            delMut.mutate(r.id)
                          }}
                          disabled={delMut.isPending}
                        >
                          Desactivar
                        </Button>
                      )}
                    </XStack>
                  </XStack>
                </Card>
              )
            })
          )}
        </YStack>

        {/* Paginación */}
        {meta?.pages > 1 && (
          <XStack gap="$2" ai="center" jc="center">
            <Button disabled={page <= 1} onPress={() => setPage((p) => Math.max(1, p - 1))}>
              Anterior
            </Button>
            <Text>
              {page} / {meta.pages}
            </Text>
            <Button
              disabled={page >= meta.pages}
              onPress={() => setPage((p) => Math.min(meta.pages, p + 1))}
            >
              Siguiente
            </Button>
          </XStack>
        )}
      </YStack>
    </ScrollView>
  )
}
