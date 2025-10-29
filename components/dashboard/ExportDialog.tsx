/**
 * Export Dialog para Dashboard
 */

import React, { useState } from 'react'
import { YStack, XStack, Text, Dialog, RadioGroup } from 'tamagui'
import { Button } from '@/components/ui'
import { Download, X } from '@tamagui/lucide-icons'
import { exportDashboard } from '@/hooks/useDashboard'
import { useDashboardFiltersStore } from '@/store/dashboardFilters.store'
import { useToast } from '@/hooks/useToast'
import type { ExportFormat } from '@/types/dashboard.types'

interface ExportDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function ExportDialog({ isOpen, onClose }: ExportDialogProps) {
  const [format, setFormat] = useState<ExportFormat>('xlsx')
  const [loading, setLoading] = useState(false)
  const filters = useDashboardFiltersStore()
  const { success, error: showError } = useToast()

  const handleExport = async () => {
    try {
      setLoading(true)
      await exportDashboard(filters, format)
      success('Exportación iniciada. El archivo se descargará pronto.')
      onClose()
    } catch (err: any) {
      showError(err.message || 'Error al exportar datos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog modal open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay
          key="export-overlay"
          animation="quick"
          opacity={0.5}
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
        />
        <Dialog.Content
          key="export-content"
          bordered
          elevate
          padding="$4"
          gap="$4"
          backgroundColor="$background"
          maxWidth={400}
          animation="quick"
        >
          <XStack jc="space-between" ai="center">
            <Dialog.Title asChild>
              <Text fontSize="$6" fontWeight="600">
                Exportar Dashboard
              </Text>
            </Dialog.Title>
            <Button
              size="$2"
              circular
              icon={X}
              backgroundColor="transparent"
              onPress={onClose}
            />
          </XStack>

          <YStack gap="$3">
            <Text fontSize="$3" color="$textSecondary">
              Selecciona el formato de exportación:
            </Text>

            <RadioGroup value={format} onValueChange={(v) => setFormat(v as ExportFormat)}>
              <YStack gap="$2">
                <XStack ai="center" gap="$2">
                  <RadioGroup.Item value="csv" id="csv" size="$3">
                    <RadioGroup.Indicator />
                  </RadioGroup.Item>
                  <Text htmlFor="csv">CSV (Excel compatible)</Text>
                </XStack>
                <XStack ai="center" gap="$2">
                  <RadioGroup.Item value="xlsx" id="xlsx" size="$3">
                    <RadioGroup.Indicator />
                  </RadioGroup.Item>
                  <Text htmlFor="xlsx">XLSX (Excel nativo)</Text>
                </XStack>
                <XStack ai="center" gap="$2">
                  <RadioGroup.Item value="pdf" id="pdf" size="$3">
                    <RadioGroup.Indicator />
                  </RadioGroup.Item>
                  <Text htmlFor="pdf">PDF (Reporte visual)</Text>
                </XStack>
              </YStack>
            </RadioGroup>
          </YStack>

          <XStack gap="$2" jc="flex-end">
            <Button
              size="$3"
              onPress={onClose}
              backgroundColor="$gray4"
              borderColor="$gray8"
              borderWidth={1}
            >
              <Text>Cancelar</Text>
            </Button>
            <Button
              size="$3"
              icon={Download}
              onPress={handleExport}
              loading={loading}
              backgroundColor="$blue4"
              borderColor="$blue8"
              borderWidth={1}
            >
              <Text>Exportar</Text>
            </Button>
          </XStack>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}

