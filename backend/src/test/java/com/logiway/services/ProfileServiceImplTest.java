package com.logiway.services;

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
import com.logiway.entities.Entreprise;
import com.logiway.entities.Manager;
import com.logiway.entities.Notification;
import com.logiway.entities.Trajet;
import com.logiway.entities.Utilisateur;
import com.logiway.entities.Vehicule;
import com.logiway.entities.enums.Role;
import com.logiway.entities.enums.StatutChauffeur;
import com.logiway.entities.enums.StatutCompte;
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
import com.logiway.services.impl.ProfileServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProfileServiceImplTest {

    @Mock
    private AuthenticatedUserService authenticatedUserService;
    @Mock
    private UtilisateurRepository utilisateurRepository;
    @Mock
    private NotificationRepository notificationRepository;
    @Mock
    private ChauffeurRepository chauffeurRepository;
    @Mock
    private TrajetRepository trajetRepository;
    @Mock
    private VehiculeRepository vehiculeRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private UserMapper userMapper;
    @Mock
    private KeycloakService keycloakService;
    @Mock
    private MailService mailService;
    @Mock
    private NotificationRealtimeService notificationRealtimeService;

    private ProfileServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new ProfileServiceImpl(authenticatedUserService, utilisateurRepository, notificationRepository,
            chauffeurRepository, trajetRepository, vehiculeRepository, passwordEncoder, userMapper,
            keycloakService, mailService, notificationRealtimeService);
    }

    private Utilisateur utilisateur() {
        Utilisateur u = new Utilisateur();
        u.setId(1L);
        u.setPrenom("Jean");
        u.setNom("Dupont");
        u.setEmail("jean@logiway.fr");
        u.setTelephone("0600000000");
        u.setImage("data:image/png;base64,abc");
        u.setPasswordHash("hash");
        u.setEmailVerifie(true);
        return u;
    }

    private Chauffeur chauffeur() {
        Chauffeur c = new Chauffeur();
        c.setId(10L);
        c.setPrenom("Marie");
        c.setNom("Martin");
        c.setEmail("marie@logiway.fr");
        c.setStatutConducteur(StatutChauffeur.LIBRE);
        return c;
    }

    private Vehicule vehicule() {
        Vehicule v = new Vehicule();
        v.setId(5L);
        v.setMatricule("AB-123-CD");
        v.setMarque("Renault");
        v.setModele("Master");
        v.setStatut(StatutVehicule.EN_SERVICE);
        v.setKilometrage(10000);
        v.setNiveauCarburant(50.0);
        v.setCapaciteCharge(1000.0);
        Entreprise e = new Entreprise();
        e.setId(3L);
        e.setNomEntreprise("Logiway");
        v.setEntreprise(e);
        return v;
    }

    private Trajet trajet(Long id, StatutTrajet statut, LocalDateTime depart, LocalDateTime arriveeReelle) {
        Trajet t = new Trajet();
        t.setId(id);
        t.setPointDepart("Paris");
        t.setDestination("Lyon");
        t.setLatitudeDepart(48.85);
        t.setLongitudeDepart(2.35);
        t.setLatitudeArrivee(45.75);
        t.setLongitudeArrivee(4.85);
        t.setDistanceKm(465.0);
        t.setDureeEstimeeMinutes(240);
        t.setDateDepart(depart);
        t.setDateArriveeReelle(arriveeReelle);
        t.setStatut(statut);
        return t;
    }

    private UserResponse userResponse() {
        return new UserResponse(1L, "kc-id", "Jean", "Dupont", "jean@logiway.fr", "0600000000", "France",
            "data:image/png;base64,abc", StatutCompte.ACTIF, true, true, null, Role.SUPERADMIN, null,
            null, null, null, null, null, null, null, LocalDateTime.now());
    }

    @Test
    void getCurrentProfile_returnsMappedUser() {
        Utilisateur currentUser = utilisateur();
        UserResponse expected = userResponse();
        when(authenticatedUserService.getCurrentUser()).thenReturn(currentUser);
        when(userMapper.toResponse(currentUser)).thenReturn(expected);

        UserResponse result = service.getCurrentProfile();

        assertThat(result).isSameAs(expected);
    }

    @Test
    void updateCurrentProfile_setsAllNonNullFields() {
        Utilisateur currentUser = utilisateur();
        when(authenticatedUserService.getCurrentUser()).thenReturn(currentUser);
        when(userMapper.toResponse(currentUser)).thenReturn(userResponse());

        service.updateCurrentProfile(new UpdateProfileRequest("Paul", "Durand", "0700000000", "img2"));

        assertThat(currentUser.getPrenom()).isEqualTo("Paul");
        assertThat(currentUser.getNom()).isEqualTo("Durand");
        assertThat(currentUser.getTelephone()).isEqualTo("0700000000");
        assertThat(currentUser.getImage()).isEqualTo("img2");
        verify(utilisateurRepository).save(currentUser);
    }

    @Test
    void updateCurrentProfile_ignoresNullFields() {
        Utilisateur currentUser = utilisateur();
        when(authenticatedUserService.getCurrentUser()).thenReturn(currentUser);
        when(userMapper.toResponse(currentUser)).thenReturn(userResponse());

        service.updateCurrentProfile(new UpdateProfileRequest(null, null, null, null));

        assertThat(currentUser.getPrenom()).isEqualTo("Jean");
        verify(utilisateurRepository).save(currentUser);
    }

    @Test
    void changeCurrentPassword_wrongOldPassword_throwsBadRequest() {
        Utilisateur currentUser = utilisateur();
        when(authenticatedUserService.getCurrentUser()).thenReturn(currentUser);
        when(passwordEncoder.matches("wrong", "hash")).thenReturn(false);

        assertThatThrownBy(() -> service.changeCurrentPassword(new ChangePasswordRequest("wrong", "nouveau123")))
            .isInstanceOf(BadRequestException.class)
            .hasMessage("Old password is incorrect");
    }

    @Test
    void changeCurrentPassword_success_verifiedUser() {
        Utilisateur currentUser = utilisateur();
        when(authenticatedUserService.getCurrentUser()).thenReturn(currentUser);
        when(passwordEncoder.matches("oldpass", "hash")).thenReturn(true);
        when(passwordEncoder.encode("nouveau123")).thenReturn("newhash");

        ApiMessageResponse result = service.changeCurrentPassword(new ChangePasswordRequest("oldpass", "nouveau123"));

        assertThat(result.message()).isEqualTo("Password changed successfully");
        assertThat(currentUser.getPasswordHash()).isEqualTo("newhash");
        verify(utilisateurRepository).save(currentUser);
        verify(keycloakService).updatePasswordByEmail("jean@logiway.fr", "nouveau123");
        verify(mailService, never()).sendAccountActivationConfirmationEmail(any());
    }

    @Test
    void changeCurrentPassword_success_sendsActivationConfirmation() {
        Chauffeur currentUser = new Chauffeur();
        currentUser.setId(1L);
        currentUser.setPrenom("Jean");
        currentUser.setNom("Dupont");
        currentUser.setEmail("jean@logiway.fr");
        currentUser.setPasswordHash("hash");
        currentUser.setEmailVerifie(false);
        currentUser.setManager(new Manager());
        currentUser.getManager().setId(2L);
        currentUser.getManager().setPrenom("Chef");
        currentUser.getManager().setNom("Manager");
        currentUser.getManager().setEmail("chef@logiway.fr");
        when(authenticatedUserService.getCurrentUser()).thenReturn(currentUser);
        when(passwordEncoder.matches("oldpass", "hash")).thenReturn(true);
        when(passwordEncoder.encode("nouveau123")).thenReturn("newhash");
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of());

        ApiMessageResponse result = service.changeCurrentPassword(new ChangePasswordRequest("oldpass", "nouveau123"));

        assertThat(result.message()).isEqualTo("Password changed successfully");
        assertThat(currentUser.getEmailVerifie()).isTrue();
        verify(mailService).sendAccountActivationConfirmationEmail(currentUser);
        verify(notificationRepository).save(any(Notification.class));
        verify(notificationRealtimeService).publishToUsers(anyList(), any(Notification.class));
    }

    @Test
    void changeCurrentPassword_activationNotificationFailureIsSwallowed() {
        Chauffeur currentUser = new Chauffeur();
        currentUser.setId(1L);
        currentUser.setPrenom("Jean");
        currentUser.setNom("Dupont");
        currentUser.setEmail("jean@logiway.fr");
        currentUser.setPasswordHash("hash");
        currentUser.setEmailVerifie(false);
        when(authenticatedUserService.getCurrentUser()).thenReturn(currentUser);
        when(passwordEncoder.matches("oldpass", "hash")).thenReturn(true);
        when(passwordEncoder.encode("nouveau123")).thenReturn("newhash");
        org.mockito.Mockito.doThrow(new RuntimeException("mail down"))
            .when(mailService).sendAccountActivationConfirmationEmail(any());

        ApiMessageResponse result = service.changeCurrentPassword(new ChangePasswordRequest("oldpass", "nouveau123"));

        assertThat(result.message()).isEqualTo("Password changed successfully");
        verify(notificationRealtimeService, never()).publishToUsers(anyList(), any(Notification.class));
    }

    @Test
    void getCurrentDriverDashboard_fullScenario() {
        Chauffeur chauffeur = chauffeur();
        Manager manager = new Manager();
        manager.setId(2L);
        manager.setPrenom("Chef");
        manager.setNom("Manager");
        manager.setEmail("chef@logiway.fr");
        chauffeur.setManager(manager);
        Vehicule vehicule = vehicule();
        chauffeur.setVehiculeActuel(vehicule);

        LocalDateTime now = LocalDateTime.now();
        Trajet active = trajet(1L, StatutTrajet.EN_COURS, LocalDate.now().atTime(LocalTime.NOON), null);
        active.setChauffeur(chauffeur);
        active.setVehicule(vehicule);
        active.setManager(manager);
        active.setDateArrivee(now.plusHours(2));
        Trajet complete = trajet(2L, StatutTrajet.COMPLETE, now.minusDays(1).minusHours(3), now.minusDays(1).minusHours(2));
        complete.setChauffeur(chauffeur);
        complete.setVehicule(vehicule);
        complete.setManager(manager);
        Trajet old = trajet(3L, StatutTrajet.COMPLETE, now.minusDays(3), now.minusDays(3).plusHours(2));
        old.setChauffeur(chauffeur);
        old.setVehicule(vehicule);
        old.setManager(manager);

        List<Trajet> trajets = new ArrayList<>(List.of(active, complete, old));
        when(authenticatedUserService.getCurrentUser()).thenReturn(chauffeur);
        when(chauffeurRepository.findByIdWithDashboardFetch(10L)).thenReturn(Optional.of(chauffeur));
        when(trajetRepository.findByChauffeurIdWithFetch(10L)).thenReturn(trajets);
        when(userMapper.toResponse(chauffeur)).thenReturn(userResponse());
        when(userMapper.toResponse(manager)).thenReturn(new UserResponse(2L, "kc-m", "Chef", "Manager",
            "chef@logiway.fr", null, null, null, StatutCompte.ACTIF, true, true, null, Role.MANAGER,
            null, 2L, "Chef", "Manager", null, null, null, null, null));
        Notification fuelNotif = Notification.builder()
            .type(TypeNotif.NOTIF_VEHICULE)
            .message("Niveau de carburant bas")
            .build();
        Notification deviationNotif = Notification.builder()
            .type(TypeNotif.NOTIF_VEHICULE)
            .message("Déviation détectée")
            .build();
        Notification otherNotif = Notification.builder()
            .type(TypeNotif.NOTIF_TRAJET)
            .message("Trajet assigné")
            .build();
        when(notificationRepository.findByUtilisateurOrderByDateCreationDesc(chauffeur))
            .thenReturn(List.of(fuelNotif, deviationNotif, otherNotif));

        ChauffeurDashboardResponse result = service.getCurrentDriverDashboard();

        assertThat(result).isNotNull();
        assertThat(result.manager()).isNotNull();
        assertThat(result.vehiculeActuel()).isNotNull();
        assertThat(result.vehiculeActuel().typeVehicule()).isEqualTo("Renault Master");
        assertThat(result.missionActuelle()).isNotNull();
        assertThat(result.missionActuelle().id()).isEqualTo(1L);
        assertThat(result.missionsDuJour()).hasSize(1);
        assertThat(result.missionsDuJour().get(0).id()).isEqualTo(1L);
        ChauffeurDashboardStatsResponse stats = result.statistiques();
        assertThat(stats.missionsCompletees()).isEqualTo(2L);
        assertThat(stats.alertesCarburantBas()).isEqualTo(1L);
        assertThat(stats.alertesDeviation()).isEqualTo(1L);
        assertThat(stats.alertesArretProlonge()).isZero();
        ChauffeurAvailabilityResponse availability = result.disponibiliteProchaine();
        assertThat(availability.disponible()).isFalse();
        assertThat(availability.dateDisponibilite()).isNotNull();
    }

    @Test
    void getCurrentDriverDashboard_chauffeurWithoutFetchedData() {
        Chauffeur chauffeur = chauffeur();
        when(authenticatedUserService.getCurrentUser()).thenReturn(chauffeur);
        when(chauffeurRepository.findByIdWithDashboardFetch(10L)).thenReturn(Optional.empty());
        when(trajetRepository.findByChauffeurIdWithFetch(10L)).thenReturn(new ArrayList<>());
        when(userMapper.toResponse(chauffeur)).thenReturn(userResponse());

        ChauffeurDashboardResponse result = service.getCurrentDriverDashboard();

        assertThat(result.vehiculeActuel()).isNull();
        assertThat(result.manager()).isNull();
        assertThat(result.missionActuelle()).isNull();
        assertThat(result.missionsDuJour()).isEmpty();
        assertThat(result.disponibiliteProchaine().disponible()).isTrue();
        assertThat(result.statistiques().missionsCompletees()).isZero();
    }

    @Test
    void getCurrentDriverDashboard_nonChauffeurThrowsBadRequest() {
        Utilisateur utilisateur = utilisateur();
        when(authenticatedUserService.getCurrentUser()).thenReturn(utilisateur);

        assertThatThrownBy(() -> service.getCurrentDriverDashboard())
            .isInstanceOf(BadRequestException.class)
            .hasMessage("Current user is not a chauffeur");
    }

    @Test
    @DisplayName("Dashboard : trajets sans dates de départ ou d'arrivée")
    void getCurrentDriverDashboard_coversMissingDateBranches() {
        Chauffeur chauffeur = chauffeur();
        Trajet noDepart = trajet(1L, StatutTrajet.COMPLETE, null, null);
        noDepart.setChauffeur(chauffeur);
        Trajet noArrival = trajet(2L, StatutTrajet.COMPLETE, LocalDateTime.now().minusDays(5), null);
        noArrival.setChauffeur(chauffeur);
        List<Trajet> trajets = new ArrayList<>(List.of(noDepart, noArrival));
        when(authenticatedUserService.getCurrentUser()).thenReturn(chauffeur);
        when(chauffeurRepository.findByIdWithDashboardFetch(10L)).thenReturn(Optional.of(chauffeur));
        when(trajetRepository.findByChauffeurIdWithFetch(10L)).thenReturn(trajets);
        when(userMapper.toResponse(chauffeur)).thenReturn(userResponse());
        when(notificationRepository.findByUtilisateurOrderByDateCreationDesc(chauffeur)).thenReturn(List.of());

        ChauffeurDashboardResponse result = service.getCurrentDriverDashboard();

        assertThat(result).isNotNull();
        assertThat(result.missionActuelle()).isNull();
        assertThat(result.missionsDuJour()).isEmpty();
        assertThat(result.statistiques().missionsCompletees()).isEqualTo(2L);
    }

    @Test
    @DisplayName("Trajets : calcul haversine de la distance et labels de performance")
    void getCurrentDriverTrips_computesHaversineDistanceAndPerformanceLabels() {
        Chauffeur chauffeur = chauffeur();
        LocalDateTime now = LocalDateTime.now();

        Trajet onTime = trajet(1L, StatutTrajet.COMPLETE, now.minusHours(1), now.minusHours(1).plusMinutes(1));
        onTime.setDistanceKm(null);
        onTime.setDureeEstimeeMinutes(0);

        Trajet lightDelay = trajet(2L, StatutTrajet.COMPLETE, now.minusHours(1), now.minusHours(1).plusMinutes(10));
        lightDelay.setDistanceKm(null);
        lightDelay.setDureeEstimeeMinutes(0);

        Trajet majorDelay = trajet(3L, StatutTrajet.COMPLETE, now.minusHours(1), now.minusHours(1).plusMinutes(45));
        majorDelay.setDistanceKm(null);
        majorDelay.setDureeEstimeeMinutes(0);

        Trajet missingCoordinate = trajet(4L, StatutTrajet.COMPLETE, now.minusHours(1), now.minusHours(1).plusMinutes(5));
        missingCoordinate.setDistanceKm(null);
        missingCoordinate.setLatitudeArrivee(null);

        List<Trajet> trajets = new ArrayList<>(List.of(onTime, lightDelay, majorDelay, missingCoordinate));
        when(authenticatedUserService.getCurrentUser()).thenReturn(chauffeur);
        when(chauffeurRepository.findByIdWithDashboardFetch(10L)).thenReturn(Optional.of(chauffeur));
        when(trajetRepository.findByChauffeurIdWithFetch(10L)).thenReturn(trajets);

        Page<TrajetResponse> page = service.getCurrentDriverTrips(null, null);

        assertThat(page.getContent()).hasSize(4);
        TrajetResponse onTimeResponse = page.getContent().get(0);
        assertThat(onTimeResponse.retardMinutes()).isEqualTo(1);
        assertThat(onTimeResponse.statutPerformance()).isEqualTo("À l'heure");
        assertThat(onTimeResponse.distanceKm()).isGreaterThan(0.0);
        TrajetResponse lightDelayResponse = page.getContent().get(1);
        assertThat(lightDelayResponse.retardMinutes()).isEqualTo(10);
        assertThat(lightDelayResponse.statutPerformance()).isEqualTo("Léger retard");
        TrajetResponse majorDelayResponse = page.getContent().get(2);
        assertThat(majorDelayResponse.retardMinutes()).isEqualTo(45);
        assertThat(majorDelayResponse.statutPerformance()).isEqualTo("Retard important");
        TrajetResponse missingCoordinateResponse = page.getContent().get(3);
        assertThat(missingCoordinateResponse.distanceKm()).isZero();
    }

    @Test
    void getCurrentDriverTrips_filtersAndPages() {
        Chauffeur chauffeur = chauffeur();
        LocalDateTime now = LocalDateTime.now();
        Trajet active = trajet(1L, StatutTrajet.EN_COURS, now.minusHours(1), null);
        Trajet complete = trajet(2L, StatutTrajet.COMPLETE, now.minusDays(1), now.minusDays(1).plusHours(1));
        Trajet complete2 = trajet(3L, StatutTrajet.COMPLETE, now.minusDays(2), now.minusDays(2).plusHours(1));
        List<Trajet> trajets = new ArrayList<>(List.of(active, complete, complete2));
        when(authenticatedUserService.getCurrentUser()).thenReturn(chauffeur);
        when(chauffeurRepository.findByIdWithDashboardFetch(10L)).thenReturn(Optional.of(chauffeur));
        when(trajetRepository.findByChauffeurIdWithFetch(10L)).thenReturn(trajets);

        Page<TrajetResponse> page = service.getCurrentDriverTrips(PageRequest.of(0, 1), StatutTrajet.COMPLETE);

        assertThat(page.getTotalElements()).isEqualTo(2L);
        assertThat(page.getContent()).hasSize(1);
        assertThat(page.getContent().get(0).statut()).isEqualTo(StatutTrajet.COMPLETE);
    }

    @Test
    void getCurrentDriverTrips_noFilterNoPageable() {
        Chauffeur chauffeur = chauffeur();
        LocalDateTime now = LocalDateTime.now();
        Trajet active = trajet(1L, StatutTrajet.EN_COURS, now.minusHours(1), null);
        when(authenticatedUserService.getCurrentUser()).thenReturn(chauffeur);
        when(chauffeurRepository.findByIdWithDashboardFetch(10L)).thenReturn(Optional.of(chauffeur));
        when(trajetRepository.findByChauffeurIdWithFetch(10L)).thenReturn(new ArrayList<>(List.of(active)));

        Page<TrajetResponse> page = service.getCurrentDriverTrips(null, null);

        assertThat(page.getTotalElements()).isEqualTo(1L);
        assertThat(page.getContent()).hasSize(1);
    }

    @Test
    void getCurrentDriverAvailability_computesFromLatestComplete() {
        Chauffeur chauffeur = chauffeur();
        LocalDateTime now = LocalDateTime.now();
        Trajet complete = trajet(2L, StatutTrajet.COMPLETE, now.minusDays(1).minusHours(3), now.minusDays(1).minusHours(2));
        when(authenticatedUserService.getCurrentUser()).thenReturn(chauffeur);
        when(chauffeurRepository.findByIdWithDashboardFetch(10L)).thenReturn(Optional.of(chauffeur));
        when(trajetRepository.findByChauffeurIdWithFetch(10L)).thenReturn(new ArrayList<>(List.of(complete)));

        ChauffeurAvailabilityResponse result = service.getCurrentDriverAvailability();

        assertThat(result).isNotNull();
        assertThat(result.disponible()).isTrue();
        assertThat(result.minutesRestantes()).isZero();
    }

    @Test
    void reconcileDriverAndVehicleStatusesOnStartup() {
        Chauffeur chauffeur = chauffeur();
        chauffeur.setStatutConducteur(StatutChauffeur.EN_SERVICE);
        when(chauffeurRepository.findAll()).thenReturn(List.of(chauffeur));
        when(trajetRepository.findByChauffeurIdWithFetch(10L)).thenReturn(new ArrayList<>());
        Vehicule vehicule = vehicule();
        vehicule.setStatut(StatutVehicule.HORS_SERVICE);
        Trajet active = trajet(1L, StatutTrajet.EN_COURS, LocalDateTime.now().minusHours(1), null);
        when(vehiculeRepository.findAll()).thenReturn(List.of(vehicule));
        when(trajetRepository.findByVehiculeIdWithFetch(5L)).thenReturn(new ArrayList<>(List.of(active)));

        service.reconcileDriverAndVehicleStatusesOnStartup();

        assertThat(chauffeur.getStatutConducteur()).isEqualTo(StatutChauffeur.LIBRE);
        verify(chauffeurRepository).save(chauffeur);
        assertThat(vehicule.getStatut()).isEqualTo(StatutVehicule.EN_SERVICE);
        verify(vehiculeRepository).save(vehicule);
    }

    @Test
    @DisplayName("Réconciliation : dernier trajet du véhicule COMPLETE → HORS_SERVICE")
    void reconcileDriverAndVehicleStatusesOnStartup_vehicleLatestTripCompleteSetHorsService() {
        Vehicule vehicule = vehicule();
        Trajet complete = trajet(9L, StatutTrajet.COMPLETE,
            LocalDateTime.now().minusDays(1), LocalDateTime.now().minusDays(1).plusHours(1));
        when(chauffeurRepository.findAll()).thenReturn(List.of());
        when(vehiculeRepository.findAll()).thenReturn(List.of(vehicule));
        when(trajetRepository.findByVehiculeIdWithFetch(5L)).thenReturn(new ArrayList<>(List.of(complete)));

        service.reconcileDriverAndVehicleStatusesOnStartup();

        assertThat(vehicule.getStatut()).isEqualTo(StatutVehicule.HORS_SERVICE);
        verify(vehiculeRepository).save(vehicule);
    }

    @Test
    void releaseDriversAfterRestPeriod_releasesAvailableDriver() {
        Chauffeur chauffeur = chauffeur();
        chauffeur.setStatutConducteur(StatutChauffeur.EN_SERVICE);
        Manager manager = new Manager();
        manager.setId(2L);
        chauffeur.setManager(manager);
        Utilisateur superAdmin = new Utilisateur();
        superAdmin.setId(99L);
        when(chauffeurRepository.findAll()).thenReturn(List.of(chauffeur));
        when(trajetRepository.findByChauffeurIdWithFetch(10L)).thenReturn(new ArrayList<>());
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of(superAdmin));
        when(utilisateurRepository.findById(10L)).thenReturn(Optional.of(chauffeur));
        when(utilisateurRepository.findById(2L)).thenReturn(Optional.of(manager));
        when(utilisateurRepository.findById(99L)).thenReturn(Optional.of(superAdmin));

        service.releaseDriversAfterRestPeriod();

        assertThat(chauffeur.getStatutConducteur()).isEqualTo(StatutChauffeur.LIBRE);
        verify(chauffeurRepository).save(chauffeur);
        verify(notificationRealtimeService, times(3)).publishToUsers(anyList(), any(Notification.class));
        verify(notificationRepository, times(3)).save(any(Notification.class));
    }

    @Test
    void releaseDriversAfterRestPeriod_busyDriverNotReleased() {
        Chauffeur chauffeur = chauffeur();
        chauffeur.setStatutConducteur(StatutChauffeur.EN_SERVICE);
        LocalDateTime now = LocalDateTime.now();
        Trajet active = trajet(1L, StatutTrajet.EN_COURS, now.minusHours(1), null);
        when(chauffeurRepository.findAll()).thenReturn(List.of(chauffeur));
        when(trajetRepository.findByChauffeurIdWithFetch(10L)).thenReturn(new ArrayList<>(List.of(active)));

        service.releaseDriversAfterRestPeriod();

        assertThat(chauffeur.getStatutConducteur()).isEqualTo(StatutChauffeur.EN_SERVICE);
        verify(chauffeurRepository, never()).save(any(Chauffeur.class));
    }

    @Test
    @DisplayName("Dashboard : branches null distance, alertes arret/stop, type vehicule et noms vides")
    void getCurrentDriverDashboard_coversRemainingBranches() {
        Chauffeur chauffeur = chauffeur();
        Manager manager = new Manager();
        manager.setId(2L);
        manager.setPrenom("Chef");
        manager.setNom("Manager");
        manager.setEmail("chef@logiway.fr");
        chauffeur.setManager(manager);
        Vehicule vehicule = vehicule();
        vehicule.setModele(null);
        vehicule.setEntreprise(null);
        chauffeur.setVehiculeActuel(vehicule);

        Manager namelessManager = new Manager();
        namelessManager.setId(3L);
        namelessManager.setPrenom(null);
        namelessManager.setNom(null);
        namelessManager.setEmail("nameless@logiway.fr");

        LocalDateTime now = LocalDateTime.now();
        Trajet todayActive = trajet(1L, StatutTrajet.EN_COURS, LocalDate.now().atTime(LocalTime.NOON), null);
        todayActive.setChauffeur(chauffeur);
        todayActive.setDistanceKm(null);
        todayActive.setManager(null);

        Trajet todayComplete = trajet(2L, StatutTrajet.COMPLETE, LocalDate.now().atTime(LocalTime.of(8, 0)), LocalDate.now().atTime(LocalTime.of(10, 0)));
        todayComplete.setChauffeur(chauffeur);
        todayComplete.setManager(namelessManager);

        List<Trajet> trajets = new ArrayList<>(List.of(todayActive, todayComplete));
        when(authenticatedUserService.getCurrentUser()).thenReturn(chauffeur);
        when(chauffeurRepository.findByIdWithDashboardFetch(10L)).thenReturn(Optional.of(chauffeur));
        when(trajetRepository.findByChauffeurIdWithFetch(10L)).thenReturn(trajets);
        when(userMapper.toResponse(chauffeur)).thenReturn(userResponse());
        when(userMapper.toResponse(manager)).thenReturn(new UserResponse(2L, "kc-m", "Chef", "Manager",
            "chef@logiway.fr", null, null, null, StatutCompte.ACTIF, true, true, null, Role.MANAGER,
            null, 2L, "Chef", "Manager", null, null, null, null, null));

        Notification nullMsgNotif = Notification.builder().type(TypeNotif.NOTIF_TRAJET).message(null).build();
        Notification blankMsgNotif = Notification.builder().type(TypeNotif.NOTIF_TRAJET).message("   ").build();
        Notification arretNotif = Notification.builder().type(TypeNotif.NOTIF_TRAJET).message("Arret prolonge").build();
        Notification stopNotif = Notification.builder().type(TypeNotif.NOTIF_TRAJET).message("Stop detecte").build();
        when(notificationRepository.findByUtilisateurOrderByDateCreationDesc(chauffeur))
            .thenReturn(new ArrayList<>(List.of(nullMsgNotif, blankMsgNotif, arretNotif, stopNotif)));

        ChauffeurDashboardResponse result = service.getCurrentDriverDashboard();

        assertThat(result).isNotNull();
        assertThat(result.vehiculeActuel()).isNotNull();
        assertThat(result.vehiculeActuel().typeVehicule()).isEqualTo("Renault");
        assertThat(result.vehiculeActuel().entrepriseId()).isNull();
        assertThat(result.vehiculeActuel().entrepriseNom()).isNull();
        assertThat(result.missionActuelle()).isNotNull();
        assertThat(result.missionActuelle().distanceKm()).isGreaterThan(0.0);
        assertThat(result.missionActuelle().managerId()).isEqualTo(2L);
        assertThat(result.missionActuelle().managerNom()).isEqualTo("Chef Manager");
        assertThat(result.missionsDuJour()).hasSize(2);
        TrajetResponse namelessTrip = result.missionsDuJour().get(1);
        assertThat(namelessTrip.managerId()).isEqualTo(3L);
        assertThat(namelessTrip.managerNom()).isEqualTo("nameless@logiway.fr");
        assertThat(result.statistiques().alertesArretProlonge()).isEqualTo(2L);
    }

    @Test
    @DisplayName("Trajets : manager null utilise celui du chauffeur, dureeEstimee null")
    void getCurrentDriverTrips_coversNullManagerAndDuration() {
        Chauffeur chauffeur = chauffeur();
        Manager manager = new Manager();
        manager.setId(2L);
        manager.setPrenom("Chef");
        manager.setNom("Manager");
        manager.setEmail("chef@logiway.fr");
        chauffeur.setManager(manager);

        LocalDateTime now = LocalDateTime.now();
        Trajet withNullManager = trajet(1L, StatutTrajet.COMPLETE, now.minusHours(2), now.minusHours(1));
        withNullManager.setChauffeur(chauffeur);
        withNullManager.setManager(null);
        withNullManager.setDureeEstimeeMinutes(null);

        List<Trajet> trajets = new ArrayList<>(List.of(withNullManager));
        when(authenticatedUserService.getCurrentUser()).thenReturn(chauffeur);
        when(chauffeurRepository.findByIdWithDashboardFetch(10L)).thenReturn(Optional.of(chauffeur));
        when(trajetRepository.findByChauffeurIdWithFetch(10L)).thenReturn(trajets);

        Page<TrajetResponse> page = service.getCurrentDriverTrips(null, null);

        assertThat(page.getContent()).hasSize(1);
        TrajetResponse resp = page.getContent().get(0);
        assertThat(resp.managerId()).isEqualTo(2L);
        assertThat(resp.managerNom()).isEqualTo("Chef Manager");
        assertThat(resp.retardMinutes()).isEqualTo(60);
    }

    @Test
    @DisplayName("Reconciliation : chauffeur indisponible -> EN_SERVICE, vehicule sans trajets -> inchangé")
    void reconcileDriverAndVehicleStatuses_coversUnavailableAndNoTrips() {
        Chauffeur chauffeur = chauffeur();
        chauffeur.setStatutConducteur(StatutChauffeur.LIBRE);
        LocalDateTime now = LocalDateTime.now();
        Trajet active = trajet(1L, StatutTrajet.EN_COURS, now.minusHours(1), null);
        when(chauffeurRepository.findAll()).thenReturn(List.of(chauffeur));
        when(trajetRepository.findByChauffeurIdWithFetch(10L)).thenReturn(new ArrayList<>(List.of(active)));

        Vehicule vehicule = vehicule();
        when(vehiculeRepository.findAll()).thenReturn(List.of(vehicule));
        when(trajetRepository.findByVehiculeIdWithFetch(5L)).thenReturn(new ArrayList<>());

        service.reconcileDriverAndVehicleStatusesOnStartup();

        assertThat(chauffeur.getStatutConducteur()).isEqualTo(StatutChauffeur.EN_SERVICE);
        verify(chauffeurRepository).save(chauffeur);
        verify(vehiculeRepository, never()).save(vehicule);
    }

    @Test
    @DisplayName("releaseDriversAfterRestPeriod : chauffeur déjà LIBRE et disponible → aucun changement")
    void releaseDriversAfterRestPeriod_alreadyLibre_noChange() {
        Chauffeur chauffeur = chauffeur();
        chauffeur.setStatutConducteur(StatutChauffeur.LIBRE);
        when(chauffeurRepository.findAll()).thenReturn(List.of(chauffeur));
        when(trajetRepository.findByChauffeurIdWithFetch(10L)).thenReturn(new ArrayList<>());

        service.releaseDriversAfterRestPeriod();

        assertThat(chauffeur.getStatutConducteur()).isEqualTo(StatutChauffeur.LIBRE);
        verify(chauffeurRepository, never()).save(any(Chauffeur.class));
    }

    @Test
    @DisplayName("changeCurrentPassword : activation d'un Utilisateur non-Chauffeur → couvre instanceof false")
    void changeCurrentPassword_nonChaffeurActivation_coversInstanceofFalse() {
        Utilisateur currentUser = utilisateur();
        currentUser.setEmailVerifie(false);
        Utilisateur superAdmin = new Utilisateur();
        superAdmin.setId(99L);
        when(authenticatedUserService.getCurrentUser()).thenReturn(currentUser);
        when(passwordEncoder.matches("oldpass", "hash")).thenReturn(true);
        when(passwordEncoder.encode("nouveau123")).thenReturn("newhash");
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of(superAdmin));

        service.changeCurrentPassword(new ChangePasswordRequest("oldpass", "nouveau123"));

        assertThat(currentUser.getEmailVerifie()).isTrue();
        verify(notificationRepository, times(1)).save(any(Notification.class));
        verify(notificationRealtimeService, times(1)).publishToUsers(anyList(), any(Notification.class));
    }

    @Test
    @DisplayName("changeCurrentPassword : activation Chauffeur avec manager null → couvre manager != null false")
    void changeCurrentPassword_chauffeurWithNullManager_coversManagerNullBranch() {
        Chauffeur currentUser = new Chauffeur();
        currentUser.setId(1L);
        currentUser.setPrenom("Jean");
        currentUser.setNom("Dupont");
        currentUser.setEmail("jean@logiway.fr");
        currentUser.setPasswordHash("hash");
        currentUser.setEmailVerifie(false);
        currentUser.setManager(null);
        Utilisateur superAdmin = new Utilisateur();
        superAdmin.setId(99L);
        when(authenticatedUserService.getCurrentUser()).thenReturn(currentUser);
        when(passwordEncoder.matches("oldpass", "hash")).thenReturn(true);
        when(passwordEncoder.encode("nouveau123")).thenReturn("newhash");
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of(superAdmin));

        service.changeCurrentPassword(new ChangePasswordRequest("oldpass", "nouveau123"));

        assertThat(currentUser.getEmailVerifie()).isTrue();
        verify(notificationRepository, times(1)).save(any(Notification.class));
        verify(notificationRealtimeService, times(1)).publishToUsers(anyList(), any(Notification.class));
    }

    @Test
    @DisplayName("Dashboard : alerte avec message contenant 'fuel' en anglais → catégorisée carburant")
    void getCurrentDriverDashboard_fuelAlertInEnglish_coversFuelBranch() {
        Chauffeur chauffeur = chauffeur();
        when(authenticatedUserService.getCurrentUser()).thenReturn(chauffeur);
        when(chauffeurRepository.findByIdWithDashboardFetch(10L)).thenReturn(Optional.of(chauffeur));
        when(trajetRepository.findByChauffeurIdWithFetch(10L)).thenReturn(new ArrayList<>());
        when(userMapper.toResponse(chauffeur)).thenReturn(userResponse());
        Notification fuelEnNotif = Notification.builder()
            .type(TypeNotif.NOTIF_VEHICULE)
            .message("Low fuel level warning")
            .build();
        when(notificationRepository.findByUtilisateurOrderByDateCreationDesc(chauffeur))
            .thenReturn(List.of(fuelEnNotif));

        ChauffeurDashboardResponse result = service.getCurrentDriverDashboard();

        assertThat(result.statistiques().alertesCarburantBas()).isEqualTo(1L);
    }

    @Test
    @DisplayName("Trajets : statut ACTIF couvre la branche ACTIF de computeTripTimingMetrics")
    void getCurrentDriverTrips_actifStatus_coversActifBranch() {
        Chauffeur chauffeur = chauffeur();
        LocalDateTime now = LocalDateTime.now();
        Trajet actif = trajet(1L, StatutTrajet.ACTIF, now.minusHours(1), null);
        actif.setChauffeur(chauffeur);
        List<Trajet> trajets = new ArrayList<>(List.of(actif));
        when(authenticatedUserService.getCurrentUser()).thenReturn(chauffeur);
        when(chauffeurRepository.findByIdWithDashboardFetch(10L)).thenReturn(Optional.of(chauffeur));
        when(trajetRepository.findByChauffeurIdWithFetch(10L)).thenReturn(trajets);

        Page<TrajetResponse> page = service.getCurrentDriverTrips(null, null);

        assertThat(page.getContent()).hasSize(1);
        assertThat(page.getContent().get(0).statut()).isEqualTo(StatutTrajet.ACTIF);
    }

    @Test
    @DisplayName("estimateDistanceKm : latitudeDepart null → retourne 0.0")
    void getCurrentDriverTrips_nullLatitudeDepart_returnsZeroDistance() {
        Chauffeur chauffeur = chauffeur();
        LocalDateTime now = LocalDateTime.now();
        Trajet t = trajet(1L, StatutTrajet.COMPLETE, now.minusHours(1), now.minusMinutes(30));
        t.setChauffeur(chauffeur);
        t.setDistanceKm(null);
        t.setLatitudeDepart(null);
        List<Trajet> trajets = new ArrayList<>(List.of(t));
        when(authenticatedUserService.getCurrentUser()).thenReturn(chauffeur);
        when(chauffeurRepository.findByIdWithDashboardFetch(10L)).thenReturn(Optional.of(chauffeur));
        when(trajetRepository.findByChauffeurIdWithFetch(10L)).thenReturn(trajets);

        Page<TrajetResponse> page = service.getCurrentDriverTrips(null, null);

        assertThat(page.getContent()).hasSize(1);
        assertThat(page.getContent().get(0).distanceKm()).isZero();
    }

    @Test
    @DisplayName("Dashboard : vehicule avec marque null → typeVehicule null")
    void getCurrentDriverDashboard_vehiculeNullMarque_coversNullMarqueBranch() {
        Chauffeur chauffeur = chauffeur();
        Vehicule vehicule = vehicule();
        vehicule.setMarque(null);
        chauffeur.setVehiculeActuel(vehicule);
        when(authenticatedUserService.getCurrentUser()).thenReturn(chauffeur);
        when(chauffeurRepository.findByIdWithDashboardFetch(10L)).thenReturn(Optional.of(chauffeur));
        when(trajetRepository.findByChauffeurIdWithFetch(10L)).thenReturn(new ArrayList<>());
        when(userMapper.toResponse(chauffeur)).thenReturn(userResponse());

        ChauffeurDashboardResponse result = service.getCurrentDriverDashboard();

        assertThat(result.vehiculeActuel()).isNotNull();
        assertThat(result.vehiculeActuel().typeVehicule()).isNull();
    }

    @Test
    @DisplayName("Réconciliation : chauffeur déjà LIBRE et disponible → aucun save")
    void reconcileDriverAndVehicleStatuses_chauffeurAlreadyLibre_noSave() {
        Chauffeur chauffeur = chauffeur();
        chauffeur.setStatutConducteur(StatutChauffeur.LIBRE);
        when(chauffeurRepository.findAll()).thenReturn(List.of(chauffeur));
        when(trajetRepository.findByChauffeurIdWithFetch(10L)).thenReturn(new ArrayList<>());
        when(vehiculeRepository.findAll()).thenReturn(List.of());

        service.reconcileDriverAndVehicleStatusesOnStartup();

        assertThat(chauffeur.getStatutConducteur()).isEqualTo(StatutChauffeur.LIBRE);
        verify(chauffeurRepository, never()).save(any(Chauffeur.class));
    }

    @Test
    @DisplayName("Réconciliation : véhicule avec trajet à statut null → expectedStatus = vehicule.statut")
    void reconcileDriverAndVehicleStatuses_vehicleWithNullStatutTrip_coversNullStatutBranch() {
        Vehicule vehicule = vehicule();
        vehicule.setStatut(StatutVehicule.EN_SERVICE);
        Trajet tripWithNullStatut = trajet(1L, null, LocalDateTime.now().minusHours(1), LocalDateTime.now().minusMinutes(30));
        when(chauffeurRepository.findAll()).thenReturn(List.of());
        when(vehiculeRepository.findAll()).thenReturn(List.of(vehicule));
        when(trajetRepository.findByVehiculeIdWithFetch(5L)).thenReturn(new ArrayList<>(List.of(tripWithNullStatut)));

        service.reconcileDriverAndVehicleStatusesOnStartup();

        assertThat(vehicule.getStatut()).isEqualTo(StatutVehicule.EN_SERVICE);
        verify(vehiculeRepository, never()).save(any(Vehicule.class));
    }

    @Test
    @DisplayName("releaseDriversAfterRestPeriod : trajet ACTIF → couvre la branche ACTIF de computeAvailability")
    void releaseDriversAfterRestPeriod_actifTrip_coversActifBranch() {
        Chauffeur chauffeur = chauffeur();
        chauffeur.setStatutConducteur(StatutChauffeur.EN_SERVICE);
        LocalDateTime now = LocalDateTime.now();
        Trajet actif = trajet(1L, StatutTrajet.ACTIF, now.minusHours(1), null);
        when(chauffeurRepository.findAll()).thenReturn(List.of(chauffeur));
        when(trajetRepository.findByChauffeurIdWithFetch(10L)).thenReturn(new ArrayList<>(List.of(actif)));

        service.releaseDriversAfterRestPeriod();

        assertThat(chauffeur.getStatutConducteur()).isEqualTo(StatutChauffeur.EN_SERVICE);
        verify(chauffeurRepository, never()).save(any(Chauffeur.class));
    }

    @Test
    @DisplayName("releaseDriversAfterRestPeriod : repos non expiré → isBefore true, pas de libération")
    void releaseDriversAfterRestPeriod_restNotExpired_coversIsBeforeTrue() {
        Chauffeur chauffeur = chauffeur();
        chauffeur.setStatutConducteur(StatutChauffeur.EN_SERVICE);
        LocalDateTime now = LocalDateTime.now();
        Trajet recentComplete = trajet(1L, StatutTrajet.COMPLETE, now.minusHours(2), now.minusHours(1));
        when(chauffeurRepository.findAll()).thenReturn(List.of(chauffeur));
        when(trajetRepository.findByChauffeurIdWithFetch(10L)).thenReturn(new ArrayList<>(List.of(recentComplete)));

        service.releaseDriversAfterRestPeriod();

        assertThat(chauffeur.getStatutConducteur()).isEqualTo(StatutChauffeur.EN_SERVICE);
        verify(chauffeurRepository, never()).save(any(Chauffeur.class));
    }

    @Test
    @DisplayName("releaseDriversAfterRestPeriod : chauffeur id null et manager null → couvre branches null")
    void releaseDriversAfterRestPeriod_nullChauffeurIdAndNullManager_coversNullBranches() {
        Chauffeur chauffeur = new Chauffeur();
        chauffeur.setId(null);
        chauffeur.setPrenom("Test");
        chauffeur.setNom("Null");
        chauffeur.setEmail("test@logiway.fr");
        chauffeur.setStatutConducteur(StatutChauffeur.EN_SERVICE);
        chauffeur.setManager(null);
        when(chauffeurRepository.findAll()).thenReturn(List.of(chauffeur));
        when(trajetRepository.findByChauffeurIdWithFetch(null)).thenReturn(new ArrayList<>());
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of());

        service.releaseDriversAfterRestPeriod();

        assertThat(chauffeur.getStatutConducteur()).isEqualTo(StatutChauffeur.LIBRE);
        verify(chauffeurRepository).save(chauffeur);
        verify(notificationRepository, never()).save(any(Notification.class));
    }

    @Test
    @DisplayName("releaseDriversAfterRestPeriod : manager avec getId() null → couvre manager.getId() null")
    void releaseDriversAfterRestPeriod_managerWithNullId_coversManagerGetIdNull() {
        Chauffeur chauffeur = chauffeur();
        chauffeur.setStatutConducteur(StatutChauffeur.EN_SERVICE);
        Manager manager = new Manager();
        manager.setId(null);
        manager.setPrenom("Chef");
        manager.setNom("Manager");
        manager.setEmail("chef@logiway.fr");
        chauffeur.setManager(manager);
        Utilisateur superAdmin = new Utilisateur();
        superAdmin.setId(99L);
        when(chauffeurRepository.findAll()).thenReturn(List.of(chauffeur));
        when(trajetRepository.findByChauffeurIdWithFetch(10L)).thenReturn(new ArrayList<>());
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of(superAdmin));
        when(utilisateurRepository.findById(10L)).thenReturn(Optional.of(chauffeur));
        when(utilisateurRepository.findById(99L)).thenReturn(Optional.of(superAdmin));

        service.releaseDriversAfterRestPeriod();

        assertThat(chauffeur.getStatutConducteur()).isEqualTo(StatutChauffeur.LIBRE);
        verify(chauffeurRepository).save(chauffeur);
        verify(notificationRealtimeService, times(2)).publishToUsers(anyList(), any(Notification.class));
        verify(notificationRepository, times(2)).save(any(Notification.class));
    }
}
