package com.logiway.controllers;

import com.logiway.dto.pause.PauseReglementaireResponse;
import com.logiway.services.PauseReglementaireService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller admin pour regénérer manuellement les pauses
 * TEMPORAIRE - pour debug uniquement
 */
@RestController
@RequestMapping("/api/admin/pauses")
@RequiredArgsConstructor
@Slf4j
public class AdminPauseController {

    private final PauseReglementaireService pauseService;

    @PostMapping("/regenerer/{trajetId}")
    public ResponseEntity<List<PauseReglementaireResponse>> regenererPauses(
            @PathVariable Long trajetId) {
        log.info("Admin: Régénération manuelle des pauses pour trajet {}", trajetId);
        List<PauseReglementaireResponse> pauses = pauseService.genererPauses(trajetId);
        return ResponseEntity.ok(pauses);
    }
}
