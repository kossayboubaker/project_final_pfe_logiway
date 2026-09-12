package com.logiway.controllers;

import com.logiway.dto.response.RapportResponse;
import com.logiway.entities.Utilisateur;
import com.logiway.security.AuthenticatedUserService;
import com.logiway.services.RapportService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Controller Rapport — Tests Unitaires")
class RapportControllerTest {

    @Mock
    private RapportService rapportService;

    @Mock
    private AuthenticatedUserService authenticatedUserService;

    @InjectMocks
    private RapportController rapportController;

    private static Utilisateur utilisateur() {
        return Utilisateur.builder()
            .id(1L)
            .prenom("Jean")
            .nom("Dupont")
            .email("jean@logiway.com")
            .build();
    }

    private static RapportResponse rapport() {
        return RapportResponse.builder()
            .titre("Rapport")
            .dateGeneration(LocalDateTime.of(2026, 8, 10, 10, 0))
            .sections(List.of(RapportResponse.RapportSection.builder().titre("Section").contenu("Contenu").build()))
            .resumeIA("Résumé IA")
            .build();
    }

    @Test
    @DisplayName("GET /api/rapports/conges/semaine → Génère le rapport congés semaine")
    void genererRapportCongesSemaine_returnsOk() {
        when(authenticatedUserService.getCurrentUser()).thenReturn(utilisateur());
        when(rapportService.genererRapportCongesSemaine(1L)).thenReturn(rapport());

        ResponseEntity<RapportResponse> response = rapportController.genererRapportCongesSemaine();

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().getTitre()).isEqualTo("Rapport");
        verify(authenticatedUserService, times(1)).getCurrentUser();
        verify(rapportService, times(1)).genererRapportCongesSemaine(1L);
    }

    @Test
    @DisplayName("GET /api/rapports/conges/semaine → Erreur renvoie 500")
    void genererRapportCongesSemaine_error_returnsInternalServerError() {
        when(authenticatedUserService.getCurrentUser()).thenReturn(utilisateur());
        when(rapportService.genererRapportCongesSemaine(1L)).thenThrow(new RuntimeException("boom"));

        ResponseEntity<RapportResponse> response = rapportController.genererRapportCongesSemaine();

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
    }

    @Test
    @DisplayName("GET /api/rapports/conges/periode → Génère le rapport congés d'une période")
    void genererRapportCongesPeriode_returnsOk() {
        LocalDate debut = LocalDate.of(2026, 8, 1);
        LocalDate fin = LocalDate.of(2026, 8, 10);
        when(authenticatedUserService.getCurrentUser()).thenReturn(utilisateur());
        when(rapportService.genererRapportCongesPeriode(debut, fin, 1L)).thenReturn(rapport());

        ResponseEntity<RapportResponse> response = rapportController.genererRapportCongesPeriode(debut, fin);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().getResumeIA()).isEqualTo("Résumé IA");
        verify(rapportService, times(1)).genererRapportCongesPeriode(debut, fin, 1L);
    }

    @Test
    @DisplayName("GET /api/rapports/conges/periode → Erreur renvoie 500")
    void genererRapportCongesPeriode_error_returnsInternalServerError() {
        LocalDate debut = LocalDate.of(2026, 8, 1);
        LocalDate fin = LocalDate.of(2026, 8, 10);
        when(authenticatedUserService.getCurrentUser()).thenReturn(utilisateur());
        when(rapportService.genererRapportCongesPeriode(debut, fin, 1L)).thenThrow(new RuntimeException("boom"));

        ResponseEntity<RapportResponse> response = rapportController.genererRapportCongesPeriode(debut, fin);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
    }

    @Test
    @DisplayName("GET /api/rapports/absences → Génère le rapport taux d'absences")
    void genererRapportTauxAbsences_returnsOk() {
        when(authenticatedUserService.getCurrentUser()).thenReturn(utilisateur());
        when(rapportService.genererRapportTauxAbsences(8, 2026, 1L)).thenReturn(rapport());

        ResponseEntity<RapportResponse> response = rapportController.genererRapportTauxAbsences(8, 2026);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().getSections()).hasSize(1);
        verify(rapportService, times(1)).genererRapportTauxAbsences(8, 2026, 1L);
    }

    @Test
    @DisplayName("GET /api/rapports/absences → Erreur renvoie 500")
    void genererRapportTauxAbsences_error_returnsInternalServerError() {
        when(authenticatedUserService.getCurrentUser()).thenReturn(utilisateur());
        when(rapportService.genererRapportTauxAbsences(8, 2026, 1L)).thenThrow(new RuntimeException("boom"));

        ResponseEntity<RapportResponse> response = rapportController.genererRapportTauxAbsences(8, 2026);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
    }

    @Test
    @DisplayName("GET /api/rapports/reclamations → Génère le rapport réclamations")
    void genererRapportReclamations_returnsOk() {
        when(authenticatedUserService.getCurrentUser()).thenReturn(utilisateur());
        when(rapportService.genererRapportReclamations(1L)).thenReturn(rapport());

        ResponseEntity<RapportResponse> response = rapportController.genererRapportReclamations();

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().getTitre()).isEqualTo("Rapport");
        verify(rapportService, times(1)).genererRapportReclamations(1L);
    }

    @Test
    @DisplayName("GET /api/rapports/reclamations → Erreur renvoie 500")
    void genererRapportReclamations_error_returnsInternalServerError() {
        when(authenticatedUserService.getCurrentUser()).thenReturn(utilisateur());
        when(rapportService.genererRapportReclamations(1L)).thenThrow(new RuntimeException("boom"));

        ResponseEntity<RapportResponse> response = rapportController.genererRapportReclamations();

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
    }

    @Test
    @DisplayName("GET /api/rapports/vehicules → Génère le rapport véhicules")
    void genererRapportVehicules_returnsOk() {
        when(authenticatedUserService.getCurrentUser()).thenReturn(utilisateur());
        when(rapportService.genererRapportVehicules(1L)).thenReturn(rapport());

        ResponseEntity<RapportResponse> response = rapportController.genererRapportVehicules();

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().getTitre()).isEqualTo("Rapport");
        verify(rapportService, times(1)).genererRapportVehicules(1L);
    }

    @Test
    @DisplayName("GET /api/rapports/vehicules → Erreur renvoie 500")
    void genererRapportVehicules_error_returnsInternalServerError() {
        when(authenticatedUserService.getCurrentUser()).thenReturn(utilisateur());
        when(rapportService.genererRapportVehicules(1L)).thenThrow(new RuntimeException("boom"));

        ResponseEntity<RapportResponse> response = rapportController.genererRapportVehicules();

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
    }

    @Test
    @DisplayName("GET /api/rapports/trajets → Génère le rapport trajets d'une période")
    void genererRapportTrajets_returnsOk() {
        LocalDate debut = LocalDate.of(2026, 8, 1);
        LocalDate fin = LocalDate.of(2026, 8, 10);
        when(authenticatedUserService.getCurrentUser()).thenReturn(utilisateur());
        when(rapportService.genererRapportTrajets(debut, fin, 1L)).thenReturn(rapport());

        ResponseEntity<RapportResponse> response = rapportController.genererRapportTrajets(debut, fin);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().getSections()).hasSize(1);
        verify(rapportService, times(1)).genererRapportTrajets(debut, fin, 1L);
    }

    @Test
    @DisplayName("GET /api/rapports/trajets → Erreur renvoie 500")
    void genererRapportTrajets_error_returnsInternalServerError() {
        LocalDate debut = LocalDate.of(2026, 8, 1);
        LocalDate fin = LocalDate.of(2026, 8, 10);
        when(authenticatedUserService.getCurrentUser()).thenReturn(utilisateur());
        when(rapportService.genererRapportTrajets(debut, fin, 1L)).thenThrow(new RuntimeException("boom"));

        ResponseEntity<RapportResponse> response = rapportController.genererRapportTrajets(debut, fin);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
    }

    @Test
    @DisplayName("GET /api/rapports/global → Génère le rapport global")
    void genererRapportGlobal_returnsOk() {
        when(authenticatedUserService.getCurrentUser()).thenReturn(utilisateur());
        when(rapportService.genererRapportGlobal(1L)).thenReturn(rapport());

        ResponseEntity<RapportResponse> response = rapportController.genererRapportGlobal();

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().getTitre()).isEqualTo("Rapport");
        verify(rapportService, times(1)).genererRapportGlobal(1L);
    }

    @Test
    @DisplayName("GET /api/rapports/global → Erreur renvoie 500")
    void genererRapportGlobal_error_returnsInternalServerError() {
        when(authenticatedUserService.getCurrentUser()).thenReturn(utilisateur());
        when(rapportService.genererRapportGlobal(1L)).thenThrow(new RuntimeException("boom"));

        ResponseEntity<RapportResponse> response = rapportController.genererRapportGlobal();

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
