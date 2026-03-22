export interface Batiment {
  id: number;
  nom: string;
  adresse: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBatimentDto {
  nom: string;
  adresse: string;
  description?: string;
}

export interface UpdateBatimentDto {
  nom?: string;
  adresse?: string;
  description?: string;
}

export interface BatimentDashboard {
  batimentId: number;
  totalLogements: number;
  logementsOccupes: number;
  logementsVacants: number;
  occupationsActives: number;
  montantTotalArrieresOccActives: number;
  montantTotalArrieres: number;
  montantTotalPercu: number;
}
