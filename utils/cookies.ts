/**
 * Gestion du cookie `access_token` côté client.
 *
 * Ce cookie est lisible par le proxy Next.js (non-HttpOnly) et permet de
 * protéger les routes sans appel API. Il est synchronisé avec le Redux store :
 * - Après login       → setAccessTokenCookie(token)
 * - Après refresh     → setAccessTokenCookie(newToken)  (dans apiClient.ts)
 * - Après logout      → clearAccessTokenCookie()
 *
 * ⚠️  L'expiry du cookie est volontairement calée sur la durée du refresh token
 * (7 jours), et NON sur l'expiry du JWT access token (quelques minutes/heures).
 * Raison : le proxy lit ce cookie pour savoir si une session existe. Si le cookie
 * disparaît à l'expiry du JWT, le proxy redirige vers /login même si le refresh
 * token est encore valide — l'intercepteur Axios n'a jamais la chance de rafraîchir.
 * La vraie validation du token est faite par le backend à chaque appel API.
 */

export const ACCESS_TOKEN_COOKIE = 'access_token';

// Doit correspondre à REFRESH_TOKEN_EXPIRES_IN côté backend.
const SESSION_DURATION_DAYS = 7;

/**
 * Pose le cookie `access_token` avec une expiry de 7 jours (durée du refresh token).
 * Appelé après login et après chaque refresh réussi.
 */
export function setAccessTokenCookie(token: string): void {
  if (typeof document === 'undefined') return;
  const exp = new Date();
  exp.setDate(exp.getDate() + SESSION_DURATION_DAYS);
  document.cookie = `${ACCESS_TOKEN_COOKIE}=${token}; path=/; expires=${exp.toUTCString()}; SameSite=Strict`;
}

/**
 * Supprime le cookie `access_token`.
 * Appelé lors du logout ou en cas de session expirée.
 */
export function clearAccessTokenCookie(): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${ACCESS_TOKEN_COOKIE}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict`;
}
