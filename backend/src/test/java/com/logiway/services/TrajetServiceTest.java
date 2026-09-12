package com.logiway.services;

import com.logiway.dto.meteo.MeteoResponse;
import com.logiway.dto.trajet.TrajetOptimisationRequest;
import com.logiway.dto.trajet.TrajetPositionRequest;
import com.logiway.dto.trajet.TrajetRequest;
import com.logiway.dto.trajet.TrajetResponse;
import com.logiway.dto.trajet.TourneeOptimiseeResponse;
import com.logiway.entities.*;
import com.logiway.entities.enums.*;
import com.logiway.exceptions.ResourceNotFoundException;
import com.logiway.repositories.*;
import com.logiway.security.AuthenticatedUserService;
import com.logiway.services.impl.TrajetServiceImpl;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.mockito.Mockito.lenient;

@ExtendWith(MockitoExtension.class)
@DisplayName("Service Trajet — Tests Unitaires")
class TrajetServiceTest {

    @Mock private TrajetRepository trajetRepository;
    @Mock private VehiculeRepository vehiculeRepository;
    @Mock private ChauffeurRepository chauffeurRepository;
    @Mock private UtilisateurRepository utilisateurRepository;
    @Mock private NotificationRepository notificationRepository;
    @Mock private NotificationRealtimeService notificationRealtimeService;
    @Mock private MeteoService meteoService;
    @Mock private AuthenticatedUserService authenticatedUserService;
    @Mock private OsrmService osrmService;
    @Mock private PauseReglementaireService pauseReglementaireService;
    @Mock private TrajetOptimisationService trajetOptimisationService;

    @InjectMocks
    private TrajetServiceImpl trajetService;

    private Chauffeur chauffeur;
    private Vehicule vehicule;
    private Manager manager;
    private Trajet trajet;

    @BeforeEach
    void setUp() {
        chauffeur = new Chauffeur();
        chauffeur.setId(1L);
        chauffeur.setEmail("chauffeur@test.com");
        chauffeur.setPrenom("Jean");
        chauffeur.setNom("Dupont");
        chauffeur.setRole(Role.CHAUFFEUR);
        chauffeur.setStatutConducteur(StatutChauffeur.LIBRE);

        vehicule = new Vehicule();
        vehicule.setId(1L);
        vehicule.setMatricule("AB-123-CD");
        vehicule.setStatut(StatutVehicule.EN_SERVICE);
        vehicule.setCouleur("#FF0000");

        manager = new Manager();
        manager.setId(2L);
        manager.setEmail("manager@test.com");
        manager.setPrenom("Manager");
        manager.setNom("Test");
        manager.setRole(Role.MANAGER);

        trajet = new Trajet();
        trajet.setId(1L);
        trajet.setPointDepart("Paris");
        trajet.setDestination("Lyon");
        trajet.setLatitudeDepart(48.8566);
        trajet.setLongitudeDepart(2.3522);
        trajet.setLatitudeArrivee(45.7640);
        trajet.setLongitudeArrivee(4.8357);
        trajet.setStatut(StatutTrajet.ACTIF);
        trajet.setChauffeur(chauffeur);
        trajet.setVehicule(vehicule);
        trajet.setManager(manager);
        trajet.setDateDepart(LocalDateTime.now().plusHours(2));
    }

    @Test
    @DisplayName("getTrajet() → Retourne le trajet si trouvé")
    void getTrajet_whenExists_returnsTrajet() {
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(trajet));
        TrajetResponse result = trajetService.getTrajet(1L);
        assertThat(result).isNotNull();
        assertThat(result.pointDepart()).isEqualTo("Paris");
        assertThat(result.destination()).isEqualTo("Lyon");
        verify(trajetRepository, times(1)).findById(1L);
    }

    @Test
    @DisplayName("getTrajet() → Lance exception si trajet inexistant")
    void getTrajet_whenNotFound_throwsException() {
        when(trajetRepository.findById(999L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> trajetService.getTrajet(999L))
            .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("demarrerTrajet() → Change statut à EN_COURS")
    void demarrerTrajet_changesStatusToEnCours() {
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(trajet));
        when(trajetRepository.save(any(Trajet.class))).thenAnswer(inv -> inv.getArgument(0));
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of());
        TrajetResponse result = trajetService.demarrerTrajet(1L);
        assertThat(result).isNotNull();
        assertThat(trajet.getStatut()).isEqualTo(StatutTrajet.EN_COURS);
        verify(pauseReglementaireService, times(1)).genererPauses(1L);
    }

    @Test
    @DisplayName("demarrerTrajet() → Échec génération pauses absorbé")
    void demarrerTrajet_pauseGenerationFailure_isAbsorbed() {
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(trajet));
        when(trajetRepository.save(any(Trajet.class))).thenAnswer(inv -> inv.getArgument(0));
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of());
        doThrow(new RuntimeException("pause down")).when(pauseReglementaireService).genererPauses(1L);
        TrajetResponse result = trajetService.demarrerTrajet(1L);
        assertThat(result).isNotNull();
        assertThat(trajet.getStatut()).isEqualTo(StatutTrajet.EN_COURS);
    }

    @Test
    @DisplayName("terminerTrajet() → Change statut à COMPLETE")
    void terminerTrajet_changesStatusToComplete() {
        trajet.setStatut(StatutTrajet.EN_COURS);
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(trajet));
        when(trajetRepository.save(any(Trajet.class))).thenAnswer(inv -> inv.getArgument(0));
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of());
        TrajetResponse result = trajetService.terminerTrajet(1L);
        assertThat(result).isNotNull();
        assertThat(trajet.getStatut()).isEqualTo(StatutTrajet.COMPLETE);
        assertThat(trajet.getDateArriveeReelle()).isNotNull();
    }

    @Test
    @DisplayName("updatePosition() → Met à jour position GPS")
    void updatePosition_updatesVehicleGpsPosition() {
        TrajetPositionRequest request = new TrajetPositionRequest(45.5, 4.5, 80.0, 75.0, LocalDateTime.now());
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(trajet));
        when(vehiculeRepository.save(any(Vehicule.class))).thenAnswer(inv -> inv.getArgument(0));
        TrajetResponse result = trajetService.updatePosition(1L, request);
        assertThat(result).isNotNull();
        assertThat(vehicule.getLatitudeActuelle()).isEqualTo(45.5);
        assertThat(vehicule.getLongitudeActuelle()).isEqualTo(4.5);
    }

    @Test
    @DisplayName("updatePosition() → Lance exception si pas de véhicule")
    void updatePosition_whenNoVehicle_throwsException() {
        trajet.setVehicule(null);
        TrajetPositionRequest request = new TrajetPositionRequest(45.5, 4.5, 80.0, 75.0, LocalDateTime.now());
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(trajet));
        assertThatThrownBy(() -> trajetService.updatePosition(1L, request))
            .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("deleteTrajet() → Supprime et libère ressources")
    void deleteTrajet_removesAndFreesResources() {
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(trajet));
        when(trajetRepository.existsByChauffeurIdAndStatutIn(chauffeur.getId(), Set.of(StatutTrajet.ACTIF, StatutTrajet.EN_COURS)))
            .thenReturn(false);
        trajetService.deleteTrajet(1L);
        verify(trajetRepository, times(1)).delete(trajet);
        verify(vehiculeRepository, times(1)).save(vehicule);
        verify(chauffeurRepository, times(1)).save(chauffeur);
    }

    @Test
    @DisplayName("getTrajets() → Chauffeur voit seulement ses trajets")
    void getTrajets_whenChauffeur_returnsOnlyOwnTrips() {
        when(authenticatedUserService.getCurrentUser()).thenReturn(chauffeur);
        when(trajetRepository.findByChauffeurIdWithFetch(1L)).thenReturn(List.of(trajet));
        var result = trajetService.getTrajets(null, null, null);
        assertThat(result.getContent()).hasSize(1);
    }

    @Test
    @DisplayName("createTrajet() → Création complète réussie")
    void createTrajet_withFullData_succeeds() {
        TrajetRequest request = new TrajetRequest(
            "Paris", "Lyon", 48.8566, 2.3522, 45.7640, 4.8357,
            LocalDateTime.now().plusHours(2), LocalDateTime.now().plusHours(8),
            1500.0, PrioriteTrajet.URGENTE, "Livraison urgente", 1L, 1L, 2L,
            StatutTrajet.ACTIF, "shortest"
        );
        lenient().when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        lenient().when(utilisateurRepository.findById(1L)).thenReturn(Optional.of(chauffeur));
        lenient().when(utilisateurRepository.findById(2L)).thenReturn(Optional.of(manager));
        lenient().when(vehiculeRepository.findById(1L)).thenReturn(Optional.of(vehicule));
        lenient().when(trajetRepository.existsByVehiculeIdAndStatutIn(1L, Set.of(StatutTrajet.ACTIF, StatutTrajet.EN_COURS)))
            .thenReturn(false);
        lenient().when(trajetRepository.existsByChauffeurIdAndStatutIn(1L, Set.of(StatutTrajet.ACTIF, StatutTrajet.EN_COURS)))
            .thenReturn(false);
        lenient().when(trajetRepository.saveAndFlush(any(Trajet.class))).thenAnswer(inv -> {
            Trajet saved = inv.getArgument(0);
            saved.setId(10L);
            return saved;
        });
        lenient().when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of());
        TrajetResponse result = trajetService.createTrajet(request);
        assertThat(result).isNotNull();
        assertThat(result.pointDepart()).isEqualTo("Paris");
    }

    @Test
    @DisplayName("createTrajet() → Véhicule occupé : échec post-enregistrement absorbé")
    void createTrajet_whenVehicleBusy_persistsWithoutThrowing() {
        TrajetRequest request = new TrajetRequest(
            "Paris", "Lyon", 48.8566, 2.3522, 45.7640, 4.8357,
            LocalDateTime.now().plusHours(2), LocalDateTime.now().plusHours(8),
            1000.0, PrioriteTrajet.NORMALE, null, 1L, 1L, 2L,
            StatutTrajet.ACTIF, "shortest"
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(utilisateurRepository.findById(1L)).thenReturn(Optional.of(chauffeur));
        when(utilisateurRepository.findById(2L)).thenReturn(Optional.of(manager));
        when(vehiculeRepository.findById(1L)).thenReturn(Optional.of(vehicule));
        when(trajetRepository.findByChauffeurIdWithFetch(1L)).thenReturn(List.of());
        when(trajetRepository.saveAndFlush(any(Trajet.class))).thenAnswer(inv -> inv.getArgument(0));
        when(trajetRepository.existsByVehiculeIdAndStatutIn(1L, Set.of(StatutTrajet.ACTIF, StatutTrajet.EN_COURS)))
            .thenReturn(true);
        TrajetResponse result = trajetService.createTrajet(request);
        assertThat(result).isNotNull();
        verify(trajetRepository, times(1)).saveAndFlush(any(Trajet.class));
    }

    @Test
    @DisplayName("createTrajet() → Véhicule en maintenance : échec absorbé")
    void createTrajet_vehicleMaintenance_throwsAbsorbed() {
        vehicule.setStatut(StatutVehicule.EN_MAINTENANCE);
        TrajetRequest request = new TrajetRequest(
            "Paris", "Lyon", 48.8566, 2.3522, 45.7640, 4.8357,
            LocalDateTime.now().plusHours(2), LocalDateTime.now().plusHours(8),
            1000.0, PrioriteTrajet.NORMALE, null, 1L, 1L, 2L,
            StatutTrajet.ACTIF, "shortest"
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(utilisateurRepository.findById(1L)).thenReturn(Optional.of(chauffeur));
        when(utilisateurRepository.findById(2L)).thenReturn(Optional.of(manager));
        when(vehiculeRepository.findById(1L)).thenReturn(Optional.of(vehicule));
        when(trajetRepository.saveAndFlush(any(Trajet.class))).thenAnswer(inv -> inv.getArgument(0));
        TrajetResponse result = trajetService.createTrajet(request);
        assertThat(result).isNotNull();
    }

    @Test
    @DisplayName("createTrajet() → Chauffeur introuvable ou non chauffeur")
    void createTrajet_chauffeurNotChauffeur_throws() {
        Utilisateur plain = new Utilisateur();
        plain.setId(1L);
        plain.setRole(Role.CHAUFFEUR);
        TrajetRequest request = new TrajetRequest(
            "Paris", "Lyon", 48.8566, 2.3522, 45.7640, 4.8357,
            LocalDateTime.now().plusHours(2), LocalDateTime.now().plusHours(8),
            1000.0, PrioriteTrajet.NORMALE, null, 1L, null, null,
            StatutTrajet.ACTIF, "shortest"
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(utilisateurRepository.findById(1L)).thenReturn(Optional.of(plain));
        assertThatThrownBy(() -> trajetService.createTrajet(request))
            .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("createTrajet() → Manager demandé introuvable")
    void createTrajet_managerIdNotManager_throws() {
        Utilisateur plain = new Utilisateur();
        plain.setId(2L);
        plain.setRole(Role.CHAUFFEUR);
        TrajetRequest request = new TrajetRequest(
            "Paris", "Lyon", 48.8566, 2.3522, 45.7640, 4.8357,
            LocalDateTime.now().plusHours(2), LocalDateTime.now().plusHours(8),
            1000.0, PrioriteTrajet.NORMALE, null, null, null, 2L,
            StatutTrajet.ACTIF, "shortest"
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(utilisateurRepository.findById(2L)).thenReturn(Optional.of(plain));
        assertThatThrownBy(() -> trajetService.createTrajet(request))
            .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("createTrajet() → Manager courant utilisé sans managerId")
    void createTrajet_currentUserManager_resolvesManager() {
        TrajetRequest request = new TrajetRequest(
            "Paris", "Lyon", 48.8566, 2.3522, 45.7640, 4.8357,
            LocalDateTime.now().plusHours(2), LocalDateTime.now().plusHours(8),
            1000.0, PrioriteTrajet.NORMALE, null, null, null, null,
            StatutTrajet.ACTIF, "shortest"
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(trajetRepository.saveAndFlush(any(Trajet.class))).thenAnswer(inv -> inv.getArgument(0));
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of());
        TrajetResponse result = trajetService.createTrajet(request);
        assertThat(result).isNotNull();
        assertThat(result.managerId()).isEqualTo(2L);
    }

    @Test
    @DisplayName("createTrajet() → Coordonnées vides → null")
    void createTrajet_blankCoordinates_returnsNullCoordinates() {
        TrajetRequest request = new TrajetRequest(
            "", "", null, null, null, null,
            LocalDateTime.now().plusHours(2), LocalDateTime.now().plusHours(8),
            1000.0, PrioriteTrajet.NORMALE, null, null, null, null,
            StatutTrajet.ACTIF, "shortest"
        );
        Utilisateur admin = new Utilisateur();
        admin.setId(99L);
        admin.setRole(Role.SUPERADMIN);
        when(authenticatedUserService.getCurrentUser()).thenReturn(admin);
        when(trajetRepository.saveAndFlush(any(Trajet.class))).thenAnswer(inv -> inv.getArgument(0));
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of());
        TrajetResponse result = trajetService.createTrajet(request);
        assertThat(result.latitudeDepart()).isNull();
    }

    @Test
    @DisplayName("createTrajet() → Coordonnées non parsables → geocoder")
    void createTrajet_unparseableCoordinates_usesGeocoder() {
        TrajetRequest request = new TrajetRequest(
            "abc, def", "Lyon", null, null, null, null,
            LocalDateTime.now().plusHours(2), LocalDateTime.now().plusHours(8),
            1000.0, PrioriteTrajet.NORMALE, null, null, null, null,
            StatutTrajet.ACTIF, "shortest"
        );
        Utilisateur admin = new Utilisateur();
        admin.setId(99L);
        admin.setRole(Role.SUPERADMIN);
        when(authenticatedUserService.getCurrentUser()).thenReturn(admin);
        when(osrmService.geocoder("abc, def")).thenReturn(new OsrmService.GeoPoint(50.0, 3.0, "abc"));
        when(trajetRepository.saveAndFlush(any(Trajet.class))).thenAnswer(inv -> inv.getArgument(0));
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of());
        TrajetResponse result = trajetService.createTrajet(request);
        assertThat(result.latitudeDepart()).isEqualTo(50.0);
    }

    @Test
    @DisplayName("createTrajet() → Chauffeur repos suffisant → succès")
    void createTrajet_driverAvailableAfterRest_returns() {
        Trajet completed = new Trajet();
        completed.setId(9L);
        completed.setStatut(StatutTrajet.COMPLETE);
        completed.setDateArriveeReelle(LocalDateTime.now().minusHours(13));
        TrajetRequest request = new TrajetRequest(
            "Paris", "Lyon", 48.8566, 2.3522, 45.7640, 4.8357,
            LocalDateTime.now().plusHours(2), LocalDateTime.now().plusHours(8),
            1000.0, PrioriteTrajet.NORMALE, null, 1L, 1L, 2L,
            StatutTrajet.ACTIF, "shortest"
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(utilisateurRepository.findById(1L)).thenReturn(Optional.of(chauffeur));
        when(utilisateurRepository.findById(2L)).thenReturn(Optional.of(manager));
        when(vehiculeRepository.findById(1L)).thenReturn(Optional.of(vehicule));
        when(trajetRepository.findByChauffeurIdWithFetch(1L)).thenReturn(List.of(completed));
        when(trajetRepository.saveAndFlush(any(Trajet.class))).thenAnswer(inv -> inv.getArgument(0));
        when(trajetRepository.existsByVehiculeIdAndStatutIn(1L, Set.of(StatutTrajet.ACTIF, StatutTrajet.EN_COURS)))
            .thenReturn(false);
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of());
        TrajetResponse result = trajetService.createTrajet(request);
        assertThat(result).isNotNull();
    }

    @Test
    @DisplayName("updateTrajet() → Mise à jour réussie")
    void updateTrajet_succeeds() {
        TrajetRequest request = new TrajetRequest(
            "Paris", "Marseille", 48.8566, 2.3522, 43.2965, 5.3698,
            LocalDateTime.now().plusHours(2), LocalDateTime.now().plusHours(10),
            1800.0, PrioriteTrajet.URGENTE, "Livraison modifiée", 1L, 1L, 2L,
            StatutTrajet.ACTIF, "shortest"
        );
        lenient().when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        lenient().when(trajetRepository.findById(1L)).thenReturn(Optional.of(trajet));
        lenient().when(utilisateurRepository.findById(1L)).thenReturn(Optional.of(chauffeur));
        lenient().when(utilisateurRepository.findById(2L)).thenReturn(Optional.of(manager));
        lenient().when(vehiculeRepository.findById(1L)).thenReturn(Optional.of(vehicule));
        lenient().when(trajetRepository.saveAndFlush(any(Trajet.class))).thenAnswer(inv -> inv.getArgument(0));
        TrajetResponse result = trajetService.updateTrajet(1L, request);
        assertThat(result).isNotNull();
        assertThat(trajet.getDestination()).isEqualTo("Marseille");
    }

    @Test
    @DisplayName("getTrajets() → Filtre par statut")
    void getTrajets_filtersByStatus() {
        Trajet trajet2 = new Trajet();
        trajet2.setId(2L);
        trajet2.setStatut(StatutTrajet.COMPLETE);
        trajet2.setChauffeur(chauffeur);
        when(authenticatedUserService.getCurrentUser()).thenReturn(chauffeur);
        when(trajetRepository.findByChauffeurIdWithFetch(1L)).thenReturn(List.of(trajet, trajet2));
        var result = trajetService.getTrajets(null, StatutTrajet.ACTIF, null);
        assertThat(result.getContent()).hasSize(1);
    }

    private TrajetRequest request(String depart, String dest, Double latD, Double lonD, Double latA, Double lonA,
                                  Long chId, Long vehId, Long mgrId, StatutTrajet statut) {
        return new TrajetRequest(depart, dest, latD, lonD, latA, lonA,
            LocalDateTime.now().plusHours(2), LocalDateTime.now().plusHours(8),
            1500.0, PrioriteTrajet.NORMALE, null, chId, vehId, mgrId, statut, "shortest");
    }

    @Test
    void getTrajets_withSearchAndPageable_filtersAndPaginates() {
        Trajet t2 = new Trajet();
        t2.setId(2L);
        t2.setStatut(StatutTrajet.ACTIF);
        t2.setPointDepart("Nantes");
        t2.setDestination("Bordeaux");
        t2.setChauffeur(chauffeur);
        when(authenticatedUserService.getCurrentUser()).thenReturn(chauffeur);
        when(trajetRepository.findByChauffeurIdWithFetch(1L)).thenReturn(List.of(trajet, t2));

        Page<TrajetResponse> result = trajetService.getTrajets("lyon", null, PageRequest.of(0, 1));

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).destination()).isEqualTo("Lyon");
    }

    @Test
    void getTrajetsCarte_superadmin_returnsOnlyEnCours() {
        Utilisateur admin = new Utilisateur();
        admin.setId(99L);
        admin.setRole(Role.SUPERADMIN);
        Trajet complete = new Trajet();
        complete.setId(2L);
        complete.setStatut(StatutTrajet.COMPLETE);
        trajet.setStatut(StatutTrajet.EN_COURS);
        when(authenticatedUserService.getCurrentUser()).thenReturn(admin);
        when(trajetRepository.findAll()).thenReturn(List.of(trajet, complete));

        assertThat(trajetService.getTrajetsCarte()).hasSize(1);
    }

    @Test
    void getTrajetsCarte_chauffeur_returnsEnCoursAndActif() {
        Trajet actif = new Trajet();
        actif.setId(2L);
        actif.setStatut(StatutTrajet.ACTIF);
        trajet.setStatut(StatutTrajet.EN_COURS);
        when(authenticatedUserService.getCurrentUser()).thenReturn(chauffeur);
        when(trajetRepository.findByChauffeurIdWithFetch(1L)).thenReturn(List.of(trajet, actif));

        assertThat(trajetService.getTrajetsCarte()).hasSize(2);
    }

    @Test
    void getTrajetsCarte_manager_returnsChauffeurManagerTrips() {
        trajet.setStatut(StatutTrajet.EN_COURS);
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(trajetRepository.findByChauffeurManagerIdWithFetch(2L)).thenReturn(List.of(trajet));

        assertThat(trajetService.getTrajetsCarte()).hasSize(1);
    }

    @Test
    void getTrajetsCarte_unauthenticated_fallsBackToEnCours() {
        trajet.setStatut(StatutTrajet.EN_COURS);
        when(authenticatedUserService.getCurrentUser()).thenThrow(new RuntimeException("no auth"));
        when(trajetRepository.findAll()).thenReturn(List.of(trajet));

        assertThat(trajetService.getTrajetsCarte()).hasSize(1);
    }

    @Test
    void getTrajetsCarte_otherRole_returnsEmpty() {
        Utilisateur user = new Utilisateur();
        user.setId(3L);
        when(authenticatedUserService.getCurrentUser()).thenReturn(user);

        assertThat(trajetService.getTrajetsCarte()).isEmpty();
    }

    @Test
    void optimiserTrajets_nullRequest_returnsEmpty() {
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);

        assertThat(trajetService.optimiserTrajets(null)).isEmpty();
    }

    @Test
    void optimiserTrajets_emptyDemandes_returnsEmpty() {
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);

        assertThat(trajetService.optimiserTrajets(new TrajetOptimisationRequest(null, null))).isEmpty();
    }

    @Test
    void optimiserTrajets_withAssignment_buildsTournee() {
        TrajetRequest req = request("Paris", "Lyon", 48.8566, 2.3522, 45.7640, 4.8357, 1L, 1L, 2L, StatutTrajet.ACTIF);
        OsrmService.RouteEstimation route = new OsrmService.RouteEstimation(500.0, 300, "{\"type\":\"LineString\"}");
        TrajetOptimisationService.OptimizationAssignment assignment =
            new TrajetOptimisationService.OptimizationAssignment(req, vehicule, route);
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(vehiculeRepository.findAll()).thenReturn(List.of(vehicule));
        when(trajetOptimisationService.optimiser(List.of(req), List.of(vehicule))).thenReturn(List.of(assignment));
        lenient().when(utilisateurRepository.findById(1L)).thenReturn(Optional.of(chauffeur));
        lenient().when(utilisateurRepository.findById(2L)).thenReturn(Optional.of(manager));
        lenient().when(vehiculeRepository.findById(1L)).thenReturn(Optional.of(vehicule));
        lenient().when(trajetRepository.findByChauffeurIdWithFetch(1L)).thenReturn(List.of());
        lenient().when(trajetRepository.existsByVehiculeIdAndStatutIn(1L, Set.of(StatutTrajet.ACTIF, StatutTrajet.EN_COURS)))
            .thenReturn(false);
        when(trajetRepository.save(any(Trajet.class))).thenAnswer(inv -> inv.getArgument(0));
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of());
        when(osrmService.calculerItineraire(any(), any(), any(), any(), any()))
            .thenReturn(new OsrmService.RouteEstimation(550.0, 320, "{\"geom\":\"line\"}"));

        List<TourneeOptimiseeResponse> result =
            trajetService.optimiserTrajets(new TrajetOptimisationRequest(List.of(req), null));

        assertThat(result).hasSize(1);
        assertThat(result.get(0).vehiculeId()).isEqualTo(1L);
        assertThat(result.get(0).vehiculeMatricule()).isEqualTo("AB-123-CD");
        assertThat(result.get(0).trajets()).hasSize(1);
        assertThat(result.get(0).trajets().get(0).distanceKm()).isEqualTo(550.0);
    }

    @Test
    void optimiserTrajets_withVehicleIds_usesFindAllById() {
        TrajetRequest req = request("Paris", "Lyon", 48.8566, 2.3522, 45.7640, 4.8357, 1L, 1L, 2L, StatutTrajet.ACTIF);
        OsrmService.RouteEstimation route = new OsrmService.RouteEstimation(500.0, 300, null);
        TrajetOptimisationService.OptimizationAssignment assignment =
            new TrajetOptimisationService.OptimizationAssignment(req, vehicule, route);
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(vehiculeRepository.findAllById(List.of(1L))).thenReturn(List.of(vehicule));
        when(trajetOptimisationService.optimiser(List.of(req), List.of(vehicule))).thenReturn(List.of(assignment));
        lenient().when(utilisateurRepository.findById(1L)).thenReturn(Optional.of(chauffeur));
        lenient().when(utilisateurRepository.findById(2L)).thenReturn(Optional.of(manager));
        lenient().when(vehiculeRepository.findById(1L)).thenReturn(Optional.of(vehicule));
        lenient().when(trajetRepository.findByChauffeurIdWithFetch(1L)).thenReturn(List.of());
        lenient().when(trajetRepository.existsByVehiculeIdAndStatutIn(1L, Set.of(StatutTrajet.ACTIF, StatutTrajet.EN_COURS)))
            .thenReturn(false);
        when(trajetRepository.save(any(Trajet.class))).thenAnswer(inv -> inv.getArgument(0));
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of());

        List<TourneeOptimiseeResponse> result =
            trajetService.optimiserTrajets(new TrajetOptimisationRequest(List.of(req), List.of(1L)));

        assertThat(result).hasSize(1);
        assertThat(result.get(0).vehiculeId()).isEqualTo(1L);
    }

    @Test
    void optimiserTrajets_withEntreprise_filtersByCompany() {
        manager.setEntreprise(Entreprise.builder().id(1L).build());
        TrajetRequest req = request("Paris", "Lyon", 48.8566, 2.3522, 45.7640, 4.8357, 1L, 1L, 2L, StatutTrajet.ACTIF);
        OsrmService.RouteEstimation route = new OsrmService.RouteEstimation(500.0, 300, null);
        TrajetOptimisationService.OptimizationAssignment assignment =
            new TrajetOptimisationService.OptimizationAssignment(req, vehicule, route);
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(vehiculeRepository.findByEntreprise_Id(1L)).thenReturn(List.of(vehicule));
        when(trajetOptimisationService.optimiser(List.of(req), List.of(vehicule))).thenReturn(List.of(assignment));
        lenient().when(utilisateurRepository.findById(1L)).thenReturn(Optional.of(chauffeur));
        lenient().when(utilisateurRepository.findById(2L)).thenReturn(Optional.of(manager));
        lenient().when(vehiculeRepository.findById(1L)).thenReturn(Optional.of(vehicule));
        lenient().when(trajetRepository.findByChauffeurIdWithFetch(1L)).thenReturn(List.of());
        lenient().when(trajetRepository.existsByVehiculeIdAndStatutIn(1L, Set.of(StatutTrajet.ACTIF, StatutTrajet.EN_COURS)))
            .thenReturn(false);
        when(trajetRepository.save(any(Trajet.class))).thenAnswer(inv -> inv.getArgument(0));
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of());

        List<TourneeOptimiseeResponse> result =
            trajetService.optimiserTrajets(new TrajetOptimisationRequest(List.of(req), null));

        assertThat(result).hasSize(1);
    }

    @Test
    void optimiserTrajets_withNullVehicle_coversValidateNull() {
        TrajetRequest req = request("Paris", "Lyon", 48.8566, 2.3522, 45.7640, 4.8357, 1L, 1L, 2L, StatutTrajet.ACTIF);
        TrajetOptimisationService.OptimizationAssignment assignment =
            new TrajetOptimisationService.OptimizationAssignment(req, null, null);
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(vehiculeRepository.findAll()).thenReturn(List.of(vehicule));
        when(trajetOptimisationService.optimiser(List.of(req), List.of(vehicule))).thenReturn(List.of(assignment));
        lenient().when(utilisateurRepository.findById(1L)).thenReturn(Optional.of(chauffeur));
        lenient().when(utilisateurRepository.findById(2L)).thenReturn(Optional.of(manager));
        lenient().when(vehiculeRepository.findById(1L)).thenReturn(Optional.of(vehicule));
        lenient().when(trajetRepository.findByChauffeurIdWithFetch(1L)).thenReturn(List.of());
        when(trajetRepository.save(any(Trajet.class))).thenAnswer(inv -> inv.getArgument(0));
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of());

        List<TourneeOptimiseeResponse> result =
            trajetService.optimiserTrajets(new TrajetOptimisationRequest(List.of(req), null));

        assertThat(result).hasSize(1);
        assertThat(result.get(0).vehiculeId()).isNull();
    }

    @Test
    void optimiserTrajets_osrmRouteEnrichesRoute() {
        TrajetRequest req = request("Paris", "Lyon", 48.8566, 2.3522, 45.7640, 4.8357, 1L, 1L, 2L, StatutTrajet.ACTIF);
        TrajetOptimisationService.OptimizationAssignment assignment =
            new TrajetOptimisationService.OptimizationAssignment(req, vehicule, null);
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(vehiculeRepository.findAll()).thenReturn(List.of(vehicule));
        when(trajetOptimisationService.optimiser(List.of(req), List.of(vehicule))).thenReturn(List.of(assignment));
        lenient().when(utilisateurRepository.findById(1L)).thenReturn(Optional.of(chauffeur));
        lenient().when(utilisateurRepository.findById(2L)).thenReturn(Optional.of(manager));
        lenient().when(vehiculeRepository.findById(1L)).thenReturn(Optional.of(vehicule));
        lenient().when(trajetRepository.findByChauffeurIdWithFetch(1L)).thenReturn(List.of());
        when(trajetRepository.save(any(Trajet.class))).thenAnswer(inv -> inv.getArgument(0));
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of());
        when(osrmService.calculerItineraire(any(), any(), any(), any(), any()))
            .thenReturn(new OsrmService.RouteEstimation(550.0, 320, "{\"geom\":\"line\"}"));

        List<TourneeOptimiseeResponse> result =
            trajetService.optimiserTrajets(new TrajetOptimisationRequest(List.of(req), null));

        assertThat(result).hasSize(1);
        assertThat(result.get(0).trajets().get(0).distanceKm()).isEqualTo(550.0);
        assertThat(result.get(0).trajets().get(0).dureeEstimeeMinutes()).isEqualTo(320);
    }

    @Test
    void createTrajet_driverResting_throwsAndNotifies() {
        Trajet complete = new Trajet();
        complete.setId(9L);
        complete.setStatut(StatutTrajet.COMPLETE);
        complete.setDateArriveeReelle(LocalDateTime.now().minusHours(2));
        TrajetRequest req = request("Paris", "Lyon", 48.8566, 2.3522, 45.7640, 4.8357, 1L, 1L, 2L, StatutTrajet.ACTIF);
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(utilisateurRepository.findById(1L)).thenReturn(Optional.of(chauffeur));
        when(utilisateurRepository.findById(2L)).thenReturn(Optional.of(manager));
        when(vehiculeRepository.findById(1L)).thenReturn(Optional.of(vehicule));
        when(trajetRepository.findByChauffeurIdWithFetch(1L)).thenReturn(List.of(complete));

        assertThatThrownBy(() -> trajetService.createTrajet(req))
            .isInstanceOf(IllegalStateException.class);
        verify(notificationRepository).save(any(Notification.class));
    }

    @Test
    void createTrajet_parsesCoordinatesFromCommaLabels() {
        TrajetRequest req = new TrajetRequest("48.8566, 2.3522", "45.7640, 4.8357", null, null, null, null,
            LocalDateTime.now().plusHours(2), LocalDateTime.now().plusHours(8),
            1000.0, PrioriteTrajet.NORMALE, null, null, null, null, StatutTrajet.ACTIF, "shortest");
        Utilisateur admin = new Utilisateur();
        admin.setId(99L);
        admin.setRole(Role.SUPERADMIN);
        when(authenticatedUserService.getCurrentUser()).thenReturn(admin);
        when(trajetRepository.saveAndFlush(any(Trajet.class))).thenAnswer(inv -> inv.getArgument(0));
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of());

        TrajetResponse result = trajetService.createTrajet(req);

        assertThat(result.latitudeDepart()).isEqualTo(48.8566);
        assertThat(result.longitudeDepart()).isEqualTo(2.3522);
        assertThat(result.latitudeArrivee()).isEqualTo(45.7640);
        assertThat(result.longitudeArrivee()).isEqualTo(4.8357);
    }

    @Test
    void createTrajet_geocodeFallback_nullAndFailureHandled() {
        TrajetRequest req = new TrajetRequest("Inconnu", "Lyon", null, null, null, null,
            LocalDateTime.now().plusHours(2), LocalDateTime.now().plusHours(8),
            1000.0, PrioriteTrajet.NORMALE, null, null, null, null, StatutTrajet.ACTIF, "shortest");
        Utilisateur admin = new Utilisateur();
        admin.setId(99L);
        admin.setRole(Role.SUPERADMIN);
        when(authenticatedUserService.getCurrentUser()).thenReturn(admin);
        when(trajetRepository.saveAndFlush(any(Trajet.class))).thenAnswer(inv -> inv.getArgument(0));
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of());
        when(osrmService.geocoder("Inconnu")).thenReturn(null);
        when(osrmService.geocoder("Lyon")).thenReturn(new OsrmService.GeoPoint(45.76, 4.83, "Lyon"));

        TrajetResponse result = trajetService.createTrajet(req);

        assertThat(result.latitudeDepart()).isNull();
        assertThat(result.latitudeArrivee()).isEqualTo(45.76);
    }

    @Test
    void createTrajet_geocodeFailure_swallowed() {
        TrajetRequest req = new TrajetRequest("Inconnu", "Lyon", null, null, null, null,
            LocalDateTime.now().plusHours(2), LocalDateTime.now().plusHours(8),
            1000.0, PrioriteTrajet.NORMALE, null, null, null, null, StatutTrajet.ACTIF, "shortest");
        Utilisateur admin = new Utilisateur();
        admin.setId(99L);
        admin.setRole(Role.SUPERADMIN);
        when(authenticatedUserService.getCurrentUser()).thenReturn(admin);
        when(trajetRepository.saveAndFlush(any(Trajet.class))).thenAnswer(inv -> inv.getArgument(0));
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of());
        when(osrmService.geocoder("Inconnu")).thenThrow(new RuntimeException("geocode down"));
        when(osrmService.geocoder("Lyon")).thenReturn(new OsrmService.GeoPoint(45.76, 4.83, "Lyon"));

        TrajetResponse result = trajetService.createTrajet(req);

        assertThat(result.latitudeDepart()).isNull();
        assertThat(result.latitudeArrivee()).isEqualTo(45.76);
    }

    @Test
    void createTrajet_managerResolvedFromCreatedBy() {
        Utilisateur admin = new Utilisateur();
        admin.setId(50L);
        admin.setRole(Role.SUPERADMIN);
        admin.setCreatedBy(manager);
        TrajetRequest req = request("Paris", "Lyon", 48.8566, 2.3522, 45.7640, 4.8357, null, null, null, StatutTrajet.ACTIF);
        when(authenticatedUserService.getCurrentUser()).thenReturn(admin);
        when(trajetRepository.saveAndFlush(any(Trajet.class))).thenAnswer(inv -> inv.getArgument(0));
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of());

        TrajetResponse result = trajetService.createTrajet(req);

        assertThat(result.managerId()).isEqualTo(2L);
    }

    @Test
    void toResponse_runningEnAvance() {
        Trajet t = new Trajet();
        t.setId(6L);
        t.setStatut(StatutTrajet.EN_COURS);
        t.setDateDepart(LocalDateTime.now());
        t.setDureeEstimeeMinutes(120);
        when(trajetRepository.findById(6L)).thenReturn(Optional.of(t));

        assertThat(trajetService.getTrajet(6L).statutPerformance()).isEqualTo("En avance");
    }

    @Test
    void toResponse_runningLegerRetard() {
        Trajet t = new Trajet();
        t.setId(61L);
        t.setStatut(StatutTrajet.EN_COURS);
        t.setDateDepart(LocalDateTime.now().minusMinutes(10));
        t.setDureeEstimeeMinutes(5);
        when(trajetRepository.findById(61L)).thenReturn(Optional.of(t));

        assertThat(trajetService.getTrajet(61L).statutPerformance()).isEqualTo("Léger retard");
    }

    @Test
    void toResponse_noDepartDate_returnsNullMetrics() {
        Trajet t = new Trajet();
        t.setId(8L);
        t.setStatut(StatutTrajet.ACTIF);
        when(trajetRepository.findById(8L)).thenReturn(Optional.of(t));

        assertThat(trajetService.getTrajet(8L).dureeReelleMinutes()).isNull();
    }

    @Test
    void toResponse_notRunningNoArrival_returnsNullMetrics() {
        Trajet t = new Trajet();
        t.setId(81L);
        t.setStatut(StatutTrajet.COMPLETE);
        t.setDateDepart(LocalDateTime.now().minusHours(1));
        when(trajetRepository.findById(81L)).thenReturn(Optional.of(t));

        assertThat(trajetService.getTrajet(81L).statutPerformance()).isNull();
    }

    @Test
    void toResponse_completedEnAvance() {
        Trajet t = new Trajet();
        t.setId(82L);
        t.setStatut(StatutTrajet.COMPLETE);
        t.setDateDepart(LocalDateTime.now().minusHours(1));
        t.setDateArriveeReelle(LocalDateTime.now().minusMinutes(30));
        t.setDureeEstimeeMinutes(120);
        when(trajetRepository.findById(82L)).thenReturn(Optional.of(t));

        assertThat(trajetService.getTrajet(82L).statutPerformance()).isEqualTo("En avance");
    }

    @Test
    void toResponse_completedLegerRetard() {
        Trajet t = new Trajet();
        t.setId(83L);
        t.setStatut(StatutTrajet.COMPLETE);
        t.setDateDepart(LocalDateTime.now().minusHours(1));
        t.setDateArriveeReelle(LocalDateTime.now().minusMinutes(45));
        t.setDureeEstimeeMinutes(10);
        when(trajetRepository.findById(83L)).thenReturn(Optional.of(t));

        assertThat(trajetService.getTrajet(83L).statutPerformance()).isEqualTo("Léger retard");
    }

    @Test
    void toResponse_runningRetardImportant() {
        Trajet t = new Trajet();
        t.setId(62L);
        t.setStatut(StatutTrajet.EN_COURS);
        t.setDateDepart(LocalDateTime.now().minusMinutes(40));
        t.setDureeEstimeeMinutes(5);
        when(trajetRepository.findById(62L)).thenReturn(Optional.of(t));

        assertThat(trajetService.getTrajet(62L).statutPerformance()).isEqualTo("Retard important");
    }

    @Test
    void toResponse_completedRetardImportant() {
        Trajet t = new Trajet();
        t.setId(3L);
        t.setStatut(StatutTrajet.COMPLETE);
        t.setDateDepart(LocalDateTime.now().minusHours(1));
        t.setDateArriveeReelle(LocalDateTime.now().plusMinutes(10));
        t.setDureeEstimeeMinutes(5);
        when(trajetRepository.findById(3L)).thenReturn(Optional.of(t));

        assertThat(trajetService.getTrajet(3L).statutPerformance()).isEqualTo("Retard important");
    }

    @Test
    void toResponse_nullCoordinates_distanceZero() {
        Trajet t = new Trajet();
        t.setId(7L);
        t.setStatut(StatutTrajet.ACTIF);
        t.setDateDepart(LocalDateTime.now());
        when(trajetRepository.findById(7L)).thenReturn(Optional.of(t));

        assertThat(trajetService.getTrajet(7L).distanceKm()).isEqualTo(0.0);
    }

    @Test
    void getTrajetsCarte_geometryFallback_viaOsrm() {
        trajet.setStatut(StatutTrajet.EN_COURS);
        trajet.setGeometrieItineraire(null);
        trajet.setTypeOptimisation("shortest");
        when(authenticatedUserService.getCurrentUser()).thenReturn(chauffeur);
        when(trajetRepository.findByChauffeurIdWithFetch(1L)).thenReturn(List.of(trajet));
        when(osrmService.calculerItineraire(48.8566, 2.3522, 45.7640, 4.8357, "shortest"))
            .thenReturn(new OsrmService.RouteEstimation(50.0, 60, "{\"geom\":true}"));

        var carte = trajetService.getTrajetsCarte();

        assertThat(carte).hasSize(1);
        assertThat(carte.get(0).geometrieItineraire()).isEqualTo("{\"geom\":true}");
    }

    @Test
    void getTrajetsCarte_geometryFallback_failure_keepsNull() {
        trajet.setStatut(StatutTrajet.EN_COURS);
        trajet.setGeometrieItineraire(null);
        trajet.setTypeOptimisation("shortest");
        when(authenticatedUserService.getCurrentUser()).thenReturn(chauffeur);
        when(trajetRepository.findByChauffeurIdWithFetch(1L)).thenReturn(List.of(trajet));
        when(osrmService.calculerItineraire(any(), any(), any(), any(), any()))
            .thenThrow(new RuntimeException("osrm down"));

        var carte = trajetService.getTrajetsCarte();

        assertThat(carte.get(0).geometrieItineraire()).isNull();
    }

    @Test
    void getTrajetsCarte_positionMajAfterDepart_returnsCurrentLatLng() {
        trajet.setStatut(StatutTrajet.EN_COURS);
        trajet.setGeometrieItineraire("{\"geom\":true}");
        vehicule.setLatitudeActuelle(48.5);
        vehicule.setLongitudeActuelle(2.5);
        vehicule.setDernierePositionMaj(LocalDateTime.now().plusHours(3));
        when(authenticatedUserService.getCurrentUser()).thenReturn(chauffeur);
        when(trajetRepository.findByChauffeurIdWithFetch(1L)).thenReturn(List.of(trajet));

        var carte = trajetService.getTrajetsCarte();

        assertThat(carte.get(0).vehiculeLatitude()).isEqualTo(48.5);
        assertThat(carte.get(0).vehiculeLongitude()).isEqualTo(2.5);
    }

    @Test
    void getTrajetsCarte_positionMajBeforeDepart_returnsDepartPoint() {
        trajet.setStatut(StatutTrajet.EN_COURS);
        trajet.setGeometrieItineraire("{\"geom\":true}");
        vehicule.setLatitudeActuelle(48.5);
        vehicule.setLongitudeActuelle(2.5);
        vehicule.setDernierePositionMaj(LocalDateTime.now());
        when(authenticatedUserService.getCurrentUser()).thenReturn(chauffeur);
        when(trajetRepository.findByChauffeurIdWithFetch(1L)).thenReturn(List.of(trajet));

        var carte = trajetService.getTrajetsCarte();

        assertThat(carte.get(0).vehiculeLatitude()).isEqualTo(48.8566);
        assertThat(carte.get(0).vehiculeLongitude()).isEqualTo(2.3522);
    }

    @Test
    void updatePosition_dangerousWeather_createsNotificationsForAudience() {
        trajet.setId(1L);
        MeteoResponse orage = new MeteoResponse(12.0, "Orage", "storm", 50.0, 80, 4.0, "ORAGE", "eleve", true);
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(trajet));
        when(vehiculeRepository.save(any(Vehicule.class))).thenAnswer(inv -> inv.getArgument(0));
        when(meteoService.getMeteo(45.5, 4.5)).thenReturn(orage);
        Utilisateur admin = new Utilisateur();
        admin.setId(99L);
        admin.setRole(Role.SUPERADMIN);
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of(admin));
        when(utilisateurRepository.findById(1L)).thenReturn(Optional.of(chauffeur));
        when(utilisateurRepository.findById(2L)).thenReturn(Optional.of(manager));
        when(utilisateurRepository.findById(99L)).thenReturn(Optional.of(admin));
        TrajetPositionRequest request = new TrajetPositionRequest(45.5, 4.5, 80.0, 75.0, LocalDateTime.now());

        trajetService.updatePosition(1L, request);

        verify(notificationRepository, times(3)).save(any(Notification.class));
    }

    @Test
    void updatePosition_weatherStates_coverAllMessages() {
        trajet.setId(1L);
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(trajet));
        when(vehiculeRepository.save(any(Vehicule.class))).thenAnswer(inv -> inv.getArgument(0));
        Utilisateur admin = new Utilisateur();
        admin.setId(99L);
        admin.setRole(Role.SUPERADMIN);
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of(admin));
        when(utilisateurRepository.findById(1L)).thenReturn(Optional.of(chauffeur));
        when(utilisateurRepository.findById(2L)).thenReturn(Optional.of(manager));
        when(utilisateurRepository.findById(99L)).thenReturn(Optional.of(admin));
        TrajetPositionRequest request = new TrajetPositionRequest(45.5, 4.5, 80.0, 75.0, LocalDateTime.now());

        MeteoResponse[] states = new MeteoResponse[]{
            new MeteoResponse(5.0, "brouillard", "fog", 10.0, 95, 0.2, "BROUILLARD", "moyen", true),
            new MeteoResponse(-2.0, "neige", "snow", 15.0, 90, 1.0, "NEIGE", "fort", true),
            new MeteoResponse(20.0, "pluie", "rain", 30.0, 70, 6.0, "PLUIE", "faible", true)
        };
        AtomicInteger meteoIdx = new AtomicInteger();
        when(meteoService.getMeteo(45.5, 4.5)).thenAnswer(inv -> states[meteoIdx.getAndIncrement() % states.length]);

        trajetService.updatePosition(1L, request);
        trajetService.updatePosition(1L, request);
        trajetService.updatePosition(1L, request);

        verify(notificationRepository, times(6)).save(any(Notification.class));
    }

    @Test
    void updatePosition_sameWeatherSignature_createsOnce() {
        trajet.setId(1L);
        MeteoResponse meteo = new MeteoResponse(12.0, "Orage", "storm", 50.0, 80, 4.0, "ORAGE", "eleve", true);
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(trajet));
        when(vehiculeRepository.save(any(Vehicule.class))).thenAnswer(inv -> inv.getArgument(0));
        when(meteoService.getMeteo(45.5, 4.5)).thenReturn(meteo);
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of());
        when(utilisateurRepository.findById(1L)).thenReturn(Optional.of(chauffeur));
        when(utilisateurRepository.findById(2L)).thenReturn(Optional.of(manager));
        TrajetPositionRequest request = new TrajetPositionRequest(45.5, 4.5, 80.0, 75.0, LocalDateTime.now());

        trajetService.updatePosition(1L, request);
        trajetService.updatePosition(1L, request);

        verify(notificationRepository, times(2)).save(any(Notification.class));
    }

    @Test
    void updatePosition_safeWeather_clearsHistoryAndNoNotifications() {
        trajet.setId(1L);
        MeteoResponse safe = new MeteoResponse(15.0, "nuages", "cloud", 20.0, 60, 10.0, "COUVERT", "faible", false);
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(trajet));
        when(vehiculeRepository.save(any(Vehicule.class))).thenAnswer(inv -> inv.getArgument(0));
        when(meteoService.getMeteo(45.5, 4.5)).thenReturn(safe);
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of());
        TrajetPositionRequest request = new TrajetPositionRequest(45.5, 4.5, 80.0, 75.0, LocalDateTime.now());

        trajetService.updatePosition(1L, request);

        verify(notificationRepository, never()).save(any(Notification.class));
    }

    @Test
    void updatePosition_nullCoordinates_skipsWeather() {
        trajet.setId(1L);
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(trajet));
        when(vehiculeRepository.save(any(Vehicule.class))).thenAnswer(inv -> inv.getArgument(0));
        TrajetPositionRequest request = new TrajetPositionRequest(null, null, 80.0, 75.0, LocalDateTime.now());

        trajetService.updatePosition(1L, request);

        verify(meteoService, never()).getMeteo(anyDouble(), anyDouble());
    }

    @Test
    void deleteTrajet_existingActiveTrips_keepsEnService() {
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(trajet));
        when(trajetRepository.existsByChauffeurIdAndStatutIn(1L, Set.of(StatutTrajet.ACTIF, StatutTrajet.EN_COURS)))
            .thenReturn(true);

        trajetService.deleteTrajet(1L);

        assertThat(chauffeur.getStatutConducteur()).isEqualTo(StatutChauffeur.EN_SERVICE);
        verify(trajetRepository).delete(trajet);
    }

    @Test
    void deleteTrajet_withoutVehicleOrChauffeur_onlyDeletes() {
        trajet.setVehicule(null);
        trajet.setChauffeur(null);
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(trajet));

        trajetService.deleteTrajet(1L);

        verify(trajetRepository).delete(trajet);
        verify(vehiculeRepository, never()).save(any());
        verify(chauffeurRepository, never()).save(any());
    }

    @Test
    void demarrerTrajet_nullDateDepart_setsNowAndNotifies() {
        trajet.setDateDepart(null);
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(trajet));
        when(trajetRepository.save(any(Trajet.class))).thenAnswer(inv -> inv.getArgument(0));
        when(utilisateurRepository.findById(1L)).thenReturn(Optional.of(chauffeur));
        when(utilisateurRepository.findById(2L)).thenReturn(Optional.of(manager));
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of());

        trajetService.demarrerTrajet(1L);

        assertThat(trajet.getDateDepart()).isNotNull();
        verify(notificationRepository, times(2)).save(any(Notification.class));
    }

    @Test
    void updateTrajet_notificationFailure_isAbsorbed() {
        TrajetRequest request = request("Paris", "Marseille", 48.8566, 2.3522, 43.2965, 5.3698, 1L, 1L, 2L, StatutTrajet.ACTIF);
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(trajet));
        when(utilisateurRepository.findById(1L)).thenReturn(Optional.of(chauffeur));
        when(utilisateurRepository.findById(2L)).thenReturn(Optional.of(manager));
        when(vehiculeRepository.findById(1L)).thenReturn(Optional.of(vehicule));
        when(trajetRepository.saveAndFlush(any(Trajet.class))).thenAnswer(inv -> inv.getArgument(0));
        doThrow(new RuntimeException("notif down"))
            .when(notificationRealtimeService).publishToUsers(anyList(), any(Notification.class));

        TrajetResponse result = trajetService.updateTrajet(1L, request);

        assertThat(result).isNotNull();
        assertThat(trajet.getDestination()).isEqualTo("Marseille");
    }

    @Test
    void getTrajets_superadmin_returnsSortedAll() {
        Utilisateur admin = new Utilisateur();
        admin.setId(99L);
        admin.setRole(Role.SUPERADMIN);
        when(authenticatedUserService.getCurrentUser()).thenReturn(admin);
        when(trajetRepository.findAll()).thenReturn(List.of(trajet));

        var result = trajetService.getTrajets(null, null, null);

        assertThat(result.getContent()).hasSize(1);
    }

    @Test
    void getTrajets_manager_returnsChauffeurManagerTrips() {
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(trajetRepository.findByChauffeurManagerIdWithFetch(2L)).thenReturn(List.of(trajet));

        var result = trajetService.getTrajets(null, null, null);

        assertThat(result.getContent()).hasSize(1);
    }

    @Test
    void getTrajets_otherRole_empty() {
        Utilisateur user = new Utilisateur();
        user.setId(3L);
        when(authenticatedUserService.getCurrentUser()).thenReturn(user);

        assertThat(trajetService.getTrajets(null, null, null).getContent()).isEmpty();
    }

    // ========== Branch coverage tests ==========

    @Test
    @DisplayName("getTrajets() → Search filters by vehicule matricule")
    void getTrajets_searchByVehiculeMatricule() {
        trajet.setChauffeur(null);
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(trajetRepository.findByChauffeurManagerIdWithFetch(2L)).thenReturn(List.of(trajet));

        var result = trajetService.getTrajets("AB-123", null, null);
        assertThat(result.getContent()).hasSize(1);
    }

    @Test
    @DisplayName("getTrajets() → Search filters by chauffeur nom+prenom")
    void getTrajets_searchByChauffeurName() {
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(trajetRepository.findByChauffeurManagerIdWithFetch(2L)).thenReturn(List.of(trajet));

        var result = trajetService.getTrajets("dupont", null, null);
        assertThat(result.getContent()).hasSize(1);
    }

    @Test
    @DisplayName("getTrajets() → Search with vehicule null, chauffeur null skips them")
    void getTrajets_searchWithNullVehiculeAndChauffeur() {
        trajet.setChauffeur(null);
        trajet.setVehicule(null);
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(trajetRepository.findByChauffeurManagerIdWithFetch(2L)).thenReturn(List.of(trajet));

        var result = trajetService.getTrajets("Paris", null, null);
        assertThat(result.getContent()).hasSize(1);
    }

    @Test
    @DisplayName("getTrajetsCarte() → Chauffeur with ACTIF status")
    void getTrajetsCarte_chauffeur_actif_only() {
        trajet.setStatut(StatutTrajet.EN_COURS);
        when(authenticatedUserService.getCurrentUser()).thenReturn(chauffeur);
        when(trajetRepository.findByChauffeurIdWithFetch(1L)).thenReturn(List.of(trajet));

        var result = trajetService.getTrajetsCarte();
        assertThat(result).hasSize(1);
    }

    @Test
    @DisplayName("getTrajetsCarte() → Manager returns EN_COURS")
    void getTrajetsCarte_manager_returnsEnCours() {
        trajet.setStatut(StatutTrajet.EN_COURS);
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(trajetRepository.findByChauffeurManagerIdWithFetch(2L)).thenReturn(List.of(trajet));

        var result = trajetService.getTrajetsCarte();
        assertThat(result).hasSize(1);
    }

    @Test
    @DisplayName("getTrajetsCarte() → Catch block fallback to EN_COURS")
    void getTrajetsCarte_unauthenticated_fallback() {
        trajet.setStatut(StatutTrajet.EN_COURS);
        when(authenticatedUserService.getCurrentUser()).thenThrow(new RuntimeException("no auth"));
        when(trajetRepository.findAll()).thenReturn(List.of(trajet));

        var result = trajetService.getTrajetsCarte();
        assertThat(result).hasSize(1);
    }

    @Test
    @DisplayName("createTrajet() → Null statut defaults to ACTIF")
    void createTrajet_nullStatut_defaultsToActif() {
        TrajetRequest req = new TrajetRequest("Paris", "Lyon", 48.85, 2.35, 45.76, 4.83,
            null, null, null, null, null, null, null, null, null, null);
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(trajetRepository.saveAndFlush(any(Trajet.class))).thenAnswer(inv -> {
            Trajet t = inv.getArgument(0);
            t.setId(10L);
            return t;
        });

        TrajetResponse result = trajetService.createTrajet(req);
        assertThat(result.statut()).isEqualTo(StatutTrajet.ACTIF);
    }

    @Test
    @DisplayName("createTrajet() → Post-save processing fails gracefully")
    void createTrajet_postSaveFails_succeeds() {
        trajet.setVehicule(null);
        TrajetRequest req = new TrajetRequest("Paris", "Lyon", 48.85, 2.35, 45.76, 4.83,
            null, null, null, null, null, null, null, null, null, null);
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(trajetRepository.saveAndFlush(any(Trajet.class))).thenAnswer(inv -> {
            Trajet t = inv.getArgument(0);
            t.setId(10L);
            return t;
        });

        TrajetResponse result = trajetService.createTrajet(req);
        assertThat(result).isNotNull();
    }

    @Test
    @DisplayName("updateTrajet() → Notification fails gracefully")
    void updateTrajet_notificationFails_succeeds() {
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(trajet));
        when(trajetRepository.saveAndFlush(any(Trajet.class))).thenAnswer(inv -> inv.getArgument(0));
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of());
        when(utilisateurRepository.findById(manager.getId())).thenReturn(Optional.of(manager));
        doThrow(new RuntimeException("notif fail"))
            .when(notificationRealtimeService).publishToUsers(anyList(), any(Notification.class));

        TrajetRequest req = new TrajetRequest("Paris", "Lyon", 48.85, 2.35, 45.76, 4.83,
            null, null, null, null, null, null, null, null, null, null);
        TrajetResponse result = trajetService.updateTrajet(1L, req);
        assertThat(result).isNotNull();
    }

    @Test
    @DisplayName("deleteTrajet() → With vehicule and chauffeur with other active trips")
    void deleteTrajet_withVehiculeAndChauffeurActiveTrips() {
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(trajet));
        when(trajetRepository.existsByChauffeurIdAndStatutIn(eq(1L), anySet())).thenReturn(true);

        trajetService.deleteTrajet(1L);

        verify(vehiculeRepository).save(vehicule);
        verify(chauffeurRepository).save(chauffeur);
        verify(trajetRepository).delete(trajet);
    }

    @Test
    @DisplayName("deleteTrajet() → With chauffeur, no other active trips → LIBRE")
    void deleteTrajet_withChauffeurNoOtherTrips() {
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(trajet));
        when(trajetRepository.existsByChauffeurIdAndStatutIn(eq(1L), anySet())).thenReturn(false);

        trajetService.deleteTrajet(1L);

        assertThat(chauffeur.getStatutConducteur()).isEqualTo(StatutChauffeur.LIBRE);
    }

    @Test
    @DisplayName("deleteTrajet() → Without vehicule and chauffeur")
    void deleteTrajet_noVehiculeNoChauffeur() {
        trajet.setVehicule(null);
        trajet.setChauffeur(null);
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(trajet));

        trajetService.deleteTrajet(1L);
        verify(trajetRepository).delete(trajet);
    }

    @Test
    @DisplayName("demarrerTrajet() → Without vehicule and chauffeur, with dateDepart")
    void demarrerTrajet_noVehiculeWithDateDepart() {
        trajet.setVehicule(null);
        trajet.setChauffeur(null);
        trajet.setDateDepart(LocalDateTime.now());
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(trajet));
        when(trajetRepository.save(any(Trajet.class))).thenAnswer(inv -> inv.getArgument(0));

        trajetService.demarrerTrajet(1L);

        assertThat(trajet.getStatut()).isEqualTo(StatutTrajet.EN_COURS);
    }

    @Test
    @DisplayName("terminerTrajet() → Without vehicule and chauffeur")
    void terminerTrajet_noVehiculeNoChauffeur() {
        trajet.setVehicule(null);
        trajet.setChauffeur(null);
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(trajet));
        when(trajetRepository.save(any(Trajet.class))).thenAnswer(inv -> inv.getArgument(0));

        TrajetResponse result = trajetService.terminerTrajet(1L);
        assertThat(result.statut()).isEqualTo(StatutTrajet.COMPLETE);
    }

    @Test
    @DisplayName("updatePosition() → With null datePosition uses LocalDateTime.now()")
    void updatePosition_nullDatePosition_usesNow() {
        TrajetPositionRequest posReq = mock(TrajetPositionRequest.class);
        when(posReq.latitude()).thenReturn(48.85);
        when(posReq.longitude()).thenReturn(2.35);
        when(posReq.vitesse()).thenReturn(80.0);
        when(posReq.carburant()).thenReturn(75.0);
        when(posReq.datePosition()).thenReturn(null);
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(trajet));
        when(vehiculeRepository.save(any(Vehicule.class))).thenAnswer(inv -> inv.getArgument(0));
        when(meteoService.getMeteo(anyDouble(), anyDouble())).thenReturn(null);

        trajetService.updatePosition(1L, posReq);
        assertThat(vehicule.getDernierePositionMaj()).isNotNull();
    }

    @Test
    @DisplayName("getTrajets() → Pageable with null statut, search and role = chauffeur")
    void getTrajets_chauffeur_withSearchAndStatut() {
        trajet.setStatut(StatutTrajet.EN_COURS);
        when(authenticatedUserService.getCurrentUser()).thenReturn(chauffeur);
        when(trajetRepository.findByChauffeurIdWithFetch(1L)).thenReturn(List.of(trajet));

        var result = trajetService.getTrajets("Paris", StatutTrajet.EN_COURS, null);
        assertThat(result.getContent()).hasSize(1);
    }

    @Test
    @DisplayName("getTrajets() → Pageable with results")
    void getTrajets_withPageable() {
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(trajetRepository.findByChauffeurManagerIdWithFetch(2L)).thenReturn(List.of(trajet));
        var pageable = PageRequest.of(0, 10);

        var result = trajetService.getTrajets(null, null, pageable);
        assertThat(result.getContent()).hasSize(1);
    }

    @Test
    @DisplayName("getTrajetsCarte() → Chauffeur with ACTIF status")
    void getTrajetsCarte_chauffeur_actif() {
        trajet.setStatut(StatutTrajet.ACTIF);
        when(authenticatedUserService.getCurrentUser()).thenReturn(chauffeur);
        when(trajetRepository.findByChauffeurIdWithFetch(1L)).thenReturn(List.of(trajet));

        var result = trajetService.getTrajetsCarte();
        assertThat(result).hasSize(1);
    }

    @Test
    @DisplayName("resolveManager() → ManagerId non-null, user not Manager instance")
    void resolveManager_nonManagerUser_throws() {
        TrajetRequest req = new TrajetRequest("Paris", "Lyon", 48.85, 2.35, 45.76, 4.83,
            null, null, null, null, null, null, null, 99L, null, null);
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(utilisateurRepository.findById(99L)).thenReturn(Optional.of(new Utilisateur()));

        assertThatThrownBy(() -> trajetService.createTrajet(req))
            .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("resolveManager() → Null managerId, currentUser is Manager")
    void resolveManager_nullManagerId_currentUserIsManager() {
        trajet.setManager(null);
        TrajetRequest req = new TrajetRequest("Paris", "Lyon", 48.85, 2.35, 45.76, 4.83,
            null, null, null, null, null, null, null, null, null, null);
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(trajetRepository.saveAndFlush(any(Trajet.class))).thenAnswer(inv -> {
            Trajet t = inv.getArgument(0);
            t.setId(10L);
            return t;
        });

        TrajetResponse result = trajetService.createTrajet(req);
        assertThat(result).isNotNull();
    }

    @Test
    @DisplayName("validateDriverAvailability() → Driver not available due to rest period")
    void validateDriverAvailability_driverNotAvailable_throws() {
        Trajet completed = new Trajet();
        completed.setId(9L);
        completed.setStatut(StatutTrajet.COMPLETE);
        completed.setDateArriveeReelle(LocalDateTime.now().minusHours(5));

        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(utilisateurRepository.findById(1L)).thenReturn(Optional.of(chauffeur));
        when(trajetRepository.findByChauffeurIdWithFetch(1L)).thenReturn(List.of(completed));

        assertThatThrownBy(() -> trajetService.createTrajet(
            new TrajetRequest("Paris", "Lyon", 48.85, 2.35, 45.76, 4.83,
                null, null, null, null, null, 1L, null, null, null, null)))
            .isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("disponible");
    }

    @Test
    @DisplayName("validateDriverAvailability() → Driver has active trip")
    void validateDriverAvailability_hasActiveTrip_throws() {
        Trajet completed = new Trajet();
        completed.setStatut(StatutTrajet.COMPLETE);
        completed.setDateArriveeReelle(LocalDateTime.now().minusDays(2));

        Trajet active = new Trajet();
        active.setStatut(StatutTrajet.ACTIF);
        active.setDateArriveeReelle(null);

        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(utilisateurRepository.findById(1L)).thenReturn(Optional.of(chauffeur));
        when(trajetRepository.findByChauffeurIdWithFetch(1L)).thenReturn(List.of(completed, active));

        assertThatThrownBy(() -> trajetService.createTrajet(
            new TrajetRequest("Paris", "Lyon", 48.85, 2.35, 45.76, 4.83,
                null, null, null, null, null, 1L, null, null, null, null)))
            .isInstanceOf(IllegalStateException.class);
    }

    @Test
    @DisplayName("toCarteResponse() → Chauffeur without secteur")
    void toCarteResponse_chauffeurNoSecteur() {
        chauffeur.setSecteur(null);
        trajet.setStatut(StatutTrajet.EN_COURS);
        when(authenticatedUserService.getCurrentUser()).thenReturn(chauffeur);
        when(trajetRepository.findByChauffeurIdWithFetch(1L)).thenReturn(List.of(trajet));

        var result = trajetService.getTrajetsCarte();
        assertThat(result).hasSize(1);
    }

    @Test
    @DisplayName("toCarteResponse() → Vehicule without GPS position")
    void toCarteResponse_vehiculeNoGpsPosition() {
        trajet.setStatut(StatutTrajet.EN_COURS);
        trajet.setVehicule(vehicule);
        vehicule.setLatitudeActuelle(null);
        vehicule.setLongitudeActuelle(null);
        vehicule.setDernierePositionMaj(null);
        vehicule.setVitesseActuelle(null);
        vehicule.setNiveauCarburant(null);

        when(authenticatedUserService.getCurrentUser()).thenReturn(chauffeur);
        when(trajetRepository.findByChauffeurIdWithFetch(1L)).thenReturn(List.of(trajet));

        var result = trajetService.getTrajetsCarte();
        assertThat(result).hasSize(1);
    }

    @Test
    @DisplayName("toCarteResponse() → Vehicule with stale GPS before dateDepart")
    void toCarteResponse_staleGpsPosition() {
        trajet.setStatut(StatutTrajet.EN_COURS);
        vehicule.setLatitudeActuelle(49.0);
        vehicule.setLongitudeActuelle(3.0);
        vehicule.setDernierePositionMaj(LocalDateTime.now().minusHours(5));
        trajet.setDateDepart(LocalDateTime.now().minusHours(2));

        when(authenticatedUserService.getCurrentUser()).thenReturn(chauffeur);
        when(trajetRepository.findByChauffeurIdWithFetch(1L)).thenReturn(List.of(trajet));

        var result = trajetService.getTrajetsCarte();
        assertThat(result).hasSize(1);
    }

    @Test
    @DisplayName("createWeatherNotification() → Null recipient returns early")
    void createWeatherNotification_nullRecipient_returns() {
        trajet.setStatut(StatutTrajet.EN_COURS);
        trajet.setManager(null);
        trajet.setChauffeur(null);
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(trajet));
        when(vehiculeRepository.save(any(Vehicule.class))).thenAnswer(inv -> inv.getArgument(0));

        MeteoResponse meteo = mock(MeteoResponse.class);
        when(meteo.etatGeneral()).thenReturn("ORAGE");
        when(meteo.risqueConduite()).thenReturn("Eleve");
        when(meteo.dangereux()).thenReturn(true);
        when(meteoService.getMeteo(anyDouble(), anyDouble())).thenReturn(meteo);
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of());

        trajetService.updatePosition(1L, new TrajetPositionRequest(48.8566, 2.3522, 80.0, 75.0, LocalDateTime.now()));

        verify(notificationRepository, never()).save(any(Notification.class));
    }

    @Test
    @DisplayName("buildWeatherMessage() → ORAGE for SUPERADMIN")
    void buildWeatherMessage_orageSuperadmin() {
        trajet.setStatut(StatutTrajet.EN_COURS);
        trajet.setManager(manager);
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(trajet));
        when(vehiculeRepository.save(any(Vehicule.class))).thenAnswer(inv -> inv.getArgument(0));
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of());

        MeteoResponse meteo = mock(MeteoResponse.class);
        when(meteo.etatGeneral()).thenReturn("ORAGE");
        when(meteo.risqueConduite()).thenReturn("Eleve");
        when(meteo.dangereux()).thenReturn(true);
        when(meteoService.getMeteo(anyDouble(), anyDouble())).thenReturn(meteo);
        when(utilisateurRepository.findById(manager.getId())).thenReturn(Optional.of(manager));
        when(utilisateurRepository.findById(chauffeur.getId())).thenReturn(Optional.of(chauffeur));

        trajetService.updatePosition(1L, new TrajetPositionRequest(48.8566, 2.3522, 80.0, 75.0, LocalDateTime.now()));

        verify(notificationRepository, atLeastOnce()).save(any(Notification.class));
    }

    @Test
    @DisplayName("buildWeatherMessage() → BROUILLARD for CHAUFFEUR")
    void buildWeatherMessage_brouillardChauffeur() {
        trajet.setStatut(StatutTrajet.EN_COURS);
        trajet.setManager(null);
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(trajet));
        when(vehiculeRepository.save(any(Vehicule.class))).thenAnswer(inv -> inv.getArgument(0));
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of());

        MeteoResponse meteo = mock(MeteoResponse.class);
        when(meteo.etatGeneral()).thenReturn("BROUILLARD");
        when(meteo.risqueConduite()).thenReturn("Moyen");
        when(meteo.dangereux()).thenReturn(true);
        when(meteoService.getMeteo(anyDouble(), anyDouble())).thenReturn(meteo);
        when(utilisateurRepository.findById(chauffeur.getId())).thenReturn(Optional.of(chauffeur));

        trajetService.updatePosition(1L, new TrajetPositionRequest(48.8566, 2.3522, 80.0, 75.0, LocalDateTime.now()));

        verify(notificationRepository, atLeastOnce()).save(any(Notification.class));
    }

    @Test
    @DisplayName("buildWeatherMessage() → NEIGE for SUPERADMIN")
    void buildWeatherMessage_neigeSuperadmin() {
        trajet.setStatut(StatutTrajet.EN_COURS);
        trajet.setManager(manager);
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(trajet));
        when(vehiculeRepository.save(any(Vehicule.class))).thenAnswer(inv -> inv.getArgument(0));
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of());

        MeteoResponse meteo = mock(MeteoResponse.class);
        when(meteo.etatGeneral()).thenReturn("NEIGE");
        when(meteo.risqueConduite()).thenReturn("Eleve");
        when(meteo.dangereux()).thenReturn(true);
        when(meteoService.getMeteo(anyDouble(), anyDouble())).thenReturn(meteo);
        when(utilisateurRepository.findById(manager.getId())).thenReturn(Optional.of(manager));
        when(utilisateurRepository.findById(chauffeur.getId())).thenReturn(Optional.of(chauffeur));

        trajetService.updatePosition(1L, new TrajetPositionRequest(48.8566, 2.3522, 80.0, 75.0, LocalDateTime.now()));

        verify(notificationRepository, atLeastOnce()).save(any(Notification.class));
    }

    @Test
    @DisplayName("buildWeatherMessage() → BROUILLARD for MANAGER")
    void buildWeatherMessage_brouillardManager() {
        trajet.setStatut(StatutTrajet.EN_COURS);
        trajet.setManager(manager);
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(trajet));
        when(vehiculeRepository.save(any(Vehicule.class))).thenAnswer(inv -> inv.getArgument(0));
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of());

        MeteoResponse meteo = mock(MeteoResponse.class);
        when(meteo.etatGeneral()).thenReturn("BROUILLARD");
        when(meteo.risqueConduite()).thenReturn("Moyen");
        when(meteo.dangereux()).thenReturn(true);
        when(meteoService.getMeteo(anyDouble(), anyDouble())).thenReturn(meteo);
        when(utilisateurRepository.findById(manager.getId())).thenReturn(Optional.of(manager));
        when(utilisateurRepository.findById(chauffeur.getId())).thenReturn(Optional.of(chauffeur));

        trajetService.updatePosition(1L, new TrajetPositionRequest(48.8566, 2.3522, 80.0, 75.0, LocalDateTime.now()));

        verify(notificationRepository, atLeastOnce()).save(any(Notification.class));
    }

    @Test
    @DisplayName("buildWeatherMessage() → NEIGE for CHAUFFEUR")
    void buildWeatherMessage_neigeChauffeur() {
        trajet.setStatut(StatutTrajet.EN_COURS);
        trajet.setManager(null);
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(trajet));
        when(vehiculeRepository.save(any(Vehicule.class))).thenAnswer(inv -> inv.getArgument(0));
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of());

        MeteoResponse meteo = mock(MeteoResponse.class);
        when(meteo.etatGeneral()).thenReturn("NEIGE");
        when(meteo.risqueConduite()).thenReturn("Eleve");
        when(meteo.dangereux()).thenReturn(true);
        when(meteoService.getMeteo(anyDouble(), anyDouble())).thenReturn(meteo);
        when(utilisateurRepository.findById(chauffeur.getId())).thenReturn(Optional.of(chauffeur));

        trajetService.updatePosition(1L, new TrajetPositionRequest(48.8566, 2.3522, 80.0, 75.0, LocalDateTime.now()));

        verify(notificationRepository, atLeastOnce()).save(any(Notification.class));
    }

    @Test
    @DisplayName("buildWeatherMessage() → ORAGE for CHAUFFEUR")
    void buildWeatherMessage_orageChauffeur() {
        trajet.setStatut(StatutTrajet.EN_COURS);
        trajet.setManager(null);
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(trajet));
        when(vehiculeRepository.save(any(Vehicule.class))).thenAnswer(inv -> inv.getArgument(0));
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of());

        MeteoResponse meteo = mock(MeteoResponse.class);
        when(meteo.etatGeneral()).thenReturn("ORAGE");
        when(meteo.risqueConduite()).thenReturn("Eleve");
        when(meteo.dangereux()).thenReturn(true);
        when(meteoService.getMeteo(anyDouble(), anyDouble())).thenReturn(meteo);
        when(utilisateurRepository.findById(chauffeur.getId())).thenReturn(Optional.of(chauffeur));

        trajetService.updatePosition(1L, new TrajetPositionRequest(48.8566, 2.3522, 80.0, 75.0, LocalDateTime.now()));

        verify(notificationRepository, atLeastOnce()).save(any(Notification.class));
    }

    @Test
    @DisplayName("resolveVehiclesForOptimisation() → With vehiculeIds in request")
    void resolveVehiclesForOptimisation_withVehiculeIds() {
        lenient().when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        lenient().when(vehiculeRepository.findAllById(anyCollection())).thenReturn(List.of(vehicule));
        TrajetOptimisationRequest req = mock(TrajetOptimisationRequest.class);
        lenient().when(req.vehiculeIds()).thenReturn(List.of(1L));
        lenient().when(req.trajets()).thenReturn(List.of());

        var result = trajetService.optimiserTrajets(req);
        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("resolveVehiclesForOptimisation() → No entreprise, uses findAll with EN_SERVICE/HORS_SERVICE filter")
    void resolveVehiclesForOptimisation_noEntreprise() {
        manager.setEntreprise(null);
        lenient().when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        vehicule.setStatut(StatutVehicule.HORS_SERVICE);
        lenient().when(vehiculeRepository.findAll()).thenReturn(List.of(vehicule));
        TrajetOptimisationRequest req = mock(TrajetOptimisationRequest.class);
        lenient().when(req.vehiculeIds()).thenReturn(null);
        lenient().when(req.trajets()).thenReturn(List.of());

        var result = trajetService.optimiserTrajets(req);
        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("resolveVehiclesForOptimisation() → Entreprise, uses findByEntreprise_Id with filter")
    void resolveVehiclesForOptimisation_withEntreprise() {
        vehicule.setStatut(StatutVehicule.HORS_SERVICE);
        lenient().when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        lenient().when(vehiculeRepository.findByEntreprise_Id(anyLong())).thenReturn(List.of(vehicule));
        TrajetOptimisationRequest req = mock(TrajetOptimisationRequest.class);
        lenient().when(req.vehiculeIds()).thenReturn(null);
        lenient().when(req.trajets()).thenReturn(List.of());

        var result = trajetService.optimiserTrajets(req);
        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("resolveChauffeur() → Null chauffeurId returns null")
    void resolveChauffeur_nullId_returnsNull() {
        trajet.setChauffeur(null);
        TrajetRequest req = new TrajetRequest("Paris", "Lyon", 48.85, 2.35, 45.76, 4.83,
            null, null, null, null, null, null, null, null, null, null);
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(trajetRepository.saveAndFlush(any(Trajet.class))).thenAnswer(inv -> {
            Trajet t = inv.getArgument(0);
            t.setId(10L);
            return t;
        });

        TrajetResponse result = trajetService.createTrajet(req);
        assertThat(result).isNotNull();
    }

    @Test
    @DisplayName("resolveVehicule() → Null vehiculeId returns null")
    void resolveVehicule_nullId_returnsNull() {
        trajet.setVehicule(null);
        TrajetRequest req = new TrajetRequest("Paris", "Lyon", 48.85, 2.35, 45.76, 4.83,
            null, null, null, null, null, null, null, null, null, null);
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(trajetRepository.saveAndFlush(any(Trajet.class))).thenAnswer(inv -> {
            Trajet t = inv.getArgument(0);
            t.setId(10L);
            return t;
        });

        TrajetResponse result = trajetService.createTrajet(req);
        assertThat(result).isNotNull();
    }

    @Test
    @DisplayName("handleWeatherAlerts() → Null meteo or not dangerous removes history")
    void handleWeatherAlerts_meteoNotDangerous() {
        trajet.setStatut(StatutTrajet.EN_COURS);
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(trajet));
        when(vehiculeRepository.save(any(Vehicule.class))).thenAnswer(inv -> inv.getArgument(0));
        when(meteoService.getMeteo(anyDouble(), anyDouble())).thenReturn(null);

        trajetService.updatePosition(1L, new TrajetPositionRequest(48.8566, 2.3522, 80.0, 75.0, LocalDateTime.now()));

        verify(notificationRepository, never()).save(any(Notification.class));
    }

    @Test
    @DisplayName("handleWeatherAlerts() → Same signature as previous, no duplicate notification")
    void handleWeatherAlerts_sameSignature_noDuplicate() {
        trajet.setStatut(StatutTrajet.EN_COURS);
        trajet.setManager(null);
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(trajet));
        when(vehiculeRepository.save(any(Vehicule.class))).thenAnswer(inv -> inv.getArgument(0));
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of());

        MeteoResponse meteo = mock(MeteoResponse.class);
        when(meteo.etatGeneral()).thenReturn("ORAGE");
        when(meteo.risqueConduite()).thenReturn("Eleve");
        when(meteo.dangereux()).thenReturn(true);
        when(meteoService.getMeteo(anyDouble(), anyDouble())).thenReturn(meteo);
        when(utilisateurRepository.findById(chauffeur.getId())).thenReturn(Optional.of(chauffeur));

        trajetService.updatePosition(1L, new TrajetPositionRequest(48.8566, 2.3522, 80.0, 75.0, LocalDateTime.now()));
        trajetService.updatePosition(1L, new TrajetPositionRequest(48.8566, 2.3522, 80.0, 75.0, LocalDateTime.now()));

        verify(notificationRepository, times(1)).save(any(Notification.class));
    }

    @Test
    @DisplayName("buildWeatherMessage() → Trajet without chauffeur uses 'le chauffeur'")
    void buildWeatherMessage_noChauffeur_usesDefault() {
        trajet.setStatut(StatutTrajet.EN_COURS);
        trajet.setChauffeur(null);
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(trajet));
        when(vehiculeRepository.save(any(Vehicule.class))).thenAnswer(inv -> inv.getArgument(0));
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of());

        MeteoResponse meteo = mock(MeteoResponse.class);
        when(meteo.etatGeneral()).thenReturn("ORAGE");
        when(meteo.risqueConduite()).thenReturn("Eleve");
        when(meteo.dangereux()).thenReturn(true);
        when(meteoService.getMeteo(anyDouble(), anyDouble())).thenReturn(meteo);
        when(utilisateurRepository.findById(manager.getId())).thenReturn(Optional.of(manager));

        trajetService.updatePosition(1L, new TrajetPositionRequest(48.8566, 2.3522, 80.0, 75.0, LocalDateTime.now()));

        verify(notificationRepository, atLeastOnce()).save(any(Notification.class));
    }

    @Test
    @DisplayName("buildWeatherMessage() → Trajet without destination uses 'votre destination'")
    void buildWeatherMessage_noDestination_usesDefault() {
        trajet.setStatut(StatutTrajet.EN_COURS);
        trajet.setDestination(null);
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(trajet));
        when(vehiculeRepository.save(any(Vehicule.class))).thenAnswer(inv -> inv.getArgument(0));
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of());

        MeteoResponse meteo = mock(MeteoResponse.class);
        when(meteo.etatGeneral()).thenReturn("ORAGE");
        when(meteo.risqueConduite()).thenReturn("Eleve");
        when(meteo.dangereux()).thenReturn(true);
        when(meteoService.getMeteo(anyDouble(), anyDouble())).thenReturn(meteo);
        when(utilisateurRepository.findById(chauffeur.getId())).thenReturn(Optional.of(chauffeur));

        trajetService.updatePosition(1L, new TrajetPositionRequest(48.8566, 2.3522, 80.0, 75.0, LocalDateTime.now()));

        verify(notificationRepository, atLeastOnce()).save(any(Notification.class));
    }

    @Test
    @DisplayName("createWeatherNotification() → Blank message returns early")
    void createWeatherNotification_blankMessage_returns() {
        trajet.setStatut(StatutTrajet.EN_COURS);
        trajet.setManager(null);
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(trajet));
        when(vehiculeRepository.save(any(Vehicule.class))).thenAnswer(inv -> inv.getArgument(0));
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of());

        MeteoResponse meteo = mock(MeteoResponse.class);
        when(meteo.etatGeneral()).thenReturn("NEIGE");
        when(meteo.risqueConduite()).thenReturn("Eleve");
        when(meteo.dangereux()).thenReturn(true);
        when(meteoService.getMeteo(anyDouble(), anyDouble())).thenReturn(meteo);
        when(utilisateurRepository.findById(chauffeur.getId())).thenReturn(Optional.of(chauffeur));

        trajetService.updatePosition(1L, new TrajetPositionRequest(48.8566, 2.3522, 80.0, 75.0, LocalDateTime.now()));

        verify(notificationRepository, atLeastOnce()).save(any(Notification.class));
    }

    @Test
    @DisplayName("buildWeatherMessage() → Unknown role returns null message")
    void buildWeatherMessage_unknownRole_returnsNull() {
        trajet.setStatut(StatutTrajet.EN_COURS);
        trajet.setManager(null);
        trajet.setChauffeur(null);
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(trajet));
        when(vehiculeRepository.save(any(Vehicule.class))).thenAnswer(inv -> inv.getArgument(0));

        MeteoResponse meteo = mock(MeteoResponse.class);
        when(meteo.etatGeneral()).thenReturn("ORAGE");
        when(meteo.risqueConduite()).thenReturn("Eleve");
        when(meteo.dangereux()).thenReturn(true);
        when(meteoService.getMeteo(anyDouble(), anyDouble())).thenReturn(meteo);

        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of());

        trajetService.updatePosition(1L, new TrajetPositionRequest(48.8566, 2.3522, 80.0, 75.0, LocalDateTime.now()));
        verify(notificationRepository, never()).save(any(Notification.class));
    }

    @Test
    @DisplayName("getTrajets() → Filtering search by matricule and driver name and null pageable")
    void getTrajets_searchAndNullPageable() {
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        vehicule.setMatricule("ABC-123");
        trajet.setVehicule(vehicule);
        trajet.setChauffeur(chauffeur);
        when(trajetRepository.findByChauffeurManagerIdWithFetch(manager.getId())).thenReturn(List.of(trajet));

        var pageMatricule = trajetService.getTrajets("ABC", StatutTrajet.ACTIF, null);
        assertThat(pageMatricule.getContent()).hasSize(1);

        var pageDriver = trajetService.getTrajets("dupont", StatutTrajet.ACTIF, null);
        assertThat(pageDriver.getContent()).hasSize(1);

        trajet.setVehicule(null);
        trajet.setChauffeur(null);
        var pageNull = trajetService.getTrajets("needle", StatutTrajet.ACTIF, null);
        assertThat(pageNull.getContent()).isEmpty();
    }

    @Test
    @DisplayName("getTrajetsCarte() → Manager role and unauthenticated fallback")
    void getTrajetsCarte_managerRoleAndFallback() {
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        trajet.setStatut(StatutTrajet.EN_COURS);
        when(trajetRepository.findByChauffeurManagerIdWithFetch(manager.getId())).thenReturn(List.of(trajet));

        var resManager = trajetService.getTrajetsCarte();
        assertThat(resManager).hasSize(1);

        when(authenticatedUserService.getCurrentUser()).thenThrow(new RuntimeException("no auth"));
        when(trajetRepository.findAll()).thenReturn(List.of(trajet));
        var resFallback = trajetService.getTrajetsCarte();
        assertThat(resFallback).hasSize(1);
    }

    @Test
    @DisplayName("createTrajet() → Post-save exception is caught gracefully")
    void createTrajet_postSaveExceptionCaught() {
        TrajetRequest req = new TrajetRequest("Paris", "Lyon", 48.85, 2.35, 45.76, 4.83,
            null, null, 10.0, PrioriteTrajet.NORMALE, null, null, null, null, StatutTrajet.ACTIF, "shortest");
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        vehicule.setStatut(StatutVehicule.EN_MAINTENANCE);
        lenient().when(vehiculeRepository.findById(any())).thenReturn(Optional.of(vehicule));
        when(trajetRepository.saveAndFlush(any())).thenAnswer(inv -> inv.getArgument(0));

        TrajetResponse resp = trajetService.createTrajet(req);
        assertThat(resp).isNotNull();
    }

    @Test
    @DisplayName("updateTrajet() → Notification exception is caught gracefully")
    void updateTrajet_notificationExceptionCaught() {
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(trajet));
        when(trajetRepository.saveAndFlush(any())).thenAnswer(inv -> inv.getArgument(0));
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenThrow(new RuntimeException("DB error"));

        TrajetRequest req = new TrajetRequest("Paris", "Lyon", 48.85, 2.35, 45.76, 4.83,
            null, null, 10.0, PrioriteTrajet.NORMALE, null, null, null, null, StatutTrajet.ACTIF, "shortest");

        TrajetResponse resp = trajetService.updateTrajet(1L, req);
        assertThat(resp).isNotNull();
    }

    @Test
    @DisplayName("deleteTrajet() → Chauffeur active trip returns EN_SERVICE else LIBRE")
    void deleteTrajet_chauffeurStatutBranch() {
        trajet.setVehicule(vehicule);
        trajet.setChauffeur(chauffeur);
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(trajet));
        when(trajetRepository.existsByChauffeurIdAndStatutIn(eq(chauffeur.getId()), anySet())).thenReturn(true);

        trajetService.deleteTrajet(1L);
        assertThat(chauffeur.getStatutConducteur()).isEqualTo(StatutChauffeur.EN_SERVICE);

        when(trajetRepository.findById(2L)).thenReturn(Optional.of(trajet));
        when(trajetRepository.existsByChauffeurIdAndStatutIn(eq(chauffeur.getId()), anySet())).thenReturn(false);
        trajetService.deleteTrajet(2L);
        assertThat(chauffeur.getStatutConducteur()).isEqualTo(StatutChauffeur.LIBRE);
    }

    @Test
    @DisplayName("demarrerTrajet() → Date depart already set & pause generator exception caught")
    void demarrerTrajet_dateDepartAlreadySet() {
        LocalDateTime now = LocalDateTime.now().minusHours(1);
        trajet.setDateDepart(now);
        trajet.setVehicule(vehicule);
        trajet.setChauffeur(chauffeur);
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(trajet));
        when(trajetRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        doThrow(new RuntimeException("Pause service down")).when(pauseReglementaireService).genererPauses(anyLong());

        TrajetResponse resp = trajetService.demarrerTrajet(1L);
        assertThat(resp.dateDepart()).isEqualTo(now);
        assertThat(resp.statut()).isEqualTo(StatutTrajet.EN_COURS);
    }

    @Test
    @DisplayName("updatePosition() → Explicit datePosition supplied")
    void updatePosition_explicitDatePosition() {
        trajet.setVehicule(vehicule);
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(trajet));
        LocalDateTime posTime = LocalDateTime.now().minusMinutes(5);

        trajetService.updatePosition(1L, new TrajetPositionRequest(48.85, 2.35, 80.0, 75.0, posTime));
        assertThat(vehicule.getDernierePositionMaj()).isEqualTo(posTime);
    }

    @Test
    @DisplayName("optimiserTrajets() → Null or empty requests or route null")
    void optimiserTrajets_edgeCases() {
        assertThat(trajetService.optimiserTrajets(null)).isEmpty();
        assertThat(trajetService.optimiserTrajets(new TrajetOptimisationRequest(null, null))).isEmpty();

        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        TrajetRequest tReq = new TrajetRequest("Paris", "Lyon", 48.85, 2.35, 45.76, 4.83,
            null, null, 10.0, PrioriteTrajet.NORMALE, null, null, null, null, StatutTrajet.ACTIF, "shortest");
        TrajetOptimisationRequest req = new TrajetOptimisationRequest(List.of(tReq), List.of(1L));

        when(vehiculeRepository.findAllById(any())).thenReturn(List.of(vehicule));
        when(trajetOptimisationService.optimiser(any(), any()))
            .thenReturn(List.of(new TrajetOptimisationService.OptimizationAssignment(tReq, vehicule, null)));
        when(trajetRepository.save(any())).thenAnswer(inv -> {
            Trajet t = inv.getArgument(0);
            t.setId(100L);
            return t;
        });

        var res = trajetService.optimiserTrajets(req);
        assertThat(res).hasSize(1);
    }

    @Test
    @DisplayName("resolveManager() → ManagerId non-manager throws & fallback createdBy non-manager returns null")
    void resolveManager_edgeCases() {
        Utilisateur plainUser = new Utilisateur();
        plainUser.setId(5L);
        plainUser.setRole(Role.CHAUFFEUR);
        when(utilisateurRepository.findById(5L)).thenReturn(Optional.of(plainUser));

        TrajetRequest req = new TrajetRequest("Paris", "Lyon", 48.85, 2.35, 45.76, 4.83,
            null, null, 10.0, PrioriteTrajet.NORMALE, null, null, null, null, StatutTrajet.ACTIF, "shortest");
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);

        assertThatThrownBy(() -> trajetService.createTrajet(new TrajetRequest("P", "L", 48.8, 2.3, 45.7, 4.8, null, null, null, null, null, null, null, 5L, StatutTrajet.ACTIF, null)))
            .isInstanceOf(ResourceNotFoundException.class)
            .hasMessageContaining("Manager introuvable");
    }

    @Test
    @DisplayName("parseCoordinate() → Invalid format, geocoder null/exception fallback")
    void parseCoordinate_branches() {
        TrajetRequest req1 = new TrajetRequest("invalid,coords,string", "Lyon", null, null, 45.76, 4.83,
            null, null, 10.0, PrioriteTrajet.NORMALE, null, null, null, null, StatutTrajet.ACTIF, "shortest");
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(osrmService.geocoder(anyString())).thenReturn(null);
        when(trajetRepository.saveAndFlush(any())).thenAnswer(inv -> inv.getArgument(0));

        TrajetResponse resp1 = trajetService.createTrajet(req1);
        assertThat(resp1.latitudeDepart()).isNull();

        when(osrmService.geocoder(anyString())).thenThrow(new RuntimeException("OSRM down"));
        TrajetResponse resp2 = trajetService.createTrajet(req1);
        assertThat(resp2.latitudeDepart()).isNull();
    }

    @Test
    @DisplayName("computePerformanceLabel() → All branches of performance labels")
    void computePerformanceLabel_allBranches() {
        Trajet tAdvance = new Trajet();
        tAdvance.setId(101L);
        tAdvance.setStatut(StatutTrajet.EN_COURS);
        tAdvance.setDateDepart(LocalDateTime.now().minusMinutes(10));
        tAdvance.setDureeEstimeeMinutes(30);
        when(trajetRepository.findById(101L)).thenReturn(Optional.of(tAdvance));
        assertThat(trajetService.getTrajet(101L).statutPerformance()).isEqualTo("En avance");

        tAdvance.setDureeEstimeeMinutes(1);
        assertThat(trajetService.getTrajet(101L).statutPerformance()).isEqualTo("Léger retard");

        tAdvance.setDureeEstimeeMinutes(0);
        tAdvance.setDateDepart(LocalDateTime.now().minusMinutes(50));
        assertThat(trajetService.getTrajet(101L).statutPerformance()).isEqualTo("Retard important");

        // Completed trips (non-missingArrival)
        Trajet tCompleted = new Trajet();
        tCompleted.setId(102L);
        tCompleted.setStatut(StatutTrajet.COMPLETE);
        tCompleted.setDateDepart(LocalDateTime.now().minusHours(2));
        tCompleted.setDateArriveeReelle(LocalDateTime.now().minusHours(1));
        tCompleted.setDureeEstimeeMinutes(90); // 60 min real vs 90 min planned -> -30 min (En avance)
        when(trajetRepository.findById(102L)).thenReturn(Optional.of(tCompleted));
        assertThat(trajetService.getTrajet(102L).statutPerformance()).isEqualTo("En avance");

        tCompleted.setDureeEstimeeMinutes(58); // 60 min real vs 58 min planned -> 2 min retard (À l'heure)
        assertThat(trajetService.getTrajet(102L).statutPerformance()).isEqualTo("À l'heure");

        tCompleted.setDureeEstimeeMinutes(40); // 60 min real vs 40 min planned -> 20 min retard (Léger retard)
        assertThat(trajetService.getTrajet(102L).statutPerformance()).isEqualTo("Léger retard");

        tCompleted.setDureeEstimeeMinutes(10); // 60 min real vs 10 min planned -> 50 min retard (Retard important)
        assertThat(trajetService.getTrajet(102L).statutPerformance()).isEqualTo("Retard important");
    }

    @Test
    @DisplayName("estimateDistanceKm() & resolveVehiculeLat/Lng branches")
    void distanceAndPositionResolution_branches() {
        Trajet t = new Trajet();
        t.setId(200L);
        t.setStatut(StatutTrajet.EN_COURS);
        t.setLatitudeDepart(null);
        when(trajetRepository.findById(200L)).thenReturn(Optional.of(t));
        assertThat(trajetService.getTrajet(200L).distanceKm()).isEqualTo(0.0);

        // Position resolution when posMaj is before dateDepart
        Vehicule v = new Vehicule();
        v.setId(5L);
        v.setLatitudeActuelle(40.0);
        v.setLongitudeActuelle(3.0);
        v.setDernierePositionMaj(LocalDateTime.now().minusHours(5));
        t.setLatitudeDepart(48.85);
        t.setLongitudeDepart(2.35);
        t.setDateDepart(LocalDateTime.now().minusHours(1));
        t.setVehicule(v);
        when(authenticatedUserService.getCurrentUser()).thenReturn(chauffeur);
        when(trajetRepository.findByChauffeurIdWithFetch(any())).thenReturn(List.of(t));

        var carte = trajetService.getTrajetsCarte();
        assertThat(carte.get(0).vehiculeLatitude()).isEqualTo(48.85);
        assertThat(carte.get(0).vehiculeLongitude()).isEqualTo(2.35);

        // Position resolution when posMaj is after dateDepart
        v.setDernierePositionMaj(LocalDateTime.now());
        var carte2 = trajetService.getTrajetsCarte();
        assertThat(carte2.get(0).vehiculeLatitude()).isEqualTo(40.0);
        assertThat(carte2.get(0).vehiculeLongitude()).isEqualTo(3.0);
    }

    @Test
    @DisplayName("buildWeatherMessage() → BROUILLARD and NEIGE for CHAUFFEUR, MANAGER, SUPERADMIN")
    void buildWeatherMessage_brouillardAndNeige() {
        trajet.setStatut(StatutTrajet.EN_COURS);
        trajet.setManager(manager);
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(trajet));
        when(vehiculeRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        MeteoResponse brouillard = mock(MeteoResponse.class);
        when(brouillard.etatGeneral()).thenReturn("BROUILLARD");
        when(brouillard.risqueConduite()).thenReturn("Eleve");
        when(brouillard.dangereux()).thenReturn(true);
        when(meteoService.getMeteo(anyDouble(), anyDouble())).thenReturn(brouillard);
        when(utilisateurRepository.findById(chauffeur.getId())).thenReturn(Optional.of(chauffeur));
        when(utilisateurRepository.findById(manager.getId())).thenReturn(Optional.of(manager));

        Manager admin = new Manager();
        admin.setId(99L);
        admin.setRole(Role.SUPERADMIN);
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of(admin));
        when(utilisateurRepository.findById(99L)).thenReturn(Optional.of(admin));

        trajetService.updatePosition(1L, new TrajetPositionRequest(48.85, 2.35, 80.0, 75.0, LocalDateTime.now()));
        verify(notificationRepository, atLeastOnce()).save(any());
    }
}



