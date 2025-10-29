/**
 * Dashboard Admin Principal
 * Vista completa con KPIs, gráficos, desgloses y alertas
 */

import React, { useEffect, useState } from 'react'
import { YStack, ScrollView, Text, Spinner, XStack } from 'tamagui'
import { useRouter } from 'expo-router'
import { useAuth } from '@/hooks/useAuth'
import { UserRole } from '@/types/auth.types'
import { useDashboard, useDashboardTimeSeries } from '@/hooks/useDashboard'
import { useDashboardFiltersStore, useSyncFiltersWithURL } from '@/store/dashboardFilters.store'
import { DashboardFilterBar } from '@/components/dashboard/DashboardFilterBar'
import { DashboardKPIsGrid } from '@/components/dashboard/DashboardKPIs'
import { DashboardTimeSeries } from '@/components/dashboard/DashboardTimeSeries'
import { AlertsPanel } from '@/components/dashboard/AlertsPanel'
import { ExportDialog } from '@/components/dashboard/ExportDialog'
import { useToast } from '@/hooks/useToast'
import { useLocalSearchParams } from 'expo-router'

export default function DashboardScreen() {
  const router = useRouter()
  const { user } = useAuth()
  const { error: showError } = useToast()
  const searchParams = useLocalSearchParams()
  const { loadFromURL } = useSyncFiltersWithURL()
  
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)

  // Obtener filtros del store
  const filters = useDashboardFiltersStore((state) => ({
    date: state.date,
    fromDate: state.fromDate,
    toDate: state.toDate,
    ventanaId: state.ventanaId,
    loteriaId: state.loteriaId,
    betType: state.betType,
  }))

  // Cargar filtros desde URL al montar
  useEffect(() => {
    if (searchParams) {
      const params = new URLSearchParams()
      Object.entries(searchParams).forEach(([key, value]) => {
        if (value) params.set(key, String(value))
      })
      loadFromURL(params)
    }
  }, [])

  // RBAC: Solo ADMIN y VENTANA pueden acceder
  useEffect(() => {
    if (!user) return
    if (user.role === UserRole.VENDEDOR) {
      showError('Acceso denegado: Solo administradores pueden ver el dashboard')
      router.replace('/vendedor')
    }
  }, [user])

  // Queries principales
  const {
    data: dashboardData,
    isLoading: dashboardLoading,
    isError: dashboardError,
    error: dashboardErrorObj,
  } = useDashboard(filters)

  const {
    data: timeSeriesData,
    isLoading: timeSeriesLoading,
  } = useDashboardTimeSeries(
    {
      ...filters,
      granularity: 'day',
      compare: false,
    },
    {
      enabled: false, // TODO: Habilitar cuando backend implemente /timeseries
    }
  )

  if (!user || user.role === UserRole.VENDEDOR) {
    return null
  }

  const handleExport = () => {
    setExportDialogOpen(true)
  }

  return (
    <YStack flex={1} backgroundColor="$background">
      {/* Filtros Sticky */}
      <DashboardFilterBar
        onExport={handleExport}
        exportLoading={exportLoading}
      />

      {/* Contenido Principal */}
      <ScrollView flex={1}>
        <YStack
          padding="$4"
          gap="$4"
          maxWidth={1600}
          alignSelf="center"
          width="100%"
        >
          {/* Header */}
          <YStack gap="$2">
            <Text fontSize="$9" fontWeight="700" color="$textPrimary">
              Dashboard Admin
            </Text>
            <Text fontSize="$4" color="$textSecondary">
              Vista completa de métricas y estadísticas del sistema
            </Text>
          </YStack>

          {/* Error State */}
          {dashboardError && (
            <YStack
              padding="$4"
              br="$3"
              backgroundColor="$red2"
              borderWidth={1}
              borderColor="$red8"
            >
              <Text color="$red10" fontWeight="600">
                Error al cargar dashboard
              </Text>
              <Text color="$red9" fontSize="$2" mt="$1">
                {(dashboardErrorObj as any)?.message || 'Error desconocido'}
              </Text>
            </YStack>
          )}

          {/* Loading State */}
          {dashboardLoading && (
            <XStack ai="center" jc="center" padding="$8">
              <Spinner size="large" />
              <Text ml="$3" color="$textSecondary">
                Cargando dashboard...
              </Text>
            </XStack>
          )}

          {/* KPIs */}
          <DashboardKPIsGrid
            data={dashboardData?.kpis}
            isLoading={dashboardLoading}
            meta={dashboardData?.meta}
          />

          {/* Time Series */}
          <DashboardTimeSeries
            data={timeSeriesData?.data || []}
            comparison={timeSeriesData?.comparison}
            granularity={timeSeriesData?.granularity || 'day'}
            isLoading={timeSeriesLoading}
          />

          {/* Grid de 2 columnas: Tabs de Desgloses | Alertas */}
          <XStack gap="$4" flexWrap="wrap" ai="flex-start">
            {/* Tabs de Desgloses (Placeholder) */}
            <YStack flex={2} minWidth={600} gap="$3">
              <Text fontSize="$6" fontWeight="600">
                Desgloses por Dimensión
              </Text>
              <YStack
                br="$3"
                backgroundColor="$backgroundHover"
                padding="$6"
                ai="center"
                jc="center"
                minHeight={400}
              >
                <Text color="$textSecondary" ta="center">
                  📊 Tabs: Ventanas | Loterías | Vendedores
                </Text>
                <Text color="$textSecondary" ta="center" fontSize="$2" mt="$2">
                  (Componente en desarrollo)
                </Text>
              </YStack>
            </YStack>

            {/* Alertas */}
            <YStack flex={1} minWidth={300}>
              <AlertsPanel
                alerts={dashboardData?.alerts || []}
                isLoading={dashboardLoading}
              />
            </YStack>
          </XStack>

          {/* Secciones adicionales (Placeholders) */}
          <YStack gap="$3">
            <Text fontSize="$6" fontWeight="600">
              Análisis de Riesgo y Finanzas
            </Text>
            <YStack
              br="$3"
              backgroundColor="$backgroundHover"
              padding="$6"
              ai="center"
              jc="center"
              minHeight={300}
            >
              <Text color="$textSecondary" ta="center">
                🎯 Exposición por Número | 💰 CxC/CxP | 📈 Ganancia
              </Text>
              <Text color="$textSecondary" ta="center" fontSize="$2" mt="$2">
                (Componentes en desarrollo)
              </Text>
            </YStack>
          </YStack>
        </YStack>
      </ScrollView>

      {/* Export Dialog */}
      <ExportDialog
        isOpen={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
      />
    </YStack>
  )
}

