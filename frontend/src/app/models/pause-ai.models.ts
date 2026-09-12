export enum TypeAlerteIA {
  AUCUNE = 'AUCUNE',
  RECOMMANDEE = 'RECOMMANDEE',
  URGENTE = 'URGENTE'
}

export interface PauseAIPrediction {
  id: number;
  trajetId: number;
  timestamp: string;
  hoursDriving: number;
  distAlongRatio: number;
  score: number;
  poiType?: string;
  alerteDeclenchee: boolean;
  typeAlerte?: TypeAlerteIA;
  latitudePoi?: number;
  longitudePoi?: number;
  nomPoi?: string;
  distancePoiM?: number;
}

export interface PauseAIEvaluationRequest {
  currentLatitude: number;
  currentLongitude: number;
  distanceParcourueKm: number;
}

export interface POIInfo {
  type: string;
  lat: number;
  lon: number;
  name: string;
  distance: number;
  tags?: {
    hgv?: string;
    shower?: string;
    toilets?: string;
    opening_hours?: string;
    [key: string]: string | undefined;
  };
}

export interface PauseAIAlertEvent {
  trajetId: number;
  predictionId: number;
  score: number;
  typeAlerte: TypeAlerteIA;
  hoursDriving: number;
  poi: POIInfo;
  fatigueScore?: number;
  accessibilityScore?: number;
  contextScore?: number;
  confidence?: number;
  distanceFromStartKm?: number;
}

export enum StatutPause {
  PLANIFIEE = 'PLANIFIEE',
  ATTEINTE = 'ATTEINTE',
  IGNOREE = 'IGNOREE'
}

export enum TypePause {
  MANDATORY_REST = 'MANDATORY_REST',
  WARNING_ALERT = 'WARNING_ALERT',
  STATION_SERVICE = 'STATION_SERVICE',
  KIOSK = 'KIOSK',
  REST_AREA = 'REST_AREA',
  CAFE = 'CAFE',
  PARKING = 'PARKING',
  POI = 'POI'
}

export interface PauseReglementaireResponse {
  id: number;
  trajetId: number;
  type: TypePause;
  longitude: number;
  latitude: number;
  distanceAlongRouteM?: number;
  heureArriveePlanifiee?: string;
  durationSeconds?: number;
  heureRepriseEstimee?: string;
  statut: StatutPause;
  nomLieu?: string;
  aiScore?: number;
  fatigueScore?: number;
  accessibilityScore?: number;
  contextScore?: number;
  reasoning?: string;
  confidence?: number;
}

export interface PauseStatusUpdateEvent {
  trajetId: number;
  pauseId: number;
  statut: StatutPause;
  latitude: number;
  longitude: number;
  nomLieu?: string;
  type?: string;
  score?: number;
}

export interface ChauffeurStats {
  chauffeurId: number;
  nomChauffeur: string;
  nombreMissions: number;
  scoreFatigueMoyen: number;
  alertesUrgentes: number;
  pausesIgnorees: number;
  tauxConformite: number;
  
  niveauRisque?: string;
  distanceMoyenneParJour?: number;
  heuresMoyennesConduite?: number;
  pausesRecommandees?: number;
  pausesEffectuees?: number;
  scoreMoyenAccessibilite?: number;
  sentiment?: string;

  arriveeEstimee?: string;
  distanceReelle?: number;
  pointDepart?: string;
  pointArrivee?: string;
  statutTrajet?: string;
  immatriculationVehicule?: string;
}

export interface HeatmapPoint {
  latitude: number;
  longitude: number;
  type: 'URGENTE_IGNOREE' | 'RECOMMANDEE_EFFECTUEE' | 'RECOMMANDEE_IGNOREE' | 'VOLONTAIRE';
  score: number;
  nomLieu?: string;
  
  // Nouvelles propriétés ML
  fatigueScore?: number;
  accessibilityScore?: number;
  timestamp?: string;
  chauffeurNom?: string;
}

export interface MLInsights {
  // Prédictions de risque
  chauffeursCritiquesFatigue: number;
  chauffeursModereesFatigue: number;
  scoreFatigueMax: number;
  chauffeurPlusRisque: string;
  
  // Tendances temporelles
  tendanceConformite: number;
  tendanceScoreFatigue: number;
  
  // Patterns de pause
  pausesHeuresRepas: number;
  pausesNuit: number;
  tauxPausesMiParcours: number;
  
  // Efficacité IA
  tauxAcceptationAI: number;
  pausesVolontaires: number;
  scoreMoyenPausesEffectuees: number;
}

export interface PauseAIDashboard {
  totalPausesRecommandees: number;
  pausesEffectuees: number;
  pausesIgnorees: number;
  tauxConformite: number;
  scoreMoyenFatigue: number;
  chauffeurStats: ChauffeurStats[];
  heatmapPoints: HeatmapPoint[];
  
  // Insights ML avancés
  mlInsights?: MLInsights;
}

export interface PauseAIFilterOptions {
  startDate: Date;
  endDate: Date;
  chauffeurId?: number;
  typeAlerte?: TypeAlerteIA | 'ALL';
  statut?: 'EFFECTUEES' | 'IGNOREES' | 'ALL';
}
