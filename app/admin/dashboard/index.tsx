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
import { Card, Button } from '@/components/ui'
import { RefreshCw } from '@tamagui/lucide-icons'
import { useQueryClient } from '@tanstack/react-query'

export default function DashboardScreen() {
  const router = useRouter()
  const { user } = useAuth()
  const { error: showError } = useToast()
  const queryClient = useQueryClient()
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
  } = useDashboardTimeSeries({
    ...filters,
    granularity: 'day',
    compare: false,
  })

  if (!user || user.role === UserRole.VENDEDOR) {
    return null
  }

  const handleExport = () => {
    setExportDialogOpen(true)
  }

  return (
    <ScrollView flex={1} backgroundColor="$background" contentContainerStyle={{ flexGrow: 1 }}>
      <YStack gap="$4" maxWidth={1200} alignSelf="center" width="100%" animation="200ms">
        {/* Filtros Colapsables */}
        <DashboardFilterBar
          onExport={handleExport}
          exportLoading={exportLoading}
        />

        {/* Contenido Principal */}
        <YStack
          padding="$4"
          gap="$4"
          animation="200ms"
        >
          {/* Header */}
          <XStack jc="space-between" ai="center" gap="$3" flexWrap="wrap">
            <Text fontSize="$9" fontWeight="700" color="$textPrimary">
              Dashboard Administrativo
            </Text>
            <Text fontSize="$5" fontWeight="600" color="$textSecondary">
              {new Date().toLocaleDateString('es-DO', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </Text>
          </XStack>

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
          {dashboardLoading && !dashboardError && (
            <XStack ai="center" jc="center" padding="$8">
              <Spinner size="large" />
              <Text ml="$3" color="$textSecondary">
                Cargando dashboard...
              </Text>
            </XStack>
          )}

          {/* Error State - Backend SQL Error */}
          {dashboardError && (
            <Card padding="$4" backgroundColor="$red2" borderColor="$red8" borderWidth={1}>
              <YStack gap="$2">
                <Text fontSize="$6" fontWeight="600" color="$red11">
                  ⚠️ Error al cargar el dashboard
                </Text>
                <Text color="$red10">
                  Error del backend: La consulta SQL tiene un problema con la columna "betType".
                </Text>
                <Text fontSize="$2" color="$textSecondary" mt="$2">
                  El backend está intentando acceder a "j.betType" pero esa columna no existe en la base de datos.
                  Por favor, contacta al equipo de backend para que corrijan el query SQL.
                </Text>
                <Button
                  size="$3"
                  backgroundColor="$red4"
                  borderColor="$red8"
                  onPress={() => queryClient.invalidateQueries({ queryKey: ['dashboard'] })}
                  mt="$3"
                  alignSelf="flex-start"
                >
                  <RefreshCw size={16} />
                  <Text ml="$2">Reintentar</Text>
                </Button>
              </YStack>
            </Card>
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

        {/* Export Dialog */}
        <ExportDialog
          isOpen={exportDialogOpen}
          onClose={() => setExportDialogOpen(false)}
        />
      </YStack>
    </ScrollView>
  )
}

