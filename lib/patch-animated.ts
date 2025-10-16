// lib/patch-animated.ts
import { Platform } from 'react-native';

if (Platform.OS === 'web') {
  const originalWarn = console.warn;
  console.warn = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('useNativeDriver')
    ) {
      return; // Ignora este warning específico
    }
    originalWarn(...args);
  };
}