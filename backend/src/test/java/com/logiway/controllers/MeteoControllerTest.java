package com.logiway.controllers;

import com.logiway.dto.meteo.MeteoResponse;
import com.logiway.services.MeteoService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Controller Météo — Tests Unitaires")
class MeteoControllerTest {

    @Mock
    private MeteoService meteoService;

    @InjectMocks
    private MeteoController meteoController;

    @Test
    @DisplayName("GET /api/meteo → Retourne la météo pour des coordonnées")
    void getWeather_returnsOk() {
        MeteoResponse meteo = new MeteoResponse(
            21.5, "Ciel dégagé", "01d", 12.0, 40, 10.0, "CLAIR", "VERT", false
        );
        when(meteoService.getMeteo(48.85, 2.35)).thenReturn(meteo);

        ResponseEntity<MeteoResponse> response = meteoController.getWeather(48.85, 2.35);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().descriptionFr()).isEqualTo("Ciel dégagé");
        assertThat(response.getBody().dangereux()).isFalse();
        verify(meteoService, times(1)).getMeteo(48.85, 2.35);
    }
}
