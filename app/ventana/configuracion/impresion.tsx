// app/ventana/configuracion/impresion.tsx
import React, { useMemo } from 'react'
import { ScrollView, YStack, XStack, Text, useTheme } from 'tamagui'
import { Button } from '@/components/ui'
import { ArrowLeft, Settings } from '@tamagui/lucide-icons'
import { useRouter } from 'expo-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api.client'
import { useToast } from '@/hooks/useToast'
import { getErrorMessage } from '@/lib/errors'
import TicketPrintConfigForm, { TicketPrintConfigValues } from '@/components/tickets/TicketPrintConfigForm'
import { useAuthStore } from '@/store/auth.store'
import type { Ventana } from '@/types/models.types'
import { safeBack } from '@/lib/navigation'

export default function VentanaConfiguracionScreen() {
  const router = useRouter()
  const qc = useQueryClient()
  const toast = useToast()
  const theme = useTheme()
  const iconColor = (theme?.color as any)?.get?.() ?? '#000'
  const { user } = useAuthStore()
  const ventanaId = user?.ventanaId

  const { data: ventana, isFetching, refetch } = useQuery<Ventana>({
    queryKey: ['ventanas', ventanaId],
    queryFn: () => apiClient.get<Ventana>(`/ventanas/${ventanaId}`),
    enabled: !!ventanaId,
  })

  const updateMutation = useMutation({
    mutationFn: (payload: Partial<Ventana>) => apiClient.patch(`/ventanas/${ventanaId}`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ventanas', ventanaId] })
      qc.invalidateQueries({ queryKey: ['ventanas'] })
      toast.success('Configuración de impresión actualizada')
      refetch()
    },
    onError: (e) => {
      toast.error(getErrorMessage(e))
    },
  })

  const handleSave = async (values: TicketPrintConfigValues) => {
    try {
      await updateMutation.mutateAsync({
        settings: {
          print: {
            name: values.printName,
            phone: values.printPhone,
            width: values.printWidth,
            footer: values.printFooter,
            barcode: values.printBarcode,
          },
        },
      })
    } catch (e) {
      // El error ya se maneja en onError
    }
  }

  const configValues: TicketPrintConfigValues | null = useMemo(() => {
    if (!ventana) return null
    return {
      printName: (ventana as any).settings?.print?.name ?? ventana.printName ?? null,
      printPhone: (ventana as any).settings?.print?.phone ?? ventana.printPhone ?? null,
      printWidth: (ventana as any).settings?.print?.width ?? ventana.printWidth ?? null,
      printFooter: (ventana as any).settings?.print?.footer ?? ventana.printFooter ?? null,
      printBarcode: (ventana as any).settings?.print?.barcode ?? ventana.printBarcode ?? null,
    }
  }, [
    (ventana as any)?.settings?.print?.name,
    ventana?.printName,
    (ventana as any)?.settings?.print?.phone,
    ventana?.printPhone,
    (ventana as any)?.settings?.print?.width,
    ventana?.printWidth,
    (ventana as any)?.settings?.print?.footer,
    ventana?.printFooter,
    (ventana as any)?.settings?.print?.barcode,
    ventana?.printBarcode,
  ])

  return (
    <ScrollView flex={1} backgroundColor="$background">
      <YStack padding="$4" gap="$4" maxWidth={1000} alignSelf="center" width="100%">
        <XStack ai="center" gap="$2">
          <Button
            size="$3"
            icon={(p: any) => <ArrowLeft {...p} size={24} color={iconColor} />}
            onPress={() => safeBack('/ventana/configuracion')}
            backgroundColor="transparent"
            borderWidth={0}
            hoverStyle={{ backgroundColor: 'transparent' }}
            pressStyle={{ scale: 0.98 }}
          />
          <Settings size={24} color={iconColor} />
          <Text fontSize="$8" fontWeight="bold" color="$color">Configuración de Impresión</Text>
        </XStack>

        {isFetching && !ventana ? (
          <Text>Cargando configuración...</Text>
        ) : ventana ? (
          <TicketPrintConfigForm
            value={configValues}
            readOnly={false}
            loading={updateMutation.isPending}
            onSave={handleSave}
            onCancel={() => refetch()}
          />
        ) : (
          <Text>No se encontró la configuración del listero</Text>
        )}
      </YStack>
    </ScrollView>
  )
}

