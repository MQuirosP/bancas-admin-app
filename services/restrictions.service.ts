import { apiClient } from "../lib/api.client.js";
import { RestrictionRule } from "../types/models.types.js";

export const restrictionsService = {
  getAll: async (): Promise<RestrictionRule[]> => {
    return apiClient.get<RestrictionRule[]>('/restrictions');
  },

  getById: async (id: string): Promise<RestrictionRule> => {
    return apiClient.get<RestrictionRule>(`/restrictions/${id}`);
  },

  create: async (data: Partial<RestrictionRule>): Promise<RestrictionRule> => {
    return apiClient.post<RestrictionRule>('/restrictions', data);
  },

  update: async (id: string, data: Partial<RestrictionRule>): Promise<RestrictionRule> => {
    return apiClient.patch<RestrictionRule>(`/restrictions/${id}`, data);
  },

  delete: async (id: string): Promise<void> => {
    return apiClient.delete<void>(`/restrictions/${id}`);
  },
};