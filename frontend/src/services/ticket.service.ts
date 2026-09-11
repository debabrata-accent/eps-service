import api from './api';
import { ITicket, ITicketCreate, PaginatedResponse, ApiResponse } from '../../../shared/src/types';

export const ticketService = {
  // Factory Owner
  create: async (data: ITicketCreate): Promise<ITicket> => {
    const res = await api.post<ApiResponse<ITicket>>('/tickets', data);
    return res.data.data;
  },

  submit: async (id: string): Promise<ITicket> => {
    const res = await api.patch<ApiResponse<ITicket>>(`/tickets/${id}/submit`);
    return res.data.data;
  },

  getMyTickets: async (params?: Record<string, string>): Promise<PaginatedResponse<ITicket>> => {
    const res = await api.get<PaginatedResponse<ITicket>>('/tickets/my', { params });
    return res.data;
  },

  approveQuote: async (id: string): Promise<ITicket> => {
    const res = await api.patch<ApiResponse<ITicket>>(`/tickets/${id}/approve-quote`);
    return res.data.data;
  },

  rejectQuote: async (id: string, note?: string): Promise<ITicket> => {
    const res = await api.patch<ApiResponse<ITicket>>(`/tickets/${id}/reject-quote`, { note });
    return res.data.data;
  },

  // TEMPORARY (testing): defer payment to on-site so the flow can continue without Razorpay
  payAtSite: async (id: string): Promise<ITicket> => {
    const res = await api.patch<ApiResponse<ITicket>>(`/tickets/${id}/pay-at-site`);
    return res.data.data;
  },

  createFollowUp: async (id: string, note: string): Promise<void> => {
    await api.post(`/tickets/${id}/follow-up`, { note });
  },

  // Customer Executive
  getAll: async (params?: Record<string, string>): Promise<PaginatedResponse<ITicket>> => {
    const res = await api.get<PaginatedResponse<ITicket>>('/tickets', { params });
    return res.data;
  },

  markUnderReview: async (id: string): Promise<ITicket> => {
    const res = await api.patch<ApiResponse<ITicket>>(`/tickets/${id}/review`);
    return res.data.data;
  },

  proposeCost: async (id: string, quotedAmount: number, advanceAmount?: number, note?: string): Promise<ITicket> => {
    const res = await api.patch<ApiResponse<ITicket>>(`/tickets/${id}/propose-cost`, {
      quotedAmount, advanceAmount, note,
    });
    return res.data.data;
  },

  approve: async (id: string): Promise<ITicket> => {
    const res = await api.patch<ApiResponse<ITicket>>(`/tickets/${id}/approve`);
    return res.data.data;
  },

  reject: async (id: string, reason?: string): Promise<ITicket> => {
    const res = await api.patch<ApiResponse<ITicket>>(`/tickets/${id}/reject`, { reason });
    return res.data.data;
  },

  cancel: async (id: string, note?: string): Promise<ITicket> => {
    const res = await api.patch<ApiResponse<ITicket>>(`/tickets/${id}/cancel`, { note });
    return res.data.data;
  },

  // Engineer
  getQueue: async (params?: Record<string, string>): Promise<PaginatedResponse<ITicket>> => {
    const res = await api.get<PaginatedResponse<ITicket>>('/tickets/queue', { params });
    return res.data;
  },

  selfAssign: async (id: string): Promise<ITicket> => {
    const res = await api.patch<ApiResponse<ITicket>>(`/tickets/${id}/assign`);
    return res.data.data;
  },

  getMyAssigned: async (params?: Record<string, string>): Promise<PaginatedResponse<ITicket>> => {
    const res = await api.get<PaginatedResponse<ITicket>>('/tickets/my-assigned', { params });
    return res.data;
  },

  updateEngineerStatus: async (id: string, engineerStatus: string, note?: string): Promise<ITicket> => {
    const res = await api.patch<ApiResponse<ITicket>>(`/tickets/${id}/engineer-status`, {
      engineerStatus, note,
    });
    return res.data.data;
  },

  // Shared
  getById: async (id: string): Promise<ITicket> => {
    const res = await api.get<ApiResponse<ITicket>>(`/tickets/${id}`);
    return res.data.data;
  },

  getHistory: async (id: string) => {
    const res = await api.get(`/tickets/${id}/history`);
    return res.data.data;
  },

  update: async (id: string, data: Partial<ITicketCreate>): Promise<ITicket> => {
    const res = await api.put<ApiResponse<ITicket>>(`/tickets/${id}`, data);
    return res.data.data;
  },
};
