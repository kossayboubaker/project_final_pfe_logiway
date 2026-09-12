package com.logiway.dto.request;

import jakarta.validation.constraints.NotNull;

public record AssignVehiculeDriverRequest(
    @NotNull Long chauffeurId
) {
}
