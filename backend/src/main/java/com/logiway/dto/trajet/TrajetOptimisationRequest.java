package com.logiway.dto.trajet;

import java.util.List;

public record TrajetOptimisationRequest(
    List<TrajetRequest> trajets,
    List<Long> vehiculeIds
) {
}