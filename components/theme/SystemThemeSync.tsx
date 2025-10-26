import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { useThemeStore } from '../../store/theme.store';

function applyWebBackground() {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  const body = document.body
  const bg = getComputedStyle(root).getPropertyValue('--color-background') || '#000'
  root.style.backgroundColor = bg
  body.style.backgroundColor = bg
  root.style.height = '100%'
  body.style.minHeight = '100%'
  body.style.margin = '0'
}

type ThemeMode = 'light' | 'dark';

export function SystemThemeSync() {
  const colorScheme = useColorScheme() as ThemeMode;
  const setTheme = useThemeStore((state) => state.setTheme);
  
  useEffect(() => {
    if (colorScheme) {
      setTheme(colorScheme);
    }
  }, [colorScheme, setTheme]);
  
  // Asegura que el fondo de html/body se actualice con el tema activo en Web
  const theme = useThemeStore((s) => s.theme)
  useEffect(() => {
    applyWebBackground()
  }, [theme])
  
  return null; // Este componente no renderiza nada visible
}
