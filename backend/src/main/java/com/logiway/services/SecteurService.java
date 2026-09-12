package com.logiway.services;

import com.logiway.dto.request.CreateSectorRequest;
import com.logiway.dto.request.UpdateSectorRequest;
import com.logiway.dto.response.SectorResponse;

import java.util.List;

public interface SecteurService {

    List<SectorResponse> getAccessibleSectors();

    SectorResponse getSectorById(Long id);

    SectorResponse createSector(CreateSectorRequest request);

    SectorResponse updateSector(Long id, UpdateSectorRequest request);

    void deleteSector(Long id);

    SectorResponse assignManager(Long sectorId, Long managerId);

    SectorResponse removeManager(Long sectorId, Long managerId);

    SectorResponse assignChauffeur(Long sectorId, Long chauffeurId);

    SectorResponse removeChauffeur(Long sectorId, Long chauffeurId);
}