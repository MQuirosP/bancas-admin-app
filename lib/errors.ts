// src/lib/errors.ts
import { ApiErrorClass } from '@/lib/api.client'

export function getErrorMessage(err: unknown): string {
  if (err instanceof ApiErrorClass) return err.message || 'Error en la petición'
  if (err instanceof Error) return err.message
  try { return JSON.stringify(err) } catch { return 'Error desconocido' }
}

export function isAuthError(err: unknown) {
  return err instanceof ApiErrorClass && (err.code === 'AUTH_EXPIRED' || err.message?.includes('Sesión expirada'))
}

// helper: await safe(promise)
export async function safe<T>(p: Promise<T>): Promise<[T|null, any]> {
  try { return [await p, null] } catch (e) { return [null, e] }
}
