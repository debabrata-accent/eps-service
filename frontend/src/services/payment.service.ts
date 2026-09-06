import api from './api';
import { IPayment, ApiResponse, PaginatedResponse } from '../../../shared/src/types';

export const paymentService = {
  createOrder: async (ticketId: string) => {
    const res = await api.post<ApiResponse<{
      orderId: string;
      amount: number;
      currency: string;
      ticketNumber: string;
      paymentId: string;
    }>>('/payments/create-order', { ticketId });
    return res.data.data;
  },

  getByTicket: async (ticketId: string): Promise<IPayment> => {
    const res = await api.get<ApiResponse<IPayment>>(`/payments/ticket/${ticketId}`);
    return res.data.data;
  },

  listAll: async (params?: Record<string, string>): Promise<PaginatedResponse<IPayment>> => {
    const res = await api.get<PaginatedResponse<IPayment>>('/payments', { params });
    return res.data;
  },
};
