import { apiClient } from "../lib/api.client";
import { PaginatedResponse, Ticket, CreateTicketRequest } from "../types/models.types";

export const ticketsService = {
  getAll: async (params?: {
    scope?: 'mine' | 'ventana' | 'global';
    date?: string;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse<Ticket>> => {
    return apiClient.get<PaginatedResponse<Ticket>>('/tickets', params);
  },

  getById: async (id: string): Promise<Ticket> => {
    return apiClient.get<Ticket>(`/tickets/${id}`);
  },

  create: async (data: CreateTicketRequest): Promise<Ticket> => {
    return apiClient.post<Ticket>('/tickets', data);
  },

  getMine: async (date?: string): Promise<Ticket[]> => {
    return apiClient.get<Ticket[]>('/tickets', { scope: 'mine', date: date || 'today' });
  },
};