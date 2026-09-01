import { Role } from '@/types/enums';

export const roleLabels: Record<Role, string> = {
  [Role.LOCATAIRE]:      'Locataire',
  [Role.ADMIN_LOGEMENT]: 'Admin Logement',
  [Role.ADMIN_BATIMENT]: 'Admin Bâtiment',
  [Role.ADMIN_GLOBAL]:   'Admin Global',
};

export const roleColors: Record<Role, string> = {
  [Role.LOCATAIRE]:      'bg-gray-100 text-gray-600',
  [Role.ADMIN_LOGEMENT]: 'bg-[#dbeafe] text-[#1e3a8a]',
  [Role.ADMIN_BATIMENT]: 'bg-[#bfdbfe] text-[#1e40af]',
  [Role.ADMIN_GLOBAL]:   'bg-[#1e3a8a] text-white',
};

/**
 * Ordre hiérarchique des rôles — source unique de vérité pour tout le RBAC client.
 * Chaque rôle englobe les capacités de ceux qui le précèdent.
 */
const ROLE_ORDER: Record<Role, number> = {
  [Role.LOCATAIRE]:      0,
  [Role.ADMIN_LOGEMENT]: 1,
  [Role.ADMIN_BATIMENT]: 2,
  [Role.ADMIN_GLOBAL]:   3,
};

/**
 * true si `role` atteint au moins le niveau `minRole`.
 *
 * Un rôle absent (store pas encore réhydraté) n'a accès à rien : on masque par
 * défaut plutôt que d'afficher un bouton avant de le retirer. Le backend reste
 * de toute façon la source de vérité — ceci ne fait que piloter l'affichage.
 */
export function hasMinRole(role: Role | undefined, minRole: Role): boolean {
  if (!role) return false;
  return ROLE_ORDER[role] >= ROLE_ORDER[minRole];
}

/**
 * Rôles qu'un administrateur est autorisé à attribuer (UC-USR-02).
 * Le backend reste la source de vérité — ceci ne fait que masquer les options
 * interdites dans les sélecteurs.
 */
export function rolesForAdmin(role: Role | undefined): Role[] {
  if (role === Role.ADMIN_GLOBAL)   return [Role.LOCATAIRE, Role.ADMIN_LOGEMENT, Role.ADMIN_BATIMENT, Role.ADMIN_GLOBAL];
  if (role === Role.ADMIN_BATIMENT) return [Role.LOCATAIRE, Role.ADMIN_LOGEMENT];
  return [Role.LOCATAIRE];
}
