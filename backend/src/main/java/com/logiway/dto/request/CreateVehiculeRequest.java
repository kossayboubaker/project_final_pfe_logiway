package com.logiway.dto.request;

import com.logiway.entities.enums.StatutVehicule;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateVehiculeRequest(
    @NotBlank @Size(max = 30) String matricule,
    @NotBlank @Size(max = 100) String marque,
    @NotBlank @Size(max = 100) String modele,
    @NotNull Double capacite,
    Integer kilometrage,
    StatutVehicule statut,
    @NotNull Long entrepriseId,
    Long chauffeurId
) {
}
