import { ScrollView, Text, YStack } from 'tamagui'
import { useLocalSearchParams } from 'expo-router'

export default function BancaDetailScreen() {
  // Tipa los params para forzar string:
  const params = useLocalSearchParams<{ id?: string | string[] }>()
  const rawId = params.id
  const id = Array.isArray(rawId) ? rawId[0] : rawId

  return (
    <ScrollView flex={1} backgroundColor={'$background'}>
      <YStack flex={1} padding="$4" gap="$2">
        <Text fontSize="$8" fontWeight="bold" marginBottom="$4">
          Detalle de Banca
        </Text>
        <Text>ID: {id ?? '—'}</Text>
        {/* Usa un token existente de tu tema */}
        <Text marginTop="$4" color="$gray11">
          TODO: Implementar detalle de banca
        </Text>
      </YStack>
    </ScrollView>
  )
}
