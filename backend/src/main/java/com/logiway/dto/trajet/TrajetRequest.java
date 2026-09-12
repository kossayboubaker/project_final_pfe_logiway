package com.logiway.dto.trajet;

import com.logiway.entities.enums.PrioriteTrajet;
import com.logiway.entities.enums.StatutTrajet;

import java.time.LocalDateTime;

public record TrajetRequest(
    String pointDepart,
    String destination,
    Double latitudeDepart,
    Double longitudeDepart,
    Double latitudeArrivee,
    Double longitudeArrivee,
    LocalDateTime dateDepart,
    LocalDateTime dateArrivee,
    Double chargeKg,
    PrioriteTrajet priorite,
    String notes,
    Long chauffeurId,
    Long vehiculeId,
    Long managerId,
    StatutTrajet statut,
    String typeOptimisation
) {
}