/**
 * Análisis de Riesgo y Finanzas para Dashboard
 * Exposición por Número, CxC, CxP y Ganancia
 */

import React, { useState } from 'react'
import { YStack, XStack, Text, ScrollView } from 'tamagui'
import { Card, Button } from '@/components/ui'
import { formatCurrency } from '@/utils/formatters'

type SectionType = 'exposure' | 'cxc' | 'cxp' | 'ganancia'

export function FinanceAnalysis() {
  const [activeSection, setActiveSection] = useState<SectionType>('exposure')

  // Datos mock
  const mockExposure = {
    topNumbers: [
      { number: '47', betType: 'DIRECTO' as const, sales: 45000, potentialPayout: 405000, ratio: 9.0, ticketCount: 450 },
      { number: '23', betType: 'DIRECTO' as const, sales: 38000, potentialPayout: 342000, ratio: 9.0, ticketCount: 380 },
      { number: '56', betType: 'PALE' as const, sales: 32000, potentialPayout: 288000, ratio: 9.0, ticketCount: 160 },
      { number: '12', betType: 'DIRECTO' as const, sales: 28000, potentialPayout: 252000, ratio: 9.0, ticketCount: 280 },
      { number: '89', betType: 'TRIPLETA' as const, sales: 25000, potentialPayout: 375000, ratio: 15.0, ticketCount: 50 },
    ],
    byLoteria: [
      {
        loteriaId: '1',
        loteriaName: 'Lotería Nacional',
        totalSales: 65000,
        totalPotentialPayout: 585000,
        ratio: 9.0,
        topNumbers: [
          { number: '47', betType: 'DIRECTO' as const, sales: 45000, potentialPayout: 405000 },
          { number: '23', betType: 'DIRECTO' as const, sales: 38000, potentialPayout: 342000 },
        ],
      },
    ],
    heatmap: [],
  }

  const mockCxC = {
    items: [
      { ventanaId: '1', ventanaName: 'Listero Centro', totalSales: 45000, totalPaidOut: 38000, amount: 7000 },
      { ventanaId: '2', ventanaName: 'Listero Norte', totalSales: 38000, totalPaidOut: 33000, amount: 5000 },
      { ventanaId: '3', ventanaName: 'Listero Sur', totalSales: 42000, totalPaidOut: 37000, amount: 5000 },
    ],
    total: 17000,
  }

  const mockCxP = {
    items: [
      { ventanaId: '1', ventanaName: 'Listero Centro', totalSales: 45000, totalPaidToVentana: 50000, amount: -5000 },
      { ventanaId: '2', ventanaName: 'Listero Norte', totalSales: 38000, totalPaidToVentana: 43000, amount: -5000 },
      { ventanaId: '3', ventanaName: 'Listero Sur', totalSales: 42000, totalPaidToVentana: 47000, amount: -5000 },
    ],
    total: -15000,
  }

  const mockGanancia = {
    dimension: 'ventana' as const,
    items: [
      { dimension: 'ventana' as const, key: '1', name: 'Listero Centro', sales: 45000, payout: 36000, commissions: 4500, netProfit: 4500, margin: 10.0 },
      { dimension: 'ventana' as const, key: '2', name: 'Listero Norte', sales: 38000, payout: 30400, commissions: 3800, netProfit: 3800, margin: 10.0 },
      { dimension: 'ventana' as const, key: '3', name: 'Listero Sur', sales: 42000, payout: 33600, commissions: 4200, netProfit: 4200, margin: 10.0 },
    ],
    global: {
      sales: 125000,
      payout: 100000,
      commissions: 12500,
      netProfit: 12500,
      margin: 10.0,
    },
  }

  const sections: Array<{ value: SectionType; label: string }> = [
    { value: 'exposure', label: 'Exposición' },
    { value: 'cxc', label: 'CxC' },
    { value: 'cxp', label: 'CxP' },
    { value: 'ganancia', label: 'Ganancia' },
  ]

  return (
    <Card padding="$4" gap="$3">
      {/* Tabs */}
      <XStack gap="$2" borderBottomWidth={1} borderColor="$borderColor" pb="$2" flexWrap="wrap">
        {sections.map((section) => (
          <Button
            key={section.value}
            unstyled
            onPress={() => setActiveSection(section.value)}
            px="$3"
            py="$2"
            backgroundColor={activeSection === section.value ? '$blue4' : 'transparent'}
            borderRadius="$3"
            hoverStyle={{ backgroundColor: '$backgroundHover' }}
            pressStyle={{ scale: 0.98 }}
          >
            <Text
              fontSize="$4"
              fontWeight={activeSection === section.value ? '600' : '400'}
              color={activeSection === section.value ? '$blue10' : '$textSecondary'}
            >
              {section.label}
            </Text>
          </Button>
        ))}
      </XStack>

      {/* Content */}
      <ScrollView maxHeight={400}>
        <YStack gap="$3">
          {activeSection === 'exposure' && (
            <>
              <Text fontSize="$5" fontWeight="600">Top Números con Mayor Exposición</Text>
              {mockExposure.topNumbers.map((item, idx) => (
                <Card key={idx} padding="$3" backgroundColor="$backgroundHover" borderColor="$borderColor" borderWidth={1}>
                  <XStack jc="space-between" ai="flex-start" gap="$3" flexWrap="wrap">
                    <YStack flex={1} minWidth={200}>
                      <XStack ai="center" gap="$2">
                        <Text fontSize="$6" fontWeight="700" color="$red10">{item.number}</Text>
                        <Text fontSize="$3" color="$textSecondary">({item.betType})</Text>
                      </XStack>
                      <XStack gap="$3" mt="$2" flexWrap="wrap">
                        <YStack>
                          <Text fontSize="$2" color="$textSecondary">Ventas</Text>
                          <Text fontSize="$4" fontWeight="600">{formatCurrency(item.sales)}</Text>
                        </YStack>
                        <YStack>
                          <Text fontSize="$2" color="$textSecondary">Pago Potencial</Text>
                          <Text fontSize="$4" fontWeight="600" color="$red10">{formatCurrency(item.potentialPayout)}</Text>
                        </YStack>
                        <YStack>
                          <Text fontSize="$2" color="$textSecondary">Ratio</Text>
                          <Text fontSize="$4" fontWeight="600" color="$orange10">{item.ratio.toFixed(1)}x</Text>
                        </YStack>
                        <YStack>
                          <Text fontSize="$2" color="$textSecondary">Tickets</Text>
                          <Text fontSize="$4" fontWeight="600">{item.ticketCount}</Text>
                        </YStack>
                      </XStack>
                    </YStack>
                  </XStack>
                </Card>
              ))}
            </>
          )}

          {activeSection === 'cxc' && (
            <>
              <XStack jc="space-between" ai="center" mb="$2">
                <Text fontSize="$5" fontWeight="600">Cuentas por Cobrar</Text>
                <Text fontSize="$4" fontWeight="600" color="$orange10">
                  Total: {formatCurrency(mockCxC.total)}
                </Text>
              </XStack>
              {mockCxC.items.map((item) => (
                <Card key={item.ventanaId} padding="$3" backgroundColor="$backgroundHover" borderColor="$borderColor" borderWidth={1}>
                  <XStack jc="space-between" ai="flex-start" gap="$3" flexWrap="wrap">
                    <YStack flex={1} minWidth={200}>
                      <Text fontSize="$5" fontWeight="600">{item.ventanaName}</Text>
                      <XStack gap="$3" mt="$2" flexWrap="wrap">
                        <YStack>
                          <Text fontSize="$2" color="$textSecondary">Ventas</Text>
                          <Text fontSize="$4" fontWeight="600">{formatCurrency(item.totalSales)}</Text>
                        </YStack>
                        <YStack>
                          <Text fontSize="$2" color="$textSecondary">Pagado</Text>
                          <Text fontSize="$4" fontWeight="600">{formatCurrency(item.totalPaidOut)}</Text>
                        </YStack>
                        <YStack>
                          <Text fontSize="$2" color="$textSecondary">CxC</Text>
                          <Text fontSize="$4" fontWeight="600" color="$orange10">{formatCurrency(item.amount)}</Text>
                        </YStack>
                      </XStack>
                    </YStack>
                  </XStack>
                </Card>
              ))}
            </>
          )}

          {activeSection === 'cxp' && (
            <>
              <XStack jc="space-between" ai="center" mb="$2">
                <Text fontSize="$5" fontWeight="600">Cuentas por Pagar</Text>
                <Text fontSize="$4" fontWeight="600" color="$blue10">
                  Total: {formatCurrency(Math.abs(mockCxP.total))}
                </Text>
              </XStack>
              {mockCxP.items.map((item) => (
                <Card key={item.ventanaId} padding="$3" backgroundColor="$backgroundHover" borderColor="$borderColor" borderWidth={1}>
                  <XStack jc="space-between" ai="flex-start" gap="$3" flexWrap="wrap">
                    <YStack flex={1} minWidth={200}>
                      <Text fontSize="$5" fontWeight="600">{item.ventanaName}</Text>
                      <XStack gap="$3" mt="$2" flexWrap="wrap">
                        <YStack>
                          <Text fontSize="$2" color="$textSecondary">Ventas</Text>
                          <Text fontSize="$4" fontWeight="600">{formatCurrency(item.totalSales)}</Text>
                        </YStack>
                        <YStack>
                          <Text fontSize="$2" color="$textSecondary">Pagado</Text>
                          <Text fontSize="$4" fontWeight="600">{formatCurrency(item.totalPaidToVentana)}</Text>
                        </YStack>
                        <YStack>
                          <Text fontSize="$2" color="$textSecondary">CxP</Text>
                          <Text fontSize="$4" fontWeight="600" color="$blue10">{formatCurrency(Math.abs(item.amount))}</Text>
                        </YStack>
                      </XStack>
                    </YStack>
                  </XStack>
                </Card>
              ))}
            </>
          )}

          {activeSection === 'ganancia' && (
            <>
              <Card padding="$3" backgroundColor="$green2" borderColor="$green8" borderWidth={1} mb="$2">
                <YStack gap="$2">
                  <Text fontSize="$5" fontWeight="600" color="$green10">Ganancia Global</Text>
                  <XStack gap="$4" flexWrap="wrap">
                    <YStack>
                      <Text fontSize="$2" color="$textSecondary">Ventas</Text>
                      <Text fontSize="$5" fontWeight="700">{formatCurrency(mockGanancia.global.sales)}</Text>
                    </YStack>
                    <YStack>
                      <Text fontSize="$2" color="$textSecondary">Premios</Text>
                      <Text fontSize="$5" fontWeight="700">{formatCurrency(mockGanancia.global.payout)}</Text>
                    </YStack>
                    <YStack>
                      <Text fontSize="$2" color="$textSecondary">Comisiones</Text>
                      <Text fontSize="$5" fontWeight="700">{formatCurrency(mockGanancia.global.commissions)}</Text>
                    </YStack>
                    <YStack>
                      <Text fontSize="$2" color="$textSecondary">Ganancia Neta</Text>
                      <Text fontSize="$5" fontWeight="700" color="$green10">{formatCurrency(mockGanancia.global.netProfit)}</Text>
                    </YStack>
                    <YStack>
                      <Text fontSize="$2" color="$textSecondary">Margen</Text>
                      <Text fontSize="$5" fontWeight="700" color="$green10">{mockGanancia.global.margin.toFixed(1)}%</Text>
                    </YStack>
                  </XStack>
                </YStack>
              </Card>
              <Text fontSize="$5" fontWeight="600" mb="$2">Por Listero</Text>
              {mockGanancia.items.map((item) => (
                <Card key={item.key} padding="$3" backgroundColor="$backgroundHover" borderColor="$borderColor" borderWidth={1}>
                  <XStack jc="space-between" ai="flex-start" gap="$3" flexWrap="wrap">
                    <YStack flex={1} minWidth={200}>
                      <Text fontSize="$5" fontWeight="600">{item.name}</Text>
                      <XStack gap="$3" mt="$2" flexWrap="wrap">
                        <YStack>
                          <Text fontSize="$2" color="$textSecondary">Ventas</Text>
                          <Text fontSize="$4" fontWeight="600">{formatCurrency(item.sales)}</Text>
                        </YStack>
                        <YStack>
                          <Text fontSize="$2" color="$textSecondary">Premios</Text>
                          <Text fontSize="$4" fontWeight="600">{formatCurrency(item.payout)}</Text>
                        </YStack>
                        <YStack>
                          <Text fontSize="$2" color="$textSecondary">Ganancia Neta</Text>
                          <Text fontSize="$4" fontWeight="600" color="$green10">{formatCurrency(item.netProfit)}</Text>
                        </YStack>
                        <YStack>
                          <Text fontSize="$2" color="$textSecondary">Margen</Text>
                          <Text fontSize="$4" fontWeight="600" color="$green10">{item.margin.toFixed(1)}%</Text>
                        </YStack>
                      </XStack>
                    </YStack>
                  </XStack>
                </Card>
              ))}
            </>
          )}
        </YStack>
      </ScrollView>
    </Card>
  )
}

