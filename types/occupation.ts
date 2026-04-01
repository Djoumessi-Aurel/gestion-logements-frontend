import type { Logement } from './logement';
import type { Locataire } from './locataire';
import type { Paiement } from './paiement';
import type { Fichier } from './fichier';
import type { Arriere } from './arriere';
import type { PeriodeType } from './enums';

export interface Occupation {
  id: number;
  logementId: number;
  locataireId: number;
  logement?: Logement;
  locataire?: Locataire;
  dateDebut: string;
  dateFin?: string;
  dateDernierJourCouvert: string;
  contratFichierId?: number;
  contratFichier?: Fichier;
  createdAt: string;
  updatedAt: string;
  paiements?: Paiement[];
}

export interface CreateOccupationDto {
  logementId: number;
  locataireId: number;
  dateDebut: string;
}

export interface UpdateOccupationDto {
  dateDebut?: string;
  locataireId?: number;
}

export interface FinOccupationDto {
  dateFin: string;
}

export interface OccupationArrieres {
  occupation: Occupation;
  arrieres: Arriere | null;
}

export interface OccupationDashboardPaiement {
  id: number;
  debutPeriode: string;
  finPeriode: string;
  montantPaye: number;
  nombreDeLoyers?: number;
  datePaiement: string;
  dateAttenduePaiement: string;
  enRetard: boolean;
}

export interface OccupationDashboard {
  occupationId: number;
  estActive: boolean;
  dateDebut: string;
  dateFin: string | null;
  logement: { id: number; batimentId: number; nom: string };
  locataire: { id: number; nom: string; prenom: string };
  loyerActuel: { montant: number; periodeNombre: number; periodeType: PeriodeType } | null;
  nbreTotalPaiements: number;
  montantTotalPaye: number;
  dernierPaiement: { finPeriode: string; montantPaye: number; datePaiement: string } | null;
  paiements: OccupationDashboardPaiement[];
  arrieres: Arriere | null;
}
