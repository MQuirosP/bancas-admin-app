// app/(dashboard)/_layout.tsx
import { Stack } from 'expo-router'

export default function DashboardLayout() {
  // Nada de Header/Drawer/Footer/Theme aquí.
  // Solo definimos las pantallas de este grupo.
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  )
}
