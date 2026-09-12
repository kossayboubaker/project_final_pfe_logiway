package com.logiway.dto.response;

import com.logiway.entities.enums.PrioriteReclamation;
import com.logiway.entities.enums.StatutReclamation;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Tests de couverture maximale pour les DTOs response.
 * Placé dans le même package pour accéder à canEqual (protected Lombok).
 * Couvre toutes les branches equals/hashCode/toString générées par Lombok @Data et @Value.
 */
@DisplayName("dto.response — Coverage 100% (equals/hashCode/toString/canEqual/setters)")
class ResponseDtoCoverageTest {

    // ══════════════════════════════════════════════════════════════════════
    // ReclamationResponse — @Value (0% Branch → 100%)
    // ══════════════════════════════════════════════════════════════════════
    @Nested @DisplayName("ReclamationResponse")
    class ReclamationResponseCoverage {

        private ReclamationResponse r(Long id) {
            return new ReclamationResponse(id, "Sujet", "Desc",
                PrioriteReclamation.URGENT, StatutReclamation.EN_COURS,
                "OK", 2L, "Jean", "j@t.fr",
                LocalDateTime.of(2026, 8, 1, 10, 0));
        }

        @Test @DisplayName("equals → même instance (true)")
        void equals_sameInstance() {
            ReclamationResponse r = r(1L);
            assertThat(r.equals(r)).isTrue();
        }

        @Test @DisplayName("equals → deux instances identiques (true)")
        void equals_identical() {
            assertThat(r(1L)).isEqualTo(r(1L));
        }

        @Test @DisplayName("equals → null (false)")
        void equals_null() {
            assertThat(r(1L).equals(null)).isFalse();
        }

        @Test @DisplayName("equals → classe différente (false)")
        void equals_differentClass() {
            assertThat(r(1L).equals("not-a-reclamation")).isFalse();
        }

        @Test @DisplayName("equals → id différent (false)")
        void equals_differentId() {
            assertThat(r(1L).equals(r(2L))).isFalse();
        }

        @Test @DisplayName("equals → sujet null vs non-null (false)")
        void equals_nullSujet() {
            ReclamationResponse r1 = new ReclamationResponse(1L, null, "D",
                PrioriteReclamation.URGENT, StatutReclamation.EN_COURS,
                "OK", 2L, "J", "j@t.fr", LocalDateTime.now());
            ReclamationResponse r2 = r(1L);
            assertThat(r1.equals(r2)).isFalse();
            assertThat(r2.equals(r1)).isFalse();
        }

        @Test @DisplayName("hashCode → identique pour instances égales")
        void hashCode_equal() {
            assertThat(r(1L).hashCode()).isEqualTo(r(1L).hashCode());
        }

        @Test @DisplayName("hashCode → différent pour instances différentes")
        void hashCode_different() {
            assertThat(r(1L).hashCode()).isNotEqualTo(r(2L).hashCode());
        }

        @Test @DisplayName("toString → contient les champs clés")
        void toStringContains() {
            assertThat(r(1L).toString()).contains("Sujet", "URGENT");
        }

        @Test @DisplayName("tous les getters")
        void allGetters() {
            LocalDateTime now = LocalDateTime.of(2026, 8, 1, 10, 0);
            ReclamationResponse r = new ReclamationResponse(5L, "S", "D",
                PrioriteReclamation.NORMAL, StatutReclamation.RESOLU,
                "Comm", 3L, "M", "m@t.fr", now);
            assertThat(r.getId()).isEqualTo(5L);
            assertThat(r.getSujet()).isEqualTo("S");
            assertThat(r.getDescription()).isEqualTo("D");
            assertThat(r.getPriorite()).isEqualTo(PrioriteReclamation.NORMAL);
            assertThat(r.getStatut()).isEqualTo(StatutReclamation.RESOLU);
            assertThat(r.getCommentaireResolution()).isEqualTo("Comm");
            assertThat(r.getUtilisateurId()).isEqualTo(3L);
            assertThat(r.getUtilisateurNom()).isEqualTo("M");
            assertThat(r.getUtilisateurEmail()).isEqualTo("m@t.fr");
            assertThat(r.getDateCreation()).isEqualTo(now);
        }
    }

    // ══════════════════════════════════════════════════════════════════════
    // ReportMetadataResponse — @Data (38.9% Branch → 100%)
    // ══════════════════════════════════════════════════════════════════════
    @Nested @DisplayName("ReportMetadataResponse")
    class ReportMetadataResponseCoverage {

        private ReportMetadataResponse full() {
            LocalDateTime now = LocalDateTime.of(2026, 8, 1, 10, 0);
            return ReportMetadataResponse.builder()
                .reportId("R1").titre("Rapport").format("PDF")
                .domaine("trajets").statut("DONE")
                .userId("U1").entrepriseId("E1")
                .dateCreation(now).dateDebutDonnees(now).dateFinDonnees(now)
                .tailleFichierKo(500).urlTelechargement("/dl/R1")
                .nbLignes(200).tempsGenerationMs(1500).erreur(null).build();
        }

        @Test @DisplayName("equals → même instance (true)")
        void equals_sameInstance() {
            ReportMetadataResponse r = full();
            assertThat(r.equals(r)).isTrue();
        }

        @Test @DisplayName("equals → deux instances identiques (true)")
        void equals_identical() {
            assertThat(full()).isEqualTo(full());
        }

        @Test @DisplayName("equals → null (false)")
        void equals_null() {
            assertThat(full().equals(null)).isFalse();
        }

        @Test @DisplayName("equals → classe différente (false)")
        void equals_differentClass() {
            assertThat(full().equals("other")).isFalse();
        }

        @Test @DisplayName("equals → reportId différent (false)")
        void equals_differentReportId() {
            ReportMetadataResponse other = ReportMetadataResponse.builder().reportId("R2").build();
            assertThat(full().equals(other)).isFalse();
        }

        @Test @DisplayName("canEqual → même type (true)")
        void canEqual_sameType() {
            assertThat(full().canEqual(new ReportMetadataResponse())).isTrue();
        }

        @Test @DisplayName("canEqual → type différent (false)")
        void canEqual_differentType() {
            assertThat(full().canEqual("other")).isFalse();
        }

        @Test @DisplayName("hashCode → identique pour instances égales")
        void hashCode_equal() {
            assertThat(full().hashCode()).isEqualTo(full().hashCode());
        }

        @Test @DisplayName("toString → contient les champs clés")
        void toStringContains() {
            assertThat(full().toString()).contains("R1", "PDF");
        }

        @Test @DisplayName("tous les setters + getters")
        void allSettersGetters() {
            ReportMetadataResponse r = new ReportMetadataResponse();
            LocalDateTime now = LocalDateTime.of(2026, 8, 1, 10, 0);
            r.setReportId("R1"); r.setTitre("T"); r.setFormat("CSV");
            r.setDomaine("d"); r.setStatut("DONE"); r.setUserId("U1");
            r.setEntrepriseId("E1"); r.setDateCreation(now);
            r.setDateDebutDonnees(now); r.setDateFinDonnees(now);
            r.setTailleFichierKo(100); r.setUrlTelechargement("/dl");
            r.setNbLignes(50); r.setTempsGenerationMs(200); r.setErreur("err");
            assertThat(r.getFormat()).isEqualTo("CSV");
            assertThat(r.getDomaine()).isEqualTo("d");
            assertThat(r.getUserId()).isEqualTo("U1");
            assertThat(r.getEntrepriseId()).isEqualTo("E1");
            assertThat(r.getDateCreation()).isEqualTo(now);
            assertThat(r.getDateDebutDonnees()).isEqualTo(now);
            assertThat(r.getDateFinDonnees()).isEqualTo(now);
            assertThat(r.getTailleFichierKo()).isEqualTo(100);
            assertThat(r.getUrlTelechargement()).isEqualTo("/dl");
            assertThat(r.getNbLignes()).isEqualTo(50);
            assertThat(r.getTempsGenerationMs()).isEqualTo(200);
            assertThat(r.getErreur()).isEqualTo("err");
        }
    }

    // ══════════════════════════════════════════════════════════════════════
    // GenerateReportResponse — @Data (41.3% Branch → 100%)
    // ══════════════════════════════════════════════════════════════════════
    @Nested @DisplayName("GenerateReportResponse")
    class GenerateReportResponseCoverage {

        private GenerateReportResponse full() {
            return GenerateReportResponse.builder()
                .success(true).reportId("R1").message("OK")
                .urlDownload("/dl/R1")
                .metadata(ReportMetadataResponse.builder().reportId("R1").build()).build();
        }

        @Test @DisplayName("equals → même instance (true)")
        void equals_sameInstance() {
            GenerateReportResponse r = full();
            assertThat(r.equals(r)).isTrue();
        }

        @Test @DisplayName("equals → identiques (true)")
        void equals_identical() {
            assertThat(full()).isEqualTo(full());
        }

        @Test @DisplayName("equals → null (false)")
        void equals_null() {
            assertThat(full().equals(null)).isFalse();
        }

        @Test @DisplayName("equals → classe différente (false)")
        void equals_differentClass() {
            assertThat(full().equals("x")).isFalse();
        }

        @Test @DisplayName("equals → success différent (false)")
        void equals_differentSuccess() {
            GenerateReportResponse other = GenerateReportResponse.builder()
                .success(false).reportId("R1").message("OK").build();
            assertThat(full().equals(other)).isFalse();
        }

        @Test @DisplayName("canEqual → même type (true)")
        void canEqual_sameType() {
            assertThat(full().canEqual(new GenerateReportResponse())).isTrue();
        }

        @Test @DisplayName("canEqual → type différent (false)")
        void canEqual_differentType() {
            assertThat(full().canEqual("x")).isFalse();
        }

        @Test @DisplayName("hashCode → identique pour instances égales")
        void hashCode_equal() {
            assertThat(full().hashCode()).isEqualTo(full().hashCode());
        }

        @Test @DisplayName("toString → contient les champs")
        void toStringContains() {
            assertThat(full().toString()).contains("R1", "true");
        }

        @Test @DisplayName("setters complets")
        void allSetters() {
            GenerateReportResponse r = new GenerateReportResponse();
            r.setSuccess(false); r.setReportId("X"); r.setMessage("Err");
            r.setMetadata(null); r.setUrlDownload(null);
            assertThat(r.getSuccess()).isFalse();
            assertThat(r.getReportId()).isEqualTo("X");
            assertThat(r.getMetadata()).isNull();
        }
    }

    // ══════════════════════════════════════════════════════════════════════
    // ReportListResponse — @Data (45.5% Branch → 100%)
    // ══════════════════════════════════════════════════════════════════════
    @Nested @DisplayName("ReportListResponse")
    class ReportListResponseCoverage {

        private ReportListResponse full() {
            return ReportListResponse.builder()
                .total(3)
                .rapports(List.of(ReportMetadataResponse.builder().reportId("R1").build())).build();
        }

        @Test @DisplayName("equals → même instance (true)")
        void equals_sameInstance() {
            ReportListResponse r = full();
            assertThat(r.equals(r)).isTrue();
        }

        @Test @DisplayName("equals → identiques (true)")
        void equals_identical() {
            assertThat(full()).isEqualTo(full());
        }

        @Test @DisplayName("equals → null (false)")
        void equals_null() {
            assertThat(full().equals(null)).isFalse();
        }

        @Test @DisplayName("equals → classe différente (false)")
        void equals_differentClass() {
            assertThat(full().equals(42)).isFalse();
        }

        @Test @DisplayName("equals → total différent (false)")
        void equals_differentTotal() {
            assertThat(full().equals(ReportListResponse.builder().total(0).rapports(List.of()).build())).isFalse();
        }

        @Test @DisplayName("canEqual → même type (true)")
        void canEqual_sameType() {
            assertThat(full().canEqual(new ReportListResponse())).isTrue();
        }

        @Test @DisplayName("canEqual → type différent (false)")
        void canEqual_differentType() {
            assertThat(full().canEqual("other")).isFalse();
        }

        @Test @DisplayName("hashCode → identique pour instances égales")
        void hashCode_equal() {
            assertThat(full().hashCode()).isEqualTo(full().hashCode());
        }

        @Test @DisplayName("toString → contient les champs")
        void toStringContains() {
            assertThat(full().toString()).contains("3");
        }

        @Test @DisplayName("setters + getters")
        void settersGetters() {
            ReportListResponse r = new ReportListResponse();
            r.setTotal(10); r.setRapports(List.of());
            assertThat(r.getTotal()).isEqualTo(10);
            assertThat(r.getRapports()).isEmpty();
        }
    }

    // ══════════════════════════════════════════════════════════════════════
    // ValidateReclamationFieldResponse — @Data (57.7% Branch → 100%)
    // ══════════════════════════════════════════════════════════════════════
    @Nested @DisplayName("ValidateReclamationFieldResponse")
    class ValidateReclamationFieldResponseCoverage {

        private ValidateReclamationFieldResponse full(boolean valide) {
            return ValidateReclamationFieldResponse.builder()
                .valide(valide).typeErreur("ERR").message("Detail").build();
        }

        @Test @DisplayName("equals → même instance (true)")
        void equals_sameInstance() {
            ValidateReclamationFieldResponse r = full(true);
            assertThat(r.equals(r)).isTrue();
        }

        @Test @DisplayName("equals → identiques true/true")
        void equals_identicalTrue() {
            assertThat(full(true)).isEqualTo(full(true));
        }

        @Test @DisplayName("equals → identiques false/false")
        void equals_identicalFalse() {
            assertThat(full(false)).isEqualTo(full(false));
        }

        @Test @DisplayName("equals → valide différent (false)")
        void equals_differentValide() {
            assertThat(full(true).equals(full(false))).isFalse();
        }

        @Test @DisplayName("equals → null (false)")
        void equals_null() {
            assertThat(full(true).equals(null)).isFalse();
        }

        @Test @DisplayName("equals → classe différente (false)")
        void equals_differentClass() {
            assertThat(full(true).equals("other")).isFalse();
        }

        @Test @DisplayName("equals → typeErreur null vs non-null (false)")
        void equals_nullTypeErreur() {
            ValidateReclamationFieldResponse r1 = ValidateReclamationFieldResponse.builder()
                .valide(true).typeErreur(null).message("M").build();
            ValidateReclamationFieldResponse r2 = full(true);
            assertThat(r1.equals(r2)).isFalse();
            assertThat(r2.equals(r1)).isFalse();
        }

        @Test @DisplayName("canEqual → même type (true)")
        void canEqual_sameType() {
            assertThat(full(true).canEqual(new ValidateReclamationFieldResponse())).isTrue();
        }

        @Test @DisplayName("canEqual → type différent (false)")
        void canEqual_differentType() {
            assertThat(full(true).canEqual("x")).isFalse();
        }

        @Test @DisplayName("hashCode → identique pour instances égales")
        void hashCode_equal() {
            assertThat(full(true).hashCode()).isEqualTo(full(true).hashCode());
        }

        @Test @DisplayName("toString → contient les champs")
        void toStringContains() {
            assertThat(full(true).toString()).contains("ERR", "Detail");
        }

        @Test @DisplayName("setters complets")
        void setters() {
            ValidateReclamationFieldResponse r = new ValidateReclamationFieldResponse();
            r.setValide(true); r.setTypeErreur("T"); r.setMessage("M");
            assertThat(r.isValide()).isTrue();
            assertThat(r.getTypeErreur()).isEqualTo("T");
            assertThat(r.getMessage()).isEqualTo("M");
        }
    }

    // ══════════════════════════════════════════════════════════════════════
    // ValidateReclamationResponse — @Data (45.5% Branch → 100%)
    // ══════════════════════════════════════════════════════════════════════
    @Nested @DisplayName("ValidateReclamationResponse")
    class ValidateReclamationResponseCoverage {

        private ValidateReclamationFieldResponse field(boolean v) {
            return ValidateReclamationFieldResponse.builder()
                .valide(v).typeErreur("E").message("M").build();
        }

        private ValidateReclamationResponse full() {
            return ValidateReclamationResponse.builder()
                .sujet(field(true)).description(field(false)).build();
        }

        @Test @DisplayName("equals → même instance (true)")
        void equals_sameInstance() {
            ValidateReclamationResponse r = full();
            assertThat(r.equals(r)).isTrue();
        }

        @Test @DisplayName("equals → identiques (true)")
        void equals_identical() {
            assertThat(full()).isEqualTo(full());
        }

        @Test @DisplayName("equals → null (false)")
        void equals_null() {
            assertThat(full().equals(null)).isFalse();
        }

        @Test @DisplayName("equals → classe différente (false)")
        void equals_differentClass() {
            assertThat(full().equals("x")).isFalse();
        }

        @Test @DisplayName("equals → sujet null vs non-null (false)")
        void equals_nullSujet() {
            ValidateReclamationResponse r1 = ValidateReclamationResponse.builder()
                .sujet(null).description(field(false)).build();
            assertThat(full().equals(r1)).isFalse();
            assertThat(r1.equals(full())).isFalse();
        }

        @Test @DisplayName("canEqual → même type (true)")
        void canEqual_sameType() {
            assertThat(full().canEqual(new ValidateReclamationResponse())).isTrue();
        }

        @Test @DisplayName("canEqual → type différent (false)")
        void canEqual_differentType() {
            assertThat(full().canEqual("x")).isFalse();
        }

        @Test @DisplayName("hashCode → identique pour instances égales")
        void hashCode_equal() {
            assertThat(full().hashCode()).isEqualTo(full().hashCode());
        }

        @Test @DisplayName("toString → non null")
        void toStringNotNull() {
            assertThat(full().toString()).isNotNull();
        }

        @Test @DisplayName("setters complets")
        void setters() {
            ValidateReclamationResponse r = new ValidateReclamationResponse();
            r.setSujet(field(true)); r.setDescription(field(false));
            assertThat(r.getSujet().isValide()).isTrue();
            assertThat(r.getDescription().isValide()).isFalse();
        }
    }

    // ══════════════════════════════════════════════════════════════════════
    // RapportResponse — @Data (43.3% Branch → 100%)
    // ══════════════════════════════════════════════════════════════════════
    @Nested @DisplayName("RapportResponse")
    class RapportResponseCoverage {

        private RapportResponse.RapportSection section(String t) {
            return RapportResponse.RapportSection.builder().titre(t).contenu("C").build();
        }

        private RapportResponse full() {
            return RapportResponse.builder()
                .titre("Rapport").resumeIA("IA")
                .dateGeneration(LocalDateTime.of(2026, 8, 1, 0, 0))
                .sections(List.of(section("S1"))).build();
        }

        // --- RapportResponse ---
        @Test @DisplayName("equals → même instance (true)")
        void equals_sameInstance() {
            RapportResponse r = full();
            assertThat(r.equals(r)).isTrue();
        }

        @Test @DisplayName("equals → identiques (true)")
        void equals_identical() {
            assertThat(full()).isEqualTo(full());
        }

        @Test @DisplayName("equals → null (false)")
        void equals_null() {
            assertThat(full().equals(null)).isFalse();
        }

        @Test @DisplayName("equals → classe différente (false)")
        void equals_differentClass() {
            assertThat(full().equals("x")).isFalse();
        }

        @Test @DisplayName("equals → titre null vs non-null (false)")
        void equals_nullTitre() {
            RapportResponse r1 = RapportResponse.builder().titre(null).resumeIA("IA").build();
            assertThat(full().equals(r1)).isFalse();
            assertThat(r1.equals(full())).isFalse();
        }

        @Test @DisplayName("canEqual → même type (true)")
        void canEqual_sameType() {
            assertThat(full().canEqual(new RapportResponse())).isTrue();
        }

        @Test @DisplayName("canEqual → type différent (false)")
        void canEqual_differentType() {
            assertThat(full().canEqual("x")).isFalse();
        }

        @Test @DisplayName("hashCode → identique pour instances égales")
        void hashCode_equal() {
            assertThat(full().hashCode()).isEqualTo(full().hashCode());
        }

        @Test @DisplayName("toString → contient le titre")
        void toStringContains() {
            assertThat(full().toString()).contains("Rapport");
        }

        @Test @DisplayName("setters RapportResponse")
        void setters() {
            RapportResponse r = new RapportResponse();
            r.setTitre("T"); r.setResumeIA("IA");
            r.setDateGeneration(LocalDateTime.of(2026, 8, 1, 0, 0));
            r.setSections(List.of());
            assertThat(r.getTitre()).isEqualTo("T");
            assertThat(r.getResumeIA()).isEqualTo("IA");
            assertThat(r.getSections()).isEmpty();
        }

        // --- RapportSection ---
        @Test @DisplayName("RapportSection equals → même instance (true)")
        void section_equals_sameInstance() {
            RapportResponse.RapportSection s = section("S1");
            assertThat(s.equals(s)).isTrue();
        }

        @Test @DisplayName("RapportSection equals → identiques (true)")
        void section_equals_identical() {
            assertThat(section("S1")).isEqualTo(section("S1"));
        }

        @Test @DisplayName("RapportSection equals → null (false)")
        void section_equals_null() {
            assertThat(section("S1").equals(null)).isFalse();
        }

        @Test @DisplayName("RapportSection equals → classe différente (false)")
        void section_equals_differentClass() {
            assertThat(section("S1").equals("x")).isFalse();
        }

        @Test @DisplayName("RapportSection equals → titre null vs non-null (false)")
        void section_equals_nullTitre() {
            RapportResponse.RapportSection s1 = RapportResponse.RapportSection.builder()
                .titre(null).contenu("C").build();
            assertThat(section("S1").equals(s1)).isFalse();
            assertThat(s1.equals(section("S1"))).isFalse();
        }

        @Test @DisplayName("RapportSection canEqual → même type (true)")
        void section_canEqual_sameType() {
            assertThat(section("S1").canEqual(new RapportResponse.RapportSection())).isTrue();
        }

        @Test @DisplayName("RapportSection canEqual → type différent (false)")
        void section_canEqual_differentType() {
            assertThat(section("S1").canEqual("x")).isFalse();
        }

        @Test @DisplayName("RapportSection hashCode + toString")
        void section_hashCode_toString() {
            assertThat(section("S1").hashCode()).isEqualTo(section("S1").hashCode());
            assertThat(section("S1").toString()).contains("S1");
        }

        @Test @DisplayName("RapportSection setters")
        void section_setters() {
            RapportResponse.RapportSection s = new RapportResponse.RapportSection();
            s.setTitre("T"); s.setContenu("C");
            assertThat(s.getTitre()).isEqualTo("T");
            assertThat(s.getContenu()).isEqualTo("C");
        }
    }
}
