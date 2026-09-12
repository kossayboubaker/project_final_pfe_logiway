package com.logiway.services;

import com.logiway.dto.response.RapportResponse;
import com.logiway.entities.Entreprise;
import com.logiway.entities.Utilisateur;
import com.logiway.repositories.UtilisateurRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("Service Rapport — Tests Unitaires")
class RapportServiceTest {

    private static final Long USER_ID = 1L;
    private static final Long ENTREPRISE_ID = 5L;

    @Mock
    private ChatbotToolsService toolsService;
    @Mock
    private GeminiService geminiService;
    @Mock
    private UtilisateurRepository utilisateurRepository;

    private RapportService service;

    @BeforeEach
    void setUp() {
        service = new RapportService(toolsService, geminiService, utilisateurRepository);
    }

    private void utilisateurAvecEntreprise() {
        Utilisateur u = Utilisateur.builder()
            .id(USER_ID)
            .entreprise(Entreprise.builder().id(ENTREPRISE_ID).build())
            .build();
        when(utilisateurRepository.findById(USER_ID)).thenReturn(Optional.of(u));
    }

    private void utilisateurSansEntreprise() {
        Utilisateur u = Utilisateur.builder().id(USER_ID).build();
        when(utilisateurRepository.findById(USER_ID)).thenReturn(Optional.of(u));
    }

    private void utilisateurIntrouvable() {
        when(utilisateurRepository.findById(USER_ID)).thenReturn(Optional.empty());
    }

    @Test
    @DisplayName("genererRapportCongesSemaine() → construit le rapport avec sections et résumé IA")
    void genererRapportCongesSemaine_success_buildsReport() {
        utilisateurAvecEntreprise();
        when(toolsService.getCongesSemaine()).thenReturn("DONNEES CONGES");
        when(geminiService.appelerServiceRAG(anyString(), eq("system"), isNull())).thenReturn("Résumé IA");

        RapportResponse response = service.genererRapportCongesSemaine(USER_ID);

        assertThat(response.getTitre()).isEqualTo("Rapport - Congés de la Semaine");
        assertThat(response.getSections()).hasSize(1);
        assertThat(response.getSections().get(0).getTitre()).isEqualTo("Congés de la Semaine");
        assertThat(response.getSections().get(0).getContenu()).isEqualTo("DONNEES CONGES");
        assertThat(response.getResumeIA()).isEqualTo("Résumé IA");
    }

    @Test
    @DisplayName("genererRapportCongesSemaine() → utilisateur introuvable → IllegalArgumentException")
    void genererRapportCongesSemaine_userNotFound_throws() {
        utilisateurIntrouvable();

        assertThatThrownBy(() -> service.genererRapportCongesSemaine(USER_ID))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("Utilisateur non trouvé");
    }

    @Test
    @DisplayName("genererRapportCongesSemaine() → Gemini indisponible → résumé vide")
    void genererRapportCongesSemaine_geminiDown_resumeEmpty() {
        utilisateurAvecEntreprise();
        when(toolsService.getCongesSemaine()).thenReturn("DONNEES");
        when(geminiService.appelerServiceRAG(anyString(), anyString(), isNull()))
            .thenThrow(new RuntimeException("down"));

        RapportResponse response = service.genererRapportCongesSemaine(USER_ID);

        assertThat(response.getResumeIA()).isEmpty();
    }

    @Test
    @DisplayName("genererRapportCongesPeriode() → construit le rapport avec entrepriseId")
    void genererRapportCongesPeriode_success_usesEntrepriseId() {
        utilisateurAvecEntreprise();
        when(toolsService.getRapportCongesParPeriode(eq(LocalDate.of(2026, 1, 1)), eq(LocalDate.of(2026, 1, 31)), eq(ENTREPRISE_ID)))
            .thenReturn("DONNEES PERIODE");
        when(geminiService.appelerServiceRAG(anyString(), anyString(), isNull())).thenReturn("Résumé");

        RapportResponse response = service.genererRapportCongesPeriode(
            LocalDate.of(2026, 1, 1), LocalDate.of(2026, 1, 31), USER_ID);

        assertThat(response.getSections()).hasSize(1);
        assertThat(response.getSections().get(0).getContenu()).isEqualTo("DONNEES PERIODE");
    }

    @Test
    @DisplayName("genererRapportCongesPeriode() → utilisateur sans entreprise → IllegalArgumentException")
    void genererRapportCongesPeriode_noEntreprise_throws() {
        utilisateurSansEntreprise();

        assertThatThrownBy(() -> service.genererRapportCongesPeriode(
            LocalDate.of(2026, 1, 1), LocalDate.of(2026, 1, 31), USER_ID))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("L'utilisateur n'est pas assigné à une entreprise");
    }

    @Test
    @DisplayName("genererRapportTauxAbsences() → construit le rapport avec le bon entrepriseId")
    void genererRapportTauxAbsences_success_usesEntrepriseId() {
        utilisateurAvecEntreprise();
        when(toolsService.getTauxAbsencesChauffeurs(3, 2026, ENTREPRISE_ID)).thenReturn("TAUX");
        when(geminiService.appelerServiceRAG(anyString(), anyString(), isNull())).thenReturn("Analyse");

        RapportResponse response = service.genererRapportTauxAbsences(3, 2026, USER_ID);

        assertThat(response.getTitre()).isEqualTo("Rapport - Taux d'Absence (03/2026)");
        assertThat(response.getSections()).hasSize(1);
        assertThat(response.getSections().get(0).getContenu()).isEqualTo("TAUX");
    }

    @Test
    @DisplayName("genererRapportReclamations() → construit le rapport réclamations")
    void genererRapportReclamations_success_buildsReport() {
        utilisateurAvecEntreprise();
        when(toolsService.getResumeReclamations(ENTREPRISE_ID)).thenReturn("RESUME REC");
        when(geminiService.appelerServiceRAG(anyString(), anyString(), isNull())).thenReturn("Analyse");

        RapportResponse response = service.genererRapportReclamations(USER_ID);

        assertThat(response.getTitre()).isEqualTo("Rapport - Réclamations");
        assertThat(response.getSections()).hasSize(1);
        assertThat(response.getSections().get(0).getContenu()).isEqualTo("RESUME REC");
    }

    @Test
    @DisplayName("genererRapportVehicules() → construit deux sections")
    void genererRapportVehicules_success_buildsTwoSections() {
        utilisateurAvecEntreprise();
        when(toolsService.getRapportVehicules(ENTREPRISE_ID)).thenReturn("PARC");
        when(toolsService.getVehiculesEnMaintenance(ENTREPRISE_ID)).thenReturn("MAINTENANCE");
        when(geminiService.appelerServiceRAG(anyString(), anyString(), isNull())).thenReturn("Analyse");

        RapportResponse response = service.genererRapportVehicules(USER_ID);

        assertThat(response.getTitre()).isEqualTo("Rapport - Véhicules");
        assertThat(response.getSections()).hasSize(2);
        assertThat(response.getSections().get(0).getTitre()).isEqualTo("Résumé Général");
        assertThat(response.getSections().get(1).getTitre()).isEqualTo("Véhicules en Maintenance");
    }

    @Test
    @DisplayName("genererRapportTrajets() → construit deux sections")
    void genererRapportTrajets_success_buildsTwoSections() {
        utilisateurAvecEntreprise();
        when(toolsService.getRapportTrajets(eq(LocalDate.of(2026, 2, 1)), eq(LocalDate.of(2026, 2, 28)), eq(ENTREPRISE_ID)))
            .thenReturn("TRAJETS");
        when(toolsService.getTrajetsEnCoursParSecteur(ENTREPRISE_ID)).thenReturn("EN COURS");
        when(geminiService.appelerServiceRAG(anyString(), anyString(), isNull())).thenReturn("Analyse");

        RapportResponse response = service.genererRapportTrajets(
            LocalDate.of(2026, 2, 1), LocalDate.of(2026, 2, 28), USER_ID);

        assertThat(response.getTitre()).isEqualTo("Rapport - Trajets (2026-02-01 à 2026-02-28)");
        assertThat(response.getSections()).hasSize(2);
    }

    @Test
    @DisplayName("genererRapportGlobal() → construit cinq sections")
    void genererRapportGlobal_success_buildsFiveSections() {
        utilisateurAvecEntreprise();
        when(toolsService.getStatistiquesGlobales(ENTREPRISE_ID)).thenReturn("STATS");
        when(toolsService.getCongesSemaine()).thenReturn("CONGES");
        when(toolsService.getResumeReclamations(ENTREPRISE_ID)).thenReturn("REC");
        when(toolsService.getRapportVehicules(ENTREPRISE_ID)).thenReturn("VEHICULES");
        when(toolsService.getTrajetsEnCoursParSecteur(ENTREPRISE_ID)).thenReturn("TRAJETS");
        when(geminiService.appelerServiceRAG(anyString(), anyString(), isNull())).thenReturn("Bilan");

        RapportResponse response = service.genererRapportGlobal(USER_ID);

        assertThat(response.getTitre()).isEqualTo("Rapport Global - Bilan Complet");
        assertThat(response.getSections()).hasSize(5);
        assertThat(response.getResumeIA()).isEqualTo("Bilan");
    }

    @Test
    @DisplayName("genererRapportTauxAbsences() → utilisateur sans entreprise → IllegalArgumentException")
    void genererRapportTauxAbsences_noEntreprise_throws() {
        utilisateurSansEntreprise();

        assertThatThrownBy(() -> service.genererRapportTauxAbsences(3, 2026, USER_ID))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("L'utilisateur n'est pas assigné à une entreprise");
    }

    // --- Tests manquants: Réclamations ---

    @Test
    @DisplayName("genererRapportReclamations() → utilisateur introuvable → IllegalArgumentException")
    void genererRapportReclamations_userNotFound_throws() {
        utilisateurIntrouvable();

        assertThatThrownBy(() -> service.genererRapportReclamations(USER_ID))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("Utilisateur non trouvé");
    }

    @Test
    @DisplayName("genererRapportReclamations() → utilisateur sans entreprise → IllegalArgumentException")
    void genererRapportReclamations_noEntreprise_throws() {
        utilisateurSansEntreprise();

        assertThatThrownBy(() -> service.genererRapportReclamations(USER_ID))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("L'utilisateur n'est pas assigné à une entreprise");
    }

    // --- Tests manquants: Véhicules ---

    @Test
    @DisplayName("genererRapportVehicules() → utilisateur introuvable → IllegalArgumentException")
    void genererRapportVehicules_userNotFound_throws() {
        utilisateurIntrouvable();

        assertThatThrownBy(() -> service.genererRapportVehicules(USER_ID))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("Utilisateur non trouvé");
    }

    @Test
    @DisplayName("genererRapportVehicules() → utilisateur sans entreprise → IllegalArgumentException")
    void genererRapportVehicules_noEntreprise_throws() {
        utilisateurSansEntreprise();

        assertThatThrownBy(() -> service.genererRapportVehicules(USER_ID))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("L'utilisateur n'est pas assigné à une entreprise");
    }

    // --- Tests manquants: Trajets ---

    @Test
    @DisplayName("genererRapportTrajets() → utilisateur introuvable → IllegalArgumentException")
    void genererRapportTrajets_userNotFound_throws() {
        utilisateurIntrouvable();

        assertThatThrownBy(() -> service.genererRapportTrajets(
            LocalDate.of(2026, 1, 1), LocalDate.of(2026, 1, 31), USER_ID))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("Utilisateur non trouvé");
    }

    @Test
    @DisplayName("genererRapportTrajets() → utilisateur sans entreprise → IllegalArgumentException")
    void genererRapportTrajets_noEntreprise_throws() {
        utilisateurSansEntreprise();

        assertThatThrownBy(() -> service.genererRapportTrajets(
            LocalDate.of(2026, 1, 1), LocalDate.of(2026, 1, 31), USER_ID))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("L'utilisateur n'est pas assigné à une entreprise");
    }

    // --- Tests manquants: Global ---

    @Test
    @DisplayName("genererRapportGlobal() → utilisateur introuvable → IllegalArgumentException")
    void genererRapportGlobal_userNotFound_throws() {
        utilisateurIntrouvable();

        assertThatThrownBy(() -> service.genererRapportGlobal(USER_ID))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("Utilisateur non trouvé");
    }

    @Test
    @DisplayName("genererRapportGlobal() → utilisateur sans entreprise → IllegalArgumentException")
    void genererRapportGlobal_noEntreprise_throws() {
        utilisateurSansEntreprise();

        assertThatThrownBy(() -> service.genererRapportGlobal(USER_ID))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("L'utilisateur n'est pas assigné à une entreprise");
    }

    // --- Tests manquants: genererResumeIA exception fallback ---

    @Test
    @DisplayName("genererRapportCongesPeriode() → Gemini indisponible → résumé vide")
    void genererRapportCongesPeriode_geminiDown_resumeEmpty() {
        utilisateurAvecEntreprise();
        when(toolsService.getRapportCongesParPeriode(any(), any(), eq(ENTREPRISE_ID)))
            .thenReturn("DONNEES");
        when(geminiService.appelerServiceRAG(anyString(), anyString(), isNull()))
            .thenThrow(new RuntimeException("down"));

        RapportResponse response = service.genererRapportCongesPeriode(
            LocalDate.of(2026, 1, 1), LocalDate.of(2026, 1, 31), USER_ID);

        assertThat(response.getResumeIA()).isEmpty();
    }

    @Test
    @DisplayName("genererRapportTauxAbsences() → Gemini indisponible → résumé vide")
    void genererRapportTauxAbsences_geminiDown_resumeEmpty() {
        utilisateurAvecEntreprise();
        when(toolsService.getTauxAbsencesChauffeurs(3, 2026, ENTREPRISE_ID)).thenReturn("TAUX");
        when(geminiService.appelerServiceRAG(anyString(), anyString(), isNull()))
            .thenThrow(new RuntimeException("down"));

        RapportResponse response = service.genererRapportTauxAbsences(3, 2026, USER_ID);

        assertThat(response.getResumeIA()).isEmpty();
    }

    @Test
    @DisplayName("genererRapportReclamations() → Gemini indisponible → résumé vide")
    void genererRapportReclamations_geminiDown_resumeEmpty() {
        utilisateurAvecEntreprise();
        when(toolsService.getResumeReclamations(ENTREPRISE_ID)).thenReturn("REC");
        when(geminiService.appelerServiceRAG(anyString(), anyString(), isNull()))
            .thenThrow(new RuntimeException("down"));

        RapportResponse response = service.genererRapportReclamations(USER_ID);

        assertThat(response.getResumeIA()).isEmpty();
    }

    @Test
    @DisplayName("genererRapportVehicules() → Gemini indisponible → résumé vide")
    void genererRapportVehicules_geminiDown_resumeEmpty() {
        utilisateurAvecEntreprise();
        when(toolsService.getRapportVehicules(ENTREPRISE_ID)).thenReturn("PARC");
        when(toolsService.getVehiculesEnMaintenance(ENTREPRISE_ID)).thenReturn("MAINT");
        when(geminiService.appelerServiceRAG(anyString(), anyString(), isNull()))
            .thenThrow(new RuntimeException("down"));

        RapportResponse response = service.genererRapportVehicules(USER_ID);

        assertThat(response.getResumeIA()).isEmpty();
    }

    @Test
    @DisplayName("genererRapportTrajets() → Gemini indisponible → résumé vide")
    void genererRapportTrajets_geminiDown_resumeEmpty() {
        utilisateurAvecEntreprise();
        when(toolsService.getRapportTrajets(any(), any(), eq(ENTREPRISE_ID))).thenReturn("T");
        when(toolsService.getTrajetsEnCoursParSecteur(ENTREPRISE_ID)).thenReturn("EC");
        when(geminiService.appelerServiceRAG(anyString(), anyString(), isNull()))
            .thenThrow(new RuntimeException("down"));

        RapportResponse response = service.genererRapportTrajets(
            LocalDate.of(2026, 2, 1), LocalDate.of(2026, 2, 28), USER_ID);

        assertThat(response.getResumeIA()).isEmpty();
    }

    @Test
    @DisplayName("genererRapportGlobal() → Gemini indisponible → résumé vide")
    void genererRapportGlobal_geminiDown_resumeEmpty() {
        utilisateurAvecEntreprise();
        when(toolsService.getStatistiquesGlobales(ENTREPRISE_ID)).thenReturn("S");
        when(toolsService.getCongesSemaine()).thenReturn("C");
        when(toolsService.getResumeReclamations(ENTREPRISE_ID)).thenReturn("R");
        when(toolsService.getRapportVehicules(ENTREPRISE_ID)).thenReturn("V");
        when(toolsService.getTrajetsEnCoursParSecteur(ENTREPRISE_ID)).thenReturn("T");
        when(geminiService.appelerServiceRAG(anyString(), anyString(), isNull()))
            .thenThrow(new RuntimeException("down"));

        RapportResponse response = service.genererRapportGlobal(USER_ID);

        assertThat(response.getResumeIA()).isEmpty();
    }

    // --- Tests manquants: utilisateur introuvable pour les méthodes restantes ---

    @Test
    @DisplayName("genererRapportCongesPeriode() → utilisateur introuvable → IllegalArgumentException")
    void genererRapportCongesPeriode_userNotFound_throws() {
        utilisateurIntrouvable();

        assertThatThrownBy(() -> service.genererRapportCongesPeriode(
            LocalDate.of(2026, 1, 1), LocalDate.of(2026, 1, 31), USER_ID))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("Utilisateur non trouvé");
    }

    @Test
    @DisplayName("genererRapportTauxAbsences() → utilisateur introuvable → IllegalArgumentException")
    void genererRapportTauxAbsences_userNotFound_throws() {
        utilisateurIntrouvable();

        assertThatThrownBy(() -> service.genererRapportTauxAbsences(3, 2026, USER_ID))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("Utilisateur non trouvé");
    }
}
