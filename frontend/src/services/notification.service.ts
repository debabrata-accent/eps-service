import api from './api';
import { INotification } from '../../../shared/src/types';

interface NotificationsResponse {
  success: boolean;
  data: INotification[];
  unreadCount: number;
  pagination: { total: number; page: number; limit: number; totalPages: number };
}

export const notificationService = {
  getAll: async (): Promise<NotificationsResponse> => {
    const res = await api.get<NotificationsResponse>('/notifications');
    return res.data;
  },

  markRead: async (id: string): Promise<void> => {
    await api.patch(`/notifications/${id}/read`);
  },

  markAllRead: async (): Promise<void> => {
    await api.patch('/notifications/read-all');
  },

  updateFcmToken: async (fcmToken: string): Promise<void> => {
    await api.put('/users/me/fcm-token', { fcmToken });
  },
};
