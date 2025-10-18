import { Text, YStack } from 'tamagui';
import { useLocalSearchParams } from 'expo-router';

export default function VentanaDetailScreen() {
  const { id } = useLocalSearchParams();
  
  return (
    <YStack flex={1} padding="$4">
      <Text fontSize="$8" fontWeight="bold" marginBottom="$4">
        Detalle de Ventana
      </Text>
      <Text>ID: {id}</Text>
      <Text marginTop="$4" color="$textSecondary">
        TODO: Implementar detalle de ventana
      </Text>
    </YStack>
  );
}