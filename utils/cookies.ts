/**
 * Gestion du cookie `access_token` côté client.
 *
 * Ce cookie est lisible par le middleware Next.js (non-HttpOnly) et permet de
 * protéger les routes sans appel API. Il est synchronisé avec le Redux store :
 * - Après login       → setAccessTokenCookie(token)
 * - Après refresh     → setAccessTokenCookie(newToken)  (dans apiClient.ts)
 * - Après logout      → clearAccessTokenCookie()
 */

export const ACCESS_TOKEN_COOKIE = 'access_token';

/** Extrait la date d'expiration (exp) du payload JWT (sans vérification de signature). */
function parseJwtExp(token: string): Date | null {
  try {
    const [, payload] = token.split('.');
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return typeof decoded.exp === 'number' ? new Date(decoded.exp * 1000) : null;
  } catch {
    return null;
  }
}

/**
 * Pose le cookie `access_token` avec l'expiry du JWT.
 * Appelé après login et après chaque refresh réussi.
 */
export function setAccessTokenCookie(token: string): void {
  if (typeof document === 'undefined') return;
  const exp = parseJwtExp(token);
  const expStr = exp ? `; expires=${exp.toUTCString()}` : '';
  document.cookie = `${ACCESS_TOKEN_COOKIE}=${token}; path=/${expStr}; SameSite=Strict`;
}

/**
 * Supprime le cookie `access_token`.
 * Appelé lors du logout ou en cas de session expirée.
 */
export function clearAccessTokenCookie(): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${ACCESS_TOKEN_COOKIE}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict`;
}
