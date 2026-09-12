package com.logiway.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("Service Gemini — Tests Unitaires")
class GeminiServiceTest {

    private static final String RAG_URL = "http://localhost:5003";

    @Mock
    private RestTemplate restTemplate;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private GeminiService geminiService;

    @BeforeEach
    void setUp() {
        geminiService = new GeminiService(restTemplate, objectMapper);
        ReflectionTestUtils.setField(geminiService, "ragServiceUrl", RAG_URL);
    }

    @Test
    @DisplayName("appelerServiceRAG() → Réponse 2xx → retourne la réponse")
    void appelerServiceRAG_success_returnsReponse() {
        when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(String.class)))
            .thenReturn(ResponseEntity.ok("{\"reponse\":\"Bonjour, comment puis-je aider ?\"}"));

        String result = geminiService.appelerServiceRAG("Quels trajets ?", "user1", 1L);

        assertThat(result).isEqualTo("Bonjour, comment puis-je aider ?");
    }

    @Test
    @DisplayName("appelerServiceRAG() → Réponse non-2xx → message d'indisponibilité")
    void appelerServiceRAG_non2xx_returnsUnavailableMessage() {
        when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(String.class)))
            .thenReturn(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("boom"));

        String result = geminiService.appelerServiceRAG("Question", "user1", null);

        assertThat(result).contains("n'est pas disponible");
    }

    @Test
    @DisplayName("appelerServiceRAG() → RestClientException → message avec URL")
    void appelerServiceRAG_connectionError_returnsUrlMessage() {
        when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(String.class)))
            .thenThrow(new RestClientException("Connection refused"));

        String result = geminiService.appelerServiceRAG("Question", "user1", null);

        assertThat(result).contains(RAG_URL);
        assertThat(result).contains("Vérifiez que le service est démarré");
    }

    @Test
    @DisplayName("appelerServiceRAG() → JSON invalide → message d'erreur générique")
    void appelerServiceRAG_invalidJson_returnsGenericError() {
        when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(String.class)))
            .thenReturn(ResponseEntity.ok("not-json"));

        String result = geminiService.appelerServiceRAG("Question", "user1", null);

        assertThat(result).contains("Erreur lors du traitement");
    }

    @Test
    @DisplayName("verifierDisponibilite() → status healthy → true")
    void verifierDisponibilite_healthy_returnsTrue() {
        when(restTemplate.getForEntity(anyString(), eq(String.class)))
            .thenReturn(ResponseEntity.ok("{\"status\":\"healthy\"}"));

        assertThat(geminiService.verifierDisponibilite()).isTrue();
    }

    @Test
    @DisplayName("verifierDisponibilite() → status non-healthy → false")
    void verifierDisponibilite_unhealthy_returnsFalse() {
        when(restTemplate.getForEntity(anyString(), eq(String.class)))
            .thenReturn(ResponseEntity.ok("{\"status\":\"degraded\"}"));

        assertThat(geminiService.verifierDisponibilite()).isFalse();
    }

    @Test
    @DisplayName("verifierDisponibilite() → exception → false")
    void verifierDisponibilite_exception_returnsFalse() {
        when(restTemplate.getForEntity(anyString(), eq(String.class)))
            .thenThrow(new RestClientException("down"));

        assertThat(geminiService.verifierDisponibilite()).isFalse();
    }

    @Test
    @DisplayName("traiterQuestionHybride() → RAG dispo → utilise le service RAG")
    void traiterQuestionHybride_ragAvailable_usesRag() {
        when(restTemplate.getForEntity(anyString(), eq(String.class)))
            .thenReturn(ResponseEntity.ok("{\"status\":\"healthy\"}"));
        when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(String.class)))
            .thenReturn(ResponseEntity.ok("{\"reponse\":\"Réponse du RAG\"}"));

        String result = geminiService.traiterQuestionHybride("Question", "user1", null, "donnees");

        assertThat(result).isEqualTo("Réponse du RAG");
    }

    @Test
    @DisplayName("traiterQuestionHybride() → RAG indispo avec données → réponse locale avec données")
    void traiterQuestionHybride_ragUnavailable_withData_returnsLocal() {
        when(restTemplate.getForEntity(anyString(), eq(String.class)))
            .thenReturn(ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(""));

        String result = geminiService.traiterQuestionHybride("Question", "user1", null, "DONNEES MCP");

        assertThat(result).contains("DONNEES MCP");
        assertThat(result).contains("Voici les informations disponibles");
    }

    @Test
    @DisplayName("traiterQuestionHybride() → RAG indispo sans données → message sans données")
    void traiterQuestionHybride_ragUnavailable_noData_returnsLocalEmpty() {
        when(restTemplate.getForEntity(anyString(), eq(String.class)))
            .thenReturn(ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(""));

        String result = geminiService.traiterQuestionHybride("Question", "user1", null, "  ");

        assertThat(result).contains("Je n'ai pas trouvé d'informations spécifiques");
    }

    @Test
    @DisplayName("traiterQuestionHybride() → verifierDisponibilite lance une exception")
    void traiterQuestionHybride_exception_returnsLocal() {
        when(restTemplate.getForEntity(anyString(), eq(String.class)))
            .thenThrow(new RuntimeException("health check failed"));

        String result = geminiService.traiterQuestionHybride("Question", "user1", null, "DONNEES");
        assertThat(result).contains("DONNEES");
    }

    @Test
    @DisplayName("appelerServiceRAG() → 2xx avec body null → message d'indisponibilité")
    void appelerServiceRAG_nullBody_returnsUnavailable() {
        when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(String.class)))
            .thenReturn(ResponseEntity.ok(null));

        String result = geminiService.appelerServiceRAG("Question", "user1", null);

        assertThat(result).contains("n'est pas disponible");
    }

    @Test
    @DisplayName("appelerServiceRAG() → entrepriseId non-null → inclut dans le body")
    void appelerServiceRAG_withEntrepriseId() {
        when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(String.class)))
            .thenReturn(ResponseEntity.ok("{\"reponse\":\"Résultat\"}"));

        String result = geminiService.appelerServiceRAG("Question", "user1", 42L);

        assertThat(result).isEqualTo("Résultat");
    }

    @Test
    @DisplayName("verifierDisponibilite() → 2xx avec body null → false")
    void verifierDisponibilite_nullBody_returnsFalse() {
        when(restTemplate.getForEntity(anyString(), eq(String.class)))
            .thenReturn(ResponseEntity.ok(null));

        assertThat(geminiService.verifierDisponibilite()).isFalse();
    }

    @Test
    @DisplayName("verifierDisponibilite() → non-2xx → false")
    void verifierDisponibilite_non2xx_returnsFalse() {
        when(restTemplate.getForEntity(anyString(), eq(String.class)))
            .thenReturn(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(""));

        assertThat(geminiService.verifierDisponibilite()).isFalse();
    }

    @Test
    @DisplayName("traiterQuestionHybride() → RAG indispo + donneesOutils null → message sans données")
    void traiterQuestionHybride_ragUnavailable_nullData_returnsLocalEmpty() {
        when(restTemplate.getForEntity(anyString(), eq(String.class)))
            .thenReturn(ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(""));

        String result = geminiService.traiterQuestionHybride("Question", "user1", null, null);

        assertThat(result).contains("Je n'ai pas trouvé d'informations spécifiques");
    }

    @Test
    @DisplayName("traiterQuestionHybride() → exception dans appelerServiceRAG après verifierDisponibilite → fallback local")
    void traiterQuestionHybride_ragAvailable_appelerRagThrows_fallbackLocal() {
        when(restTemplate.getForEntity(anyString(), eq(String.class)))
            .thenReturn(ResponseEntity.ok("{\"status\":\"healthy\"}"));
        when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(String.class)))
            .thenThrow(new RuntimeException("RAG call failed"));

        String result = geminiService.traiterQuestionHybride("Question", "user1", null, "DONNEES MCP");

        // Exception in appelerServiceRAG is caught internally, returns error string
        // But traiterQuestionHybride catches exception in outer try and falls back to construireReponseLocale
        assertThat(result).isNotNull();
    }
}
