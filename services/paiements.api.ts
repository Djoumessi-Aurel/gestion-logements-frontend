import apiClient from './apiClient';
import type { ApiResponse, ApiResponsePaginated } from '@/types/api';
import type { Paiement, CreatePaiementOption1Dto, CreatePaiementOption2Dto, UpdatePaiementDto } from '@/types/paiement';

export const paiementsApi = {
  getAll: (params?: { page?: number; limit?: number }) =>
    apiClient.get<ApiResponsePaginated<Paiement>>('/paiements', { params }),

  getById: (id: number) =>
    apiClient.get<ApiResponse<Paiement>>(`/paiements/${id}`),

  createOption1: (dto: CreatePaiementOption1Dto) =>
    apiClient.post<ApiResponse<Paiement>>('/paiements/option1', dto),

  createOption2: (dto: CreatePaiementOption2Dto) =>
    apiClient.post<ApiResponse<Paiement>>('/paiements/option2', dto),

  update: (id: number, dto: UpdatePaiementDto) =>
    apiClient.patch<ApiResponse<Paiement>>(`/paiements/${id}`, dto),

  delete: (id: number) =>
    apiClient.delete<ApiResponse<null>>(`/paiements/${id}`),

  // Ajout de preuves (sans remplacer les existantes)
  addPreuves: (id: number, files: File[]) => {
    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));
    return apiClient.post<ApiResponse<Paiement>>(`/paiements/${id}/preuves`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // Remplacement de toutes les preuves
  replacePreuves: (id: number, files: File[]) => {
    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));
    return apiClient.patch<ApiResponse<Paiement>>(`/paiements/${id}/preuves`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
