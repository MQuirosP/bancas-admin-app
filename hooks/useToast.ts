// hooks/useToast.ts
import { createContext, useCallback, useContext } from 'react'

export type ToastKind = 'success' | 'error' | 'info'

export type ShowToastOptions = {
  duration?: number // ms (default 3000)
}

export type ToastPayload = {
  id: string
  kind: ToastKind
  message: string
  createdAt: number
  duration: number
}

export type ToastContextValue = {
  show: (kind: ToastKind, message: string, opts?: ShowToastOptions) => void
  success: (message: string, opts?: ShowToastOptions) => void
  error: (message: string, opts?: ShowToastOptions) => void
  info: (message: string, opts?: ShowToastOptions) => void
}

export const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast must be used within <ToastProvider />')
  }
  return ctx
}

// Utilidad: generar ids simples
export const uid = () => Math.random().toString(36).slice(2, 9)

// Hook helper si alguna vez quieres usar fuera del provider (no recomendado)
export function useToastNoop(): ToastContextValue {
  const show = useCallback((_k: ToastKind, _m: string, _o?: ShowToastOptions) => {}, [])
  return {
    show,
    success: (_m, _o) => {},
    error: (_m, _o) => {},
    info: (_m, _o) => {},
  }
}
