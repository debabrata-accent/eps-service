import api from './api';
import { IUser, IUserCreate, IUserUpdate, ApiResponse, PaginatedResponse } from '../../../shared/src/types';

export const userService = {
  list: async (params?: Record<string, string>): Promise<PaginatedResponse<IUser>> => {
    const res = await api.get<PaginatedResponse<IUser>>('/users', { params });
    return res.data;
  },

  create: async (data: IUserCreate): Promise<IUser> => {
    const res = await api.post<ApiResponse<IUser>>('/users', data);
    return res.data.data;
  },

  getById: async (id: string): Promise<IUser> => {
    const res = await api.get<ApiResponse<IUser>>(`/users/${id}`);
    return res.data.data;
  },

  update: async (id: string, data: IUserUpdate): Promise<IUser> => {
    const res = await api.put<ApiResponse<IUser>>(`/users/${id}`, data);
    return res.data.data;
  },

  disable: async (id: string): Promise<IUser> => {
    const res = await api.patch<ApiResponse<IUser>>(`/users/${id}/disable`);
    return res.data.data;
  },
};
