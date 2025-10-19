// services/users.service.ts
import { apiClient } from '@/lib/api.client'
import type { Usuario } from '@/types/models.types'

export type UsersQueryParams = {
  page?: number
  pageSize?: number
  role?: 'ADMIN' | 'VENTANA' | 'VENDEDOR'
  isDeleted?: boolean
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

/**
 * 🔧 Adaptadores desde valores del form (Usuario parcial) a DTOs del backend
 */
export function toCreateUserDTO(
  v: Partial<Usuario> & { password: string }
): CreateUserDTO {
  if (!v.name) throw new Error('name es requerido')
  if (!v.username) throw new Error('username es requerido')
  if (!v.role) throw new Error('role es requerido')

  return {
    name: v.name,
    username: v.username,
    email: v.email ?? null,
    code: v.code ?? null,
    role: v.role as CreateUserDTO['role'],
    ventanaId: (v as any).ventanaId ?? null, // si lo tienes en el form
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
 * 👇 Importante: tu apiClient devuelve YA el `data` interno.
 * - list -> Usuario[]
 * - detail/getById -> Usuario
 */
export const usersService = {
  list: async (params?: UsersQueryParams) => {
    return apiClient.get<Usuario[]>('/users', params)
  },

  detail: async (id: string) => {
    return apiClient.get<Usuario>(`/users/${id}`)
  },

  getById: async (id: string) => {
    return apiClient.get<Usuario>(`/users/${id}`)
  },

  create: async (payload: CreateUserDTO) => {
    return apiClient.post<Usuario>('/users', payload)
  },

  update: async (id: string, payload: UpdateUserDTO) => {
    return apiClient.patch<Usuario>(`/users/${id}`, payload)
  },

  softDelete: async (id: string, reason?: string) => {
    return reason?.trim()
      ? apiClient.deleteWithBody<Usuario>(`/users/${id}`, { reason })
      : apiClient.delete<Usuario>(`/users/${id}`)
  },

  restore: async (id: string) => {
    return apiClient.patch<Usuario>(`/users/${id}/restore`, {})
  },
}

export type { Usuario }
