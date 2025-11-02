// lib/api.sorteos.ts
import { apiClient } from '@/lib/api.client'
import type { ApiListResponse, Sorteo } from '@/types/models.types'
import { compact } from '@/utils/object'
import { getDateParam, formatDateYYYYMMDD, type DateToken } from '@/lib/dateFormat'

export type ListSorteosParams = {
  page?: number
  pageSize?: number
  loteriaId?: string
  search?: string
  status?: 'SCHEDULED' | 'OPEN' | 'EVALUATED' | 'CLOSED'
  // Parámetros de fecha (tokens que el backend procesará)
  date?: DateToken
  fromDate?: string // YYYY-MM-DD para 'range'
  toDate?: string // YYYY-MM-DD para 'range'
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
    const query: any = compact({
      page: p.page,
      pageSize: p.pageSize,
      loteriaId: p.loteriaId,
      status: p.status,
      search: p.search?.trim() || undefined,
    })

    // Agregar parámetros de fecha si se proporcionan
    if (p.date) {
      if (p.date === 'range' && p.fromDate && p.toDate) {
        Object.assign(query, getDateParam('range', p.fromDate, p.toDate))
      } else {
        Object.assign(query, getDateParam(p.date))
      }
    }

    return apiClient.get('/sorteos', query)
  },

  get: (id: string): Promise<Sorteo> => apiClient.get(`/sorteos/${id}`),

  create: (body: CreateSorteoBody): Promise<Sorteo> =>
    apiClient.post('/sorteos', body),

  update: (
    id: string,
    body: Partial<Pick<Sorteo, 'name' | 'scheduledAt' | 'extraOutcomeCode' | 'extraMultiplierId'>>
  ): Promise<Sorteo> => apiClient.patch(`/sorteos/${id}`, compact(body)),

  open: (id: string): Promise<Sorteo> => apiClient.patch(`/sorteos/${id}/open`, {}),

  evaluate: (id: string, body: EvaluateBody): Promise<Sorteo> =>
    apiClient.patch(`/sorteos/${id}/evaluate`, body),

  close: (id: string): Promise<Sorteo> => apiClient.patch(`/sorteos/${id}/close`, {}),
}
