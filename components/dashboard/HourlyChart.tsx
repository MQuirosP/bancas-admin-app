// components/dashboard/HourlyChart.tsx
import React from 'react';
import { YStack, Text, Card, XStack } from 'tamagui';
import { ScrollView } from 'react-native';

interface HourlyChartProps {
  data: Array<{
    hour: number;
    sales: number;
    ticketCount: number;
  }>;
}

export const HourlyChart: React.FC<HourlyChartProps> = ({ data }) => {
  const maxSales = Math.max(...data.map((d) => d.sales), 1);

  return (
    <Card elevate bordered backgroundColor="$backgroundStrong" padding="$4">
      <YStack gap="$3">
        <Text fontSize="$5" fontWeight="600" color="$textPrimary">
          Ventas por Hora
        </Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <XStack gap="$2" paddingVertical="$2">
            {data.map((item) => {
              const heightPercent = (item.sales / maxSales) * 100;
              const barHeight = Math.max(heightPercent * 1.5, 10); // Min 10px

              return (
                <YStack key={item.hour} alignItems="center" gap="$2" width={40}>
                  {/* Valor */}
                  <Text fontSize="$1" color="$textTertiary">
                    ${item.sales.toFixed(0)}
                  </Text>

                  {/* Barra */}
                  <YStack
                    backgroundColor={item.sales > 0 ? '$primary' : '$borderColor'}
                    width={32}
                    height={barHeight}
                    borderRadius="$2"
                    justifyContent="flex-end"
                    alignItems="center"
                  >
                    {item.ticketCount > 0 && (
                      <Text fontSize="$1" color="white" paddingBottom="$1">
                        {item.ticketCount}
                      </Text>
                    )}
                  </YStack>

                  {/* Label hora */}
                  <Text fontSize="$1" color="$textSecondary">
                    {item.hour.toString().padStart(2, '0')}h
                  </Text>
                </YStack>
              );
            })}
          </XStack>
        </ScrollView>

        <XStack justifyContent="space-between">
          <Text fontSize="$2" color="$textTertiary">
            Total: ${data.reduce((sum, d) => sum + d.sales, 0).toLocaleString()}
          </Text>
          <Text fontSize="$2" color="$textTertiary">
            Tickets: {data.reduce((sum, d) => sum + d.ticketCount, 0)}
          </Text>
        </XStack>
      </YStack>
    </Card>
  );
};