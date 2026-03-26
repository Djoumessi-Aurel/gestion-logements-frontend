'use client';

import { ReactNode } from 'react';
import { useAppSelector } from '@/store/hooks';
import { Role } from '@/types/enums';

// ─── Ordre hiérarchique des rôles ─────────────────────────────────────────────

const ROLE_ORDER: Record<Role, number> = {
  [Role.LOCATAIRE]:      0,
  [Role.ADMIN_LOGEMENT]: 1,
  [Role.ADMIN_BATIMENT]: 2,
  [Role.ADMIN_GLOBAL]:   3,
};

// ─── Composant ────────────────────────────────────────────────────────────────

interface Props {
  /** Rôle minimum requis pour afficher le contenu */
  minRole: Role;
  children: ReactNode;
  /** Ce qui est rendu si l'accès est refusé (rien par défaut) */
  fallback?: ReactNode;
}

/**
 * Affiche `children` uniquement si l'utilisateur connecté possède au moins `minRole`.
 * Usage : <RoleGuard minRole={Role.ADMIN_GLOBAL}><BoutonSupprimer /></RoleGuard>
 */
export default function RoleGuard({ minRole, children, fallback = null }: Props) {
  const role = useAppSelector((s) => s.auth.user?.role);

  if (!role || ROLE_ORDER[role] < ROLE_ORDER[minRole]) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
