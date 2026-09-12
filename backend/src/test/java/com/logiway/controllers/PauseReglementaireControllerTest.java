package com.logiway.controllers;

import com.logiway.dto.pause.PauseReglementaireResponse;
import com.logiway.entities.enums.StatutPause;
import com.logiway.entities.enums.TypePause;
import com.logiway.services.PauseReglementaireService;
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
@DisplayName("Controller Pause Réglementaire — Tests Unitaires")
class PauseReglementaireControllerTest {

    @Mock
    private PauseReglementaireService pauseService;

    @InjectMocks
    private PauseReglementaireController pauseReglementaireController;

    private static PauseReglementaireResponse pause(Long id, StatutPause statut) {
        return PauseReglementaireResponse.builder()
            .id(id)
            .trajetId(10L)
            .type(TypePause.MANDATORY_REST)
            .statut(statut)
            .build();
    }

    @Test
    @DisplayName("GET /api/trajets/{trajetId}/pauses → Retourne les pauses planifiées")
    void getPausesForTrajet_returnsOk() {
        when(pauseService.getPausesForTrajet(10L)).thenReturn(List.of(pause(1L, StatutPause.PLANIFIEE)));

        ResponseEntity<List<PauseReglementaireResponse>> response = pauseReglementaireController.getPausesForTrajet(10L);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).hasSize(1);
        verify(pauseService, times(1)).getPausesForTrajet(10L);
    }

    @Test
    @DisplayName("POST /api/trajets/{trajetId}/pauses/regenerer → Régénère les pauses")
    void regenererPauses_returnsOk() {
        when(pauseService.genererPauses(10L)).thenReturn(List.of(pause(1L, StatutPause.PLANIFIEE)));

        ResponseEntity<List<PauseReglementaireResponse>> response = pauseReglementaireController.regenererPauses(10L);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).hasSize(1);
        verify(pauseService, times(1)).genererPauses(10L);
    }

    @Test
    @DisplayName("POST /api/trajets/{trajetId}/pauses/{pauseId}/effectuee → Marque la pause comme atteinte")
    void marquerPauseEffectuee_returnsOk() {
        when(pauseService.mettreAJourStatutPause(eq(10L), eq(5L), eq(StatutPause.ATTEINTE)))
            .thenReturn(pause(5L, StatutPause.ATTEINTE));

        ResponseEntity<PauseReglementaireResponse> response = pauseReglementaireController.marquerPauseEffectuee(10L, 5L);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().getStatut()).isEqualTo(StatutPause.ATTEINTE);
        verify(pauseService, times(1)).mettreAJourStatutPause(10L, 5L, StatutPause.ATTEINTE);
    }

    @Test
    @DisplayName("POST /api/trajets/{trajetId}/pauses/{pauseId}/ignorer → Ignore la pause")
    void ignorerPause_returnsOk() {
        when(pauseService.mettreAJourStatutPause(any(Long.class), any(Long.class), eq(StatutPause.IGNOREE)))
            .thenReturn(pause(5L, StatutPause.IGNOREE));

        ResponseEntity<PauseReglementaireResponse> response = pauseReglementaireController.ignorerPause(10L, 5L);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().getStatut()).isEqualTo(StatutPause.IGNOREE);
        verify(pauseService, times(1)).mettreAJourStatutPause(10L, 5L, StatutPause.IGNOREE);
    }
}
