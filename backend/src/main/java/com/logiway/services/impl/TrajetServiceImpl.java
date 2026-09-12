package com.logiway.services.impl;

import com.logiway.dto.trajet.TourneeOptimiseeResponse;
import com.logiway.dto.meteo.MeteoResponse;
import com.logiway.dto.trajet.TrajetCarteResponse;
import com.logiway.dto.trajet.TrajetOptimisationRequest;
import com.logiway.dto.trajet.TrajetPositionRequest;
import com.logiway.dto.trajet.TrajetRequest;
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
import com.logiway.exceptions.ResourceNotFoundException;
import com.logiway.repositories.NotificationRepository;
import com.logiway.repositories.TrajetRepository;
import com.logiway.repositories.UtilisateurRepository;
import com.logiway.repositories.VehiculeRepository;
import com.logiway.repositories.ChauffeurRepository;
import com.logiway.security.AuthenticatedUserService;
import com.logiway.services.NotificationRealtimeService;
import com.logiway.services.MeteoService;
import com.logiway.services.OsrmService;
import com.logiway.services.PauseReglementaireService;
import com.logiway.services.TrajetOptimisationService;

import com.logiway.services.TrajetService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class TrajetServiceImpl implements TrajetService {

    private final TrajetRepository trajetRepository;
    private final VehiculeRepository vehiculeRepository;
    private final ChauffeurRepository chauffeurRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final NotificationRepository notificationRepository;
    private final NotificationRealtimeService notificationRealtimeService;
    private final MeteoService meteoService;
    private final AuthenticatedUserService authenticatedUserService;
    private final OsrmService osrmService;
    private final PauseReglementaireService pauseReglementaireService;
    private final TrajetOptimisationService trajetOptimisationService;
    private final Map<Long, String> weatherAlertHistory = new ConcurrentHashMap<>();

    @Override
    public Page<TrajetResponse> getTrajets(String search, StatutTrajet statut, Pageable pageable) {
        List<Trajet> trajets = resolveVisibleTrajets();
        if (statut != null) {
            trajets = trajets.stream().filter(trajet -> statut == trajet.getStatut()).toList();
        }

        if (search != null && !search.isBlank()) {
            String needle = search.toLowerCase(Locale.ROOT);
            trajets = trajets.stream().filter(trajet ->
                contains(trajet.getPointDepart(), needle)
                    || contains(trajet.getDestination(), needle)
                    || contains(trajet.getVehicule() != null ? trajet.getVehicule().getMatricule() : null, needle)
                    || contains(trajet.getChauffeur() != null ? trajet.getChauffeur().getNom() + " " + trajet.getChauffeur().getPrenom() : null, needle)
            ).toList();
        }

        List<TrajetResponse> responses = trajets.stream().map(this::toResponse).toList();
        if (pageable == null) {
            return new PageImpl<>(responses);
        }

        int start = Math.min((int) pageable.getOffset(), responses.size());
        int end = Math.min(start + pageable.getPageSize(), responses.size());
        return new PageImpl<>(responses.subList(start, end), pageable, responses.size());
    }

    public List<TrajetCarteResponse> getTrajetsCarte() {
        List<Trajet> trajets;
        try {
            Utilisateur currentUser = authenticatedUserService.getCurrentUser();

            if (currentUser.getRole() == Role.SUPERADMIN) {
                // SuperAdmin — tous les trajets EN_COURS de toutes les entreprises
                trajets = trajetRepository.findAll().stream()
                        .filter(t -> t.getStatut() == StatutTrajet.EN_COURS)
                        .toList();

            } else if (currentUser.getRole() == Role.CHAUFFEUR) {
                // Chauffeur — tous ses trajets visibles sur la carte (EN_COURS + ACTIF)
                // Le Chauffeur doit voir son trajet actif ET son trajet en cours
                trajets = trajetRepository.findByChauffeurIdWithFetch(currentUser.getId()).stream()
                        .filter(t -> t.getStatut() == StatutTrajet.EN_COURS
                                || t.getStatut() == StatutTrajet.ACTIF)
                        .toList();

            } else if (currentUser instanceof Manager manager) {
                // Manager — trajets EN_COURS de TOUS ses chauffeurs supervisés
                // On filtre par chauffeur.manager_id pour couvrir tous les cas,
                // même si trajet.manager_id est null ou différent.
                trajets = trajetRepository.findByChauffeurManagerIdWithFetch(manager.getId())
                        .stream()
                        .filter(t -> t.getStatut() == StatutTrajet.EN_COURS)
                        .toList();
            } else {
                trajets = List.of();
            }

        } catch (Exception ex) {
            // Accès non authentifié (simulateur GPS/Python) — retourne uniquement les EN_COURS
            // sans exposer les données de tous les utilisateurs
            log.warn("getTrajetsCarte called without authentication, falling back to EN_COURS only: {}", ex.getMessage());
            trajets = trajetRepository.findAll().stream()
                    .filter(t -> t.getStatut() == StatutTrajet.EN_COURS)
                    .toList();
        }

        return trajets.stream()
                .map(this::toCarteResponse)
                .toList();
    }
    @Override
    public TrajetResponse getTrajet(Long id) {
        Trajet trajet = trajetRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Trajet introuvable"));
        return toResponse(trajet);
    }

    @Override
    public TrajetResponse createTrajet(TrajetRequest request) {
        Utilisateur currentUser = authenticatedUserService.getCurrentUser();
        Trajet trajet = buildTrajet(new Trajet(), request, currentUser);
        trajet.setStatut(request.statut() != null ? request.statut() : StatutTrajet.ACTIF);

        validateDriverAvailability(trajet);

        enrichRoute(trajet);

        Trajet saved = trajetRepository.saveAndFlush(trajet);
        try {
            if (saved.getVehicule() != null) {
                validateAssignment(saved.getVehicule());
                activateAssignment(saved);
            }
            notifyTripChange(saved, "Nouveau trajet assigné");
        } catch (RuntimeException ex) {
            log.warn("Trajet {} persisted but post-save processing failed: {}", saved.getId(), ex.getMessage());
        }

        return toResponse(saved);
    }

    @Override
    public TrajetResponse updateTrajet(Long id, TrajetRequest request) {
        Utilisateur currentUser = authenticatedUserService.getCurrentUser();
        Trajet trajet = trajetRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Trajet introuvable"));

        buildTrajet(trajet, request, currentUser);
        enrichRoute(trajet);

        Trajet saved = trajetRepository.saveAndFlush(trajet);
        try {
            notifyTripChange(saved, "Trajet mis à jour");
        } catch (RuntimeException ex) {
            log.warn("Trajet {} updated but notification failed: {}", saved.getId(), ex.getMessage());
        }
        return toResponse(saved);
    }

    @Override
    public void deleteTrajet(Long id) {
        Trajet trajet = trajetRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Trajet introuvable"));

        if (trajet.getVehicule() != null) {
            Vehicule vehicule = trajet.getVehicule();
            vehicule.setChauffeurActuel(null);
            vehicule.setStatut(StatutVehicule.EN_SERVICE);
            vehiculeRepository.save(vehicule);
        }

        if (trajet.getChauffeur() != null) {
            Chauffeur chauffeur = trajet.getChauffeur();
            chauffeur.setVehiculeActuel(null);
            chauffeur.setStatutConducteur(trajetRepository.existsByChauffeurIdAndStatutIn(chauffeur.getId(), Set.of(StatutTrajet.ACTIF, StatutTrajet.EN_COURS))
                ? StatutChauffeur.EN_SERVICE
                : StatutChauffeur.LIBRE);
            chauffeurRepository.save(chauffeur);
        }

        trajetRepository.delete(trajet);
    }

    @Override
    public TrajetResponse demarrerTrajet(Long id) {
        Trajet trajet = trajetRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Trajet introuvable"));
        trajet.setStatut(StatutTrajet.EN_COURS);
        if (trajet.getDateDepart() == null) {
            trajet.setDateDepart(LocalDateTime.now());
        }
        if (trajet.getVehicule() != null) {
            trajet.getVehicule().setStatut(StatutVehicule.EN_SERVICE);
            vehiculeRepository.save(trajet.getVehicule());
        }
        if (trajet.getChauffeur() != null) {
            trajet.getChauffeur().setStatutConducteur(StatutChauffeur.EN_SERVICE);
            chauffeurRepository.save(trajet.getChauffeur());
        }
        Trajet saved = trajetRepository.save(trajet);

        try {
            log.info("[TRAJET] Génération des pauses réglementaires lancée pour le trajet {}", saved.getId());
            pauseReglementaireService.genererPauses(saved.getId());
        } catch (Exception ex) {
            log.warn("[TRAJET] Impossible de générer les pauses réglementaires pour le trajet {}: {}", saved.getId(), ex.getMessage(), ex);
        }

        notifyTripChange(saved, "Trajet démarré");

        return toResponse(saved);
    }



    @Override
    public TrajetResponse terminerTrajet(Long id) {
        Trajet trajet = trajetRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Trajet introuvable"));

        trajet.setStatut(StatutTrajet.COMPLETE);
        trajet.setDateArriveeReelle(LocalDateTime.now());

        if (trajet.getVehicule() != null) {
            trajet.getVehicule().setStatut(StatutVehicule.EN_SERVICE);
            trajet.getVehicule().setChauffeurActuel(null);
            vehiculeRepository.save(trajet.getVehicule());
        }
        if (trajet.getChauffeur() != null) {
            trajet.getChauffeur().setVehiculeActuel(null);
            trajet.getChauffeur().setStatutConducteur(StatutChauffeur.LIBRE);
            chauffeurRepository.save(trajet.getChauffeur());
        }

        Trajet saved = trajetRepository.save(trajet);
        weatherAlertHistory.remove(saved.getId());
        notifyTripChange(saved, "Trajet terminé");
        return toResponse(saved);
    }

    @Override
    public TrajetResponse updatePosition(Long id, TrajetPositionRequest request) {
        Trajet trajet = trajetRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Trajet introuvable"));

        if (trajet.getVehicule() == null) {
            throw new ResourceNotFoundException("Aucun véhicule lié à ce trajet");
        }

        Vehicule vehicule = trajet.getVehicule();
        vehicule.setLatitudeActuelle(request.latitude());
        vehicule.setLongitudeActuelle(request.longitude());
        vehicule.setVitesseActuelle(request.vitesse());
        vehicule.setNiveauCarburant(request.carburant());
        vehicule.setDernierePositionMaj(request.datePosition() != null ? request.datePosition() : LocalDateTime.now());
        vehiculeRepository.save(vehicule);

        handleWeatherAlerts(trajet, request.latitude(), request.longitude());

        List<Long> audience = buildNotificationAudience(trajet);
        if (!audience.isEmpty()) {
            notificationRealtimeService.publishNamedEventToUsers(audience, "gps-position", toCarteResponse(trajet));
        }

        return toResponse(trajet);
    }

    @Override
    public List<TourneeOptimiseeResponse> optimiserTrajets(TrajetOptimisationRequest request) {
        Utilisateur currentUser = authenticatedUserService.getCurrentUser();
        List<TrajetRequest> demandes = request != null && request.trajets() != null ? request.trajets() : List.of();
        if (demandes.isEmpty()) {
            return List.of();
        }

        List<Vehicule> vehicules = resolveVehiclesForOptimisation(currentUser, request);
        List<TrajetOptimisationService.OptimizationAssignment> assignments = trajetOptimisationService.optimiser(demandes, vehicules);

        List<TourneeOptimiseeResponse> result = new ArrayList<>();
        for (TrajetOptimisationService.OptimizationAssignment assignment : assignments) {
            Trajet trajet = buildTrajet(new Trajet(), assignment.trajet(), currentUser);
            trajet.setVehicule(assignment.vehicule());
            trajet.setStatut(assignment.trajet().statut() != null ? assignment.trajet().statut() : StatutTrajet.ACTIF);
            if (assignment.route() != null) {
                trajet.setDistanceKm(assignment.route().distanceKm());
                trajet.setDureeEstimeeMinutes(assignment.route().durationMinutes());
                trajet.setGeometrieItineraire(assignment.route().geometryJson());
            }

            enrichRoute(trajet);
            validateAssignment(assignment.vehicule());
            validateDriverAvailability(trajet);
            Trajet saved = trajetRepository.save(trajet);
            activateAssignment(saved);
            notifyTripChange(saved, "Trajet optimisé et assigné");
            result.add(new TourneeOptimiseeResponse(
                saved.getVehicule() != null ? saved.getVehicule().getId() : null,
                saved.getVehicule() != null ? saved.getVehicule().getMatricule() : null,
                saved.getVehicule() != null ? saved.getVehicule().getCouleur() : null,
                saved.getVehicule() != null ? saved.getVehicule().getLatitudeActuelle() : null,
                saved.getVehicule() != null ? saved.getVehicule().getLongitudeActuelle() : null,
                List.of(toResponse(saved))
            ));
        }

        return result;
    }

    private Trajet buildTrajet(Trajet trajet, TrajetRequest request, Utilisateur currentUser) {
        trajet.setPointDepart(request.pointDepart());
        trajet.setDestination(request.destination());
        trajet.setLatitudeDepart(resolveLatitude(request.pointDepart(), request.latitudeDepart()));
        trajet.setLongitudeDepart(resolveLongitude(request.pointDepart(), request.longitudeDepart()));
        trajet.setLatitudeArrivee(resolveLatitude(request.destination(), request.latitudeArrivee()));
        trajet.setLongitudeArrivee(resolveLongitude(request.destination(), request.longitudeArrivee()));
        trajet.setDateDepart(request.dateDepart());
        trajet.setDateArrivee(request.dateArrivee());
        trajet.setChargeKg(request.chargeKg());
        trajet.setPriorite(request.priorite());
        trajet.setNotes(request.notes());
        trajet.setChauffeur(resolveChauffeur(request.chauffeurId()));
        trajet.setVehicule(resolveVehicule(request.vehiculeId()));
        trajet.setManager(resolveManager(request.managerId(), currentUser));
        trajet.setTypeOptimisation(request.typeOptimisation() != null ? request.typeOptimisation() : "shortest");
        return trajet;
    }

    private void enrichRoute(Trajet trajet) {
        String opt = trajet.getTypeOptimisation() != null ? trajet.getTypeOptimisation() : "shortest";
        OsrmService.RouteEstimation route = osrmService.calculerItineraire(
            trajet.getLatitudeDepart(), trajet.getLongitudeDepart(), trajet.getLatitudeArrivee(), trajet.getLongitudeArrivee(), opt);

        if (route != null) {
            trajet.setDistanceKm(route.distanceKm());
            trajet.setDureeEstimeeMinutes(route.durationMinutes());
            trajet.setGeometrieItineraire(route.geometryJson());
        }
    }

    private void validateAssignment(Vehicule vehicule) {
        if (vehicule == null) {
            return;
        }

        if (vehicule.getStatut() != StatutVehicule.EN_SERVICE && vehicule.getStatut() != StatutVehicule.HORS_SERVICE) {
            throw new IllegalStateException("Le véhicule n'est pas disponible");
        }

        boolean busy = trajetRepository.existsByVehiculeIdAndStatutIn(vehicule.getId(), Set.of(StatutTrajet.ACTIF, StatutTrajet.EN_COURS));
        if (busy) {
            throw new IllegalStateException("Le véhicule est déjà affecté à un trajet actif");
        }
    }

    private void validateDriverAvailability(Trajet trajet) {
        if (trajet.getChauffeur() == null) {
            return;
        }

        Chauffeur chauffeur = trajet.getChauffeur();
        List<Trajet> trajetsChauffeur = trajetRepository.findByChauffeurIdWithFetch(chauffeur.getId());
        Trajet latestComplete = trajetsChauffeur.stream()
            .filter(item -> item.getStatut() == StatutTrajet.COMPLETE && item.getDateArriveeReelle() != null)
            .findFirst()
            .orElse(null);

        if (latestComplete == null) {
            return;
        }

        LocalDateTime availableAt = latestComplete.getDateArriveeReelle().plusHours(12);
        boolean hasActiveTrip = trajetsChauffeur.stream().anyMatch(item -> item.getStatut() == StatutTrajet.ACTIF || item.getStatut() == StatutTrajet.EN_COURS);
        if (hasActiveTrip || LocalDateTime.now().isBefore(availableAt)) {
            String formattedDate = availableAt.format(DateTimeFormatter.ofPattern("dd/MM/yyyy à HH:mm"));
            String driverName = (chauffeur.getPrenom() + " " + chauffeur.getNom()).trim();
            String message = "⚠️ Ce chauffeur n'est pas encore disponible. Repos obligatoire de 12 heures après la dernière mission. Disponible le " + formattedDate + ".";

            notifyAvailabilityBlock(trajet, String.format("⚠️ Impossible d'assigner %s — Repos obligatoire en cours jusqu'au %s.", driverName, formattedDate));
            throw new IllegalStateException(message);
        }
    }

    private void notifyAvailabilityBlock(Trajet trajet, String message) {
        List<Long> audience = new ArrayList<>();
        if (trajet.getManager() != null && trajet.getManager().getId() != null) {
            audience.add(trajet.getManager().getId());
        }
        for (Long userId : audience) {
            utilisateurRepository.findById(userId).ifPresent(user -> {
                Notification notification = Notification.builder()
                    .type(TypeNotif.NOTIF_TRAJET)
                    .message(message)
                    .utilisateur(user)
                    .estLu(false)
                    .build();
                notificationRepository.save(notification);
                notificationRealtimeService.publishToUsers(List.of(userId), notification);
            });
        }
    }

    private void activateAssignment(Trajet trajet) {
        if (trajet.getVehicule() != null && trajet.getChauffeur() != null) {
            Vehicule vehicule = trajet.getVehicule();
            vehicule.setStatut(StatutVehicule.EN_SERVICE);
            vehicule.setChauffeurActuel(trajet.getChauffeur());
            vehiculeRepository.save(vehicule);

            trajet.getChauffeur().setVehiculeActuel(vehicule);
            trajet.getChauffeur().setStatutConducteur(StatutChauffeur.EN_SERVICE);
            chauffeurRepository.save(trajet.getChauffeur());
        }
    }

    private void notifyTripChange(Trajet trajet, String messagePrefix) {
        List<Long> audience = buildNotificationAudience(trajet);
        if (audience.isEmpty()) {
            return;
        }

        String message = messagePrefix + " : " + trajet.getPointDepart() + " -> " + trajet.getDestination();
        for (Long userId : audience) {
            utilisateurRepository.findById(userId).ifPresent(user -> {
                Notification notification = Notification.builder()
                    .type(TypeNotif.NOTIF_TRAJET)
                    .message(message)
                    .utilisateur(user)
                    .build();
                notificationRepository.save(notification);
                notificationRealtimeService.publishToUsers(List.of(userId), notification);
            });
        }
    }

    private List<Long> buildNotificationAudience(Trajet trajet) {
        List<Long> audience = new ArrayList<>();
        if (trajet.getChauffeur() != null && trajet.getChauffeur().getId() != null) {
            audience.add(trajet.getChauffeur().getId());
        }
        if (trajet.getManager() != null && trajet.getManager().getId() != null) {
            audience.add(trajet.getManager().getId());
        }
        utilisateurRepository.findByRole(Role.SUPERADMIN).stream()
            .map(Utilisateur::getId)
            .forEach(audience::add);
        return audience.stream().distinct().toList();
    }

    private List<Vehicule> resolveVehiclesForOptimisation(Utilisateur currentUser, TrajetOptimisationRequest request) {
        if (request != null && request.vehiculeIds() != null && !request.vehiculeIds().isEmpty()) {
            return vehiculeRepository.findAllById(request.vehiculeIds());
        }

        if (currentUser.getEntreprise() != null) {
            return vehiculeRepository.findByEntreprise_Id(currentUser.getEntreprise().getId()).stream()
                .filter(vehicule -> vehicule.getStatut() == StatutVehicule.EN_SERVICE || vehicule.getStatut() == StatutVehicule.HORS_SERVICE)
                .toList();
        }

        return vehiculeRepository.findAll().stream()
            .filter(vehicule -> vehicule.getStatut() == StatutVehicule.EN_SERVICE || vehicule.getStatut() == StatutVehicule.HORS_SERVICE)
            .toList();
    }

    private Chauffeur resolveChauffeur(Long chauffeurId) {
        if (chauffeurId == null) {
            return null;
        }
        Utilisateur utilisateur = utilisateurRepository.findById(chauffeurId)
            .orElseThrow(() -> new ResourceNotFoundException("Chauffeur introuvable"));
        if (utilisateur instanceof Chauffeur chauffeur) {
            return chauffeur;
        }
        throw new ResourceNotFoundException("Chauffeur introuvable");
    }

    private Vehicule resolveVehicule(Long vehiculeId) {
        if (vehiculeId == null) {
            return null;
        }
        return vehiculeRepository.findById(vehiculeId)
            .orElseThrow(() -> new ResourceNotFoundException("Véhicule introuvable"));
    }

    private Manager resolveManager(Long managerId, Utilisateur currentUser) {
        if (managerId != null) {
            Utilisateur utilisateur = utilisateurRepository.findById(managerId)
                .orElseThrow(() -> new ResourceNotFoundException("Manager introuvable"));
            if (utilisateur instanceof Manager manager) {
                return manager;
            }
            throw new ResourceNotFoundException("Manager introuvable");
        }

        if (currentUser != null && currentUser.getRole() == Role.MANAGER) {
            return currentUser instanceof Manager manager ? manager : null;
        }

        return currentUser != null && currentUser.getCreatedBy() instanceof Manager manager ? manager : null;
    }

    private Double resolveLatitude(String label, Double provided) {
        if (provided != null) {
            return provided;
        }
        return parseCoordinate(label, true);
    }

    private Double resolveLongitude(String label, Double provided) {
        if (provided != null) {
            return provided;
        }
        return parseCoordinate(label, false);
    }

    private Double parseCoordinate(String value, boolean latitude) {
        if (value == null || value.isBlank()) {
            return null;
        }

        String normalized = value.trim();
        String[] parts = normalized.split(",");
        if (parts.length == 2) {
            try {
                return Double.parseDouble(parts[latitude ? 0 : 1].trim());
            } catch (NumberFormatException ignored) {
                // fallback to geocoding below
            }
        }

        try {
            OsrmService.GeoPoint point = osrmService.geocoder(value);
            if (point == null) {
                return null;
            }
            return latitude ? point.latitude() : point.longitude();
        } catch (RuntimeException ex) {
            log.warn("Coordinate resolution failed for '{}': {}", value, ex.getMessage());
            return null;
        }
    }

    private List<Trajet> resolveVisibleTrajets() {
        Utilisateur currentUser = authenticatedUserService.getCurrentUser();

        if (currentUser.getRole() == Role.SUPERADMIN) {
            return trajetRepository.findAll().stream()
                    .sorted(Comparator.comparing(Trajet::getDateDepart,
                            Comparator.nullsLast(Comparator.reverseOrder())))
                    .toList();
        }

        if (currentUser.getRole() == Role.CHAUFFEUR) {
            return trajetRepository.findByChauffeurIdWithFetch(currentUser.getId());
        }

        if (currentUser instanceof Manager manager) {
            // Manager — tous les trajets de ses chauffeurs supervisés (chauffeur.manager_id = manager.id)
            // On utilise findByChauffeurManagerIdWithFetch pour couvrir les trajets
            // même si trajet.manager_id est null ou pointe vers un autre manager.
            return trajetRepository.findByChauffeurManagerIdWithFetch(manager.getId());
        }

        return List.of();
    }
    private boolean contains(String value, String needle) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(needle);
    }

    private TrajetResponse toResponse(Trajet trajet) {
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
            trajet.getChauffeur() != null ? trajet.getChauffeur().getId() : null,
            trajet.getChauffeur() != null ? (trajet.getChauffeur().getPrenom() + " " + trajet.getChauffeur().getNom()).trim() : null,
            trajet.getVehicule() != null ? trajet.getVehicule().getId() : null,
            trajet.getVehicule() != null ? trajet.getVehicule().getMatricule() : null,
            trajet.getVehicule() != null ? trajet.getVehicule().getCouleur() : null,
            trajet.getVehicule() != null ? trajet.getVehicule().getLatitudeActuelle() : null,
            trajet.getVehicule() != null ? trajet.getVehicule().getLongitudeActuelle() : null,
            trajet.getVehicule() != null ? trajet.getVehicule().getVitesseActuelle() : null,
            trajet.getManager() != null ? trajet.getManager().getId() : null,
            trajet.getManager() != null ? (trajet.getManager().getPrenom() + " " + trajet.getManager().getNom()).trim() : null
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

        return new TripTimingMetrics(
            realDuration,
            retard,
            computePerformanceLabel(retard, isRunning, trajet.getDateArriveeReelle() == null)
        );
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

    private double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    private String computePerformanceLabel(int retardMinutes, boolean isRunning, boolean missingArrival) {
        if (missingArrival && isRunning) {
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

    private TrajetCarteResponse toCarteResponse(Trajet trajet) {
        String geometrieItineraire = trajet.getGeometrieItineraire();
        if ((geometrieItineraire == null || geometrieItineraire.isBlank())
            && trajet.getLatitudeDepart() != null
            && trajet.getLongitudeDepart() != null
            && trajet.getLatitudeArrivee() != null
            && trajet.getLongitudeArrivee() != null) {
            try {
                OsrmService.RouteEstimation route = osrmService.calculerItineraire(
                    trajet.getLatitudeDepart(),
                    trajet.getLongitudeDepart(),
                    trajet.getLatitudeArrivee(),
                    trajet.getLongitudeArrivee(),
                    trajet.getTypeOptimisation()
                );
                if (route != null && route.geometryJson() != null && !route.geometryJson().isBlank()) {
                    geometrieItineraire = route.geometryJson();
                }
            } catch (RuntimeException ex) {
                log.warn("OSRM geometry fallback failed for trajet {}: {}", trajet.getId(), ex.getMessage());
            }
        }

        return new TrajetCarteResponse(
            trajet.getId(),
            trajet.getPointDepart(),
            trajet.getDestination(),
            trajet.getLatitudeDepart(),
            trajet.getLongitudeDepart(),
            trajet.getLatitudeArrivee(),
            trajet.getLongitudeArrivee(),
            trajet.getDistanceKm(),
            trajet.getDureeEstimeeMinutes(),
            geometrieItineraire,
            trajet.getStatut(),
            trajet.getVehicule() != null ? trajet.getVehicule().getId() : null,
            trajet.getVehicule() != null ? trajet.getVehicule().getMatricule() : null,
            trajet.getVehicule() != null ? trajet.getVehicule().getCouleur() : null,
            resolveVehiculeLatitude(trajet),
            resolveVehiculeLongitude(trajet),
            trajet.getVehicule() != null ? trajet.getVehicule().getVitesseActuelle() : null,
            trajet.getVehicule() != null ? trajet.getVehicule().getNiveauCarburant() : null,
            trajet.getChauffeur() != null ? trajet.getChauffeur().getId() : null,
            trajet.getChauffeur() != null ? trajet.getChauffeur().getTelephone() : null,
            trajet.getChauffeur() != null ? (trajet.getChauffeur().getPrenom() + " " + trajet.getChauffeur().getNom()).trim() : null,
            trajet.getChauffeur() != null ? trajet.getChauffeur().getImage() : null,
            trajet.getChauffeur() != null && trajet.getChauffeur().getRole() != null ? trajet.getChauffeur().getRole().name() : null,
            trajet.getChauffeur() != null && trajet.getChauffeur().getSecteur() != null ? trajet.getChauffeur().getSecteur().getNom() : null,
            trajet.getTypeOptimisation(),
            trajet.getChargeKg(),
            trajet.getVehicule() != null ? trajet.getVehicule().getKilometrage() : null,
            null
        );
    }

    /**
     * Résout la latitude réelle du véhicule pour l'affichage carte.
     * Si la dernière position GPS du véhicule est antérieure au démarrage du trajet
     * (ou absente), on retourne le point de départ du trajet pour que le camion
     * apparaisse au début de son itinéraire et non à sa position périmée.
     */
    private Double resolveVehiculeLatitude(Trajet trajet) {
        if (trajet.getVehicule() == null) return null;
        Double lat = trajet.getVehicule().getLatitudeActuelle();
        if (lat == null) return trajet.getLatitudeDepart();
        // Si la position GPS n'a jamais été mise à jour après le démarrage du trajet,
        // utiliser le point de départ du trajet
        LocalDateTime posMaj = trajet.getVehicule().getDernierePositionMaj();
        LocalDateTime dateDepart = trajet.getDateDepart();
        if (posMaj == null || (dateDepart != null && posMaj.isBefore(dateDepart))) {
            return trajet.getLatitudeDepart();
        }
        return lat;
    }

    /**
     * Résout la longitude réelle du véhicule pour l'affichage carte.
     * Même logique que resolveVehiculeLatitude.
     */
    private Double resolveVehiculeLongitude(Trajet trajet) {
        if (trajet.getVehicule() == null) return null;
        Double lng = trajet.getVehicule().getLongitudeActuelle();
        if (lng == null) return trajet.getLongitudeDepart();
        LocalDateTime posMaj = trajet.getVehicule().getDernierePositionMaj();
        LocalDateTime dateDepart = trajet.getDateDepart();
        if (posMaj == null || (dateDepart != null && posMaj.isBefore(dateDepart))) {
            return trajet.getLongitudeDepart();
        }
        return lng;
    }

    private void handleWeatherAlerts(Trajet trajet, Double latitude, Double longitude) {
        if (trajet == null || latitude == null || longitude == null || trajet.getId() == null) {
            return;
        }

        MeteoResponse meteo = meteoService.getMeteo(latitude, longitude);
        if (meteo == null || meteo.dangereux() == null || !meteo.dangereux()) {
            weatherAlertHistory.remove(trajet.getId());
            return;
        }

        String signature = meteo.etatGeneral() + ":" + meteo.risqueConduite();
        String previousSignature = weatherAlertHistory.put(trajet.getId(), signature);
        if (signature.equals(previousSignature)) {
            return;
        }

        List<Long> audience = buildNotificationAudience(trajet);
        for (Long userId : audience) {
            utilisateurRepository.findById(userId).ifPresent(user -> createWeatherNotification(user, trajet, meteo));
        }
    }

    private void createWeatherNotification(Utilisateur recipient, Trajet trajet, MeteoResponse meteo) {
        if (recipient == null || trajet == null || meteo == null) {
            return;
        }

        String message = buildWeatherMessage(recipient, trajet, meteo);
        if (message == null || message.isBlank()) {
            return;
        }

        Notification notification = Notification.builder()
            .type(TypeNotif.NOTIF_TRAJET)
            .message(message)
            .utilisateur(recipient)
            .build();
        notificationRepository.save(notification);
        notificationRealtimeService.publishToUsers(List.of(recipient.getId()), notification);
    }

    private String buildWeatherMessage(Utilisateur recipient, Trajet trajet, MeteoResponse meteo) {
        String chauffeurNom = trajet.getChauffeur() != null
            ? (trajet.getChauffeur().getPrenom() + " " + trajet.getChauffeur().getNom()).trim()
            : "le chauffeur";
        String destination = trajet.getDestination() != null ? trajet.getDestination() : "votre destination";

        return switch (meteo.etatGeneral()) {
            case "ORAGE" -> switch (recipient.getRole()) {
                case CHAUFFEUR -> "⛈️ Conditions météo dangereuses sur votre itinéraire. Orage en cours. Réduisez votre vitesse et soyez extrêmement prudent.";
                case MANAGER -> "⛈️ Alerte météo — Orage sur le trajet de " + chauffeurNom + " vers " + destination + ". Vitesse simulée réduite automatiquement.";
                case SUPERADMIN -> "⛈️ Alerte météo — Orage détecté sur le trajet de " + chauffeurNom + " vers " + destination + ".";
                default -> null;
            };
            case "BROUILLARD" -> switch (recipient.getRole()) {
                case CHAUFFEUR -> "🌫️ Brouillard épais détecté. Visibilité inférieure à 200 mètres. Allumez vos feux et réduisez votre vitesse.";
                case MANAGER -> "🌫️ Alerte météo — Brouillard épais sur le trajet de " + chauffeurNom + " vers " + destination + ".";
                case SUPERADMIN -> "🌫️ Alerte météo — Brouillard épais détecté sur le trajet de " + chauffeurNom + " vers " + destination + ".";
                default -> null;
            };
            case "NEIGE" -> switch (recipient.getRole()) {
                case CHAUFFEUR -> "❄️ Chute de neige détectée sur votre itinéraire. Réduisez votre vitesse et soyez très prudent.";
                case MANAGER -> "❄️ Alerte météo — Neige sur le trajet de " + chauffeurNom + " vers " + destination + ".";
                case SUPERADMIN -> "❄️ Alerte météo — Neige détectée sur le trajet de " + chauffeurNom + " vers " + destination + ".";
                default -> null;
            };
            default -> null;
        };
    }
}