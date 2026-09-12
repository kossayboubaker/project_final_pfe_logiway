package com.logiway.controllers;

import com.logiway.dto.pause.PauseReglementaireResponse;
import com.logiway.entities.enums.StatutPause;
import com.logiway.services.PauseReglementaireService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Endpoint exposant les pauses réglementaires planifiées pour un trajet.
 *
 * GET /api/trajets/{trajetId}/pauses
 *
 * Accès :
 *  - SUPERADMIN  → tous les trajets
 *  - MANAGER     → ses trajets seulement (chauffeurs supervisés)
 *  - CHAUFFEUR   → son propre trajet seulement
 *
 * La logique de filtrage est intégralement gérée par PauseReglementaireServiceImpl.
 */
@RestController
@RequestMapping("/api/trajets")
@RequiredArgsConstructor
public class PauseReglementaireController {

    private final PauseReglementaireService pauseService;

    @GetMapping("/{trajetId}/pauses")
    public ResponseEntity<List<PauseReglementaireResponse>> getPausesForTrajet(
            @PathVariable Long trajetId) {
        return ResponseEntity.ok(pauseService.getPausesForTrajet(trajetId));
    }
    
    @PostMapping("/{trajetId}/pauses/regenerer")
    public ResponseEntity<List<PauseReglementaireResponse>> regenererPauses(
            @PathVariable Long trajetId) {
        return ResponseEntity.ok(pauseService.genererPauses(trajetId));
    }

    @PostMapping("/{trajetId}/pauses/{pauseId}/effectuee")
    public ResponseEntity<PauseReglementaireResponse> marquerPauseEffectuee(
            @PathVariable Long trajetId,
            @PathVariable Long pauseId) {
        return ResponseEntity.ok(pauseService.mettreAJourStatutPause(trajetId, pauseId, StatutPause.ATTEINTE));
    }

    @PostMapping("/{trajetId}/pauses/{pauseId}/ignorer")
    public ResponseEntity<PauseReglementaireResponse> ignorerPause(
            @PathVariable Long trajetId,
            @PathVariable Long pauseId) {
        return ResponseEntity.ok(pauseService.mettreAJourStatutPause(trajetId, pauseId, StatutPause.IGNOREE));
    }
}
