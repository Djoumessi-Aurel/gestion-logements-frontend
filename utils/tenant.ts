/**
 * Résolution du slug d'organisation (multi-tenance SaaS) depuis le sous-domaine.
 *
 * Convention backend : chaque client a un sous-domaine dédié (client1.<domaine>) dont
 * le premier label doit correspondre exactement au `slug` de son Organisation
 * (TenantMiddleware côté backend). L'en-tête X-Tenant-Slug est envoyé sur chaque
 * requête API (voir apiClient.ts) — obligatoire pour /auth/login et
 * /auth/forgot-password (routes non authentifiées, seul moyen de savoir dans quel
 * espace de noms chercher le username), simple garde-fou de cohérence sur les
 * routes authentifiées (le JWT signé fait déjà foi).
 *
 * ⚠️ Opt-in explicite via NEXT_PUBLIC_MULTI_TENANT_BACKEND=true : un backend non
 * multi-tenant (branche `main`) n'inclut pas X-Tenant-Slug dans son CORS
 * `allowedHeaders`. Comme c'est un en-tête "non simple", le navigateur déclenche un
 * preflight OPTIONS et bloque lui-même la requête réelle si le header n'est pas
 * reflété par le serveur — pas une simple erreur ignorée côté backend, un échec
 * réseau côté client sur *tous* les appels. On ne peut donc pas déduire l'envoi de
 * la seule forme du hostname (un hostname de prod peut avoir un sous-domaine —
 * ex: gestion-logements.aureldjoumessi.com — sans que le backend ciblé soit
 * multi-tenant). D'où le flag explicite, à activer uniquement quand
 * NEXT_PUBLIC_API_URL pointe vers un déploiement backend issu de `aurel-saas`
 * (ou toute branche dont le CORS `allowedHeaders` inclut 'X-Tenant-Slug').
 *
 * En développement local (hostname à un seul label ou IP, ex: "localhost",
 * "127.0.0.1"), aucun sous-domaine n'existe : NEXT_PUBLIC_DEV_TENANT_SLUG permet
 * de forcer le slug à utiliser (doit correspondre à une Organisation existante en
 * base). Alternative : utiliser un sous-domaine de localhost (ex: client1.localhost)
 * qui fonctionne nativement dans la plupart des navigateurs.
 */

const IPV4_REGEX = /^\d{1,3}(\.\d{1,3}){3}$/;

export function getTenantSlug(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  if (process.env.NEXT_PUBLIC_MULTI_TENANT_BACKEND !== 'true') return undefined;

  const hostname = window.location.hostname;

  if (hostname === 'localhost' || IPV4_REGEX.test(hostname)) {
    return process.env.NEXT_PUBLIC_DEV_TENANT_SLUG?.toLowerCase() || undefined;
  }

  const labels = hostname.split('.');
  if (labels.length > 1) {
    const [first] = labels;
    return first === 'www' ? undefined : first.toLowerCase();
  }

  return undefined;
}
