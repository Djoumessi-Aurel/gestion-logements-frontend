import apiClient from './apiClient';
import type { ApiResponse, ApiResponseList } from '@/types/api';
import type { Utilisateur, CreateUtilisateurDto, UpdateUtilisateurDto } from '@/types/utilisateur';

export const usersApi = {
  getAll: () =>
    apiClient.get<ApiResponseList<Utilisateur>>('/users'),

  getById: (id: number) =>
    apiClient.get<ApiResponse<Utilisateur>>(`/users/${id}`),

  create: (dto: CreateUtilisateurDto) =>
    apiClient.post<ApiResponse<Utilisateur>>('/users', dto),

  update: (id: number, dto: UpdateUtilisateurDto) =>
    apiClient.patch<ApiResponse<Utilisateur>>(`/users/${id}`, dto),

  setActive: (id: number, isActive: boolean) =>
    apiClient.patch<ApiResponse<Utilisateur>>(`/users/${id}/activate`, { isActive }),

  resetPassword: (id: number, newPassword: string) =>
    apiClient.patch<ApiResponse<null>>(`/users/${id}/reset-password`, { newPassword }),

  // Attribution bâtiments (ADMIN_GLOBAL uniquement)
  assignBatiment: (userId: number, batimentId: number) =>
    apiClient.post<ApiResponse<null>>(`/users/${userId}/batiments/${batimentId}`),

  removeBatiment: (userId: number, batimentId: number) =>
    apiClient.delete<ApiResponse<null>>(`/users/${userId}/batiments/${batimentId}`),

  // Attribution logements (ADMIN_BATIMENT+)
  assignLogement: (userId: number, logementId: number) =>
    apiClient.post<ApiResponse<null>>(`/users/${userId}/logements/${logementId}`),

  removeLogement: (userId: number, logementId: number) =>
    apiClient.delete<ApiResponse<null>>(`/users/${userId}/logements/${logementId}`),
};
