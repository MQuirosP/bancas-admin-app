// hooks/useMultipliersCrud.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MultipliersApi, type MultipliersQuery, type CreateMultiplierRequest, type UpdateMultiplierRequest } from '@/lib/api.multipliers'
import type { LoteriaMultiplier } from '@/types/api.types'

export function useMultipliersQuery(params?: MultipliersQuery) {
  return useQuery({
    queryKey: ['multipliers', 'list', params],
    queryFn: () => MultipliersApi.list(params ?? {}),
  })
}

export function useMultiplierQuery(id?: string) {
  return useQuery({
    queryKey: ['multipliers', id],
    queryFn: () => MultipliersApi.get(id!),
    enabled: !!id,
  })
}

export function useCreateMultiplier() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateMultiplierRequest) => MultipliersApi.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['multipliers'] }),
  })
}

export function useUpdateMultiplier(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: UpdateMultiplierRequest) => MultipliersApi.update(id, body),
    onSuccess: (data: LoteriaMultiplier) => {
      qc.setQueryData(['multipliers', id], data)
      qc.invalidateQueries({ queryKey: ['multipliers', 'list'] })
    },
  })
}

export function useDeleteMultiplier() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => MultipliersApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['multipliers'] }),
  })
}
