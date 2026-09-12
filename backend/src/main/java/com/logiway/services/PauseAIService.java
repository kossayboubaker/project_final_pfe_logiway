package com.logiway.services;

import com.logiway.dto.pause.PauseAIDashboardResponse;
import com.logiway.dto.pause.PauseAIPredictionResponse;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public interface PauseAIService {

    /**
     * Évalue la nécessité d'une pause pour un trajet en cours
     * Appelle le modèle Python Flask et persiste le résultat
     * Déclenche un événement SSE si nécessaire
     * 
     * @param trajetId ID du trajet
     * @param currentLatitude Latitude GPS actuelle
     * @param currentLongitude Longitude GPS actuelle
     * @param distanceParcourueKm Distance parcourue depuis le départ
     * @return La prédiction IA persistée
     */
    PauseAIPredictionResponse evaluerPause(Long trajetId, Double currentLatitude, 
                                           Double currentLongitude, Double distanceParcourueKm);

    /**
     * Retourne l'historique des prédictions IA pour un trajet
     * 
     * @param trajetId ID du trajet
     * @return Liste des prédictions ordonnées par timestamp
     */
    List<PauseAIPredictionResponse> getHistoriquePredictions(Long trajetId);

    /**
     * Retourne les statistiques agrégées pour le dashboard analytique
     * Filtré par entreprise selon le rôle de l'utilisateur
     * 
     * @param startDate Date de début de la période
     * @param endDate Date de fin de la période
     * @param chauffeurId Filtre optionnel par chauffeur
     * @return Statistiques dashboard
     */
    PauseAIDashboardResponse getDashboardStats(LocalDateTime startDate, LocalDateTime endDate, Long chauffeurId);

    /**
     * Exporte les statistiques Pause AI au format CSV.
     *
     * @param startDate début de période
     * @param endDate fin de période
     * @param chauffeurId filtre optionnel par chauffeur
     * @return contenu CSV
     */
    String exportDashboardCsv(LocalDateTime startDate, LocalDateTime endDate, Long chauffeurId);

    /**
     * Retourne TOUS les points de pause (réglementaires + POI IA) pour un trajet
     * en appelant directement l'API Flask /api/predict
     * 
     * @param trajetId ID du trajet
     * @return Réponse complète du modèle IA avec tous les stops
     */
    Map<String, Object> getPausesCompletes(Long trajetId);
}
