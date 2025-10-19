// hooks/useUsers.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  usersService,
  type UsersQueryParams,
  type CreateUserDTO,
  type UpdateUserDTO,
  toCreateUserDTO,
  toUpdateUserDTO,
} from '@/services/users.service'
import type { Usuario } from '@/types/models.types'
import { ApiErrorClass } from '@/lib/api.client'

export const queryKeys = {
  users: {
    root: ['users'] as const,
    list: (params?: UsersQueryParams) => ['users', 'list', params] as const,
    detail: (id: string) => ['users', 'detail', id] as const,
  },
}

export function useUsersQuery(params?: UsersQueryParams) {
  return useQuery({
    queryKey: queryKeys.users.list(params),
    queryFn: () => usersService.list(params), // -> Promise<Usuario[]>
    staleTime: 60_000,
  })
}

export function useUserQuery(id?: string) {
  return useQuery({
    queryKey: id ? queryKeys.users.detail(id) : ['users', 'detail', 'nil'],
    queryFn: () => usersService.detail(id as string), // -> Promise<Usuario>
    enabled: !!id,
  })
}

export function useCreateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (formValues: Partial<Usuario> & { password: string }) =>
      usersService.create(toCreateUserDTO(formValues)), // ✅ usa adaptador
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.users.root })
    },
  })
}

export function useUpdateUser(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (formValues: Partial<Usuario> & { password?: string }) =>
      usersService.update(id, toUpdateUserDTO(formValues)), // ✅ usa adaptador
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.users.detail(id) })
      qc.invalidateQueries({ queryKey: queryKeys.users.root })
    },
  })
}

export function useSoftDeleteUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      usersService.softDelete(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.users.root })
    },
    onError: (err: ApiErrorClass) => {
      console.error(err)
    },
  })
}

export function useRestoreUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => usersService.restore(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.users.root })
    },
  })
}
