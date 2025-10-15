import { apiClient } from "../lib/api.client.js";
import { EvaluateSorteoRequest, Sorteo } from "../types/models.types.js";

export const sorteosService = {
  getAll: async (params?: { status?: string }): Promise<Sorteo[]> => {
    return apiClient.get<Sorteo[]>('/sorteos', params);
  },

  getById: async (id: string): Promise<Sorteo> => {
    return apiClient.get<Sorteo>(`/sorteos/${id}`);
  },

  open: async (id: string): Promise<Sorteo> => {
    return apiClient.patch<Sorteo>(`/sorteos/${id}/open`);
  },

  close: async (id: string): Promise<Sorteo> => {
    return apiClient.patch<Sorteo>(`/sorteos/${id}/close`);
  },

  evaluate: async (id: string, data: EvaluateSorteoRequest): Promise<Sorteo> => {
    return apiClient.patch<Sorteo>(`/sorteos/${id}/evaluate`, data);
  },
};