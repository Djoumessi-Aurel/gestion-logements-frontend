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

// Erreur de validation (400)
export interface ApiValidationError {
  statusCode: 400;
  message: string;
  errors: { field: string; message: string }[];
}
