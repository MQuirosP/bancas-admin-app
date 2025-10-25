// services/ventanas.service.ts
import { apiClient } from '@/lib/api.client'

export type Ventana = {
  id: string
  bancaId: string
  name: string
  code?: string | null
  email?: string | null
  phone?: string | null
  address?: string | null
  commissionMarginX?: number | null
  isActive?: boolean
  // isDeleted?: boolean // <- planeas quitarlo del backend; lo dejamos fuera del flujo
}

export type VentanasQueryParams = {
  page: number
  pageSize: number
  search?: string
  isActive?: boolean
  bancaId?: string
}

export type Paginated<T> = {
  data: T[]
  meta: { page: number; pageSize: number; total: number; totalPages: number }
}

export async function listVentanas(params: VentanasQueryParams): Promise<Paginated<Ventana>> {
  const { page, pageSize, search, isActive, bancaId } = params

  // ✅ Nunca mandamos undefined y NO convertimos booleanos a string
  const query: Record<string, any> = {
    page: Number(page),
    pageSize: Number(pageSize),
  }
  if (typeof isActive === 'boolean') query.isActive = isActive
  if (bancaId) query.bancaId = bancaId
  if (search && search.trim()) query.search = search.trim()

  const res = await apiClient.get<any>('/ventanas', query)

  // Soportar las dos formas comunes: { data, meta } o array plano
  const data: Ventana[] = Array.isArray(res) ? res : (res?.data ?? [])
  const m = res?.meta ?? res?.pagination ?? {}
  const meta = {
    page: Number(m.page ?? page ?? 1),
    pageSize: Number(m.pageSize ?? pageSize ?? 20),
    total: Number(m.total ?? (Array.isArray(data) ? data.length : 0)),
    totalPages: Number(m.totalPages ?? 1),
  }
  return { data, meta }
}

export async function getVentana(id: string): Promise<Ventana> {
  const res = await apiClient.get<any>(`/ventanas/${id}`)
  return Array.isArray(res) ? (res[0] as Ventana) : (res?.data ?? res)
}

export type VentanaCreateDTO = Omit<Ventana, 'id'> & { isActive?: boolean }
export type VentanaUpdateDTO = Partial<VentanaCreateDTO>

export async function createVentana(payload: VentanaCreateDTO) {
  return apiClient.post('/ventanas', payload)
}

export async function updateVentana(id: string, payload: VentanaUpdateDTO) {
  return apiClient.put(`/ventanas/${id}`, payload)
}

export async function softDeleteVentana(id: string) {
  return apiClient.deleteWithBody(`/ventanas/${id}`, {})
}

// Si eliminas “isDeleted” del backend, también elimina cualquier uso de “restore”
export async function restoreVentana(id: string) {
  return apiClient.patch(`/ventanas/${id}/restore`, {})
}

/** util para combos rápidos */
export async function listBancasLite() {
  // ✅ Booleans reales en query
  const res = await apiClient.get<any>('/bancas', {
    page: 1,
    pageSize: 100,
    isActive: true,
  })
  const list = Array.isArray(res) ? res : res?.data ?? []
  return list.map((b: any) => ({ id: b.id, name: b.name })) as { id: string; name: string }[]
}
