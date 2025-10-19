// components/ui/Toast.tsx
import React, { useMemo, useRef, useState, useCallback, useEffect } from 'react'
import { YStack, XStack, Text, Card, Separator, Button } from 'tamagui'
import { CheckCircle, Info, AlertTriangle, X } from '@tamagui/lucide-icons'
import { AnimatePresence } from '@tamagui/animate-presence'
import {
  ToastContext,
  type ToastPayload,
  type ToastKind,
  type ShowToastOptions,
  uid,
} from '@/hooks/useToast'

type Props = {
  children: React.ReactNode
  maxToasts?: number
  defaultDuration?: number
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
}

// Decide desde qué borde entra/sale según la esquina elegida
function getMotion(position: Props['position']) {
  const isTop = position?.includes('top')
  const isRight = position?.includes('right')
  const deltaY = isTop ? -12 : 12
  const deltaX = isRight ? 12 : -12
  return {
    enterStyle: { opacity: 0, y: deltaY, x: deltaX, scale: 0.98 },
    exitStyle:  { opacity: 0, y: deltaY, x: deltaX, scale: 0.98 },
  }
}

export function ToastProvider({
  children,
  maxToasts = 4,
  defaultDuration = 3000,
  position = 'top-right',
}: Props) {
  const [toasts, setToasts] = useState<ToastPayload[]>([])
  const timers = useRef<Record<string, any>>({})

  const show = useCallback(
    (kind: ToastKind, message: string, opts?: ShowToastOptions) => {
      const id = uid()
      const duration = opts?.duration ?? defaultDuration
      setToasts((prev) => [{ id, kind, message, createdAt: Date.now(), duration }, ...prev].slice(0, maxToasts))
      timers.current[id] = setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
        delete timers.current[id]
      }, duration)
    },
    [defaultDuration, maxToasts],
  )

  const success = useCallback((m: string, o?: ShowToastOptions) => show('success', m, o), [show])
  const error   = useCallback((m: string, o?: ShowToastOptions) => show('error', m, o), [show])
  const info    = useCallback((m: string, o?: ShowToastOptions) => show('info', m, o), [show])

  useEffect(() => {
    return () => {
      Object.values(timers.current).forEach(clearTimeout)
      timers.current = {}
    }
  }, [])

  const value = useMemo(() => ({ show, success, error, info }), [show, success, error, info])

  const posStyle: Record<string, any> = {
    position: 'fixed',
    zIndex: 1000,
    padding: 12,
    gap: 10,
    pointerEvents: 'none', // <- no bloquear clicks del resto de la UI
  }
  if (position.includes('top')) posStyle.top = 10
  if (position.includes('bottom')) posStyle.bottom = 10
  if (position.includes('right')) posStyle.right = 10
  if (position.includes('left')) posStyle.left = 10

  const { enterStyle, exitStyle } = getMotion(position)

  return (
    <ToastContext.Provider value={value}>
      {children}
      <YStack {...posStyle}>
        <AnimatePresence>
          {toasts.map((t) => (
            <ToastItem
              key={t.id}
              toast={t}
              position={position}
              enterStyle={enterStyle}
              exitStyle={exitStyle}
              onClose={() => {
                clearTimeout(timers.current[t.id])
                setToasts((prev) => prev.filter((x) => x.id !== t.id))
                delete timers.current[t.id]
              }}
            />
          ))}
        </AnimatePresence>
      </YStack>
    </ToastContext.Provider>
  )
}

function ToastItem({
  toast,
  onClose,
  position,        // no lo usamos directo ahora, pero lo dejamos por si ajustas más tarde
  enterStyle,
  exitStyle,
}: {
  toast: ToastPayload
  onClose: () => void
  position: Props['position']
  enterStyle: Record<string, any>
  exitStyle: Record<string, any>
}) {
  const { kind, message } = toast

  const palette =
    kind === 'success'
      ? { bg: '$green4', border: '$green8', iconColor: '$green11' }
      : kind === 'error'
      ? { bg: '$red4', border: '$red8', iconColor: '$red11' }
      : { bg: '$blue4', border: '$blue8', iconColor: '$blue11' }

  const Icon = kind === 'success' ? CheckCircle : kind === 'error' ? AlertTriangle : Info

  return (
    <Card
      elevate
      size="$3"
      bg={palette.bg}
      borderColor={palette.border}
      borderWidth={1}
      br="$8"
      p="$3"
      w={320}
      pointerEvents="auto"           // <- permitir click en el propio toast
      // ✨ animación de entrada/salida
      animation="medium"
      enterStyle={enterStyle}
      exitStyle={exitStyle}
      shadowColor="$shadowColor"
      shadowRadius={12}
      shadowOffset={{ width: 0, height: 4 }}
    >
      <XStack ai="center" jc="space-between" gap="$3">
        <XStack ai="center" gap="$2" f={1}>
          <Icon color={palette.iconColor} size={18} />
          <Text f={1}>{message}</Text>
        </XStack>

        <Button
          size="$2"
          circular
          chromeless
          aria-label="Cerrar notificación"
          onPress={onClose}
        >
          <X size={16} />
        </Button>
      </XStack>

      <Separator mt="$2" bc="$borderColor" />
    </Card>
  )
}
