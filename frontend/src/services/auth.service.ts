import api from './api';
import { ILoginResponse } from '../../../shared/src/types';

export const authService = {
  login: async (username: string, password: string): Promise<ILoginResponse> => {
    const { data } = await api.post<{ data: ILoginResponse }>('/auth/login', { username, password });
    return data.data;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
    localStorage.removeItem('accessToken');
  },

  refresh: async (): Promise<string> => {
    const { data } = await api.post<{ data: { accessToken: string } }>('/auth/refresh');
    return data.data.accessToken;
  },
};
