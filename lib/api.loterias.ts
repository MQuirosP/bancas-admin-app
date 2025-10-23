// lib/api.loterias.ts
import { apiClient } from '@/lib/api.client'
import type { ApiListResponse, Loteria, MetaPage } from '@/types/models.types'

type Params = { page?: number; pageSize?: number; search?: string }

/**
 * El apiClient desenvuelve (si viene { data, meta }) y retorna solo `data`.
 * Aquí normalizamos para que SIEMPRE devolvamos { data, meta } al caller.
 */
export const LoteriasApi = {
  list: async (params: Params = {}): Promise<ApiListResponse<Loteria>> => {
    const res = await apiClient.get<any>('/loterias', params)

    // Caso A: apiClient ya desenvuelve y `res` es Array<Loteria>
    if (Array.isArray(res)) {
      const meta: MetaPage = {
        page: params.page ?? 1,
        pageSize: params.pageSize ?? 100,
        total: res.length,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      }
      return { success: true, data: res as Loteria[], meta }
    }

    // Caso B: por alguna razón llegó completo { success, data, meta }
    if (res && Array.isArray(res.data)) {
      return res as ApiListResponse<Loteria>
    }

    // Fallback defensivo
    return { success: true, data: [], meta: {
      page: 1, pageSize: params.pageSize ?? 100, total: 0, totalPages: 1, hasNextPage: false, hasPrevPage: false
    }}
  },
  getById: (id: string) => apiClient.get<{ data: any }>(`/loterias/${id}`),
  // PATCH parcial que acepte rulesJson
  update: (id: string, payload: Partial<{ name: string; isActive: boolean; rulesJson: any }>) =>
    apiClient.patch<{ data: any }>(`/loterias/${id}`, payload),
}
