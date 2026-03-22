import type { Arriere } from './arriere';

export interface Locataire {
  id: number;
  nom: string;
  prenom: string;
  telephone: string;
  email?: string;
  utilisateurId?: number;
  libre: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLocataireDto {
  nom: string;
  prenom: string;
  telephone: string;
  email?: string;
  utilisateurId?: number;
}

export interface UpdateLocataireDto {
  nom?: string;
  prenom?: string;
  telephone?: string;
  email?: string;
  utilisateurId?: number;
}

export interface LocataireDashboard {
  locataireId: number;
  totalOccupations: number;
  nbOccupationsActives: number;
  solvabilite: {
    montantTotalPaye: number;
    montantArrieres: number;
  };
  listeArrieres: Arriere[];
  assiduité: {
    nombrePaiements: number;
    nombrePaiementsATemps: number;
    nombrePaiementsEnRetard: number;
    tauxPonctualite: number;
    retardMoyenJours: number;
  };
}
