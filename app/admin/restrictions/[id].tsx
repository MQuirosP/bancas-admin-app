// app/admin/restrictions/[id].tsx
import React from 'react'
import {
  ScrollView, YStack, XStack, Text, Button, Card, Separator, Spinner
} from 'tamagui'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getRestriction, deleteRestriction, restoreRestriction } from '@/lib/api.restrictions'
import { useToast } from '@/hooks/useToast'
import ActiveBadge from '@/components/ui/ActiveBadge'

type AnyRule = Record<string, any>

// helpers
const pickNameOrCode = (name?: string | null, code?: string | null) =>
  (name && String(name).trim()) || (code && String(code).trim()) || ''

function resolveEntityLabel(r: AnyRule, key: 'banca' | 'ventana' | 'user') {
  // anidado (preferido)
  const nested = r?.[key]
  const fromNested =
    key === 'user'
      ? // para usuario priorizo name, luego username
      (nested?.name && String(nested.name).trim()) ||
      (nested?.username && String(nested.username).trim()) ||
      ''
      : pickNameOrCode(nested?.name, nested?.code)
  if (fromNested) return fromNested

  // campos planos alternativos bancaName/bancaCode, etc.
  const nameField = r?.[`${key}Name`]
  const codeField = r?.[`${key}Code`]
  const fromFlat =
    key === 'user'
      ? (nameField && String(nameField).trim()) ||
      (r?.[`${key}Username`] && String(r?.[`${key}Username`]).trim()) ||
      ''
      : pickNameOrCode(nameField, codeField)
  if (fromFlat) return fromFlat

  return ''
}

export default function RestrictionDetailScreen() {
  const params = useLocalSearchParams()
  const rawId = params.id as string | string[] | undefined
  const id = Array.isArray(rawId) ? rawId[0] : rawId

  const router = useRouter()
  const toast = useToast()
  const qc = useQueryClient()

  // normalizo la respuesta del API: puede venir como {data}, {success,data} o plano
  const { data, isLoading, isError } = useQuery({
    queryKey: ['restriction', id],
    enabled: !!id,
    queryFn: async () => {
      const res = await getRestriction(id!)
      // posibles formas comunes
      return (res as any)?.data?.data ?? (res as any)?.data ?? res
    },
    staleTime: 60_000,
  })

  const rule = data as AnyRule | undefined

  const delMut = useMutation({
    mutationFn: () => deleteRestriction(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['restrictions'] })
      toast.success('Restricción desactivada')
      safeBack()
    },
    onError: (e: any) => toast.error(e?.message ?? 'Error al desactivar'),
  })

  const restoreMut = useMutation({
    mutationFn: () => restoreRestriction(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['restrictions'] })
      qc.invalidateQueries({ queryKey: ['restriction', id] })
      toast.success('Restricción restaurada')
    },
    onError: (e: any) => toast.error(e?.message ?? 'Error al restaurar'),
  })

  const safeBack = () => {
    // @ts-ignore expo-router en runtime
    if ((router as any).canGoBack?.()) router.back()
    else router.replace('/admin/restrictions')
  }

  const bancaLabel = resolveEntityLabel(rule ?? {}, 'banca')
  const ventanaLabel = resolveEntityLabel(rule ?? {}, 'ventana')
  const usuarioLabel = resolveEntityLabel(rule ?? {}, 'user')

  return (
    <ScrollView flex={1} backgroundColor="$background">
      <YStack padding="$4" gap="$4" maxWidth={800} alignSelf="center" width="100%">
        {/* Header */}
        <XStack jc="space-between" ai="center" gap="$3" flexWrap="wrap">
          <XStack ai="center" gap="$3">
            <Text fontSize="$8" fontWeight="bold">Detalle de Restricción</Text>
            {!!rule && <ActiveBadge active={!!rule.isActive} />}
          </XStack>

          {!!rule && (
            <XStack gap="$2">
              {/* Solo un botón de navegación */}
              <XStack jc="flex-end">
                <Button 
                onPress={safeBack}
                background={'$gray4'}
                borderColor={'$gray8'}
                hoverStyle={{ backgroundColor: '$gray5' }}
                pressStyle={{ scale: 0.98}}
                >Volver</Button>
              </XStack>
              {/* {rule.isActive && (
                <Button onPress={() => router.push(`/admin/restrictions/${id}/edit`)}>
                  Editar
                </Button>
              )} */}
              {!rule.isActive ? (
                <Button
                  onPress={() => restoreMut.mutate()}
                  disabled={restoreMut.isPending}
                >
                  Restaurar
                </Button>
              ) : (
                <Button
                  backgroundColor="$red4"
                  borderColor="$red8"
                  borderWidth={1}
                  pressStyle={{ scale: 0.98 }}
                  onPress={() => delMut.mutate()}
                  disabled={delMut.isPending}
                  hoverStyle={{ backgroundColor: '$red5' }}
                >
                  Eliminar
                </Button>
              )}
            </XStack>
          )}
        </XStack>

        {/* Body */}
        {isLoading ? (
          <Spinner />
        ) : isError ? (
          <Card padding="$4" borderColor="$error" borderWidth={1}>
            <Text color="$error">No fue posible cargar la restricción.</Text>
          </Card>
        ) : !rule ? (
          <Card padding="$4"><Text>No encontrada.</Text></Card>
        ) : (
          <Card padding="$4" borderColor="$borderColor" borderWidth={1} bg="$background">
            <YStack gap="$3">
              {/* Título descriptivo */}
              <Text fontSize="$6" fontWeight="700">
                {rule.number != null ? `Número ${rule.number}` : 'Regla genérica'}
              </Text>

              <Separator />

              {/* Alcance */}
              <YStack gap="$1">
                {bancaLabel ? (
                  <Text><Text fontWeight="700">Banca:</Text> {bancaLabel}</Text>
                ) : null}
                {ventanaLabel ? (
                  <Text><Text fontWeight="700">Ventana:</Text> {ventanaLabel}</Text>
                ) : null}
                {usuarioLabel ? (
                  <Text><Text fontWeight="700">Usuario:</Text> {usuarioLabel}</Text>
                ) : null}
                {!bancaLabel && !ventanaLabel && !usuarioLabel && (
                  <Text color="$textSecondary">Sin alcance específico</Text>
                )}
              </YStack>

              <Separator />

              {/* Tipo de regla */}
              {rule.salesCutoffMinutes != null ? (
                <YStack gap="$1">
                  <Text><Text fontWeight="700">Tipo:</Text> Corte de venta</Text>
                  <Text><Text fontWeight="700">Minutos:</Text> {rule.salesCutoffMinutes}</Text>
                </YStack>
              ) : (
                <YStack gap="$1">
                  <Text><Text fontWeight="700">Tipo:</Text> Límites de monto</Text>
                  <Text><Text fontWeight="700">Número:</Text> {rule.number ?? '—'}</Text>
                  <Text><Text fontWeight="700">Máximo por jugada:</Text> {rule.maxAmount ?? '—'}</Text>
                  <Text><Text fontWeight="700">Máximo total:</Text> {rule.maxTotal ?? '—'}</Text>
                </YStack>
              )}

              <Separator />

              {/* Ventana temporal */}
              <YStack gap="$1">
                <Text>
                  <Text fontWeight="700">Fecha específica:</Text>{' '}
                  {rule.appliesToDate ? String(rule.appliesToDate).slice(0, 10) : '—'}
                </Text>
                <Text>
                  <Text fontWeight="700">Hora específica:</Text>{' '}
                  {rule.appliesToHour ?? '—'}
                </Text>
              </YStack>

              <Separator />

              <Text color="$textSecondary" fontSize="$2">
                Última actualización: {new Date(rule.updatedAt as any).toLocaleString()}
              </Text>
            </YStack>
          </Card>
        )}


      </YStack>
    </ScrollView>
  )
}
