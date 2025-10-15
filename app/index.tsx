import { Redirect } from 'expo-router'
import { useAuthStore } from '@/store/auth.store'

export default function Index() {
  const user = useAuthStore((s) => s.user)

  if (!user) return <Redirect href="/(auth)/login" />

  const targetByRole: Record<string, string> = {
    ADMIN: '/admin/bancas',
    VENTANA: '/ventana/ventas',
    VENDEDOR: '/vendedor/tickets',
  }

  return <Redirect href={targetByRole[user.role] ?? '/(dashboard)'} />
}
