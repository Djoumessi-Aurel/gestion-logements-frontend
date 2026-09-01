/**
 * Génère un mot de passe initial pour un utilisateur créé par un administrateur
 * (UC-USR-02) ou lors d'une réinitialisation admin (UC-USR-05).
 *
 * Il est affiché en lecture seule dans le modal, l'admin le communique à
 * l'utilisateur, qui pourra le changer depuis son profil.
 *
 * Garantit au moins une majuscule, une minuscule, un chiffre et un caractère
 * spécial, pour 12 caractères au total.
 */
export function generatePassword(): string {
  const upper   = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower   = 'abcdefghijklmnopqrstuvwxyz';
  const digits  = '0123456789';
  const special = '@#$!%*?';
  const all     = upper + lower + digits + special;
  const mandatory = [
    upper[Math.floor(Math.random() * upper.length)],
    lower[Math.floor(Math.random() * lower.length)],
    digits[Math.floor(Math.random() * digits.length)],
    special[Math.floor(Math.random() * special.length)],
  ];
  const rest = Array.from({ length: 8 }, () => all[Math.floor(Math.random() * all.length)]);
  return [...mandatory, ...rest].sort(() => Math.random() - 0.5).join('');
}
