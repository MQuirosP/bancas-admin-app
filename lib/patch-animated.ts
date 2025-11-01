// lib/patch-animated.ts
import { Platform } from 'react-native';

if (Platform.OS === 'web') {
  const originalWarn = console.warn;
  const originalError = console.error;
  
  // Lista de mensajes a filtrar (extensiones del navegador, etc.)
  const filteredWarnings = [
    'useNativeDriver',
    'background.js',
    '[PhishingDetectionService]',
    '[SignalR]',
    'WebAssembly is supported',
    'Migrator',
    'State version:',
    'Using WebPush',
    'Issue with web push',
    'Cannot find menu item',
    'Duplicate script ID',
    'fido2-page-script-registration',
    'runtime.lastError',
    'The page keeping the extension port',
    'Download the React DevTools',
    'Running application "main"',
    'Development-level warnings',
  ];

  console.warn = (...args: any[]) => {
    const message = args[0];
    if (typeof message === 'string') {
      const shouldFilter = filteredWarnings.some(filter => message.includes(filter));
      if (shouldFilter) {
        return; // Ignora estos warnings
      }
    }
    originalWarn(...args);
  };

  console.error = (...args: any[]) => {
    const message = args[0];
    if (typeof message === 'string') {
      const shouldFilter = filteredWarnings.some(filter => message.includes(filter)) ||
        message.includes('insertBefore') && message.includes('bootstrap-autofill-overlay');
      if (shouldFilter) {
        return; // Ignora estos errores de extensiones
      }
    }
    originalError(...args);
  };
}