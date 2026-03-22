import apiClient from './apiClient';
import type { ApiResponse } from '@/types/api';
import type { DashboardGlobal } from '@/types/dashboard';

export const dashboardApi = {
  getGlobal: () =>
    apiClient.get<ApiResponse<DashboardGlobal>>('/dashboard/global'),
};
