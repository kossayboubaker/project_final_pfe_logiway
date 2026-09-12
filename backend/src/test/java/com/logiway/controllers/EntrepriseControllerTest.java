package com.logiway.controllers;

import com.logiway.dto.request.CreateEntrepriseRequest;
import com.logiway.dto.request.UpdateEntrepriseRequest;
import com.logiway.dto.response.EntrepriseResponse;
import com.logiway.entities.enums.StatutEntreprise;
import com.logiway.services.EntrepriseService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Controller Entreprise — Tests Unitaires")
class EntrepriseControllerTest {

    @Mock
    private EntrepriseService entrepriseService;

    @InjectMocks
    private EntrepriseController entrepriseController;

    private EntrepriseResponse entreprise() {
        return new EntrepriseResponse(
            1L, "Transport Express", "contact@transport-express.fr",
            "12 rue des Lilas, Paris", "01 23 45 67 89", "FR12345678901",
            "Jean Dupont", "justificatif.pdf", "Transport de marchandises",
            "logo.png", 15, StatutEntreprise.ACTIF, 1L, "Jean Dupont",
            LocalDateTime.of(2025, 1, 15, 9, 30), 3
        );
    }

    @Test
    @DisplayName("GET /api/entreprises → Retourne la liste des entreprises accessibles")
    void getCompanies_returnsOk() {
        when(entrepriseService.getAccessibleEntreprises()).thenReturn(List.of(entreprise()));

        ResponseEntity<List<EntrepriseResponse>> response = entrepriseController.getCompanies();

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).hasSize(1);
        assertThat(response.getBody().get(0).nomEntreprise()).isEqualTo("Transport Express");
        verify(entrepriseService, times(1)).getAccessibleEntreprises();
    }

    @Test
    @DisplayName("GET /api/entreprises/me → Retourne l'entreprise de l'utilisateur connecté")
    void getMyCompany_returnsOk() {
        when(entrepriseService.getMyEntreprise()).thenReturn(entreprise());

        ResponseEntity<EntrepriseResponse> response = entrepriseController.getMyCompany();

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().id()).isEqualTo(1L);
        verify(entrepriseService, times(1)).getMyEntreprise();
    }

    @Test
    @DisplayName("POST /api/entreprises → Crée une nouvelle entreprise")
    void create_returnsOk() {
        CreateEntrepriseRequest request = new CreateEntrepriseRequest(
            "Transport Express", "contact@transport-express.fr",
            "12 rue des Lilas, Paris", "01 23 45 67 89", "FR12345678901",
            "Jean Dupont", "justificatif.pdf", "Transport de marchandises",
            15, "logo.png", 1L, "ACTIF"
        );
        when(entrepriseService.createEntreprise(any(CreateEntrepriseRequest.class))).thenReturn(entreprise());

        ResponseEntity<EntrepriseResponse> response = entrepriseController.create(request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().statut()).isEqualTo(StatutEntreprise.ACTIF);
        verify(entrepriseService, times(1)).createEntreprise(any(CreateEntrepriseRequest.class));
    }

    @Test
    @DisplayName("PUT /api/entreprises/{id} → Met à jour une entreprise")
    void update_returnsOk() {
        UpdateEntrepriseRequest request = new UpdateEntrepriseRequest(
            "Transport Express", "contact@transport-express.fr",
            "12 rue des Lilas, Paris", "01 23 45 67 89", "FR12345678901",
            "Jean Dupont", "justificatif.pdf", "Transport de marchandises",
            15, "logo.png", 1L, "ACTIF"
        );
        when(entrepriseService.updateEntreprise(eq(1L), any(UpdateEntrepriseRequest.class))).thenReturn(entreprise());

        ResponseEntity<EntrepriseResponse> response = entrepriseController.update(1L, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().tailleFlotte()).isEqualTo(15);
        verify(entrepriseService, times(1)).updateEntreprise(eq(1L), any(UpdateEntrepriseRequest.class));
    }

    @Test
    @DisplayName("PUT /api/entreprises/{id}/clear-owner → Retire le propriétaire de l'entreprise")
    void clearOwner_returnsOk() {
        when(entrepriseService.clearEntrepriseOwner(1L)).thenReturn(entreprise());

        ResponseEntity<EntrepriseResponse> response = entrepriseController.clearOwner(1L);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().managerOwnerId()).isEqualTo(1L);
        verify(entrepriseService, times(1)).clearEntrepriseOwner(1L);
    }

    @Test
    @DisplayName("DELETE /api/entreprises/{id} → Supprime une entreprise")
    void delete_returnsNoContent() {
        doNothing().when(entrepriseService).deleteEntreprise(1L);

        ResponseEntity<Void> response = entrepriseController.delete(1L);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        assertThat(response.getBody()).isNull();
        verify(entrepriseService, times(1)).deleteEntreprise(1L);
    }
}
