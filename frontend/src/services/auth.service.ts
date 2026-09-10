import api from './api';
import { ILoginResponse } from '../../../shared/src/types';
import { isNative, refreshTokenStore } from '../utils/platform';

export const authService = {
  login: async (username: string, password: string): Promise<ILoginResponse> => {
    const { data } = await api.post<{ data: ILoginResponse }>('/auth/login', { username, password });
    // On native, persist the refresh token ourselves (cookies aren't reliable).
    if (isNative() && data.data.refreshToken) {
      refreshTokenStore.set(data.data.refreshToken);
    }
    return data.data;
  },

  logout: async (): Promise<void> => {
    // Native sends its stored refresh token so the server can clear/track it.
    const headers: Record<string, string> = {};
    if (isNative()) {
      const rt = refreshTokenStore.get();
      if (rt) headers['x-refresh-token'] = rt;
    }
    try {
      await api.post('/auth/logout', {}, { headers });
    } finally {
      localStorage.removeItem('accessToken');
      if (isNative()) refreshTokenStore.clear();
    }
  },

  refresh: async (): Promise<string> => {
    const headers: Record<string, string> = {};
    if (isNative()) {
      const rt = refreshTokenStore.get();
      if (rt) headers['x-refresh-token'] = rt;
    }
    const { data } = await api.post<{ data: { accessToken: string } }>(
      '/auth/refresh',
      {},
      { headers }
    );
    return data.data.accessToken;
  },
};
