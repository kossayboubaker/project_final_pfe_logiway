package com.logiway.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.RestClientException;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class GeminiService {

    @Value("${rag.service.url:http://localhost:5003}")
    private String ragServiceUrl;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    
    /**
     * Appelle le service RAG Gemini pour obtenir une réponse
     */
    public String appelerServiceRAG(String question, String utilisateur, Long entrepriseId) {
        try {
            String url = ragServiceUrl + "/api/rag/question";
            
            // Construction du body de la requête
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("question", question);
            requestBody.put("user_id", utilisateur);
            if (entrepriseId != null) {
                requestBody.put("entreprise_id", String.valueOf(entrepriseId));
            }
            
            // Headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
            
            log.debug("Envoi de la question au service RAG Gemini: {}", question);
            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode jsonResponse = objectMapper.readTree(response.getBody());
                String reponse = jsonResponse.path("reponse").asText();
                log.debug("Réponse reçue du service RAG Gemini: {} caractères", reponse.length());
                return reponse;
            } else {
                log.error("Erreur réponse service RAG: status={}, body={}", 
                    response.getStatusCode(), response.getBody());
                return "Le service RAG Gemini n'est pas disponible pour le moment.";
            }
            
        } catch (RestClientException e) {
            log.error("Erreur de connexion au service RAG Gemini sur {}: {}", ragServiceUrl, e.getMessage());
            return "Le service RAG Gemini n'est pas disponible. Vérifiez que le service est démarré sur " + ragServiceUrl;
        } catch (Exception e) {
            log.error("Erreur lors de l'appel au service RAG Gemini: {}", e.getMessage(), e);
            return "Erreur lors du traitement de votre question. Veuillez réessayer.";
        }
    }
    
    /**
     * Vérifie si le service RAG Gemini est disponible
     */
    public boolean verifierDisponibilite() {
        try {
            String url = ragServiceUrl + "/health";
            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode jsonResponse = objectMapper.readTree(response.getBody());
                String status = jsonResponse.path("status").asText();
                return "healthy".equalsIgnoreCase(status);
            }
            return false;
            
        } catch (Exception e) {
            log.debug("Service RAG Gemini non disponible: {}", e.getMessage());
            return false;
        }
    }
    
    /**
     * Méthode hybride: utilise les outils MCP locaux + service RAG Gemini
     */
    public String traiterQuestionHybride(String question, String utilisateur, Long entrepriseId, 
                                         String donneesOutils) {
        try {
            // Si le service RAG est disponible, on l'utilise
            if (verifierDisponibilite()) {
                log.debug("Utilisation du service RAG Gemini");
                return appelerServiceRAG(question, utilisateur, entrepriseId);
            }
            
            // Sinon, on utilise la logique MCP locale
            log.debug("Service RAG non disponible, utilisation de la logique MCP locale");
            return construireReponseLocale(question, donneesOutils);
            
        } catch (Exception e) {
            log.error("Erreur traitement hybride: {}", e.getMessage(), e);
            return construireReponseLocale(question, donneesOutils);
        }
    }
    
    /**
     * Construction de réponse locale basée sur les outils MCP
     */
    private String construireReponseLocale(String question, String donneesOutils) {
        StringBuilder reponse = new StringBuilder();
        
        if (donneesOutils != null && !donneesOutils.trim().isEmpty()) {
            reponse.append("Voici les informations disponibles:\n\n");
            reponse.append(donneesOutils);
            reponse.append("\n\n");
            reponse.append("Pour des réponses plus précises, le service RAG Gemini n'est pas disponible actuellement.");
        } else {
            reponse.append("Je n'ai pas trouvé d'informations spécifiques dans le système pour votre question.\n");
            reponse.append("Le service RAG Gemini n'est pas disponible actuellement.");
        }
        
        return reponse.toString();
    }
}