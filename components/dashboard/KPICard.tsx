// components/dashboard/KPICard.tsx
import React from 'react';
import { YStack, XStack, Text, Card } from 'tamagui';
import type { IconProps } from '@tamagui/helpers-icon';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ComponentType<IconProps>;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: string;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = '$primary',
}) => {
  return (
    <Card
      elevate
      size="$4"
      bordered
      backgroundColor="$backgroundStrong"
      padding="$4"
      flex={1}
      minWidth={200}
    >
      <YStack gap="$2">
        {/* Header con ícono */}
        <XStack justifyContent="space-between" alignItems="center">
          <Text fontSize="$3" color="$textSecondary" fontWeight="500">
            {title}
          </Text>
          {Icon && <Icon size={20} color={color} />}
        </XStack>

        {/* Valor principal */}
        <Text fontSize="$8" fontWeight="700" color="$textPrimary">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </Text>

        {/* Subtítulo o trend */}
        <XStack gap="$2" alignItems="center">
          {trend && (
            <Text
              fontSize="$2"
              color={trend.isPositive ? '$success' : '$error'}
              fontWeight="600"
            >
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </Text>
          )}
          {subtitle && (
            <Text fontSize="$2" color="$textTertiary">
              {subtitle}
            </Text>
          )}
        </XStack>
      </YStack>
    </Card>
  );
};