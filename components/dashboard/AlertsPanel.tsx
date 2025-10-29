/**
 * Alerts Panel para Dashboard
 */

import React from 'react'
import { YStack, XStack, Text, ScrollView } from 'tamagui'
import { Card } from '@/components/ui'
import { AlertCircle, AlertTriangle, Info, XCircle } from '@tamagui/lucide-icons'
import type { DashboardAlert, AlertSeverity } from '@/types/dashboard.types'

interface AlertsPanelProps {
  alerts: DashboardAlert[]
  isLoading?: boolean
}

export function AlertsPanel({ alerts, isLoading }: AlertsPanelProps) {
  if (isLoading) {
    return (
      <Card padding="$4">
        <YStack height={200} br="$3" backgroundColor="$backgroundHover" animation="quick" opacity={0.5} />
      </Card>
    )
  }

  if (!alerts || alerts.length === 0) {
    return (
      <Card padding="$4" ai="center" jc="center" minHeight={200}>
        <Info size={48} color="$textSecondary" opacity={0.5} />
        <Text color="$textSecondary" mt="$2">Sin alertas en este momento</Text>
      </Card>
    )
  }

  return (
    <Card padding="$4" gap="$3">
      <Text fontSize="$5" fontWeight="600">
        Alertas ({alerts.length})
      </Text>

      <ScrollView maxHeight={400}>
        <YStack gap="$2">
          {alerts.map((alert, index) => (
            <AlertItem key={alert.id || `alert-${index}`} alert={alert} />
          ))}
        </YStack>
      </ScrollView>
    </Card>
  )
}

function AlertItem({ alert }: { alert: DashboardAlert }) {
  const { icon: Icon, color, bgColor } = getAlertStyle(alert.severity)

  return (
    <XStack
      padding="$3"
      br="$3"
      backgroundColor={bgColor}
      borderWidth={1}
      borderColor={color}
      gap="$3"
      ai="flex-start"
    >
      <YStack
        width={40}
        height={40}
        br="$2"
        backgroundColor="$background"
        ai="center"
        jc="center"
      >
        <Icon size={20} color={color} />
      </YStack>

      <YStack flex={1} gap="$1">
        <XStack ai="center" gap="$2">
          <Text fontSize="$3" fontWeight="600" color={color}>
            {alert.severity}
          </Text>
          {alert.entity && (
            <Text fontSize="$2" color="$textSecondary">
              {alert.entity.type}: {alert.entity.name}
            </Text>
          )}
        </XStack>

        <Text fontSize="$3" color="$textPrimary">
          {alert.message}
        </Text>

        {alert.suggestedAction && (
          <Text fontSize="$2" color="$textSecondary" mt="$1">
            💡 {alert.suggestedAction}
          </Text>
        )}
      </YStack>
    </XStack>
  )
}

function getAlertStyle(severity: AlertSeverity) {
  switch (severity) {
    case 'CRITICAL':
      return { icon: XCircle, color: '$red10', bgColor: '$red2' }
    case 'HIGH':
      return { icon: AlertCircle, color: '$orange10', bgColor: '$orange2' }
    case 'MEDIUM':
      return { icon: AlertTriangle, color: '$yellow10', bgColor: '$yellow2' }
    case 'LOW':
    default:
      return { icon: Info, color: '$blue10', bgColor: '$blue2' }
  }
}

