// components/ErrorBoundary.tsx
import React from 'react'
import { YStack, Text, Button, Card } from 'tamagui'

type Props = { children: React.ReactNode }
type State = { hasError: boolean; error?: any }

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error }
  }

  componentDidCatch(error: any, info: any) {
    // aquí puedes loguear a Sentry/Logtail/etc
    console.error('UI crash:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <YStack f={1} p="$4" ai="center" jc="center">
          <Card p="$4" bw={1} bc="$borderColor" bg="$backgroundHover" maw={520}>
            <Text fontSize="$7" fontWeight="700">Algo salió mal</Text>
            <Text mt="$2" color="$textSecondary">
              {String(this.state.error?.message ?? 'Error inesperado')}
            </Text>
            <Button mt="$4" onPress={() => this.setState({ hasError: false, error: undefined })}>
              <Text>Reintentar</Text>
            </Button>
          </Card>
        </YStack>
      )
    }
    return this.props.children
  }
}
