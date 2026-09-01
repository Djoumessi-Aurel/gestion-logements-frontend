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
 * Rôles qu'un administrateur est autorisé à attribuer (UC-USR-02).
 * Le backend reste la source de vérité — ceci ne fait que masquer les options
 * interdites dans les sélecteurs.
 */
export function rolesForAdmin(role: Role | undefined): Role[] {
  if (role === Role.ADMIN_GLOBAL)   return [Role.LOCATAIRE, Role.ADMIN_LOGEMENT, Role.ADMIN_BATIMENT, Role.ADMIN_GLOBAL];
  if (role === Role.ADMIN_BATIMENT) return [Role.LOCATAIRE, Role.ADMIN_LOGEMENT];
  return [Role.LOCATAIRE];
}
