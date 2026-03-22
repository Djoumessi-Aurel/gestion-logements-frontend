import apiClient from './apiClient';
import type { ApiResponse, ApiResponseList } from '@/types/api';
import type { Occupation, CreateOccupationDto, UpdateOccupationDto, FinOccupationDto } from '@/types/occupation';
import type { Arriere } from '@/types/arriere';

export const occupationsApi = {
  getAll: () =>
    apiClient.get<ApiResponseList<Occupation>>('/occupations'),

  getById: (id: number) =>
    apiClient.get<ApiResponse<Occupation>>(`/occupations/${id}`),

  create: (dto: CreateOccupationDto) =>
    apiClient.post<ApiResponse<Occupation>>('/occupations', dto),

  update: (id: number, dto: UpdateOccupationDto) =>
    apiClient.patch<ApiResponse<Occupation>>(`/occupations/${id}`, dto),

  terminer: (id: number, dto: FinOccupationDto) =>
    apiClient.patch<ApiResponse<Occupation>>(`/occupations/${id}/fin`, dto),

  delete: (id: number) =>
    apiClient.delete<ApiResponse<null>>(`/occupations/${id}`),

  getArrieres: (id: number, date?: string) =>
    apiClient.get<ApiResponse<Arriere | null>>(`/occupations/${id}/arrieres`, {
      params: date ? { date } : undefined,
    }),

  uploadContrat: (id: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post<ApiResponse<Occupation>>(`/occupations/${id}/contrat`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  downloadContrat: (id: number) =>
    apiClient.get(`/occupations/${id}/contrat`, { responseType: 'blob' }),
};
