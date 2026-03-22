import apiClient from './apiClient';
import type { ApiResponse, ApiResponseList } from '@/types/api';
import type { Logement, Loyer, CreateLogementDto, UpdateLogementDto, CreateLoyerDto, LogementDashboard } from '@/types/logement';
import type { Occupation } from '@/types/occupation';

export const logementsApi = {
  getAll: () =>
    apiClient.get<ApiResponseList<Logement>>('/logements'),

  getById: (id: number) =>
    apiClient.get<ApiResponse<Logement>>(`/logements/${id}`),

  create: (dto: CreateLogementDto) =>
    apiClient.post<ApiResponse<Logement>>('/logements', dto),

  update: (id: number, dto: UpdateLogementDto) =>
    apiClient.patch<ApiResponse<Logement>>(`/logements/${id}`, dto),

  delete: (id: number) =>
    apiClient.delete<ApiResponse<null>>(`/logements/${id}`),

  getLoyers: (id: number) =>
    apiClient.get<ApiResponseList<Loyer>>(`/logements/${id}/loyers`),

  addLoyer: (id: number, dto: CreateLoyerDto) =>
    apiClient.post<ApiResponse<Loyer>>(`/logements/${id}/loyers`, dto),

  getOccupations: (id: number) =>
    apiClient.get<ApiResponseList<Occupation>>(`/logements/${id}/occupations`),

  getDashboard: (id: number) =>
    apiClient.get<ApiResponse<LogementDashboard>>(`/logements/${id}/dashboard`),
};
