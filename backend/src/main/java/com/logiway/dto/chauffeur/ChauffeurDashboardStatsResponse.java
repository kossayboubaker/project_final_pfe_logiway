package com.logiway.dto.chauffeur;

public record ChauffeurDashboardStatsResponse(
    Double distanceTotaleKm,
    Long missionsCompletees,
    Long missionsAnnulees,
    Double tempsConduiteHeures,
    Double vitesseMoyenneKmH,
    Double consommationMoyenneL100Km,
    Double tauxPonctualite,
    Long alertesPauseDepassee,
    Long alertesCarburantBas,
    Long alertesDeviation,
    Long alertesArretProlonge,
    Double ecoScoreMoyen
) {
}