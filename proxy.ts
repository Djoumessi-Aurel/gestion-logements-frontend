import { NextRequest, NextResponse } from 'next/server';
import { decodeJwt } from 'jose';

// ─── Routes publiques (accessibles sans authentification) ─────────────────────

const PUBLIC_ROUTES = ['/login', '/forgot-password', '/reset-password'];

// ─── Espace réservé aux LOCATAIRE ─────────────────────────────────────────────

const LOCATAIRE_BASE = '/locataire';

// ─── Proxy (anciennement middleware, renommé en Next.js 16) ──────────────────

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublicRoute = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + '?'),
  );

  // ── Lecture des cookies (refresh_token est HttpOnly mais lisible ici) ────────
  const accessToken = request.cookies.get('access_token')?.value;
  const refreshToken = request.cookies.get('refresh_token')?.value;

  // L'utilisateur est considéré authentifié s'il possède l'un ou l'autre cookie.
  // Le refresh_token (HttpOnly) est la source de vérité pour l'authentification ;
  // l'access_token (plain) sert uniquement à extraire le rôle côté middleware.
  const isAuthenticated = !!(accessToken || refreshToken);

  // ── Utilisateur non authentifié ──────────────────────────────────────────────
  if (!isAuthenticated) {
    if (isPublicRoute) return NextResponse.next();

    // Sauvegarder la cible pour rediriger après login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── Décoder le rôle depuis l'access_token (sans vérification de signature) ───
  // decodeJwt ne valide pas l'expiry : même un token expiré contient le rôle.
  // La validité de l'authentification est assurée par le backend.
  let role: string | undefined;
  if (accessToken) {
    try {
      const payload = decodeJwt(accessToken);
      role = payload.role as string | undefined;
    } catch {
      // Token malformé — on laisse passer ; l'API rejettera avec 401
    }
  }

  // ── Utilisateur authentifié sur une route publique → rediriger vers son espace
  if (isPublicRoute) {
    if (role === 'LOCATAIRE') {
      return NextResponse.redirect(new URL(LOCATAIRE_BASE, request.url));
    }
    return NextResponse.redirect(new URL('/', request.url));
  }

  // ── Contrôle RBAC au niveau des routes ───────────────────────────────────────

  // LOCATAIRE : uniquement /locataire
  if (role === 'LOCATAIRE' && !pathname.startsWith(LOCATAIRE_BASE)) {
    return NextResponse.redirect(new URL(LOCATAIRE_BASE, request.url));
  }

  // Non-LOCATAIRE : interdit sur /locataire
  if (role && role !== 'LOCATAIRE' && pathname.startsWith(LOCATAIRE_BASE)) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

// ─── Périmètre d'application ──────────────────────────────────────────────────
// Exclure les assets statiques, les routes API Next.js et les fichiers publics.

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)).*)',
  ],
};
