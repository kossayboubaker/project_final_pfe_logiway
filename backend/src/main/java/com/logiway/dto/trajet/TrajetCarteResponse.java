package com.logiway.dto.trajet;

import com.logiway.entities.enums.StatutTrajet;

public record TrajetCarteResponse(
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
    StatutTrajet statut,
    Long vehiculeId,
    String vehiculeMatricule,
    String vehiculeCouleur,
    Double vehiculeLatitude,
    Double vehiculeLongitude,
    Double vehiculeVitesse,
    Double vehiculeNiveauCarburant,
    Long chauffeurId,
    String chauffeurTelephone,
    String chauffeurNom,
    String chauffeurImage,
    String chauffeurRole,
    String chauffeurSecteur,
    String routePreference,
    Double vehiculeChargeKg,
    Integer vehiculeKilometrage,
    Double ecoScore
) {
}