import { AxiosError } from 'axios';

interface ApiErrorData {
  statusCode?: number;
  message?:    string;
  errors?:     { field: string; message: string }[];
}

/**
 * Extrait un message d'erreur affichable depuis une erreur Axios.
 *
 * Ordre de priorité, conforme au contrat d'API du backend :
 *  1. `errors[0].message` — erreur de validation 400, message le plus précis
 *     (ex : « Mot de passe actuel incorrect »)
 *  2. `message` — erreur métier (422), conflit (409), accès refusé (403)…
 *  3. `fallback` — erreur réseau ou réponse hors contrat
 */
export function extractError(err: unknown, fallback: string): string {
  if (err instanceof AxiosError) {
    const data = err.response?.data as ApiErrorData | undefined;
    if (data?.errors?.length) return data.errors[0].message;
    return data?.message ?? fallback;
  }
  return fallback;
}
