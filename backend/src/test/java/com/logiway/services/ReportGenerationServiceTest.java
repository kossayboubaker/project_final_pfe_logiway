package com.logiway.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.logiway.dto.request.GenerateReportRequest;
import com.logiway.dto.response.GenerateReportResponse;
import com.logiway.dto.response.ReportListResponse;
import com.logiway.dto.response.ReportMetadataResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("Service ReportGeneration — Tests Unitaires")
class ReportGenerationServiceTest {

    private static final String RAG_URL = "http://localhost:5003";

    @Mock
    private RestTemplate restTemplate;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private ReportGenerationService service;

    @BeforeEach
    void setUp() {
        service = new ReportGenerationService(restTemplate, objectMapper);
        ReflectionTestUtils.setField(service, "ragServiceUrl", RAG_URL);
    }

    private GenerateReportRequest request(String requete, String format) {
        return GenerateReportRequest.builder()
            .requeteNaturelle(requete)
            .formatPrefere(format)
            .build();
    }

    @Test
    @DisplayName("genererRapport() → 200 avec métadonnées → réponse complète")
    void genererRapport_success_withMetadata_returnsFullResponse() throws Exception {
        String body = """
            {
              "success": true,
              "report_id": "rep-1",
              "message": "Rapport généré",
              "url_download": "/api/reports/download/rep-1",
              "metadata": {
                "report_id": "rep-1",
                "titre": "Flotte",
                "format": "PDF",
                "domaine": "vehicules",
                "statut": "COMPLETE",
                "user_id": "u1",
                "entreprise_id": "e1",
                "date_creation": "2026-08-11T10:30:00",
                "taille_fichier_ko": 25,
                "nb_lignes": 10,
                "temps_generation_ms": 500
              }
            }
            """;
        when(restTemplate.exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(String.class)))
            .thenReturn(ResponseEntity.ok(body));

        GenerateReportResponse response = service.genererRapport(request("liste des véhicules", "PDF"), "u1", "e1");

        assertThat(response.getSuccess()).isTrue();
        assertThat(response.getReportId()).isEqualTo("rep-1");
        assertThat(response.getUrlDownload()).isEqualTo("/api/reports/download/rep-1");
        assertThat(response.getMetadata()).isNotNull();
        assertThat(response.getMetadata().getTitre()).isEqualTo("Flotte");
        assertThat(response.getMetadata().getFormat()).isEqualTo("PDF");
        assertThat(response.getMetadata().getEntrepriseId()).isEqualTo("e1");
        assertThat(response.getMetadata().getDateCreation()).isEqualTo(LocalDateTime.of(2026, 8, 11, 10, 30));
        assertThat(response.getMetadata().getTailleFichierKo()).isEqualTo(25);
    }

    @Test
    @DisplayName("genererRapport() → 200 sans métadonnées → metadata null")
    void genererRapport_success_withoutMetadata_metadataNull() {
        String body = """
            {"success": true, "report_id": "rep-2", "message": "ok", "url_download": "/x"}
            """;
        when(restTemplate.exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(String.class)))
            .thenReturn(ResponseEntity.ok(body));

        GenerateReportResponse response = service.genererRapport(request("rapport", "PDF"), "u1", null);

        assertThat(response.getSuccess()).isTrue();
        assertThat(response.getMetadata()).isNull();
    }

    @Test
    @DisplayName("genererRapport() → réponse non-200 → échec avec message générique")
    void genererRapport_nonOk_returnsFailure() {
        when(restTemplate.exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(String.class)))
            .thenReturn(ResponseEntity.status(HttpStatus.BAD_REQUEST).body("{}"));

        GenerateReportResponse response = service.genererRapport(request("rapport", "PDF"), "u1", null);

        assertThat(response.getSuccess()).isFalse();
        assertThat(response.getMessage()).isEqualTo("Erreur lors de la génération du rapport");
    }

    @Test
    @DisplayName("genererRapport() → exception → message technique")
    void genererRapport_exception_returnsTechnicalError() {
        when(restTemplate.exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(String.class)))
            .thenThrow(new RestClientException("connection refused"));

        GenerateReportResponse response = service.genererRapport(request("rapport", "PDF"), "u1", null);

        assertThat(response.getSuccess()).isFalse();
        assertThat(response.getMessage()).contains("Erreur technique");
    }

    @Test
    @DisplayName("listerRapports() → 200 avec liste → total et métadonnées")
    void listerRapports_success_returnsList() {
        String body = """
            {"total": 1, "rapports": [
              {"report_id": "r1", "titre": "T", "format": "PDF", "domaine": "d",
               "statut": "s", "user_id": "u1", "date_creation": "2026-08-11T10:00:00"}
            ]}
            """;
        when(restTemplate.getForEntity(anyString(), eq(String.class))).thenReturn(ResponseEntity.ok(body));

        ReportListResponse response = service.listerRapports("u1", "vehicules", 10);

        assertThat(response.getTotal()).isEqualTo(1);
        assertThat(response.getRapports()).hasSize(1);
        assertThat(response.getRapports().get(0).getReportId()).isEqualTo("r1");
        assertThat(response.getRapports().get(0).getUserId()).isEqualTo("u1");
    }

    @Test
    @DisplayName("listerRapports() → 200 sans rapports → liste vide")
    void listerRapports_success_emptyList() {
        String body = """
            {"total": 0, "rapports": []}
            """;
        when(restTemplate.getForEntity(anyString(), eq(String.class))).thenReturn(ResponseEntity.ok(body));

        ReportListResponse response = service.listerRapports(null, null, null);

        assertThat(response.getTotal()).isZero();
        assertThat(response.getRapports()).isEmpty();
    }

    @Test
    @DisplayName("listerRapports() → non-200 → total 0")
    void listerRapports_nonOk_returnsEmpty() {
        when(restTemplate.getForEntity(anyString(), eq(String.class)))
            .thenReturn(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(""));

        ReportListResponse response = service.listerRapports("u1", null, null);

        assertThat(response.getTotal()).isZero();
        assertThat(response.getRapports()).isEmpty();
    }

    @Test
    @DisplayName("listerRapports() → exception → total 0")
    void listerRapports_exception_returnsEmpty() {
        when(restTemplate.getForEntity(anyString(), eq(String.class)))
            .thenThrow(new RestClientException("down"));

        ReportListResponse response = service.listerRapports("u1", null, null);

        assertThat(response.getTotal()).isZero();
    }

    @Test
    @DisplayName("getMetadataRapport() → 200 → métadonnées")
    void getMetadataRapport_success_returnsMetadata() {
        String body = """
            {"report_id": "r1", "titre": "T", "format": "CSV", "domaine": "d",
             "statut": "s", "user_id": "u1", "date_creation": "2026-08-11 10:00:00"}
            """;
        when(restTemplate.getForEntity(anyString(), eq(String.class))).thenReturn(ResponseEntity.ok(body));

        ReportMetadataResponse metadata = service.getMetadataRapport("r1");

        assertThat(metadata).isNotNull();
        assertThat(metadata.getReportId()).isEqualTo("r1");
        assertThat(metadata.getDateCreation()).isEqualTo(LocalDateTime.of(2026, 8, 11, 10, 0));
    }

    @Test
    @DisplayName("getMetadataRapport() → non-200 → null")
    void getMetadataRapport_nonOk_returnsNull() {
        when(restTemplate.getForEntity(anyString(), eq(String.class)))
            .thenReturn(ResponseEntity.status(HttpStatus.NOT_FOUND).body(""));

        assertThat(service.getMetadataRapport("r1")).isNull();
    }

    @Test
    @DisplayName("getMetadataRapport() → exception → null")
    void getMetadataRapport_exception_returnsNull() {
        when(restTemplate.getForEntity(anyString(), eq(String.class)))
            .thenThrow(new RestClientException("down"));

        assertThat(service.getMetadataRapport("r1")).isNull();
    }

    @Test
    @DisplayName("telechargerRapport() → 200 → bytes et headers conservés")
    void telechargerRapport_success_returnsBytes() {
        ResponseEntity<byte[]> upstream = ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_PDF)
            .body(new byte[]{1, 2, 3});
        when(restTemplate.getForEntity(anyString(), eq(byte[].class))).thenReturn(upstream);

        ResponseEntity<byte[]> response = service.telechargerRapport("r1");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).containsExactly(1, 2, 3);
        assertThat(response.getHeaders().getContentType()).isEqualTo(MediaType.APPLICATION_PDF);
    }

    @Test
    @DisplayName("telechargerRapport() → non-200 → notFound")
    void telechargerRapport_nonOk_returnsNotFound() {
        when(restTemplate.getForEntity(anyString(), eq(byte[].class)))
            .thenReturn(ResponseEntity.status(HttpStatus.NOT_FOUND).body(null));

        assertThat(service.telechargerRapport("r1").getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    @DisplayName("telechargerRapport() → exception → 500")
    void telechargerRapport_exception_returnsInternalServerError() {
        when(restTemplate.getForEntity(anyString(), eq(byte[].class)))
            .thenThrow(new RestClientException("down"));

        assertThat(service.telechargerRapport("r1").getStatusCode())
            .isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
    }

    @Test
    @DisplayName("supprimerRapport() → succès → true")
    void supprimerRapport_success_returnsTrue() {
        assertThat(service.supprimerRapport("r1")).isTrue();
        verify(restTemplate).delete(eq(RAG_URL + "/api/reports/r1"));
    }

    @Test
    @DisplayName("supprimerRapport() → exception → false")
    void supprimerRapport_exception_returnsFalse() {
        doThrow(new RestClientException("down")).when(restTemplate).delete(anyString());

        assertThat(service.supprimerRapport("r1")).isFalse();
    }

    @Test
    @DisplayName("genererRapport() → formatPrefere null et metadata manquantes")
    void genererRapport_nullFormat_missingMetaFields() {
        String body = """
            {
              "success": true,
              "report_id": "rep-1",
              "message": "Rapport généré",
              "url_download": "/api/reports/download/rep-1",
              "metadata": {
                "report_id": "rep-1",
                "titre": "Flotte",
                "format": "PDF",
                "domaine": "vehicules",
                "statut": "COMPLETE",
                "user_id": "u1",
                "entreprise_id": null,
                "date_creation": "2026-08-11T10:30:00"
              }
            }
            """;
        when(restTemplate.exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(String.class)))
            .thenReturn(ResponseEntity.ok(body));

        GenerateReportResponse response = service.genererRapport(request("liste", null), "u1", "e1");
        assertThat(response.getSuccess()).isTrue();
        assertThat(response.getMetadata().getEntrepriseId()).isNull();
        assertThat(response.getMetadata().getTailleFichierKo()).isNull();
    }

    @Test
    @DisplayName("listerRapports() → paramètres vides et rapportsNode invalides")
    void listerRapports_emptyParams_invalidRapportsNode() {
        // userId and domaine empty, limit not null, rapportsNode is not array
        String body = "{\"total\": 5, \"rapports\": null}";
        when(restTemplate.getForEntity(anyString(), eq(String.class))).thenReturn(ResponseEntity.ok(body));

        ReportListResponse response = service.listerRapports("", "", 10);
        assertThat(response.getTotal()).isEqualTo(5);
        assertThat(response.getRapports()).isEmpty();
    }

    @Test
    @DisplayName("parseMetadata() → tous les champs alternatifs présents ou absents")
    void parseMetadata_allEdgeCases() {
        String body = """
            {
              "report_id": "r1",
              "titre": "T",
              "format": "PDF",
              "domaine": "d",
              "statut": "s",
              "user_id": "u1",
              "entreprise_id": "e1",
              "date_creation": "2026-08-11 10:00:00",
              "date_debut_donnees": "2026-08-01 00:00:00",
              "date_fin_donnees": "2026-08-10 23:59:59",
              "taille_fichier_ko": 100,
              "url_telechargement": "http://download",
              "nb_lignes": 50,
              "temps_generation_ms": 200,
              "erreur": "aucune"
            }
            """;
        when(restTemplate.getForEntity(anyString(), eq(String.class))).thenReturn(ResponseEntity.ok(body));

        ReportMetadataResponse metadata = service.getMetadataRapport("r1");
        assertThat(metadata).isNotNull();
        assertThat(metadata.getDateDebutDonnees()).isEqualTo(LocalDateTime.of(2026, 8, 1, 0, 0));
        assertThat(metadata.getDateFinDonnees()).isEqualTo(LocalDateTime.of(2026, 8, 10, 23, 59, 59));
        assertThat(metadata.getTailleFichierKo()).isEqualTo(100);
        assertThat(metadata.getUrlTelechargement()).isEqualTo("http://download");
        assertThat(metadata.getNbLignes()).isEqualTo(50);
        assertThat(metadata.getTempsGenerationMs()).isEqualTo(200);
        assertThat(metadata.getErreur()).isEqualTo("aucune");
    }

    @Test
    @DisplayName("parseDateTime() → formats de date invalides ou vides")
    void parseDateTime_invalidAndEmpty() {
        String body = """
            {
              "report_id": "r1",
              "titre": "T",
              "format": "PDF",
              "domaine": "d",
              "statut": "s",
              "user_id": "u1",
              "date_creation": "",
              "date_debut_donnees": "format-invalide"
            }
            """;
        when(restTemplate.getForEntity(anyString(), eq(String.class))).thenReturn(ResponseEntity.ok(body));

        ReportMetadataResponse metadata = service.getMetadataRapport("r1");
        assertThat(metadata).isNotNull();
        assertThat(metadata.getDateCreation()).isNull();
        assertThat(metadata.getDateDebutDonnees()).isNull();
    }

    // --- Tests manquants: telechargerRapport branches ---

    @Test
    @DisplayName("telechargerRapport() → 200 sans contentType → pas d'erreur")
    void telechargerRapport_noContentType_ok() {
        ResponseEntity<byte[]> upstream = ResponseEntity.ok()
            .body(new byte[]{1, 2});
        when(restTemplate.getForEntity(anyString(), eq(byte[].class))).thenReturn(upstream);

        ResponseEntity<byte[]> response = service.telechargerRapport("r1");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).containsExactly(1, 2);
    }

    @Test
    @DisplayName("telechargerRapport() → 200 avec contentDisposition → headers copiés")
    void telechargerRapport_withContentDisposition_headersCopied() {
        ContentDisposition disposition = ContentDisposition.attachment().filename("report.pdf").build();
        ResponseEntity<byte[]> upstream = ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_PDF)
            .header("Content-Disposition", disposition.toString())
            .body(new byte[]{5, 6});
        when(restTemplate.getForEntity(anyString(), eq(byte[].class))).thenReturn(upstream);

        ResponseEntity<byte[]> response = service.telechargerRapport("r1");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getHeaders().getContentType()).isEqualTo(MediaType.APPLICATION_PDF);
    }

    // --- Tests manquants: genererRapport body null on 200 ---

    @Test
    @DisplayName("genererRapport() → 200 mais body null → exception attrapée")
    void genererRapport_okButNullBody_returnsError() {
        when(restTemplate.exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(String.class)))
            .thenReturn(ResponseEntity.ok(null));

        GenerateReportResponse response = service.genererRapport(request("rapport", "PDF"), "u1", null);

        assertThat(response.getSuccess()).isFalse();
        assertThat(response.getMessage()).contains("Erreur technique");
    }

    // --- Tests manquants: parseMetadata branches pour champs optionnels absents ---

    @Test
    @DisplayName("parseMetadata() → champs optionnels tous absents")
    void parseMetadata_missingOptionalFields() {
        String body = """
            {
              "report_id": "r1",
              "titre": "T",
              "format": "PDF",
              "domaine": "d",
              "statut": "s",
              "user_id": "u1",
              "date_creation": "2026-08-11T10:00:00"
            }
            """;
        when(restTemplate.getForEntity(anyString(), eq(String.class))).thenReturn(ResponseEntity.ok(body));

        ReportMetadataResponse metadata = service.getMetadataRapport("r1");
        assertThat(metadata).isNotNull();
        assertThat(metadata.getEntrepriseId()).isNull();
        assertThat(metadata.getDateDebutDonnees()).isNull();
        assertThat(metadata.getDateFinDonnees()).isNull();
        assertThat(metadata.getTailleFichierKo()).isNull();
        assertThat(metadata.getUrlTelechargement()).isNull();
        assertThat(metadata.getNbLignes()).isNull();
        assertThat(metadata.getTempsGenerationMs()).isNull();
        assertThat(metadata.getErreur()).isNull();
    }

    @Test
    @DisplayName("parseMetadata() → champs optionnels tous null dans JSON")
    void parseMetadata_nullOptionalFields() {
        String body = """
            {
              "report_id": "r1",
              "titre": "T",
              "format": "PDF",
              "domaine": "d",
              "statut": "s",
              "user_id": "u1",
              "entreprise_id": null,
              "date_creation": "2026-08-11T10:00:00",
              "date_debut_donnees": null,
              "date_fin_donnees": null,
              "taille_fichier_ko": null,
              "nb_lignes": null,
              "temps_generation_ms": null,
              "erreur": null
            }
            """;
        when(restTemplate.getForEntity(anyString(), eq(String.class))).thenReturn(ResponseEntity.ok(body));

        ReportMetadataResponse metadata = service.getMetadataRapport("r1");
        assertThat(metadata).isNotNull();
        assertThat(metadata.getEntrepriseId()).isNull();
        assertThat(metadata.getDateDebutDonnees()).isNull();
        assertThat(metadata.getDateFinDonnees()).isNull();
        assertThat(metadata.getTailleFichierKo()).isNull();
        assertThat(metadata.getNbLignes()).isNull();
        assertThat(metadata.getTempsGenerationMs()).isNull();
        assertThat(metadata.getErreur()).isNull();
    }

    // --- Tests manquants: listerRapports avec tous les paramètres ---

    @Test
    @DisplayName("listerRapports() → avec userId, domaine et limit → URL construite correctement")
    void listerRapports_allParams_buildsCorrectUrl() {
        String body = """
            {"total": 0, "rapports": []}
            """;
        when(restTemplate.getForEntity(anyString(), eq(String.class))).thenReturn(ResponseEntity.ok(body));

        ReportListResponse response = service.listerRapports("u1", "vehicules", 5);

        assertThat(response.getTotal()).isZero();
    }

    @Test
    @DisplayName("listerRapports() → userId null, domaine null, limit null → URL minimale")
    void listerRapports_nullParams_buildsMinimalUrl() {
        String body = """
            {"total": 0, "rapports": []}
            """;
        when(restTemplate.getForEntity(anyString(), eq(String.class))).thenReturn(ResponseEntity.ok(body));

        ReportListResponse response = service.listerRapports(null, null, null);

        assertThat(response.getTotal()).isZero();
    }

    @Test
    @DisplayName("genererRapport() → entrepriseId null → pas inclus dans le body")
    void genererRapport_entrepriseIdNull() {
        String body = """
            {"success": true, "report_id": "rep-1", "message": "ok", "url_download": "/x"}
            """;
        when(restTemplate.exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(String.class)))
            .thenReturn(ResponseEntity.ok(body));

        GenerateReportResponse response = service.genererRapport(request("rapport", "PDF"), "u1", null);
        assertThat(response.getSuccess()).isTrue();
    }

    @Test
    @DisplayName("parseDateTime() → null → null")
    void parseDateTime_null_returnsNull() {
        String body = """
            {
              "report_id": "r1",
              "titre": "T",
              "format": "PDF",
              "domaine": "d",
              "statut": "s",
              "user_id": "u1",
              "date_creation": null
            }
            """;
        when(restTemplate.getForEntity(anyString(), eq(String.class))).thenReturn(ResponseEntity.ok(body));

        ReportMetadataResponse metadata = service.getMetadataRapport("r1");
        assertThat(metadata).isNotNull();
        // date_creation is null text → parseDateTime returns null
    }
}
