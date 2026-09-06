import api from './api';
import { IOwnerReportSummary, IEngineerReportSummary, IAdminReportSummary, ApiResponse } from '../../../shared/src/types';

export const reportService = {
  getOwnerReport: async (): Promise<IOwnerReportSummary & { recentCompleted: any[] }> => {
    const res = await api.get<ApiResponse<any>>('/reports/factory-owner');
    return res.data.data;
  },

  getEngineerReport: async (): Promise<IEngineerReportSummary & { recentCompleted: any[] }> => {
    const res = await api.get<ApiResponse<any>>('/reports/engineer');
    return res.data.data;
  },

  getAdminReport: async (): Promise<IAdminReportSummary & { totalRevenue: number }> => {
    const res = await api.get<ApiResponse<any>>('/reports/admin');
    return res.data.data;
  },
};
