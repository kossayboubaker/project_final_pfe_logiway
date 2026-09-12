package com.logiway.services.impl;

import com.logiway.dto.chauffeur.ChauffeurAvailabilityResponse;
import com.logiway.dto.chauffeur.ChauffeurDashboardResponse;
import com.logiway.dto.chauffeur.ChauffeurDashboardStatsResponse;
import com.logiway.dto.chauffeur.ChauffeurVehicleResponse;
import com.logiway.dto.request.ChangePasswordRequest;
import com.logiway.dto.request.UpdateProfileRequest;
import com.logiway.dto.response.ApiMessageResponse;
import com.logiway.dto.response.UserResponse;
import com.logiway.dto.trajet.TrajetResponse;
import com.logiway.entities.Chauffeur;
import com.logiway.entities.Manager;
import com.logiway.entities.Notification;
import com.logiway.entities.Trajet;
import com.logiway.entities.Utilisateur;
import com.logiway.entities.Vehicule;
import com.logiway.entities.enums.Role;
import com.logiway.entities.enums.StatutChauffeur;
import com.logiway.entities.enums.StatutTrajet;
import com.logiway.entities.enums.StatutVehicule;
import com.logiway.entities.enums.TypeNotif;
import com.logiway.exceptions.BadRequestException;
import com.logiway.mappers.UserMapper;
import com.logiway.repositories.ChauffeurRepository;
import com.logiway.repositories.NotificationRepository;
import com.logiway.repositories.TrajetRepository;
import com.logiway.repositories.UtilisateurRepository;
import com.logiway.repositories.VehiculeRepository;
import com.logiway.security.AuthenticatedUserService;
import com.logiway.services.ProfileService;
import com.logiway.services.KeycloakService;
import com.logiway.services.MailService;
import com.logiway.services.NotificationRealtimeService;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class ProfileServiceImpl implements ProfileService {

    private final AuthenticatedUserService authenticatedUserService;
    private final UtilisateurRepository utilisateurRepository;
    private final NotificationRepository notificationRepository;
    private final ChauffeurRepository chauffeurRepository;
    private final TrajetRepository trajetRepository;
    private final VehiculeRepository vehiculeRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserMapper userMapper;
    private final KeycloakService keycloakService;
    private final MailService mailService;
    private final NotificationRealtimeService notificationRealtimeService;

    @Override
    @Transactional(readOnly = true)
    public UserResponse getCurrentProfile() {
        Utilisateur currentUser = authenticatedUserService.getCurrentUser();
        return userMapper.toResponse(currentUser);
    }

    @Override
    @Transactional
    public UserResponse updateCurrentProfile(UpdateProfileRequest request) {
        Utilisateur currentUser = authenticatedUserService.getCurrentUser();

        if (request.prenom() != null) currentUser.setPrenom(request.prenom());
        if (request.nom() != null) currentUser.setNom(request.nom());
        if (request.telephone() != null) currentUser.setTelephone(request.telephone());
        if (request.image() != null) currentUser.setImage(request.image());

        utilisateurRepository.save(currentUser);

        return userMapper.toResponse(currentUser);
    }

    @Override
    @Transactional
    public ApiMessageResponse changeCurrentPassword(ChangePasswordRequest request) {
        Utilisateur currentUser = authenticatedUserService.getCurrentUser();
        if (!passwordEncoder.matches(request.oldPassword(), currentUser.getPasswordHash())) {
            throw new BadRequestException("Old password is incorrect");
        }

        currentUser.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        
        boolean wasNotVerified = !currentUser.getEmailVerifie();
        currentUser.setEmailVerifie(true);
        utilisateurRepository.save(currentUser);
        
        keycloakService.updatePasswordByEmail(currentUser.getEmail(), request.newPassword());

        if (wasNotVerified) {
            try {
                mailService.sendAccountActivationConfirmationEmail(currentUser);
                notifyCreatorOfAccountActivation(currentUser);
            } catch (Exception ex) {
                log.warn("Failed to send activation notification for user {}", currentUser.getEmail(), ex);
            }
        }

        return new ApiMessageResponse("Password changed successfully");
    }

    @Override
    @Transactional(readOnly = true)
    public ChauffeurDashboardResponse getCurrentDriverDashboard() {
        Chauffeur chauffeur = resolveCurrentChauffeur();
        List<Trajet> trajets = loadDriverTrajets(chauffeur.getId());
        Trajet currentMission = findLatestActiveTrip(trajets);

        return new ChauffeurDashboardResponse(
            userMapper.toResponse(chauffeur),
            toVehicleResponse(chauffeur.getVehiculeActuel()),
            chauffeur.getManager() != null ? userMapper.toResponse(chauffeur.getManager()) : null,
            currentMission != null ? toTrajetResponse(currentMission) : null,
            trajets.stream()
                .filter(this::isTodayTrip)
                .map(this::toTrajetResponse)
                .toList(),
            buildStats(chauffeur, trajets),
            getCurrentDriverAvailability()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public Page<TrajetResponse> getCurrentDriverTrips(Pageable pageable, StatutTrajet statut) {
        Chauffeur chauffeur = resolveCurrentChauffeur();
        List<Trajet> trajets = loadDriverTrajets(chauffeur.getId());

        List<Trajet> filtered = trajets.stream()
            .filter(trajet -> statut == null || trajet.getStatut() == statut)
            .toList();

        Pageable effectivePageable = pageable != null ? pageable : PageRequest.of(0, 20);
        int start = (int) Math.min(effectivePageable.getOffset(), filtered.size());
        int end = Math.min(start + effectivePageable.getPageSize(), filtered.size());

        List<TrajetResponse> content = filtered.subList(start, end).stream()
            .map(this::toTrajetResponse)
            .toList();

        return new PageImpl<>(content, effectivePageable, filtered.size());
    }

    @Override
    @Transactional(readOnly = true)
    public ChauffeurAvailabilityResponse getCurrentDriverAvailability() {
        Chauffeur chauffeur = resolveCurrentChauffeur();
        return computeAvailability(chauffeur);
    }

    @PostConstruct
    public void reconcileDriverAndVehicleStatusesOnStartup() {
        chauffeurRepository.findAll().forEach(this::reconcileChauffeurStatus);
        vehiculeRepository.findAll().forEach(this::reconcileVehicleStatus);
    }

    @Scheduled(fixedDelay = 60_000L)
    @Transactional
    public void releaseDriversAfterRestPeriod() {
        chauffeurRepository.findAll().forEach(chauffeur -> {
            ChauffeurAvailabilityResponse availability = computeAvailability(chauffeur);
            if (Boolean.TRUE.equals(availability.disponible()) && chauffeur.getStatutConducteur() != StatutChauffeur.LIBRE) {
                chauffeur.setStatutConducteur(StatutChauffeur.LIBRE);
                chauffeurRepository.save(chauffeur);
                publishStatusChangeNotification(chauffeur, "Chauffeur libéré automatiquement après 12 heures de repos.");
            }
        });
    }

    private void notifyCreatorOfAccountActivation(Utilisateur activatedUser) {
        String message = String.format("Le compte de %s %s (%s) a ete active.",
            activatedUser.getPrenom(), activatedUser.getNom(), activatedUser.getEmail());

        List<Utilisateur> recipients = new ArrayList<>();

        if (activatedUser instanceof Chauffeur chauffeur && chauffeur.getManager() != null) {
            recipients.add(chauffeur.getManager());
        }

        recipients.addAll(utilisateurRepository.findByRole(Role.SUPERADMIN));

        for (Utilisateur recipient : recipients.stream().distinct().toList()) {
            Notification notification = Notification.builder()
                .type(TypeNotif.NOTIF_COMPTE)
                .message(message)
                .utilisateur(recipient)
                .estLu(false)
                .build();
            notificationRepository.save(notification);
            notificationRealtimeService.publishToUsers(List.of(recipient.getId()), notification);
        }
    }

    private Chauffeur resolveCurrentChauffeur() {
        Utilisateur currentUser = authenticatedUserService.getCurrentUser();
        if (currentUser instanceof Chauffeur chauffeur) {
            return chauffeurRepository.findByIdWithDashboardFetch(chauffeur.getId())
                .orElse(chauffeur);
        }

        throw new BadRequestException("Current user is not a chauffeur");
    }

    private List<Trajet> loadDriverTrajets(Long chauffeurId) {
        List<Trajet> trajets = trajetRepository.findByChauffeurIdWithFetch(chauffeurId);
        trajets.sort(Comparator.comparing(Trajet::getDateDepart, Comparator.nullsLast(Comparator.naturalOrder())).reversed());
        return trajets;
    }

    private Trajet findLatestActiveTrip(List<Trajet> trajets) {
        return trajets.stream()
            .filter(trajet -> EnumSet.of(StatutTrajet.EN_COURS, StatutTrajet.ACTIF).contains(trajet.getStatut()))
            .findFirst()
            .orElse(null);
    }

    private boolean isTodayTrip(Trajet trajet) {
        LocalDate referenceDate = trajet.getDateDepart() != null ? trajet.getDateDepart().toLocalDate() : null;
        return referenceDate != null && referenceDate.equals(LocalDate.now());
    }

    private ChauffeurDashboardStatsResponse buildStats(Chauffeur chauffeur, List<Trajet> trajets) {
        double totalDistance = trajets.stream()
            .map(Trajet::getDistanceKm)
            .filter(distance -> distance != null)
            .mapToDouble(Double::doubleValue)
            .sum();

        double totalHours = trajets.stream()
            .mapToDouble(this::estimateTripHours)
            .sum();

        long completed = trajets.stream().filter(trajet -> trajet.getStatut() == StatutTrajet.COMPLETE).count();
        Map<String, Long> alertCounts = countDriverAlerts(chauffeur);
        long onTimeTrips = trajets.stream()
            .map(this::computeTripTimingMetrics)
            .filter(metrics -> metrics.statutPerformance() != null && metrics.statutPerformance().equals("À l'heure"))
            .count();

        double averageSpeed = totalHours > 0 ? totalDistance / totalHours : 0.0;
        double ecoScore = Math.max(0.0, 100.0 - (averageSpeed * 0.35) - (alertCounts.values().stream().mapToLong(Long::longValue).sum() * 2.5));
        double punctuality = completed > 0 ? (onTimeTrips * 100.0) / completed : 100.0;

        return new ChauffeurDashboardStatsResponse(
            round(totalDistance),
            completed,
            0L,
            round(totalHours),
            round(averageSpeed),
            0.0,
            round(punctuality),
            0L,  // Alertes pause désactivées
            alertCounts.getOrDefault("carburant", 0L),
            alertCounts.getOrDefault("deviation", 0L),
            alertCounts.getOrDefault("arret", 0L),
            round(ecoScore)
        );
    }

    private Map<String, Long> countDriverAlerts(Chauffeur chauffeur) {
        return notificationRepository.findByUtilisateurOrderByDateCreationDesc(chauffeur).stream()
            .map(Notification::getMessage)
            .filter(message -> message != null && !message.isBlank())
            .map(message -> normalize(message))
            .collect(Collectors.groupingBy(message -> {
                if (message.contains("carburant") || message.contains("fuel")) return "carburant";
                if (message.contains("deviation") || message.contains("déviation")) return "deviation";
                if (message.contains("arret") || message.contains("stop")) return "arret";
                return "other";
            }, Collectors.counting()));
    }

    private double estimateTripHours(Trajet trajet) {
        if (trajet.getDateDepart() == null) {
            return 0.0;
        }

        LocalDateTime end = trajet.getDateArriveeReelle() != null ? trajet.getDateArriveeReelle() : trajet.getDateArrivee();
        if (end == null) {
            end = LocalDateTime.now();
        }

        long minutes = java.time.Duration.between(trajet.getDateDepart(), end).toMinutes();
        return Math.max(0L, minutes) / 60.0;
    }

    private TrajetResponse toTrajetResponse(Trajet trajet) {
        Chauffeur chauffeur = trajet.getChauffeur();
        Vehicule vehicule = trajet.getVehicule();
        Manager manager = trajet.getManager() != null ? trajet.getManager() : chauffeur != null ? chauffeur.getManager() : null;
        TripTimingMetrics metrics = computeTripTimingMetrics(trajet);
        Double distanceKm = trajet.getDistanceKm() != null ? trajet.getDistanceKm() : estimateDistanceKm(trajet);

        return new TrajetResponse(
            trajet.getId(),
            trajet.getPointDepart(),
            trajet.getDestination(),
            trajet.getLatitudeDepart(),
            trajet.getLongitudeDepart(),
            trajet.getLatitudeArrivee(),
            trajet.getLongitudeArrivee(),
            distanceKm,
            trajet.getDureeEstimeeMinutes(),
            trajet.getGeometrieItineraire(),
            trajet.getChargeKg(),
            trajet.getPriorite(),
            trajet.getNotes(),
            trajet.getDateDepart(),
            trajet.getDateArrivee(),
            trajet.getDateArriveeReelle(),
            metrics.dureeReelleMinutes(),
            metrics.retardMinutes(),
            metrics.statutPerformance(),
            trajet.getStatut(),
            chauffeur != null ? chauffeur.getId() : null,
            chauffeur != null ? formatDisplayName(chauffeur) : null,
            vehicule != null ? vehicule.getId() : null,
            vehicule != null ? vehicule.getMatricule() : null,
            vehicule != null ? vehicule.getCouleur() : null,
            vehicule != null ? vehicule.getLatitudeActuelle() : null,
            vehicule != null ? vehicule.getLongitudeActuelle() : null,
            vehicule != null ? vehicule.getVitesseActuelle() : null,
            manager != null ? manager.getId() : null,
            manager != null ? formatDisplayName(manager) : null
        );
    }

    private TripTimingMetrics computeTripTimingMetrics(Trajet trajet) {
        if (trajet.getDateDepart() == null) {
            return new TripTimingMetrics(null, null, null);
        }

        LocalDateTime referenceEnd = trajet.getDateArriveeReelle();
        boolean isRunning = trajet.getStatut() == StatutTrajet.EN_COURS || trajet.getStatut() == StatutTrajet.ACTIF;
        if (referenceEnd == null && isRunning) {
            referenceEnd = LocalDateTime.now();
        }

        if (referenceEnd == null) {
            return new TripTimingMetrics(null, null, null);
        }

        long realMinutes = java.time.Duration.between(trajet.getDateDepart(), referenceEnd).toMinutes();
        int realDuration = (int) Math.max(0, realMinutes);
        int planned = trajet.getDureeEstimeeMinutes() != null ? trajet.getDureeEstimeeMinutes() : 0;
        int retard = realDuration - planned;

        return new TripTimingMetrics(realDuration, retard, computePerformanceLabel(retard));
    }

    private Double estimateDistanceKm(Trajet trajet) {
        if (trajet.getLatitudeDepart() == null || trajet.getLongitudeDepart() == null || trajet.getLatitudeArrivee() == null || trajet.getLongitudeArrivee() == null) {
            return 0.0;
        }

        double earthRadiusKm = 6371.0;
        double lat1 = Math.toRadians(trajet.getLatitudeDepart());
        double lat2 = Math.toRadians(trajet.getLatitudeArrivee());
        double deltaLat = Math.toRadians(trajet.getLatitudeArrivee() - trajet.getLatitudeDepart());
        double deltaLon = Math.toRadians(trajet.getLongitudeArrivee() - trajet.getLongitudeDepart());
        double a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2)
            + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return round(c * earthRadiusKm);
    }

    private String computePerformanceLabel(int retardMinutes) {
        if (retardMinutes < 0) {
            return "En avance";
        }
        if (retardMinutes < 5) {
            return "À l'heure";
        }
        if (retardMinutes <= 30) {
            return "Léger retard";
        }
        return "Retard important";
    }

    private record TripTimingMetrics(Integer dureeReelleMinutes, Integer retardMinutes, String statutPerformance) { }

    private ChauffeurVehicleResponse toVehicleResponse(Vehicule vehicule) {
        if (vehicule == null) {
            return null;
        }

        return new ChauffeurVehicleResponse(
            vehicule.getId(),
            vehicule.getMatricule(),
            vehicule.getMarque(),
            vehicule.getModele(),
            vehicule.getMarque() != null && vehicule.getModele() != null ? vehicule.getMarque() + " " + vehicule.getModele() : vehicule.getMarque(),
            vehicule.getStatut(),
            vehicule.getKilometrage(),
            vehicule.getNiveauCarburant(),
            vehicule.getCapaciteCharge(),
            vehicule.getEntreprise() != null ? vehicule.getEntreprise().getId() : null,
            vehicule.getEntreprise() != null ? vehicule.getEntreprise().getNomEntreprise() : null
        );
    }

    private void reconcileChauffeurStatus(Chauffeur chauffeur) {
        ChauffeurAvailabilityResponse availability = computeAvailability(chauffeur);
        StatutChauffeur expectedStatus = Boolean.TRUE.equals(availability.disponible()) ? StatutChauffeur.LIBRE : StatutChauffeur.EN_SERVICE;

        if (chauffeur.getStatutConducteur() != expectedStatus) {
            chauffeur.setStatutConducteur(expectedStatus);
            chauffeurRepository.save(chauffeur);
        }
    }

    private void reconcileVehicleStatus(Vehicule vehicule) {
        List<Trajet> trajets = trajetRepository.findByVehiculeIdWithFetch(vehicule.getId());
        Trajet latestTrip = trajets.stream().findFirst().orElse(null);
        StatutVehicule expectedStatus = latestTrip != null && EnumSet.of(StatutTrajet.EN_COURS, StatutTrajet.ACTIF).contains(latestTrip.getStatut())
            ? StatutVehicule.EN_SERVICE
            : latestTrip != null && latestTrip.getStatut() == StatutTrajet.COMPLETE
                ? StatutVehicule.HORS_SERVICE
                : vehicule.getStatut();

        if (vehicule.getStatut() != expectedStatus) {
            vehicule.setStatut(expectedStatus);
            vehiculeRepository.save(vehicule);
        }
    }

    private String formatDisplayName(Utilisateur utilisateur) {
        String prenom = utilisateur.getPrenom() != null ? utilisateur.getPrenom().trim() : "";
        String nom = utilisateur.getNom() != null ? utilisateur.getNom().trim() : "";
        String fullName = (prenom + " " + nom).trim();
        return fullName.isBlank() ? utilisateur.getEmail() : fullName;
    }

    private ChauffeurAvailabilityResponse computeAvailability(Chauffeur chauffeur) {
        List<Trajet> trajets = trajetRepository.findByChauffeurIdWithFetch(chauffeur.getId());
        Trajet latestComplete = trajets.stream()
            .filter(trajet -> trajet.getStatut() == StatutTrajet.COMPLETE && trajet.getDateArriveeReelle() != null)
            .findFirst()
            .orElse(null);

        LocalDateTime availabilityDate = latestComplete != null ? latestComplete.getDateArriveeReelle().plusHours(12) : null;
        boolean hasActiveTrip = trajets.stream().anyMatch(trajet -> trajet.getStatut() == StatutTrajet.EN_COURS || trajet.getStatut() == StatutTrajet.ACTIF);
        boolean available = !hasActiveTrip && (availabilityDate == null || !LocalDateTime.now().isBefore(availabilityDate));
        long minutesRemaining = 0L;

        if (!available && availabilityDate != null) {
            minutesRemaining = Math.max(0L, java.time.Duration.between(LocalDateTime.now(), availabilityDate).toMinutes());
        }

        return new ChauffeurAvailabilityResponse(availabilityDate, minutesRemaining, available);
    }

    private void publishStatusChangeNotification(Chauffeur chauffeur, String message) {
        List<Long> recipients = new ArrayList<>();
        if (chauffeur.getId() != null) {
            recipients.add(chauffeur.getId());
        }
        if (chauffeur.getManager() != null && chauffeur.getManager().getId() != null) {
            recipients.add(chauffeur.getManager().getId());
        }
        utilisateurRepository.findByRole(Role.SUPERADMIN).stream()
            .map(Utilisateur::getId)
            .forEach(recipients::add);

        for (Long recipientId : recipients.stream().distinct().toList()) {
            utilisateurRepository.findById(recipientId).ifPresent(user -> {
                Notification notification = Notification.builder()
                    .type(TypeNotif.NOTIF_TRAJET)
                    .message(message)
                    .utilisateur(user)
                    .estLu(false)
                    .build();
                notificationRepository.save(notification);
                notificationRealtimeService.publishToUsers(List.of(recipientId), notification);
            });
        }
    }

    private String normalize(String message) {
        return java.text.Normalizer.normalize(message, java.text.Normalizer.Form.NFD)
            .replaceAll("\\p{M}+", "")
            .toLowerCase(Locale.ROOT);
    }

    private double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}
