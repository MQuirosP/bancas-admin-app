import { Text, YStack } from 'tamagui';
import { useLocalSearchParams } from 'expo-router';

export default function RestrictionDetailScreen() {
  const { id } = useLocalSearchParams();
  
  return (
    <YStack flex={1} padding="$4">
      <Text fontSize="$8" fontWeight="bold" marginBottom="$4">
        Detalle de Restricción
      </Text>
      <Text>ID: {id}</Text>
      <Text marginTop="$4" color="$textSecondary">
        TODO: Implementar detalle de restricción
      </Text>
    </YStack>
  );
}