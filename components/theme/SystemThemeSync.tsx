import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { useThemeStore } from '../../store/theme.store';

type ThemeMode = 'light' | 'dark';

export function SystemThemeSync() {
  const colorScheme = useColorScheme() as ThemeMode;
  const setTheme = useThemeStore((state) => state.setTheme);
  
  useEffect(() => {
    if (colorScheme) {
      setTheme(colorScheme);
    }
  }, [colorScheme, setTheme]);
  
  return null; // Este componente no renderiza nada visible
}