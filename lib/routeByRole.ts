import type { UserRole } from '@/types/auth.types'

export const routeByRole = (role?: UserRole) => {
  switch (role) {
    case 'ADMIN':
      return '/admin'              // panel principal admin
    case 'VENTANA':
      return '/ventana'            // dashboard ventana
    case 'VENDEDOR':
      return '/vendedor'           // dashboard vendedor
    default:
      return '/(dashboard)'        // fallback genérico (si lo usas)
  }
}
