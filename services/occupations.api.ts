import apiClient from './apiClient';
import type { ApiResponse, ApiResponseList } from '@/types/api';
import type { Occupation, CreateOccupationDto, UpdateOccupationDto, FinOccupationDto, OccupationDashboard } from '@/types/occupation';
import type { Arriere } from '@/types/arriere';

export interface SignedUrlResponse {
  url: string;
  fileName: string;
  mimeType: string;
  expiresIn: number;
}

/**
 * Télécharge un fichier depuis une URL signée (potentiellement cross-origin)
 * en passant par fetch() pour créer un blob URL local.
 * L'attribut `download` ne fonctionne que sur les URLs same-origin —
 * cette fonction contourne cette limitation.
 */
export async function downloadFromSignedUrl(url: string, fileName: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Téléchargement échoué (${response.status})`);
  const blob    = await response.blob();
  const blobUrl = URL.createObjectURL(blob);
  const link    = document.createElement('a');
  link.href     = blobUrl;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(blobUrl);
}

export const occupationsApi = {
  // statut: 0 = en cours (dateFin IS NULL), 1 = terminées (dateFin IS NOT NULL), absent = toutes
  getAll: (statut?: 0 | 1) =>
    apiClient.get<ApiResponseList<Occupation>>('/occupations', {
      params: statut !== undefined ? { statut } : undefined,
    }),

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

  // Retourne une URL signée temporaire — plus de streaming blob
  getContratUrl: (id: number) =>
    apiClient.get<ApiResponse<SignedUrlResponse>>(`/occupations/${id}/contrat`),



  getDashboard: (id: number) =>
    apiClient.get<ApiResponse<OccupationDashboard>>(`/occupations/${id}/dashboard`),
};
