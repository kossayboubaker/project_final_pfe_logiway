package com.logiway.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.lang.reflect.Method;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("Service ChatbotRAG — Tests Unitaires")
class ChatbotRAGServiceTest {

    @Mock
    private ChatbotToolsService chatbotToolsService;
    @Mock
    private GeminiService geminiService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private ChatbotRAGService service;

    @BeforeEach
    void setUp() {
        service = new ChatbotRAGService(chatbotToolsService, geminiService, objectMapper);
    }

    @Test
    @DisplayName("executeOutils() → question 'statistiques' → outil statistiques globales")
    void executeOutils_statistiques_usesGlobalStats() {
        when(chatbotToolsService.getStatistiquesGlobales(1L)).thenReturn("STATS");

        String result = service.executeOutils(List.of("Donne les statistiques globales"), "user", 1L);

        assertThat(result).contains("STATS");
        verify(chatbotToolsService).getStatistiquesGlobales(1L);
    }

    @Test
    @DisplayName("executeOutils() → question congés en attente → outil dédié")
    void executeOutils_congeEnAttente_usesOutAttente() {
        when(chatbotToolsService.getCongesEnAttente(isNull())).thenReturn("CONGES ATTENTE");

        String result = service.executeOutils(List.of("Quels congés en attente de validation ?"), "user", 1L);

        assertThat(result).contains("CONGES ATTENTE");
        verify(chatbotToolsService).getCongesEnAttente(isNull());
    }

    @Test
    @DisplayName("executeOutils() → question congés semaine → outil congés de la semaine")
    void executeOutils_congeSemaine_usesCongesSemaine() {
        when(chatbotToolsService.getCongesSemaine()).thenReturn("SEMAINE");

        String result = service.executeOutils(List.of("congés cette semaine ?"), "user", 1L);

        assertThat(result).contains("SEMAINE");
        verify(chatbotToolsService).getCongesSemaine();
    }

    @Test
    @DisplayName("executeOutils() → question rapport congés → outil rapport par période")
    void executeOutils_rapportConges_usesRapportPeriode() {
        when(chatbotToolsService.getRapportCongesParPeriode(any(), any(), anyLong()))
            .thenReturn("RAPPORT CONGES");

        String result = service.executeOutils(List.of("rapport des congés sur une période"), "user", 1L);

        assertThat(result).contains("RAPPORT CONGES");
        verify(chatbotToolsService).getRapportCongesParPeriode(any(), any(), eq(1L));
    }

    @Test
    @DisplayName("executeOutils() → question réclamation ouverte → outil dédié")
    void executeOutils_reclamationOuverte_usesOuvertes() {
        when(chatbotToolsService.getReclamationsOuvertes()).thenReturn("REC OUVERTES");

        String result = service.executeOutils(List.of("réclamations ouvertes à priorité haute"), "user", 1L);

        assertThat(result).contains("REC OUVERTES");
        verify(chatbotToolsService).getReclamationsOuvertes();
    }

    @Test
    @DisplayName("executeOutils() → question résumé réclamations → outil résumé")
    void executeOutils_resumeReclamations_usesResume() {
        when(chatbotToolsService.getResumeReclamations(1L)).thenReturn("RESUME REC");

        String result = service.executeOutils(List.of("résumé des réclamations"), "user", 1L);

        assertThat(result).contains("RESUME REC");
        verify(chatbotToolsService).getResumeReclamations(1L);
    }

    @Test
    @DisplayName("executeOutils() → question véhicules en maintenance → outil maintenance")
    void executeOutils_vehiculesMaintenance_usesMaintenance() {
        when(chatbotToolsService.getVehiculesEnMaintenance(1L)).thenReturn("MAINTENANCE");

        String result = service.executeOutils(List.of("véhicules en maintenance"), "user", 1L);

        assertThat(result).contains("MAINTENANCE");
        verify(chatbotToolsService).getVehiculesEnMaintenance(1L);
    }

    @Test
    @DisplayName("executeOutils() → question rapport véhicules → outil rapport véhicules")
    void executeOutils_rapportVehicules_usesRapportVehicules() {
        when(chatbotToolsService.getRapportVehicules(1L)).thenReturn("RAPPORT VEHICULES");

        String result = service.executeOutils(List.of("rapport des véhicules"), "user", 1L);

        assertThat(result).contains("RAPPORT VEHICULES");
        verify(chatbotToolsService).getRapportVehicules(1L);
        verify(chatbotToolsService, never()).getVehiculesEnMaintenance(1L);
    }

    @Test
    @DisplayName("executeOutils() → question chauffeurs disponibles → outil chauffeurs")
    void executeOutils_chauffeursDisponibles_usesChauffeurs() {
        when(chatbotToolsService.getChauffeursDisponibles(1L)).thenReturn("CHAUFFEURS");

        String result = service.executeOutils(List.of("chauffeurs disponibles"), "user", 1L);

        assertThat(result).contains("CHAUFFEURS");
        verify(chatbotToolsService).getChauffeursDisponibles(1L);
    }

    @Test
    @DisplayName("executeOutils() → question trajets en cours → outil trajets en cours")
    void executeOutils_trajetsEnCours_usesTrajetsEnCours() {
        when(chatbotToolsService.getTrajetsEnCoursParSecteur(1L)).thenReturn("TRAJETS EN COURS");

        String result = service.executeOutils(List.of("trajets en cours"), "user", 1L);

        assertThat(result).contains("TRAJETS EN COURS");
        verify(chatbotToolsService).getTrajetsEnCoursParSecteur(1L);
    }

    @Test
    @DisplayName("executeOutils() → question rapport trajets → outil rapport trajets")
    void executeOutils_rapportTrajets_usesRapportTrajets() {
        when(chatbotToolsService.getRapportTrajets(any(), any(), anyLong())).thenReturn("RAPPORT TRAJETS");

        String result = service.executeOutils(List.of("rapport des trajets sur la période"), "user", 1L);

        assertThat(result).contains("RAPPORT TRAJETS");
        verify(chatbotToolsService).getRapportTrajets(any(), any(), eq(1L));
    }

    @Test
    @DisplayName("executeOutils() → question taux d'absence → outil taux d'absences")
    void executeOutils_tauxAbsence_usesTauxAbsences() {
        when(chatbotToolsService.getTauxAbsencesChauffeurs(anyInt(), anyInt(), anyLong()))
            .thenReturn("TAUX ABSENCE");

        String result = service.executeOutils(List.of("quel est le taux d'absence ce mois-ci"), "user", 1L);

        assertThat(result).contains("TAUX ABSENCE");
        verify(chatbotToolsService).getTauxAbsencesChauffeurs(
            eq(LocalDate.now().getMonthValue()), eq(LocalDate.now().getYear()), eq(1L));
    }

    @Test
    @DisplayName("executeOutils() → aucune question reconnue → message par défaut")
    void executeOutils_noMatch_returnsDefault() {
        String result = service.executeOutils(List.of("bonjour comment ça va ?"), "user", 1L);

        assertThat(result).isEqualTo("Aucune donnée trouvée pour cette question.");
        verify(chatbotToolsService, never()).getStatistiquesGlobales(anyLong());
    }

    @Test
    @DisplayName("traiterQuestion() → transmet au service Gemini hybride")
    void traiterQuestion_delegatesToGemini() {
        when(geminiService.traiterQuestionHybride(anyString(), anyString(), isNull(), anyString()))
            .thenReturn("Réponse Gemini");

        String result = service.traiterQuestion("Combien de véhicules ?", "user1");

        assertThat(result).isEqualTo("Réponse Gemini");
    }

    @Test
    @DisplayName("traiterQuestion() → exception → message d'erreur")
    void traiterQuestion_exception_returnsError() {
        when(geminiService.traiterQuestionHybride(anyString(), anyString(), isNull(), anyString()))
            .thenThrow(new RuntimeException("down"));

        String result = service.traiterQuestion("Combien de véhicules ?", "user1");

        assertThat(result)
            .isEqualTo("Désolé, une erreur est survenue lors du traitement de votre demande.");
    }

    @Test
    @DisplayName("generateSql() → retourne le message de dépréciation")
    void generateSql_returnsDeprecationMessage() {
        assertThat(service.generateSql("SELECT * FROM users")).contains("n'est plus disponible");
    }

    @Test
    @DisplayName("executeOutils() → 'voiture en panne' → outil véhicules en maintenance")
    void executeOutils_voitureEnPanne_usesMaintenance() {
        when(chatbotToolsService.getVehiculesEnMaintenance(1L)).thenReturn("MAINTENANCE");

        String result = service.executeOutils(List.of("voiture en panne"), "user", 1L);

        assertThat(result).contains("MAINTENANCE");
        verify(chatbotToolsService).getVehiculesEnMaintenance(1L);
    }

    @Test
    @DisplayName("executeOutils() → 'livraison en cours' → outil trajets en cours")
    void executeOutils_livraisonEnCours_usesTrajetsEnCours() {
        when(chatbotToolsService.getTrajetsEnCoursParSecteur(1L)).thenReturn("LIVRAISONS");

        String result = service.executeOutils(List.of("livraison en cours"), "user", 1L);

        assertThat(result).contains("LIVRAISONS");
        verify(chatbotToolsService).getTrajetsEnCoursParSecteur(1L);
    }

    @Test
    @DisplayName("executeOutils() → 'statistiques de transport' → outil rapport trajets")
    void executeOutils_transportStatistiques_usesRapportTrajets() {
        when(chatbotToolsService.getRapportTrajets(any(), any(), anyLong())).thenReturn("STATS TRAJETS");

        String result = service.executeOutils(List.of("statistiques de transport"), "user", 1L);

        assertThat(result).contains("STATS TRAJETS");
        verify(chatbotToolsService).getRapportTrajets(any(), any(), eq(1L));
    }

    @Test
    @DisplayName("executeOutils() → 'résumé des plaintes' → outil résumé réclamations")
    void executeOutils_resumePlaintes_usesResumeReclamations() {
        when(chatbotToolsService.getResumeReclamations(1L)).thenReturn("PLAINTES");

        String result = service.executeOutils(List.of("résumé des plaintes"), "user", 1L);

        assertThat(result).contains("PLAINTES");
        verify(chatbotToolsService).getResumeReclamations(1L);
    }

    @Test
    @DisplayName("executeOutils() → 'taux d'absentéisme' → outil taux d'absences")
    void executeOutils_absenteisme_usesTauxAbsences() {
        when(chatbotToolsService.getTauxAbsencesChauffeurs(anyInt(), anyInt(), anyLong()))
            .thenReturn("TAUX ABSENTEISME");

        String result = service.executeOutils(List.of("taux d'absentéisme"), "user", 1L);

        assertThat(result).contains("TAUX ABSENTEISME");
        verify(chatbotToolsService).getTauxAbsencesChauffeurs(anyInt(), anyInt(), eq(1L));
    }

    @Test
    @DisplayName("executeOutils() → 'permission' sans sous-thème → aucune donnée")
    void executeOutils_permission_noSubTheme_returnsDefault() {
        String result = service.executeOutils(List.of("combien de jours de permission ?"), "user", 1L);

        assertThat(result).isEqualTo("Aucune donnée trouvée pour cette question.");
        verify(chatbotToolsService, never()).getCongesSemaine();
        verify(chatbotToolsService, never()).getCongesEnAttente(isNull());
    }

    @Test
    @DisplayName("executeOutils() → plusieurs questions → concatène les sorties")
    void executeOutils_multipleQuestions_concatenates() {
        when(chatbotToolsService.getStatistiquesGlobales(1L)).thenReturn("STATS");
        when(chatbotToolsService.getCongesSemaine()).thenReturn("CONGES SEMAINE");

        String result = service.executeOutils(
            List.of("statistiques globales", "congés cette semaine"), "user", 1L);

        assertThat(result).contains("STATS", "CONGES SEMAINE");
        verify(chatbotToolsService).getStatistiquesGlobales(1L);
        verify(chatbotToolsService).getCongesSemaine();
    }

    @Test
    @DisplayName("traiterQuestion() → question 'statut' → détecte la question 'global'")
    void traiterQuestion_statut_detectsGlobalQuestion() {
        when(chatbotToolsService.getStatistiquesGlobales(isNull())).thenReturn("STATS");
        when(chatbotToolsService.getRapportVehicules(isNull())).thenReturn("VEHICULES");
        when(geminiService.traiterQuestionHybride(anyString(), anyString(), isNull(), anyString()))
            .thenReturn("Résultat");

        String result = service.traiterQuestion("statut des véhicules", "user1");

        assertThat(result).isEqualTo("Résultat");
        verify(chatbotToolsService).getStatistiquesGlobales(isNull());
        verify(chatbotToolsService).getRapportVehicules(isNull());
    }

    @Test
    @DisplayName("traiterQuestion() → question 'maintenance' → détecte la question maintenance")
    void traiterQuestion_maintenance_detectsMaintenanceQuestion() {
        when(chatbotToolsService.getVehiculesEnMaintenance(isNull())).thenReturn("MAINT");
        when(geminiService.traiterQuestionHybride(anyString(), anyString(), isNull(), anyString()))
            .thenReturn("Résultat");

        String result = service.traiterQuestion("entretien des véhicules", "user1");

        assertThat(result).isEqualTo("Résultat");
        verify(chatbotToolsService).getVehiculesEnMaintenance(isNull());
    }

    @Test
    @DisplayName("nettoyerSql() → null → chaîne vide")
    void nettoyerSql_null_returnsEmpty() throws Exception {
        assertThat(invokePrivate("nettoyerSql", (Object) null)).isEqualTo("");
    }

    @Test
    @DisplayName("nettoyerSql() → retire les marqueurs markdown")
    void nettoyerSql_stripsMarkdown() throws Exception {
        String sql = "```sql\nSELECT * FROM trajets;\n```";
        assertThat(invokePrivate("nettoyerSql", sql))
            .isEqualTo("SELECT * FROM trajets;");
    }

    @Test
    @DisplayName("nettoyerSql() → coupe le texte avant SELECT")
    void nettoyerSql_truncatesBeforeSelect() throws Exception {
        String sql = "Voici la requête: SELECT id FROM vehicules WHERE statut = 'EN_SERVICE'; note";
        assertThat(invokePrivate("nettoyerSql", sql))
            .isEqualTo("SELECT id FROM vehicules WHERE statut = 'EN_SERVICE';");
    }

    @Test
    @DisplayName("nettoyerSql() → garde la partie WITH")
    void nettoyerSql_keepsWithClause() throws Exception {
        String sql = "texte WITH cte AS (SELECT 1) SELECT * FROM cte; suite";
        assertThat(invokePrivate("nettoyerSql", sql))
            .isEqualTo("WITH cte AS (SELECT 1) SELECT * FROM cte;");
    }

    @Test
    @DisplayName("nettoyerSql() → garde la partie SHOW")
    void nettoyerSql_keepsShow() throws Exception {
        String sql = "peux-tu faire SHOW TABLES; merci";
        assertThat(invokePrivate("nettoyerSql", sql))
            .isEqualTo("SHOW TABLES;");
    }

    @Test
    @DisplayName("construirePrompt() → inclut les données outils")
    void construirePrompt_withData_includesData() throws Exception {
        String prompt = (String) invokePrivate("construirePrompt",
            "Combien de véhicules ?", "user1", "DONNEES");

        assertThat(prompt).contains("LogiWay Assistant", "Utilisateur: user1",
            "Données disponibles dans le système :", "DONNEES", "Combien de véhicules ?", "Réponse :");
    }

    @Test
    @DisplayName("construirePrompt() → omet les données quand message par défaut")
    void construirePrompt_defaultMessage_omitsData() throws Exception {
        String prompt = (String) invokePrivate("construirePrompt",
            "Question", "user1", "Aucune donnée trouvée pour cette question.");

        assertThat(prompt).doesNotContain("Données disponibles dans le système :");
        assertThat(prompt).contains("Question");
    }

    @Test
    @DisplayName("construirePrompt() → omet les données quand vides")
    void construirePrompt_emptyData_omitsData() throws Exception {
        String prompt = (String) invokePrivate("construirePrompt", "Question", "user1", "");

        assertThat(prompt).doesNotContain("Données disponibles dans le système :");
    }

    @Test
    @DisplayName("nettoyerSql() → SQL vide, et multiples clauses complexes")
    void nettoyerSql_emptyAndComplexClauses() throws Exception {
        assertThat(invokePrivate("nettoyerSql", "")).isEqualTo("");
        
        // selectIndex < 0, withIndex < 0, showIndex >= 0
        assertThat(invokePrivate("nettoyerSql", "peux-tu faire SHOW;")).isEqualTo("SHOW;");

        // selectIndex < 0, withIndex >= 0, showIndex >= 0
        assertThat(invokePrivate("nettoyerSql", "peux-tu faire WITH a AS (SELECT 1) SHOW;"))
            .isEqualTo("WITH a AS (SELECT 1) SHOW;");

        // selectIndex >= 0, withIndex >= 0, showIndex >= 0
        assertThat(invokePrivate("nettoyerSql", "peux-tu faire SELECT 1 WITH SHOW;"))
            .isEqualTo("SELECT 1 WITH SHOW;");
    }

    @Test
    @DisplayName("nettoyerSql() → pas de mot-clé SQL → retourne le texte nettoyé tel quel")
    void nettoyerSql_noSqlKeyword_returnsAsIs() throws Exception {
        // Aucun SELECT/WITH/SHOW → startIndex reste -1 → le texte est retourné tel quel
        assertThat(invokePrivate("nettoyerSql", "bonjour monde")).isEqualTo("bonjour monde");
    }

    @Test
    @DisplayName("nettoyerSql() → sans point-virgule → retourne la requête entière")
    void nettoyerSql_noSemicolon_returnsFullQuery() throws Exception {
        assertThat(invokePrivate("nettoyerSql", "SELECT * FROM users"))
            .isEqualTo("SELECT * FROM users");
    }

    @Test
    @DisplayName("nettoyerSql() → WITH avant SELECT (WITH < SELECT) → commence par WITH")
    void nettoyerSql_withBeforeSelect() throws Exception {
        String sql = "WITH cte AS (SELECT 1) SELECT * FROM cte";
        assertThat(invokePrivate("nettoyerSql", sql))
            .isEqualTo("WITH cte AS (SELECT 1) SELECT * FROM cte");
    }

    @Test
    @DisplayName("nettoyerSql() → SHOW avant WITH (SHOW < WITH) → commence par SHOW")
    void nettoyerSql_showBeforeWith() throws Exception {
        String sql = "SHOW TABLES; WITH ignored";
        assertThat(invokePrivate("nettoyerSql", sql))
            .isEqualTo("SHOW TABLES;");
    }

    // --- Tests branches manquantes de detecterQuestions ---

    @Test
    @DisplayName("detecterQuestions() → 'taux' + 'absence' → ajoute 'taux absence'")
    void detecterQuestions_tauxAbsence() throws Exception {
        @SuppressWarnings("unchecked")
        List<String> result = (List<String>) invokePrivateDetecterQuestions("quel est le taux d'absence");
        assertThat(result).contains("taux absence");
    }

    @Test
    @DisplayName("detecterQuestions() → 'absent' seul → ajoute 'taux absence'")
    void detecterQuestions_absentSeul() throws Exception {
        @SuppressWarnings("unchecked")
        List<String> result = (List<String>) invokePrivateDetecterQuestions("combien de chauffeurs absents");
        assertThat(result).contains("taux absence");
    }

    @Test
    @DisplayName("detecterQuestions() → 'tous' → ajoute 'global'")
    void detecterQuestions_tous() throws Exception {
        @SuppressWarnings("unchecked")
        List<String> result = (List<String>) invokePrivateDetecterQuestions("montre-moi tous les résultats");
        assertThat(result).contains("global");
    }

    @Test
    @DisplayName("detecterQuestions() → 'panne' → ajoute 'maintenance'")
    void detecterQuestions_panne() throws Exception {
        @SuppressWarnings("unchecked")
        List<String> result = (List<String>) invokePrivateDetecterQuestions("les véhicules en panne");
        assertThat(result).contains("maintenance");
    }

    @Test
    @DisplayName("detecterQuestions() → mot simple sans thème → pas d'ajout")
    void detecterQuestions_noTheme() throws Exception {
        @SuppressWarnings("unchecked")
        List<String> result = (List<String>) invokePrivateDetecterQuestions("bonjour");
        assertThat(result).hasSize(1).contains("bonjour");
    }

    // --- Tests branches manquantes de executeOutils ---

    @Test
    @DisplayName("executeOutils() → 'utilisateur' → statistiques globales")
    void executeOutils_utilisateur_usesGlobalStats() {
        when(chatbotToolsService.getStatistiquesGlobales(1L)).thenReturn("STATS");
        String result = service.executeOutils(List.of("combien d'utilisateur dans le système ?"), "user", 1L);
        assertThat(result).contains("STATS");
    }

    @Test
    @DisplayName("executeOutils() → 'conducteur' → chauffeurs disponibles")
    void executeOutils_conducteur_usesChauffeurs() {
        when(chatbotToolsService.getChauffeursDisponibles(1L)).thenReturn("COND");
        String result = service.executeOutils(List.of("quel conducteur est libre ?"), "user", 1L);
        assertThat(result).contains("COND");
    }

    @Test
    @DisplayName("executeOutils() → 'course' en cours → trajets en cours")
    void executeOutils_courseEnCours_usesTrajets() {
        when(chatbotToolsService.getTrajetsEnCoursParSecteur(1L)).thenReturn("COURSES");
        String result = service.executeOutils(List.of("course en cours"), "user", 1L);
        assertThat(result).contains("COURSES");
    }

    @Test
    @DisplayName("executeOutils() → 'réclamer' + 'ouvert' → réclamations ouvertes")
    void executeOutils_reclamer_ouvert() {
        when(chatbotToolsService.getReclamationsOuvertes()).thenReturn("REC");
        String result = service.executeOutils(List.of("quelles plaintes ouvertes, peut-on réclamer ?"), "user", 1L);
        assertThat(result).contains("REC");
    }

    @Test
    @DisplayName("executeOutils() → 'reclamation' + 'statut' → résumé réclamations")
    void executeOutils_reclamation_statut() {
        when(chatbotToolsService.getResumeReclamations(1L)).thenReturn("RESUME");
        String result = service.executeOutils(List.of("reclamation par statut"), "user", 1L);
        assertThat(result).contains("RESUME");
    }

    @Test
    @DisplayName("executeOutils() → 'conge' + 'rapport' sans 'attente' ni 'semaine' → rapport par période")
    void executeOutils_conge_rapport() {
        when(chatbotToolsService.getRapportCongesParPeriode(any(), any(), anyLong()))
            .thenReturn("RAPPORT P");
        String result = service.executeOutils(List.of("rapport des conge"), "user", 1L);
        assertThat(result).contains("RAPPORT P");
    }

    @Test
    @DisplayName("executeOutils() → 'vehicule en réparation' → maintenance")
    void executeOutils_vehicule_reparation() {
        when(chatbotToolsService.getVehiculesEnMaintenance(1L)).thenReturn("MAINT");
        String result = service.executeOutils(List.of("vehicule en réparation"), "user", 1L);
        assertThat(result).contains("MAINT");
    }

    @Test
    @DisplayName("executeOutils() → 'global' seul → statistiques globales")
    void executeOutils_globalSeul() {
        when(chatbotToolsService.getStatistiquesGlobales(1L)).thenReturn("GLOBAL");
        String result = service.executeOutils(List.of("global"), "user", 1L);
        assertThat(result).contains("GLOBAL");
    }

    @Test
    @DisplayName("executeOutils() → 'conge' seul sans sous-thème → aucune donnée")
    void executeOutils_conge_sansSubTheme() {
        // "conge" matche le bloc congé, mais aucun sous-thème (attente/semaine/rapport) → pas de tool call
        String result = service.executeOutils(List.of("les conge sont sympas"), "user", 1L);
        assertThat(result).isEqualTo("Aucune donnée trouvée pour cette question.");
    }

    @Test
    @DisplayName("executeOutils() → 'absence' + 'en attente' → congés en attente")
    void executeOutils_absence_enAttente() {
        when(chatbotToolsService.getCongesEnAttente(isNull())).thenReturn("ATTENTE");
        String result = service.executeOutils(List.of("absence en attente"), "user", 1L);
        assertThat(result).contains("ATTENTE");
    }

    @Test
    @DisplayName("executeOutils() → 'conge semaine' → congés de la semaine")
    void executeOutils_conge_semaine() {
        when(chatbotToolsService.getCongesSemaine()).thenReturn("SEM");
        String result = service.executeOutils(List.of("conge de la semaine"), "user", 1L);
        assertThat(result).contains("SEM");
    }

    @Test
    @DisplayName("executeOutils() → 'trajet' seul sans sous-thème → aucune donnée")
    void executeOutils_trajet_sansSubTheme() {
        String result = service.executeOutils(List.of("le trajet est beau"), "user", 1L);
        assertThat(result).isEqualTo("Aucune donnée trouvée pour cette question.");
    }

    @Test
    @DisplayName("executeOutils() → 'réclamation' seule sans sous-thème → aucune donnée")
    void executeOutils_reclamation_sansSubTheme() {
        String result = service.executeOutils(List.of("réclamation générale"), "user", 1L);
        assertThat(result).isEqualTo("Aucune donnée trouvée pour cette question.");
    }

    @Test
    @DisplayName("executeOutils() → 'transport' + 'actif' → trajets en cours")
    void executeOutils_transport_actif() {
        when(chatbotToolsService.getTrajetsEnCoursParSecteur(1L)).thenReturn("ACTIFS");
        String result = service.executeOutils(List.of("transport actif"), "user", 1L);
        assertThat(result).contains("ACTIFS");
    }

    @Test
    @DisplayName("executeOutils() → 'taux' + 'absenteisme' → taux d'absences")
    void executeOutils_taux_absenteisme_ascii() {
        when(chatbotToolsService.getTauxAbsencesChauffeurs(anyInt(), anyInt(), anyLong()))
            .thenReturn("TAUX");
        String result = service.executeOutils(List.of("taux d'absenteisme des chauffeurs"), "user", 1L);
        assertThat(result).contains("TAUX");
    }

    @Test
    @DisplayName("executeOutils() → 'priorité' + 'reclamation' → réclamations ouvertes")
    void executeOutils_prioriteReclamation() {
        when(chatbotToolsService.getReclamationsOuvertes()).thenReturn("PRIO");
        String result = service.executeOutils(List.of("reclamation avec priorité"), "user", 1L);
        assertThat(result).contains("PRIO");
    }

    private Object invokePrivate(String name, Object... args) throws Exception {
        Class<?>[] paramTypes = new Class<?>[args.length];
        for (int i = 0; i < args.length; i++) {
            paramTypes[i] = args[i] == null ? String.class : args[i].getClass();
        }
        Method method = ChatbotRAGService.class.getDeclaredMethod(name, paramTypes);
        method.setAccessible(true);
        return method.invoke(service, args);
    }

    private Object invokePrivateDetecterQuestions(String question) throws Exception {
        Method method = ChatbotRAGService.class.getDeclaredMethod("detecterQuestions", String.class);
        method.setAccessible(true);
        return method.invoke(service, question);
    }
}
