package com.logiway.controllers;

import com.logiway.dto.request.CongeDecisionRequest;
import com.logiway.dto.request.CreateCongeRequest;
import com.logiway.dto.request.UpdateCongeRequest;
import com.logiway.dto.response.ApiMessageResponse;
import com.logiway.dto.response.CongeResponse;
import com.logiway.entities.enums.Role;
import com.logiway.entities.enums.StatutConge;
import com.logiway.entities.enums.TypeConge;
import com.logiway.services.CongeService;
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

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * Tests unitaires du contrôleur Congé.
 * Valide tous les endpoints REST et leurs réponses HTTP.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("Controller Congé — Tests Unitaires")
class CongeControllerTest {

    @Mock
    private CongeService congeService;

    @InjectMocks
    private CongeController congeController;

    // ═══════════════════════════════════════════════════════════════
    // TEST 1: GET /api/conges → Liste les congés
    // ═══════════════════════════════════════════════════════════════
    @Test
    @DisplayName("list() → Retourne liste des congés")
    void list_returnsCongeList() {
        CongeResponse conge1 = new CongeResponse(
            1L, TypeConge.VACANCES,
            LocalDate.now().plusDays(10), LocalDate.now().plusDays(15), 5,
            "Vacances été", StatutConge.EN_ATTENTE, null,
            1L, "Jean Dupont", "jean@test.com", Role.CHAUFFEUR,
            2L, "Manager Test", "manager@test.com",
            1L, "Jean Dupont", "jean@test.com",
            LocalDateTime.now(), LocalDateTime.now()
        );
        CongeResponse conge2 = new CongeResponse(
            2L, TypeConge.MALADIE,
            LocalDate.now().plusDays(1), LocalDate.now().plusDays(3), 2,
            "Grippe", StatutConge.APPROUVE, "Approuvé",
            3L, "Marie Martin", "marie@test.com", Role.CHAUFFEUR,
            2L, "Manager Test", "manager@test.com",
            3L, "Marie Martin", "marie@test.com",
            LocalDateTime.now(), LocalDateTime.now()
        );

        when(congeService.getAccessibleConges()).thenReturn(List.of(conge1, conge2));

        ResponseEntity<List<CongeResponse>> response = congeController.list();

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).hasSize(2);
        assertThat(response.getBody().get(0).type()).isEqualTo(TypeConge.VACANCES);
        verify(congeService, times(1)).getAccessibleConges();
    }

    // ═══════════════════════════════════════════════════════════════
    // TEST 2: POST /api/conges → Crée une demande de congé
    // ═══════════════════════════════════════════════════════════════
    @Test
    @DisplayName("create() → Crée nouvelle demande de congé")
    void create_createsNewConge() {
        CreateCongeRequest request = new CreateCongeRequest(
            TypeConge.VACANCES,
            LocalDate.now().plusDays(20),
            LocalDate.now().plusDays(25),
            "Vacances familiales"
        );

        CongeResponse mockResponse = new CongeResponse(
            10L, TypeConge.VACANCES,
            LocalDate.now().plusDays(20), LocalDate.now().plusDays(25), 5,
            "Vacances familiales", StatutConge.EN_ATTENTE, null,
            1L, "Jean Dupont", "jean@test.com", Role.CHAUFFEUR,
            2L, "Manager Test", "manager@test.com",
            1L, "Jean Dupont", "jean@test.com",
            LocalDateTime.now(), LocalDateTime.now()
        );

        when(congeService.createConge(any(CreateCongeRequest.class))).thenReturn(mockResponse);

        ResponseEntity<CongeResponse> response = congeController.create(request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().motif()).isEqualTo("Vacances familiales");
        assertThat(response.getBody().id()).isEqualTo(10L);
        verify(congeService, times(1)).createConge(request);
    }

    // ═══════════════════════════════════════════════════════════════
    // TEST 3: PUT /api/conges/{id} → Met à jour demande de congé
    // ═══════════════════════════════════════════════════════════════
    @Test
    @DisplayName("update() → Met à jour demande existante")
    void update_updatesExistingConge() {
        UpdateCongeRequest request = new UpdateCongeRequest(
            TypeConge.MALADIE,
            LocalDate.now().plusDays(5),
            LocalDate.now().plusDays(10),
            "Arrêt maladie prolongé"
        );

        CongeResponse mockResponse = new CongeResponse(
            1L, TypeConge.MALADIE,
            LocalDate.now().plusDays(5), LocalDate.now().plusDays(10), 5,
            "Arrêt maladie prolongé", StatutConge.EN_ATTENTE, null,
            1L, "Jean Dupont", "jean@test.com", Role.CHAUFFEUR,
            2L, "Manager Test", "manager@test.com",
            1L, "Jean Dupont", "jean@test.com",
            LocalDateTime.now(), LocalDateTime.now()
        );

        when(congeService.updateConge(eq(1L), any(UpdateCongeRequest.class))).thenReturn(mockResponse);

        ResponseEntity<CongeResponse> response = congeController.update(1L, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().type()).isEqualTo(TypeConge.MALADIE);
        verify(congeService, times(1)).updateConge(1L, request);
    }

    // ═══════════════════════════════════════════════════════════════
    // TEST 4: PUT /api/conges/{id}/approve → Approuve congé
    // ═══════════════════════════════════════════════════════════════
    @Test
    @DisplayName("approve() → Approuve demande de congé")
    void approve_approvesConge() {
        CongeDecisionRequest request = new CongeDecisionRequest("Approuvé", null);

        CongeResponse mockResponse = new CongeResponse(
            1L, TypeConge.VACANCES,
            LocalDate.now().plusDays(10), LocalDate.now().plusDays(15), 5,
            "Vacances", StatutConge.APPROUVE, "Approuvé",
            1L, "Jean Dupont", "jean@test.com", Role.CHAUFFEUR,
            2L, "Manager Test", "manager@test.com",
            1L, "Jean Dupont", "jean@test.com",
            LocalDateTime.now(), LocalDateTime.now()
        );

        when(congeService.approveConge(eq(1L), any(CongeDecisionRequest.class))).thenReturn(mockResponse);

        ResponseEntity<CongeResponse> response = congeController.approve(1L, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().statut()).isEqualTo(StatutConge.APPROUVE);
        assertThat(response.getBody().commentaireValidation()).isEqualTo("Approuvé");
        verify(congeService, times(1)).approveConge(1L, request);
    }

    // ═══════════════════════════════════════════════════════════════
    // TEST 5: PUT /api/conges/{id}/reject → Rejette congé
    // ═══════════════════════════════════════════════════════════════
    @Test
    @DisplayName("reject() → Rejette demande de congé")
    void reject_rejectsConge() {
        CongeDecisionRequest request = new CongeDecisionRequest("Période chargée", null);

        CongeResponse mockResponse = new CongeResponse(
            1L, TypeConge.VACANCES,
            LocalDate.now().plusDays(10), LocalDate.now().plusDays(15), 5,
            "Vacances", StatutConge.REJETE, "Période chargée",
            1L, "Jean Dupont", "jean@test.com", Role.CHAUFFEUR,
            2L, "Manager Test", "manager@test.com",
            1L, "Jean Dupont", "jean@test.com",
            LocalDateTime.now(), LocalDateTime.now()
        );

        when(congeService.rejectConge(eq(1L), any(CongeDecisionRequest.class))).thenReturn(mockResponse);

        ResponseEntity<CongeResponse> response = congeController.reject(1L, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().statut()).isEqualTo(StatutConge.REJETE);
        assertThat(response.getBody().commentaireValidation()).isEqualTo("Période chargée");
        verify(congeService, times(1)).rejectConge(1L, request);
    }

    // ═══════════════════════════════════════════════════════════════
    // TEST 6: DELETE /api/conges/{id} → Supprime demande de congé
    // ═══════════════════════════════════════════════════════════════
    @Test
    @DisplayName("delete() → Supprime demande de congé")
    void delete_deletesConge() {
        ApiMessageResponse mockResponse = new ApiMessageResponse("La demande de congé a été supprimée.");

        when(congeService.deleteConge(1L)).thenReturn(mockResponse);

        ResponseEntity<ApiMessageResponse> response = congeController.delete(1L);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().message()).contains("supprimée");
        verify(congeService, times(1)).deleteConge(1L);
    }

    // ═══════════════════════════════════════════════════════════════
    // TESTS ADDITIONNELS POUR 100% COUVERTURE
    // ═══════════════════════════════════════════════════════════════

    @Test
    @DisplayName("list() → Retourne liste vide si aucun congé")
    void list_returnsEmptyListWhenNoConges() {
        when(congeService.getAccessibleConges()).thenReturn(List.of());

        ResponseEntity<List<CongeResponse>> response = congeController.list();

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEmpty();
        verify(congeService, times(1)).getAccessibleConges();
    }

    @Test
    @DisplayName("create() → Crée congé de type MALADIE")
    void create_withMaladieType_succeeds() {
        CreateCongeRequest request = new CreateCongeRequest(
            TypeConge.MALADIE,
            LocalDate.now().plusDays(1),
            LocalDate.now().plusDays(3),
            "Grippe saisonnière"
        );

        CongeResponse mockResponse = new CongeResponse(
            20L, TypeConge.MALADIE,
            LocalDate.now().plusDays(1), LocalDate.now().plusDays(3), 2,
            "Grippe saisonnière", StatutConge.EN_ATTENTE, null,
            1L, "Jean Dupont", "jean@test.com", Role.CHAUFFEUR,
            2L, "Manager Test", "manager@test.com",
            1L, "Jean Dupont", "jean@test.com",
            LocalDateTime.now(), LocalDateTime.now()
        );

        when(congeService.createConge(any())).thenReturn(mockResponse);

        ResponseEntity<CongeResponse> response = congeController.create(request);

        assertThat(response.getBody().type()).isEqualTo(TypeConge.MALADIE);
        verify(congeService, times(1)).createConge(request);
    }

    @Test
    @DisplayName("create() → Crée congé de type MARIAGE")
    void create_withMariageType_succeeds() {
        CreateCongeRequest request = new CreateCongeRequest(
            TypeConge.MARIAGE,
            LocalDate.now().plusDays(30),
            LocalDate.now().plusDays(35),
            "Mariage personnel"
        );

        CongeResponse mockResponse = new CongeResponse(
            30L, TypeConge.MARIAGE,
            LocalDate.now().plusDays(30), LocalDate.now().plusDays(35), 5,
            "Mariage personnel", StatutConge.EN_ATTENTE, null,
            1L, "Jean Dupont", "jean@test.com", Role.CHAUFFEUR,
            2L, "Manager Test", "manager@test.com",
            1L, "Jean Dupont", "jean@test.com",
            LocalDateTime.now(), LocalDateTime.now()
        );

        when(congeService.createConge(any())).thenReturn(mockResponse);

        ResponseEntity<CongeResponse> response = congeController.create(request);

        assertThat(response.getBody().type()).isEqualTo(TypeConge.MARIAGE);
        verify(congeService, times(1)).createConge(request);
    }

    @Test
    @DisplayName("update() → Mise à jour partielle")
    void update_partialUpdate_succeeds() {
        UpdateCongeRequest request = new UpdateCongeRequest(
            null,
            LocalDate.now().plusDays(12),
            null,
            null
        );

        CongeResponse mockResponse = new CongeResponse(
            1L, TypeConge.VACANCES,
            LocalDate.now().plusDays(12), LocalDate.now().plusDays(15), 3,
            "Vacances", StatutConge.EN_ATTENTE, null,
            1L, "Jean Dupont", "jean@test.com", Role.CHAUFFEUR,
            2L, "Manager Test", "manager@test.com",
            1L, "Jean Dupont", "jean@test.com",
            LocalDateTime.now(), LocalDateTime.now()
        );

        when(congeService.updateConge(eq(1L), any())).thenReturn(mockResponse);

        ResponseEntity<CongeResponse> response = congeController.update(1L, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        verify(congeService, times(1)).updateConge(1L, request);
    }

    @Test
    @DisplayName("approve() → Approbation avec commentaire détaillé")
    void approve_withDetailedComment_succeeds() {
        CongeDecisionRequest request = new CongeDecisionRequest(
            "Approuvé. Bon repos et profitez bien de vos vacances.", null
        );

        CongeResponse mockResponse = new CongeResponse(
            1L, TypeConge.VACANCES,
            LocalDate.now().plusDays(10), LocalDate.now().plusDays(15), 5,
            "Vacances", StatutConge.APPROUVE, 
            "Approuvé. Bon repos et profitez bien de vos vacances.",
            1L, "Jean Dupont", "jean@test.com", Role.CHAUFFEUR,
            2L, "Manager Test", "manager@test.com",
            1L, "Jean Dupont", "jean@test.com",
            LocalDateTime.now(), LocalDateTime.now()
        );

        when(congeService.approveConge(eq(1L), any())).thenReturn(mockResponse);

        ResponseEntity<CongeResponse> response = congeController.approve(1L, request);

        assertThat(response.getBody().commentaireValidation()).contains("Bon repos");
    }

    @Test
    @DisplayName("approve() → Approbation sans commentaire")
    void approve_withoutComment_succeeds() {
        CongeDecisionRequest request = new CongeDecisionRequest(null, null);

        CongeResponse mockResponse = new CongeResponse(
            1L, TypeConge.VACANCES,
            LocalDate.now().plusDays(10), LocalDate.now().plusDays(15), 5,
            "Vacances", StatutConge.APPROUVE, null,
            1L, "Jean Dupont", "jean@test.com", Role.CHAUFFEUR,
            2L, "Manager Test", "manager@test.com",
            1L, "Jean Dupont", "jean@test.com",
            LocalDateTime.now(), LocalDateTime.now()
        );

        when(congeService.approveConge(eq(1L), any())).thenReturn(mockResponse);

        ResponseEntity<CongeResponse> response = congeController.approve(1L, request);

        assertThat(response.getBody().commentaireValidation()).isNull();
    }

    @Test
    @DisplayName("approve() → Approbation avec notificationId")
    void approve_withNotificationId_succeeds() {
        CongeDecisionRequest request = new CongeDecisionRequest("Approuvé", 100L);

        CongeResponse mockResponse = new CongeResponse(
            1L, TypeConge.VACANCES,
            LocalDate.now().plusDays(10), LocalDate.now().plusDays(15), 5,
            "Vacances", StatutConge.APPROUVE, "Approuvé",
            1L, "Jean Dupont", "jean@test.com", Role.CHAUFFEUR,
            2L, "Manager Test", "manager@test.com",
            1L, "Jean Dupont", "jean@test.com",
            LocalDateTime.now(), LocalDateTime.now()
        );

        when(congeService.approveConge(eq(1L), any())).thenReturn(mockResponse);

        ResponseEntity<CongeResponse> response = congeController.approve(1L, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        verify(congeService, times(1)).approveConge(1L, request);
    }

    @Test
    @DisplayName("reject() → Rejet sans commentaire")
    void reject_withoutComment_succeeds() {
        CongeDecisionRequest request = new CongeDecisionRequest(null, null);

        CongeResponse mockResponse = new CongeResponse(
            1L, TypeConge.VACANCES,
            LocalDate.now().plusDays(10), LocalDate.now().plusDays(15), 5,
            "Vacances", StatutConge.REJETE, null,
            1L, "Jean Dupont", "jean@test.com", Role.CHAUFFEUR,
            2L, "Manager Test", "manager@test.com",
            1L, "Jean Dupont", "jean@test.com",
            LocalDateTime.now(), LocalDateTime.now()
        );

        when(congeService.rejectConge(eq(1L), any())).thenReturn(mockResponse);

        ResponseEntity<CongeResponse> response = congeController.reject(1L, request);

        assertThat(response.getBody().commentaireValidation()).isNull();
    }

    @Test
    @DisplayName("reject() → Rejet avec motif détaillé")
    void reject_withDetailedReason_succeeds() {
        CongeDecisionRequest request = new CongeDecisionRequest(
            "Rejeté car nous avons déjà 3 personnes en congé cette semaine.", null
        );

        CongeResponse mockResponse = new CongeResponse(
            1L, TypeConge.VACANCES,
            LocalDate.now().plusDays(10), LocalDate.now().plusDays(15), 5,
            "Vacances", StatutConge.REJETE, 
            "Rejeté car nous avons déjà 3 personnes en congé cette semaine.",
            1L, "Jean Dupont", "jean@test.com", Role.CHAUFFEUR,
            2L, "Manager Test", "manager@test.com",
            1L, "Jean Dupont", "jean@test.com",
            LocalDateTime.now(), LocalDateTime.now()
        );

        when(congeService.rejectConge(eq(1L), any())).thenReturn(mockResponse);

        ResponseEntity<CongeResponse> response = congeController.reject(1L, request);

        assertThat(response.getBody().commentaireValidation()).contains("Rejeté");
    }

    @Test
    @DisplayName("delete() → Suppression retourne message d'annulation")
    void delete_whenApproved_returnsCancellationMessage() {
        ApiMessageResponse mockResponse = new ApiMessageResponse("Le congé a été annulé avec succès.");

        when(congeService.deleteConge(1L)).thenReturn(mockResponse);

        ResponseEntity<ApiMessageResponse> response = congeController.delete(1L);

        assertThat(response.getBody().message()).contains("annulé");
        verify(congeService, times(1)).deleteConge(1L);
    }

    @Test
    @DisplayName("delete() → Suppression de plusieurs congés")
    void delete_multipleIds_succeeds() {
        ApiMessageResponse mockResponse = new ApiMessageResponse("La demande de congé a été supprimée.");

        when(congeService.deleteConge(anyLong())).thenReturn(mockResponse);

        ResponseEntity<ApiMessageResponse> response1 = congeController.delete(1L);
        ResponseEntity<ApiMessageResponse> response2 = congeController.delete(2L);
        ResponseEntity<ApiMessageResponse> response3 = congeController.delete(3L);

        assertThat(response1.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response2.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response3.getStatusCode()).isEqualTo(HttpStatus.OK);
        verify(congeService, times(3)).deleteConge(anyLong());
    }

    @Test
    @DisplayName("list() → Retourne congés avec différents statuts")
    void list_returnsMixedStatuses() {
        CongeResponse conge1 = new CongeResponse(
            1L, TypeConge.VACANCES,
            LocalDate.now().plusDays(10), LocalDate.now().plusDays(15), 5,
            "Vacances", StatutConge.EN_ATTENTE, null,
            1L, "User1", "user1@test.com", Role.CHAUFFEUR,
            2L, "Manager", "manager@test.com",
            1L, "User1", "user1@test.com",
            LocalDateTime.now(), LocalDateTime.now()
        );
        CongeResponse conge2 = new CongeResponse(
            2L, TypeConge.MALADIE,
            LocalDate.now().plusDays(1), LocalDate.now().plusDays(3), 2,
            "Maladie", StatutConge.APPROUVE, "Approuvé",
            3L, "User2", "user2@test.com", Role.CHAUFFEUR,
            2L, "Manager", "manager@test.com",
            3L, "User2", "user2@test.com",
            LocalDateTime.now(), LocalDateTime.now()
        );
        CongeResponse conge3 = new CongeResponse(
            3L, TypeConge.VACANCES,
            LocalDate.now().plusDays(30), LocalDate.now().plusDays(35), 5,
            "Vacances", StatutConge.REJETE, "Période chargée",
            4L, "User3", "user3@test.com", Role.CHAUFFEUR,
            2L, "Manager", "manager@test.com",
            4L, "User3", "user3@test.com",
            LocalDateTime.now(), LocalDateTime.now()
        );
        CongeResponse conge4 = new CongeResponse(
            4L, TypeConge.MARIAGE,
            LocalDate.now().plusDays(60), LocalDate.now().plusDays(65), 5,
            "Mariage", StatutConge.ANNULE, null,
            5L, "User4", "user4@test.com", Role.CHAUFFEUR,
            2L, "Manager", "manager@test.com",
            5L, "User4", "user4@test.com",
            LocalDateTime.now(), LocalDateTime.now()
        );

        when(congeService.getAccessibleConges()).thenReturn(List.of(conge1, conge2, conge3, conge4));

        ResponseEntity<List<CongeResponse>> response = congeController.list();

        assertThat(response.getBody()).hasSize(4);
        assertThat(response.getBody().get(0).statut()).isEqualTo(StatutConge.EN_ATTENTE);
        assertThat(response.getBody().get(1).statut()).isEqualTo(StatutConge.APPROUVE);
        assertThat(response.getBody().get(2).statut()).isEqualTo(StatutConge.REJETE);
        assertThat(response.getBody().get(3).statut()).isEqualTo(StatutConge.ANNULE);
    }

    @Test
    @DisplayName("list() → Retourne tous les types de congé")
    void list_returnsAllLeaveTypes() {
        CongeResponse conge1 = new CongeResponse(
            1L, TypeConge.VACANCES,
            LocalDate.now().plusDays(10), LocalDate.now().plusDays(15), 5,
            "Vacances", StatutConge.EN_ATTENTE, null,
            1L, "User1", "user1@test.com", Role.CHAUFFEUR,
            2L, "Manager", "manager@test.com",
            1L, "User1", "user1@test.com",
            LocalDateTime.now(), LocalDateTime.now()
        );
        CongeResponse conge2 = new CongeResponse(
            2L, TypeConge.MALADIE,
            LocalDate.now().plusDays(1), LocalDate.now().plusDays(3), 2,
            "Maladie", StatutConge.APPROUVE, "Approuvé",
            3L, "User2", "user2@test.com", Role.CHAUFFEUR,
            2L, "Manager", "manager@test.com",
            3L, "User2", "user2@test.com",
            LocalDateTime.now(), LocalDateTime.now()
        );
        CongeResponse conge3 = new CongeResponse(
            3L, TypeConge.MARIAGE,
            LocalDate.now().plusDays(30), LocalDate.now().plusDays(35), 5,
            "Mariage", StatutConge.EN_ATTENTE, null,
            4L, "User3", "user3@test.com", Role.CHAUFFEUR,
            2L, "Manager", "manager@test.com",
            4L, "User3", "user3@test.com",
            LocalDateTime.now(), LocalDateTime.now()
        );

        when(congeService.getAccessibleConges()).thenReturn(List.of(conge1, conge2, conge3));

        ResponseEntity<List<CongeResponse>> response = congeController.list();

        assertThat(response.getBody()).hasSize(3);
        assertThat(response.getBody().get(0).type()).isEqualTo(TypeConge.VACANCES);
        assertThat(response.getBody().get(1).type()).isEqualTo(TypeConge.MALADIE);
        assertThat(response.getBody().get(2).type()).isEqualTo(TypeConge.MARIAGE);
    }

    @Test
    @DisplayName("update() → Mise à jour de tous les champs")
    void update_allFields_succeeds() {
        UpdateCongeRequest request = new UpdateCongeRequest(
            TypeConge.MALADIE,
            LocalDate.now().plusDays(2),
            LocalDate.now().plusDays(5),
            "Changement complet"
        );

        CongeResponse mockResponse = new CongeResponse(
            1L, TypeConge.MALADIE,
            LocalDate.now().plusDays(2), LocalDate.now().plusDays(5), 3,
            "Changement complet", StatutConge.EN_ATTENTE, null,
            1L, "Jean Dupont", "jean@test.com", Role.CHAUFFEUR,
            2L, "Manager Test", "manager@test.com",
            1L, "Jean Dupont", "jean@test.com",
            LocalDateTime.now(), LocalDateTime.now()
        );

        when(congeService.updateConge(eq(1L), any())).thenReturn(mockResponse);

        ResponseEntity<CongeResponse> response = congeController.update(1L, request);

        assertThat(response.getBody().type()).isEqualTo(TypeConge.MALADIE);
        assertThat(response.getBody().motif()).isEqualTo("Changement complet");
    }

    @Test
    @DisplayName("create() → Demandes de congé avec différentes périodes")
    void create_withDifferentPeriods_succeeds() {
        CreateCongeRequest request1 = new CreateCongeRequest(
            TypeConge.MALADIE,
            LocalDate.now().plusDays(1),
            LocalDate.now().plusDays(1),
            "1 jour"
        );
        CongeResponse mockResponse1 = new CongeResponse(
            100L, TypeConge.MALADIE,
            LocalDate.now().plusDays(1), LocalDate.now().plusDays(1), 1,
            "1 jour", StatutConge.EN_ATTENTE, null,
            1L, "User", "user@test.com", Role.CHAUFFEUR,
            2L, "Manager", "manager@test.com",
            1L, "User", "user@test.com",
            LocalDateTime.now(), LocalDateTime.now()
        );
        when(congeService.createConge(request1)).thenReturn(mockResponse1);

        ResponseEntity<CongeResponse> response1 = congeController.create(request1);
        assertThat(response1.getBody().periode()).isEqualTo(1);

        CreateCongeRequest request2 = new CreateCongeRequest(
            TypeConge.VACANCES,
            LocalDate.now().plusDays(10),
            LocalDate.now().plusDays(30),
            "Longues vacances"
        );
        CongeResponse mockResponse2 = new CongeResponse(
            101L, TypeConge.VACANCES,
            LocalDate.now().plusDays(10), LocalDate.now().plusDays(30), 20,
            "Longues vacances", StatutConge.EN_ATTENTE, null,
            1L, "User", "user@test.com", Role.CHAUFFEUR,
            2L, "Manager", "manager@test.com",
            1L, "User", "user@test.com",
            LocalDateTime.now(), LocalDateTime.now()
        );
        when(congeService.createConge(request2)).thenReturn(mockResponse2);

        ResponseEntity<CongeResponse> response2 = congeController.create(request2);
        assertThat(response2.getBody().periode()).isEqualTo(20);
    }

    @Test
    @DisplayName("approve() → Approbation de différents types de congé")
    void approve_differentTypes_succeeds() {
        CongeDecisionRequest request = new CongeDecisionRequest("Approuvé", null);

        CongeResponse mockMaladie = new CongeResponse(
            1L, TypeConge.MALADIE,
            LocalDate.now().plusDays(1), LocalDate.now().plusDays(3), 2,
            "Maladie", StatutConge.APPROUVE, "Approuvé",
            1L, "User", "user@test.com", Role.CHAUFFEUR,
            2L, "Manager", "manager@test.com",
            1L, "User", "user@test.com",
            LocalDateTime.now(), LocalDateTime.now()
        );
        when(congeService.approveConge(eq(1L), any())).thenReturn(mockMaladie);

        ResponseEntity<CongeResponse> response = congeController.approve(1L, request);
        assertThat(response.getBody().type()).isEqualTo(TypeConge.MALADIE);
    }
}
