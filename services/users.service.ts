// services/users.service.ts
import { apiClient } from '@/lib/api.client'
import type { Usuario, ApiListResponse, ApiItemResponse, MetaPage } from '@/types/models.types'
import { compact } from '../utils/object'

export type UsersQueryParams = {
  page?: number
  pageSize?: number
  role?: 'ADMIN' | 'VENTANA' | 'VENDEDOR'
  isActive?: boolean
  search?: string
}

export type CreateUserDTO = {
  name: string
  username: string
  email?: string | null
  code?: string | null
  role: 'ADMIN' | 'VENTANA' | 'VENDEDOR'
  ventanaId?: string | null
  password: string
  isActive?: boolean
}

export type UpdateUserDTO = Partial<{
  name: string
  email: string | null
  code: string | null
  role: 'ADMIN' | 'VENTANA' | 'VENDEDOR'
  ventanaId: string | null
  password: string
  isActive: boolean
}>

/** Helpers para soportar tanto {success,data,meta} como data plano */
function unwrapList<T>(res: unknown): { data: T[]; meta?: MetaPage } {
  const body = (res as any) ?? {}
  if (Array.isArray(body)) return { data: body }
  if (Array.isArray(body?.data)) return { data: body.data as T[], meta: body.meta }
  return { data: [] }
}

function unwrapItem<T>(res: unknown): T {
  const body = (res as any) ?? {}
  if (body?.data !== undefined) return body.data as T
  return body as T
}

/**
 * 🔧 Adaptadores desde valores del form (Usuario parcial) a DTOs del backend
 */
export function toCreateUserDTO(
  v: Partial<Usuario> & { password: string }
): CreateUserDTO {
  if (!v.name) throw new Error('name es requerido')
  if (!v.username) throw new Error('username es requerido')
  if (!v.role) throw new Error('role es requerido')

  const toNull = (x?: string | null) => (x && `${x}`.trim() !== '' ? `${x}`.trim() : null)

  return {
    name: v.name.trim(),
    username: v.username.trim(),
    email: toNull(v.email),
    code: toNull(v.code),
    role: v.role as CreateUserDTO['role'],
    ventanaId: toNull((v as any).ventanaId),
    password: v.password,
    isActive: v.isActive ?? true,
  }
}

export function toUpdateUserDTO(
  v: Partial<Usuario> & { password?: string }
): UpdateUserDTO {
  return {
    name: v.name,
    email: v.email ?? null,
    code: v.code ?? null,
    role: v.role as UpdateUserDTO['role'],
    ventanaId: (v as any).ventanaId ?? null,
    password: v.password,
    isActive: v.isActive,
  }
}

/**
 * 👇 Mantiene todas las funciones existentes y mismas firmas públicas
 * - list -> Promise<Usuario[]>  (internamente leerá {success,data,meta} y devolverá solo data)
 *   * si necesitas meta, expón otra función listWithMeta sin romper esta
 */
export const usersService = {
  // Mantiene firma: Promise<Usuario[]>
  list: async (params?: UsersQueryParams): Promise<Usuario[]> => {
    const res = await apiClient.get<ApiListResponse<Usuario> | Usuario[]>('/users', params)
    const { data } = unwrapList<Usuario>(res)
    return data
  },

  // Mantiene firmas: Promise<Usuario>
  detail: async (id: string): Promise<Usuario> => {
    const res = await apiClient.get<ApiItemResponse<Usuario> | Usuario>(`/users/${id}`)
    return unwrapItem<Usuario>(res)
  },

  getById: async (id: string): Promise<Usuario> => {
    const res = await apiClient.get<ApiItemResponse<Usuario> | Usuario>(`/users/${id}`)
    return unwrapItem<Usuario>(res)
  },

  create: async (payload: CreateUserDTO): Promise<Usuario> => {
    const res = await apiClient.post<ApiItemResponse<Usuario> | Usuario>('/users', payload)
    return unwrapItem<Usuario>(res)
  },

  update: async (id: string, payload: UpdateUserDTO): Promise<Usuario> => {
    const res = await apiClient.patch<ApiItemResponse<Usuario> | Usuario>(`/users/${id}`, compact(payload))
    return unwrapItem<Usuario>(res)
  },

  softDelete: async (id: string, reason?: string): Promise<Usuario> => {
    const res = reason?.trim()
      ? await apiClient.deleteWithBody<ApiItemResponse<Usuario> | Usuario>(`/users/${id}`, { reason })
      : await apiClient.delete<ApiItemResponse<Usuario> | Usuario>(`/users/${id}`)
    return unwrapItem<Usuario>(res)
  },

  restore: async (id: string): Promise<Usuario> => {
    const res = await apiClient.patch<ApiItemResponse<Usuario> | Usuario>(`/users/${id}/restore`, {})
    return unwrapItem<Usuario>(res)
  },
}

export type { Usuario }
