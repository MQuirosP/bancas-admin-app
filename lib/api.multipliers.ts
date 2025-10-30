// lib/api.multipliers.ts
import { apiClient } from '@/lib/api.client'
import type { LoteriaMultiplier } from '@/types/api.types'

export type MultipliersQuery = {
  page?: number
  pageSize?: number
  search?: string
  loteriaId?: string
  kind?: 'NUMERO' | 'REVENTADO'
  isActive?: boolean
}

export type ApiListResponse<T> = {
  success?: boolean
  data: T[]
  meta?: any
}

export type CreateMultiplierRequest = {
  loteriaId: string
  name: string
  valueX: number
  kind: 'NUMERO' | 'REVENTADO'
  isActive: boolean
}

export type UpdateMultiplierRequest = Partial<CreateMultiplierRequest>

export const MultipliersApi = {
  async list(params: MultipliersQuery = {}): Promise<ApiListResponse<LoteriaMultiplier>> {
    const res = await apiClient.get<any>('/multipliers', params)
    // Normaliza ambos mundos: array plano vs objeto { data, meta }
    const items = Array.isArray(res) ? res : (res?.data ?? [])
    const meta  = Array.isArray(res) ? undefined : res?.meta
    return { data: items, meta, success: true }
  },

  get: (id: string) => apiClient.get<LoteriaMultiplier>(`/multipliers/${id}`),
  create: (body: any) => apiClient.post<LoteriaMultiplier>('/multipliers', body),
  update: (id: string, body: any) => apiClient.put<LoteriaMultiplier>(`/multipliers/${id}`, body),
  toggleActive: (id: string, isActive: boolean) =>
    apiClient.deleteWithBody(`/multipliers/${id}`, { isActive }),
}
