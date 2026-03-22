import apiClient from './apiClient';
import type { ApiResponse } from '@/types/api';
import type { AuthUser } from '@/store/authSlice';

interface LoginResponse {
  access_token: string;
  user: AuthUser;
}

interface MeResponse {
  id: number;
  nom: string;
  prenom: string;
  username: string;
  email?: string;
  telephone: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const authApi = {
  login: (username: string, password: string) =>
    apiClient.post<ApiResponse<LoginResponse>>('/auth/login', { username, password }),

  refresh: () =>
    apiClient.post<ApiResponse<LoginResponse>>('/auth/refresh'),

  logout: () =>
    apiClient.post<ApiResponse<null>>('/auth/logout'),

  me: () =>
    apiClient.get<ApiResponse<MeResponse>>('/auth/me'),

  forgotPassword: (username: string, email: string) =>
    apiClient.post<ApiResponse<null>>('/auth/forgot-password', { username, email }),

  resetPassword: (token: string, newPassword: string) =>
    apiClient.post<ApiResponse<null>>('/auth/reset-password', { token, newPassword }),

  changePassword: (currentPassword: string, newPassword: string) =>
    apiClient.patch<ApiResponse<null>>('/auth/change-password', { currentPassword, newPassword }),
};
