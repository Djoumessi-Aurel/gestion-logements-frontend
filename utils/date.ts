import { PeriodeType } from '@/types/enums';

/**
 * Helpers de dates partagés.
 *
 * ⚠️ Règle générale du projet : le backend échange des dates au format
 * `YYYY-MM-DD` (date seule, sans heure). Toutes les conversions ici travaillent
 * en heure **locale** et n'utilisent jamais `toISOString()`, qui décalerait la
 * date d'un jour dans les fuseaux à l'est de Greenwich (le cas au Cameroun,
 * UTC+1) au moment de la sérialisation.
 */

/** Affichage d'une date ISO au format français (jj/mm/aaaa). */
export function formatDate(val: string): string {
  return new Date(val).toLocaleDateString('fr-FR');
}

/** Sérialise une Date en `YYYY-MM-DD` à partir de ses composantes locales. */
export function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Décale une date de `nombre` périodes du type donné.
 * Base de calcul des périodes de paiement (UC-PAI-02, option 1) :
 * `finPeriode = addPeriode(debutPeriode, nbLoyers × loyer.periodeNombre, loyer.periodeType) - 1 jour`
 */
export function addPeriode(date: Date, nombre: number, type: PeriodeType): Date {
  const d = new Date(date);
  if (type === PeriodeType.JOUR)    d.setDate(d.getDate() + nombre);
  if (type === PeriodeType.SEMAINE) d.setDate(d.getDate() + nombre * 7);
  if (type === PeriodeType.MOIS)    d.setMonth(d.getMonth() + nombre);
  if (type === PeriodeType.ANNEE)   d.setFullYear(d.getFullYear() + nombre);
  return d;
}

/** Ajoute un jour à une date (ex : `debutPeriode = dateDernierJourCouvert + 1 j`). */
export function addOneDay(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + 1);
  return d;
}

/**
 * true si la date est strictement antérieure à aujourd'hui.
 * Utilisé pour signaler un arriéré à partir de `dateDernierJourCouvert`.
 * Les deux dates sont ramenées à minuit local pour comparer des jours, pas des instants.
 */
export function isDatePassee(dateStr: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(dateStr);
  date.setHours(0, 0, 0, 0);
  return date < today;
}
