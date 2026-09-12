package com.logiway.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.logiway.dto.request.GenerateReportRequest;
import com.logiway.dto.response.GenerateReportResponse;
import com.logiway.dto.response.ReportListResponse;
import com.logiway.dto.response.ReportMetadataResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.net.MalformedURLException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReportGenerationService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${rag.service.url:http://localhost:5003}")
    private String ragServiceUrl;

    /**
     * Génère un rapport en appelant le service RAG Python
     */
    public GenerateReportResponse genererRapport(GenerateReportRequest request, String userId, String entrepriseId) {
        try {
            log.info("Génération de rapport pour user {}: {}", userId, request.getRequeteNaturelle());

            // Construction de la requête pour le service Python
            Map<String, Object> ragRequest = new HashMap<>();
            ragRequest.put("requete_naturelle", request.getRequeteNaturelle());
            ragRequest.put("user_id", userId);
            ragRequest.put("entreprise_id", entrepriseId);
            ragRequest.put("format_prefere", request.getFormatPrefere() != null ? request.getFormatPrefere() : "PDF");

            // Appel au service RAG
            String url = ragServiceUrl + "/api/reports/generate";
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(ragRequest, headers);

            ResponseEntity<String> response = restTemplate.exchange(
                url,
                HttpMethod.POST,
                entity,
                String.class
            );

            if (response.getStatusCode() == HttpStatus.OK) {
                JsonNode jsonResponse = objectMapper.readTree(response.getBody());

                // Extraction des données de la réponse
                GenerateReportResponse reportResponse = GenerateReportResponse.builder()
                    .success(jsonResponse.get("success").asBoolean())
                    .reportId(jsonResponse.get("report_id").asText())
                    .message(jsonResponse.get("message").asText())
                    .urlDownload(jsonResponse.get("url_download").asText())
                    .build();

                // Extraction des métadonnées si disponibles
                if (jsonResponse.has("metadata") && !jsonResponse.get("metadata").isNull()) {
                    JsonNode metaNode = jsonResponse.get("metadata");
                    ReportMetadataResponse metadata = ReportMetadataResponse.builder()
                        .reportId(metaNode.get("report_id").asText())
                        .titre(metaNode.get("titre").asText())
                        .format(metaNode.get("format").asText())
                        .domaine(metaNode.get("domaine").asText())
                        .statut(metaNode.get("statut").asText())
                        .userId(metaNode.get("user_id").asText())
                        .entrepriseId(metaNode.has("entreprise_id") && !metaNode.get("entreprise_id").isNull() 
                            ? metaNode.get("entreprise_id").asText() : null)
                        .dateCreation(parseDateTime(metaNode.get("date_creation").asText()))
                        .tailleFichierKo(metaNode.has("taille_fichier_ko") ? metaNode.get("taille_fichier_ko").asInt() : null)
                        .urlTelechargement(metaNode.has("url_telechargement") ? metaNode.get("url_telechargement").asText() : null)
                        .nbLignes(metaNode.has("nb_lignes") ? metaNode.get("nb_lignes").asInt() : null)
                        .tempsGenerationMs(metaNode.has("temps_generation_ms") ? metaNode.get("temps_generation_ms").asInt() : null)
                        .build();

                    reportResponse.setMetadata(metadata);
                }

                log.info("✓ Rapport généré avec succès: {}", reportResponse.getReportId());
                return reportResponse;
            } else {
                log.error("Erreur génération rapport: {}", response.getStatusCode());
                return GenerateReportResponse.builder()
                    .success(false)
                    .message("Erreur lors de la génération du rapport")
                    .build();
            }

        } catch (Exception e) {
            log.error("Erreur appel service RAG: {}", e.getMessage(), e);
            return GenerateReportResponse.builder()
                .success(false)
                .message("Erreur technique: " + e.getMessage())
                .build();
        }
    }

    /**
     * Liste les rapports disponibles
     */
    public ReportListResponse listerRapports(String userId, String domaine, Integer limit) {
        try {
            StringBuilder urlBuilder = new StringBuilder(ragServiceUrl + "/api/reports?");
            
            if (userId != null && !userId.isEmpty()) {
                urlBuilder.append("user_id=").append(userId).append("&");
            }
            if (domaine != null && !domaine.isEmpty()) {
                urlBuilder.append("domaine=").append(domaine).append("&");
            }
            if (limit != null) {
                urlBuilder.append("limit=").append(limit);
            }

            String url = urlBuilder.toString();
            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);

            if (response.getStatusCode() == HttpStatus.OK) {
                JsonNode jsonResponse = objectMapper.readTree(response.getBody());

                List<ReportMetadataResponse> rapports = new ArrayList<>();
                JsonNode rapportsNode = jsonResponse.get("rapports");

                if (rapportsNode != null && rapportsNode.isArray()) {
                    for (JsonNode rapportNode : rapportsNode) {
                        ReportMetadataResponse metadata = parseMetadata(rapportNode);
                        rapports.add(metadata);
                    }
                }

                return ReportListResponse.builder()
                    .total(jsonResponse.get("total").asInt())
                    .rapports(rapports)
                    .build();
            } else {
                log.error("Erreur récupération rapports: {}", response.getStatusCode());
                return ReportListResponse.builder()
                    .total(0)
                    .rapports(new ArrayList<>())
                    .build();
            }

        } catch (Exception e) {
            log.error("Erreur liste rapports: {}", e.getMessage(), e);
            return ReportListResponse.builder()
                .total(0)
                .rapports(new ArrayList<>())
                .build();
        }
    }

    /**
     * Récupère les métadonnées d'un rapport spécifique
     */
    public ReportMetadataResponse getMetadataRapport(String reportId) {
        try {
            String url = ragServiceUrl + "/api/reports/" + reportId;
            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);

            if (response.getStatusCode() == HttpStatus.OK) {
                JsonNode jsonResponse = objectMapper.readTree(response.getBody());
                return parseMetadata(jsonResponse);
            } else {
                log.error("Rapport {} non trouvé", reportId);
                return null;
            }

        } catch (Exception e) {
            log.error("Erreur métadonnées rapport: {}", e.getMessage(), e);
            return null;
        }
    }

    /**
     * Télécharge un rapport depuis le service RAG
     */
    public ResponseEntity<byte[]> telechargerRapport(String reportId) {
        try {
            String url = ragServiceUrl + "/api/reports/download/" + reportId;
            
            ResponseEntity<byte[]> response = restTemplate.getForEntity(url, byte[].class);

            if (response.getStatusCode() == HttpStatus.OK) {
                HttpHeaders headers = new HttpHeaders();
                
                // Copier les headers importants
                if (response.getHeaders().getContentType() != null) {
                    headers.setContentType(response.getHeaders().getContentType());
                }
                if (response.getHeaders().getContentDisposition() != null) {
                    headers.setContentDisposition(response.getHeaders().getContentDisposition());
                }

                return ResponseEntity.ok()
                    .headers(headers)
                    .body(response.getBody());
            } else {
                log.error("Rapport {} non trouvé", reportId);
                return ResponseEntity.notFound().build();
            }

        } catch (Exception e) {
            log.error("Erreur téléchargement rapport: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Supprime un rapport
     */
    public boolean supprimerRapport(String reportId) {
        try {
            String url = ragServiceUrl + "/api/reports/" + reportId;
            restTemplate.delete(url);
            log.info("✓ Rapport {} supprimé", reportId);
            return true;

        } catch (Exception e) {
            log.error("Erreur suppression rapport: {}", e.getMessage(), e);
            return false;
        }
    }

    /**
     * Parse les métadonnées depuis un JsonNode
     */
    private ReportMetadataResponse parseMetadata(JsonNode node) {
        return ReportMetadataResponse.builder()
            .reportId(node.get("report_id").asText())
            .titre(node.get("titre").asText())
            .format(node.get("format").asText())
            .domaine(node.get("domaine").asText())
            .statut(node.get("statut").asText())
            .userId(node.get("user_id").asText())
            .entrepriseId(node.has("entreprise_id") && !node.get("entreprise_id").isNull() 
                ? node.get("entreprise_id").asText() : null)
            .dateCreation(parseDateTime(node.get("date_creation").asText()))
            .dateDebutDonnees(node.has("date_debut_donnees") && !node.get("date_debut_donnees").isNull() 
                ? parseDateTime(node.get("date_debut_donnees").asText()) : null)
            .dateFinDonnees(node.has("date_fin_donnees") && !node.get("date_fin_donnees").isNull() 
                ? parseDateTime(node.get("date_fin_donnees").asText()) : null)
            .tailleFichierKo(node.has("taille_fichier_ko") && !node.get("taille_fichier_ko").isNull() 
                ? node.get("taille_fichier_ko").asInt() : null)
            .urlTelechargement(node.has("url_telechargement") ? node.get("url_telechargement").asText() : null)
            .nbLignes(node.has("nb_lignes") && !node.get("nb_lignes").isNull() 
                ? node.get("nb_lignes").asInt() : null)
            .tempsGenerationMs(node.has("temps_generation_ms") && !node.get("temps_generation_ms").isNull() 
                ? node.get("temps_generation_ms").asInt() : null)
            .erreur(node.has("erreur") && !node.get("erreur").isNull() 
                ? node.get("erreur").asText() : null)
            .build();
    }

    /**
     * Parse une date/heure depuis différents formats
     */
    private LocalDateTime parseDateTime(String dateStr) {
        if (dateStr == null || dateStr.isEmpty()) {
            return null;
        }

        try {
            // Essayer le format ISO avec T
            if (dateStr.contains("T")) {
                return LocalDateTime.parse(dateStr, DateTimeFormatter.ISO_DATE_TIME);
            }
            // Format avec espace
            return LocalDateTime.parse(dateStr, DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        } catch (Exception e) {
            log.warn("Impossible de parser la date: {}", dateStr);
            return null;
        }
    }
}
