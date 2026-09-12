package com.logiway.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import java.net.URI;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("Service Osrm — Tests Unitaires")
class OsrmServiceTest {

    private static final String OSRM_BASE_URL = "http://router.project-osrm.org/route/v1/driving/";
    private static final String GEOCODE_URL = "https://nominatim.openstreetmap.org/search";

    @Mock
    private RestTemplate restTemplate;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private OsrmService osrmService;

    @BeforeEach
    void setUp() {
        osrmService = new OsrmService(restTemplate, objectMapper);
        ReflectionTestUtils.setField(osrmService, "osrmBaseUrl", OSRM_BASE_URL);
        ReflectionTestUtils.setField(osrmService, "geocodeUrl", GEOCODE_URL);
    }

    @Test
    @DisplayName("calculerItineraire() → Retourne null si une coordonnée est nulle")
    void calculerItineraire_nullCoordinates_returnsNull() {
        OsrmService.RouteEstimation result = osrmService.calculerItineraire(null, 2.0, 3.0, 4.0, "fastest");
        assertThat(result).isNull();
    }

    @Test
    @DisplayName("calculerItineraire() → Corps vide → null")
    void calculerItineraire_blankBody_returnsNull() {
        when(restTemplate.getForObject(any(URI.class), eq(String.class))).thenReturn("  ");
        OsrmService.RouteEstimation result = osrmService.calculerItineraire(1.0, 2.0, 3.0, 4.0, "fastest");
        assertThat(result).isNull();
    }

    @Test
    @DisplayName("calculerItineraire() → Aucune route → null")
    void calculerItineraire_noRoutes_returnsNull() {
        when(restTemplate.getForObject(any(URI.class), eq(String.class))).thenReturn("{\"routes\":[]}");
        OsrmService.RouteEstimation result = osrmService.calculerItineraire(1.0, 2.0, 3.0, 4.0, "fastest");
        assertThat(result).isNull();
    }

    @Test
    @DisplayName("calculerItineraire() → Route valide → estimation distance/durée/géométrie")
    void calculerItineraire_validRoute_returnsEstimation() {
        when(restTemplate.getForObject(any(URI.class), eq(String.class))).thenReturn("""
            {"routes":[{"distance":125000,"duration":5400,
              "geometry":{"type":"LineString","coordinates":[[2.3,48.8],[2.5,48.9]]}}]}""");

        OsrmService.RouteEstimation result = osrmService.calculerItineraire(48.8, 2.3, 48.9, 2.5, "fastest");

        assertThat(result).isNotNull();
        assertThat(result.distanceKm()).isEqualTo(125.0);
        assertThat(result.durationMinutes()).isEqualTo(90);
        assertThat(result.geometryJson()).contains("LineString");
    }

    @Test
    @DisplayName("calculerItineraire() → Exception → null")
    void calculerItineraire_exception_returnsNull() {
        when(restTemplate.getForObject(any(URI.class), eq(String.class)))
            .thenThrow(new RuntimeException("connect"));
        OsrmService.RouteEstimation result = osrmService.calculerItineraire(1.0, 2.0, 3.0, 4.0, "fastest");
        assertThat(result).isNull();
    }

    @Test
    @DisplayName("calculerItineraire() → 'shortest' ajoute le paramètre annotations=true")
    void calculerItineraire_shortest_addsAnnotationsParam() {
        when(restTemplate.getForObject(any(URI.class), eq(String.class))).thenReturn("{\"routes\":[]}");

        osrmService.calculerItineraire(1.0, 2.0, 3.0, 4.0, "shortest");

        ArgumentCaptor<URI> uriCaptor = ArgumentCaptor.forClass(URI.class);
        verify(restTemplate).getForObject(uriCaptor.capture(), eq(String.class));
        assertThat(uriCaptor.getValue().toString()).contains("annotations=true");
        assertThat(uriCaptor.getValue().toString()).contains("2.0,1.0;4.0,3.0");
    }

    @Test
    @DisplayName("calculerItineraire() → typeOptimisation non-shortest → pas d'annotations")
    void calculerItineraire_fastest_noAnnotations() {
        when(restTemplate.getForObject(any(URI.class), eq(String.class))).thenReturn("{\"routes\":[]}");

        osrmService.calculerItineraire(1.0, 2.0, 3.0, 4.0, "fastest");

        ArgumentCaptor<URI> uriCaptor = ArgumentCaptor.forClass(URI.class);
        verify(restTemplate).getForObject(uriCaptor.capture(), eq(String.class));
        assertThat(uriCaptor.getValue().toString()).doesNotContain("annotations");
    }

    @Test
    @DisplayName("geocoder() → Query vide → null")
    void geocoder_blankQuery_returnsNull() {
        assertThat(osrmService.geocoder("   ")).isNull();
        assertThat(osrmService.geocoder(null)).isNull();
    }

    @Test
    @DisplayName("geocoder() → Corps vide → null")
    void geocoder_blankBody_returnsNull() {
        when(restTemplate.getForObject(any(URI.class), eq(String.class))).thenReturn(" ");
        assertThat(osrmService.geocoder("Paris")).isNull();
    }

    @Test
    @DisplayName("geocoder() → Réponse vide → null")
    void geocoder_emptyArray_returnsNull() {
        when(restTemplate.getForObject(any(URI.class), eq(String.class))).thenReturn("[]");
        assertThat(osrmService.geocoder("Paris")).isNull();
    }

    @Test
    @DisplayName("geocoder() → Coordonnées trouvées → GeoPoint")
    void geocoder_found_returnsGeoPoint() {
        when(restTemplate.getForObject(any(URI.class), eq(String.class))).thenReturn("""
            [{"lat":"48.8566","lon":"2.3522","display_name":"Paris, France"}]""");

        OsrmService.GeoPoint result = osrmService.geocoder("Paris");

        assertThat(result).isNotNull();
        assertThat(result.latitude()).isEqualTo(48.8566);
        assertThat(result.longitude()).isEqualTo(2.3522);
        assertThat(result.label()).isEqualTo("Paris, France");
    }

    @Test
    @DisplayName("geocoder() → Exception → null")
    void geocoder_exception_returnsNull() {
        when(restTemplate.getForObject(any(URI.class), eq(String.class)))
            .thenThrow(new RuntimeException("connect"));
        assertThat(osrmService.geocoder("Paris")).isNull();
    }

    @Test
    @DisplayName("geocoder() → requête correctement construite avec limit=1")
    void geocoder_buildsQueryUrl() {
        when(restTemplate.getForObject(any(URI.class), eq(String.class))).thenReturn("[]");

        osrmService.geocoder("Lyon");

        ArgumentCaptor<URI> uriCaptor = ArgumentCaptor.forClass(URI.class);
        verify(restTemplate, times(1)).getForObject(uriCaptor.capture(), eq(String.class));
        String url = uriCaptor.getValue().toString();
        assertThat(url).contains("q=Lyon");
        assertThat(url).contains("format=jsonv2");
        assertThat(url).contains("limit=1");
    }

    // --- Tests manquants: branches null coordinate combinations ---

    @Test
    @DisplayName("calculerItineraire() → longitudeDepart null → null")
    void calculerItineraire_longitudeDepartNull_returnsNull() {
        assertThat(osrmService.calculerItineraire(1.0, null, 3.0, 4.0, "fastest")).isNull();
    }

    @Test
    @DisplayName("calculerItineraire() → latitudeArrivee null → null")
    void calculerItineraire_latitudeArriveeNull_returnsNull() {
        assertThat(osrmService.calculerItineraire(1.0, 2.0, null, 4.0, "fastest")).isNull();
    }

    @Test
    @DisplayName("calculerItineraire() → longitudeArrivee null → null")
    void calculerItineraire_longitudeArriveeNull_returnsNull() {
        assertThat(osrmService.calculerItineraire(1.0, 2.0, 3.0, null, "fastest")).isNull();
    }

    @Test
    @DisplayName("calculerItineraire() → body null → null")
    void calculerItineraire_nullBody_returnsNull() {
        when(restTemplate.getForObject(any(URI.class), eq(String.class))).thenReturn(null);
        assertThat(osrmService.calculerItineraire(1.0, 2.0, 3.0, 4.0, "fastest")).isNull();
    }

    @Test
    @DisplayName("calculerItineraire() → routes n'est pas un tableau → null")
    void calculerItineraire_routesNotArray_returnsNull() {
        when(restTemplate.getForObject(any(URI.class), eq(String.class)))
            .thenReturn("{\"routes\":\"not-an-array\"}");
        assertThat(osrmService.calculerItineraire(1.0, 2.0, 3.0, 4.0, "fastest")).isNull();
    }

    @Test
    @DisplayName("geocoder() → body null → null")
    void geocoder_nullBody_returnsNull() {
        when(restTemplate.getForObject(any(URI.class), eq(String.class))).thenReturn(null);
        assertThat(osrmService.geocoder("Paris")).isNull();
    }

    @Test
    @DisplayName("geocoder() → réponse non-tableau (objet JSON) → null")
    void geocoder_notArray_returnsNull() {
        when(restTemplate.getForObject(any(URI.class), eq(String.class))).thenReturn("{\"key\":\"val\"}");
        assertThat(osrmService.geocoder("Paris")).isNull();
    }

    @Test
    @DisplayName("calculerItineraire() → typeOptimisation null → pas d'annotations")
    void calculerItineraire_nullOptimisation_noAnnotations() {
        when(restTemplate.getForObject(any(URI.class), eq(String.class))).thenReturn("{\"routes\":[]}");

        osrmService.calculerItineraire(1.0, 2.0, 3.0, 4.0, null);

        ArgumentCaptor<URI> uriCaptor = ArgumentCaptor.forClass(URI.class);
        verify(restTemplate).getForObject(uriCaptor.capture(), eq(String.class));
        assertThat(uriCaptor.getValue().toString()).doesNotContain("annotations");
    }
}
