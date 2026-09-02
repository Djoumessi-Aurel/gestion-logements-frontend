export interface OrganisationUsage {
  id: number;
  nom: string;
  slug: string;
  isActive: boolean;
  /** Quota de logements du palier tarifaire. null = illimité (palier Grand Compte). */
  logementLimit: number | null;
  logementsUtilises: number;
}
