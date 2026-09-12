package com.logiway.dto.request;

import jakarta.validation.constraints.Size;

public record UpdateSectorRequest(
    @Size(min = 3, max = 150) String nom,
    @Size(max = 500) String description,
    @Size(max = 100) String zoneGeographique,
    @Size(max = 500) String codesPostaux,
    Long entrepriseId,
    Long managerId
) {
}
