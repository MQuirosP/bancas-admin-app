// app/admin/ventanas/nueva.tsx
import React from 'react'
import { YStack, Text, ScrollView, XStack, useTheme } from 'tamagui'
import { Button } from '@/components/ui'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient, ApiErrorClass } from '@/lib/api.client'
import { useToast } from '@/hooks/useToast'
import { safeBack, goToList } from '@/lib/navigation'
import VentanaForm, { VentanaFormValues } from '@/components/ventanas/VentanaForm'
import { listBancasLite } from '@/services/ventanas.service'
import { useRouter } from 'expo-router'
import { ArrowLeft } from '@tamagui/lucide-icons'

export default function NuevaVentanaScreen() {
  const router = useRouter()
  const qc = useQueryClient()
  const toast = useToast()
  const theme = useTheme()
  const iconColor = (theme?.color as any)?.get?.() ?? '#000'

  // Fuente de datos para el select de Bancas (ligero, cacheado)
  const { data: bancas = [], isLoading: loadingBancas, isError: errorBancas, refetch } = useQuery({
    queryKey: ['bancas', 'lite'],
    queryFn: listBancasLite,
    staleTime: 60_000,
  })

  const createMutation = useMutation({
    mutationFn: (payload: any) => apiClient.post('/ventanas', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ventanas'] })
      toast.success('Listero creado correctamente')
      // Navegación estandarizada al listado (mismo patrón que Bancas)
      goToList('/admin/ventanas')
    },
    onError: (error: ApiErrorClass) => {
      if (!error?.details?.length) {
        toast.error(error?.message || 'No fue posible crear el listero')
      }
    },
  })

  const handleSubmit = async (values: VentanaFormValues) => {
    // Normalización/trim y coerciones como en tu versión actual
    const payload = {
      bancaId: values.bancaId,
      name: values.name.trim(),
      code: values.code?.trim() || undefined,
      email: values.email?.trim() || undefined,
      phone: values.phone?.trim() || undefined,
      address: values.address?.trim() || undefined,
      commissionMarginX:
        values.commissionMarginX == null ? null : Number(values.commissionMarginX),
      isActive: !!values.isActive,
    }
    await createMutation.mutateAsync(payload)
  }

  return (
    <ScrollView flex={1} backgroundColor="$background">
      <YStack padding="$4" gap="$4" maxWidth={720} alignSelf="center" width="100%">
        <XStack ai="center" gap="$2">
          <Button
            size="$3"
            icon={(p:any)=> <ArrowLeft {...p} size={24} color={iconColor} />}
            onPress={() => router.push('/admin/ventanas')}
            backgroundColor="transparent"
            borderWidth={0}
            hoverStyle={{ backgroundColor: 'transparent' }}
            pressStyle={{ scale: 0.98 }}
          />
          <Text fontSize="$8" fontWeight="bold" color="$color">Nuevo Listero</Text>
        </XStack>
        <VentanaForm
          // Estándar: el form se encarga de inputs y botones (Submit/Cancel)
          onSubmit={handleSubmit}
          submitting={createMutation.isPending}
          onCancel={() => safeBack('/admin/ventanas')}
          // Datos auxiliares para selects/estados
          bancas={bancas}
          loadingBancas={loadingBancas}
          errorBancas={errorBancas}
          onRetryBancas={() => { void refetch()}}
        />
      </YStack>
    </ScrollView>
  )
}
