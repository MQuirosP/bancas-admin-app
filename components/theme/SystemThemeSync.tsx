import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { useThemeStore } from '../../store/theme.store';
import { useAuthStore } from '../../store/auth.store';

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
  const { setTheme, theme } = useThemeStore();
  const { user } = useAuthStore();
  
  // Cargar el tema desde user.settings si existe
  useEffect(() => {
    if (user?.settings?.theme && theme !== user.settings.theme) {
      setTheme(user.settings.theme);
    }
  }, [user?.settings?.theme, theme, setTheme]);
  
  // Sincronizar con el esquema del sistema solo si no hay tema guardado en user.settings
  useEffect(() => {
    if (colorScheme && !user?.settings?.theme) {
      setTheme(colorScheme);
    }
  }, [colorScheme, setTheme, user?.settings?.theme]);
  
  // Asegura que el fondo de html/body se actualice con el tema activo en Web
  useEffect(() => {
    applyWebBackground()
  }, [theme])
  
  return null; // Este componente no renderiza nada visible
}
