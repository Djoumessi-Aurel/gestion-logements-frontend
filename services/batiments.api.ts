import apiClient from './apiClient';
import type { ApiResponse, ApiResponseList } from '@/types/api';
import type { Batiment, CreateBatimentDto, UpdateBatimentDto, BatimentDashboard } from '@/types/batiment';

export const batimentsApi = {
  getAll: () =>
    apiClient.get<ApiResponseList<Batiment>>('/batiments'),

  getById: (id: number) =>
    apiClient.get<ApiResponse<Batiment>>(`/batiments/${id}`),

  create: (dto: CreateBatimentDto) =>
    apiClient.post<ApiResponse<Batiment>>('/batiments', dto),

  update: (id: number, dto: UpdateBatimentDto) =>
    apiClient.patch<ApiResponse<Batiment>>(`/batiments/${id}`, dto),

  delete: (id: number) =>
    apiClient.delete<ApiResponse<null>>(`/batiments/${id}`),

  getDashboard: (id: number) =>
    apiClient.get<ApiResponse<BatimentDashboard>>(`/batiments/${id}/dashboard`),
};
