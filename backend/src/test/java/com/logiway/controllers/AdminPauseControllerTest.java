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
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Controller Admin Pause — Tests Unitaires")
class AdminPauseControllerTest {

    @Mock
    private PauseReglementaireService pauseService;

    @InjectMocks
    private AdminPauseController adminPauseController;

    @Test
    @DisplayName("POST /api/admin/pauses/regenerer/{trajetId} → Régénère les pauses du trajet")
    void regenererPauses_returnsOk() {
        PauseReglementaireResponse pause = PauseReglementaireResponse.builder()
            .id(1L)
            .trajetId(10L)
            .type(TypePause.REST_AREA)
            .statut(StatutPause.PLANIFIEE)
            .build();
        when(pauseService.genererPauses(10L)).thenReturn(List.of(pause));

        ResponseEntity<List<PauseReglementaireResponse>> response = adminPauseController.regenererPauses(10L);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).hasSize(1);
        assertThat(response.getBody().get(0).getType()).isEqualTo(TypePause.REST_AREA);
        verify(pauseService, times(1)).genererPauses(10L);
    }
}
