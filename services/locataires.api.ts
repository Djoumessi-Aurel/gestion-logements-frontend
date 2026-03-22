import apiClient from './apiClient';
import type { ApiResponse, ApiResponseList } from '@/types/api';
import type { Locataire, CreateLocataireDto, UpdateLocataireDto, LocataireDashboard } from '@/types/locataire';

export const locatairesApi = {
  getAll: () =>
    apiClient.get<ApiResponseList<Locataire>>('/locataires'),

  getById: (id: number) =>
    apiClient.get<ApiResponse<Locataire>>(`/locataires/${id}`),

  create: (dto: CreateLocataireDto) =>
    apiClient.post<ApiResponse<Locataire>>('/locataires', dto),

  update: (id: number, dto: UpdateLocataireDto) =>
    apiClient.patch<ApiResponse<Locataire>>(`/locataires/${id}`, dto),

  delete: (id: number) =>
    apiClient.delete<ApiResponse<null>>(`/locataires/${id}`),

  getDashboard: (id: number) =>
    apiClient.get<ApiResponse<LocataireDashboard>>(`/locataires/${id}/dashboard`),
};
