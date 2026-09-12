package com.logiway.dto.trajet;

import java.time.LocalDateTime;

public record TrajetPositionRequest(
    Double latitude,
    Double longitude,
    Double vitesse,
    Double carburant,
    LocalDateTime datePosition
) {
}