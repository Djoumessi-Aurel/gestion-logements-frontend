import type { Logement } from './logement';
import type { Locataire } from './locataire';
import type { Paiement } from './paiement';
import type { Fichier } from './fichier';
import type { Arriere } from './arriere';

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
