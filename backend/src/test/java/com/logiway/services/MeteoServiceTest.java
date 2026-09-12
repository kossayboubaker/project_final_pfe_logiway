package com.logiway.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.logiway.dto.meteo.MeteoResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import java.lang.reflect.Constructor;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("Service Meteo — Tests Unitaires")
class MeteoServiceTest {

    private static final String BASE_URL = "https://api.openweathermap.org/data/2.5/weather";

    @Mock
    private RestTemplate restTemplate;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private MeteoService meteoService;

    @BeforeEach
    void setUp() {
        meteoService = new MeteoService(objectMapper);
        ReflectionTestUtils.setField(meteoService, "restTemplate", restTemplate);
        ReflectionTestUtils.setField(meteoService, "baseUrl", BASE_URL);
        ReflectionTestUtils.setField(meteoService, "apiKey", "test-key");
    }

    private void stubWeather(String payload) {
        when(restTemplate.getForObject(anyString(), eq(String.class))).thenReturn(payload);
    }

    @Test
    @DisplayName("getMeteo() → Parse une réponse OpenWeather complète")
    void getMeteo_parsesFullPayload() {
        stubWeather("""
            {"weather":[{"main":"Thunderstorm","description":"orage","icon":"11d"}],
             "main":{"temp":18.5,"humidity":65},
             "wind":{"speed":12.5},
             "visibility":8000}""");

        MeteoResponse result = meteoService.getMeteo(48.8566, 2.3522);

        assertThat(result).isNotNull();
        assertThat(result.temperatureCelsius()).isEqualTo(18.5);
        assertThat(result.descriptionFr()).isEqualTo("orage");
        assertThat(result.iconCode()).isEqualTo("11d");
        assertThat(result.windKmH()).isEqualTo(45.0);
        assertThat(result.humidity()).isEqualTo(65);
        assertThat(result.visibilityKm()).isEqualTo(8.0);
        assertThat(result.etatGeneral()).isEqualTo("ORAGE");
        assertThat(result.risqueConduite()).isEqualTo("ROUGE");
        assertThat(result.dangereux()).isTrue();
    }

    @Test
    @DisplayName("getMeteo() → Ciel dégagé = risque VERT, non dangereux")
    void getMeteo_clearWeather_isGreen() {
        stubWeather("""
            {"weather":[{"main":"Clear","description":"ciel dégagé","icon":"01d"}],
             "main":{"temp":20.0,"humidity":40},
             "wind":{"speed":2.0},
             "visibility":10000}""");

        MeteoResponse result = meteoService.getMeteo(48.8566, 2.3522);

        assertThat(result.etatGeneral()).isEqualTo("CLAIR");
        assertThat(result.risqueConduite()).isEqualTo("VERT");
        assertThat(result.dangereux()).isFalse();
    }

    @Test
    @DisplayName("getMeteo() → Visibilité < 200m = BROUILLARD / ROUGE même avec main Clear")
    void getMeteo_lowVisibility_isBrouillardRouge() {
        stubWeather("""
            {"weather":[{"main":"Clear","description":"ciel dégagé","icon":"01d"}],
             "main":{"temp":10.0},
             "wind":{"speed":1.0},
             "visibility":100}""");

        MeteoResponse result = meteoService.getMeteo(48.8566, 2.3522);

        assertThat(result.etatGeneral()).isEqualTo("BROUILLARD");
        assertThat(result.risqueConduite()).isEqualTo("ROUGE");
    }

    @Test
    @DisplayName("getMeteo() → Description contenant 'orage' quand main inconnu")
    void getMeteo_descriptionFallback_orage() {
        stubWeather("""
            {"weather":[{"main":"XXX","description":"orage violent","icon":"11d"}],
             "main":{"temp":15.0},
             "wind":{"speed":3.0},
             "visibility":5000}""");

        MeteoResponse result = meteoService.getMeteo(48.8566, 2.3522);

        assertThat(result.etatGeneral()).isEqualTo("ORAGE");
        assertThat(result.risqueConduite()).isEqualTo("ROUGE");
    }

    @Test
    @DisplayName("getMeteo() → main neige = NEIGE / ROUGE")
    void getMeteo_snow_isRouge() {
        stubWeather("""
            {"weather":[{"main":"Snow","description":"chute de neige","icon":"13d"}],
             "main":{"temp":-2.0},
             "wind":{"speed":4.0},
             "visibility":1500}""");

        MeteoResponse result = meteoService.getMeteo(48.8566, 2.3522);

        assertThat(result.etatGeneral()).isEqualTo("NEIGE");
        assertThat(result.risqueConduite()).isEqualTo("ROUGE");
    }

    @Test
    @DisplayName("getMeteo() → Pluie = ORANGE")
    void getMeteo_rain_isOrange() {
        stubWeather("""
            {"weather":[{"main":"Rain","description":"pluie","icon":"10d"}],
             "main":{"temp":12.0},
             "wind":{"speed":3.0},
             "visibility":4000}""");

        MeteoResponse result = meteoService.getMeteo(48.8566, 2.3522);

        assertThat(result.etatGeneral()).isEqualTo("PLUIE");
        assertThat(result.risqueConduite()).isEqualTo("ORANGE");
        assertThat(result.dangereux()).isFalse();
    }

    @Test
    @DisplayName("getMeteo() → Corps vide → fallback")
    void getMeteo_blankBody_returnsFallback() {
        stubWeather("  ");

        MeteoResponse result = meteoService.getMeteo(48.8566, 2.3522);

        assertThat(result.descriptionFr()).isEqualTo("Données météo indisponibles");
        assertThat(result.etatGeneral()).isEqualTo("NUAGEUX");
        assertThat(result.risqueConduite()).isEqualTo("ORANGE");
    }

    @Test
    @DisplayName("getMeteo() → Exception RestTemplate → fallback")
    void getMeteo_exception_returnsFallback() {
        when(restTemplate.getForObject(anyString(), eq(String.class)))
            .thenThrow(new RuntimeException("timeout"));

        MeteoResponse result = meteoService.getMeteo(48.8566, 2.3522);

        assertThat(result.descriptionFr()).isEqualTo("Données météo indisponibles");
    }

    @Test
    @DisplayName("getMeteo() → JSON invalide → fallback")
    void getMeteo_invalidJson_returnsFallback() {
        stubWeather("not a json");

        MeteoResponse result = meteoService.getMeteo(48.8566, 2.3522);

        assertThat(result.descriptionFr()).isEqualTo("Données météo indisponibles");
    }

    @Test
    @DisplayName("getMeteo() → Mise en cache : seconde requête au même point ne refetch pas")
    void getMeteo_secondCallWithinCache_doesNotRefetch() {
        stubWeather("""
            {"weather":[{"main":"Clear","description":"ciel dégagé","icon":"01d"}],
             "main":{"temp":20.0},
             "wind":{"speed":2.0},
             "visibility":10000}""");

        meteoService.getMeteo(48.8566, 2.3522);
        meteoService.getMeteo(48.8566, 2.3522);

        verify(restTemplate, times(1)).getForObject(anyString(), eq(String.class));
    }

    @Test
    @DisplayName("getMeteo() → Point distant de > 10km → nouvelle requête")
    void getMeteo_farPoint_refetches() {
        stubWeather("""
            {"weather":[{"main":"Clear","description":"ciel dégagé","icon":"01d"}],
             "main":{"temp":20.0},
             "wind":{"speed":2.0},
             "visibility":10000}""");

        meteoService.getMeteo(48.8566, 2.3522);
        meteoService.getMeteo(49.8566, 3.3522);

        verify(restTemplate, times(2)).getForObject(anyString(), eq(String.class));
    }

    @Test
    @DisplayName("getMeteo() → Tableau weather vide → valeurs par défaut")
    void getMeteo_emptyWeatherArray_returnsDefaults() {
        stubWeather("""
            {"weather":[],
             "main":{"temp":20.0},
             "wind":{"speed":2.0},
             "visibility":10000}""");

        MeteoResponse result = meteoService.getMeteo(48.8566, 2.3522);

        assertThat(result.etatGeneral()).isEqualTo("NUAGEUX");
        assertThat(result.descriptionFr()).isEqualTo("Conditions météo");
        assertThat(result.iconCode()).isEqualTo("01d");
        assertThat(result.temperatureCelsius()).isEqualTo(20.0);
    }

    @Test
    @DisplayName("getMeteo() → temp/humidité/visibilité absentes → champs null")
    void getMeteo_missingFields_returnsNulls() {
        stubWeather("""
            {"weather":[{"main":"Clear","description":"ciel dégagé","icon":"01d"}]}""");

        MeteoResponse result = meteoService.getMeteo(48.8566, 2.3522);

        assertThat(result.temperatureCelsius()).isNull();
        assertThat(result.humidity()).isNull();
        assertThat(result.visibilityKm()).isNull();
        assertThat(result.windKmH()).isEqualTo(0.0);
        assertThat(result.risqueConduite()).isEqualTo("VERT");
    }

    @Test
    @DisplayName("getMeteo() → vent fort (>35 km/h) avec ciel dégagé → ORANGE")
    void getMeteo_strongWind_isOrange() {
        stubWeather("""
            {"weather":[{"main":"Clear","description":"ciel dégagé","icon":"01d"}],
             "main":{"temp":20.0},
             "wind":{"speed":12.0},
             "visibility":10000}""");

        MeteoResponse result = meteoService.getMeteo(48.8566, 2.3522);

        assertThat(result.risqueConduite()).isEqualTo("ORANGE");
    }

    @Test
    @DisplayName("getMeteo() → visibilité entre 200m et 2km → ORANGE")
    void getMeteo_mediumVisibility_isOrange() {
        stubWeather("""
            {"weather":[{"main":"Clouds","description":"couvert","icon":"04d"}],
             "main":{"temp":15.0},
             "wind":{"speed":2.0},
             "visibility":1500}""");

        MeteoResponse result = meteoService.getMeteo(48.8566, 2.3522);

        assertThat(result.etatGeneral()).isEqualTo("NUAGEUX");
        assertThat(result.risqueConduite()).isEqualTo("ORANGE");
    }

    @Test
    @DisplayName("getMeteo() → main Fog → BROUILLARD")
    void getMeteo_fog_isBrouillard() {
        stubWeather("""
            {"weather":[{"main":"Fog","description":"brouillard","icon":"50d"}],
             "main":{"temp":8.0},
             "wind":{"speed":1.0},
             "visibility":800}""");

        MeteoResponse result = meteoService.getMeteo(48.8566, 2.3522);

        assertThat(result.etatGeneral()).isEqualTo("BROUILLARD");
        assertThat(result.risqueConduite()).isEqualTo("ROUGE");
    }

    @Test
    @DisplayName("getMeteo() → description 'neige' avec main inconnu → NEIGE")
    void getMeteo_descriptionNeige_isNeige() {
        stubWeather("""
            {"weather":[{"main":"XXX","description":"neige abondante","icon":"13d"}],
             "main":{"temp":-5.0},
             "wind":{"speed":3.0},
             "visibility":5000}""");

        assertThat(meteoService.getMeteo(48.8566, 2.3522).etatGeneral()).isEqualTo("NEIGE");
    }

    @Test
    @DisplayName("getMeteo() → description 'brume' avec main inconnu → BROUILLARD")
    void getMeteo_descriptionBrume_isBrouillard() {
        stubWeather("""
            {"weather":[{"main":"XXX","description":"brume légère","icon":"50d"}],
             "main":{"temp":8.0},
             "wind":{"speed":1.0},
             "visibility":1000}""");

        assertThat(meteoService.getMeteo(48.8566, 2.3522).etatGeneral()).isEqualTo("BROUILLARD");
    }

    @Test
    @DisplayName("getMeteo() → description 'rain' avec main inconnu → PLUIE")
    void getMeteo_descriptionRain_isPluie() {
        stubWeather("""
            {"weather":[{"main":"XXX","description":"light rain","icon":"10d"}],
             "main":{"temp":12.0},
             "wind":{"speed":3.0},
             "visibility":4000}""");

        assertThat(meteoService.getMeteo(48.8566, 2.3522).etatGeneral()).isEqualTo("PLUIE");
    }

    @Test
    @DisplayName("getMeteo() → description quelconque avec main inconnu → NUAGEUX")
    void getMeteo_descriptionUnknown_isNuageux() {
        stubWeather("""
            {"weather":[{"main":"XXX","description":"temps variable","icon":"02d"}],
             "main":{"temp":14.0},
             "wind":{"speed":2.0},
             "visibility":6000}""");

        assertThat(meteoService.getMeteo(48.8566, 2.3522).etatGeneral()).isEqualTo("NUAGEUX");
    }

    @Test
    @DisplayName("getMeteo() → description vide avec main Clear → libellé par défaut")
    void getMeteo_blankDescription_mainFallback() {
        stubWeather("""
            {"weather":[{"main":"Clear","description":"","icon":"01d"}],
             "main":{"temp":20.0},
             "wind":{"speed":2.0},
             "visibility":10000}""");

        MeteoResponse result = meteoService.getMeteo(48.8566, 2.3522);

        assertThat(result.descriptionFr()).isEqualTo("Ciel dégagé");
    }

    @Test
    @DisplayName("getMeteo() → description vide avec main Thunderstorm → 'Orage'")
    void getMeteo_blankDescription_thunderstorm() {
        stubWeather("""
            {"weather":[{"main":"Thunderstorm","description":" ","icon":"11d"}],
             "main":{"temp":15.0},
             "wind":{"speed":5.0},
             "visibility":5000}""");

        assertThat(meteoService.getMeteo(48.8566, 2.3522).descriptionFr()).isEqualTo("Orage");
    }

    @Test
    @DisplayName("getMeteo() → description vide avec main Snow → 'Neige'")
    void getMeteo_blankDescription_snow() {
        stubWeather("""
            {"weather":[{"main":"Snow","description":"","icon":"13d"}],
             "main":{"temp":-2.0},
             "wind":{"speed":4.0},
             "visibility":5000}""");

        assertThat(meteoService.getMeteo(48.8566, 2.3522).descriptionFr()).isEqualTo("Neige");
    }

    @Test
    @DisplayName("getMeteo() → description vide avec main Drizzle → 'Bruine'")
    void getMeteo_blankDescription_drizzle() {
        stubWeather("""
            {"weather":[{"main":"Drizzle","description":null,"icon":"09d"}],
             "main":{"temp":11.0},
             "wind":{"speed":2.0},
             "visibility":3000}""");

        assertThat(meteoService.getMeteo(48.8566, 2.3522).descriptionFr()).isEqualTo("Bruine");
    }

    @Test
    @DisplayName("getMeteo() → réponse nulle → fallback")
    void getMeteo_nullPayload_returnsFallback() {
        stubWeather(null);

        assertThat(meteoService.getMeteo(48.8566, 2.3522).descriptionFr())
            .isEqualTo("Données météo indisponibles");
    }

    @Test
    @DisplayName("getMeteo() → exception avec entrée en cache récente → retourne le cache")
    void getMeteo_exception_withRecentCache_returnsCached() {
        stubWeather("""
            {"weather":[{"main":"Clear","description":"ciel dégagé","icon":"01d"}],
             "main":{"temp":20.0},
             "wind":{"speed":2.0},
             "visibility":10000}""");
        meteoService.getMeteo(48.8566, 2.3522);

        when(restTemplate.getForObject(anyString(), eq(String.class)))
            .thenThrow(new RuntimeException("timeout"));

        MeteoResponse result = meteoService.getMeteo(49.8566, 3.3522);

        assertThat(result.descriptionFr()).isEqualTo("ciel dégagé");
    }

    @Test
    @DisplayName("getMeteo() → entrée en cache expirée → nouvelle requête")
    void getMeteo_expiredCacheEntry_refetches() throws Exception {
        Class<?> entryClass = Class.forName("com.logiway.services.MeteoService$CacheEntry");
        Constructor<?> ctor = entryClass.getDeclaredConstructor(
            double.class, double.class, MeteoResponse.class, Instant.class);
        ctor.setAccessible(true);
        MeteoResponse stale = new MeteoResponse(null, "ancienne donnée", "01d", null, null, null,
            "NUAGEUX", "ORANGE", false);
        Object expired = ctor.newInstance(48.8566, 2.3522, stale, Instant.now().minusSeconds(3600));
        Map<String, Object> cache = new ConcurrentHashMap<>();
        cache.put("48.85660:2.35220", expired);
        ReflectionTestUtils.setField(meteoService, "cache", cache);

        stubWeather("""
            {"weather":[{"main":"Clear","description":"ciel dégagé","icon":"01d"}],
             "main":{"temp":20.0},
             "wind":{"speed":2.0},
             "visibility":10000}""");

        MeteoResponse result = meteoService.getMeteo(48.8566, 2.3522);

        assertThat(result.descriptionFr()).isEqualTo("ciel dégagé");
        verify(restTemplate, times(1)).getForObject(anyString(), eq(String.class));
    }

    @Test
    @DisplayName("getMeteo() → divers cas de weatherMain et description")
    void getMeteo_variousWeatherStates() {
        // Drizzle
        stubWeather("""
            {"weather":[{"main":"Drizzle","description":"","icon":"09d"}],
             "main":{"temp":11.0}}""");
        assertThat(meteoService.getMeteo(48.1, 2.1).etatGeneral()).isEqualTo("PLUIE");

        // Smoke / Squall / Tornado -> Brouillard
        stubWeather("""
            {"weather":[{"main":"Tornado","description":"","icon":"50d"}],
             "main":{"temp":11.0}}""");
        assertThat(meteoService.getMeteo(48.2, 2.2).etatGeneral()).isEqualTo("BROUILLARD");

        // Description contains 'fog'
        stubWeather("""
            {"weather":[{"main":"UNKNOWN","description":"some fog here","icon":"50d"}],
             "main":{"temp":11.0}}""");
        assertThat(meteoService.getMeteo(48.3, 2.3).etatGeneral()).isEqualTo("BROUILLARD");

        // Description is null & unknown weather main
        stubWeather("""
            {"weather":[{"main":"UNKNOWN","description":null,"icon":"01d"}],
             "main":{"temp":11.0}}""");
        assertThat(meteoService.getMeteo(48.4, 2.4).descriptionFr()).isEqualTo("Conditions météo");
    }

    @Test
    @DisplayName("getMeteo() → main Mist → BROUILLARD")
    void getMeteo_mist_isBrouillard() {
        stubWeather("""
            {"weather":[{"main":"Mist","description":"brume","icon":"50d"}],
             "main":{"temp":10.0},
             "wind":{"speed":1.0},
             "visibility":800}""");
        assertThat(meteoService.getMeteo(47.0, 1.0).etatGeneral()).isEqualTo("BROUILLARD");
    }

    @Test
    @DisplayName("getMeteo() → main Haze → BROUILLARD")
    void getMeteo_haze_isBrouillard() {
        stubWeather("""
            {"weather":[{"main":"Haze","description":"brume sèche","icon":"50d"}],
             "main":{"temp":10.0},
             "wind":{"speed":1.0},
             "visibility":800}""");
        assertThat(meteoService.getMeteo(47.1, 1.1).etatGeneral()).isEqualTo("BROUILLARD");
    }

    @Test
    @DisplayName("getMeteo() → main Smoke → BROUILLARD")
    void getMeteo_smoke_isBrouillard() {
        stubWeather("""
            {"weather":[{"main":"Smoke","description":"fumée","icon":"50d"}],
             "main":{"temp":10.0},
             "wind":{"speed":1.0},
             "visibility":800}""");
        assertThat(meteoService.getMeteo(47.2, 1.2).etatGeneral()).isEqualTo("BROUILLARD");
    }

    @Test
    @DisplayName("getMeteo() → main Dust → BROUILLARD")
    void getMeteo_dust_isBrouillard() {
        stubWeather("""
            {"weather":[{"main":"Dust","description":"","icon":"50d"}],
             "main":{"temp":30.0},
             "wind":{"speed":5.0},
             "visibility":800}""");
        assertThat(meteoService.getMeteo(47.3, 1.3).etatGeneral()).isEqualTo("BROUILLARD");
    }

    @Test
    @DisplayName("getMeteo() → main Sand → BROUILLARD")
    void getMeteo_sand_isBrouillard() {
        stubWeather("""
            {"weather":[{"main":"Sand","description":"","icon":"50d"}],
             "main":{"temp":35.0},
             "wind":{"speed":8.0},
             "visibility":500}""");
        assertThat(meteoService.getMeteo(47.4, 1.4).etatGeneral()).isEqualTo("BROUILLARD");
    }

    @Test
    @DisplayName("getMeteo() → main Ash → BROUILLARD")
    void getMeteo_ash_isBrouillard() {
        stubWeather("""
            {"weather":[{"main":"Ash","description":"","icon":"50d"}],
             "main":{"temp":20.0},
             "wind":{"speed":2.0},
             "visibility":600}""");
        assertThat(meteoService.getMeteo(47.5, 1.5).etatGeneral()).isEqualTo("BROUILLARD");
    }

    @Test
    @DisplayName("getMeteo() → main Squall → BROUILLARD")
    void getMeteo_squall_isBrouillard() {
        stubWeather("""
            {"weather":[{"main":"Squall","description":"","icon":"50d"}],
             "main":{"temp":12.0},
             "wind":{"speed":15.0},
             "visibility":2000}""");
        assertThat(meteoService.getMeteo(47.6, 1.6).etatGeneral()).isEqualTo("BROUILLARD");
    }

    @Test
    @DisplayName("getMeteo() → description contient 'pluie' avec main inconnu → PLUIE")
    void getMeteo_descriptionPluie_isPluie() {
        stubWeather("""
            {"weather":[{"main":"XXX","description":"pluie modérée","icon":"10d"}],
             "main":{"temp":14.0},
             "wind":{"speed":3.0},
             "visibility":4000}""");
        assertThat(meteoService.getMeteo(47.7, 1.7).etatGeneral()).isEqualTo("PLUIE");
    }

    @Test
    @DisplayName("getMeteo() → description vide avec main Rain → 'Pluie'")
    void getMeteo_blankDescription_rain() {
        stubWeather("""
            {"weather":[{"main":"Rain","description":"","icon":"10d"}],
             "main":{"temp":12.0},
             "wind":{"speed":3.0},
             "visibility":5000}""");
        assertThat(meteoService.getMeteo(47.8, 1.8).descriptionFr()).isEqualTo("Pluie");
    }

    @Test
    @DisplayName("getMeteo() → description vide avec main Clouds → 'Nuageux'")
    void getMeteo_blankDescription_clouds() {
        stubWeather("""
            {"weather":[{"main":"Clouds","description":"","icon":"04d"}],
             "main":{"temp":18.0},
             "wind":{"speed":2.0},
             "visibility":8000}""");
        assertThat(meteoService.getMeteo(47.9, 1.9).descriptionFr()).isEqualTo("Nuageux");
    }

    @Test
    @DisplayName("getMeteo() → description vide avec main inconnu → 'Conditions météo'")
    void getMeteo_blankDescription_unknownMain() {
        stubWeather("""
            {"weather":[{"main":"XYZ","description":"","icon":"01d"}],
             "main":{"temp":15.0},
             "wind":{"speed":2.0},
             "visibility":9000}""");
        assertThat(meteoService.getMeteo(46.0, 1.0).descriptionFr()).isEqualTo("Conditions météo");
    }

    @Test
    @DisplayName("getMeteo() → NUAGEUX + visibilité > 2km + vent <= 35 → VERT")
    void getMeteo_nuageux_goodConditions_isVert() {
        stubWeather("""
            {"weather":[{"main":"Clouds","description":"nuageux","icon":"04d"}],
             "main":{"temp":18.0},
             "wind":{"speed":5.0},
             "visibility":9000}""");
        MeteoResponse result = meteoService.getMeteo(46.1, 1.1);
        assertThat(result.etatGeneral()).isEqualTo("NUAGEUX");
        assertThat(result.risqueConduite()).isEqualTo("VERT");
    }

    @Test
    @DisplayName("getMeteo() → NUAGEUX + vent fort > 35 km/h → ORANGE")
    void getMeteo_nuageux_strongWind_isOrange() {
        stubWeather("""
            {"weather":[{"main":"Clouds","description":"nuageux","icon":"04d"}],
             "main":{"temp":18.0},
             "wind":{"speed":11.0},
             "visibility":9000}""");
        MeteoResponse result = meteoService.getMeteo(46.2, 1.2);
        assertThat(result.etatGeneral()).isEqualTo("NUAGEUX");
        assertThat(result.risqueConduite()).isEqualTo("ORANGE");
    }

    @Test
    @DisplayName("getMeteo() → CLAIR + visibilité > 2km + vent faible → VERT")
    void getMeteo_clair_noIssues_isVert() {
        stubWeather("""
            {"weather":[{"main":"Clear","description":"ciel dégagé","icon":"01d"}],
             "main":{"temp":25.0},
             "wind":{"speed":1.0},
             "visibility":10000}""");
        MeteoResponse result = meteoService.getMeteo(46.3, 1.3);
        assertThat(result.etatGeneral()).isEqualTo("CLAIR");
        assertThat(result.risqueConduite()).isEqualTo("VERT");
    }

    @Test
    @DisplayName("getMeteo() → visibilité exactement 0 + CLAIR → VERT (0 n'est pas > 0)")
    void getMeteo_visibilityZero_clair_isVert() {
        stubWeather("""
            {"weather":[{"main":"Clear","description":"ciel dégagé","icon":"01d"}],
             "main":{"temp":20.0},
             "wind":{"speed":1.0},
             "visibility":0}""");
        MeteoResponse result = meteoService.getMeteo(46.4, 1.4);
        assertThat(result.etatGeneral()).isEqualTo("CLAIR");
        // visibilityKm = 0, so condition "visibilityKm > 0 && visibilityKm < 2.0" is false
        assertThat(result.risqueConduite()).isEqualTo("VERT");
    }

    @Test
    @DisplayName("getMeteo() → weatherMain null → résout comme NUAGEUX (default)")
    void getMeteo_nullWeatherMain_isNuageux() {
        stubWeather("""
            {"weather":[{"main":null,"description":"temps variable","icon":"01d"}],
             "main":{"temp":15.0},
             "wind":{"speed":1.0},
             "visibility":5000}""");
        assertThat(meteoService.getMeteo(46.5, 1.5).etatGeneral()).isEqualTo("NUAGEUX");
    }

    @Test
    @DisplayName("getMeteo() → exception sans cache → fallback")
    void getMeteo_exceptionNoCache_returnsFallback() {
        // Clear cache first
        ReflectionTestUtils.setField(meteoService, "cache", new ConcurrentHashMap<>());

        when(restTemplate.getForObject(anyString(), eq(String.class)))
            .thenThrow(new RuntimeException("network error"));

        MeteoResponse result = meteoService.getMeteo(90.0, 90.0);
        assertThat(result.descriptionFr()).isEqualTo("Données météo indisponibles");
    }
}
