// hooks/useLoterias.ts
import { useQuery } from '@tanstack/react-query'
import { LoteriasApi } from '@/lib/api.loterias'
import type { ApiListResponse, Loteria } from '@/types/models.types'

export function useLoterias(params: { page?: number; pageSize?: number; search?: string } = {}) {
  return useQuery<ApiListResponse<Loteria>>({
    queryKey: ['loterias', 'list', params],
    queryFn: () => LoteriasApi.list(params),
    staleTime: 60_000,
    placeholderData: {
      success: true,
      data: [],
      meta: {
        page: params.page ?? 1,
        pageSize: params.pageSize ?? 50,
        total: 0,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
    },
  })
}
