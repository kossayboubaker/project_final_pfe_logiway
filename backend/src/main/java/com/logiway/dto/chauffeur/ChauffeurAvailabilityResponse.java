package com.logiway.dto.chauffeur;

import java.time.LocalDateTime;

public record ChauffeurAvailabilityResponse(
    LocalDateTime dateDisponibilite,
    Long minutesRestantes,
    Boolean disponible
) {
}