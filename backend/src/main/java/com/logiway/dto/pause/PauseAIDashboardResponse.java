package com.logiway.dto.pause;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PauseAIDashboardResponse {
    // Statistiques globales
    private Integer totalPausesRecommandees;
    private Integer pausesEffectuees;
    private Integer pausesIgnorees;
    private Double tauxConformite;
    private Double scoreMoyenFatigue;
    
    // Nouvelles statistiques ML avancées
    private MLInsights mlInsights;
    
    // Statistiques par chauffeur
    private List<ChauffeurStats> chauffeurStats;
    
    // Points de carte (heatmap)
    private List<HeatmapPoint> heatmapPoints;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MLInsights {
        // Prédictions de risque
        private Integer chauffeursCritiquesFatigue; // Score fatigue > 85
        private Integer chauffeursModereesFatigue; // Score fatigue 60-85
        private Double scoreFatigueMax;
        private String chauffeurPlusRisque;
        
        // Tendances temporelles
        private Double tendanceConformite; // % change sur période
        private Double tendanceScoreFatigue; // Score moyen change
        
        // Patterns de pause
        private Integer pausesHeuresRepas; // Pauses pendant heures repas
        private Integer pausesNuit; // Pauses entre 22h-6h
        private Double tauxPausesMiParcours; // % pauses entre 40-60% du trajet
        
        // Efficacité IA
        private Double tauxAcceptationAI; // % recommandations suivies
        private Integer pausesVolontaires; // Pauses non suggérées par IA
        private Double scoreMoyenPausesEffectuees; // Score AI des pauses effectuées
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChauffeurStats {
        private Long chauffeurId;
        private String nomChauffeur;
        private Integer nombreMissions;
        private Double scoreFatigueMoyen;
        private Integer alertesUrgentes;
        private Integer pausesIgnorees;
        private Double tauxConformite;
        
        // Nouvelles métriques ML
        private String niveauRisque; // LOW, MODERATE, HIGH, CRITICAL
        private Double distanceMoyenneParJour;
        private Double heuresMoyennesConduite;
        private Integer pausesRecommandees;
        private Integer pausesEffectuees;
        private Double scoreMoyenAccessibilite; // Qualité des POI choisis
        private String sentiment; // VERY_DISSATISFIED, DISSATISFIED, NEUTRAL, SATISFIED

        // Arrivée estimée et distance réelle
        private LocalDateTime arriveeEstimee;
        private Double distanceReelle;
        private String pointDepart;
        private String pointArrivee;
        private String statutTrajet;
        private String immatriculationVehicule;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HeatmapPoint {
        private Double latitude;
        private Double longitude;
        private String type; // URGENTE_IGNOREE, RECOMMANDEE_EFFECTUEE, VOLONTAIRE
        private Integer score;
        private String nomLieu;
        
        // Nouvelles propriétés
        private Integer fatigueScore;
        private Integer accessibilityScore;
        private LocalDateTime timestamp;
        private String chauffeurNom;
    }
}
