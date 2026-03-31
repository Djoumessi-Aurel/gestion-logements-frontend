// Structure de réponse standard du backend
export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}

export interface ApiResponseList<T> {
  statusCode: number;
  message: string;
  data: T[];
}

// Réponse paginée (ex: GET /paiements avec page + limit)
export interface PaginationMeta {
  total:      number;
  page:       number;
  limit:      number;
  totalPages: number;
}

export interface ApiResponsePaginated<T> {
  statusCode: number;
  message: string;
  data: T[];
  meta: PaginationMeta;
}

// Erreur de validation (400)
export interface ApiValidationError {
  statusCode: 400;
  message: string;
  errors: { field: string; message: string }[];
}
