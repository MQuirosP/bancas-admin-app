// lib/api.restrictions.ts
import { apiClient } from '@/lib/api.client'
import type { RestrictionRule } from '@/types/models.types'

export type ListRestrictionsParams = {
  bancaId?: string
  ventanaId?: string
  userId?: string
  number?: string
  isActive?: boolean
  page?: number
  pageSize?: number
  hasCutoff?: boolean
  hasAmount?: boolean
}

export type ListResponse<T> = { data: T[]; meta?: { page: number; pageSize: number; total: number; pages: number } }

export async function listRestrictions(params: ListRestrictionsParams = {}) {
  return apiClient.get<ListResponse<RestrictionRule>>('/restrictions', params)
}

export async function getRestriction(id: string) {
  return apiClient.get<{ data: RestrictionRule }>(`/restrictions/${id}`)
}

export async function createRestriction(payload: Partial<RestrictionRule>) {
  return apiClient.post<{ data: RestrictionRule }>('/restrictions', payload)
}

export async function updateRestriction(id: string, payload: Partial<RestrictionRule>) {
  return apiClient.patch<{ data: RestrictionRule }>(`/restrictions/${id}`, payload)
}

export async function deleteRestriction(id: string, reason?: string) {
  return apiClient.delete<{ data: RestrictionRule }>(`/restrictions/${id}`)
}

export async function restoreRestriction(id: string) {
  return apiClient.patch<{ data: RestrictionRule }>(`/restrictions/${id}/restore`, {})
}
