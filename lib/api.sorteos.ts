// lib/api.sorteos.ts
import { apiClient } from '@/lib/api.client'
import type { ApiListResponse, Sorteo } from '@/types/models.types'
import { compact } from '@/utils/object'

export type ListSorteosParams = {
  page?: number
  pageSize?: number
  loteriaId?: string
  search?: string
  status?: 'SCHEDULED' | 'OPEN' | 'EVALUATED' | 'CLOSED'
}

export type CreateSorteoBody = {
  name: string
  loteriaId: string
  scheduledAt: string // ISO 8601
}

export type EvaluateBody = {
  winningNumber: string             // requerido (00..99)
  extraMultiplierId?: string | null
  extraOutcomeCode?: string | null
}

export const SorteosApi = {
  list: (p: ListSorteosParams = {}): Promise<ApiListResponse<Sorteo>> => {
    const query = compact({
      page: p.page,
      pageSize: p.pageSize,
      loteriaId: p.loteriaId,
      status: p.status,
      search: p.search?.trim() || undefined,
    })
    return apiClient.get('/sorteos', query)
  },

  get: (id: string): Promise<Sorteo> => apiClient.get(`/sorteos/${id}`),

  create: (body: CreateSorteoBody): Promise<Sorteo> =>
    apiClient.post('/sorteos', body),

  update: (
    id: string,
    body: Partial<Pick<Sorteo, 'name' | 'scheduledAt' | 'extraOutcomeCode' | 'extraMultiplierId'>>
  ): Promise<Sorteo> => apiClient.put(`/sorteos/${id}`, compact(body)),

  open: (id: string): Promise<Sorteo> => apiClient.patch(`/sorteos/${id}/open`, {}),

  evaluate: (id: string, body: EvaluateBody): Promise<Sorteo> =>
    apiClient.patch(`/sorteos/${id}/evaluate`, body),

  close: (id: string): Promise<Sorteo> => apiClient.patch(`/sorteos/${id}/close`, {}),
}
