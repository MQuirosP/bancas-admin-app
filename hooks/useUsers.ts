// hooks/useUsers.ts
import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  usersService,
  type UsersQueryParams,
  toCreateUserDTO,
  toUpdateUserDTO,
} from '@/services/users.service'
import type { Usuario } from '@/types/models.types'
import { useToast } from '@/hooks/useToast'
import { getErrorMessage } from '@/lib/errors'

export const queryKeys = {
  users: {
    root: ['users'] as const,
    list: (params?: UsersQueryParams) => ['users', 'list', params] as const,
    detail: (id: string) => ['users', 'detail', id] as const,
  },
}

export function useUsersQuery(params?: UsersQueryParams) {
  const toast = useToast()
  const q = useQuery<Usuario[], Error>({
    queryKey: queryKeys.users.list(params),
    queryFn: () => usersService.list(params), // -> Promise<Usuario[]>
    staleTime: 60_000,
    retry: 0,
  })

  useEffect(() => {
    if (q.error) toast.error(getErrorMessage(q.error))
  }, [q.error, toast])

  return q
}

export function useUserQuery(id?: string) {
  const toast = useToast()
  const q = useQuery<Usuario, Error>({
    queryKey: id ? queryKeys.users.detail(id) : ['users', 'detail', 'nil'],
    queryFn: () => usersService.detail(id as string), // -> Promise<Usuario>
    enabled: !!id,
    retry: 0,
  })

  useEffect(() => {
    if (q.error) toast.error(getErrorMessage(q.error))
  }, [q.error, toast])

  return q
}

export function useCreateUser() {
  const qc = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: (formValues: any) =>
      usersService.create(
        toCreateUserDTO(formValues as Partial<Usuario> & { password: string })
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.users.root })
    },
    onError: (e) => {
      toast.error(getErrorMessage(e))
    },
  })
}

export function useUpdateUser(id: string) {
  const qc = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: (formValues: any) =>
      usersService.update(
        id,
        toUpdateUserDTO(formValues as Partial<Usuario> & { password?: string })
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.users.detail(id) })
      qc.invalidateQueries({ queryKey: queryKeys.users.root })
    },
    onError: (e) => {
      toast.error(getErrorMessage(e))
    },
  })
}

export function useSoftDeleteUser() {
  const qc = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      usersService.softDelete(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.users.root })
    },
    onError: (e) => {
      toast.error(getErrorMessage(e))
    },
  })
}

export function useRestoreUser() {
  const qc = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: (id: string) => usersService.restore(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.users.root })
    },
    onError: (e) => {
      toast.error(getErrorMessage(e))
    },
  })
}
