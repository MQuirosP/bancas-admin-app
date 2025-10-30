// components/ui/Badge.tsx
import { styled, Text, XStack } from 'tamagui'

export const Badge = styled(XStack, {
  ai: 'center',
  jc: 'center',
  gap: '$1',
  px: '$2',
  py: 2,
  br: '$2',
  borderWidth: 1,
  borderColor: '$borderColor',
  bg: '$backgroundStrong',
})

export function RoleBadge({ role }: { role: 'ADMIN' | 'VENTANA' | 'VENDEDOR' }) {
  const palette =
    role === 'ADMIN'
      ? { bg: '$indigo3',  bc: '$indigo10',  color: '$indigo10' }
      : role === 'VENTANA'
      ? { bg: '$cyan3',    bc: '$cyan10',    color: '$cyan10' }
      : role === 'VENDEDOR' ? { bg: '$orange3',   bc: '$orange10',   color: '$orange10' }
      : { bg: '$backgroundStrong', bc: '$textSecondary', color: '$textSecondary' }

  const roleLabels = { ADMIN: 'ADMIN', VENTANA: 'LISTERO', VENDEDOR: 'VENDEDOR' }
  const displayRole = roleLabels[role] || role

  return (
    <Badge bg={palette.bg} borderColor={palette.bc}>
      <Text fontSize="$2" color={palette.color} fontWeight="700">{displayRole}</Text>
    </Badge>
  )
}

export function StatusPill({ active }: { active: boolean }) {
  return (
    <XStack ai="center" gap="$1" px="$2" py={2} br="$2" bg={active ? '$backgroundHover' : '$background'} borderWidth={1} borderColor="$borderColor">
      <XStack w={8} h={8} br={9999} bg={active ? '$success' : '$error'} />
      <Text fontSize="$2" color={active ? '$textSecondary' : '$error'}>{active ? 'Activo' : 'Inactivo'}</Text>
    </XStack>
  )
}
