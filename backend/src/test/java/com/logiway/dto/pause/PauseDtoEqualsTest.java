package com.logiway.dto.pause;

import com.logiway.entities.enums.StatutPause;
import com.logiway.entities.enums.TypeAlerteIA;
import com.logiway.entities.enums.TypePause;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Tests ciblés sur les branches equals/hashCode Lombok (@Data).
 * Stratégie : couvrir les 2 branches de chaque null-check :
 *   - branche TRUE  (this.field == null → comparaison avec null)
 *   - branche FALSE (this.field != null → appel à .equals())
 */
@DisplayName("com.logiway.dto.pause — Branches equals Lombok (100% branch)")
class PauseDtoEqualsTest {

    // ══════════════════════════════════════════════════════════════════
    // PauseAIEvaluationRequest — 3 champs Double
    // ══════════════════════════════════════════════════════════════════
    @Nested @DisplayName("PauseAIEvaluationRequest")
    class EvalRequestTest {

        @Test @DisplayName("deux objets vides (tous null) → égaux [branche null==null TRUE]")
        void allNull_equal() {
            PauseAIEvaluationRequest a = new PauseAIEvaluationRequest();
            PauseAIEvaluationRequest b = new PauseAIEvaluationRequest();
            assertThat(a).isEqualTo(b);
            assertThat(a.hashCode()).isEqualTo(b.hashCode());
        }

        @Test @DisplayName("même référence → égal [réflexivité]")
        void sameRef() {
            PauseAIEvaluationRequest a = new PauseAIEvaluationRequest(48.85, 2.35, 120.0);
            assertThat(a).isEqualTo(a);
        }

        @Test @DisplayName("valeurs identiques non-null → égaux [branche .equals() FALSE=égal]")
        void nonNull_equal() {
            PauseAIEvaluationRequest a = new PauseAIEvaluationRequest(48.85, 2.35, 120.0);
            PauseAIEvaluationRequest b = new PauseAIEvaluationRequest(48.85, 2.35, 120.0);
            assertThat(a).isEqualTo(b);
            assertThat(a.hashCode()).isEqualTo(b.hashCode());
        }

        @Test @DisplayName("currentLatitude différent → pas égaux [branche .equals() TRUE=différent]")
        void differentLatitude() {
            PauseAIEvaluationRequest a = new PauseAIEvaluationRequest(48.85, 2.35, 120.0);
            PauseAIEvaluationRequest b = new PauseAIEvaluationRequest(43.0, 2.35, 120.0);
            assertThat(a).isNotEqualTo(b);
        }

        @Test @DisplayName("currentLongitude différent → pas égaux")
        void differentLongitude() {
            PauseAIEvaluationRequest a = new PauseAIEvaluationRequest(48.85, 2.35, 120.0);
            PauseAIEvaluationRequest b = new PauseAIEvaluationRequest(48.85, 5.0, 120.0);
            assertThat(a).isNotEqualTo(b);
        }

        @Test @DisplayName("distanceParcourueKm différent → pas égaux")
        void differentDistance() {
            PauseAIEvaluationRequest a = new PauseAIEvaluationRequest(48.85, 2.35, 120.0);
            PauseAIEvaluationRequest b = new PauseAIEvaluationRequest(48.85, 2.35, 999.0);
            assertThat(a).isNotEqualTo(b);
        }

        @Test @DisplayName("a.latitude=null, b.latitude=non-null → pas égaux [branche null!=non-null]")
        void nullVsNonNull_latitude() {
            PauseAIEvaluationRequest a = new PauseAIEvaluationRequest(null, 2.35, 120.0);
            PauseAIEvaluationRequest b = new PauseAIEvaluationRequest(48.85, 2.35, 120.0);
            assertThat(a).isNotEqualTo(b);
        }

        @Test @DisplayName("a.longitude=null, b.longitude=non-null → pas égaux")
        void nullVsNonNull_longitude() {
            PauseAIEvaluationRequest a = new PauseAIEvaluationRequest(48.85, null, 120.0);
            PauseAIEvaluationRequest b = new PauseAIEvaluationRequest(48.85, 2.35, 120.0);
            assertThat(a).isNotEqualTo(b);
        }

        @Test @DisplayName("a.distance=null, b.distance=non-null → pas égaux")
        void nullVsNonNull_distance() {
            PauseAIEvaluationRequest a = new PauseAIEvaluationRequest(48.85, 2.35, null);
            PauseAIEvaluationRequest b = new PauseAIEvaluationRequest(48.85, 2.35, 120.0);
            assertThat(a).isNotEqualTo(b);
        }

        @Test @DisplayName("not equal to Object")
        void notEqualToObject() {
            assertThat(new PauseAIEvaluationRequest()).isNotEqualTo(new Object());
        }

        @Test @DisplayName("toString non null")
        void toStringTest() {
            assertThat(new PauseAIEvaluationRequest(1.0, 2.0, 3.0).toString()).contains("1.0");
        }

        @Test @DisplayName("setters Lombok")
        void setters() {
            PauseAIEvaluationRequest r = new PauseAIEvaluationRequest();
            r.setCurrentLatitude(10.0);
            r.setCurrentLongitude(20.0);
            r.setDistanceParcourueKm(30.0);
            assertThat(r.getCurrentLatitude()).isEqualTo(10.0);
            assertThat(r.getCurrentLongitude()).isEqualTo(20.0);
            assertThat(r.getDistanceParcourueKm()).isEqualTo(30.0);
        }
    }

    // ══════════════════════════════════════════════════════════════════
    // PauseAIPredictionResponse — 13 champs
    // ══════════════════════════════════════════════════════════════════
    @Nested @DisplayName("PauseAIPredictionResponse")
    class PredictionResponseTest {

        private PauseAIPredictionResponse full() {
            return PauseAIPredictionResponse.builder()
                .id(1L).trajetId(10L).timestamp(LocalDateTime.of(2026,8,1,10,0))
                .hoursDriving(3.5).distAlongRatio(0.5).score(75)
                .poiType("CAFE").alerteDeclenchee(true).typeAlerte(TypeAlerteIA.RECOMMANDEE)
                .latitudePoi(48.85).longitudePoi(2.35).nomPoi("Café A").distancePoiM(50.0)
                .build();
        }

        @Test @DisplayName("deux objets vides → égaux [branches null==null]")
        void allNull_equal() {
            assertThat(new PauseAIPredictionResponse()).isEqualTo(new PauseAIPredictionResponse());
        }

        @Test @DisplayName("même référence → égal")
        void sameRef() {
            PauseAIPredictionResponse a = full();
            assertThat(a).isEqualTo(a);
        }

        @Test @DisplayName("objets identiques non-null → égaux [branches .equals() FALSE]")
        void nonNull_equal() {
            assertThat(full()).isEqualTo(full());
            assertThat(full().hashCode()).isEqualTo(full().hashCode());
        }

        @Test @DisplayName("id différent → pas égaux")
        void different_id() {
            PauseAIPredictionResponse a = full();
            PauseAIPredictionResponse b = full(); b.setId(99L);
            assertThat(a).isNotEqualTo(b);
        }

        @Test @DisplayName("trajetId différent → pas égaux")
        void different_trajetId() {
            PauseAIPredictionResponse a = full();
            PauseAIPredictionResponse b = full(); b.setTrajetId(99L);
            assertThat(a).isNotEqualTo(b);
        }

        @Test @DisplayName("timestamp différent → pas égaux")
        void different_timestamp() {
            PauseAIPredictionResponse a = full();
            PauseAIPredictionResponse b = full(); b.setTimestamp(LocalDateTime.of(2025,1,1,0,0));
            assertThat(a).isNotEqualTo(b);
        }

        @Test @DisplayName("hoursDriving différent → pas égaux")
        void different_hoursDriving() {
            PauseAIPredictionResponse a = full();
            PauseAIPredictionResponse b = full(); b.setHoursDriving(9.9);
            assertThat(a).isNotEqualTo(b);
        }

        @Test @DisplayName("distAlongRatio différent → pas égaux")
        void different_distAlongRatio() {
            PauseAIPredictionResponse a = full();
            PauseAIPredictionResponse b = full(); b.setDistAlongRatio(0.99);
            assertThat(a).isNotEqualTo(b);
        }

        @Test @DisplayName("score différent → pas égaux")
        void different_score() {
            PauseAIPredictionResponse a = full();
            PauseAIPredictionResponse b = full(); b.setScore(1);
            assertThat(a).isNotEqualTo(b);
        }

        @Test @DisplayName("poiType différent → pas égaux")
        void different_poiType() {
            PauseAIPredictionResponse a = full();
            PauseAIPredictionResponse b = full(); b.setPoiType("PARKING");
            assertThat(a).isNotEqualTo(b);
        }

        @Test @DisplayName("alerteDeclenchee différent → pas égaux")
        void different_alerte() {
            PauseAIPredictionResponse a = full();
            PauseAIPredictionResponse b = full(); b.setAlerteDeclenchee(false);
            assertThat(a).isNotEqualTo(b);
        }

        @Test @DisplayName("typeAlerte différent → pas égaux")
        void different_typeAlerte() {
            PauseAIPredictionResponse a = full();
            PauseAIPredictionResponse b = full(); b.setTypeAlerte(TypeAlerteIA.URGENTE);
            assertThat(a).isNotEqualTo(b);
        }

        @Test @DisplayName("latitudePoi différent → pas égaux")
        void different_lat() {
            PauseAIPredictionResponse a = full();
            PauseAIPredictionResponse b = full(); b.setLatitudePoi(1.0);
            assertThat(a).isNotEqualTo(b);
        }

        @Test @DisplayName("longitudePoi différent → pas égaux")
        void different_lon() {
            PauseAIPredictionResponse a = full();
            PauseAIPredictionResponse b = full(); b.setLongitudePoi(1.0);
            assertThat(a).isNotEqualTo(b);
        }

        @Test @DisplayName("nomPoi différent → pas égaux")
        void different_nomPoi() {
            PauseAIPredictionResponse a = full();
            PauseAIPredictionResponse b = full(); b.setNomPoi("Autre");
            assertThat(a).isNotEqualTo(b);
        }

        @Test @DisplayName("distancePoiM différent → pas égaux")
        void different_distPoi() {
            PauseAIPredictionResponse a = full();
            PauseAIPredictionResponse b = full(); b.setDistancePoiM(999.0);
            assertThat(a).isNotEqualTo(b);
        }

        // Branches null vs non-null pour chaque champ
        @Test @DisplayName("id null vs non-null → pas égaux [branche null!=non-null]")
        void nullVsNonNull_id() {
            PauseAIPredictionResponse a = full(); a.setId(null);
            assertThat(a).isNotEqualTo(full());
        }

        @Test @DisplayName("timestamp null vs non-null → pas égaux")
        void nullVsNonNull_timestamp() {
            PauseAIPredictionResponse a = full(); a.setTimestamp(null);
            assertThat(a).isNotEqualTo(full());
        }

        @Test @DisplayName("poiType null vs non-null → pas égaux")
        void nullVsNonNull_poiType() {
            PauseAIPredictionResponse a = full(); a.setPoiType(null);
            assertThat(a).isNotEqualTo(full());
        }

        @Test @DisplayName("typeAlerte null vs non-null → pas égaux")
        void nullVsNonNull_typeAlerte() {
            PauseAIPredictionResponse a = full(); a.setTypeAlerte(null);
            assertThat(a).isNotEqualTo(full());
        }

        @Test @DisplayName("nomPoi null vs non-null → pas égaux")
        void nullVsNonNull_nomPoi() {
            PauseAIPredictionResponse a = full(); a.setNomPoi(null);
            assertThat(a).isNotEqualTo(full());
        }

        @Test @DisplayName("not equal to Object")
        void notEqualToObject() {
            assertThat(full()).isNotEqualTo(new Object());
        }
    }

    // ══════════════════════════════════════════════════════════════════
    // PauseReglementaireResponse — 17 champs
    // ══════════════════════════════════════════════════════════════════
    @Nested @DisplayName("PauseReglementaireResponse")
    class PauseReglResponseTest {

        private PauseReglementaireResponse full() {
            return PauseReglementaireResponse.builder()
                .id(1L).trajetId(5L).type(TypePause.REST_AREA)
                .longitude(2.35).latitude(48.85).distanceAlongRouteM(1000.0)
                .heureArriveePlanifiee(LocalDateTime.of(2026,8,1,12,0))
                .durationSeconds(1800)
                .heureRepriseEstimee(LocalDateTime.of(2026,8,1,12,30))
                .statut(StatutPause.PLANIFIEE).nomLieu("Aire A")
                .aiScore(80).fatigueScore(70).accessibilityScore(85)
                .contextScore(75).reasoning("Bonne position").confidence(0.9)
                .build();
        }

        @Test @DisplayName("deux objets vides → égaux [branches null==null]")
        void allNull_equal() {
            assertThat(new PauseReglementaireResponse()).isEqualTo(new PauseReglementaireResponse());
        }

        @Test @DisplayName("même référence → égal")
        void sameRef() {
            PauseReglementaireResponse a = full();
            assertThat(a).isEqualTo(a);
        }

        @Test @DisplayName("objets identiques non-null → égaux")
        void nonNull_equal() {
            assertThat(full()).isEqualTo(full());
            assertThat(full().hashCode()).isEqualTo(full().hashCode());
        }

        @Test @DisplayName("id différent → pas égaux")
        void diff_id() { PauseReglementaireResponse b = full(); b.setId(99L); assertThat(full()).isNotEqualTo(b); }

        @Test @DisplayName("trajetId différent → pas égaux")
        void diff_trajetId() { PauseReglementaireResponse b = full(); b.setTrajetId(99L); assertThat(full()).isNotEqualTo(b); }

        @Test @DisplayName("type différent → pas égaux")
        void diff_type() { PauseReglementaireResponse b = full(); b.setType(TypePause.CAFE); assertThat(full()).isNotEqualTo(b); }

        @Test @DisplayName("longitude différent → pas égaux")
        void diff_longitude() { PauseReglementaireResponse b = full(); b.setLongitude(9.0); assertThat(full()).isNotEqualTo(b); }

        @Test @DisplayName("latitude différent → pas égaux")
        void diff_latitude() { PauseReglementaireResponse b = full(); b.setLatitude(9.0); assertThat(full()).isNotEqualTo(b); }

        @Test @DisplayName("distanceAlongRouteM différent → pas égaux")
        void diff_distance() { PauseReglementaireResponse b = full(); b.setDistanceAlongRouteM(99.0); assertThat(full()).isNotEqualTo(b); }

        @Test @DisplayName("heureArriveePlanifiee différent → pas égaux")
        void diff_heureArrivee() { PauseReglementaireResponse b = full(); b.setHeureArriveePlanifiee(LocalDateTime.of(2025,1,1,0,0)); assertThat(full()).isNotEqualTo(b); }

        @Test @DisplayName("durationSeconds différent → pas égaux")
        void diff_duration() { PauseReglementaireResponse b = full(); b.setDurationSeconds(1); assertThat(full()).isNotEqualTo(b); }

        @Test @DisplayName("heureRepriseEstimee différent → pas égaux")
        void diff_heureReprise() { PauseReglementaireResponse b = full(); b.setHeureRepriseEstimee(LocalDateTime.of(2025,1,1,0,0)); assertThat(full()).isNotEqualTo(b); }

        @Test @DisplayName("statut différent → pas égaux")
        void diff_statut() { PauseReglementaireResponse b = full(); b.setStatut(StatutPause.ATTEINTE); assertThat(full()).isNotEqualTo(b); }

        @Test @DisplayName("nomLieu différent → pas égaux")
        void diff_nomLieu() { PauseReglementaireResponse b = full(); b.setNomLieu("Autre"); assertThat(full()).isNotEqualTo(b); }

        @Test @DisplayName("aiScore différent → pas égaux")
        void diff_aiScore() { PauseReglementaireResponse b = full(); b.setAiScore(1); assertThat(full()).isNotEqualTo(b); }

        @Test @DisplayName("fatigueScore différent → pas égaux")
        void diff_fatigueScore() { PauseReglementaireResponse b = full(); b.setFatigueScore(1); assertThat(full()).isNotEqualTo(b); }

        @Test @DisplayName("accessibilityScore différent → pas égaux")
        void diff_accessibility() { PauseReglementaireResponse b = full(); b.setAccessibilityScore(1); assertThat(full()).isNotEqualTo(b); }

        @Test @DisplayName("contextScore différent → pas égaux")
        void diff_context() { PauseReglementaireResponse b = full(); b.setContextScore(1); assertThat(full()).isNotEqualTo(b); }

        @Test @DisplayName("reasoning différent → pas égaux")
        void diff_reasoning() { PauseReglementaireResponse b = full(); b.setReasoning("Autre"); assertThat(full()).isNotEqualTo(b); }

        @Test @DisplayName("confidence différent → pas égaux")
        void diff_confidence() { PauseReglementaireResponse b = full(); b.setConfidence(0.1); assertThat(full()).isNotEqualTo(b); }

        // Branches null vs non-null pour couvrir "this.field == null && other.field != null"
        @Test @DisplayName("id null vs non-null → pas égaux")
        void null_id() { PauseReglementaireResponse a = full(); a.setId(null); assertThat(a).isNotEqualTo(full()); }

        @Test @DisplayName("type null vs non-null → pas égaux")
        void null_type() { PauseReglementaireResponse a = full(); a.setType(null); assertThat(a).isNotEqualTo(full()); }

        @Test @DisplayName("heureArriveePlanifiee null vs non-null → pas égaux")
        void null_heureArrivee() { PauseReglementaireResponse a = full(); a.setHeureArriveePlanifiee(null); assertThat(a).isNotEqualTo(full()); }

        @Test @DisplayName("heureRepriseEstimee null vs non-null → pas égaux")
        void null_heureReprise() { PauseReglementaireResponse a = full(); a.setHeureRepriseEstimee(null); assertThat(a).isNotEqualTo(full()); }

        @Test @DisplayName("statut null vs non-null → pas égaux")
        void null_statut() { PauseReglementaireResponse a = full(); a.setStatut(null); assertThat(a).isNotEqualTo(full()); }

        @Test @DisplayName("nomLieu null vs non-null → pas égaux")
        void null_nomLieu() { PauseReglementaireResponse a = full(); a.setNomLieu(null); assertThat(a).isNotEqualTo(full()); }

        @Test @DisplayName("reasoning null vs non-null → pas égaux")
        void null_reasoning() { PauseReglementaireResponse a = full(); a.setReasoning(null); assertThat(a).isNotEqualTo(full()); }

        @Test @DisplayName("not equal to Object")
        void notEqualToObject() { assertThat(full()).isNotEqualTo(new Object()); }
    }

    // ══════════════════════════════════════════════════════════════════
    // PauseAIDashboardResponse — 8 champs + 3 nested classes
    // ══════════════════════════════════════════════════════════════════
    @Nested @DisplayName("PauseAIDashboardResponse + nested")
    class DashboardResponseTest {

        private PauseAIDashboardResponse.MLInsights fullInsights() {
            return PauseAIDashboardResponse.MLInsights.builder()
                .chauffeursCritiquesFatigue(2).chauffeursModereesFatigue(5)
                .scoreFatigueMax(92.0).chauffeurPlusRisque("Jean Dupont")
                .tendanceConformite(0.05).tendanceScoreFatigue(-0.02)
                .pausesHeuresRepas(10).pausesNuit(3).tauxPausesMiParcours(0.45)
                .tauxAcceptationAI(0.85).pausesVolontaires(7).scoreMoyenPausesEffectuees(78.0)
                .build();
        }

        private PauseAIDashboardResponse.ChauffeurStats fullStats() {
            return PauseAIDashboardResponse.ChauffeurStats.builder()
                .chauffeurId(1L).nomChauffeur("Jean Dupont").nombreMissions(10)
                .scoreFatigueMoyen(75.0).alertesUrgentes(1).pausesIgnorees(2).tauxConformite(0.9)
                .niveauRisque("HIGH").distanceMoyenneParJour(250.0).heuresMoyennesConduite(8.5)
                .pausesRecommandees(5).pausesEffectuees(4).scoreMoyenAccessibilite(80.0)
                .sentiment("SATISFIED").arriveeEstimee(LocalDateTime.of(2026,8,1,18,0))
                .distanceReelle(465.0).pointDepart("Paris").pointArrivee("Lyon")
                .statutTrajet("EN_COURS").immatriculationVehicule("AB-001")
                .build();
        }

        private PauseAIDashboardResponse.HeatmapPoint fullPoint() {
            return PauseAIDashboardResponse.HeatmapPoint.builder()
                .latitude(48.85).longitude(2.35).type("URGENTE_IGNOREE").score(90)
                .nomLieu("Aire A").fatigueScore(85).accessibilityScore(80)
                .timestamp(LocalDateTime.of(2026,8,1,10,0)).chauffeurNom("Jean Dupont")
                .build();
        }

        // ── MLInsights ──
        @Test @DisplayName("MLInsights — vides égaux")
        void insights_allNull_equal() {
            assertThat(new PauseAIDashboardResponse.MLInsights())
                .isEqualTo(new PauseAIDashboardResponse.MLInsights());
        }

        @Test @DisplayName("MLInsights — identiques égaux")
        void insights_equal() {
            assertThat(fullInsights()).isEqualTo(fullInsights());
            assertThat(fullInsights().hashCode()).isEqualTo(fullInsights().hashCode());
        }

        @Test @DisplayName("MLInsights — scoreFatigueMax différent → pas égaux")
        void insights_diff_score() {
            PauseAIDashboardResponse.MLInsights b = fullInsights(); b.setScoreFatigueMax(1.0);
            assertThat(fullInsights()).isNotEqualTo(b);
        }

        @Test @DisplayName("MLInsights — chauffeurPlusRisque différent → pas égaux")
        void insights_diff_chauffeur() {
            PauseAIDashboardResponse.MLInsights b = fullInsights(); b.setChauffeurPlusRisque("Autre");
            assertThat(fullInsights()).isNotEqualTo(b);
        }

        @Test @DisplayName("MLInsights — tendanceConformite différent → pas égaux")
        void insights_diff_tendance() {
            PauseAIDashboardResponse.MLInsights b = fullInsights(); b.setTendanceConformite(9.9);
            assertThat(fullInsights()).isNotEqualTo(b);
        }

        @Test @DisplayName("MLInsights — tendanceScoreFatigue différent → pas égaux")
        void insights_diff_tendanceFatigue() {
            PauseAIDashboardResponse.MLInsights b = fullInsights(); b.setTendanceScoreFatigue(9.9);
            assertThat(fullInsights()).isNotEqualTo(b);
        }

        @Test @DisplayName("MLInsights — tauxPausesMiParcours différent → pas égaux")
        void insights_diff_tauxPauses() {
            PauseAIDashboardResponse.MLInsights b = fullInsights(); b.setTauxPausesMiParcours(9.9);
            assertThat(fullInsights()).isNotEqualTo(b);
        }

        @Test @DisplayName("MLInsights — tauxAcceptationAI différent → pas égaux")
        void insights_diff_tauxAcceptation() {
            PauseAIDashboardResponse.MLInsights b = fullInsights(); b.setTauxAcceptationAI(9.9);
            assertThat(fullInsights()).isNotEqualTo(b);
        }

        @Test @DisplayName("MLInsights — scoreMoyenPausesEffectuees différent → pas égaux")
        void insights_diff_scoreMoyen() {
            PauseAIDashboardResponse.MLInsights b = fullInsights(); b.setScoreMoyenPausesEffectuees(9.9);
            assertThat(fullInsights()).isNotEqualTo(b);
        }

        @Test @DisplayName("MLInsights — null scoreFatigueMax vs non-null → pas égaux")
        void insights_null_score() {
            PauseAIDashboardResponse.MLInsights a = fullInsights(); a.setScoreFatigueMax(null);
            assertThat(a).isNotEqualTo(fullInsights());
        }

        @Test @DisplayName("MLInsights — null chauffeurPlusRisque vs non-null → pas égaux")
        void insights_null_chauffeur() {
            PauseAIDashboardResponse.MLInsights a = fullInsights(); a.setChauffeurPlusRisque(null);
            assertThat(a).isNotEqualTo(fullInsights());
        }

        @Test @DisplayName("MLInsights — null tendanceConformite vs non-null → pas égaux")
        void insights_null_tendance() {
            PauseAIDashboardResponse.MLInsights a = fullInsights(); a.setTendanceConformite(null);
            assertThat(a).isNotEqualTo(fullInsights());
        }

        @Test @DisplayName("MLInsights — null tendanceScoreFatigue vs non-null → pas égaux")
        void insights_null_tendanceFatigue() {
            PauseAIDashboardResponse.MLInsights a = fullInsights(); a.setTendanceScoreFatigue(null);
            assertThat(a).isNotEqualTo(fullInsights());
        }

        @Test @DisplayName("MLInsights — null tauxPausesMiParcours vs non-null → pas égaux")
        void insights_null_tauxPauses() {
            PauseAIDashboardResponse.MLInsights a = fullInsights(); a.setTauxPausesMiParcours(null);
            assertThat(a).isNotEqualTo(fullInsights());
        }

        @Test @DisplayName("MLInsights — null tauxAcceptationAI vs non-null → pas égaux")
        void insights_null_tauxAI() {
            PauseAIDashboardResponse.MLInsights a = fullInsights(); a.setTauxAcceptationAI(null);
            assertThat(a).isNotEqualTo(fullInsights());
        }

        @Test @DisplayName("MLInsights — null scoreMoyenPauses vs non-null → pas égaux")
        void insights_null_scoreMoyen() {
            PauseAIDashboardResponse.MLInsights a = fullInsights(); a.setScoreMoyenPausesEffectuees(null);
            assertThat(a).isNotEqualTo(fullInsights());
        }

        @Test @DisplayName("MLInsights — not equal to Object")
        void insights_notObject() { assertThat(fullInsights()).isNotEqualTo(new Object()); }

        // ── ChauffeurStats ──
        @Test @DisplayName("ChauffeurStats — vides égaux")
        void stats_allNull_equal() {
            assertThat(new PauseAIDashboardResponse.ChauffeurStats())
                .isEqualTo(new PauseAIDashboardResponse.ChauffeurStats());
        }

        @Test @DisplayName("ChauffeurStats — identiques égaux")
        void stats_equal() {
            assertThat(fullStats()).isEqualTo(fullStats());
            assertThat(fullStats().hashCode()).isEqualTo(fullStats().hashCode());
        }

        @Test @DisplayName("ChauffeurStats — nomChauffeur différent → pas égaux")
        void stats_diff_nom() { PauseAIDashboardResponse.ChauffeurStats b = fullStats(); b.setNomChauffeur("X"); assertThat(fullStats()).isNotEqualTo(b); }

        @Test @DisplayName("ChauffeurStats — scoreFatigueMoyen différent → pas égaux")
        void stats_diff_score() { PauseAIDashboardResponse.ChauffeurStats b = fullStats(); b.setScoreFatigueMoyen(1.0); assertThat(fullStats()).isNotEqualTo(b); }

        @Test @DisplayName("ChauffeurStats — niveauRisque différent → pas égaux")
        void stats_diff_risque() { PauseAIDashboardResponse.ChauffeurStats b = fullStats(); b.setNiveauRisque("LOW"); assertThat(fullStats()).isNotEqualTo(b); }

        @Test @DisplayName("ChauffeurStats — distanceMoyenneParJour différent → pas égaux")
        void stats_diff_distance() { PauseAIDashboardResponse.ChauffeurStats b = fullStats(); b.setDistanceMoyenneParJour(1.0); assertThat(fullStats()).isNotEqualTo(b); }

        @Test @DisplayName("ChauffeurStats — heuresMoyennesConduite différent → pas égaux")
        void stats_diff_heures() { PauseAIDashboardResponse.ChauffeurStats b = fullStats(); b.setHeuresMoyennesConduite(1.0); assertThat(fullStats()).isNotEqualTo(b); }

        @Test @DisplayName("ChauffeurStats — scoreMoyenAccessibilite différent → pas égaux")
        void stats_diff_accessibilite() { PauseAIDashboardResponse.ChauffeurStats b = fullStats(); b.setScoreMoyenAccessibilite(1.0); assertThat(fullStats()).isNotEqualTo(b); }

        @Test @DisplayName("ChauffeurStats — sentiment différent → pas égaux")
        void stats_diff_sentiment() { PauseAIDashboardResponse.ChauffeurStats b = fullStats(); b.setSentiment("SAD"); assertThat(fullStats()).isNotEqualTo(b); }

        @Test @DisplayName("ChauffeurStats — arriveeEstimee différent → pas égaux")
        void stats_diff_arrivee() { PauseAIDashboardResponse.ChauffeurStats b = fullStats(); b.setArriveeEstimee(LocalDateTime.of(2025,1,1,0,0)); assertThat(fullStats()).isNotEqualTo(b); }

        @Test @DisplayName("ChauffeurStats — distanceReelle différent → pas égaux")
        void stats_diff_distReelle() { PauseAIDashboardResponse.ChauffeurStats b = fullStats(); b.setDistanceReelle(1.0); assertThat(fullStats()).isNotEqualTo(b); }

        @Test @DisplayName("ChauffeurStats — pointDepart différent → pas égaux")
        void stats_diff_depart() { PauseAIDashboardResponse.ChauffeurStats b = fullStats(); b.setPointDepart("X"); assertThat(fullStats()).isNotEqualTo(b); }

        @Test @DisplayName("ChauffeurStats — pointArrivee différent → pas égaux")
        void stats_diff_arriveePoint() { PauseAIDashboardResponse.ChauffeurStats b = fullStats(); b.setPointArrivee("X"); assertThat(fullStats()).isNotEqualTo(b); }

        @Test @DisplayName("ChauffeurStats — statutTrajet différent → pas égaux")
        void stats_diff_statut() { PauseAIDashboardResponse.ChauffeurStats b = fullStats(); b.setStatutTrajet("X"); assertThat(fullStats()).isNotEqualTo(b); }

        @Test @DisplayName("ChauffeurStats — immatriculation différent → pas égaux")
        void stats_diff_immat() { PauseAIDashboardResponse.ChauffeurStats b = fullStats(); b.setImmatriculationVehicule("X"); assertThat(fullStats()).isNotEqualTo(b); }

        // Null vs non-null pour ChauffeurStats
        @Test @DisplayName("ChauffeurStats — null nomChauffeur → pas égaux")
        void stats_null_nom() { PauseAIDashboardResponse.ChauffeurStats a = fullStats(); a.setNomChauffeur(null); assertThat(a).isNotEqualTo(fullStats()); }

        @Test @DisplayName("ChauffeurStats — null niveauRisque → pas égaux")
        void stats_null_risque() { PauseAIDashboardResponse.ChauffeurStats a = fullStats(); a.setNiveauRisque(null); assertThat(a).isNotEqualTo(fullStats()); }

        @Test @DisplayName("ChauffeurStats — null distanceMoyenne → pas égaux")
        void stats_null_distance() { PauseAIDashboardResponse.ChauffeurStats a = fullStats(); a.setDistanceMoyenneParJour(null); assertThat(a).isNotEqualTo(fullStats()); }

        @Test @DisplayName("ChauffeurStats — null heuresMoyennes → pas égaux")
        void stats_null_heures() { PauseAIDashboardResponse.ChauffeurStats a = fullStats(); a.setHeuresMoyennesConduite(null); assertThat(a).isNotEqualTo(fullStats()); }

        @Test @DisplayName("ChauffeurStats — null scoreMoyenAccessibilite → pas égaux")
        void stats_null_access() { PauseAIDashboardResponse.ChauffeurStats a = fullStats(); a.setScoreMoyenAccessibilite(null); assertThat(a).isNotEqualTo(fullStats()); }

        @Test @DisplayName("ChauffeurStats — null sentiment → pas égaux")
        void stats_null_sentiment() { PauseAIDashboardResponse.ChauffeurStats a = fullStats(); a.setSentiment(null); assertThat(a).isNotEqualTo(fullStats()); }

        @Test @DisplayName("ChauffeurStats — null arriveeEstimee → pas égaux")
        void stats_null_arrivee() { PauseAIDashboardResponse.ChauffeurStats a = fullStats(); a.setArriveeEstimee(null); assertThat(a).isNotEqualTo(fullStats()); }

        @Test @DisplayName("ChauffeurStats — null distanceReelle → pas égaux")
        void stats_null_distReelle() { PauseAIDashboardResponse.ChauffeurStats a = fullStats(); a.setDistanceReelle(null); assertThat(a).isNotEqualTo(fullStats()); }

        @Test @DisplayName("ChauffeurStats — null pointDepart → pas égaux")
        void stats_null_depart() { PauseAIDashboardResponse.ChauffeurStats a = fullStats(); a.setPointDepart(null); assertThat(a).isNotEqualTo(fullStats()); }

        @Test @DisplayName("ChauffeurStats — null pointArrivee → pas égaux")
        void stats_null_arriveePoint() { PauseAIDashboardResponse.ChauffeurStats a = fullStats(); a.setPointArrivee(null); assertThat(a).isNotEqualTo(fullStats()); }

        @Test @DisplayName("ChauffeurStats — null statutTrajet → pas égaux")
        void stats_null_statut() { PauseAIDashboardResponse.ChauffeurStats a = fullStats(); a.setStatutTrajet(null); assertThat(a).isNotEqualTo(fullStats()); }

        @Test @DisplayName("ChauffeurStats — null immatriculation → pas égaux")
        void stats_null_immat() { PauseAIDashboardResponse.ChauffeurStats a = fullStats(); a.setImmatriculationVehicule(null); assertThat(a).isNotEqualTo(fullStats()); }

        @Test @DisplayName("ChauffeurStats — not equal to Object")
        void stats_notObject() { assertThat(fullStats()).isNotEqualTo(new Object()); }

        // ── HeatmapPoint ──
        @Test @DisplayName("HeatmapPoint — vides égaux")
        void point_allNull_equal() {
            assertThat(new PauseAIDashboardResponse.HeatmapPoint())
                .isEqualTo(new PauseAIDashboardResponse.HeatmapPoint());
        }

        @Test @DisplayName("HeatmapPoint — identiques égaux")
        void point_equal() {
            assertThat(fullPoint()).isEqualTo(fullPoint());
        }

        @Test @DisplayName("HeatmapPoint — latitude différent → pas égaux")
        void point_diff_lat() { PauseAIDashboardResponse.HeatmapPoint b = fullPoint(); b.setLatitude(1.0); assertThat(fullPoint()).isNotEqualTo(b); }

        @Test @DisplayName("HeatmapPoint — longitude différent → pas égaux")
        void point_diff_lon() { PauseAIDashboardResponse.HeatmapPoint b = fullPoint(); b.setLongitude(1.0); assertThat(fullPoint()).isNotEqualTo(b); }

        @Test @DisplayName("HeatmapPoint — type différent → pas égaux")
        void point_diff_type() { PauseAIDashboardResponse.HeatmapPoint b = fullPoint(); b.setType("X"); assertThat(fullPoint()).isNotEqualTo(b); }

        @Test @DisplayName("HeatmapPoint — nomLieu différent → pas égaux")
        void point_diff_nom() { PauseAIDashboardResponse.HeatmapPoint b = fullPoint(); b.setNomLieu("X"); assertThat(fullPoint()).isNotEqualTo(b); }

        @Test @DisplayName("HeatmapPoint — timestamp différent → pas égaux")
        void point_diff_ts() { PauseAIDashboardResponse.HeatmapPoint b = fullPoint(); b.setTimestamp(LocalDateTime.of(2025,1,1,0,0)); assertThat(fullPoint()).isNotEqualTo(b); }

        @Test @DisplayName("HeatmapPoint — chauffeurNom différent → pas égaux")
        void point_diff_chauffeur() { PauseAIDashboardResponse.HeatmapPoint b = fullPoint(); b.setChauffeurNom("X"); assertThat(fullPoint()).isNotEqualTo(b); }

        @Test @DisplayName("HeatmapPoint — null latitude → pas égaux")
        void point_null_lat() { PauseAIDashboardResponse.HeatmapPoint a = fullPoint(); a.setLatitude(null); assertThat(a).isNotEqualTo(fullPoint()); }

        @Test @DisplayName("HeatmapPoint — null longitude → pas égaux")
        void point_null_lon() { PauseAIDashboardResponse.HeatmapPoint a = fullPoint(); a.setLongitude(null); assertThat(a).isNotEqualTo(fullPoint()); }

        @Test @DisplayName("HeatmapPoint — null type → pas égaux")
        void point_null_type() { PauseAIDashboardResponse.HeatmapPoint a = fullPoint(); a.setType(null); assertThat(a).isNotEqualTo(fullPoint()); }

        @Test @DisplayName("HeatmapPoint — null nomLieu → pas égaux")
        void point_null_nom() { PauseAIDashboardResponse.HeatmapPoint a = fullPoint(); a.setNomLieu(null); assertThat(a).isNotEqualTo(fullPoint()); }

        @Test @DisplayName("HeatmapPoint — null timestamp → pas égaux")
        void point_null_ts() { PauseAIDashboardResponse.HeatmapPoint a = fullPoint(); a.setTimestamp(null); assertThat(a).isNotEqualTo(fullPoint()); }

        @Test @DisplayName("HeatmapPoint — null chauffeurNom → pas égaux")
        void point_null_chauffeur() { PauseAIDashboardResponse.HeatmapPoint a = fullPoint(); a.setChauffeurNom(null); assertThat(a).isNotEqualTo(fullPoint()); }

        @Test @DisplayName("HeatmapPoint — not equal to Object")
        void point_notObject() { assertThat(fullPoint()).isNotEqualTo(new Object()); }

        // ── PauseAIDashboardResponse (classe principale) ──
        private PauseAIDashboardResponse fullDash() {
            return PauseAIDashboardResponse.builder()
                .totalPausesRecommandees(10).pausesEffectuees(8).pausesIgnorees(2)
                .tauxConformite(0.8).scoreMoyenFatigue(72.0)
                .mlInsights(fullInsights())
                .chauffeurStats(List.of(fullStats()))
                .heatmapPoints(List.of(fullPoint()))
                .build();
        }

        @Test @DisplayName("Dashboard — vides égaux")
        void dash_allNull_equal() {
            assertThat(new PauseAIDashboardResponse()).isEqualTo(new PauseAIDashboardResponse());
        }

        @Test @DisplayName("Dashboard — identiques égaux")
        void dash_equal() {
            assertThat(fullDash()).isEqualTo(fullDash());
            assertThat(fullDash().hashCode()).isEqualTo(fullDash().hashCode());
        }

        @Test @DisplayName("Dashboard — tauxConformite différent → pas égaux")
        void dash_diff_taux() { PauseAIDashboardResponse b = fullDash(); b.setTauxConformite(0.1); assertThat(fullDash()).isNotEqualTo(b); }

        @Test @DisplayName("Dashboard — scoreMoyenFatigue différent → pas égaux")
        void dash_diff_score() { PauseAIDashboardResponse b = fullDash(); b.setScoreMoyenFatigue(1.0); assertThat(fullDash()).isNotEqualTo(b); }

        @Test @DisplayName("Dashboard — mlInsights différent → pas égaux")
        void dash_diff_insights() { PauseAIDashboardResponse b = fullDash(); b.setMlInsights(null); assertThat(fullDash()).isNotEqualTo(b); }

        @Test @DisplayName("Dashboard — chauffeurStats différent → pas égaux")
        void dash_diff_stats() { PauseAIDashboardResponse b = fullDash(); b.setChauffeurStats(List.of()); assertThat(fullDash()).isNotEqualTo(b); }

        @Test @DisplayName("Dashboard — heatmapPoints différent → pas égaux")
        void dash_diff_points() { PauseAIDashboardResponse b = fullDash(); b.setHeatmapPoints(List.of()); assertThat(fullDash()).isNotEqualTo(b); }

        @Test @DisplayName("Dashboard — null tauxConformite → pas égaux")
        void dash_null_taux() { PauseAIDashboardResponse a = fullDash(); a.setTauxConformite(null); assertThat(a).isNotEqualTo(fullDash()); }

        @Test @DisplayName("Dashboard — null scoreMoyenFatigue → pas égaux")
        void dash_null_score() { PauseAIDashboardResponse a = fullDash(); a.setScoreMoyenFatigue(null); assertThat(a).isNotEqualTo(fullDash()); }

        @Test @DisplayName("Dashboard — null mlInsights → pas égaux")
        void dash_null_insights() { PauseAIDashboardResponse a = fullDash(); a.setMlInsights(null); PauseAIDashboardResponse b = fullDash(); assertThat(a).isNotEqualTo(b); }

        @Test @DisplayName("Dashboard — null chauffeurStats → pas égaux")
        void dash_null_stats() { PauseAIDashboardResponse a = fullDash(); a.setChauffeurStats(null); assertThat(a).isNotEqualTo(fullDash()); }

        @Test @DisplayName("Dashboard — null heatmapPoints → pas égaux")
        void dash_null_points() { PauseAIDashboardResponse a = fullDash(); a.setHeatmapPoints(null); assertThat(a).isNotEqualTo(fullDash()); }

        @Test @DisplayName("Dashboard — not equal to Object")
        void dash_notObject() { assertThat(fullDash()).isNotEqualTo(new Object()); }
    }
}
