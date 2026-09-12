package com.logiway.dto.request;

import com.logiway.entities.enums.StatutVehicule;
import jakarta.validation.constraints.Size;

public record UpdateVehiculeRequest(
    @Size(max = 30) String matricule,
    @Size(max = 100) String marque,
    @Size(max = 100) String modele,
    Double capacite,
    Integer kilometrage,
    StatutVehicule statut,
    Long entrepriseId,
    Long chauffeurId
) {
}
