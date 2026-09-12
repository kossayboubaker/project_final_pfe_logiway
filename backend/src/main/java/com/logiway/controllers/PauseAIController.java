package com.logiway.controllers;

import com.logiway.dto.pause.PauseAIDashboardResponse;
import com.logiway.dto.pause.PauseAIEvaluationRequest;
import com.logiway.dto.pause.PauseAIPredictionResponse;
import com.logiway.services.PauseAIService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/pauseai")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Pause AI", description = "Endpoints pour l'évaluation IA des pauses réglementaires")
@SecurityRequirement(name = "bearer-jwt")
public class PauseAIController {

    private final PauseAIService pauseAIService;

    @PostMapping("/evaluer/{trajetId}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'MANAGER', 'CHAUFFEUR')")
    @Operation(summary = "Évaluer la nécessité d'une pause via le modèle IA",
               description = "Collecte les features GPS et POI, appelle le modèle Python, persiste le résultat et déclenche un événement SSE si nécessaire")
    public ResponseEntity<PauseAIPredictionResponse> evaluerPause(
            @PathVariable Long trajetId,
            @RequestBody PauseAIEvaluationRequest request) {
        
        log.info("[API] POST /api/pauseai/evaluer/{} - lat: {}, lon: {}, dist: {} km", 
                 trajetId, request.getCurrentLatitude(), request.getCurrentLongitude(), 
                 request.getDistanceParcourueKm());

        PauseAIPredictionResponse response = pauseAIService.evaluerPause(
            trajetId,
            request.getCurrentLatitude(),
            request.getCurrentLongitude(),
            request.getDistanceParcourueKm()
        );

        if (response == null) {
            log.info("[API] Évaluation skippée pour trajet {} (conditions non remplies)", trajetId);
            return ResponseEntity.noContent().build();
        }

        return ResponseEntity.ok(response);
    }

    @GetMapping("/trajets/{trajetId}/historique")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'MANAGER', 'CHAUFFEUR')")
    @Operation(summary = "Récupérer l'historique des prédictions IA pour un trajet",
               description = "Retourne toutes les évaluations IA effectuées pendant un trajet, ordonnées par timestamp")
    public ResponseEntity<List<PauseAIPredictionResponse>> getHistoriquePredictions(
            @PathVariable Long trajetId) {
        
        log.info("[API] GET /api/pauseai/trajets/{}/historique", trajetId);
        
        List<PauseAIPredictionResponse> historique = pauseAIService.getHistoriquePredictions(trajetId);
        return ResponseEntity.ok(historique);
    }

    @GetMapping("/dashboard")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'MANAGER')")
    @Operation(summary = "Récupérer les statistiques agrégées pour le dashboard analytique",
               description = "Statistiques filtrées par entreprise selon le rôle. SUPERADMIN voit tout, MANAGER voit son entreprise")
    public ResponseEntity<PauseAIDashboardResponse> getDashboardStats(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(required = false) Long chauffeurId) {
        
        log.info("[API] GET /api/pauseai/dashboard - startDate: {}, endDate: {}, chauffeurId: {}", 
                 startDate, endDate, chauffeurId);
        
        PauseAIDashboardResponse dashboard = pauseAIService.getDashboardStats(startDate, endDate, chauffeurId);
        return ResponseEntity.ok(dashboard);
    }

    @GetMapping(value = "/export", produces = "text/csv")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'MANAGER')")
    @Operation(summary = "Exporter les statistiques Pause AI en CSV",
               description = "Export CSV filtré par période et par entreprise selon le rôle de l'utilisateur")
    public ResponseEntity<String> exportCsv(
            @RequestParam(defaultValue = "SEMAINE") String periode,
            @RequestParam(defaultValue = "csv") String format,
            @RequestParam(required = false) Long chauffeurId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        if (!"csv".equalsIgnoreCase(format)) {
            throw new IllegalArgumentException("Seul le format CSV est pris en charge");
        }

        LocalDateTime[] range = resolvePeriodRange(periode, startDate, endDate);
        String csv = pauseAIService.exportDashboardCsv(range[0], range[1], chauffeurId);

        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=pause-ai-export.csv")
            .contentType(MediaType.parseMediaType("text/csv;charset=UTF-8"))
            .body(csv);
    }

    @GetMapping("/trajets/{trajetId}/pauses-completes")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'MANAGER', 'CHAUFFEUR')")
    @Operation(summary = "Récupérer TOUS les points de pause (réglementaires + POI IA) pour un trajet",
               description = "Appelle directement l'API Flask /api/predict et retourne tous les stops (WARNING_ALERT, MANDATORY_REST, STATION_SERVICE, REST_AREA, CAFE, KIOSK, PARKING, etc.)")
    public ResponseEntity<Map<String, Object>> getPausesCompletes(@PathVariable Long trajetId) {
        log.info("[API] GET /api/pauseai/trajets/{}/pauses-completes", trajetId);
        
        Map<String, Object> pauses = pauseAIService.getPausesCompletes(trajetId);
        return ResponseEntity.ok(pauses);
    }

    private LocalDateTime[] resolvePeriodRange(String periode, LocalDate startDate, LocalDate endDate) {
        LocalDate today = LocalDate.now();
        String normalized = periode == null ? "SEMAINE" : periode.toUpperCase();

        if ("JOUR".equals(normalized) || "TODAY".equals(normalized)) {
            return new LocalDateTime[] { today.atStartOfDay(), today.atTime(23, 59, 59) };
        }

        if ("MOIS".equals(normalized) || "MONTH".equals(normalized)) {
            return new LocalDateTime[] { today.minusDays(30).atStartOfDay(), today.atTime(23, 59, 59) };
        }

        if ("CUSTOM".equals(normalized)) {
            return new LocalDateTime[] {
                (startDate != null ? startDate : today.minusDays(7)).atStartOfDay(),
                (endDate != null ? endDate : today).atTime(23, 59, 59)
            };
        }

        return new LocalDateTime[] { today.minusDays(7).atStartOfDay(), today.atTime(23, 59, 59) };
    }
}
