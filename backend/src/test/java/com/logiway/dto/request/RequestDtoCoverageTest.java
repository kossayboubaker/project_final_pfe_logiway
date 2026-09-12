package com.logiway.dto.request;

import com.logiway.entities.enums.PrioriteReclamation;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Tests de couverture maximale pour les DTOs request.
 * Placé dans le même package pour accéder à canEqual (protected Lombok @Data).
 * Couvre toutes les branches equals/hashCode/toString/canEqual/setters générées par Lombok.
 */
@DisplayName("dto.request — Coverage 100% (equals/hashCode/toString/canEqual/setters)")
class RequestDtoCoverageTest {

    // ══════════════════════════════════════════════════════════════════════
    // ChatbotMessageRequest — @Data (42.9% Branch → 100%)
    // ══════════════════════════════════════════════════════════════════════
    @Nested @DisplayName("ChatbotMessageRequest")
    class ChatbotMessageRequestCoverage {

        @Test @DisplayName("equals → même instance (true)")
        void equals_sameInstance() {
            ChatbotMessageRequest r = new ChatbotMessageRequest("Q?");
            assertThat(r.equals(r)).isTrue();
        }

        @Test @DisplayName("equals → instances identiques (true)")
        void equals_identical() {
            assertThat(new ChatbotMessageRequest("Q?"))
                .isEqualTo(new ChatbotMessageRequest("Q?"));
        }

        @Test @DisplayName("equals → null (false)")
        void equals_null() {
            assertThat(new ChatbotMessageRequest("Q?").equals(null)).isFalse();
        }

        @Test @DisplayName("equals → classe différente (false)")
        void equals_differentClass() {
            assertThat(new ChatbotMessageRequest("Q?").equals("other")).isFalse();
        }

        @Test @DisplayName("equals → question différente (false)")
        void equals_differentQuestion() {
            assertThat(new ChatbotMessageRequest("Q1?").equals(new ChatbotMessageRequest("Q2?"))).isFalse();
        }

        @Test @DisplayName("equals → question null vs non-null (false)")
        void equals_nullVsNonNull() {
            ChatbotMessageRequest r1 = new ChatbotMessageRequest(null);
            ChatbotMessageRequest r2 = new ChatbotMessageRequest("Q?");
            assertThat(r1.equals(r2)).isFalse();
            assertThat(r2.equals(r1)).isFalse();
        }

        @Test @DisplayName("canEqual → même type (true)")
        void canEqual_sameType() {
            assertThat(new ChatbotMessageRequest("Q?").canEqual(new ChatbotMessageRequest("X"))).isTrue();
        }

        @Test @DisplayName("canEqual → type différent (false)")
        void canEqual_differentType() {
            assertThat(new ChatbotMessageRequest("Q?").canEqual("other")).isFalse();
        }

        @Test @DisplayName("hashCode → identique pour instances égales")
        void hashCode_equal() {
            assertThat(new ChatbotMessageRequest("Q?").hashCode())
                .isEqualTo(new ChatbotMessageRequest("Q?").hashCode());
        }

        @Test @DisplayName("toString → contient le champ")
        void toStringContains() {
            assertThat(new ChatbotMessageRequest("Ma question").toString()).contains("Ma question");
        }

        @Test @DisplayName("setters → modifient le champ")
        void setters() {
            ChatbotMessageRequest r = new ChatbotMessageRequest();
            r.setQuestion("Nouvelle question");
            assertThat(r.getQuestion()).isEqualTo("Nouvelle question");
        }
    }

    // ══════════════════════════════════════════════════════════════════════
    // CreateReclamationRequest — @Data (40% Branch → 100%)
    // ══════════════════════════════════════════════════════════════════════
    @Nested @DisplayName("CreateReclamationRequest")
    class CreateReclamationRequestCoverage {

        private CreateReclamationRequest full() {
            return new CreateReclamationRequest("Sujet", "Desc", PrioriteReclamation.URGENT);
        }

        @Test @DisplayName("equals → même instance (true)")
        void equals_sameInstance() {
            CreateReclamationRequest r = full();
            assertThat(r.equals(r)).isTrue();
        }

        @Test @DisplayName("equals → instances identiques (true)")
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

        @Test @DisplayName("equals → sujet différent (false)")
        void equals_differentSujet() {
            assertThat(full().equals(new CreateReclamationRequest("Autre", "Desc", PrioriteReclamation.URGENT))).isFalse();
        }

        @Test @DisplayName("equals → priorité différente (false)")
        void equals_differentPriorite() {
            assertThat(full().equals(new CreateReclamationRequest("Sujet", "Desc", PrioriteReclamation.NORMAL))).isFalse();
        }

        @Test @DisplayName("equals → sujet null vs non-null (false)")
        void equals_nullSujet() {
            CreateReclamationRequest r1 = new CreateReclamationRequest(null, "Desc", PrioriteReclamation.URGENT);
            assertThat(full().equals(r1)).isFalse();
            assertThat(r1.equals(full())).isFalse();
        }

        @Test @DisplayName("canEqual → même type (true)")
        void canEqual_sameType() {
            assertThat(full().canEqual(new CreateReclamationRequest())).isTrue();
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
            assertThat(full().toString()).contains("Sujet", "URGENT");
        }

        @Test @DisplayName("setters → tous les champs modifiables")
        void setters() {
            CreateReclamationRequest r = new CreateReclamationRequest();
            r.setSujet("S"); r.setDescription("D"); r.setPriorite(PrioriteReclamation.NORMAL);
            assertThat(r.getSujet()).isEqualTo("S");
            assertThat(r.getDescription()).isEqualTo("D");
            assertThat(r.getPriorite()).isEqualTo(PrioriteReclamation.NORMAL);
        }
    }

    // ══════════════════════════════════════════════════════════════════════
    // GenerateReportRequest — @Data + @Builder (45.5% Branch → 100%)
    // ══════════════════════════════════════════════════════════════════════
    @Nested @DisplayName("GenerateReportRequest")
    class GenerateReportRequestCoverage {

        private GenerateReportRequest full() {
            return new GenerateReportRequest("Analyse des trajets", "PDF");
        }

        @Test @DisplayName("equals → même instance (true)")
        void equals_sameInstance() {
            GenerateReportRequest r = full();
            assertThat(r.equals(r)).isTrue();
        }

        @Test @DisplayName("equals → instances identiques (true)")
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

        @Test @DisplayName("equals → requete différente (false)")
        void equals_differentRequete() {
            assertThat(full().equals(new GenerateReportRequest("Autre", "PDF"))).isFalse();
        }

        @Test @DisplayName("equals → format différent (false)")
        void equals_differentFormat() {
            assertThat(full().equals(new GenerateReportRequest("Analyse des trajets", "CSV"))).isFalse();
        }

        @Test @DisplayName("equals → requete null vs non-null (false)")
        void equals_nullRequete() {
            GenerateReportRequest r1 = new GenerateReportRequest(null, "PDF");
            assertThat(full().equals(r1)).isFalse();
            assertThat(r1.equals(full())).isFalse();
        }

        @Test @DisplayName("canEqual → même type (true)")
        void canEqual_sameType() {
            assertThat(full().canEqual(new GenerateReportRequest())).isTrue();
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
            assertThat(full().toString()).contains("Analyse des trajets", "PDF");
        }

        @Test @DisplayName("setters → modifient les champs")
        void setters() {
            GenerateReportRequest r = new GenerateReportRequest();
            r.setRequeteNaturelle("R"); r.setFormatPrefere("CSV");
            assertThat(r.getRequeteNaturelle()).isEqualTo("R");
            assertThat(r.getFormatPrefere()).isEqualTo("CSV");
        }

        @Test @DisplayName("builder → crée une instance correcte")
        void builder() {
            GenerateReportRequest r = GenerateReportRequest.builder()
                .requeteNaturelle("Rapport mensuel").formatPrefere("TXT").build();
            assertThat(r.getRequeteNaturelle()).isEqualTo("Rapport mensuel");
            assertThat(r.getFormatPrefere()).isEqualTo("TXT");
        }
    }

    // ══════════════════════════════════════════════════════════════════════
    // ReclamationDecisionRequest — @Data (42.9% Branch → 100%)
    // ══════════════════════════════════════════════════════════════════════
    @Nested @DisplayName("ReclamationDecisionRequest")
    class ReclamationDecisionRequestCoverage {

        @Test @DisplayName("equals → même instance (true)")
        void equals_sameInstance() {
            ReclamationDecisionRequest r = new ReclamationDecisionRequest("OK");
            assertThat(r.equals(r)).isTrue();
        }

        @Test @DisplayName("equals → instances identiques (true)")
        void equals_identical() {
            assertThat(new ReclamationDecisionRequest("OK"))
                .isEqualTo(new ReclamationDecisionRequest("OK"));
        }

        @Test @DisplayName("equals → null (false)")
        void equals_null() {
            assertThat(new ReclamationDecisionRequest("OK").equals(null)).isFalse();
        }

        @Test @DisplayName("equals → classe différente (false)")
        void equals_differentClass() {
            assertThat(new ReclamationDecisionRequest("OK").equals("x")).isFalse();
        }

        @Test @DisplayName("equals → commentaire différent (false)")
        void equals_differentCommentaire() {
            assertThat(new ReclamationDecisionRequest("OK")
                .equals(new ReclamationDecisionRequest("KO"))).isFalse();
        }

        @Test @DisplayName("equals → commentaire null vs non-null (false)")
        void equals_nullVsNonNull() {
            ReclamationDecisionRequest r1 = new ReclamationDecisionRequest(null);
            ReclamationDecisionRequest r2 = new ReclamationDecisionRequest("OK");
            assertThat(r1.equals(r2)).isFalse();
            assertThat(r2.equals(r1)).isFalse();
        }

        @Test @DisplayName("canEqual → même type (true)")
        void canEqual_sameType() {
            assertThat(new ReclamationDecisionRequest("OK")
                .canEqual(new ReclamationDecisionRequest("X"))).isTrue();
        }

        @Test @DisplayName("canEqual → type différent (false)")
        void canEqual_differentType() {
            assertThat(new ReclamationDecisionRequest("OK").canEqual("x")).isFalse();
        }

        @Test @DisplayName("hashCode → identique pour instances égales")
        void hashCode_equal() {
            assertThat(new ReclamationDecisionRequest("OK").hashCode())
                .isEqualTo(new ReclamationDecisionRequest("OK").hashCode());
        }

        @Test @DisplayName("toString → contient le commentaire")
        void toStringContains() {
            assertThat(new ReclamationDecisionRequest("Résolu avec succès").toString())
                .contains("Résolu avec succès");
        }

        @Test @DisplayName("setters → modifient le commentaire")
        void setters() {
            ReclamationDecisionRequest r = new ReclamationDecisionRequest();
            r.setCommentaire("Nouveau commentaire");
            assertThat(r.getCommentaire()).isEqualTo("Nouveau commentaire");
        }
    }

    // ══════════════════════════════════════════════════════════════════════
    // UpdateReclamationRequest — @Data (40% Branch → 100%)
    // ══════════════════════════════════════════════════════════════════════
    @Nested @DisplayName("UpdateReclamationRequest")
    class UpdateReclamationRequestCoverage {

        private UpdateReclamationRequest full() {
            return new UpdateReclamationRequest("Sujet MAJ", "Desc MAJ", PrioriteReclamation.NORMAL);
        }

        @Test @DisplayName("equals → même instance (true)")
        void equals_sameInstance() {
            UpdateReclamationRequest r = full();
            assertThat(r.equals(r)).isTrue();
        }

        @Test @DisplayName("equals → instances identiques (true)")
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

        @Test @DisplayName("equals → sujet différent (false)")
        void equals_differentSujet() {
            assertThat(full().equals(new UpdateReclamationRequest("Autre", "Desc MAJ", PrioriteReclamation.NORMAL))).isFalse();
        }

        @Test @DisplayName("equals → priorité différente (false)")
        void equals_differentPriorite() {
            assertThat(full().equals(new UpdateReclamationRequest("Sujet MAJ", "Desc MAJ", PrioriteReclamation.URGENT))).isFalse();
        }

        @Test @DisplayName("equals → sujet null vs non-null (false)")
        void equals_nullSujet() {
            UpdateReclamationRequest r1 = new UpdateReclamationRequest(null, "D", PrioriteReclamation.NORMAL);
            assertThat(full().equals(r1)).isFalse();
            assertThat(r1.equals(full())).isFalse();
        }

        @Test @DisplayName("canEqual → même type (true)")
        void canEqual_sameType() {
            assertThat(full().canEqual(new UpdateReclamationRequest())).isTrue();
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
            assertThat(full().toString()).contains("Sujet MAJ", "NORMAL");
        }

        @Test @DisplayName("setters → tous les champs modifiables")
        void setters() {
            UpdateReclamationRequest r = new UpdateReclamationRequest();
            r.setSujet("S"); r.setDescription("D"); r.setPriorite(PrioriteReclamation.URGENT);
            assertThat(r.getSujet()).isEqualTo("S");
            assertThat(r.getDescription()).isEqualTo("D");
            assertThat(r.getPriorite()).isEqualTo(PrioriteReclamation.URGENT);
        }
    }

    // ══════════════════════════════════════════════════════════════════════
    // ValidateReclamationRequest — @Data (40.9% Branch → 100%)
    // ══════════════════════════════════════════════════════════════════════
    @Nested @DisplayName("ValidateReclamationRequest")
    class ValidateReclamationRequestCoverage {

        private ValidateReclamationRequest full() {
            return new ValidateReclamationRequest("Sujet valide", "Description valide");
        }

        @Test @DisplayName("equals → même instance (true)")
        void equals_sameInstance() {
            ValidateReclamationRequest r = full();
            assertThat(r.equals(r)).isTrue();
        }

        @Test @DisplayName("equals → instances identiques (true)")
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

        @Test @DisplayName("equals → sujet différent (false)")
        void equals_differentSujet() {
            assertThat(full().equals(new ValidateReclamationRequest("Autre", "Description valide"))).isFalse();
        }

        @Test @DisplayName("equals → description différente (false)")
        void equals_differentDescription() {
            assertThat(full().equals(new ValidateReclamationRequest("Sujet valide", "Autre"))).isFalse();
        }

        @Test @DisplayName("equals → sujet null vs non-null (false)")
        void equals_nullSujet() {
            ValidateReclamationRequest r1 = new ValidateReclamationRequest(null, "D");
            assertThat(full().equals(r1)).isFalse();
            assertThat(r1.equals(full())).isFalse();
        }

        @Test @DisplayName("equals → les deux null sujets (true)")
        void equals_bothNullSujet() {
            ValidateReclamationRequest r1 = new ValidateReclamationRequest(null, "D");
            ValidateReclamationRequest r2 = new ValidateReclamationRequest(null, "D");
            assertThat(r1).isEqualTo(r2);
        }

        @Test @DisplayName("canEqual → même type (true)")
        void canEqual_sameType() {
            assertThat(full().canEqual(new ValidateReclamationRequest())).isTrue();
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
            assertThat(full().toString()).contains("Sujet valide");
        }

        @Test @DisplayName("setters → modifient les champs")
        void setters() {
            ValidateReclamationRequest r = new ValidateReclamationRequest();
            r.setSujet("S"); r.setDescription("D");
            assertThat(r.getSujet()).isEqualTo("S");
            assertThat(r.getDescription()).isEqualTo("D");
        }
    }
}
