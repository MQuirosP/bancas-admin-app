/**
 * Breakdown Tabs para Dashboard
 * Desgloses por Ventanas, Loterías y Vendedores
 */

import React, { useState } from 'react'
import { YStack, XStack, Text, ScrollView } from 'tamagui'
import { Card, Button } from '@/components/ui'
import { formatCurrency } from '@/utils/formatters'

type TabType = 'ventana' | 'loteria' | 'vendedor'

export function BreakdownTabs() {
  const [activeTab, setActiveTab] = useState<TabType>('ventana')

  // Generar datos mock según la pestaña activa
  const mockData = {
    ventana: [
      { id: '1', name: 'Listero Centro', sales: 45000, commissions: 4500, tickets: 320, winners: 25, margin: 18.5 },
      { id: '2', name: 'Listero Norte', sales: 38000, commissions: 3800, tickets: 280, winners: 22, margin: 17.2 },
      { id: '3', name: 'Listero Sur', sales: 42000, commissions: 4200, tickets: 310, winners: 24, margin: 19.1 },
    ],
    loteria: [
      { id: '1', name: 'Lotería Nacional', sales: 65000, payout: 52000, commissions: 6500, tickets: 450, winners: 35, profitability: 6500, margin: 10.0 },
      { id: '2', name: 'Leidsa', sales: 58000, payout: 46400, commissions: 5800, tickets: 410, winners: 32, profitability: 5800, margin: 10.0 },
      { id: '3', name: 'Loteka', sales: 52000, payout: 41600, commissions: 5200, tickets: 380, winners: 28, profitability: 5200, margin: 10.0 },
    ],
    vendedor: [
      { id: '1', name: 'Juan Pérez', code: 'V001', ventanaName: 'Listero Centro', sales: 12000, commissions: 1200, tickets: 85, winners: 8, avgTicket: 141, winRate: 9.4 },
      { id: '2', name: 'María González', code: 'V002', ventanaName: 'Listero Norte', sales: 10500, commissions: 1050, tickets: 75, winners: 7, avgTicket: 140, winRate: 9.3 },
      { id: '3', name: 'Pedro Rodríguez', code: 'V003', ventanaName: 'Listero Sur', sales: 9800, commissions: 980, tickets: 70, winners: 6, avgTicket: 140, winRate: 8.6 },
    ],
  }

  const tabs: Array<{ value: TabType; label: string }> = [
    { value: 'ventana', label: 'Ventanas' },
    { value: 'loteria', label: 'Loterías' },
    { value: 'vendedor', label: 'Vendedores' },
  ]

  return (
    <Card padding="$4" gap="$3">
      {/* Tabs */}
      <XStack gap="$2" borderBottomWidth={1} borderColor="$borderColor" pb="$2">
        {tabs.map((tab) => (
          <Button
            key={tab.value}
            unstyled
            onPress={() => setActiveTab(tab.value)}
            px="$3"
            py="$2"
            backgroundColor={activeTab === tab.value ? '$blue4' : 'transparent'}
            borderRadius="$3"
            hoverStyle={{ backgroundColor: '$backgroundHover' }}
            pressStyle={{ scale: 0.98 }}
          >
            <Text
              fontSize="$4"
              fontWeight={activeTab === tab.value ? '600' : '400'}
              color={activeTab === tab.value ? '$blue10' : '$textSecondary'}
            >
              {tab.label}
            </Text>
          </Button>
        ))}
      </XStack>

      {/* Content */}
      <ScrollView maxHeight={400}>
        <YStack gap="$2">
          {activeTab === 'ventana' && (
            <>
              {mockData.ventana.map((item) => (
                <Card key={item.id} padding="$3" backgroundColor="$backgroundHover" borderColor="$borderColor" borderWidth={1}>
                  <XStack jc="space-between" ai="flex-start" gap="$3" flexWrap="wrap">
                    <YStack flex={1} minWidth={200}>
                      <Text fontSize="$5" fontWeight="600">{item.name}</Text>
                      <XStack gap="$3" mt="$2" flexWrap="wrap">
                        <YStack>
                          <Text fontSize="$2" color="$textSecondary">Ventas</Text>
                          <Text fontSize="$4" fontWeight="600">{formatCurrency(item.sales)}</Text>
                        </YStack>
                        <YStack>
                          <Text fontSize="$2" color="$textSecondary">Tickets</Text>
                          <Text fontSize="$4" fontWeight="600">{item.tickets.toLocaleString()}</Text>
                        </YStack>
                        <YStack>
                          <Text fontSize="$2" color="$textSecondary">Ganadores</Text>
                          <Text fontSize="$4" fontWeight="600">{item.winners}</Text>
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

          {activeTab === 'loteria' && (
            <>
              {mockData.loteria.map((item) => (
                <Card key={item.id} padding="$3" backgroundColor="$backgroundHover" borderColor="$borderColor" borderWidth={1}>
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
                          <Text fontSize="$2" color="$textSecondary">Rentabilidad</Text>
                          <Text fontSize="$4" fontWeight="600" color="$green10">{formatCurrency(item.profitability)}</Text>
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

          {activeTab === 'vendedor' && (
            <>
              {mockData.vendedor.map((item) => (
                <Card key={item.id} padding="$3" backgroundColor="$backgroundHover" borderColor="$borderColor" borderWidth={1}>
                  <XStack jc="space-between" ai="flex-start" gap="$3" flexWrap="wrap">
                    <YStack flex={1} minWidth={200}>
                      <Text fontSize="$5" fontWeight="600">{item.name}</Text>
                      <Text fontSize="$3" color="$textSecondary">{item.ventanaName} • {item.code}</Text>
                      <XStack gap="$3" mt="$2" flexWrap="wrap">
                        <YStack>
                          <Text fontSize="$2" color="$textSecondary">Ventas</Text>
                          <Text fontSize="$4" fontWeight="600">{formatCurrency(item.sales)}</Text>
                        </YStack>
                        <YStack>
                          <Text fontSize="$2" color="$textSecondary">Tickets</Text>
                          <Text fontSize="$4" fontWeight="600">{item.tickets}</Text>
                        </YStack>
                        <YStack>
                          <Text fontSize="$2" color="$textSecondary">Ticket Promedio</Text>
                          <Text fontSize="$4" fontWeight="600">{formatCurrency(item.avgTicket)}</Text>
                        </YStack>
                        <YStack>
                          <Text fontSize="$2" color="$textSecondary">Tasa Acierto</Text>
                          <Text fontSize="$4" fontWeight="600" color="$green10">{item.winRate.toFixed(1)}%</Text>
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

