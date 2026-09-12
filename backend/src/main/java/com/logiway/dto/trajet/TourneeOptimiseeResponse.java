package com.logiway.dto.trajet;

import java.util.List;

public record TourneeOptimiseeResponse(
    Long vehiculeId,
    String vehiculeMatricule,
    String vehiculeCouleur,
    Double vehiculeLatitude,
    Double vehiculeLongitude,
    List<TrajetResponse> trajets
) {
}