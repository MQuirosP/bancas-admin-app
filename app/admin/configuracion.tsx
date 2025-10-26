import React, { useState } from 'react';
import { YStack, Text, Switch, ScrollView, XStack } from 'tamagui';
import { Button, Input, Card } from '@/components/ui';
import { useRouter } from 'expo-router'
import { useTheme } from 'tamagui'
import { ArrowLeft } from '@tamagui/lucide-icons'

export default function ConfiguracionScreen() {
  const [defaultCutoff, setDefaultCutoff] = useState('5');
  const [enableDebug, setEnableDebug] = useState(false);
  const router = useRouter()
  const theme = useTheme()
  const iconColor = (theme?.color as any)?.get?.() ?? '#000'

  return (
    <ScrollView flex={1} backgroundColor="$background">
      <YStack padding="$4" gap="$4" maxWidth={600} alignSelf="center" width="100%">
        <XStack ai="center" gap="$2">
          <Button
            size="$3"
            icon={(p:any)=> <ArrowLeft {...p} size={24} color={iconColor} />}
            onPress={()=> router.push('/admin')}
            backgroundColor="transparent"
            borderWidth={0}
            hoverStyle={{ backgroundColor: 'transparent' }}
            pressStyle={{ scale: 0.98 }}
          />
          <Text fontSize="$8" fontWeight="bold" color="$color">
            Configuración Global
          </Text>
        </XStack>

        <Card padding="$4">
          <YStack gap="$4">
            <Text fontSize="$5" fontWeight="600">
              Parámetros del Sistema
            </Text>

            <YStack gap="$2">
              <Text fontSize="$4" fontWeight="500">
                Cutoff Predeterminado (minutos)
              </Text>
              <Input
                size="$4"
                value={defaultCutoff}
                onChangeText={setDefaultCutoff}
                keyboardType="number-pad"
              />
              <Text fontSize="$2" color="$textSecondary">
                Aplica cuando no hay reglas específicas
              </Text>
            </YStack>

            <XStack gap="$3" alignItems="center" mt="$2">
              <Switch
                size="$2"
                checked={enableDebug}
                onCheckedChange={(v) => setEnableDebug(!!v)}
                // visibles en web:
                bw={1}
                bc="$borderColor"
                bg={enableDebug ? '$color10' : '$background'}
                hoverStyle={{ bg: enableDebug ? '$color10' : '$backgroundHover' }}
                // (opcional) accesibilidad
                aria-label="Panel de Debug"
                focusStyle={{ outlineWidth: 2, outlineStyle: 'solid', outlineColor: 'var(--color10)' }}
              >
                <Switch.Thumb animation="quick" bg="$color12" />
              </Switch>

              <YStack flex={1} gap="$1">
                <Text fontSize="$4">Panel de Debug</Text>
                <Text fontSize="$2" color="$textSecondary">
                  Mostrar información de depuración en errores
                </Text>
              </YStack>
            </XStack>


            <Button variant="primary" marginTop="$3">
              Guardar Configuración
            </Button>
          </YStack>
        </Card>
      </YStack>
    </ScrollView>
  );
}
