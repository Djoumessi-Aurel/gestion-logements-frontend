import apiClient from './apiClient';

export type ExportFormat = 'excel' | 'pdf';

export interface ExportParams {
  format: ExportFormat;
  dateDebut?: string;
  dateFin?: string;
  batimentId?: number;
  logementId?: number;
}

// Tous les exports retournent un Blob — utiliser responseType: 'blob'
const blobConfig = { responseType: 'blob' as const };

export const exportApi = {
  paiements: (params: ExportParams) =>
    apiClient.get('/export/paiements', { params, ...blobConfig }),

  arrieres: (params: ExportParams) =>
    apiClient.get('/export/arrieres', { params, ...blobConfig }),

  logements: (params: ExportParams) =>
    apiClient.get('/export/logements', { params, ...blobConfig }),

  locataires: (params: ExportParams) =>
    apiClient.get('/export/locataires', { params, ...blobConfig }),

  batiments: (params: ExportParams) =>
    apiClient.get('/export/batiments', { params, ...blobConfig }),

  occupations: (params: ExportParams) =>
    apiClient.get('/export/occupations', { params, ...blobConfig }),

  // format: 'excel' uniquement — classeur multi-onglets
  complet: (params: Omit<ExportParams, 'format'>) =>
    apiClient.get('/export/complet', { params: { ...params, format: 'excel' }, ...blobConfig }),
};

// Utilitaire : déclenche le téléchargement d'un Blob dans le navigateur
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
