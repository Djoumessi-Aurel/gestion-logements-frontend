import { PeriodeType } from '@/types/enums';

/** Helpers de formatage pour l'affichage. */

/** Montant en francs CFA, sans décimales (ex : « 150 000 F CFA »). */
export function formatMontant(val: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency', currency: 'XAF', maximumFractionDigits: 0,
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
