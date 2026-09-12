package com.logiway.dto.chauffeur;

import com.logiway.dto.response.UserResponse;
import com.logiway.dto.trajet.TrajetResponse;

import java.util.List;

public record ChauffeurDashboardResponse(
    UserResponse chauffeur,
    ChauffeurVehicleResponse vehiculeActuel,
    UserResponse manager,
    TrajetResponse missionActuelle,
    List<TrajetResponse> missionsDuJour,
    ChauffeurDashboardStatsResponse statistiques,
    ChauffeurAvailabilityResponse disponibiliteProchaine
) {
}