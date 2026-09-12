package com.logiway.controllers;

import com.logiway.dto.pause.PauseAIDashboardResponse;
import com.logiway.dto.pause.PauseAIEvaluationRequest;
import com.logiway.dto.pause.PauseAIPredictionResponse;
import com.logiway.entities.enums.TypeAlerteIA;
import com.logiway.services.PauseAIService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("PauseAIController — Tests Unitaires")
class PauseAIControllerTest {

    @Mock
    private PauseAIService pauseAIService;

    @InjectMocks
    private PauseAIController pauseAIController;

    // ── Helper factory ──────────────────────────────────────────────────────

    private static PauseAIPredictionResponse prediction() {
        return PauseAIPredictionResponse.builder()
            .id(1L)
            .trajetId(10L)
            .timestamp(LocalDateTime.of(2026, 8, 10, 10, 0))
            .hoursDriving(4.5)
            .distAlongRatio(0.5)
            .score(80)
            .poiType("REST_AREA")
            .alerteDeclenchee(true)
            .typeAlerte(TypeAlerteIA.URGENTE)
            .latitudePoi(48.85)
            .longitudePoi(2.35)
            .nomPoi("Aire de repos")
            .distancePoiM(120.0)
            .build();
    }

    private static PauseAIDashboardResponse dashboard(int total, int effectuees, int ignorees,
                                                       double taux, double score) {
        return PauseAIDashboardResponse.builder()
            .totalPausesRecommandees(total)
            .pausesEffectuees(effectuees)
            .pausesIgnorees(ignorees)
            .tauxConformite(taux)
            .scoreMoyenFatigue(score)
            .build();
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 1. POST /api/pauseai/evaluer/{trajetId}
    // ═══════════════════════════════════════════════════════════════════════

    @Test
    @DisplayName("evaluerPause → 200 OK avec réponse URGENTE")
    void evaluerPause_returnsOk() {
        PauseAIEvaluationRequest req = PauseAIEvaluationRequest.builder()
            .currentLatitude(48.85).currentLongitude(2.35).distanceParcourueKm(250.5).build();
        when(pauseAIService.evaluerPause(10L, 48.85, 2.35, 250.5)).thenReturn(prediction());

        ResponseEntity<PauseAIPredictionResponse> response = pauseAIController.evaluerPause(10L, req);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getTypeAlerte()).isEqualTo(TypeAlerteIA.URGENTE);
        assertThat(response.getBody().getId()).isEqualTo(1L);
        verify(pauseAIService).evaluerPause(10L, 48.85, 2.35, 250.5);
    }

    @Test
    @DisplayName("evaluerPause → 204 NO_CONTENT quand service retourne null")
    void evaluerPause_null_returnsNoContent() {
        PauseAIEvaluationRequest req = PauseAIEvaluationRequest.builder()
            .currentLatitude(48.85).currentLongitude(2.35).distanceParcourueKm(5.0).build();
        when(pauseAIService.evaluerPause(any(), any(), any(), any())).thenReturn(null);

        ResponseEntity<PauseAIPredictionResponse> response = pauseAIController.evaluerPause(10L, req);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        assertThat(response.getBody()).isNull();
        verify(pauseAIService).evaluerPause(10L, 48.85, 2.35, 5.0);
    }

    @Test
    @DisplayName("evaluerPause → score élevé (fatigue critique)")
    void evaluerPause_highFatigueScore() {
        PauseAIEvaluationRequest req = PauseAIEvaluationRequest.builder()
            .currentLatitude(43.30).currentLongitude(5.37).distanceParcourueKm(450.0).build();
        PauseAIPredictionResponse pred = PauseAIPredictionResponse.builder()
            .id(2L).trajetId(10L)
            .timestamp(LocalDateTime.of(2026, 8, 10, 14, 0))
            .hoursDriving(9.0).distAlongRatio(0.9).score(99)
            .poiType("STATION_SERVICE").alerteDeclenchee(true)
            .typeAlerte(TypeAlerteIA.URGENTE)
            .latitudePoi(43.30).longitudePoi(5.37)
            .nomPoi("Station Total").distancePoiM(50.0).build();
        when(pauseAIService.evaluerPause(10L, 43.30, 5.37, 450.0)).thenReturn(pred);

        ResponseEntity<PauseAIPredictionResponse> response = pauseAIController.evaluerPause(10L, req);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().getScore()).isEqualTo(99);
        assertThat(response.getBody().getHoursDriving()).isEqualTo(9.0);
        assertThat(response.getBody().getPoiType()).isEqualTo("STATION_SERVICE");
    }

    @Test
    @DisplayName("evaluerPause → alerte RECOMMANDEE (non urgente)")
    void evaluerPause_recommandeeAlerte() {
        PauseAIEvaluationRequest req = PauseAIEvaluationRequest.builder()
            .currentLatitude(48.85).currentLongitude(2.35).distanceParcourueKm(180.0).build();
        PauseAIPredictionResponse pred = PauseAIPredictionResponse.builder()
            .id(3L).trajetId(10L)
            .timestamp(LocalDateTime.of(2026, 8, 10, 9, 0))
            .hoursDriving(3.0).distAlongRatio(0.3).score(55)
            .alerteDeclenchee(false)
            .typeAlerte(TypeAlerteIA.RECOMMANDEE)
            .nomPoi("Café de la gare").distancePoiM(200.0).build();
        when(pauseAIService.evaluerPause(10L, 48.85, 2.35, 180.0)).thenReturn(pred);

        ResponseEntity<PauseAIPredictionResponse> response = pauseAIController.evaluerPause(10L, req);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().getAlerteDeclenchee()).isFalse();
        assertThat(response.getBody().getTypeAlerte()).isEqualTo(TypeAlerteIA.RECOMMANDEE);
    }

    @Test
    @DisplayName("evaluerPause → typeAlerte AUCUNE (pas de pause requise)")
    void evaluerPause_aucuneAlerte() {
        PauseAIEvaluationRequest req = PauseAIEvaluationRequest.builder()
            .currentLatitude(45.0).currentLongitude(1.0).distanceParcourueKm(50.0).build();
        PauseAIPredictionResponse pred = PauseAIPredictionResponse.builder()
            .id(4L).trajetId(10L).score(20)
            .alerteDeclenchee(false).typeAlerte(TypeAlerteIA.AUCUNE).build();
        when(pauseAIService.evaluerPause(10L, 45.0, 1.0, 50.0)).thenReturn(pred);

        ResponseEntity<PauseAIPredictionResponse> response = pauseAIController.evaluerPause(10L, req);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().getTypeAlerte()).isEqualTo(TypeAlerteIA.AUCUNE);
        assertThat(response.getBody().getAlerteDeclenchee()).isFalse();
    }

    @Test
    @DisplayName("evaluerPause → paramètres transmis correctement au service")
    void evaluerPause_correctParamsForwarded() {
        PauseAIEvaluationRequest req = PauseAIEvaluationRequest.builder()
            .currentLatitude(44.0).currentLongitude(3.0).distanceParcourueKm(300.0).build();
        when(pauseAIService.evaluerPause(20L, 44.0, 3.0, 300.0)).thenReturn(prediction());

        pauseAIController.evaluerPause(20L, req);

        verify(pauseAIService).evaluerPause(20L, 44.0, 3.0, 300.0);
        verifyNoMoreInteractions(pauseAIService);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 2. GET /api/pauseai/trajets/{trajetId}/historique
    // ═══════════════════════════════════════════════════════════════════════

    @Test
    @DisplayName("getHistoriquePredictions → 200 OK avec une prédiction")
    void getHistoriquePredictions_returnsOk() {
        when(pauseAIService.getHistoriquePredictions(10L)).thenReturn(List.of(prediction()));

        ResponseEntity<List<PauseAIPredictionResponse>> response =
            pauseAIController.getHistoriquePredictions(10L);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).hasSize(1);
        assertThat(response.getBody().get(0).getTrajetId()).isEqualTo(10L);
        verify(pauseAIService).getHistoriquePredictions(10L);
    }

    @Test
    @DisplayName("getHistoriquePredictions → 200 OK liste vide (aucune prédiction)")
    void getHistoriquePredictions_empty() {
        when(pauseAIService.getHistoriquePredictions(99L)).thenReturn(List.of());

        ResponseEntity<List<PauseAIPredictionResponse>> response =
            pauseAIController.getHistoriquePredictions(99L);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEmpty();
        verify(pauseAIService).getHistoriquePredictions(99L);
    }

    @Test
    @DisplayName("getHistoriquePredictions → plusieurs prédictions, ordre conservé")
    void getHistoriquePredictions_multipleResults() {
        PauseAIPredictionResponse pred2 = PauseAIPredictionResponse.builder()
            .id(2L).trajetId(10L)
            .timestamp(LocalDateTime.of(2026, 8, 10, 12, 0))
            .score(70).alerteDeclenchee(true).typeAlerte(TypeAlerteIA.URGENTE).build();
        when(pauseAIService.getHistoriquePredictions(10L))
            .thenReturn(List.of(prediction(), pred2));

        ResponseEntity<List<PauseAIPredictionResponse>> response =
            pauseAIController.getHistoriquePredictions(10L);

        assertThat(response.getBody()).hasSize(2);
        assertThat(response.getBody().get(0).getId()).isEqualTo(1L);
        assertThat(response.getBody().get(1).getId()).isEqualTo(2L);
    }

    @Test
    @DisplayName("getHistoriquePredictions → trajetId différents isolés")
    void getHistoriquePredictions_differentTrajetIds() {
        PauseAIPredictionResponse predT5 = PauseAIPredictionResponse.builder()
            .id(5L).trajetId(5L).score(60).typeAlerte(TypeAlerteIA.RECOMMANDEE).build();
        when(pauseAIService.getHistoriquePredictions(5L)).thenReturn(List.of(predT5));

        ResponseEntity<List<PauseAIPredictionResponse>> response =
            pauseAIController.getHistoriquePredictions(5L);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().get(0).getTrajetId()).isEqualTo(5L);
        verify(pauseAIService).getHistoriquePredictions(5L);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 3. GET /api/pauseai/dashboard
    // ═══════════════════════════════════════════════════════════════════════

    @Test
    @DisplayName("getDashboardStats → 200 OK avec chauffeurId")
    void getDashboardStats_withChauffeurId() {
        LocalDateTime start = LocalDateTime.of(2026, 8, 1, 0, 0);
        LocalDateTime end   = LocalDateTime.of(2026, 8, 10, 23, 59, 59);
        when(pauseAIService.getDashboardStats(start, end, 5L))
            .thenReturn(dashboard(10, 8, 2, 80.0, 65.0));

        ResponseEntity<PauseAIDashboardResponse> response =
            pauseAIController.getDashboardStats(start, end, 5L);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().getTotalPausesRecommandees()).isEqualTo(10);
        assertThat(response.getBody().getPausesEffectuees()).isEqualTo(8);
        verify(pauseAIService).getDashboardStats(start, end, 5L);
    }

    @Test
    @DisplayName("getDashboardStats → 200 OK sans chauffeurId (stats globales)")
    void getDashboardStats_noChauffeurId() {
        LocalDateTime start = LocalDateTime.of(2026, 8, 1, 0, 0);
        LocalDateTime end   = LocalDateTime.of(2026, 8, 31, 23, 59);
        when(pauseAIService.getDashboardStats(start, end, null))
            .thenReturn(dashboard(50, 40, 10, 80.0, 60.0));

        ResponseEntity<PauseAIDashboardResponse> response =
            pauseAIController.getDashboardStats(start, end, null);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().getPausesIgnorees()).isEqualTo(10);
        assertThat(response.getBody().getTauxConformite()).isEqualTo(80.0);
        verify(pauseAIService).getDashboardStats(start, end, null);
    }

    @Test
    @DisplayName("getDashboardStats → taux conformité et score fatigue corrects")
    void getDashboardStats_tauxConformiteVerified() {
        LocalDateTime start = LocalDateTime.of(2026, 7, 1, 0, 0);
        LocalDateTime end   = LocalDateTime.of(2026, 7, 31, 23, 59);
        when(pauseAIService.getDashboardStats(start, end, 3L))
            .thenReturn(dashboard(20, 15, 5, 75.0, 55.0));

        ResponseEntity<PauseAIDashboardResponse> response =
            pauseAIController.getDashboardStats(start, end, 3L);

        assertThat(response.getBody().getTauxConformite()).isEqualTo(75.0);
        assertThat(response.getBody().getScoreMoyenFatigue()).isEqualTo(55.0);
    }

    @Test
    @DisplayName("getDashboardStats → service appelé exactement une fois")
    void getDashboardStats_serviceCalledOnce() {
        LocalDateTime start = LocalDateTime.of(2026, 8, 1, 0, 0);
        LocalDateTime end   = LocalDateTime.of(2026, 8, 10, 23, 59);
        when(pauseAIService.getDashboardStats(any(), any(), any()))
            .thenReturn(PauseAIDashboardResponse.builder().build());

        pauseAIController.getDashboardStats(start, end, null);

        verify(pauseAIService, times(1)).getDashboardStats(start, end, null);
        verifyNoMoreInteractions(pauseAIService);
    }

    @Test
    @DisplayName("getDashboardStats → zéro pauses (début de période)")
    void getDashboardStats_zeroPauses() {
        LocalDateTime start = LocalDateTime.of(2026, 8, 1, 0, 0);
        LocalDateTime end   = LocalDateTime.of(2026, 8, 1, 1, 0);
        when(pauseAIService.getDashboardStats(start, end, null))
            .thenReturn(dashboard(0, 0, 0, 0.0, 0.0));

        ResponseEntity<PauseAIDashboardResponse> response =
            pauseAIController.getDashboardStats(start, end, null);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().getTotalPausesRecommandees()).isEqualTo(0);
        assertThat(response.getBody().getTauxConformite()).isEqualTo(0.0);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 4. GET /api/pauseai/export
    // ═══════════════════════════════════════════════════════════════════════

    @Test
    @DisplayName("exportCsv → SEMAINE par défaut : status, headers, body")
    void exportCsv_semaine_statusHeadersBody() {
        LocalDate today = LocalDate.now();
        LocalDateTime start = today.minusDays(7).atStartOfDay();
        LocalDateTime end   = today.atTime(23, 59, 59);
        when(pauseAIService.exportDashboardCsv(start, end, null))
            .thenReturn("periode,count\n2026-08,5");

        ResponseEntity<String> response =
            pauseAIController.exportCsv("SEMAINE", "csv", null, null, null);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getHeaders().getFirst(HttpHeaders.CONTENT_DISPOSITION))
            .isEqualTo("attachment; filename=pause-ai-export.csv");
        assertThat(response.getHeaders().getContentType())
            .isEqualTo(MediaType.parseMediaType("text/csv;charset=UTF-8"));
        assertThat(response.getBody()).contains("periode");
        verify(pauseAIService).exportDashboardCsv(start, end, null);
    }

    @Test
    @DisplayName("exportCsv → période null → fallback SEMAINE")
    void exportCsv_nullPeriode_defaultsSemaine() {
        LocalDate today = LocalDate.now();
        LocalDateTime start = today.minusDays(7).atStartOfDay();
        LocalDateTime end   = today.atTime(23, 59, 59);
        when(pauseAIService.exportDashboardCsv(start, end, null)).thenReturn("data");

        ResponseEntity<String> response =
            pauseAIController.exportCsv(null, "csv", null, null, null);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        verify(pauseAIService).exportDashboardCsv(start, end, null);
    }

    @Test
    @DisplayName("exportCsv → période JOUR")
    void exportCsv_jour() {
        LocalDate today = LocalDate.now();
        LocalDateTime start = today.atStartOfDay();
        LocalDateTime end   = today.atTime(23, 59, 59);
        when(pauseAIService.exportDashboardCsv(start, end, null)).thenReturn("data");

        ResponseEntity<String> response =
            pauseAIController.exportCsv("JOUR", "csv", null, null, null);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        verify(pauseAIService).exportDashboardCsv(start, end, null);
    }

    @Test
    @DisplayName("exportCsv → période TODAY (alias JOUR)")
    void exportCsv_today() {
        LocalDate today = LocalDate.now();
        LocalDateTime start = today.atStartOfDay();
        LocalDateTime end   = today.atTime(23, 59, 59);
        when(pauseAIService.exportDashboardCsv(start, end, null)).thenReturn("data");

        ResponseEntity<String> response =
            pauseAIController.exportCsv("TODAY", "csv", null, null, null);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        verify(pauseAIService).exportDashboardCsv(start, end, null);
    }

    @Test
    @DisplayName("exportCsv → période MOIS avec chauffeurId")
    void exportCsv_mois_withChauffeurId() {
        LocalDate today = LocalDate.now();
        LocalDateTime start = today.minusDays(30).atStartOfDay();
        LocalDateTime end   = today.atTime(23, 59, 59);
        when(pauseAIService.exportDashboardCsv(start, end, 5L)).thenReturn("data");

        ResponseEntity<String> response =
            pauseAIController.exportCsv("MOIS", "csv", 5L, null, null);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        verify(pauseAIService).exportDashboardCsv(start, end, 5L);
    }

    @Test
    @DisplayName("exportCsv → période MONTH (alias MOIS)")
    void exportCsv_month() {
        LocalDate today = LocalDate.now();
        LocalDateTime start = today.minusDays(30).atStartOfDay();
        LocalDateTime end   = today.atTime(23, 59, 59);
        when(pauseAIService.exportDashboardCsv(start, end, null)).thenReturn("data");

        ResponseEntity<String> response =
            pauseAIController.exportCsv("MONTH", "csv", null, null, null);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        verify(pauseAIService).exportDashboardCsv(start, end, null);
    }

    @Test
    @DisplayName("exportCsv → CUSTOM avec les deux dates fournies")
    void exportCsv_customBothDates() {
        LocalDate startDate = LocalDate.of(2026, 5, 1);
        LocalDate endDate   = LocalDate.of(2026, 5, 31);
        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end   = endDate.atTime(23, 59, 59);
        when(pauseAIService.exportDashboardCsv(start, end, null)).thenReturn("mai-data");

        ResponseEntity<String> response =
            pauseAIController.exportCsv("CUSTOM", "csv", null, startDate, endDate);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEqualTo("mai-data");
        verify(pauseAIService).exportDashboardCsv(start, end, null);
    }

    @Test
    @DisplayName("exportCsv → CUSTOM startDate null → fallback 7 jours avant")
    void exportCsv_customNullStartDate() {
        LocalDate today   = LocalDate.now();
        LocalDate endDate = LocalDate.of(2026, 8, 20);
        LocalDateTime start = today.minusDays(7).atStartOfDay();
        LocalDateTime end   = endDate.atTime(23, 59, 59);
        when(pauseAIService.exportDashboardCsv(start, end, null)).thenReturn("data");

        ResponseEntity<String> response =
            pauseAIController.exportCsv("CUSTOM", "csv", null, null, endDate);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        verify(pauseAIService).exportDashboardCsv(start, end, null);
    }

    @Test
    @DisplayName("exportCsv → CUSTOM endDate null → fallback aujourd'hui")
    void exportCsv_customNullEndDate() {
        LocalDate startDate = LocalDate.of(2026, 8, 1);
        LocalDate today     = LocalDate.now();
        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end   = today.atTime(23, 59, 59);
        when(pauseAIService.exportDashboardCsv(start, end, null)).thenReturn("data");

        ResponseEntity<String> response =
            pauseAIController.exportCsv("CUSTOM", "csv", null, startDate, null);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        verify(pauseAIService).exportDashboardCsv(start, end, null);
    }

    @Test
    @DisplayName("exportCsv → chauffeurId propagé correctement au service")
    void exportCsv_chauffeurIdPropagated() {
        LocalDate today = LocalDate.now();
        LocalDateTime start = today.minusDays(7).atStartOfDay();
        LocalDateTime end   = today.atTime(23, 59, 59);
        when(pauseAIService.exportDashboardCsv(start, end, 7L)).thenReturn("data");

        ResponseEntity<String> response =
            pauseAIController.exportCsv("SEMAINE", "csv", 7L, null, null);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        verify(pauseAIService).exportDashboardCsv(start, end, 7L);
    }

    @Test
    @DisplayName("exportCsv → format CSV en majuscules accepté")
    void exportCsv_formatUppercaseAccepted() {
        when(pauseAIService.exportDashboardCsv(any(), any(), any())).thenReturn("data");

        ResponseEntity<String> response =
            pauseAIController.exportCsv("SEMAINE", "CSV", null, null, null);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        verify(pauseAIService, times(1)).exportDashboardCsv(any(), any(), any());
    }

    @Test
    @DisplayName("exportCsv → body CSV contient les colonnes attendues")
    void exportCsv_bodyContainsColumns() {
        String csv = "periode,total_recommandees,effectuees,taux\n2026-08,10,8,80.0";
        when(pauseAIService.exportDashboardCsv(any(), any(), any())).thenReturn(csv);

        ResponseEntity<String> response =
            pauseAIController.exportCsv("SEMAINE", "csv", null, null, null);

        assertThat(response.getBody()).isNotBlank();
        assertThat(response.getBody()).contains("periode");
        assertThat(response.getBody()).contains("taux");
        assertThat(response.getBody()).contains("80.0");
    }

    @Test
    @DisplayName("exportCsv → format pdf → IllegalArgumentException")
    void exportCsv_formatPdf_throws() {
        assertThatThrownBy(() ->
            pauseAIController.exportCsv("SEMAINE", "pdf", null, null, null))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("Seul le format CSV est pris en charge");
        verifyNoInteractions(pauseAIService);
    }

    @Test
    @DisplayName("exportCsv → format xlsx → IllegalArgumentException")
    void exportCsv_formatXlsx_throws() {
        assertThatThrownBy(() ->
            pauseAIController.exportCsv("SEMAINE", "xlsx", null, null, null))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("Seul le format CSV est pris en charge");
        verifyNoInteractions(pauseAIService);
    }

    @Test
    @DisplayName("exportCsv → format json → IllegalArgumentException")
    void exportCsv_formatJson_throws() {
        assertThatThrownBy(() ->
            pauseAIController.exportCsv("JOUR", "json", null, null, null))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("Seul le format CSV est pris en charge");
        verifyNoInteractions(pauseAIService);
    }

    @Test
    @DisplayName("exportCsv → Content-Disposition header = attachment avec nom fixe")
    void exportCsv_contentDispositionHeader() {
        when(pauseAIService.exportDashboardCsv(any(), any(), any())).thenReturn("data");

        ResponseEntity<String> response =
            pauseAIController.exportCsv("SEMAINE", "csv", null, null, null);

        assertThat(response.getHeaders().getFirst(HttpHeaders.CONTENT_DISPOSITION))
            .isEqualTo("attachment; filename=pause-ai-export.csv");
    }

    @Test
    @DisplayName("exportCsv → Content-Type = text/csv;charset=UTF-8")
    void exportCsv_contentTypeIsTextCsv() {
        when(pauseAIService.exportDashboardCsv(any(), any(), any())).thenReturn("data");

        ResponseEntity<String> response =
            pauseAIController.exportCsv("SEMAINE", "csv", null, null, null);

        assertThat(response.getHeaders().getContentType())
            .isEqualTo(MediaType.parseMediaType("text/csv;charset=UTF-8"));
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 5. GET /api/pauseai/trajets/{trajetId}/pauses-completes
    // ═══════════════════════════════════════════════════════════════════════

    @Test
    @DisplayName("getPausesCompletes → 200 OK avec clé stops")
    void getPausesCompletes_returnsOk() {
        when(pauseAIService.getPausesCompletes(10L))
            .thenReturn(Map.of("stops", List.of("REST_AREA", "CAFE")));

        ResponseEntity<Map<String, Object>> response =
            pauseAIController.getPausesCompletes(10L);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).containsKey("stops");
        verify(pauseAIService).getPausesCompletes(10L);
    }

    @Test
    @DisplayName("getPausesCompletes → Map vide quand aucun stop disponible")
    void getPausesCompletes_emptyMap() {
        when(pauseAIService.getPausesCompletes(55L)).thenReturn(Map.of());

        ResponseEntity<Map<String, Object>> response =
            pauseAIController.getPausesCompletes(55L);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEmpty();
        verify(pauseAIService).getPausesCompletes(55L);
    }

    @Test
    @DisplayName("getPausesCompletes → Map avec plusieurs clés (stops, totalStops, trajetId)")
    void getPausesCompletes_richResponse() {
        Map<String, Object> pauses = Map.of(
            "stops",      List.of("REST_AREA", "CAFE", "STATION_SERVICE"),
            "totalStops", 3,
            "trajetId",   10L
        );
        when(pauseAIService.getPausesCompletes(10L)).thenReturn(pauses);

        ResponseEntity<Map<String, Object>> response =
            pauseAIController.getPausesCompletes(10L);

        assertThat(response.getBody()).containsKey("stops");
        assertThat(response.getBody()).containsKey("totalStops");
        assertThat(response.getBody().get("totalStops")).isEqualTo(3);
    }

    @Test
    @DisplayName("getPausesCompletes → service appelé avec le bon trajetId")
    void getPausesCompletes_correctTrajetId() {
        when(pauseAIService.getPausesCompletes(42L)).thenReturn(Map.of("stops", List.of()));

        pauseAIController.getPausesCompletes(42L);

        verify(pauseAIService).getPausesCompletes(42L);
        verifyNoMoreInteractions(pauseAIService);
    }
}
