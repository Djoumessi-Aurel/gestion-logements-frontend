import { PeriodeType } from './enums';
import type { Batiment } from './batiment';
import type { Arriere } from './arriere';

export interface Loyer {
  id: number;
  logementId: number;
  montant: number;
  dateDebut: string;
  periodeNombre: number;
  periodeType: PeriodeType;
  createdAt: string;
}

export interface Logement {
  id: number;
  batimentId: number;
  batiment?: Batiment;
  nom: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  loyers?: Loyer[];
}

export interface CreateLogementDto {
  batimentId: number;
  nom: string;
  description?: string;
  loyerMontant: number;
  loyerDateDebut?: string;
  loyerPeriodeNombre: number;
  loyerPeriodeType: PeriodeType;
}

export interface UpdateLogementDto {
  nom?: string;
  description?: string;
}

export interface CreateLoyerDto {
  montant: number;
  dateDebut?: string;
  periodeNombre: number;
  periodeType: PeriodeType;
}

export interface LogementDashboard {
  logementId: number;
  estOccupe: boolean;
  loyerActuel: {
    montant: number;
    periodeNombre: number;
    periodeType: PeriodeType;
  };
  locataireActuel?: { id: number; nom: string; prenom: string };
  nbreTotalPaiementsLocataireActuel: number;
  montantTotalPayeLocataireActuel: number;
  arrieresLocataireActuel: Arriere | null;
  nbreTotalOccupations: number;
  montantTotalPercu: number;
  montantTotalArrieres: number;
}
