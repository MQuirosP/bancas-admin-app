/**
 * Store de Zustand para filtros globales del Dashboard
 * Sincronizado con URL query params
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DashboardFilters, DatePreset, BetType } from '@/types/dashboard.types'

interface DashboardFiltersState extends DashboardFilters {
  // Mock mode flag
  mockMode: boolean
  setMockMode: (enabled: boolean) => void
  // Actions
  setDatePreset: (preset: DatePreset) => void
  setDateRange: (from: string, to: string) => void
  setVentanaId: (id: string | undefined) => void
  setLoteriaIds: (ids: string[]) => void
  addLoteriaId: (id: string) => void
  removeLoteriaId: (id: string) => void
  setBetType: (type: BetType) => void
  resetFilters: () => void
  loadFromURLParams: (params: URLSearchParams) => void
  toURLParams: () => URLSearchParams
}

const initialState: DashboardFilters = {
  date: 'today',
  fromDate: undefined,
  toDate: undefined,
  ventanaId: undefined,
  loteriaId: [],
  betType: 'all',
}

export const useDashboardFiltersStore = create<DashboardFiltersState>()(
  persist(
    (set, get) => ({
      ...initialState,
      mockMode: true, // Por defecto activado para usar datos mock

      setMockMode: (enabled) => set({ mockMode: enabled }),

      setDatePreset: (preset) => 
        set({ 
          date: preset, 
          fromDate: undefined, 
          toDate: undefined 
        }),

      setDateRange: (from, to) => 
        set({ 
          date: undefined, 
          fromDate: from, 
          toDate: to 
        }),

      setVentanaId: (id) => 
        set({ ventanaId: id }),

      setLoteriaIds: (ids) => 
        set({ loteriaId: ids }),

      addLoteriaId: (id) => 
        set((state) => ({ 
          loteriaId: [...(state.loteriaId || []), id] 
        })),

      removeLoteriaId: (id) => 
        set((state) => ({ 
          loteriaId: (state.loteriaId || []).filter((i) => i !== id) 
        })),

      setBetType: (type) => 
        set({ betType: type }),

      resetFilters: () => 
        set(initialState),

      loadFromURLParams: (params) => {
        const updates: Partial<DashboardFilters> = {}
        
        const date = params.get('date')
        if (date) updates.date = date as DatePreset
        
        const fromDate = params.get('fromDate')
        if (fromDate) updates.fromDate = fromDate
        
        const toDate = params.get('toDate')
        if (toDate) updates.toDate = toDate
        
        const ventanaId = params.get('ventanaId')
        if (ventanaId) updates.ventanaId = ventanaId
        
        const loteriaId = params.get('loteriaId')
        if (loteriaId) updates.loteriaId = loteriaId.split(',')
        
        const betType = params.get('betType')
        if (betType) updates.betType = betType as BetType
        
        set(updates)
      },

      toURLParams: () => {
        const state = get()
        const params = new URLSearchParams()
        
        if (state.date) params.set('date', state.date)
        if (state.fromDate) params.set('fromDate', state.fromDate)
        if (state.toDate) params.set('toDate', state.toDate)
        if (state.ventanaId) params.set('ventanaId', state.ventanaId)
        if (state.loteriaId && state.loteriaId.length > 0) {
          params.set('loteriaId', state.loteriaId.join(','))
        }
        if (state.betType && state.betType !== 'all') {
          params.set('betType', state.betType)
        }
        
        return params
      },
    }),
    {
      name: 'dashboard-filters',
      // Solo persistir los filtros, no las funciones
      partialize: (state) => ({
        date: state.date,
        fromDate: state.fromDate,
        toDate: state.toDate,
        ventanaId: state.ventanaId,
        loteriaId: state.loteriaId,
        betType: state.betType,
        mockMode: state.mockMode,
      }),
    }
  )
)

/**
 * Hook para sincronizar filtros con URL
 * Usar en el componente principal del dashboard
 */
export function useSyncFiltersWithURL() {
  const store = useDashboardFiltersStore()
  
  return {
    loadFromURL: (searchParams: URLSearchParams) => {
      store.loadFromURLParams(searchParams)
    },
    getURLParams: () => store.toURLParams(),
  }
}

