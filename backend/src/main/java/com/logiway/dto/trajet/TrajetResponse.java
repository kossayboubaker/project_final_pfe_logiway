package com.logiway.dto.trajet;

import com.logiway.entities.enums.PrioriteTrajet;
import com.logiway.entities.enums.StatutTrajet;

import java.time.LocalDateTime;

public record TrajetResponse(
    Long id,
    String pointDepart,
    String destination,
    Double latitudeDepart,
    Double longitudeDepart,
    Double latitudeArrivee,
    Double longitudeArrivee,
    Double distanceKm,
    Integer dureeEstimeeMinutes,
    String geometrieItineraire,
    Double chargeKg,
    PrioriteTrajet priorite,
    String notes,
    LocalDateTime dateDepart,
    LocalDateTime dateArrivee,
    LocalDateTime dateArriveeReelle,
    Integer dureeReelleMinutes,
    Integer retardMinutes,
    String statutPerformance,
    StatutTrajet statut,
    Long chauffeurId,
    String chauffeurNom,
    Long vehiculeId,
    String vehiculeMatricule,
    String vehiculeCouleur,
    Double vehiculeLatitude,
    Double vehiculeLongitude,
    Double vehiculeVitesse,
    Long managerId,
    String managerNom
) {
}