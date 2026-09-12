package com.logiway.controllers;

import com.logiway.dto.request.CreateSectorRequest;
import com.logiway.dto.request.UpdateSectorRequest;
import com.logiway.dto.response.SectorResponse;
import com.logiway.entities.enums.Role;
import com.logiway.services.SecteurService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Controller Secteur — Tests Unitaires")
class SecteurControllerTest {

    @Mock
    private SecteurService secteurService;

    @InjectMocks
    private SecteurController secteurController;

    private SectorResponse secteur() {
        return new SectorResponse(
            1L, "Secteur Nord", "Zone de livraison nord",
            "Paris Nord", "75010-75018", 1L,
            List.of(new SectorResponse.SectorManagerInfo(2L, "Jean", "Dupont", "jean@test.com", Role.MANAGER)),
            List.of(new SectorResponse.SectorDriverInfo(3L, "Pierre", "Martin", 2L))
        );
    }

    @Test
    @DisplayName("GET /api/secteurs → Retourne la liste des secteurs accessibles")
    void list_returnsOk() {
        when(secteurService.getAccessibleSectors()).thenReturn(List.of(secteur()));

        ResponseEntity<List<SectorResponse>> response = secteurController.list();

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).hasSize(1);
        assertThat(response.getBody().get(0).nom()).isEqualTo("Secteur Nord");
        verify(secteurService, times(1)).getAccessibleSectors();
    }

    @Test
    @DisplayName("GET /api/secteurs/{id} → Retourne un secteur par ID")
    void getById_returnsOk() {
        when(secteurService.getSectorById(1L)).thenReturn(secteur());

        ResponseEntity<SectorResponse> response = secteurController.getById(1L);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().zoneGeographique()).isEqualTo("Paris Nord");
        verify(secteurService, times(1)).getSectorById(1L);
    }

    @Test
    @DisplayName("POST /api/secteurs → Crée un nouveau secteur")
    void create_returnsOk() {
        CreateSectorRequest request = new CreateSectorRequest(
            "Secteur Nord", "Zone de livraison nord", "Paris Nord",
            "75010-75018", 1L, null
        );
        when(secteurService.createSector(any(CreateSectorRequest.class))).thenReturn(secteur());

        ResponseEntity<SectorResponse> response = secteurController.create(request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().id()).isEqualTo(1L);
        verify(secteurService, times(1)).createSector(any(CreateSectorRequest.class));
    }

    @Test
    @DisplayName("PUT /api/secteurs/{id} → Met à jour un secteur")
    void update_returnsOk() {
        UpdateSectorRequest request = new UpdateSectorRequest(
            "Secteur Nord", "Zone de livraison nord élargie", "Paris Nord",
            "75010-75018", 1L, 2L
        );
        when(secteurService.updateSector(eq(1L), any(UpdateSectorRequest.class))).thenReturn(secteur());

        ResponseEntity<SectorResponse> response = secteurController.update(1L, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().description()).isEqualTo("Zone de livraison nord");
        verify(secteurService, times(1)).updateSector(eq(1L), any(UpdateSectorRequest.class));
    }

    @Test
    @DisplayName("DELETE /api/secteurs/{id} → Supprime un secteur")
    void delete_returnsNoContent() {
        doNothing().when(secteurService).deleteSector(1L);

        ResponseEntity<Void> response = secteurController.delete(1L);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        assertThat(response.getBody()).isNull();
        verify(secteurService, times(1)).deleteSector(1L);
    }

    @Test
    @DisplayName("PUT /api/secteurs/{id}/manager/{managerId} → Assigne un manager au secteur")
    void assignManager_returnsOk() {
        when(secteurService.assignManager(1L, 2L)).thenReturn(secteur());

        ResponseEntity<SectorResponse> response = secteurController.assignManager(1L, 2L);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().managers()).hasSize(1);
        verify(secteurService, times(1)).assignManager(1L, 2L);
    }

    @Test
    @DisplayName("DELETE /api/secteurs/{id}/manager/{managerId} → Retire un manager du secteur")
    void removeManager_returnsOk() {
        when(secteurService.removeManager(1L, 2L)).thenReturn(secteur());

        ResponseEntity<SectorResponse> response = secteurController.removeManager(1L, 2L);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().id()).isEqualTo(1L);
        verify(secteurService, times(1)).removeManager(1L, 2L);
    }

    @Test
    @DisplayName("PUT /api/secteurs/{id}/chauffeur/{chauffeurId} → Assigne un chauffeur au secteur")
    void assignChauffeur_returnsOk() {
        when(secteurService.assignChauffeur(1L, 3L)).thenReturn(secteur());

        ResponseEntity<SectorResponse> response = secteurController.assignChauffeur(1L, 3L);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().chauffeurs()).hasSize(1);
        verify(secteurService, times(1)).assignChauffeur(1L, 3L);
    }

    @Test
    @DisplayName("DELETE /api/secteurs/{id}/chauffeur/{chauffeurId} → Retire un chauffeur du secteur")
    void removeChauffeur_returnsOk() {
        when(secteurService.removeChauffeur(1L, 3L)).thenReturn(secteur());

        ResponseEntity<SectorResponse> response = secteurController.removeChauffeur(1L, 3L);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().id()).isEqualTo(1L);
        verify(secteurService, times(1)).removeChauffeur(1L, 3L);
    }
}
