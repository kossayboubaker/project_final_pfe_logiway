package com.logiway.controllers;

import com.logiway.dto.request.CreateSectorRequest;
import com.logiway.dto.request.UpdateSectorRequest;
import com.logiway.dto.response.SectorResponse;
import com.logiway.services.SecteurService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/secteurs")
@RequiredArgsConstructor
public class SecteurController {

    private final SecteurService secteurService;

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_SUPERADMIN','ROLE_MANAGER','ROLE_CHAUFFEUR')")
    public ResponseEntity<List<SectorResponse>> list() {
        return ResponseEntity.ok(secteurService.getAccessibleSectors());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_SUPERADMIN','ROLE_MANAGER','ROLE_CHAUFFEUR')")
    public ResponseEntity<SectorResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(secteurService.getSectorById(id));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_SUPERADMIN')")
    public ResponseEntity<SectorResponse> create(@Valid @RequestBody CreateSectorRequest request) {
        return ResponseEntity.ok(secteurService.createSector(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_SUPERADMIN')")
    public ResponseEntity<SectorResponse> update(@PathVariable Long id, @Valid @RequestBody UpdateSectorRequest request) {
        return ResponseEntity.ok(secteurService.updateSector(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_SUPERADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        secteurService.deleteSector(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/manager/{managerId}")
    @PreAuthorize("hasAuthority('ROLE_SUPERADMIN')")
    public ResponseEntity<SectorResponse> assignManager(@PathVariable Long id, @PathVariable Long managerId) {
        return ResponseEntity.ok(secteurService.assignManager(id, managerId));
    }

    @DeleteMapping("/{id}/manager/{managerId}")
    @PreAuthorize("hasAuthority('ROLE_SUPERADMIN')")
    public ResponseEntity<SectorResponse> removeManager(@PathVariable Long id, @PathVariable Long managerId) {
        return ResponseEntity.ok(secteurService.removeManager(id, managerId));
    }

    @PutMapping("/{id}/chauffeur/{chauffeurId}")
    @PreAuthorize("hasAuthority('ROLE_SUPERADMIN')")
    public ResponseEntity<SectorResponse> assignChauffeur(@PathVariable Long id, @PathVariable Long chauffeurId) {
        return ResponseEntity.ok(secteurService.assignChauffeur(id, chauffeurId));
    }

    @DeleteMapping("/{id}/chauffeur/{chauffeurId}")
    @PreAuthorize("hasAuthority('ROLE_SUPERADMIN')")
    public ResponseEntity<SectorResponse> removeChauffeur(@PathVariable Long id, @PathVariable Long chauffeurId) {
        return ResponseEntity.ok(secteurService.removeChauffeur(id, chauffeurId));
    }
}