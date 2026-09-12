package com.logiway.dto.response;

import com.logiway.entities.enums.StatutVehicule;

public record VehiculeResponse(
    Long id,
    String matricule,
    String marque,
    String modele,
    Double capacite,
    Integer kilometrage,
    StatutVehicule statut,
    Long entrepriseId,
    String entrepriseNom,
    Long chauffeurId,
    String chauffeurNom,
    Long managerId,
    String managerPrenom,
    String managerNom
) {
}
