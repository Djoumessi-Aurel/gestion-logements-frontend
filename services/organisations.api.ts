import apiClient from './apiClient';
import type { ApiResponse } from '@/types/api';
import type { OrganisationUsage } from '@/types/organisation';

export const organisationsApi = {
  // Réservé à ADMIN_GLOBAL côté backend
  getMine: () =>
    apiClient.get<ApiResponse<OrganisationUsage>>('/organisations/me'),
};
