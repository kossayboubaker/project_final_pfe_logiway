package com.logiway.dto.chauffeur;

import com.logiway.entities.enums.PrioriteTrajet;
import com.logiway.entities.enums.StatutTrajet;
import com.logiway.entities.enums.StatutVehicule;

import java.time.LocalDateTime;

public record ChauffeurHistoryTripResponse(
    Long id,
    String pointDepart,
    String destination,
    LocalDateTime dateDepart,
    LocalDateTime dateArrivee,
    LocalDateTime dateArriveeReelle,
    Double distanceKm,
    Integer dureeEstimeeMinutes,
    Integer dureeReelleMinutes,
    StatutTrajet statut,
    String vehiculeMatricule,
    String vehiculeMarque,
    String vehiculeModele,
    StatutVehicule vehiculeStatut,
    String managerNom,
    String managerEmail,
    String incidents,
    String pauses,
    String retards,
    PrioriteTrajet priorite,
    String notes
) {
}