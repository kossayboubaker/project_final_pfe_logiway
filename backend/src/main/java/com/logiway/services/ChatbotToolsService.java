package com.logiway.services;

import com.logiway.entities.enums.StatutConge;
import com.logiway.entities.enums.StatutReclamation;
import com.logiway.entities.enums.StatutTrajet;
import com.logiway.entities.enums.StatutVehicule;
import com.logiway.repositories.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.WeekFields;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Service pour extraire les données du système Logiway
 * Utilisé par le chatbot pour accéder aux informations en temps réel
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ChatbotToolsService {

    private final ChauffeurRepository chauffeurRepository;
    private final VehiculeRepository vehiculeRepository;
    private final TrajetRepository trajetRepository;
    private final CongeRepository congeRepository;
    private final ReclamationRepository reclamationRepository;
    private final UtilisateurRepository utilisateurRepository;

    /**
     * Statistiques globales du système
     */
    public String getStatistiquesGlobales(Long entrepriseId) {
        try {
            long totalChauffeurs = chauffeurRepository.count();
            long totalVehicules = vehiculeRepository.count();
            long totalTrajets = trajetRepository.count();
            long totalReclamations = reclamationRepository.count();
            long totalConges = congeRepository.count();
            long totalUtilisateurs = utilisateurRepository.count();

            return String.format(
                "📊 STATISTIQUES GLOBALES LOGIWAY\n" +
                "================================\n" +
                "👤 Chauffeurs: %d\n" +
                "🚗 Véhicules: %d\n" +
                "🛣️ Trajets: %d\n" +
                "📝 Réclamations: %d\n" +
                "🏖️ Congés: %d\n" +
                "👥 Utilisateurs: %d\n",
                totalChauffeurs, totalVehicules, totalTrajets,
                totalReclamations, totalConges, totalUtilisateurs
            );
        } catch (Exception e) {
            log.error("Erreur statistiques globales: {}", e.getMessage(), e);
            return "Erreur lors de la récupération des statistiques globales.";
        }
    }

    /**
     * Congés en attente de validation
     */
    public String getCongesEnAttente(Long entrepriseId) {
        try {
            var conges = congeRepository.findAll().stream()
                .filter(c -> c.getStatut() == StatutConge.EN_ATTENTE)
                .collect(Collectors.toList());
            
            if (conges.isEmpty()) {
                return "✅ Aucun congé en attente de validation.";
            }

            StringBuilder sb = new StringBuilder();
            sb.append(String.format("📋 CONGÉS EN ATTENTE (%d)\n", conges.size()));
            sb.append("================================\n");
            
            conges.forEach(conge -> {
                String nom = conge.getChauffeur() != null ? 
                    conge.getChauffeur().getPrenom() + " " + conge.getChauffeur().getNom() : 
                    "N/A";
                sb.append(String.format("- %s: %s du %s au %s\n",
                    nom,
                    conge.getType(),
                    conge.getDateDebut(),
                    conge.getDateFin()
                ));
            });

            return sb.toString();
        } catch (Exception e) {
            log.error("Erreur congés en attente: {}", e.getMessage(), e);
            return "Erreur lors de la récupération des congés en attente.";
        }
    }

    /**
     * Congés de la semaine en cours
     */
    public String getCongesSemaine() {
        try {
            LocalDate now = LocalDate.now();
            WeekFields weekFields = WeekFields.of(Locale.FRANCE);
            int weekNumber = now.get(weekFields.weekOfWeekBasedYear());
            int year = now.getYear();

            var conges = congeRepository.findAll().stream()
                .filter(c -> {
                    LocalDate debut = c.getDateDebut();
                    LocalDate fin = c.getDateFin();
                    return (debut.getYear() == year || fin.getYear() == year) &&
                           (debut.get(weekFields.weekOfWeekBasedYear()) == weekNumber ||
                            fin.get(weekFields.weekOfWeekBasedYear()) == weekNumber ||
                            (debut.isBefore(now) && fin.isAfter(now)));
                })
                .collect(Collectors.toList());

            if (conges.isEmpty()) {
                return "✅ Aucun congé programmé cette semaine.";
            }

            StringBuilder sb = new StringBuilder();
            sb.append(String.format("📅 CONGÉS SEMAINE %d (%d)\n", weekNumber, conges.size()));
            sb.append("================================\n");
            
            conges.forEach(conge -> {
                String nom = conge.getChauffeur() != null ? 
                    conge.getChauffeur().getPrenom() + " " + conge.getChauffeur().getNom() : 
                    "N/A";
                sb.append(String.format("- %s: %s (%s) du %s au %s\n",
                    nom,
                    conge.getType(),
                    conge.getStatut(),
                    conge.getDateDebut(),
                    conge.getDateFin()
                ));
            });

            return sb.toString();
        } catch (Exception e) {
            log.error("Erreur congés semaine: {}", e.getMessage(), e);
            return "Erreur lors de la récupération des congés de la semaine.";
        }
    }

    /**
     * Rapport des congés sur une période
     */
    public String getRapportCongesParPeriode(LocalDate dateDebut, LocalDate dateFin, Long entrepriseId) {
        try {
            var conges = congeRepository.findAll().stream()
                .filter(c -> !c.getDateDebut().isAfter(dateFin) && !c.getDateFin().isBefore(dateDebut))
                .collect(Collectors.toList());

            Map<StatutConge, Long> parStatut = conges.stream()
                .collect(Collectors.groupingBy(c -> c.getStatut(), Collectors.counting()));

            StringBuilder sb = new StringBuilder();
            sb.append(String.format("📊 RAPPORT CONGÉS (%s à %s)\n", dateDebut, dateFin));
            sb.append("================================\n");
            sb.append(String.format("Total: %d congé(s)\n\n", conges.size()));
            sb.append("Par statut:\n");
            parStatut.forEach((statut, count) -> 
                sb.append(String.format("- %s: %d\n", statut, count))
            );

            return sb.toString();
        } catch (Exception e) {
            log.error("Erreur rapport congés: {}", e.getMessage(), e);
            return "Erreur lors de la génération du rapport des congés.";
        }
    }

    /**
     * Réclamations ouvertes avec priorité haute
     */
    public String getReclamationsOuvertes() {
        try {
            var reclamations = reclamationRepository.findAll().stream()
                .filter(r -> r.getStatut() == StatutReclamation.EN_COURS)
                .collect(Collectors.toList());

            if (reclamations.isEmpty()) {
                return "✅ Aucune réclamation ouverte.";
            }

            StringBuilder sb = new StringBuilder();
            sb.append(String.format("⚠️ RÉCLAMATIONS OUVERTES (%d)\n", reclamations.size()));
            sb.append("================================\n");
            
            reclamations.stream()
                .limit(10)
                .forEach(rec -> {
                    String priorite = rec.getPriorite() != null ? rec.getPriorite().toString() : "NORMALE";
                    sb.append(String.format("- [%s] %s (Statut: %s)\n",
                        priorite,
                        rec.getSujet(),
                        rec.getStatut()
                    ));
                });

            return sb.toString();
        } catch (Exception e) {
            log.error("Erreur réclamations ouvertes: {}", e.getMessage(), e);
            return "Erreur lors de la récupération des réclamations ouvertes.";
        }
    }

    /**
     * Résumé des réclamations
     */
    public String getResumeReclamations(Long entrepriseId) {
        try {
            var reclamations = reclamationRepository.findAll();

            Map<StatutReclamation, Long> parStatut = reclamations.stream()
                .collect(Collectors.groupingBy(r -> r.getStatut(), Collectors.counting()));

            StringBuilder sb = new StringBuilder();
            sb.append(String.format("📊 RÉSUMÉ RÉCLAMATIONS\n"));
            sb.append("================================\n");
            sb.append(String.format("Total: %d réclamation(s)\n\n", reclamations.size()));
            sb.append("Par statut:\n");
            parStatut.forEach((statut, count) -> 
                sb.append(String.format("- %s: %d\n", statut, count))
            );

            return sb.toString();
        } catch (Exception e) {
            log.error("Erreur résumé réclamations: {}", e.getMessage(), e);
            return "Erreur lors de la génération du résumé des réclamations.";
        }
    }

    /**
     * Véhicules en maintenance
     */
    public String getVehiculesEnMaintenance(Long entrepriseId) {
        try {
            var vehicules = vehiculeRepository.findAll().stream()
                .filter(v -> v.getStatut() == StatutVehicule.EN_MAINTENANCE)
                .collect(Collectors.toList());

            if (vehicules.isEmpty()) {
                return "✅ Aucun véhicule en maintenance.";
            }

            StringBuilder sb = new StringBuilder();
            sb.append(String.format("🔧 VÉHICULES EN MAINTENANCE (%d)\n", vehicules.size()));
            sb.append("================================\n");
            
            vehicules.forEach(v -> {
                sb.append(String.format("- %s %s (%s)\n",
                    v.getMarque(),
                    v.getModele(),
                    v.getMatricule()
                ));
            });

            return sb.toString();
        } catch (Exception e) {
            log.error("Erreur véhicules maintenance: {}", e.getMessage(), e);
            return "Erreur lors de la récupération des véhicules en maintenance.";
        }
    }

    /**
     * Rapport des véhicules
     */
    public String getRapportVehicules(Long entrepriseId) {
        try {
            var vehicules = vehiculeRepository.findAll();

            Map<StatutVehicule, Long> parStatut = vehicules.stream()
                .collect(Collectors.groupingBy(v -> v.getStatut(), Collectors.counting()));

            StringBuilder sb = new StringBuilder();
            sb.append("📊 RAPPORT VÉHICULES\n");
            sb.append("================================\n");
            sb.append(String.format("Total: %d véhicule(s)\n\n", vehicules.size()));
            sb.append("Par statut:\n");
            parStatut.forEach((statut, count) -> 
                sb.append(String.format("- %s: %d\n", statut, count))
            );

            return sb.toString();
        } catch (Exception e) {
            log.error("Erreur rapport véhicules: {}", e.getMessage(), e);
            return "Erreur lors de la génération du rapport des véhicules.";
        }
    }

    /**
     * Chauffeurs disponibles
     */
    public String getChauffeursDisponibles(Long entrepriseId) {
        try {
            var chauffeurs = chauffeurRepository.findAll().stream()
                .filter(c -> c.getStatutConducteur() != null && 
                            c.getStatutConducteur().toString().contains("DISPONIBLE"))
                .collect(Collectors.toList());

            StringBuilder sb = new StringBuilder();
            sb.append(String.format("👤 CHAUFFEURS DISPONIBLES (%d)\n", chauffeurs.size()));
            sb.append("================================\n");
            
            if (chauffeurs.isEmpty()) {
                sb.append("⚠️ Aucun chauffeur disponible actuellement.\n");
            } else {
                chauffeurs.forEach(c -> {
                    sb.append(String.format("- %s %s (Secteur: %s)\n",
                        c.getPrenom(),
                        c.getNom(),
                        c.getSecteur() != null ? c.getSecteur().getNom() : "N/A"
                    ));
                });
            }

            return sb.toString();
        } catch (Exception e) {
            log.error("Erreur chauffeurs disponibles: {}", e.getMessage(), e);
            return "Erreur lors de la récupération des chauffeurs disponibles.";
        }
    }

    /**
     * Trajets en cours par secteur
     */
    public String getTrajetsEnCoursParSecteur(Long entrepriseId) {
        try {
            var trajets = trajetRepository.findAll().stream()
                .filter(t -> t.getStatut() == StatutTrajet.EN_COURS)
                .collect(Collectors.toList());

            if (trajets.isEmpty()) {
                return "✅ Aucun trajet en cours.";
            }

            StringBuilder sb = new StringBuilder();
            sb.append(String.format("🛣️ TRAJETS EN COURS (%d)\n", trajets.size()));
            sb.append("================================\n");
            
            trajets.stream()
                .limit(10)
                .forEach(t -> {
                    String chauffeur = t.getChauffeur() != null ? 
                        t.getChauffeur().getPrenom() + " " + t.getChauffeur().getNom() : 
                        "N/A";
                    sb.append(String.format("- %s → %s (Chauffeur: %s)\n",
                        t.getPointDepart(),
                        t.getDestination(),
                        chauffeur
                    ));
                });

            return sb.toString();
        } catch (Exception e) {
            log.error("Erreur trajets en cours: {}", e.getMessage(), e);
            return "Erreur lors de la récupération des trajets en cours.";
        }
    }

    /**
     * Rapport des trajets sur une période
     */
    public String getRapportTrajets(LocalDate dateDebut, LocalDate dateFin, Long entrepriseId) {
        try {
            LocalDateTime debut = dateDebut.atStartOfDay();
            LocalDateTime fin = dateFin.atTime(23, 59, 59);

            var trajets = trajetRepository.findAll().stream()
                .filter(t -> t.getDateDepart() != null &&
                            !t.getDateDepart().isBefore(debut) &&
                            !t.getDateDepart().isAfter(fin))
                .collect(Collectors.toList());

            Map<StatutTrajet, Long> parStatut = trajets.stream()
                .collect(Collectors.groupingBy(t -> t.getStatut(), Collectors.counting()));

            double distanceTotale = trajets.stream()
                .filter(t -> t.getDistanceKm() != null)
                .mapToDouble(t -> t.getDistanceKm())
                .sum();

            StringBuilder sb = new StringBuilder();
            sb.append(String.format("📊 RAPPORT TRAJETS (%s à %s)\n", dateDebut, dateFin));
            sb.append("================================\n");
            sb.append(String.format("Total: %d trajet(s)\n", trajets.size()));
            sb.append(String.format("Distance totale: %.2f km\n\n", distanceTotale));
            sb.append("Par statut:\n");
            parStatut.forEach((statut, count) -> 
                sb.append(String.format("- %s: %d\n", statut, count))
            );

            return sb.toString();
        } catch (Exception e) {
            log.error("Erreur rapport trajets: {}", e.getMessage(), e);
            return "Erreur lors de la génération du rapport des trajets.";
        }
    }

    /**
     * Taux d'absences des chauffeurs
     */
    public String getTauxAbsencesChauffeurs(int mois, int annee, Long entrepriseId) {
        try {
            LocalDate debut = LocalDate.of(annee, mois, 1);
            LocalDate fin = debut.withDayOfMonth(debut.lengthOfMonth());

            var conges = congeRepository.findAll().stream()
                .filter(c -> c.getStatut() == StatutConge.APPROUVE &&
                            !c.getDateDebut().isAfter(fin) &&
                            !c.getDateFin().isBefore(debut))
                .collect(Collectors.toList());

            long totalChauffeurs = chauffeurRepository.count();
            long chauffeursEnConge = conges.stream()
                .map(c -> c.getChauffeur())
                .distinct()
                .count();

            double tauxAbsence = totalChauffeurs > 0 ? 
                (chauffeursEnConge * 100.0 / totalChauffeurs) : 0;

            return String.format(
                "📊 TAUX D'ABSENCES - %s %d\n" +
                "================================\n" +
                "Total chauffeurs: %d\n" +
                "Chauffeurs en congé: %d\n" +
                "Taux d'absence: %.1f%%\n",
                debut.getMonth().toString(),
                annee,
                totalChauffeurs,
                chauffeursEnConge,
                tauxAbsence
            );
        } catch (Exception e) {
            log.error("Erreur taux absences: {}", e.getMessage(), e);
            return "Erreur lors du calcul du taux d'absences.";
        }
    }
}
