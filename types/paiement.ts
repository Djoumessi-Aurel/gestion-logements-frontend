import type { Fichier } from './fichier';
import type { Occupation } from './occupation';

export interface Paiement {
  id: number;
  occupationId: number;
  occupation?: Occupation;
  debutPeriode: string;
  finPeriode: string;
  montantPaye: number;
  nombreDeLoyers?: number;
  datePaiement: string;
  dateAttenduePaiement: string;
  commentaire?: string;
  preuves?: Fichier[];
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaiementOption1Dto {
  occupationId: number;
  nombreDeLoyers: number;
  datePaiement?: string;
  commentaire?: string;
}

export interface CreatePaiementOption2Dto {
  occupationId: number;
  montantPaye: number;
  finPeriode: string;
  datePaiement?: string;
  commentaire?: string;
}

export interface UpdatePaiementDto {
  datePaiement?: string;
  commentaire?: string;
  montantPaye?: number;
  finPeriode?: string;
}
