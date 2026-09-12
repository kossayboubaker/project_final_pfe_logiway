/**
 * Modèles TypeScript pour le module de génération de rapports
 */

export interface GenerateReportRequest {
  requeteNaturelle: string;
  formatPrefere?: 'PDF' | 'CSV' | 'TXT';
}

export interface ReportMetadata {
  reportId: string;
  titre: string;
  format: string;
  domaine: string;
  statut: string;
  userId: string;
  entrepriseId?: string;
  dateCreation: Date;
  dateDebutDonnees?: Date;
  dateFinDonnees?: Date;
  tailleFichierKo?: number;
  urlTelechargement?: string;
  nbLignes?: number;
  tempsGenerationMs?: number;
  erreur?: string;
}

export interface GenerateReportResponse {
  success: boolean;
  reportId: string;
  message: string;
  metadata?: ReportMetadata;
  urlDownload?: string;
}

export interface ReportListResponse {
  total: number;
  rapports: ReportMetadata[];
}

export enum ReportFormat {
  PDF = 'PDF',
  CSV = 'CSV',
  TXT = 'TXT'
}

export enum ReportDomain {
  VEHICULES = 'vehicules',
  CHAUFFEURS = 'chauffeurs',
  TRAJETS = 'trajets',
  CONGES = 'conges',
  RECLAMATIONS = 'reclamations',
  MANAGERS = 'managers',
  GLOBAL = 'global'
}

export enum ReportStatus {
  PENDING = 'pending',
  GENERATING = 'generating',
  COMPLETED = 'completed',
  ERROR = 'error'
}
