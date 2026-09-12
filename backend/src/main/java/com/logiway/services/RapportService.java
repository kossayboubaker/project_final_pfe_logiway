package com.logiway.services;

import com.logiway.dto.response.RapportResponse;
import com.logiway.entities.Utilisateur;
import com.logiway.repositories.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class RapportService {

    private final ChatbotToolsService toolsService;
    private final GeminiService geminiService;
    private final UtilisateurRepository utilisateurRepository;

    /**
     * Génère un rapport sur les congés de la semaine
     */
    public RapportResponse genererRapportCongesSemaine(Long utilisateurId) {
        Utilisateur utilisateur = utilisateurRepository.findById(utilisateurId)
            .orElseThrow(() -> new IllegalArgumentException("Utilisateur non trouvé"));

        String donneesConges = toolsService.getCongesSemaine();

        List<RapportResponse.RapportSection> sections = new ArrayList<>();
        sections.add(RapportResponse.RapportSection.builder()
            .titre("Congés de la Semaine")
            .contenu(donneesConges)
            .build());

        String resumeIA = genererResumeIA("Voici les données des congés approuvés pour la semaine en cours. Génère un résumé professionnel des absences:\n\n" + donneesConges);

        return RapportResponse.builder()
            .titre("Rapport - Congés de la Semaine")
            .dateGeneration(LocalDateTime.now())
            .sections(sections)
            .resumeIA(resumeIA)
            .build();
    }

    /**
     * Génère un rapport sur les congés d'une période donnée
     */
    public RapportResponse genererRapportCongesPeriode(LocalDate debut, LocalDate fin, Long utilisateurId) {
        Utilisateur utilisateur = utilisateurRepository.findById(utilisateurId)
            .orElseThrow(() -> new IllegalArgumentException("Utilisateur non trouvé"));

        Long entrepriseId = utilisateur.getEntreprise() != null ? 
            utilisateur.getEntreprise().getId() : null;

        if (entrepriseId == null) {
            throw new IllegalArgumentException("L'utilisateur n'est pas assigné à une entreprise");
        }

        String donneesConges = toolsService.getRapportCongesParPeriode(debut, fin, entrepriseId);

        List<RapportResponse.RapportSection> sections = new ArrayList<>();
        sections.add(RapportResponse.RapportSection.builder()
            .titre("Congés de la Période: " + debut + " à " + fin)
            .contenu(donneesConges)
            .build());

        String resumeIA = genererResumeIA("Voici les données des congés approuvés pour la période " + debut + " à " + fin + ". Génère un résumé analytique:\n\n" + donneesConges);

        return RapportResponse.builder()
            .titre("Rapport - Congés (" + debut + " à " + fin + ")")
            .dateGeneration(LocalDateTime.now())
            .sections(sections)
            .resumeIA(resumeIA)
            .build();
    }

    /**
     * Génère un rapport sur le taux d'absences des chauffeurs
     */
    public RapportResponse genererRapportTauxAbsences(int mois, int annee, Long utilisateurId) {
        Utilisateur utilisateur = utilisateurRepository.findById(utilisateurId)
            .orElseThrow(() -> new IllegalArgumentException("Utilisateur non trouvé"));

        Long entrepriseId = utilisateur.getEntreprise() != null ? 
            utilisateur.getEntreprise().getId() : null;

        if (entrepriseId == null) {
            throw new IllegalArgumentException("L'utilisateur n'est pas assigné à une entreprise");
        }

        String donneesTaux = toolsService.getTauxAbsencesChauffeurs(mois, annee, entrepriseId);

        List<RapportResponse.RapportSection> sections = new ArrayList<>();
        sections.add(RapportResponse.RapportSection.builder()
            .titre(String.format("Taux d'Absence - %02d/%d", mois, annee))
            .contenu(donneesTaux)
            .build());

        String resumeIA = genererResumeIA("Voici le taux d'absence des chauffeurs pour " + String.format("%02d/%d", mois, annee) + ". Analyse les chauffeurs les plus absents et fournis des recommandations:\n\n" + donneesTaux);

        return RapportResponse.builder()
            .titre(String.format("Rapport - Taux d'Absence (%02d/%d)", mois, annee))
            .dateGeneration(LocalDateTime.now())
            .sections(sections)
            .resumeIA(resumeIA)
            .build();
    }

    /**
     * Génère un rapport sur les réclamations
     */
    public RapportResponse genererRapportReclamations(Long utilisateurId) {
        Utilisateur utilisateur = utilisateurRepository.findById(utilisateurId)
            .orElseThrow(() -> new IllegalArgumentException("Utilisateur non trouvé"));

        Long entrepriseId = utilisateur.getEntreprise() != null ? 
            utilisateur.getEntreprise().getId() : null;

        if (entrepriseId == null) {
            throw new IllegalArgumentException("L'utilisateur n'est pas assigné à une entreprise");
        }

        String donneesReclamations = toolsService.getResumeReclamations(entrepriseId);

        List<RapportResponse.RapportSection> sections = new ArrayList<>();
        sections.add(RapportResponse.RapportSection.builder()
            .titre("Résumé des Réclamations")
            .contenu(donneesReclamations)
            .build());

        String resumeIA = genererResumeIA("Voici le résumé des réclamations. Analyse la situation et fournis des recommandations pour améliorer le taux de résolution:\n\n" + donneesReclamations);

        return RapportResponse.builder()
            .titre("Rapport - Réclamations")
            .dateGeneration(LocalDateTime.now())
            .sections(sections)
            .resumeIA(resumeIA)
            .build();
    }

    /**
     * Génère un rapport complet sur les véhicules
     */
    public RapportResponse genererRapportVehicules(Long utilisateurId) {
        Utilisateur utilisateur = utilisateurRepository.findById(utilisateurId)
            .orElseThrow(() -> new IllegalArgumentException("Utilisateur non trouvé"));

        Long entrepriseId = utilisateur.getEntreprise() != null ? 
            utilisateur.getEntreprise().getId() : null;

        if (entrepriseId == null) {
            throw new IllegalArgumentException("L'utilisateur n'est pas assigné à une entreprise");
        }

        String donneesVehicules = toolsService.getRapportVehicules(entrepriseId);
        String vehiculesEnMaintenance = toolsService.getVehiculesEnMaintenance(entrepriseId);

        List<RapportResponse.RapportSection> sections = new ArrayList<>();
        sections.add(RapportResponse.RapportSection.builder()
            .titre("Résumé Général")
            .contenu(donneesVehicules)
            .build());
        sections.add(RapportResponse.RapportSection.builder()
            .titre("Véhicules en Maintenance")
            .contenu(vehiculesEnMaintenance)
            .build());

        String resumeIA = genererResumeIA("Voici les données complètes sur la flotte de véhicules. Analyse l'état du parc et fournis des recommandations:\n\n" + donneesVehicules + "\n" + vehiculesEnMaintenance);

        return RapportResponse.builder()
            .titre("Rapport - Véhicules")
            .dateGeneration(LocalDateTime.now())
            .sections(sections)
            .resumeIA(resumeIA)
            .build();
    }

    /**
     * Génère un rapport complet sur les trajets d'une période
     */
    public RapportResponse genererRapportTrajets(LocalDate debut, LocalDate fin, Long utilisateurId) {
        Utilisateur utilisateur = utilisateurRepository.findById(utilisateurId)
            .orElseThrow(() -> new IllegalArgumentException("Utilisateur non trouvé"));

        Long entrepriseId = utilisateur.getEntreprise() != null ? 
            utilisateur.getEntreprise().getId() : null;

        if (entrepriseId == null) {
            throw new IllegalArgumentException("L'utilisateur n'est pas assigné à une entreprise");
        }

        String donneesRapportTrajets = toolsService.getRapportTrajets(debut, fin, entrepriseId);
        String trajetsEnCours = toolsService.getTrajetsEnCoursParSecteur(entrepriseId);

        List<RapportResponse.RapportSection> sections = new ArrayList<>();
        sections.add(RapportResponse.RapportSection.builder()
            .titre("Rapport Complet: " + debut + " à " + fin)
            .contenu(donneesRapportTrajets)
            .build());
        sections.add(RapportResponse.RapportSection.builder()
            .titre("Trajets en Cours par Secteur")
            .contenu(trajetsEnCours)
            .build());

        String resumeIA = genererResumeIA("Voici les données complètes sur les trajets pour la période " + debut + " à " + fin + ". Analyse la performance et fournis des recommandations:\n\n" + donneesRapportTrajets + "\n" + trajetsEnCours);

        return RapportResponse.builder()
            .titre("Rapport - Trajets (" + debut + " à " + fin + ")")
            .dateGeneration(LocalDateTime.now())
            .sections(sections)
            .resumeIA(resumeIA)
            .build();
    }

    /**
     * Génère un rapport global sur toutes les gestions
     */
    public RapportResponse genererRapportGlobal(Long utilisateurId) {
        Utilisateur utilisateur = utilisateurRepository.findById(utilisateurId)
            .orElseThrow(() -> new IllegalArgumentException("Utilisateur non trouvé"));

        Long entrepriseId = utilisateur.getEntreprise() != null ? 
            utilisateur.getEntreprise().getId() : null;

        if (entrepriseId == null) {
            throw new IllegalArgumentException("L'utilisateur n'est pas assigné à une entreprise");
        }

        String statsGlobales = toolsService.getStatistiquesGlobales(entrepriseId);
        String congesSemaine = toolsService.getCongesSemaine();
        String reclamations = toolsService.getResumeReclamations(entrepriseId);
        String vehicules = toolsService.getRapportVehicules(entrepriseId);
        String trajets = toolsService.getTrajetsEnCoursParSecteur(entrepriseId);

        List<RapportResponse.RapportSection> sections = new ArrayList<>();
        sections.add(RapportResponse.RapportSection.builder()
            .titre("Statistiques Globales")
            .contenu(statsGlobales)
            .build());
        sections.add(RapportResponse.RapportSection.builder()
            .titre("Congés de la Semaine")
            .contenu(congesSemaine)
            .build());
        sections.add(RapportResponse.RapportSection.builder()
            .titre("Réclamations")
            .contenu(reclamations)
            .build());
        sections.add(RapportResponse.RapportSection.builder()
            .titre("Véhicules")
            .contenu(vehicules)
            .build());
        sections.add(RapportResponse.RapportSection.builder()
            .titre("Trajets en Cours")
            .contenu(trajets)
            .build());

        String resumeIA = genererResumeIA("Voici un résumé global de toutes les opérations Logiway. Fournis un bilan général de la situation de l'entreprise:\n\n" + statsGlobales);

        return RapportResponse.builder()
            .titre("Rapport Global - Bilan Complet")
            .dateGeneration(LocalDateTime.now())
            .sections(sections)
            .resumeIA(resumeIA)
            .build();
    }

    /**
     * Génère un résumé IA pour un rapport via Gemini
     * Si le service est indisponible, retourne une chaîne vide
     */
    private String genererResumeIA(String prompt) {
        try {
            return geminiService.appelerServiceRAG(prompt, "system", null);
        } catch (Exception e) {
            log.warn("Impossible de générer le résumé IA: {}", e.getMessage());
            return "";
        }
    }
}
