// src/hooks/useVentanasInfinite.ts
import { useInfiniteQuery } from '@tanstack/react-query'
import { listVentanas, type Ventana, type Paginated } from '@/services/ventanas.service'

const PAGE_SIZE = 100 // el backend permite hasta 100

export function useVentanasInfinite(search: string) {
  return useInfiniteQuery<Paginated<Ventana>, Error>({
    queryKey: ['ventanas', 'infinite', { search }],
    initialPageParam: 1, // ⚠️ obligatorio en React Query v5
    queryFn: ({ pageParam }) =>
      listVentanas({
        page: Number(pageParam ?? 1),
        pageSize: PAGE_SIZE,
        search,
        // sin isActive: el filtro es en cliente
      }),
    getNextPageParam: (last) => {
      const { page, totalPages } = last.meta
      return page < totalPages ? page + 1 : undefined
    },
    staleTime: 60_000,
  })
}
