export interface Entreprise {
  id?: number;
  nom: string;
  adresse?: string;
  creeParId?: number;
  secteurs?: Secteur[];
}

export interface Secteur {
  id?: number;
  nom: string;
  description?: string;
  entrepriseId?: number;
  managerId?: number;
  zoneGeographique?: string;
  codesPostaux?: string;
  chauffeurs?: Array<{
    id: number;
    prenom?: string;
    nom?: string;
    fullName?: string;
    managerId?: number;
  }>;
  // Détails récupérés de l'API
  managers?: Array<{
    id: number;
    prenom?: string;
    nom?: string;
    fullName?: string;
    email?: string;
  }>;
  drivers?: Array<{
    id: number;
    prenom?: string;
    nom?: string;
    fullName?: string;
    email?: string;
    managerId?: number;
  }>;
}

export interface User {
  id: number;
  keycloakId: string;
  username: string;
  email: string;
  role: 'SUPERADMIN' | 'MANAGER' | 'CHAUFFEUR';
  statutActuel?: 'EN_SERVICE' | 'LIBRE' | 'EN_CONGE';
  secteurId?: number;
  secteurNom?: string;
  entrepriseId?: number;
}
export interface User {
  id: number;
  keycloakId: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: 'SUPERADMIN' | 'MANAGER' | 'CHAUFFEUR';
  statutActuel?: 'EN_SERVICE' | 'LIBRE' | 'EN_CONGE';
  secteurId?: number;
  secteurNom?: string;
  entrepriseId?: number;
  entrepriseNom?: string;
  // Pour un chauffeur: le manager qui le supervise
  managerId?: number;
  managerPrenom?: string;
  managerNom?: string;
}

export interface Trajet {
  id: number;
  origine: string;
  destination: string;
  status: string;
  dateDebut: string;
  dateFin?: string;
}

export enum VehiculeStatut {
  EN_SERVICE = 'EN_SERVICE',
  EN_MAINTENANCE = 'EN_MAINTENANCE',
  HORS_SERVICE = 'HORS_SERVICE'
}

export interface Vehicule {
  id: number;
  matricule: string;
  immatriculation?: string;
  marque: string;
  modele: string;
  statut: VehiculeStatut;
  capacite?: number;
  kilometrage?: number;
  entrepriseId?: number;
  entrepriseNom?: string;
  chauffeurId?: number;
  chauffeurNom?: string;
  chauffeurImage?: string;
  secteurId?: number;
}

export enum CongeStatut {
  EN_ATTENTE = 'EN_ATTENTE',
  APPROUVE = 'APPROUVE',
  REFUSE = 'REFUSE',
  ANNULE = 'ANNULE'
}

export interface Conge {
  id?: number;
  utilisateurId: number;
  roleDemandeur: 'MANAGER' | 'CHAUFFEUR';
  secteurId?: number;
  dateDebut: string;
  dateFin: string;
  motif: string;
  statut: CongeStatut;
  valideParId?: number;
  commentaireValidation?: string;
  periode?: number;
  calendarEventId?: string;
}
