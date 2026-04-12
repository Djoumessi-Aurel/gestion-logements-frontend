import { Role } from './enums';
import type { Batiment } from './batiment';
import type { Logement } from './logement';

export interface Utilisateur {
  id: number;
  nom: string;
  prenom: string;
  telephone: string;
  email?: string;
  username: string;
  role: Role;
  isActive: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
  batiments?: Batiment[];
  logements?: Logement[];
}

export interface CreateUtilisateurDto {
  nom: string;
  prenom: string;
  telephone: string;
  email?: string;
  username: string;
  password: string;
  role: Role;
}

export interface UpdateUtilisateurDto {
  nom?: string;
  prenom?: string;
  telephone?: string;
  email?: string;
  role?: Role;
}
