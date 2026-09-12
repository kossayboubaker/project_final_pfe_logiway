package com.logiway.dto.response;

import com.logiway.entities.enums.Role;
import java.util.List;

public record SectorResponse(
    Long id,
    String nom,
    String description,
    String zoneGeographique,
    String codesPostaux,
    Long entrepriseId,
    List<SectorManagerInfo> managers,
    List<SectorDriverInfo> chauffeurs
) {
    public record SectorManagerInfo(
        Long id,
        String prenom,
        String nom,
        String email,
        Role role
    ) {}

    public record SectorDriverInfo(
        Long id,
        String prenom,
        String nom,
        Long managerId
    ) {}
}
