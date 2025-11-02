// app/admin/usuarios/PrintConfigTab.tsx
import React, { useMemo } from 'react'
import { YStack, XStack, Text } from 'tamagui'
import { Toolbar, Card, Button } from '@/components/ui'
import { RefreshCw, HelpCircle } from '@tamagui/lucide-icons'
import { useTheme } from 'tamagui'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api.client'
import { useToast } from '@/hooks/useToast'
import { getErrorMessage } from '@/lib/errors'
import TicketPrintConfigForm, { TicketPrintConfigValues } from '@/components/tickets/TicketPrintConfigForm'
import { useUserQuery } from '@/hooks/useUsers'
import { queryKeys } from '@/hooks/useUsers'
import type { Usuario } from '@/types/models.types'

type Props = {
  userId: string
  targetRole: 'ADMIN' | 'VENTANA' | 'VENDEDOR'
  viewerRole: 'ADMIN' | 'VENTANA' | 'VENDEDOR'
}

export default function PrintConfigTab({ userId, targetRole, viewerRole }: Props) {
  const toast = useToast()
  const qc = useQueryClient()
  const theme = useTheme()
  const iconColor = (theme?.color as any)?.get?.() ?? '#000'

  const { data: user, isFetching, refetch } = useUserQuery(userId)

  const updateMutation = useMutation({
    mutationFn: (payload: Partial<Usuario>) => apiClient.patch(`/users/${userId}`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.users.detail(userId) })
      qc.invalidateQueries({ queryKey: queryKeys.users.root })
      toast.success('Configuración de impresión actualizada')
      refetch()
    },
    onError: (e) => {
      toast.error(getErrorMessage(e))
    },
  })

  const readOnly = viewerRole !== 'ADMIN' || targetRole !== 'VENDEDOR'

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

  // Solo mostrar para VENDEDOR
  if (targetRole !== 'VENDEDOR') {
    return (
      <Card p="$2" bw={1} bc="$borderColor" bg="$backgroundHover">
        <Text fontSize="$2" color="$textSecondary">La configuración de impresión solo aplica para vendedores</Text>
      </Card>
    )
  }

  const configValues: TicketPrintConfigValues | null = useMemo(() => {
    if (!user) return null
    return {
      printName: user.settings?.print?.name ?? user.printName ?? null,
      printPhone: user.settings?.print?.phone ?? user.printPhone ?? null,
      printWidth: user.settings?.print?.width ?? user.printWidth ?? null,
      printFooter: user.settings?.print?.footer ?? user.printFooter ?? null,
      printBarcode: user.settings?.print?.barcode ?? user.printBarcode ?? null,
    }
  }, [
    user?.settings?.print?.name,
    user?.printName,
    user?.settings?.print?.phone,
    user?.printPhone,
    user?.settings?.print?.width,
    user?.printWidth,
    user?.settings?.print?.footer,
    user?.printFooter,
    user?.settings?.print?.barcode,
    user?.printBarcode,
  ])

  return (
    <YStack gap="$3">
      <Toolbar fd="row" jc="space-between" ai="center">
        <XStack gap="$2" ai="center">
          <Text fontSize="$6" fontWeight="700">Configuración de Impresión</Text>
          <Text fontSize="$2" color="$textSecondary">Configuración de tiquetes</Text>
        </XStack>
        <XStack gap="$2" ai="center">
          <Button
            icon={(p: any) => <RefreshCw {...p} color={iconColor} />}
            onPress={() => refetch()}
            loading={isFetching || updateMutation.isPending}
            backgroundColor="$green4"
            borderColor="$green8"
            borderWidth={1}
            hoverStyle={{ backgroundColor: '$green5' }}
            pressStyle={{ backgroundColor: '$green6', scale: 0.98 }}
          >
            Refrescar
          </Button>
          <Button
            variant="secondary"
            icon={(p: any) => <HelpCircle {...p} color={iconColor} />}
            onPress={() => toast.info('Configuración para personalizar la impresión de tiquetes')}
          >
            Ayuda
          </Button>
        </XStack>
      </Toolbar>

      {readOnly && (
        <Card p="$2" bw={1} bc="$borderColor" bg="$backgroundHover">
          <Text fontSize="$2" color="$textSecondary">Solo lectura: Solo administradores pueden editar esta configuración</Text>
        </Card>
      )}

      <TicketPrintConfigForm
        value={configValues}
        readOnly={readOnly}
        loading={updateMutation.isPending}
        onSave={handleSave}
        onCancel={() => refetch()}
      />
    </YStack>
  )
}

