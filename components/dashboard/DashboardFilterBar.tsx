/**
 * FilterBar para Dashboard Admin
 * Filtros globales con persistencia en URL
 * Colapsable con animaciones suaves
 */

import React, { useCallback, useEffect, useState } from 'react'
import { YStack, XStack, Text, styled, useTheme, Switch } from 'tamagui'
import { Button, Select, DatePicker } from '@/components/ui'
import { RefreshCw, Download, Check, ChevronDown } from '@tamagui/lucide-icons'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useDashboardFiltersStore, useSyncFiltersWithURL } from '@/store/dashboardFilters.store'
import { useAuth } from '@/hooks/useAuth'
import { UserRole } from '@/types/auth.types'
import type { DatePreset, BetType } from '@/types/dashboard.types'
import { useQueryClient } from '@tanstack/react-query'

// Botón animado para el toggle
const ToggleButton = styled(YStack, {
  animation: '300ms',
  cursor: 'pointer',
  alignItems: 'center',
  justifyContent: 'center',
  paddingVertical: '$3',
  backgroundColor: '$background',
  borderTopWidth: 1,
  borderColor: '$borderColor',
  hoverStyle: {
    backgroundColor: '$backgroundHover',
  },
  pressStyle: {
    backgroundColor: '$backgroundPress',
  },
} as const)

// Contenedor animado para el icono
const ChevronContainer = styled(YStack, {
  animation: '300ms',
  alignItems: 'center',
  justifyContent: 'center',
} as const)

interface DashboardFilterBarProps {
  onExport?: () => void
  exportLoading?: boolean
}

const DATE_PRESETS: Array<{ value: DatePreset; label: string }> = [
  { value: 'today', label: 'Hoy' },
  { value: 'yesterday', label: 'Ayer' },
  { value: 'week', label: 'Esta Semana' },
  { value: 'month', label: 'Este Mes' },
  { value: 'year', label: 'Este Año' },
]

const BET_TYPES: Array<{ value: BetType; label: string }> = [
  { value: 'all', label: 'Todos' },
  { value: 'DIRECTO', label: 'Directo' },
  { value: 'PALE', label: 'Palé' },
  { value: 'TRIPLETA', label: 'Tripleta' },
  { value: 'REVENTADO', label: 'Reventado' },
]

export function DashboardFilterBar({ onExport, exportLoading }: DashboardFilterBarProps) {
  const router = useRouter()
  const searchParams = useLocalSearchParams()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const { loadFromURL, getURLParams } = useSyncFiltersWithURL()
  
  // Obtener el color del tema para los íconos
  const theme = useTheme()
  const iconColor = (theme?.color as any)?.get?.() ?? '#000'
  
  // Estado para controlar si está expandido o colapsado
  const [isExpanded, setIsExpanded] = useState(false)
  
  const {
    date,
    fromDate,
    toDate,
    ventanaId,
    loteriaId,
    betType,
    mockMode,
    setDatePreset,
    setDateRange,
    setVentanaId,
    setLoteriaIds,
    setBetType,
    resetFilters,
    setMockMode,
  } = useDashboardFiltersStore()

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

  // NO sincronizar automáticamente - causa loop infinito
  // La sincronización se hace manualmente en los handlers de cambio

  // Refrescar todas las queries del dashboard
  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  }

  // Resetear filtros
  const handleReset = () => {
    resetFilters()
    router.replace('/admin/dashboard')
  }

  const isRangeMode = !date && (fromDate || toDate)

  return (
    <YStack
      backgroundColor="$background"
      borderBottomWidth={1}
      borderColor="$borderColor"
      overflow="hidden"
    >
      {/* Contenido Colapsable */}
      <YStack
        animation="200ms"
        opacity={isExpanded ? 1 : 0}
        maxHeight={isExpanded ? 500 : 0}
        paddingHorizontal={isExpanded ? "$4" : "$0"}
        paddingTop={isExpanded ? "$4" : "$0"}
        paddingBottom={isExpanded ? "$4" : "$0"}
        gap="$3"
      >
        {/* Fila 1: Filtros principales */}
        <XStack gap="$3" flexWrap="wrap" ai="flex-end">
          {/* Selector de Fecha */}
          <YStack gap="$1" minWidth={200}>
            <Text fontSize="$2" fontWeight="600" color="$textSecondary">
              Período
            </Text>
            <Select
              value={date || 'range'}
              onValueChange={(v: string) => {
                if (v === 'range') {
                  // Cambiar a modo rango
                  setDateRange('', '')
                } else {
                  setDatePreset(v as DatePreset)
                }
              }}
            >
              <Select.Trigger
                width={200}
                br="$3"
                bw={1}
                bc="$borderColor"
                backgroundColor="$background"
                px="$3"
                hoverStyle={{ bg: '$backgroundHover' }}
                focusStyle={{ outlineWidth: 2, outlineStyle: 'solid', outlineColor: '$outlineColor' }}
                iconAfter={ChevronDown}
              >
                <Select.Value>
                  {date ? DATE_PRESETS.find((p) => p.value === date)?.label : 'Rango Personalizado'}
                </Select.Value>
              </Select.Trigger>

              <Select.Content zIndex={200000}>
                <YStack br="$3" bw={1} bc="$borderColor" backgroundColor="$background">
                  <Select.Viewport>
                    {DATE_PRESETS.map((preset, idx) => (
                      <Select.Item key={preset.value} value={preset.value} index={idx} pressStyle={{ bg: '$backgroundHover' }} bw={0} px="$3">
                        <Select.ItemText>{preset.label}</Select.ItemText>
                        {date === preset.value && <Select.ItemIndicator ml="auto"><Check size={16} /></Select.ItemIndicator>}
                      </Select.Item>
                    ))}
                    <Select.Item value="range" index={DATE_PRESETS.length} pressStyle={{ bg: '$backgroundHover' }} bw={0} px="$3">
                      <Select.ItemText>Rango Personalizado</Select.ItemText>
                      {isRangeMode && <Select.ItemIndicator ml="auto"><Check size={16} /></Select.ItemIndicator>}
                    </Select.Item>
                  </Select.Viewport>
                </YStack>
              </Select.Content>
            </Select>
          </YStack>

          {/* Rango personalizado */}
          {isRangeMode && (
            <>
              <YStack gap="$1" minWidth={140}>
                <Text fontSize="$2" fontWeight="600" color="$textSecondary">
                  Desde
                </Text>
                <DatePicker
                  value={fromDate ? new Date(fromDate) : null}
                  onChange={(d) => setDateRange(d?.toISOString() || '', toDate || '')}
                  placeholder="Desde"
                />
              </YStack>
              <YStack gap="$1" minWidth={140}>
                <Text fontSize="$2" fontWeight="600" color="$textSecondary">
                  Hasta
                </Text>
                <DatePicker
                  value={toDate ? new Date(toDate) : null}
                  onChange={(d) => setDateRange(fromDate || '', d?.toISOString() || '')}
                  placeholder="Hasta"
                />
              </YStack>
            </>
          )}

          {/* Ventana (solo para ADMIN) */}
          {user?.role === UserRole.ADMIN && (
            <YStack gap="$1" minWidth={180}>
              <Text fontSize="$2" fontWeight="600" color="$textSecondary">
                Listero
              </Text>
              <Select
                value={ventanaId || 'all'}
                onValueChange={(v: string) => setVentanaId(v === 'all' ? undefined : v)}
              >
                <Select.Trigger
                  width={180}
                  br="$3"
                  bw={1}
                  bc="$borderColor"
                  backgroundColor="$background"
                  px="$3"
                  hoverStyle={{ bg: '$backgroundHover' }}
                  focusStyle={{ outlineWidth: 2, outlineStyle: 'solid', outlineColor: '$outlineColor' }}
                  iconAfter={ChevronDown}
                >
                  <Select.Value>
                    {ventanaId || 'Todos los Listeros'}
                  </Select.Value>
                </Select.Trigger>

                <Select.Content zIndex={200000}>
                  <YStack br="$3" bw={1} bc="$borderColor" backgroundColor="$background">
                    <Select.Viewport>
                      <Select.Item value="all" index={0} pressStyle={{ bg: '$backgroundHover' }} bw={0} px="$3">
                        <Select.ItemText>Todos los Listeros</Select.ItemText>
                        {!ventanaId && <Select.ItemIndicator ml="auto"><Check size={16} /></Select.ItemIndicator>}
                      </Select.Item>
                      {/* TODO: Cargar ventanas dinámicamente */}
                    </Select.Viewport>
                  </YStack>
                </Select.Content>
              </Select>
            </YStack>
          )}

          {/* Tipo de Apuesta */}
          <YStack gap="$1" minWidth={160}>
            <Text fontSize="$2" fontWeight="600" color="$textSecondary">
              Tipo de Apuesta
            </Text>
            <Select
              value={betType || 'all'}
              onValueChange={(v: string) => setBetType(v as BetType)}
            >
              <Select.Trigger
                width={160}
                br="$3"
                bw={1}
                bc="$borderColor"
                backgroundColor="$background"
                px="$3"
                hoverStyle={{ bg: '$backgroundHover' }}
                focusStyle={{ outlineWidth: 2, outlineStyle: 'solid', outlineColor: '$outlineColor' }}
                iconAfter={ChevronDown}
              >
                <Select.Value>
                  {BET_TYPES.find((b) => b.value === betType)?.label || 'Todos'}
                </Select.Value>
              </Select.Trigger>

              <Select.Content zIndex={200000}>
                <YStack br="$3" bw={1} bc="$borderColor" backgroundColor="$background">
                  <Select.Viewport>
                    {BET_TYPES.map((type, idx) => (
                      <Select.Item key={type.value} value={type.value} index={idx} pressStyle={{ bg: '$backgroundHover' }} bw={0} px="$3">
                        <Select.ItemText>{type.label}</Select.ItemText>
                        {betType === type.value && <Select.ItemIndicator ml="auto"><Check size={16} /></Select.ItemIndicator>}
                      </Select.Item>
                    ))}
                  </Select.Viewport>
                </YStack>
              </Select.Content>
            </Select>
          </YStack>
        </XStack>

        {/* Fila 2: Switch Mock Mode */}
        <XStack gap="$2" ai="center" flexWrap="wrap">
          <Text fontSize="$3" fontWeight="600">
            Modo Mock:
          </Text>
          <XStack ai="center" gap="$2">
            <Switch
              size="$2"
              checked={mockMode}
              onCheckedChange={setMockMode}
              bw={1}
              bc="$borderColor"
              bg={mockMode ? '$blue10' : '$background'}
              hoverStyle={{ bg: mockMode ? '$blue10' : '$backgroundHover' }}
            >
              <Switch.Thumb animation="quick" bg="$color12" />
            </Switch>
            <Text fontSize="$2" color="$textSecondary">
              {mockMode ? 'Activo (datos mock)' : 'Inactivo (datos reales)'}
            </Text>
          </XStack>
        </XStack>

        {/* Fila 3: Acciones */}
        <XStack gap="$2" flexWrap="wrap">
          <Button
            size="$3"
            icon={(p: any) => <RefreshCw {...p} color={iconColor} />}
            onPress={handleRefresh}
            backgroundColor="$green4"
            borderColor="$green8"
            borderWidth={1}
            hoverStyle={{ backgroundColor: '$green5' }}
            pressStyle={{ backgroundColor: '$green6', scale: 0.98 }}
          >
            <Text>Actualizar</Text>
          </Button>

          <Button
            size="$3"
            onPress={handleReset}
            backgroundColor="$gray4"
            borderColor="$gray8"
            borderWidth={1}
            hoverStyle={{ backgroundColor: '$gray5' }}
            pressStyle={{ backgroundColor: '$gray6' }}
          >
            <Text>Limpiar Filtros</Text>
          </Button>

          <Button
            size="$3"
            icon={(p: any) => <Download {...p} color={iconColor} />}
            onPress={onExport}
            loading={exportLoading}
            backgroundColor="$blue4"
            borderColor="$blue8"
            borderWidth={1}
            hoverStyle={{ backgroundColor: '$blue5' }}
            pressStyle={{ backgroundColor: '$blue6', scale: 0.98 }}
          >
            <Text>Exportar</Text>
          </Button>
        </XStack>
      </YStack>

      {/* Botón Toggle en el borde inferior central */}
      <ToggleButton
        onPress={() => setIsExpanded(!isExpanded)}
      >
        <ChevronContainer
          rotate={isExpanded ? '180deg' : '0deg'}
        >
          <ChevronDown size={24} color="$textPrimary" />
        </ChevronContainer>
      </ToggleButton>
    </YStack>
  )
}

