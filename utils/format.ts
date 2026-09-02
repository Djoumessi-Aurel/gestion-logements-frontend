import { PeriodeType } from '@/types/enums';

/** Helpers de formatage pour l'affichage. */

// ─── Devise ───────────────────────────────────────────────────────────────────

const DEVISE_PAR_DEFAUT = 'XAF';

/**
 * Code ISO 4217 de la devise, issu de `NEXT_PUBLIC_CURRENCY`.
 *
 * Résolu une seule fois au chargement du module, et **validé** : un code
 * invalide ferait lever `Intl.NumberFormat` à chaque affichage de montant,
 * c'est-à-dire sur pratiquement toutes les pages. Mieux vaut un repli visible
 * dans la console qu'une application qui ne s'affiche plus.
 */
function resoudreDevise(): string {
  const code = process.env.NEXT_PUBLIC_CURRENCY?.trim().toUpperCase();
  if (!code) return DEVISE_PAR_DEFAUT;
  try {
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: code }).format(0);
    return code;
  } catch {
    console.warn(
      `NEXT_PUBLIC_CURRENCY="${code}" n'est pas un code ISO 4217 valide — repli sur ${DEVISE_PAR_DEFAUT}.`,
    );
    return DEVISE_PAR_DEFAUT;
  }
}

/** Code de la devise active — à afficher dans les libellés de champs. */
export const devise = resoudreDevise();

/**
 * Montant dans la devise configurée (ex : « 150 000 F CFA », « 1 500,00 MAD »).
 *
 * Le nombre de décimales n'est pas forcé : `Intl` applique celui de la devise —
 * aucune pour les francs CFA, deux pour le dirham ou l'euro.
 */
export function formatMontant(val: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency', currency: devise,
  }).format(val);
}

/** Taille de fichier lisible (o / Ko / Mo). */
export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

/** Libellé court d'un type MIME (ex : « PDF »), pour les listes de formats acceptés. */
export function mimeLabel(mime: string): string {
  const MAP: Record<string, string> = {
    'application/pdf': 'PDF',
    'image/jpeg': 'JPG',
    'image/png': 'PNG',
    'image/webp': 'WebP',
    'application/msword': 'DOC',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
  };
  return MAP[mime] ?? mime;
}

/** Classe PrimeIcons correspondant à un type MIME. */
export function mimeIcon(mimeType: string): string {
  if (mimeType === 'application/pdf') return 'pi pi-file-pdf';
  if (mimeType.startsWith('image/'))  return 'pi pi-image';
  return 'pi pi-file';
}

// ─── Périodicité d'un loyer ───────────────────────────────────────────────────
// Deux formes volontairement distinctes : la forme longue pour les fiches et les
// dashboards, la forme courte pour les cellules de tableau où la place manque.

const PERIODE_LABELS_LONGS: Record<PeriodeType, string> = {
  [PeriodeType.JOUR]:    'jour(s)',
  [PeriodeType.SEMAINE]: 'semaine(s)',
  [PeriodeType.MOIS]:    'mois',
  [PeriodeType.ANNEE]:   'an(s)',
};

const PERIODE_LABELS_COURTS: Record<PeriodeType, string> = {
  [PeriodeType.JOUR]:    'j',
  [PeriodeType.SEMAINE]: 'sem',
  [PeriodeType.MOIS]:    'mois',
  [PeriodeType.ANNEE]:   'an',
};

/** Ex : « 1 mois », « 2 semaine(s) ». */
export function labelPeriode(nombre: number, type: PeriodeType): string {
  return `${nombre} ${PERIODE_LABELS_LONGS[type]}`;
}

/** Ex : « 1 mois », « 2 sem » — pour les colonnes de DataTable. */
export function labelPeriodeCourt(nombre: number, type: PeriodeType): string {
  return `${nombre} ${PERIODE_LABELS_COURTS[type]}`;
}
