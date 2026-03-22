import apiClient from './apiClient';
import type { ApiResponse } from '@/types/api';

interface UploadConfig {
  maxSizeMb: number;
  maxFiles: number;
  mimeTypes: string[];
}

export interface AppConfigData {
  upload: {
    contrat: UploadConfig;
    preuve: UploadConfig;
  };
}

export const configApi = {
  // Route publique — appelée au démarrage avant même le login
  get: () =>
    apiClient.get<ApiResponse<AppConfigData>>('/config'),
};
