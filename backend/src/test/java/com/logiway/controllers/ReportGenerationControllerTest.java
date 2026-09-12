package com.logiway.controllers;

import com.logiway.dto.request.GenerateReportRequest;
import com.logiway.dto.response.GenerateReportResponse;
import com.logiway.dto.response.ReportListResponse;
import com.logiway.dto.response.ReportMetadataResponse;
import com.logiway.entities.Entreprise;
import com.logiway.entities.Utilisateur;
import com.logiway.entities.enums.Role;
import com.logiway.security.AuthenticatedUserService;
import com.logiway.services.ReportGenerationService;
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

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Controller Report Generation — Tests Unitaires")
class ReportGenerationControllerTest {

    @Mock
    private ReportGenerationService reportGenerationService;

    @Mock
    private AuthenticatedUserService authenticatedUserService;

    @InjectMocks
    private ReportGenerationController reportGenerationController;

    private static Utilisateur superAdmin() {
        return Utilisateur.builder()
            .id(1L)
            .prenom("Jean")
            .nom("Dupont")
            .email("jean@logiway.com")
            .role(Role.SUPERADMIN)
            .entreprise(Entreprise.builder().id(10L).nomEntreprise("LogiWay").build())
            .build();
    }

    private static Utilisateur manager() {
        return Utilisateur.builder()
            .id(2L)
            .prenom("Marie")
            .nom("Martin")
            .email("marie@logiway.com")
            .role(Role.MANAGER)
            .build();
    }

    private static GenerateReportRequest generateRequest() {
        return GenerateReportRequest.builder()
            .requeteNaturelle("Liste des véhicules de la flotte")
            .formatPrefere("PDF")
            .build();
    }

    private static GenerateReportResponse generateResponse() {
        return GenerateReportResponse.builder()
            .success(true)
            .reportId("r-1")
            .message("Rapport généré")
            .urlDownload("http://localhost:5003/download/r-1")
            .build();
    }

    private static ReportMetadataResponse metadata() {
        return ReportMetadataResponse.builder()
            .reportId("r-1")
            .titre("Rapport Véhicules")
            .format("PDF")
            .domaine("vehicules")
            .statut("GENERATED")
            .userId("1")
            .entrepriseId("10")
            .dateCreation(LocalDateTime.of(2026, 8, 10, 10, 0))
            .build();
    }

    @Test
    @DisplayName("POST /api/reports/generate → Génère un rapport pour un utilisateur avec entreprise")
    void genererRapport_returnsOk() {
        GenerateReportRequest request = generateRequest();
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin());
        when(reportGenerationService.genererRapport(request, "1", "10")).thenReturn(generateResponse());

        ResponseEntity<GenerateReportResponse> response = reportGenerationController.genererRapport(request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().getSuccess()).isTrue();
        assertThat(response.getBody().getReportId()).isEqualTo("r-1");
        verify(reportGenerationService, times(1)).genererRapport(request, "1", "10");
    }

    @Test
    @DisplayName("POST /api/reports/generate → Entreprise null → entrepriseId null")
    void genererRapport_withoutEntreprise_returnsOk() {
        GenerateReportRequest request = generateRequest();
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager());
        when(reportGenerationService.genererRapport(request, "2", null)).thenReturn(generateResponse());

        ResponseEntity<GenerateReportResponse> response = reportGenerationController.genererRapport(request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        verify(reportGenerationService, times(1)).genererRapport(request, "2", null);
    }

    @Test
    @DisplayName("POST /api/reports/generate → Erreur renvoie 500 avec success=false")
    void genererRapport_error_returnsInternalServerError() {
        GenerateReportRequest request = generateRequest();
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin());
        when(reportGenerationService.genererRapport(any(GenerateReportRequest.class), anyString(), any()))
            .thenThrow(new RuntimeException("boom"));

        ResponseEntity<GenerateReportResponse> response = reportGenerationController.genererRapport(request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody().getSuccess()).isFalse();
        assertThat(response.getBody().getMessage()).startsWith("Erreur technique");
    }

    @Test
    @DisplayName("GET /api/reports → SUPERADMIN voit tous les rapports (userIdFilter null)")
    void listerRapports_superAdmin_returnsOk() {
        ReportListResponse list = ReportListResponse.builder()
            .total(1)
            .rapports(List.of(metadata()))
            .build();
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin());
        when(reportGenerationService.listerRapports(null, "vehicules", 50)).thenReturn(list);

        ResponseEntity<ReportListResponse> response = reportGenerationController.listerRapports("vehicules", 50);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().getTotal()).isEqualTo(1);
        verify(reportGenerationService, times(1)).listerRapports(null, "vehicules", 50);
    }

    @Test
    @DisplayName("GET /api/reports → MANAGER ne voit que ses rapports")
    void listerRapports_manager_returnsOk() {
        ReportListResponse list = ReportListResponse.builder().total(0).rapports(List.of()).build();
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager());
        when(reportGenerationService.listerRapports("2", "vehicules", 50)).thenReturn(list);

        ResponseEntity<ReportListResponse> response = reportGenerationController.listerRapports("vehicules", 50);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        verify(reportGenerationService, times(1)).listerRapports("2", "vehicules", 50);
    }

    @Test
    @DisplayName("GET /api/reports → Erreur renvoie 500")
    void listerRapports_error_returnsInternalServerError() {
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin());
        when(reportGenerationService.listerRapports(null, "vehicules", 50)).thenThrow(new RuntimeException("boom"));

        ResponseEntity<ReportListResponse> response = reportGenerationController.listerRapports("vehicules", 50);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
    }

    @Test
    @DisplayName("GET /api/reports/{reportId} → Retourne les métadonnées du rapport")
    void getMetadataRapport_returnsOk() {
        when(reportGenerationService.getMetadataRapport("r-1")).thenReturn(metadata());

        ResponseEntity<ReportMetadataResponse> response = reportGenerationController.getMetadataRapport("r-1");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().getReportId()).isEqualTo("r-1");
        verify(reportGenerationService, times(1)).getMetadataRapport("r-1");
    }

    @Test
    @DisplayName("GET /api/reports/{reportId} → Rapport inconnu → 404")
    void getMetadataRapport_notFound_returnsNotFound() {
        when(reportGenerationService.getMetadataRapport("inconnu")).thenReturn(null);

        ResponseEntity<ReportMetadataResponse> response = reportGenerationController.getMetadataRapport("inconnu");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        verify(reportGenerationService, times(1)).getMetadataRapport("inconnu");
    }

    @Test
    @DisplayName("GET /api/reports/{reportId} → Erreur renvoie 500")
    void getMetadataRapport_error_returnsInternalServerError() {
        when(reportGenerationService.getMetadataRapport("r-1")).thenThrow(new RuntimeException("boom"));

        ResponseEntity<ReportMetadataResponse> response = reportGenerationController.getMetadataRapport("r-1");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
    }

    @Test
    @DisplayName("GET /api/reports/download/{reportId} → Télécharge le rapport (octets)")
    void telechargerRapport_returnsOk() {
        byte[] content = {1, 2, 3};
        HttpHeaders headers = new HttpHeaders();
        headers.setContentDispositionFormData("attachment", "rapport.pdf");
        when(reportGenerationService.telechargerRapport("r-1"))
            .thenReturn(ResponseEntity.ok().headers(headers).contentType(MediaType.APPLICATION_PDF).body(content));

        ResponseEntity<byte[]> response = reportGenerationController.telechargerRapport("r-1");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEqualTo(content);
        assertThat(response.getHeaders().getContentType()).isEqualTo(MediaType.APPLICATION_PDF);
        verify(reportGenerationService, times(1)).telechargerRapport("r-1");
    }

    @Test
    @DisplayName("GET /api/reports/download/{reportId} → Erreur renvoie 500")
    void telechargerRapport_error_returnsInternalServerError() {
        when(reportGenerationService.telechargerRapport("r-1")).thenThrow(new RuntimeException("boom"));

        ResponseEntity<byte[]> response = reportGenerationController.telechargerRapport("r-1");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
    }

    @Test
    @DisplayName("DELETE /api/reports/{reportId} → Supprime le rapport → 204")
    void supprimerRapport_success_returnsNoContent() {
        when(reportGenerationService.supprimerRapport("r-1")).thenReturn(true);

        ResponseEntity<Void> response = reportGenerationController.supprimerRapport("r-1");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        verify(reportGenerationService, times(1)).supprimerRapport("r-1");
    }

    @Test
    @DisplayName("DELETE /api/reports/{reportId} → Rapport inconnu → 404")
    void supprimerRapport_notFound_returnsNotFound() {
        when(reportGenerationService.supprimerRapport("inconnu")).thenReturn(false);

        ResponseEntity<Void> response = reportGenerationController.supprimerRapport("inconnu");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        verify(reportGenerationService, times(1)).supprimerRapport("inconnu");
    }

    @Test
    @DisplayName("DELETE /api/reports/{reportId} → Erreur renvoie 500")
    void supprimerRapport_error_returnsInternalServerError() {
        when(reportGenerationService.supprimerRapport("r-1")).thenThrow(new RuntimeException("boom"));

        ResponseEntity<Void> response = reportGenerationController.supprimerRapport("r-1");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
