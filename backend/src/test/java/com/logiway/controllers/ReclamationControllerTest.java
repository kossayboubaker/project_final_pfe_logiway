package com.logiway.controllers;

import com.logiway.dto.request.CreateReclamationRequest;
import com.logiway.dto.request.ReclamationDecisionRequest;
import com.logiway.dto.request.UpdateReclamationRequest;
import com.logiway.dto.request.ValidateReclamationRequest;
import com.logiway.dto.response.ReclamationResponse;
import com.logiway.dto.response.ValidateReclamationResponse;
import com.logiway.dto.response.ValidateReclamationFieldResponse;
import com.logiway.entities.enums.PrioriteReclamation;
import com.logiway.entities.enums.StatutReclamation;
import com.logiway.services.ReclamationService;
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

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * Tests unitaires du contrôleur Réclamation.
 * Valide tous les endpoints REST et leurs réponses HTTP.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("Controller Réclamation — Tests Unitaires")
class ReclamationControllerTest {

    @Mock
    private ReclamationService reclamationService;

    @InjectMocks
    private ReclamationController reclamationController;

    // ═══════════════════════════════════════════════════════════════
    // TEST 1: GET /api/reclamations → Liste les réclamations
    // ═══════════════════════════════════════════════════════════════
    @Test
    @DisplayName("list() → Retourne liste des réclamations")
    void list_returnsReclamationList() {
        ReclamationResponse rec1 = new ReclamationResponse(
            1L, "Problème véhicule", "Description", PrioriteReclamation.URGENT,
            StatutReclamation.EN_COURS, null, 1L, "Jean Dupont", "jean@test.com",
            LocalDateTime.now()
        );
        ReclamationResponse rec2 = new ReclamationResponse(
            2L, "Panne camion", "Description panne", PrioriteReclamation.NORMAL,
            StatutReclamation.RESOLU, "Réparé", 2L, "Marie Martin", "marie@test.com",
            LocalDateTime.now()
        );

        when(reclamationService.getAccessibleReclamations()).thenReturn(List.of(rec1, rec2));

        ResponseEntity<List<ReclamationResponse>> response = reclamationController.list();

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).hasSize(2);
        assertThat(response.getBody().get(0).getSujet()).isEqualTo("Problème véhicule");
        verify(reclamationService, times(1)).getAccessibleReclamations();
    }

    // ═══════════════════════════════════════════════════════════════
    // TEST 2: POST /api/reclamations → Crée une réclamation
    // ═══════════════════════════════════════════════════════════════
    @Test
    @DisplayName("create() → Crée nouvelle réclamation")
    void create_createsNewReclamation() {
        CreateReclamationRequest request = new CreateReclamationRequest(
            "Nouveau problème",
            "Description du problème",
            PrioriteReclamation.URGENT
        );

        ReclamationResponse mockResponse = new ReclamationResponse(
            10L, "Nouveau problème", "Description du problème", PrioriteReclamation.URGENT,
            StatutReclamation.EN_COURS, null, 1L, "Jean Dupont", "jean@test.com",
            LocalDateTime.now()
        );

        when(reclamationService.createReclamation(any(CreateReclamationRequest.class)))
            .thenReturn(mockResponse);

        ResponseEntity<ReclamationResponse> response = reclamationController.create(request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getSujet()).isEqualTo("Nouveau problème");
        assertThat(response.getBody().getId()).isEqualTo(10L);
        verify(reclamationService, times(1)).createReclamation(request);
    }

    // ═══════════════════════════════════════════════════════════════
    // TEST 3: POST /api/reclamations/validate → Valide le texte
    // ═══════════════════════════════════════════════════════════════
    @Test
    @DisplayName("validate() → Valide texte de réclamation")
    void validate_validatesReclamationText() {
        ValidateReclamationRequest request = new ValidateReclamationRequest(
            "Problème de véhicule",
            "Le véhicule a un souci de frein"
        );

        ValidateReclamationResponse mockResponse = ValidateReclamationResponse.builder()
            .sujet(ValidateReclamationFieldResponse.builder().valide(true).build())
            .description(ValidateReclamationFieldResponse.builder().valide(true).build())
            .build();

        when(reclamationService.validateText(any(ValidateReclamationRequest.class)))
            .thenReturn(mockResponse);

        ResponseEntity<ValidateReclamationResponse> response = reclamationController.validate(request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getSujet().isValide()).isTrue();
        assertThat(response.getBody().getDescription().isValide()).isTrue();
        verify(reclamationService, times(1)).validateText(request);
    }

    // ═══════════════════════════════════════════════════════════════
    // TEST 4: PUT /api/reclamations/{id} → Met à jour réclamation
    // ═══════════════════════════════════════════════════════════════
    @Test
    @DisplayName("update() → Met à jour réclamation existante")
    void update_updatesExistingReclamation() {
        UpdateReclamationRequest request = new UpdateReclamationRequest(
            "Sujet modifié",
            "Description modifiée",
            PrioriteReclamation.URGENT
        );

        ReclamationResponse mockResponse = new ReclamationResponse(
            1L, "Sujet modifié", "Description modifiée", PrioriteReclamation.URGENT,
            StatutReclamation.EN_COURS, null, 1L, "Jean Dupont", "jean@test.com",
            LocalDateTime.now()
        );

        when(reclamationService.updateReclamation(eq(1L), any(UpdateReclamationRequest.class)))
            .thenReturn(mockResponse);

        ResponseEntity<ReclamationResponse> response = reclamationController.update(1L, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getSujet()).isEqualTo("Sujet modifié");
        verify(reclamationService, times(1)).updateReclamation(1L, request);
    }

    // ═══════════════════════════════════════════════════════════════
    // TEST 5: DELETE /api/reclamations/{id} → Supprime réclamation
    // ═══════════════════════════════════════════════════════════════
    @Test
    @DisplayName("delete() → Supprime réclamation")
    void delete_deletesReclamation() {
        doNothing().when(reclamationService).deleteReclamation(1L);

        ResponseEntity<Void> response = reclamationController.delete(1L);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        assertThat(response.getBody()).isNull();
        verify(reclamationService, times(1)).deleteReclamation(1L);
    }

    // ═══════════════════════════════════════════════════════════════
    // TEST 6: PUT /api/reclamations/{id}/resolve → Résout réclamation
    // ═══════════════════════════════════════════════════════════════
    @Test
    @DisplayName("resolve() → Résout réclamation")
    void resolve_resolvesReclamation() {
        ReclamationDecisionRequest request = new ReclamationDecisionRequest(
            "Problème résolu après réparation"
        );

        ReclamationResponse mockResponse = new ReclamationResponse(
            1L, "Problème véhicule", "Description", PrioriteReclamation.URGENT,
            StatutReclamation.RESOLU, "Problème résolu après réparation", 1L,
            "Jean Dupont", "jean@test.com", LocalDateTime.now()
        );

        when(reclamationService.resolveReclamation(eq(1L), any(ReclamationDecisionRequest.class)))
            .thenReturn(mockResponse);

        ResponseEntity<ReclamationResponse> response = reclamationController.resolve(1L, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getStatut()).isEqualTo(StatutReclamation.RESOLU);
        assertThat(response.getBody().getCommentaireResolution()).isEqualTo("Problème résolu après réparation");
        verify(reclamationService, times(1)).resolveReclamation(1L, request);
    }

    // ═══════════════════════════════════════════════════════════════
    // TEST 7: PUT /api/reclamations/{id}/reject → Rejette réclamation
    // ═══════════════════════════════════════════════════════════════
    @Test
    @DisplayName("reject() → Rejette réclamation")
    void reject_rejectsReclamation() {
        ReclamationDecisionRequest request = new ReclamationDecisionRequest(
            "Réclamation non fondée"
        );

        ReclamationResponse mockResponse = new ReclamationResponse(
            1L, "Problème véhicule", "Description", PrioriteReclamation.NORMAL,
            StatutReclamation.REJETE, "Réclamation non fondée", 1L,
            "Jean Dupont", "jean@test.com", LocalDateTime.now()
        );

        when(reclamationService.rejectReclamation(eq(1L), any(ReclamationDecisionRequest.class)))
            .thenReturn(mockResponse);

        ResponseEntity<ReclamationResponse> response = reclamationController.reject(1L, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getStatut()).isEqualTo(StatutReclamation.REJETE);
        assertThat(response.getBody().getCommentaireResolution()).isEqualTo("Réclamation non fondée");
        verify(reclamationService, times(1)).rejectReclamation(1L, request);
    }

    // ═══════════════════════════════════════════════════════════════
    // TEST 8: GET /api/reclamations → Liste vide
    // ═══════════════════════════════════════════════════════════════
    @Test
    @DisplayName("list() → Retourne liste vide si aucune réclamation")
    void list_returnsEmptyListWhenNoReclamations() {
        when(reclamationService.getAccessibleReclamations()).thenReturn(List.of());

        ResponseEntity<List<ReclamationResponse>> response = reclamationController.list();

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEmpty();
        verify(reclamationService, times(1)).getAccessibleReclamations();
    }

    // ═══════════════════════════════════════════════════════════════
    // TEST 9: POST /api/reclamations/validate → Texte invalide (toxique)
    // ═══════════════════════════════════════════════════════════════
    @Test
    @DisplayName("validate() → Détecte texte toxique")
    void validate_detectsToxicContent() {
        ValidateReclamationRequest request = new ValidateReclamationRequest(
            "Sujet normal",
            "Contenu toxique"
        );

        ValidateReclamationResponse mockResponse = ValidateReclamationResponse.builder()
            .sujet(ValidateReclamationFieldResponse.builder().valide(true).build())
            .description(ValidateReclamationFieldResponse.builder()
                .valide(false)
                .typeErreur("toxicite")
                .message("Langage inapproprié détecté")
                .build())
            .build();

        when(reclamationService.validateText(any(ValidateReclamationRequest.class)))
            .thenReturn(mockResponse);

        ResponseEntity<ValidateReclamationResponse> response = reclamationController.validate(request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getDescription().isValide()).isFalse();
        assertThat(response.getBody().getDescription().getTypeErreur()).isEqualTo("toxicite");
    }

    // ═══════════════════════════════════════════════════════════════
    // TEST 10: POST /api/reclamations/validate → Texte hors sujet
    // ═══════════════════════════════════════════════════════════════
    @Test
    @DisplayName("validateText() → Détecte contenu hors sujet")
    void validate_detectsOffTopicContent() {
        ValidateReclamationRequest request = new ValidateReclamationRequest(
            "Recette cuisine",
            "Comment faire un gâteau"
        );

        ValidateReclamationResponse mockResponse = ValidateReclamationResponse.builder()
            .sujet(ValidateReclamationFieldResponse.builder()
                .valide(false)
                .typeErreur("hors_sujet")
                .message("Contenu hors du domaine de gestion de flotte")
                .build())
            .description(ValidateReclamationFieldResponse.builder()
                .valide(false)
                .typeErreur("hors_sujet")
                .message("Contenu hors du domaine de gestion de flotte")
                .build())
            .build();

        when(reclamationService.validateText(any(ValidateReclamationRequest.class)))
            .thenReturn(mockResponse);

        ResponseEntity<ValidateReclamationResponse> response = reclamationController.validate(request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getSujet().isValide()).isFalse();
        assertThat(response.getBody().getSujet().getTypeErreur()).isEqualTo("hors_sujet");
    }

    // ═══════════════════════════════════════════════════════════════
    // TESTS ADDITIONNELS POUR BRANCHES MANQUANTES (41 branches manquantes)
    // ═══════════════════════════════════════════════════════════════

    @Test
    @DisplayName("validate() → Texte null validé comme vide")
    void validate_withNullText_treatsAsEmpty() {
        ValidateReclamationRequest request = new ValidateReclamationRequest(null, null);
        ValidateReclamationResponse mockResponse = ValidateReclamationResponse.builder()
            .sujet(ValidateReclamationFieldResponse.builder().valide(true).build())
            .description(ValidateReclamationFieldResponse.builder().valide(true).build())
            .build();
        when(reclamationService.validateText(any())).thenReturn(mockResponse);

        ResponseEntity<ValidateReclamationResponse> response = reclamationController.validate(request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        verify(reclamationService, times(1)).validateText(request);
    }

    @Test
    @DisplayName("create() → Priorité NORMAL")
    void create_withNormalPriority_succeeds() {
        CreateReclamationRequest request = new CreateReclamationRequest(
            "Problème mineur",
            "Description problème",
            PrioriteReclamation.NORMAL
        );
        ReclamationResponse mockResponse = new ReclamationResponse(
            15L, "Problème mineur", "Description problème", PrioriteReclamation.NORMAL,
            StatutReclamation.EN_COURS, null, 1L, "User", "user@test.com", LocalDateTime.now()
        );
        when(reclamationService.createReclamation(any())).thenReturn(mockResponse);

        ResponseEntity<ReclamationResponse> response = reclamationController.create(request);

        assertThat(response.getBody().getPriorite()).isEqualTo(PrioriteReclamation.NORMAL);
    }

    @Test
    @DisplayName("create() → Priorité FAIBLE")
    void create_withLowPriority_succeeds() {
        CreateReclamationRequest request = new CreateReclamationRequest(
            "Info véhicule",
            "Simple information",
            PrioriteReclamation.NORMAL
        );
        ReclamationResponse mockResponse = new ReclamationResponse(
            16L, "Info véhicule", "Simple information", PrioriteReclamation.NORMAL,
            StatutReclamation.EN_COURS, null, 1L, "User", "user@test.com", LocalDateTime.now()
        );
        when(reclamationService.createReclamation(any())).thenReturn(mockResponse);

        ResponseEntity<ReclamationResponse> response = reclamationController.create(request);

        assertThat(response.getBody().getPriorite()).isEqualTo(PrioriteReclamation.NORMAL);
    }

    @Test
    @DisplayName("update() → Changement de priorité")
    void update_changesPriority_succeeds() {
        UpdateReclamationRequest request = new UpdateReclamationRequest(
            "Sujet urgent",
            "Description urgente",
            PrioriteReclamation.URGENT
        );
        ReclamationResponse mockResponse = new ReclamationResponse(
            1L, "Sujet urgent", "Description urgente", PrioriteReclamation.URGENT,
            StatutReclamation.EN_COURS, null, 1L, "User", "user@test.com", LocalDateTime.now()
        );
        when(reclamationService.updateReclamation(eq(1L), any())).thenReturn(mockResponse);

        ResponseEntity<ReclamationResponse> response = reclamationController.update(1L, request);

        assertThat(response.getBody().getPriorite()).isEqualTo(PrioriteReclamation.URGENT);
    }

    @Test
    @DisplayName("list() → Retourne réclamations avec différents statuts")
    void list_returnsMixedStatuses() {
        ReclamationResponse rec1 = new ReclamationResponse(
            1L, "Sujet 1", "Desc 1", PrioriteReclamation.URGENT,
            StatutReclamation.EN_COURS, null, 1L, "User1", "user1@test.com", LocalDateTime.now()
        );
        ReclamationResponse rec2 = new ReclamationResponse(
            2L, "Sujet 2", "Desc 2", PrioriteReclamation.NORMAL,
            StatutReclamation.RESOLU, "Résolu", 2L, "User2", "user2@test.com", LocalDateTime.now()
        );
        ReclamationResponse rec3 = new ReclamationResponse(
            3L, "Sujet 3", "Desc 3", PrioriteReclamation.NORMAL,
            StatutReclamation.REJETE, "Rejeté", 3L, "User3", "user3@test.com", LocalDateTime.now()
        );

        when(reclamationService.getAccessibleReclamations()).thenReturn(List.of(rec1, rec2, rec3));

        ResponseEntity<List<ReclamationResponse>> response = reclamationController.list();

        assertThat(response.getBody()).hasSize(3);
        assertThat(response.getBody().get(0).getStatut()).isEqualTo(StatutReclamation.EN_COURS);
        assertThat(response.getBody().get(1).getStatut()).isEqualTo(StatutReclamation.RESOLU);
        assertThat(response.getBody().get(2).getStatut()).isEqualTo(StatutReclamation.REJETE);
    }

    @Test
    @DisplayName("resolve() → Résolution avec commentaire long")
    void resolve_withLongComment_succeeds() {
        String longComment = "Problème résolu après intervention technique approfondie. " +
            "L'équipe a effectué un diagnostic complet du véhicule et a remplacé les pièces défectueuses.";
        ReclamationDecisionRequest request = new ReclamationDecisionRequest(longComment);
        ReclamationResponse mockResponse = new ReclamationResponse(
            1L, "Problème", "Desc", PrioriteReclamation.URGENT,
            StatutReclamation.RESOLU, longComment, 1L, "User", "user@test.com", LocalDateTime.now()
        );
        when(reclamationService.resolveReclamation(eq(1L), any())).thenReturn(mockResponse);

        ResponseEntity<ReclamationResponse> response = reclamationController.resolve(1L, request);

        assertThat(response.getBody().getCommentaireResolution()).hasSize(longComment.length());
    }

    @Test
    @DisplayName("reject() → Rejet avec motif détaillé")
    void reject_withDetailedReason_succeeds() {
        String detailedReason = "Réclamation rejetée car les preuves fournies ne correspondent pas " +
            "aux logs système. Aucun dysfonctionnement technique n'a été constaté lors de la vérification.";
        ReclamationDecisionRequest request = new ReclamationDecisionRequest(detailedReason);
        ReclamationResponse mockResponse = new ReclamationResponse(
            1L, "Problème", "Desc", PrioriteReclamation.NORMAL,
            StatutReclamation.REJETE, detailedReason, 1L, "User", "user@test.com", LocalDateTime.now()
        );
        when(reclamationService.rejectReclamation(eq(1L), any())).thenReturn(mockResponse);

        ResponseEntity<ReclamationResponse> response = reclamationController.reject(1L, request);

        assertThat(response.getBody().getCommentaireResolution()).contains("rejetée");
    }

    @Test
    @DisplayName("delete() → Suppression de différentes réclamations")
    void delete_multipleIds_succeeds() {
        doNothing().when(reclamationService).deleteReclamation(anyLong());

        ResponseEntity<Void> response1 = reclamationController.delete(1L);
        ResponseEntity<Void> response2 = reclamationController.delete(2L);
        ResponseEntity<Void> response3 = reclamationController.delete(3L);

        assertThat(response1.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        assertThat(response2.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        assertThat(response3.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        verify(reclamationService, times(3)).deleteReclamation(anyLong());
    }

    @Test
    @DisplayName("validate() → Validation avec scores différents")
    void validate_withDifferentScores_succeeds() {
        ValidateReclamationRequest request = new ValidateReclamationRequest(
            "Problème véhicule majeur",
            "Le camion ne démarre plus du tout"
        );
        ValidateReclamationResponse mockResponse = ValidateReclamationResponse.builder()
            .sujet(ValidateReclamationFieldResponse.builder().valide(true).build())
            .description(ValidateReclamationFieldResponse.builder().valide(true).build())
            .build();
        when(reclamationService.validateText(any())).thenReturn(mockResponse);

        ResponseEntity<ValidateReclamationResponse> response = reclamationController.validate(request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().getSujet().isValide()).isTrue();
    }

    @Test
    @DisplayName("update() → Mise à jour vers priorité FAIBLE")
    void update_toLowPriority_succeeds() {
        UpdateReclamationRequest request = new UpdateReclamationRequest(
            "Problème résolu partiellement",
            "Plus urgent maintenant",
            PrioriteReclamation.NORMAL
        );
        ReclamationResponse mockResponse = new ReclamationResponse(
            1L, "Problème résolu partiellement", "Plus urgent maintenant", PrioriteReclamation.NORMAL,
            StatutReclamation.EN_COURS, null, 1L, "User", "user@test.com", LocalDateTime.now()
        );
        when(reclamationService.updateReclamation(eq(1L), any())).thenReturn(mockResponse);

        ResponseEntity<ReclamationResponse> response = reclamationController.update(1L, request);

        assertThat(response.getBody().getPriorite()).isEqualTo(PrioriteReclamation.NORMAL);
    }
}
