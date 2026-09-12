package com.logiway.services;

import com.logiway.entities.Chauffeur;
import com.logiway.entities.Conge;
import com.logiway.entities.Reclamation;

import com.logiway.entities.Trajet;
import com.logiway.entities.Utilisateur;
import com.logiway.entities.Vehicule;
import com.logiway.entities.enums.PrioriteReclamation;
import com.logiway.entities.enums.StatutChauffeur;
import com.logiway.entities.enums.StatutConge;
import com.logiway.entities.enums.StatutReclamation;
import com.logiway.entities.enums.StatutTrajet;
import com.logiway.entities.enums.StatutVehicule;
import com.logiway.repositories.ChauffeurRepository;
import com.logiway.repositories.CongeRepository;
import com.logiway.repositories.ReclamationRepository;
import com.logiway.repositories.TrajetRepository;
import com.logiway.repositories.UtilisateurRepository;
import com.logiway.repositories.VehiculeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("Service ChatbotTools — Tests Unitaires")
class ChatbotToolsServiceTest {

    @Mock
    private ChauffeurRepository chauffeurRepository;
    @Mock
    private VehiculeRepository vehiculeRepository;
    @Mock
    private TrajetRepository trajetRepository;
    @Mock
    private CongeRepository congeRepository;
    @Mock
    private ReclamationRepository reclamationRepository;
    @Mock
    private UtilisateurRepository utilisateurRepository;

    private ChatbotToolsService service;

    @BeforeEach
    void setUp() {
        service = new ChatbotToolsService(chauffeurRepository, vehiculeRepository, trajetRepository,
            congeRepository, reclamationRepository, utilisateurRepository);
    }

    private Chauffeur chauffeur(String prenom, String nom) {
        return Chauffeur.builder()
            .prenom(prenom)
            .nom(nom)
            .statutConducteur(StatutChauffeur.LIBRE)
            .build();
    }

    private Conge conge(Long id, StatutConge statut, LocalDate debut, LocalDate fin, Chauffeur chauffeur) {
        return Conge.builder()
            .id(id)
            .statut(statut)
            .dateDebut(debut)
            .dateFin(fin)
            .type(com.logiway.entities.enums.TypeConge.VACANCES)
            .chauffeur(chauffeur)
            .build();
    }

    private Reclamation reclamation(Long id, StatutReclamation statut, PrioriteReclamation priorite, String sujet) {
        return Reclamation.builder()
            .id(id)
            .statut(statut)
            .priorite(priorite)
            .sujet(sujet)
            .build();
    }

    private Vehicule vehicule(StatutVehicule statut, String marque, String modele, String matricule) {
        return Vehicule.builder()
            .marque(marque)
            .modele(modele)
            .matricule(matricule)
            .statut(statut)
            .build();
    }

    private Trajet trajet(StatutTrajet statut, LocalDateTime dateDepart, Double distanceKm, String depart, String dest) {
        return Trajet.builder()
            .statut(statut)
            .dateDepart(dateDepart)
            .distanceKm(distanceKm)
            .pointDepart(depart)
            .destination(dest)
            .build();
    }

    @Test
    @DisplayName("getStatistiquesGlobales() → reflète les compteurs des repositories")
    void getStatistiquesGlobales_returnsCounts() {
        when(chauffeurRepository.count()).thenReturn(10L);
        when(vehiculeRepository.count()).thenReturn(7L);
        when(trajetRepository.count()).thenReturn(5L);
        when(reclamationRepository.count()).thenReturn(3L);
        when(congeRepository.count()).thenReturn(2L);
        when(utilisateurRepository.count()).thenReturn(12L);

        String result = service.getStatistiquesGlobales(1L);

        assertThat(result).contains("Chauffeurs: 10", "Véhicules: 7", "Trajets: 5",
            "Réclamations: 3", "Congés: 2", "Utilisateurs: 12");
    }

    @Test
    @DisplayName("getStatistiquesGlobales() → exception → message d'erreur")
    void getStatistiquesGlobales_exception_returnsError() {
        when(chauffeurRepository.count()).thenThrow(new RuntimeException("db down"));

        assertThat(service.getStatistiquesGlobales(1L))
            .contains("Erreur lors de la récupération des statistiques globales");
    }

    @Test
    @DisplayName("getCongesEnAttente() → aucun → message positif")
    void getCongesEnAttente_empty_returnsPositive() {
        when(congeRepository.findAll()).thenReturn(List.of());

        assertThat(service.getCongesEnAttente(1L))
            .isEqualTo("✅ Aucun congé en attente de validation.");
    }

    @Test
    @DisplayName("getCongesEnAttente() → congés présents → liste avec chauffeurs")
    void getCongesEnAttente_withConges_listsChauffeurs() {
        Conge c = conge(1L, StatutConge.EN_ATTENTE, LocalDate.of(2026, 8, 1), LocalDate.of(2026, 8, 3),
            chauffeur("Jean", "Dupont"));

        when(congeRepository.findAll()).thenReturn(List.of(c));

        String result = service.getCongesEnAttente(1L);

        assertThat(result).contains("CONGÉS EN ATTENTE (1)", "Jean Dupont", "2026-08-01", "2026-08-03");
    }

    @Test
    @DisplayName("getCongesEnAttente() → ignore les congés non EN_ATTENTE")
    void getCongesEnAttente_ignoresApproved() {
        Conge approuve = conge(1L, StatutConge.APPROUVE, LocalDate.now(), LocalDate.now(), null);
        when(congeRepository.findAll()).thenReturn(List.of(approuve));

        assertThat(service.getCongesEnAttente(1L))
            .isEqualTo("✅ Aucun congé en attente de validation.");
    }

    @Test
    @DisplayName("getCongesSemaine() → aucun → message positif")
    void getCongesSemaine_empty_returnsPositive() {
        when(congeRepository.findAll()).thenReturn(List.of());

        assertThat(service.getCongesSemaine())
            .isEqualTo("✅ Aucun congé programmé cette semaine.");
    }

    @Test
    @DisplayName("getRapportCongesParPeriode() → regroupe par statut")
    void getRapportCongesParPeriode_groupsByStatut() {
        LocalDate debut = LocalDate.of(2026, 1, 1);
        LocalDate fin = LocalDate.of(2026, 12, 31);
        Conge enAttente = conge(1L, StatutConge.EN_ATTENTE, LocalDate.of(2026, 3, 1), LocalDate.of(2026, 3, 2), null);
        Conge approuve1 = conge(2L, StatutConge.APPROUVE, LocalDate.of(2026, 4, 1), LocalDate.of(2026, 4, 2), null);
        Conge approuve2 = conge(3L, StatutConge.APPROUVE, LocalDate.of(2026, 5, 1), LocalDate.of(2026, 5, 2), null);
        Conge horsPeriode = conge(4L, StatutConge.APPROUVE, LocalDate.of(2027, 5, 1), LocalDate.of(2027, 5, 2), null);

        when(congeRepository.findAll()).thenReturn(List.of(enAttente, approuve1, approuve2, horsPeriode));

        String result = service.getRapportCongesParPeriode(debut, fin, 1L);

        assertThat(result).contains("Total: 3 congé(s)", "EN_ATTENTE: 1", "APPROUVE: 2");
    }

    @Test
    @DisplayName("getReclamationsOuvertes() → aucune → message positif")
    void getReclamationsOuvertes_empty_returnsPositive() {
        when(reclamationRepository.findAll()).thenReturn(List.of());

        assertThat(service.getReclamationsOuvertes())
            .isEqualTo("✅ Aucune réclamation ouverte.");
    }

    @Test
    @DisplayName("getReclamationsOuvertes() → EN_COURS → liste avec sujet et priorité")
    void getReclamationsOuvertes_withReclamations_listsSujets() {
        Reclamation r = reclamation(1L, StatutReclamation.EN_COURS, PrioriteReclamation.URGENT, "Retard de livraison");
        when(reclamationRepository.findAll()).thenReturn(List.of(r));

        String result = service.getReclamationsOuvertes();

        assertThat(result).contains("RÉCLAMATIONS OUVERTES (1)", "Retard de livraison", "URGENT");
    }

    @Test
    @DisplayName("getResumeReclamations() → regroupe par statut")
    void getResumeReclamations_groupsByStatut() {
        Reclamation r1 = reclamation(1L, StatutReclamation.EN_COURS, PrioriteReclamation.URGENT, "S1");
        Reclamation r2 = reclamation(2L, StatutReclamation.RESOLU, PrioriteReclamation.NORMAL, "S2");
        Reclamation r3 = reclamation(3L, StatutReclamation.RESOLU, PrioriteReclamation.NORMAL, "S3");

        when(reclamationRepository.findAll()).thenReturn(List.of(r1, r2, r3));

        String result = service.getResumeReclamations(1L);

        assertThat(result).contains("Total: 3 réclamation(s)", "EN_COURS: 1", "RESOLU: 2");
    }

    @Test
    @DisplayName("getVehiculesEnMaintenance() → aucun → message positif")
    void getVehiculesEnMaintenance_empty_returnsPositive() {
        when(vehiculeRepository.findAll()).thenReturn(List.of());

        assertThat(service.getVehiculesEnMaintenance(1L))
            .isEqualTo("✅ Aucun véhicule en maintenance.");
    }

    @Test
    @DisplayName("getVehiculesEnMaintenance() → véhicules présents → marque/modele/matricule")
    void getVehiculesEnMaintenance_withVehicules_listsDetails() {
        Vehicule v = vehicule(StatutVehicule.EN_MAINTENANCE, "Renault", "Kangoo", "AB-123-CD");
        when(vehiculeRepository.findAll()).thenReturn(List.of(v));

        String result = service.getVehiculesEnMaintenance(1L);

        assertThat(result).contains("VÉHICULES EN MAINTENANCE (1)", "Renault", "Kangoo", "AB-123-CD");
    }

    @Test
    @DisplayName("getVehiculesEnMaintenance() → ignore les véhicules EN_SERVICE")
    void getVehiculesEnMaintenance_ignoresInService() {
        Vehicule v = vehicule(StatutVehicule.EN_SERVICE, "Renault", "Kangoo", "AB-123-CD");
        when(vehiculeRepository.findAll()).thenReturn(List.of(v));

        assertThat(service.getVehiculesEnMaintenance(1L))
            .isEqualTo("✅ Aucun véhicule en maintenance.");
    }

    @Test
    @DisplayName("getRapportVehicules() → regroupe par statut")
    void getRapportVehicules_groupsByStatut() {
        Vehicule v1 = vehicule(StatutVehicule.EN_SERVICE, "A", "B", "1");
        Vehicule v2 = vehicule(StatutVehicule.EN_MAINTENANCE, "C", "D", "2");
        Vehicule v3 = vehicule(StatutVehicule.EN_MAINTENANCE, "E", "F", "3");

        when(vehiculeRepository.findAll()).thenReturn(List.of(v1, v2, v3));

        String result = service.getRapportVehicules(1L);

        assertThat(result).contains("Total: 3 véhicule(s)", "EN_SERVICE: 1", "EN_MAINTENANCE: 2");
    }

    @Test
    @DisplayName("getChauffeursDisponibles() → aucun statut DISPONIBLE → message")
    void getChauffeursDisponibles_noAvailable_returnsMessage() {
        Chauffeur c = chauffeur("Jean", "Dupont");
        when(chauffeurRepository.findAll()).thenReturn(List.of(c));

        String result = service.getChauffeursDisponibles(1L);

        assertThat(result).contains("CHAUFFEURS DISPONIBLES (0)", "Aucun chauffeur disponible actuellement");
    }

    @Test
    @DisplayName("getChauffeursDisponibles() → exception → message d'erreur")
    void getChauffeursDisponibles_exception_returnsError() {
        when(chauffeurRepository.findAll()).thenThrow(new RuntimeException("db down"));

        assertThat(service.getChauffeursDisponibles(1L))
            .contains("Erreur lors de la récupération des chauffeurs disponibles");
    }

    @Test
    @DisplayName("getTrajetsEnCoursParSecteur() → aucun → message positif")
    void getTrajetsEnCoursParSecteur_empty_returnsPositive() {
        when(trajetRepository.findAll()).thenReturn(List.of());

        assertThat(service.getTrajetsEnCoursParSecteur(1L))
            .isEqualTo("✅ Aucun trajet en cours.");
    }

    @Test
    @DisplayName("getTrajetsEnCoursParSecteur() → trajets présents → point départ/destination")
    void getTrajetsEnCoursParSecteur_withTrajets_listsRoutes() {
        Trajet t = trajet(StatutTrajet.EN_COURS, LocalDateTime.now(), 10.0, "Paris", "Lyon");
        when(trajetRepository.findAll()).thenReturn(List.of(t));

        String result = service.getTrajetsEnCoursParSecteur(1L);

        assertThat(result).contains("TRAJETS EN COURS (1)", "Paris → Lyon");
    }

    @Test
    @DisplayName("getRapportTrajets() → filtre la période et somme les distances")
    void getRapportTrajets_filtersPeriodAndSumsDistances() {
        LocalDate debut = LocalDate.of(2026, 6, 1);
        LocalDate fin = LocalDate.of(2026, 6, 30);
        Trajet dedans1 = trajet(StatutTrajet.COMPLETE, LocalDateTime.of(2026, 6, 10, 8, 0), 100.0, "A", "B");
        Trajet dedans2 = trajet(StatutTrajet.EN_COURS, LocalDateTime.of(2026, 6, 15, 8, 0), 50.0, "C", "D");
        Trajet dehors = trajet(StatutTrajet.COMPLETE, LocalDateTime.of(2026, 7, 1, 8, 0), 999.0, "E", "F");

        when(trajetRepository.findAll()).thenReturn(List.of(dedans1, dedans2, dehors));

        String result = service.getRapportTrajets(debut, fin, 1L);

        assertThat(result).contains("Total: 2 trajet(s)", "Distance totale: 150",
            "COMPLETE: 1", "EN_COURS: 1");
    }

    @Test
    @DisplayName("getTauxAbsencesChauffeurs() → calcule le pourcentage d'absences")
    void getTauxAbsencesChauffeurs_computesRate() {
        LocalDate debut = LocalDate.of(2026, 3, 1);
        LocalDate fin = LocalDate.of(2026, 3, 31);
        Chauffeur c1 = chauffeur("A", "B");
        Chauffeur c2 = chauffeur("C", "D");
        Conge c1Conge = conge(1L, StatutConge.APPROUVE, debut.plusDays(1), debut.plusDays(2), c1);
        Conge c2Conge = conge(2L, StatutConge.APPROUVE, fin.minusDays(1), fin, c2);
        Conge rejete = conge(3L, StatutConge.REJETE, debut, debut, c1);

        when(congeRepository.findAll()).thenReturn(List.of(c1Conge, c2Conge, rejete));
        when(chauffeurRepository.count()).thenReturn(4L);

        String result = service.getTauxAbsencesChauffeurs(3, 2026, 1L);

        assertThat(result).contains("TAUX D'ABSENCES", "Total chauffeurs: 4",
            "Chauffeurs en congé: 2", "Taux d'absence: 50");
    }

    @Test
    @DisplayName("getRapportTrajets() → exception → message d'erreur")
    void getRapportTrajets_exception_returnsError() {
        when(trajetRepository.findAll()).thenThrow(new RuntimeException("db down"));

        assertThat(service.getRapportTrajets(LocalDate.now(), LocalDate.now(), 1L))
            .contains("Erreur lors de la génération du rapport des trajets");
    }

    @Test
    @DisplayName("getRapportVehicules() → exception → message d'erreur")
    void getRapportVehicules_exception_returnsError() {
        when(vehiculeRepository.findAll()).thenThrow(new RuntimeException("db down"));

        assertThat(service.getRapportVehicules(1L))
            .contains("Erreur lors de la génération du rapport des véhicules");
    }

    @Test
    @DisplayName("getCongesSemaine() → congés de la semaine → liste avec détails")
    void getCongesSemaine_withConges_listsDetails() {
        LocalDate today = LocalDate.now();
        Conge c = conge(1L, StatutConge.APPROUVE, today, today, chauffeur("Jean", "Dupont"));

        when(congeRepository.findAll()).thenReturn(List.of(c));

        String result = service.getCongesSemaine();

        assertThat(result).contains("CONGÉS SEMAINE", "Jean Dupont", "VACANCES", "APPROUVE");
    }

    @Test
    @DisplayName("getCongesSemaine() → ignore les congés hors semaine")
    void getCongesSemaine_ignoresOtherWeeks() {
        Conge ancien = conge(1L, StatutConge.APPROUVE,
            LocalDate.of(2020, 1, 1), LocalDate.of(2020, 1, 2), null);

        when(congeRepository.findAll()).thenReturn(List.of(ancien));

        assertThat(service.getCongesSemaine())
            .isEqualTo("✅ Aucun congé programmé cette semaine.");
    }

    @Test
    @DisplayName("getCongesSemaine() → exception → message d'erreur")
    void getCongesSemaine_exception_returnsError() {
        when(congeRepository.findAll()).thenThrow(new RuntimeException("db down"));

        assertThat(service.getCongesSemaine())
            .contains("Erreur lors de la récupération des congés de la semaine");
    }

    @Test
    @DisplayName("getCongesEnAttente() → chauffeur null → affiche N/A")
    void getCongesEnAttente_nullChauffeur_showsNa() {
        Conge c = conge(1L, StatutConge.EN_ATTENTE,
            LocalDate.of(2026, 8, 1), LocalDate.of(2026, 8, 3), null);

        when(congeRepository.findAll()).thenReturn(List.of(c));

        String result = service.getCongesEnAttente(1L);

        assertThat(result).contains("N/A");
    }

    @Test
    @DisplayName("getCongesEnAttente() → exception → message d'erreur")
    void getCongesEnAttente_exception_returnsError() {
        when(congeRepository.findAll()).thenThrow(new RuntimeException("db down"));

        assertThat(service.getCongesEnAttente(1L))
            .contains("Erreur lors de la récupération des congés en attente");
    }

    @Test
    @DisplayName("getRapportCongesParPeriode() → exception → message d'erreur")
    void getRapportCongesParPeriode_exception_returnsError() {
        when(congeRepository.findAll()).thenThrow(new RuntimeException("db down"));

        assertThat(service.getRapportCongesParPeriode(LocalDate.now(), LocalDate.now(), 1L))
            .contains("Erreur lors de la génération du rapport des congés");
    }

    @Test
    @DisplayName("getReclamationsOuvertes() → exception → message d'erreur")
    void getReclamationsOuvertes_exception_returnsError() {
        when(reclamationRepository.findAll()).thenThrow(new RuntimeException("db down"));

        assertThat(service.getReclamationsOuvertes())
            .contains("Erreur lors de la récupération des réclamations ouvertes");
    }

    @Test
    @DisplayName("getResumeReclamations() → exception → message d'erreur")
    void getResumeReclamations_exception_returnsError() {
        when(reclamationRepository.findAll()).thenThrow(new RuntimeException("db down"));

        assertThat(service.getResumeReclamations(1L))
            .contains("Erreur lors de la génération du résumé des réclamations");
    }

    @Test
    @DisplayName("getVehiculesEnMaintenance() → exception → message d'erreur")
    void getVehiculesEnMaintenance_exception_returnsError() {
        when(vehiculeRepository.findAll()).thenThrow(new RuntimeException("db down"));

        assertThat(service.getVehiculesEnMaintenance(1L))
            .contains("Erreur lors de la récupération des véhicules en maintenance");
    }

    @Test
    @DisplayName("getTrajetsEnCoursParSecteur() → chauffeur null → affiche N/A")
    void getTrajetsEnCoursParSecteur_nullChauffeur_showsNa() {
        Trajet t = trajet(StatutTrajet.EN_COURS, LocalDateTime.now(), 10.0, "Paris", "Lyon");
        when(trajetRepository.findAll()).thenReturn(List.of(t));

        String result = service.getTrajetsEnCoursParSecteur(1L);

        assertThat(result).contains("Paris → Lyon (Chauffeur: N/A)");
    }

    @Test
    @DisplayName("getTrajetsEnCoursParSecteur() → exception → message d'erreur")
    void getTrajetsEnCoursParSecteur_exception_returnsError() {
        when(trajetRepository.findAll()).thenThrow(new RuntimeException("db down"));

        assertThat(service.getTrajetsEnCoursParSecteur(1L))
            .contains("Erreur lors de la récupération des trajets en cours");
    }

    @Test
    @DisplayName("getTauxAbsencesChauffeurs() → même chauffeur deux fois → distinct compté une fois")
    void getTauxAbsencesChauffeurs_distinctChauffeur() {
        LocalDate debut = LocalDate.of(2026, 3, 1);
        Chauffeur c = chauffeur("A", "B");
        Conge c1 = conge(1L, StatutConge.APPROUVE, debut.plusDays(1), debut.plusDays(2), c);
        Conge c2 = conge(2L, StatutConge.APPROUVE, debut.plusDays(5), debut.plusDays(6), c);

        when(congeRepository.findAll()).thenReturn(List.of(c1, c2));
        when(chauffeurRepository.count()).thenReturn(4L);

        String result = service.getTauxAbsencesChauffeurs(3, 2026, 1L);

        assertThat(result).contains("Chauffeurs en congé: 1", "Taux d'absence: 25");
    }

    @Test
    @DisplayName("getTauxAbsencesChauffeurs() → aucun chauffeur → taux 0")
    void getTauxAbsencesChauffeurs_noChauffeurs_zeroRate() {
        LocalDate debut = LocalDate.of(2026, 3, 1);
        Conge c = conge(1L, StatutConge.APPROUVE, debut, debut, chauffeur("A", "B"));

        when(congeRepository.findAll()).thenReturn(List.of(c));
        when(chauffeurRepository.count()).thenReturn(0L);

        String result = service.getTauxAbsencesChauffeurs(3, 2026, 1L);

        assertThat(result).contains("Total chauffeurs: 0", "Taux d'absence: 0");
    }

    @Test
    @DisplayName("getTauxAbsencesChauffeurs() → exception → message d'erreur")
    void getTauxAbsencesChauffeurs_exception_returnsError() {
        when(congeRepository.findAll()).thenThrow(new RuntimeException("db down"));

        assertThat(service.getTauxAbsencesChauffeurs(3, 2026, 1L))
            .contains("Erreur lors du calcul du taux d'absences");
    }

    @Test
    @DisplayName("getCongesSemaine() → chauffeur null, statut et type divers")
    void getCongesSemaine_edgeCases() {
        LocalDate today = LocalDate.now();
        // Conge current week, null chauffeur
        Conge c1 = conge(1L, StatutConge.APPROUVE, today, today, null);
        when(congeRepository.findAll()).thenReturn(List.of(c1));

        String result = service.getCongesSemaine();
        assertThat(result).contains("N/A");
    }

    @Test
    @DisplayName("getRapportCongesParPeriode() → dates de congés hors limites")
    void getRapportCongesParPeriode_dateBoundaries() {
        LocalDate start = LocalDate.of(2026, 6, 1);
        LocalDate end = LocalDate.of(2026, 6, 30);
        // c.getDateDebut().isAfter(dateFin)
        Conge c1 = conge(1L, StatutConge.APPROUVE, start.plusMonths(1), start.plusMonths(2), null);
        // c.getDateFin().isBefore(dateDebut)
        Conge c2 = conge(2L, StatutConge.APPROUVE, start.minusMonths(2), start.minusMonths(1), null);

        when(congeRepository.findAll()).thenReturn(List.of(c1, c2));
        String result = service.getRapportCongesParPeriode(start, end, 1L);
        assertThat(result).contains("Total: 0 congé(s)");
    }

    @Test
    @DisplayName("getReclamationsOuvertes() → priorité null")
    void getReclamationsOuvertes_nullPriorite() {
        Reclamation r = reclamation(1L, StatutReclamation.EN_COURS, null, "Sujet");
        when(reclamationRepository.findAll()).thenReturn(List.of(r));

        String result = service.getReclamationsOuvertes();
        assertThat(result).contains("[NORMALE] Sujet");
    }

    @Test
    @DisplayName("getChauffeursDisponibles() → conducteurs disponibles avec et sans secteur, et statutConducteur null")
    void getChauffeursDisponibles_variousChauffeurs() {
        Chauffeur c1 = org.mockito.Mockito.mock(Chauffeur.class);
        when(c1.getPrenom()).thenReturn("Jean");
        when(c1.getNom()).thenReturn("Dupont");
        StatutChauffeur mockStatut1 = org.mockito.Mockito.mock(StatutChauffeur.class);
        when(mockStatut1.toString()).thenReturn("DISPONIBLE");
        when(c1.getStatutConducteur()).thenReturn(mockStatut1);
        when(c1.getSecteur()).thenReturn(com.logiway.entities.Secteur.builder().nom("Nord").build());

        Chauffeur c2 = org.mockito.Mockito.mock(Chauffeur.class);
        when(c2.getPrenom()).thenReturn("Marc");
        when(c2.getNom()).thenReturn("Durand");
        StatutChauffeur mockStatut2 = org.mockito.Mockito.mock(StatutChauffeur.class);
        when(mockStatut2.toString()).thenReturn("DISPONIBLE");
        when(c2.getStatutConducteur()).thenReturn(mockStatut2);
        when(c2.getSecteur()).thenReturn(null);

        Chauffeur c3 = org.mockito.Mockito.mock(Chauffeur.class);
        when(c3.getStatutConducteur()).thenReturn(null); // null statut

        when(chauffeurRepository.findAll()).thenReturn(List.of(c1, c2, c3));

        String result = service.getChauffeursDisponibles(1L);
        assertThat(result).contains("Jean Dupont (Secteur: Nord)", "Marc Durand (Secteur: N/A)");
    }

    @Test
    @DisplayName("getTrajetsEnCoursParSecteur() → chauffeur non null")
    void getTrajetsEnCoursParSecteur_nonNullChauffeur() {
        Trajet t = trajet(StatutTrajet.EN_COURS, LocalDateTime.now(), 10.0, "A", "B");
        t.setChauffeur(chauffeur("Jean", "Dupont"));
        when(trajetRepository.findAll()).thenReturn(List.of(t));

        String result = service.getTrajetsEnCoursParSecteur(1L);
        assertThat(result).contains("A → B (Chauffeur: Jean Dupont)");
    }

    @Test
    @DisplayName("getRapportTrajets() → dateDepart null, hors période, distanceKm null")
    void getRapportTrajets_variousTrajets() {
        LocalDate start = LocalDate.of(2026, 6, 1);
        LocalDate end = LocalDate.of(2026, 6, 30);

        Trajet t1 = trajet(StatutTrajet.COMPLETE, null, 10.0, "A", "B"); // null dateDepart
        Trajet t2 = trajet(StatutTrajet.COMPLETE, start.minusDays(5).atStartOfDay(), 10.0, "A", "B"); // before
        Trajet t3 = trajet(StatutTrajet.COMPLETE, end.plusDays(5).atStartOfDay(), 10.0, "A", "B"); // after
        Trajet t4 = trajet(StatutTrajet.COMPLETE, start.plusDays(2).atStartOfDay(), null, "A", "B"); // null distanceKm

        when(trajetRepository.findAll()).thenReturn(List.of(t1, t2, t3, t4));

        String result = service.getRapportTrajets(start, end, 1L);
        assertThat(result).contains("Total: 1 trajet(s)", "Distance totale: 0,00");
    }

    @Test
    @DisplayName("getTauxAbsencesChauffeurs() → congés hors période, statut non APPROUVE")
    void getTauxAbsencesChauffeurs_variousConges() {
        LocalDate start = LocalDate.of(2026, 3, 1);
        LocalDate end = start.withDayOfMonth(start.lengthOfMonth());
        Chauffeur c = chauffeur("A", "B");

        Conge c1 = conge(1L, StatutConge.EN_ATTENTE, start, end, c); // non APPROUVE
        Conge c2 = conge(2L, StatutConge.APPROUVE, start.minusMonths(2), start.minusMonths(1), c); // before
        Conge c3 = conge(3L, StatutConge.APPROUVE, end.plusMonths(1), end.plusMonths(2), c); // after

        when(congeRepository.findAll()).thenReturn(List.of(c1, c2, c3));
        when(chauffeurRepository.count()).thenReturn(1L);

        String result = service.getTauxAbsencesChauffeurs(3, 2026, 1L);
        assertThat(result).contains("Chauffeurs en congé: 0", "Taux d'absence: 0,0%");
    }
}
