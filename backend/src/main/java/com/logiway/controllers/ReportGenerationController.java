package com.logiway.controllers;

import com.logiway.dto.request.GenerateReportRequest;
import com.logiway.dto.response.GenerateReportResponse;
import com.logiway.dto.response.ReportListResponse;
import com.logiway.dto.response.ReportMetadataResponse;
import com.logiway.security.AuthenticatedUserService;
import com.logiway.services.ReportGenerationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*", maxAge = 3600)
public class ReportGenerationController {

    private final ReportGenerationService reportGenerationService;
    private final AuthenticatedUserService authenticatedUserService;

    /**
     * Génère un rapport intelligent via NLU
     */
    @PostMapping("/generate")
    @PreAuthorize("hasAnyAuthority('ROLE_SUPERADMIN', 'ROLE_MANAGER')")
    public ResponseEntity<GenerateReportResponse> genererRapport(
            @Valid @RequestBody GenerateReportRequest request) {
        
        log.info("[REPORT-GEN] Requête reçue: requeteNaturelle='{}', formatPrefere='{}'", 
            request.getRequeteNaturelle(), request.getFormatPrefere());
        
        try {
            var utilisateur = authenticatedUserService.getCurrentUser();
            String userId = String.valueOf(utilisateur.getId());
            String entrepriseId = utilisateur.getEntreprise() != null 
                ? String.valueOf(utilisateur.getEntreprise().getId()) 
                : null;

            log.info("[REPORT-GEN] Génération rapport pour {} (user {}): {}", 
                utilisateur.getEmail(), userId, request.getRequeteNaturelle());

            GenerateReportResponse response = reportGenerationService.genererRapport(
                request, userId, entrepriseId
            );

            // Always return 200 OK, success flag in response body indicates result
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("[REPORT-GEN] Erreur génération rapport: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(
                GenerateReportResponse.builder()
                    .success(false)
                    .message("Erreur technique: " + e.getMessage())
                    .build()
            );
        }
    }

    /**
     * Liste tous les rapports (avec filtres optionnels)
     */
    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_SUPERADMIN', 'ROLE_MANAGER')")
    public ResponseEntity<ReportListResponse> listerRapports(
            @RequestParam(required = false) String domaine,
            @RequestParam(required = false, defaultValue = "50") Integer limit) {
        
        try {
            var utilisateur = authenticatedUserService.getCurrentUser();
            String userId = String.valueOf(utilisateur.getId());

            // SUPERADMIN peut voir tous les rapports, MANAGER voit les siens
            boolean isSuperAdmin = utilisateur.getRole().name().equals("SUPERADMIN");
            String userIdFilter = isSuperAdmin ? null : userId;

            ReportListResponse response = reportGenerationService.listerRapports(
                userIdFilter, domaine, limit
            );

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Erreur liste rapports: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Récupère les métadonnées d'un rapport spécifique
     */
    @GetMapping("/{reportId}")
    @PreAuthorize("hasAnyAuthority('ROLE_SUPERADMIN', 'ROLE_MANAGER')")
    public ResponseEntity<ReportMetadataResponse> getMetadataRapport(@PathVariable String reportId) {
        try {
            ReportMetadataResponse metadata = reportGenerationService.getMetadataRapport(reportId);

            if (metadata != null) {
                return ResponseEntity.ok(metadata);
            } else {
                return ResponseEntity.notFound().build();
            }

        } catch (Exception e) {
            log.error("Erreur métadonnées rapport {}: {}", reportId, e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Télécharge un rapport généré
     */
    @GetMapping("/download/{reportId}")
    @PreAuthorize("hasAnyAuthority('ROLE_SUPERADMIN', 'ROLE_MANAGER')")
    public ResponseEntity<byte[]> telechargerRapport(@PathVariable String reportId) {
        try {
            log.info("Téléchargement rapport: {}", reportId);
            return reportGenerationService.telechargerRapport(reportId);

        } catch (Exception e) {
            log.error("Erreur téléchargement rapport {}: {}", reportId, e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Supprime un rapport
     */
    @DeleteMapping("/{reportId}")
    @PreAuthorize("hasAnyAuthority('ROLE_SUPERADMIN', 'ROLE_MANAGER')")
    public ResponseEntity<Void> supprimerRapport(@PathVariable String reportId) {
        try {
            boolean success = reportGenerationService.supprimerRapport(reportId);

            if (success) {
                return ResponseEntity.noContent().build();
            } else {
                return ResponseEntity.notFound().build();
            }

        } catch (Exception e) {
            log.error("Erreur suppression rapport {}: {}", reportId, e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
}
