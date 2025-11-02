// app/vendedor/configuracion/impresion.tsx
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
import { authService } from '@/services/auth.service'
import type { User } from '@/types/auth.types'
import { safeBack } from '@/lib/navigation'

export default function VendedorConfiguracionScreen() {
  const router = useRouter()
  const qc = useQueryClient()
  const toast = useToast()
  const theme = useTheme()
  const iconColor = (theme?.color as any)?.get?.() ?? '#000'
  const { user, setUser } = useAuthStore()

  const { data: userData, isFetching, refetch } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => authService.me(),
    enabled: !!user,
    select: (res) => res.data,
  })

  const updateMutation = useMutation({
    mutationFn: (payload: Partial<User>) => apiClient.patch(`/users/${user?.id}`, payload),
    onSuccess: async () => {
      qc.invalidateQueries({ queryKey: ['auth', 'me'] })
      qc.invalidateQueries({ queryKey: ['users'] })
      toast.success('Configuración de impresión actualizada')
      // Actualizar el usuario en el store
      const meRes = await authService.me()
      if (meRes.success && meRes.data) {
        setUser(meRes.data)
      }
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
    if (!userData) return null
    return {
      printName: userData.settings?.print?.name ?? userData.printName ?? null,
      printPhone: userData.settings?.print?.phone ?? userData.printPhone ?? null,
      printWidth: userData.settings?.print?.width ?? userData.printWidth ?? null,
      printFooter: userData.settings?.print?.footer ?? userData.printFooter ?? null,
      printBarcode: userData.settings?.print?.barcode ?? userData.printBarcode ?? null,
    }
  }, [
    userData?.settings?.print?.name,
    userData?.printName,
    userData?.settings?.print?.phone,
    userData?.printPhone,
    userData?.settings?.print?.width,
    userData?.printWidth,
    userData?.settings?.print?.footer,
    userData?.printFooter,
    userData?.settings?.print?.barcode,
    userData?.printBarcode,
  ])

  return (
    <ScrollView flex={1} backgroundColor="$background">
      <YStack padding="$4" gap="$4" maxWidth={1000} alignSelf="center" width="100%">
        <XStack ai="center" gap="$2">
          <Button
            size="$3"
            icon={(p: any) => <ArrowLeft {...p} size={24} color={iconColor} />}
            onPress={() => safeBack('/vendedor/configuracion')}
            backgroundColor="transparent"
            borderWidth={0}
            hoverStyle={{ backgroundColor: 'transparent' }}
            pressStyle={{ scale: 0.98 }}
          />
          <Settings size={24} color={iconColor} />
          <Text fontSize="$8" fontWeight="bold" color="$color">Configuración de Impresión</Text>
        </XStack>

        {isFetching && !userData ? (
          <Text>Cargando configuración...</Text>
        ) : (
          <TicketPrintConfigForm
            value={configValues}
            readOnly={false}
            loading={updateMutation.isPending}
            onSave={handleSave}
            onCancel={() => refetch()}
          />
        )}
      </YStack>
    </ScrollView>
  )
}

