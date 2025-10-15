// App.tsx
import 'react-native-reanimated'; // debe ir al tope si usas Reanimated
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TamaguiProvider, Button, YStack, Text } from 'tamagui';
import { Moon, Sun } from '@tamagui/lucide-icons';
import config from './tamagui.config.js';

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <TamaguiProvider config={config} defaultTheme={theme}>
        <SafeAreaView style={{ flex: 1 }}>
          <YStack f={1} ai="center" jc="center" gap="$4" px="$4">
            <Text fos="$8" ff="$body">¡Hola Tamagui + Expo!</Text>

            <Button
              icon={theme === 'light' ? <Moon /> : <Sun />}
              onPress={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            >
              Cambiar a {theme === 'light' ? 'dark' : 'light'}
            </Button>

            <StatusBar style={theme === 'light' ? 'dark' : 'light'} />
          </YStack>
        </SafeAreaView>
      </TamaguiProvider>
    </GestureHandlerRootView>
  );
}
