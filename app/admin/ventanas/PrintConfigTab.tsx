// app/admin/ventanas/PrintConfigTab.tsx
import React, { useMemo } from 'react'
import { YStack, XStack, Text } from 'tamagui'
import { Toolbar, Card, Button } from '@/components/ui'
import { RefreshCw, HelpCircle } from '@tamagui/lucide-icons'
import { useTheme } from 'tamagui'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api.client'
import { useToast } from '@/hooks/useToast'
import { getErrorMessage } from '@/lib/errors'
import TicketPrintConfigForm, { TicketPrintConfigValues } from '@/components/tickets/TicketPrintConfigForm'
import type { Ventana } from '@/types/models.types'

type Props = {
  ventanaId: string
  viewerRole: 'ADMIN' | 'VENTANA' | 'VENDEDOR'
}

export default function PrintConfigTab({ ventanaId, viewerRole }: Props) {
  const toast = useToast()
  const qc = useQueryClient()
  const theme = useTheme()
  const iconColor = (theme?.color as any)?.get?.() ?? '#000'

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

  const readOnly = viewerRole !== 'ADMIN'

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
      printName: ventana.settings?.print?.name ?? ventana.printName ?? null,
      printPhone: ventana.settings?.print?.phone ?? ventana.printPhone ?? null,
      printWidth: ventana.settings?.print?.width ?? ventana.printWidth ?? null,
      printFooter: ventana.settings?.print?.footer ?? ventana.printFooter ?? null,
      printBarcode: ventana.settings?.print?.barcode ?? ventana.printBarcode ?? null,
    }
  }, [
    ventana?.settings?.print?.name,
    ventana?.printName,
    ventana?.settings?.print?.phone,
    ventana?.printPhone,
    ventana?.settings?.print?.width,
    ventana?.printWidth,
    ventana?.settings?.print?.footer,
    ventana?.printFooter,
    ventana?.settings?.print?.barcode,
    ventana?.printBarcode,
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

