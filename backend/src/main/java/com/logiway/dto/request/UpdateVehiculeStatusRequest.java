package com.logiway.dto.request;

import com.logiway.entities.enums.StatutVehicule;
import jakarta.validation.constraints.NotNull;

public record UpdateVehiculeStatusRequest(
    @NotNull StatutVehicule statut
) {
}
