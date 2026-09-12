package com.logiway.dto.chauffeur;

import com.logiway.entities.enums.StatutVehicule;

public record ChauffeurVehicleResponse(
    Long id,
    String matricule,
    String marque,
    String modele,
    String typeVehicule,
    StatutVehicule statut,
    Integer kilometrage,
    Double niveauCarburant,
    Double capaciteCharge,
    Long entrepriseId,
    String entrepriseNom
) {
}