package com.logiway.controllers;

import com.logiway.dto.trajet.*;
import com.logiway.entities.enums.PrioriteTrajet;
import com.logiway.entities.enums.StatutTrajet;
import com.logiway.services.TrajetService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Controller Trajet — Tests Unitaires")
class TrajetControllerTest {

    @Mock
    private TrajetService trajetService;

    @InjectMocks
    private TrajetController trajetController;

    private static TrajetResponse buildTrajetResponse(Long id, String depart, String arrivee, StatutTrajet statut) {
        return new TrajetResponse(
            id, depart, arrivee, 45.5, 4.8, 45.6, 4.9,
            120.0, 180, "geometrie", 1500.0, PrioriteTrajet.NORMALE,
            "notes", LocalDateTime.now(), LocalDateTime.now(), LocalDateTime.now(),
            170, 0, "BON", statut,
            1L, "Jean Dupont", 1L, "AB-123-CD", "Rouge",
            45.5, 4.8, 0.0, 2L, "Manager Test"
        );
    }

    private static TrajetRequest buildTrajetRequest(String depart, String arrivee) {
        return new TrajetRequest(
            depart, arrivee, 45.5, 4.8, 45.6, 4.9,
            LocalDateTime.now(), LocalDateTime.now().plusHours(6),
            1500.0, PrioriteTrajet.NORMALE, "notes", 1L, 1L, 2L,
            StatutTrajet.ACTIF, "shortest"
        );
    }

    @Test
    @DisplayName("GET /api/trajets → Retourne page de trajets")
    void getTrajets_returnsOk() {
        TrajetResponse trajet1 = buildTrajetResponse(1L, "Point A", "Point B", StatutTrajet.EN_COURS);
        Page<TrajetResponse> page = new PageImpl<>(List.of(trajet1), PageRequest.of(0, 10), 1);

        when(trajetService.getTrajets(isNull(), isNull(), any(Pageable.class))).thenReturn(page);

        ResponseEntity<Page<TrajetResponse>> response = trajetController.getTrajets(null, null, PageRequest.of(0, 10));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().getContent()).hasSize(1);
        verify(trajetService, times(1)).getTrajets(isNull(), isNull(), any(Pageable.class));
    }

    @Test
    @DisplayName("GET /api/trajets?search=test → Recherche trajets")
    void getTrajets_withSearch_returnsOk() {
        Page<TrajetResponse> page = new PageImpl<>(List.of(), PageRequest.of(0, 10), 0);

        when(trajetService.getTrajets(eq("test"), isNull(), any(Pageable.class))).thenReturn(page);

        ResponseEntity<Page<TrajetResponse>> response = trajetController.getTrajets("test", null, PageRequest.of(0, 10));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        verify(trajetService, times(1)).getTrajets(eq("test"), isNull(), any(Pageable.class));
    }

    @Test
    @DisplayName("GET /api/trajets?statut=EN_COURS → Filtre par statut")
    void getTrajets_withStatus_returnsOk() {
        Page<TrajetResponse> page = new PageImpl<>(List.of(), PageRequest.of(0, 10), 0);

        when(trajetService.getTrajets(isNull(), eq(StatutTrajet.EN_COURS), any(Pageable.class))).thenReturn(page);

        ResponseEntity<Page<TrajetResponse>> response = trajetController.getTrajets(null, StatutTrajet.EN_COURS, PageRequest.of(0, 10));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        verify(trajetService, times(1)).getTrajets(isNull(), eq(StatutTrajet.EN_COURS), any(Pageable.class));
    }

    @Test
    @DisplayName("GET /api/trajets/carte → Retourne trajets pour carte")
    void getCarte_returnsOk() {
        TrajetCarteResponse trajet1 = new TrajetCarteResponse(
            1L, "Point A", "Point B", 45.5, 4.8, 45.6, 4.9,
            120.0, 180, "geometrie", StatutTrajet.EN_COURS,
            1L, "AB-123-CD", "Rouge", 45.5, 4.8, 0.0, 75.0,
            1L, "0123456789", "Jean Dupont", "photo", "CHAUFFEUR", "Nord",
            "autoroute", 1500.0, 100000, 0.8
        );
        when(trajetService.getTrajetsCarte()).thenReturn(List.of(trajet1));

        ResponseEntity<List<TrajetCarteResponse>> response = trajetController.getCarte();

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).hasSize(1);
        verify(trajetService, times(1)).getTrajetsCarte();
    }

    @Test
    @DisplayName("GET /api/trajets/{id} → Retourne trajet par ID")
    void getById_returnsOk() {
        TrajetResponse trajet = buildTrajetResponse(1L, "Point A", "Point B", StatutTrajet.EN_COURS);
        when(trajetService.getTrajet(1L)).thenReturn(trajet);

        ResponseEntity<TrajetResponse> response = trajetController.getById(1L);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().id()).isEqualTo(1L);
        verify(trajetService, times(1)).getTrajet(1L);
    }

    @Test
    @DisplayName("POST /api/trajets → Crée nouveau trajet")
    void create_returnsOk() {
        TrajetRequest request = buildTrajetRequest("Point A", "Point B");
        TrajetResponse trajet = buildTrajetResponse(1L, "Point A", "Point B", StatutTrajet.ACTIF);
        when(trajetService.createTrajet(any(TrajetRequest.class))).thenReturn(trajet);

        ResponseEntity<TrajetResponse> response = trajetController.create(request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().pointDepart()).isEqualTo("Point A");
        verify(trajetService, times(1)).createTrajet(any(TrajetRequest.class));
    }

    @Test
    @DisplayName("PUT /api/trajets/{id} → Met à jour trajet")
    void update_returnsOk() {
        TrajetRequest request = buildTrajetRequest("Point A", "Point C");
        TrajetResponse trajet = buildTrajetResponse(1L, "Point A", "Point C", StatutTrajet.ACTIF);
        when(trajetService.updateTrajet(eq(1L), any(TrajetRequest.class))).thenReturn(trajet);

        ResponseEntity<TrajetResponse> response = trajetController.update(1L, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().destination()).isEqualTo("Point C");
        verify(trajetService, times(1)).updateTrajet(eq(1L), any(TrajetRequest.class));
    }

    @Test
    @DisplayName("DELETE /api/trajets/{id} → Supprime trajet")
    void delete_returnsNoContent() {
        doNothing().when(trajetService).deleteTrajet(1L);

        ResponseEntity<Void> response = trajetController.delete(1L);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        verify(trajetService, times(1)).deleteTrajet(1L);
    }

    @Test
    @DisplayName("POST /api/trajets/{id}/demarrer → Démarre trajet")
    void demarrer_returnsOk() {
        TrajetResponse trajet = buildTrajetResponse(1L, "Point A", "Point B", StatutTrajet.EN_COURS);
        when(trajetService.demarrerTrajet(1L)).thenReturn(trajet);

        ResponseEntity<TrajetResponse> response = trajetController.demarrer(1L);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().statut()).isEqualTo(StatutTrajet.EN_COURS);
        verify(trajetService, times(1)).demarrerTrajet(1L);
    }

    @Test
    @DisplayName("POST /api/trajets/{id}/terminer → Termine trajet")
    void terminer_returnsOk() {
        TrajetResponse trajet = buildTrajetResponse(1L, "Point A", "Point B", StatutTrajet.COMPLETE);
        when(trajetService.terminerTrajet(1L)).thenReturn(trajet);

        ResponseEntity<TrajetResponse> response = trajetController.terminer(1L);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().statut()).isEqualTo(StatutTrajet.COMPLETE);
        verify(trajetService, times(1)).terminerTrajet(1L);
    }

    @Test
    @DisplayName("POST /api/trajets/{id}/position → Met à jour position")
    void position_returnsOk() {
        TrajetPositionRequest request = new TrajetPositionRequest(45.55, 4.85, 80.0, 70.0, LocalDateTime.now());
        TrajetResponse trajet = buildTrajetResponse(1L, "Point A", "Point B", StatutTrajet.EN_COURS);
        when(trajetService.updatePosition(eq(1L), any(TrajetPositionRequest.class))).thenReturn(trajet);

        ResponseEntity<TrajetResponse> response = trajetController.position(1L, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().vehiculeLatitude()).isEqualTo(45.5);
        verify(trajetService, times(1)).updatePosition(eq(1L), any(TrajetPositionRequest.class));
    }

    @Test
    @DisplayName("POST /api/trajets/optimiser → Optimise tournées")
    void optimiser_returnsOk() {
        TrajetOptimisationRequest request = new TrajetOptimisationRequest(List.of(), List.of(1L, 2L, 3L));
        TourneeOptimiseeResponse tournee1 = new TourneeOptimiseeResponse(
            1L, "AB-123-CD", "Rouge", 45.5, 4.8, List.of()
        );
        when(trajetService.optimiserTrajets(any(TrajetOptimisationRequest.class))).thenReturn(List.of(tournee1));

        ResponseEntity<List<TourneeOptimiseeResponse>> response = trajetController.optimiser(request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).hasSize(1);
        verify(trajetService, times(1)).optimiserTrajets(any(TrajetOptimisationRequest.class));
    }
}
