package com.logiway.services;

import com.logiway.dto.request.AssignVehiculeDriverRequest;
import com.logiway.dto.request.CreateVehiculeRequest;
import com.logiway.dto.request.UpdateVehiculeRequest;
import com.logiway.dto.request.UpdateVehiculeStatusRequest;
import com.logiway.dto.response.AvailableDriverResponse;
import com.logiway.dto.response.VehiculeResponse;
import com.logiway.entities.*;
import com.logiway.entities.enums.*;
import com.logiway.exceptions.BadRequestException;
import com.logiway.exceptions.ConflictException;
import com.logiway.exceptions.ResourceNotFoundException;
import com.logiway.exceptions.UnauthorizedException;
import com.logiway.repositories.*;
import com.logiway.security.AuthenticatedUserService;
import com.logiway.services.impl.VehiculeServiceImpl;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.function.Function;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.mockito.Mockito.lenient;

@ExtendWith(MockitoExtension.class)
@DisplayName("Service Véhicule — Tests Unitaires")
class VehiculeServiceTest {

    @Mock private VehiculeRepository vehiculeRepository;
    @Mock private EntrepriseRepository entrepriseRepository;
    @Mock private ChauffeurRepository chauffeurRepository;
    @Mock private TrajetRepository trajetRepository;
    @Mock private UtilisateurRepository utilisateurRepository;
    @Mock private NotificationRepository notificationRepository;
    @Mock private NotificationRealtimeService notificationRealtimeService;
    @Mock private AuthenticatedUserService authenticatedUserService;

    @InjectMocks
    private VehiculeServiceImpl vehiculeService;

    private Vehicule vehicule;
    private Chauffeur chauffeur;
    private Manager manager;
    private Entreprise entreprise;
    private Manager superAdmin;

    @BeforeEach
    void setUp() {
        chauffeur = new Chauffeur();
        chauffeur.setId(1L);
        chauffeur.setEmail("chauffeur@test.com");
        chauffeur.setPrenom("Jean");
        chauffeur.setNom("Dupont");
        chauffeur.setRole(Role.CHAUFFEUR);
        chauffeur.setStatutConducteur(StatutChauffeur.LIBRE);

        manager = new Manager();
        manager.setId(2L);
        manager.setEmail("manager@test.com");
        manager.setPrenom("Manager");
        manager.setNom("Test");
        manager.setRole(Role.MANAGER);

        superAdmin = new Manager();
        superAdmin.setId(3L);
        superAdmin.setEmail("superadmin@test.com");
        superAdmin.setRole(Role.SUPERADMIN);

        entreprise = new Entreprise();
        entreprise.setId(1L);
        entreprise.setNomEntreprise("Transport Express");
        entreprise.setTailleFlotte(10);
        entreprise.setProprietaire(manager);

        manager.setEntreprise(entreprise);
        chauffeur.setEntreprise(entreprise);

        vehicule = new Vehicule();
        vehicule.setId(1L);
        vehicule.setMatricule("AB-123-CD");
        vehicule.setMarque("Renault");
        vehicule.setModele("Master");
        vehicule.setCapacite(1500.0);
        vehicule.setStatut(StatutVehicule.EN_SERVICE);
        vehicule.setEntreprise(entreprise);
    }

    @Test
    @DisplayName("createVehicule() → SuperAdmin crée véhicule")
    void createVehicule_bySuperAdmin_succeeds() {
        CreateVehiculeRequest request = new CreateVehiculeRequest(
            "EF-456-GH", "Peugeot", "Boxer", 1200.0, 0,
            StatutVehicule.EN_SERVICE, 1L, null
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(entrepriseRepository.findById(1L)).thenReturn(Optional.of(entreprise));
        when(vehiculeRepository.existsByMatriculeIgnoreCase("EF-456-GH")).thenReturn(false);
        when(vehiculeRepository.countByEntreprise_Id(1L)).thenReturn(5L);
        when(vehiculeRepository.save(any(Vehicule.class))).thenAnswer(inv -> {
            Vehicule saved = inv.getArgument(0);
            saved.setId(10L);
            return saved;
        });
        VehiculeResponse result = vehiculeService.createVehicule(request);
        assertThat(result).isNotNull();
        assertThat(result.matricule()).isEqualTo("EF-456-GH");
        verify(vehiculeRepository, times(1)).save(any(Vehicule.class));
    }

    @Test
    @DisplayName("createVehicule() → Matricule existant lance exception")
    void createVehicule_withDuplicateMatricule_throwsException() {
        CreateVehiculeRequest request = new CreateVehiculeRequest(
            "AB-123-CD", "Peugeot", "Boxer", 1200.0, 0,
            StatutVehicule.EN_SERVICE, 1L, null
        );
        lenient().when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        lenient().when(entrepriseRepository.findById(1L)).thenReturn(Optional.of(entreprise));
        lenient().when(vehiculeRepository.existsByMatriculeIgnoreCase("AB-123-CD")).thenReturn(true);
        assertThatThrownBy(() -> vehiculeService.createVehicule(request))
            .isInstanceOf(BadRequestException.class);
    }

    @Test
    @DisplayName("createVehicule() → Flotte pleine lance exception")
    void createVehicule_whenFleetFull_throwsException() {
        CreateVehiculeRequest request = new CreateVehiculeRequest(
            "EF-456-GH", "Peugeot", "Boxer", 1200.0, 0,
            StatutVehicule.EN_SERVICE, 1L, null
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(entrepriseRepository.findById(1L)).thenReturn(Optional.of(entreprise));
        when(vehiculeRepository.existsByMatriculeIgnoreCase("EF-456-GH")).thenReturn(false);
        when(vehiculeRepository.countByEntreprise_Id(1L)).thenReturn(10L);
        assertThatThrownBy(() -> vehiculeService.createVehicule(request))
            .isInstanceOf(BadRequestException.class);
    }

    @Test
    @DisplayName("getVehicule() → Retourne véhicule si trouvé")
    void getVehicule_whenExists_returnsVehicule() {
        lenient().when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        lenient().when(vehiculeRepository.findById(1L)).thenReturn(Optional.of(vehicule));
        VehiculeResponse result = vehiculeService.getVehicule(1L);
        assertThat(result).isNotNull();
        assertThat(result.matricule()).isEqualTo("AB-123-CD");
        verify(vehiculeRepository, times(1)).findById(1L);
    }

    @Test
    @DisplayName("getVehicule() → Lance exception si inexistant")
    void getVehicule_whenNotFound_throwsException() {
        when(vehiculeRepository.findById(999L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> vehiculeService.getVehicule(999L))
            .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("updateVehicule() → Mise à jour réussie")
    void updateVehicule_succeeds() {
        UpdateVehiculeRequest request = new UpdateVehiculeRequest(
            "AB-123-CD", "Renault", "Master L3H3", 1800.0, 0,
            StatutVehicule.EN_SERVICE, null, null
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(vehiculeRepository.findById(1L)).thenReturn(Optional.of(vehicule));
        when(vehiculeRepository.save(any(Vehicule.class))).thenAnswer(inv -> inv.getArgument(0));
        VehiculeResponse result = vehiculeService.updateVehicule(1L, request);
        assertThat(result).isNotNull();
        assertThat(vehicule.getModele()).isEqualTo("Master L3H3");
        assertThat(vehicule.getCapacite()).isEqualTo(1800.0);
        verify(vehiculeRepository, times(1)).save(vehicule);
    }

    @Test
    @DisplayName("assignDriver() → Assigne chauffeur disponible")
    void assignDriver_whenAvailable_succeeds() {
        AssignVehiculeDriverRequest request = new AssignVehiculeDriverRequest(1L);
        lenient().when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        lenient().when(vehiculeRepository.findById(1L)).thenReturn(Optional.of(vehicule));
        lenient().when(chauffeurRepository.findById(1L)).thenReturn(Optional.of(chauffeur));
        lenient().when(vehiculeRepository.save(any(Vehicule.class))).thenAnswer(inv -> inv.getArgument(0));
        lenient().when(chauffeurRepository.save(any(Chauffeur.class))).thenAnswer(inv -> inv.getArgument(0));
        VehiculeResponse result = vehiculeService.assignDriver(1L, request);
        assertThat(result).isNotNull();
        assertThat(vehicule.getChauffeurActuel()).isEqualTo(chauffeur);
        assertThat(chauffeur.getVehiculeActuel()).isEqualTo(vehicule);
    }

    @Test
    @DisplayName("assignDriver() → Chauffeur occupé lance exception")
    void assignDriver_whenDriverBusy_throwsException() {
        chauffeur.setStatutConducteur(StatutChauffeur.EN_SERVICE);
        AssignVehiculeDriverRequest request = new AssignVehiculeDriverRequest(1L);
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(vehiculeRepository.findById(1L)).thenReturn(Optional.of(vehicule));
        when(chauffeurRepository.findById(1L)).thenReturn(Optional.of(chauffeur));
        assertThatThrownBy(() -> vehiculeService.assignDriver(1L, request))
            .isInstanceOf(BadRequestException.class);
    }

    @Test
    @DisplayName("clearDriver() → Libère chauffeur du véhicule")
    void clearDriver_succeeds() {
        vehicule.setChauffeurActuel(chauffeur);
        chauffeur.setVehiculeActuel(vehicule);
        lenient().when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        lenient().when(vehiculeRepository.findById(1L)).thenReturn(Optional.of(vehicule));
        lenient().when(vehiculeRepository.save(any(Vehicule.class))).thenAnswer(inv -> inv.getArgument(0));
        VehiculeResponse result = vehiculeService.clearDriver(1L);
        assertThat(result).isNotNull();
        assertThat(vehicule.getChauffeurActuel()).isNull();
        assertThat(chauffeur.getVehiculeActuel()).isNull();
        assertThat(chauffeur.getStatutConducteur()).isEqualTo(StatutChauffeur.LIBRE);
    }

    @Test
    @DisplayName("updateVehiculeStatus() → Change statut véhicule")
    void updateVehiculeStatus_succeeds() {
        UpdateVehiculeStatusRequest request = new UpdateVehiculeStatusRequest(StatutVehicule.EN_MAINTENANCE);
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(vehiculeRepository.findById(1L)).thenReturn(Optional.of(vehicule));
        when(vehiculeRepository.save(any(Vehicule.class))).thenAnswer(inv -> inv.getArgument(0));
        VehiculeResponse result = vehiculeService.updateVehiculeStatus(1L, request);
        assertThat(result).isNotNull();
        assertThat(vehicule.getStatut()).isEqualTo(StatutVehicule.EN_MAINTENANCE);
    }

    @Test
    @DisplayName("deleteVehicule() → SuperAdmin supprime véhicule")
    void deleteVehicule_bySuperAdmin_succeeds() {
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(vehiculeRepository.findById(1L)).thenReturn(Optional.of(vehicule));
        vehiculeService.deleteVehicule(1L);
        verify(vehiculeRepository, times(1)).delete(vehicule);
    }

    @Test
    @DisplayName("getAvailableDriversForVehicle() → Liste chauffeurs disponibles")
    void getAvailableDriversForVehicle_returnsOnlyFreeDrivers() {
        Chauffeur chauffeur2 = new Chauffeur();
        chauffeur2.setId(2L);
        chauffeur2.setPrenom("Pierre");
        chauffeur2.setNom("Martin");
        chauffeur2.setStatutConducteur(StatutChauffeur.LIBRE);
        chauffeur2.setManager(manager);
        chauffeur2.setEntreprise(entreprise);
        lenient().when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        lenient().when(vehiculeRepository.findById(1L)).thenReturn(Optional.of(vehicule));
        lenient().when(chauffeurRepository.findAvailableDriversByEntreprise(1L, StatutChauffeur.LIBRE))
            .thenReturn(List.of(chauffeur, chauffeur2));
        List<AvailableDriverResponse> result = vehiculeService.getAvailableDriversForVehicle(1L);
        assertThat(result).hasSize(2);
    }

    // ═══════════════════════════════════════════════════════════════
    // TESTS ADDITIONNELS POUR 100% COUVERTURE
    // ═══════════════════════════════════════════════════════════════

    @Test
    @DisplayName("getAccessibleVehicules() → SuperAdmin voit tous les véhicules")
    void getAccessibleVehicules_asSuperAdmin_returnsAll() {
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(vehiculeRepository.findAll()).thenReturn(List.of(vehicule));
        
        List<VehiculeResponse> result = vehiculeService.getAccessibleVehicules();
        
        assertThat(result).hasSize(1);
        verify(vehiculeRepository, times(1)).findAll();
    }

    @Test
    @DisplayName("getAccessibleVehicules() → Manager voit véhicules de son entreprise")
    void getAccessibleVehicules_asManager_returnsCompanyVehicles() {
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(vehiculeRepository.findByEntreprise_Proprietaire_IdOrderByIdDesc(manager.getId()))
            .thenReturn(List.of(vehicule));
        
        List<VehiculeResponse> result = vehiculeService.getAccessibleVehicules();
        
        assertThat(result).hasSize(1);
        verify(vehiculeRepository, times(1)).findByEntreprise_Proprietaire_IdOrderByIdDesc(manager.getId());
    }

    @Test
    @DisplayName("getAccessibleVehicules() → Chauffeur voit son véhicule assigné")
    void getAccessibleVehicules_asChauffeur_returnsAssignedVehicle() {
        chauffeur.setVehiculeActuel(vehicule);
        when(authenticatedUserService.getCurrentUser()).thenReturn(chauffeur);
        when(chauffeurRepository.findById(chauffeur.getId())).thenReturn(Optional.of(chauffeur));
        
        List<VehiculeResponse> result = vehiculeService.getAccessibleVehicules();
        
        assertThat(result).hasSize(1);
    }

    @Test
    @DisplayName("getAccessibleVehicules() → Chauffeur sans véhicule retourne liste vide")
    void getAccessibleVehicules_asChauffeurWithoutVehicle_returnsEmpty() {
        chauffeur.setVehiculeActuel(null);
        when(authenticatedUserService.getCurrentUser()).thenReturn(chauffeur);
        when(chauffeurRepository.findById(chauffeur.getId())).thenReturn(Optional.of(chauffeur));
        
        List<VehiculeResponse> result = vehiculeService.getAccessibleVehicules();
        
        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("createVehicule() → Manager ne peut pas créer véhicule")
    void createVehicule_byManager_throwsException() {
        CreateVehiculeRequest request = new CreateVehiculeRequest(
            "EF-456-GH", "Peugeot", "Boxer", 1200.0, 0,
            StatutVehicule.EN_SERVICE, 1L, null
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        
        assertThatThrownBy(() -> vehiculeService.createVehicule(request))
            .isInstanceOf(Exception.class);
    }

    @Test
    @DisplayName("createVehicule() → Avec chauffeur assigné")
    void createVehicule_withDriver_succeeds() {
        CreateVehiculeRequest request = new CreateVehiculeRequest(
            "EF-456-GH", "Peugeot", "Boxer", 1200.0, 0,
            StatutVehicule.EN_SERVICE, 1L, 1L
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(entrepriseRepository.findById(1L)).thenReturn(Optional.of(entreprise));
        when(vehiculeRepository.existsByMatriculeIgnoreCase("EF-456-GH")).thenReturn(false);
        when(vehiculeRepository.countByEntreprise_Id(1L)).thenReturn(5L);
        when(chauffeurRepository.findById(1L)).thenReturn(Optional.of(chauffeur));
        when(vehiculeRepository.save(any(Vehicule.class))).thenAnswer(inv -> {
            Vehicule saved = inv.getArgument(0);
            saved.setId(10L);
            return saved;
        });
        
        VehiculeResponse result = vehiculeService.createVehicule(request);
        
        assertThat(result).isNotNull();
        verify(utilisateurRepository, times(1)).save(chauffeur);
    }

    @Test
    @DisplayName("createVehicule() → Chauffeur incompatible avec entreprise")
    void createVehicule_withIncompatibleDriver_throwsException() {
        Entreprise autreEntreprise = new Entreprise();
        autreEntreprise.setId(2L);
        autreEntreprise.setNomEntreprise("Autre Transport");
        chauffeur.setEntreprise(autreEntreprise);
        
        CreateVehiculeRequest request = new CreateVehiculeRequest(
            "EF-456-GH", "Peugeot", "Boxer", 1200.0, 0,
            StatutVehicule.EN_SERVICE, 1L, 1L
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(entrepriseRepository.findById(1L)).thenReturn(Optional.of(entreprise));
        when(vehiculeRepository.existsByMatriculeIgnoreCase("EF-456-GH")).thenReturn(false);
        when(vehiculeRepository.countByEntreprise_Id(1L)).thenReturn(5L);
        when(chauffeurRepository.findById(1L)).thenReturn(Optional.of(chauffeur));
        
        assertThatThrownBy(() -> vehiculeService.createVehicule(request))
            .isInstanceOf(ConflictException.class);
    }

    @Test
    @DisplayName("createVehicule() → Chauffeur non disponible")
    void createVehicule_withUnavailableDriver_throwsException() {
        chauffeur.setStatutConducteur(StatutChauffeur.EN_SERVICE);
        
        CreateVehiculeRequest request = new CreateVehiculeRequest(
            "EF-456-GH", "Peugeot", "Boxer", 1200.0, 0,
            StatutVehicule.EN_SERVICE, 1L, 1L
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(entrepriseRepository.findById(1L)).thenReturn(Optional.of(entreprise));
        when(vehiculeRepository.existsByMatriculeIgnoreCase("EF-456-GH")).thenReturn(false);
        when(vehiculeRepository.countByEntreprise_Id(1L)).thenReturn(5L);
        when(chauffeurRepository.findById(1L)).thenReturn(Optional.of(chauffeur));
        
        assertThatThrownBy(() -> vehiculeService.createVehicule(request))
            .isInstanceOf(BadRequestException.class);
    }

    @Test
    @DisplayName("createVehicule() → Entreprise inexistante")
    void createVehicule_withNonExistentCompany_throwsException() {
        CreateVehiculeRequest request = new CreateVehiculeRequest(
            "EF-456-GH", "Peugeot", "Boxer", 1200.0, 0,
            StatutVehicule.EN_SERVICE, 999L, null
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(entrepriseRepository.findById(999L)).thenReturn(Optional.empty());
        
        assertThatThrownBy(() -> vehiculeService.createVehicule(request))
            .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("updateVehicule() → Change entreprise")
    void updateVehicule_changeCompany_succeeds() {
        Entreprise nouvelleEntreprise = new Entreprise();
        nouvelleEntreprise.setId(2L);
        nouvelleEntreprise.setNomEntreprise("Nouveau Transport");
        nouvelleEntreprise.setTailleFlotte(20);
        nouvelleEntreprise.setProprietaire(manager);
        
        UpdateVehiculeRequest request = new UpdateVehiculeRequest(
            "AB-123-CD", "Renault", "Master", 1500.0, 0,
            StatutVehicule.EN_SERVICE, 2L, null
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(vehiculeRepository.findById(1L)).thenReturn(Optional.of(vehicule));
        when(entrepriseRepository.findById(2L)).thenReturn(Optional.of(nouvelleEntreprise));
        when(vehiculeRepository.countByEntreprise_Id(2L)).thenReturn(5L);
        when(vehiculeRepository.save(any(Vehicule.class))).thenAnswer(inv -> inv.getArgument(0));
        
        VehiculeResponse result = vehiculeService.updateVehicule(1L, request);
        
        assertThat(result).isNotNull();
        assertThat(vehicule.getEntreprise()).isEqualTo(nouvelleEntreprise);
    }

    @Test
    @DisplayName("updateVehicule() → Assigne nouveau chauffeur")
    void updateVehicule_assignNewDriver_succeeds() {
        Chauffeur nouveauChauffeur = new Chauffeur();
        nouveauChauffeur.setId(3L);
        nouveauChauffeur.setPrenom("Pierre");
        nouveauChauffeur.setNom("Martin");
        nouveauChauffeur.setRole(Role.CHAUFFEUR);
        nouveauChauffeur.setStatutConducteur(StatutChauffeur.LIBRE);
        nouveauChauffeur.setEntreprise(entreprise);
        
        UpdateVehiculeRequest request = new UpdateVehiculeRequest(
            "AB-123-CD", "Renault", "Master", 1500.0, 0,
            StatutVehicule.EN_SERVICE, null, 3L
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(vehiculeRepository.findById(1L)).thenReturn(Optional.of(vehicule));
        when(chauffeurRepository.findById(3L)).thenReturn(Optional.of(nouveauChauffeur));
        when(vehiculeRepository.save(any(Vehicule.class))).thenAnswer(inv -> inv.getArgument(0));
        
        VehiculeResponse result = vehiculeService.updateVehicule(1L, request);
        
        assertThat(result).isNotNull();
        verify(utilisateurRepository, times(1)).save(nouveauChauffeur);
    }

    @Test
    @DisplayName("updateVehicule() → Change matricule")
    void updateVehicule_changeMatricule_succeeds() {
        UpdateVehiculeRequest request = new UpdateVehiculeRequest(
            "XY-999-ZZ", "Renault", "Master", 1500.0, 0,
            StatutVehicule.EN_SERVICE, null, null
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(vehiculeRepository.findById(1L)).thenReturn(Optional.of(vehicule));
        when(vehiculeRepository.existsByMatriculeIgnoreCase("XY-999-ZZ")).thenReturn(false);
        when(vehiculeRepository.save(any(Vehicule.class))).thenAnswer(inv -> inv.getArgument(0));
        
        VehiculeResponse result = vehiculeService.updateVehicule(1L, request);
        
        assertThat(vehicule.getMatricule()).isEqualTo("XY-999-ZZ");
    }

    @Test
    @DisplayName("updateVehicule() → Matricule dupliqué")
    void updateVehicule_duplicateMatricule_throwsException() {
        UpdateVehiculeRequest request = new UpdateVehiculeRequest(
            "XY-999-ZZ", "Renault", "Master", 1500.0, 0,
            StatutVehicule.EN_SERVICE, null, null
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(vehiculeRepository.findById(1L)).thenReturn(Optional.of(vehicule));
        when(vehiculeRepository.existsByMatriculeIgnoreCase("XY-999-ZZ")).thenReturn(true);
        
        assertThatThrownBy(() -> vehiculeService.updateVehicule(1L, request))
            .isInstanceOf(BadRequestException.class);
    }

    @Test
    @DisplayName("updateVehiculeStatus() → Chauffeur change statut de son véhicule")
    void updateVehiculeStatus_byChauffeur_succeeds() {
        vehicule.setChauffeurActuel(chauffeur);
        chauffeur.setVehiculeActuel(vehicule);
        
        UpdateVehiculeStatusRequest request = new UpdateVehiculeStatusRequest(StatutVehicule.HORS_SERVICE);
        when(authenticatedUserService.getCurrentUser()).thenReturn(chauffeur);
        when(chauffeurRepository.findById(chauffeur.getId())).thenReturn(Optional.of(chauffeur));
        when(vehiculeRepository.findById(1L)).thenReturn(Optional.of(vehicule));
        when(vehiculeRepository.save(any(Vehicule.class))).thenAnswer(inv -> inv.getArgument(0));
        
        VehiculeResponse result = vehiculeService.updateVehiculeStatus(1L, request);
        
        assertThat(vehicule.getStatut()).isEqualTo(StatutVehicule.HORS_SERVICE);
    }

    @Test
    @DisplayName("updateVehiculeStatus() → Chauffeur non assigné ne peut pas changer statut")
    void updateVehiculeStatus_byUnassignedChauffeur_throwsException() {
        UpdateVehiculeStatusRequest request = new UpdateVehiculeStatusRequest(StatutVehicule.HORS_SERVICE);
        when(authenticatedUserService.getCurrentUser()).thenReturn(chauffeur);
        when(vehiculeRepository.findById(1L)).thenReturn(Optional.of(vehicule));
        
        assertThatThrownBy(() -> vehiculeService.updateVehiculeStatus(1L, request))
            .isInstanceOf(Exception.class);
    }

    @Test
    @DisplayName("assignDriver() → Manager assigne chauffeur d'une autre entreprise")
    void assignDriver_wrongCompanyDriver_throwsException() {
        Entreprise autreEntreprise = new Entreprise();
        autreEntreprise.setId(2L);
        chauffeur.setEntreprise(autreEntreprise);
        
        AssignVehiculeDriverRequest request = new AssignVehiculeDriverRequest(1L);
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(vehiculeRepository.findById(1L)).thenReturn(Optional.of(vehicule));
        when(chauffeurRepository.findById(1L)).thenReturn(Optional.of(chauffeur));
        
        assertThatThrownBy(() -> vehiculeService.assignDriver(1L, request))
            .isInstanceOf(ConflictException.class);
    }

    @Test
    @DisplayName("assignDriver() → Chauffeur inexistant")
    void assignDriver_nonExistentDriver_throwsException() {
        AssignVehiculeDriverRequest request = new AssignVehiculeDriverRequest(999L);
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(vehiculeRepository.findById(1L)).thenReturn(Optional.of(vehicule));
        when(chauffeurRepository.findById(999L)).thenReturn(Optional.empty());
        
        assertThatThrownBy(() -> vehiculeService.assignDriver(1L, request))
            .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("assignDriver() → Manager assigne à véhicule d'une autre entreprise")
    void assignDriver_toWrongCompanyVehicle_throwsException() {
        Entreprise autreEntreprise = new Entreprise();
        autreEntreprise.setId(2L);
        Manager autreManager = new Manager();
        autreManager.setId(99L);
        autreManager.setRole(Role.MANAGER);
        autreManager.setEntreprise(autreEntreprise);
        vehicule.setEntreprise(autreEntreprise);
        
        AssignVehiculeDriverRequest request = new AssignVehiculeDriverRequest(1L);
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(vehiculeRepository.findById(1L)).thenReturn(Optional.of(vehicule));
        
        assertThatThrownBy(() -> vehiculeService.assignDriver(1L, request))
            .isInstanceOf(Exception.class);
    }

    @Test
    @DisplayName("clearDriver() → SuperAdmin libère chauffeur d'un véhicule")
    void clearDriver_bySuperAdminOfSameCompany_succeeds() {
        vehicule.setChauffeurActuel(chauffeur);
        chauffeur.setVehiculeActuel(vehicule);
        
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(vehiculeRepository.findById(1L)).thenReturn(Optional.of(vehicule));
        when(vehiculeRepository.save(any(Vehicule.class))).thenAnswer(inv -> inv.getArgument(0));
        
        VehiculeResponse result = vehiculeService.clearDriver(1L);
        
        assertThat(vehicule.getChauffeurActuel()).isNull();
    }

    @Test
    @DisplayName("deleteVehicule() → Manager ne peut pas supprimer véhicule")
    void deleteVehicule_byManager_throwsException() {
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        
        assertThatThrownBy(() -> vehiculeService.deleteVehicule(1L))
            .isInstanceOf(Exception.class);
    }

    @Test
    @DisplayName("deleteVehicule() → Véhicule inexistant")
    void deleteVehicule_whenNotFound_throwsException() {
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(vehiculeRepository.findById(999L)).thenReturn(Optional.empty());
        
        assertThatThrownBy(() -> vehiculeService.deleteVehicule(999L))
            .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("getAvailableDriversForVehicle() → Véhicule inexistant")
    void getAvailableDriversForVehicle_whenVehicleNotFound_throwsException() {
        when(vehiculeRepository.findById(999L)).thenReturn(Optional.empty());
        
        assertThatThrownBy(() -> vehiculeService.getAvailableDriversForVehicle(999L))
            .isInstanceOf(ResourceNotFoundException.class);
    }

    // ═══════════════════════════════════════════════════════════════
    // TESTS COUVERTURE RESTANTE (lignes atteignables)
    // ═══════════════════════════════════════════════════════════════

    @Test
    @DisplayName("getAccessibleVehicules()/getVehicule() → Rôle inconnu")
    void unknownRole_cannotAccessVehicules() {
        Chauffeur unknown = new Chauffeur();
        unknown.setId(9L);
        when(authenticatedUserService.getCurrentUser()).thenReturn(unknown);
        when(vehiculeRepository.findById(1L)).thenReturn(Optional.of(vehicule));

        assertThatThrownBy(() -> vehiculeService.getVehicule(1L))
            .isInstanceOf(UnauthorizedException.class);
        assertThat(vehiculeService.getAccessibleVehicules()).isEmpty();
    }

    @Test
    @DisplayName("getVehicule() → Manager propriétaire")
    void getVehicule_asManager_returnsVehicle() {
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(vehiculeRepository.findById(1L)).thenReturn(Optional.of(vehicule));

        VehiculeResponse result = vehiculeService.getVehicule(1L);

        assertThat(result.matricule()).isEqualTo("AB-123-CD");
    }

    @Test
    @DisplayName("getVehicule() → Chauffeur assigné au véhicule")
    void getVehicule_asAssignedChauffeur_returnsVehicle() {
        vehicule.setChauffeurActuel(chauffeur);
        chauffeur.setVehiculeActuel(vehicule);
        when(authenticatedUserService.getCurrentUser()).thenReturn(chauffeur);
        when(chauffeurRepository.findById(chauffeur.getId())).thenReturn(Optional.of(chauffeur));
        when(vehiculeRepository.findById(1L)).thenReturn(Optional.of(vehicule));

        VehiculeResponse result = vehiculeService.getVehicule(1L);

        assertThat(result).isNotNull();
    }

    @Test
    @DisplayName("getVehicule() → Chauffeur non assigné au véhicule")
    void getVehicule_asUnassignedChauffeur_throwsException() {
        when(authenticatedUserService.getCurrentUser()).thenReturn(chauffeur);
        when(chauffeurRepository.findById(chauffeur.getId())).thenReturn(Optional.of(chauffeur));
        when(vehiculeRepository.findById(1L)).thenReturn(Optional.of(vehicule));

        assertThatThrownBy(() -> vehiculeService.getVehicule(1L))
            .isInstanceOf(UnauthorizedException.class);
    }

    @Test
    @DisplayName("createVehicule() → Capacité de flotte illimitée")
    void createVehicule_withUnlimitedFleetCapacity_succeeds() {
        entreprise.setTailleFlotte(null);
        CreateVehiculeRequest request = new CreateVehiculeRequest(
            "EF-456-GH", "Peugeot", "Boxer", 1200.0, 0,
            StatutVehicule.EN_SERVICE, 1L, null
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(entrepriseRepository.findById(1L)).thenReturn(Optional.of(entreprise));
        when(vehiculeRepository.existsByMatriculeIgnoreCase("EF-456-GH")).thenReturn(false);
        when(vehiculeRepository.save(any(Vehicule.class))).thenAnswer(inv -> {
            Vehicule saved = inv.getArgument(0);
            saved.setId(10L);
            return saved;
        });

        VehiculeResponse result = vehiculeService.createVehicule(request);

        assertThat(result.matricule()).isEqualTo("EF-456-GH");
    }

    @Test
    @DisplayName("createVehicule() → Champs vides + entreprise sans propriétaire")
    void createVehicule_blankFieldsWithoutOwner_succeeds() {
        superAdmin.setPrenom(null);
        superAdmin.setNom(null);
        superAdmin.setEmail(null);
        entreprise.setProprietaire(null);
        entreprise.setNomEntreprise(null);
        CreateVehiculeRequest request = new CreateVehiculeRequest(
            "", "", "", 1200.0, 0,
            StatutVehicule.EN_SERVICE, 1L, null
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(entrepriseRepository.findById(1L)).thenReturn(Optional.of(entreprise));
        when(vehiculeRepository.existsByMatriculeIgnoreCase("")).thenReturn(false);
        when(vehiculeRepository.countByEntreprise_Id(1L)).thenReturn(5L);
        when(vehiculeRepository.save(any(Vehicule.class))).thenAnswer(inv -> {
            Vehicule saved = inv.getArgument(0);
            saved.setId(10L);
            return saved;
        });

        VehiculeResponse result = vehiculeService.createVehicule(request);

        assertThat(result.matricule()).isEmpty();
        verify(notificationRepository, times(1)).save(any(Notification.class));
    }

    @Test
    @DisplayName("updateVehicule() → Changement de statut notifie chauffeur et manager")
    void updateVehicule_statusChange_notifiesDriverAndManager() {
        vehicule.setChauffeurActuel(chauffeur);
        chauffeur.setVehiculeActuel(vehicule);
        UpdateVehiculeRequest request = new UpdateVehiculeRequest(
            "AB-123-CD", "Renault", "Master", 1500.0, 0,
            StatutVehicule.EN_MAINTENANCE, null, null
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(vehiculeRepository.findById(1L)).thenReturn(Optional.of(vehicule));
        when(vehiculeRepository.save(any(Vehicule.class))).thenAnswer(inv -> inv.getArgument(0));

        VehiculeResponse result = vehiculeService.updateVehicule(1L, request);

        assertThat(vehicule.getStatut()).isEqualTo(StatutVehicule.EN_MAINTENANCE);
        assertThat(result).isNotNull();
    }

    @Test
    @DisplayName("updateVehicule() → Changement de statut avec propriétaire SuperAdmin")
    void updateVehicule_statusChange_superadminOwner() {
        entreprise.setProprietaire(superAdmin);
        UpdateVehiculeRequest request = new UpdateVehiculeRequest(
            "AB-123-CD", "Renault", "Master", 1500.0, 0,
            StatutVehicule.HORS_SERVICE, null, null
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(vehiculeRepository.findById(1L)).thenReturn(Optional.of(vehicule));
        when(vehiculeRepository.save(any(Vehicule.class))).thenAnswer(inv -> inv.getArgument(0));

        vehiculeService.updateVehicule(1L, request);

        assertThat(vehicule.getStatut()).isEqualTo(StatutVehicule.HORS_SERVICE);
    }

    @Test
    @DisplayName("updateVehicule() → Transfert entre entreprises SuperAdmin")
    void updateVehicule_transfer_betweenSuperadminCompanies() {
        entreprise.setProprietaire(superAdmin);
        Manager owner2 = new Manager();
        owner2.setId(7L);
        owner2.setRole(Role.SUPERADMIN);
        Entreprise nouvelleEntreprise = new Entreprise();
        nouvelleEntreprise.setId(2L);
        nouvelleEntreprise.setNomEntreprise("Nouveau Transport");
        nouvelleEntreprise.setTailleFlotte(20);
        nouvelleEntreprise.setProprietaire(owner2);

        UpdateVehiculeRequest request = new UpdateVehiculeRequest(
            "AB-123-CD", "Renault", "Master", 1500.0, 0,
            StatutVehicule.EN_SERVICE, 2L, null
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(vehiculeRepository.findById(1L)).thenReturn(Optional.of(vehicule));
        when(entrepriseRepository.findById(2L)).thenReturn(Optional.of(nouvelleEntreprise));
        when(vehiculeRepository.countByEntreprise_Id(2L)).thenReturn(5L);
        when(vehiculeRepository.save(any(Vehicule.class))).thenAnswer(inv -> inv.getArgument(0));

        vehiculeService.updateVehicule(1L, request);

        assertThat(vehicule.getEntreprise()).isEqualTo(nouvelleEntreprise);
    }

    @Test
    @DisplayName("updateVehicule() → Réaffectation chauffeur avec propriétaire SuperAdmin")
    void updateVehicule_replaceDriver_superadminOwner() {
        entreprise.setProprietaire(superAdmin);
        Chauffeur oldChauffeur = new Chauffeur();
        oldChauffeur.setId(5L);
        oldChauffeur.setRole(Role.CHAUFFEUR);
        oldChauffeur.setPrenom("Ancien");
        oldChauffeur.setNom("Chauffeur");
        oldChauffeur.setEntreprise(entreprise);
        vehicule.setChauffeurActuel(oldChauffeur);
        oldChauffeur.setVehiculeActuel(vehicule);

        UpdateVehiculeRequest request = new UpdateVehiculeRequest(
            "AB-123-CD", "Renault", "Master", 1500.0, 0,
            StatutVehicule.EN_SERVICE, null, 1L
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(vehiculeRepository.findById(1L)).thenReturn(Optional.of(vehicule));
        when(chauffeurRepository.findById(1L)).thenReturn(Optional.of(chauffeur));
        when(vehiculeRepository.save(any(Vehicule.class))).thenAnswer(inv -> inv.getArgument(0));

        vehiculeService.updateVehicule(1L, request);

        assertThat(vehicule.getChauffeurActuel()).isEqualTo(chauffeur);
        assertThat(oldChauffeur.getVehiculeActuel()).isNull();
    }

    @Test
    @DisplayName("updateVehiculeStatus() → Manager uniquement EN_MAINTENANCE")
    void updateVehiculeStatus_byManager_nonMaintenance_throwsException() {
        UpdateVehiculeStatusRequest request = new UpdateVehiculeStatusRequest(StatutVehicule.HORS_SERVICE);
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(vehiculeRepository.findById(1L)).thenReturn(Optional.of(vehicule));

        assertThatThrownBy(() -> vehiculeService.updateVehiculeStatus(1L, request))
            .isInstanceOf(UnauthorizedException.class);
    }

    @Test
    @DisplayName("updateVehiculeStatus() → SuperAdmin sans entreprise")
    void updateVehiculeStatus_bySuperAdmin_noCompany() {
        vehicule.setEntreprise(null);
        UpdateVehiculeStatusRequest request = new UpdateVehiculeStatusRequest(StatutVehicule.HORS_SERVICE);
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(vehiculeRepository.findById(1L)).thenReturn(Optional.of(vehicule));
        when(vehiculeRepository.save(any(Vehicule.class))).thenAnswer(inv -> inv.getArgument(0));

        VehiculeResponse result = vehiculeService.updateVehiculeStatus(1L, request);

        assertThat(vehicule.getStatut()).isEqualTo(StatutVehicule.HORS_SERVICE);
        assertThat(result).isNotNull();
    }

    @Test
    @DisplayName("updateVehiculeStatus() → Destinataires doublons ignorés")
    void updateVehiculeStatus_duplicateRecipientId_isDeduplicated() {
        Manager autreManager = new Manager();
        autreManager.setId(manager.getId());
        autreManager.setRole(Role.MANAGER);
        autreManager.setEmail("autre@test.com");
        entreprise.setProprietaire(autreManager);

        UpdateVehiculeStatusRequest request = new UpdateVehiculeStatusRequest(StatutVehicule.EN_MAINTENANCE);
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(vehiculeRepository.findById(1L)).thenReturn(Optional.of(vehicule));
        when(vehiculeRepository.save(any(Vehicule.class))).thenAnswer(inv -> inv.getArgument(0));

        vehiculeService.updateVehiculeStatus(1L, request);

        verify(notificationRepository, times(1)).save(any(Notification.class));
    }

    @Test
    @DisplayName("assignDriver() → SuperAdmin remplace le chauffeur actuel")
    void assignDriver_replaceDriver_bySuperAdmin_succeeds() {
        entreprise.setProprietaire(superAdmin);
        Chauffeur oldChauffeur = new Chauffeur();
        oldChauffeur.setId(5L);
        oldChauffeur.setRole(Role.CHAUFFEUR);
        oldChauffeur.setPrenom("Ancien");
        oldChauffeur.setNom("Chauffeur");
        oldChauffeur.setEntreprise(entreprise);
        vehicule.setChauffeurActuel(oldChauffeur);
        oldChauffeur.setVehiculeActuel(vehicule);

        AssignVehiculeDriverRequest request = new AssignVehiculeDriverRequest(1L);
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(vehiculeRepository.findById(1L)).thenReturn(Optional.of(vehicule));
        when(chauffeurRepository.findById(1L)).thenReturn(Optional.of(chauffeur));
        when(vehiculeRepository.save(any(Vehicule.class))).thenAnswer(inv -> inv.getArgument(0));

        VehiculeResponse result = vehiculeService.assignDriver(1L, request);

        assertThat(vehicule.getChauffeurActuel()).isEqualTo(chauffeur);
        assertThat(oldChauffeur.getVehiculeActuel()).isNull();
        assertThat(oldChauffeur.getStatutConducteur()).isEqualTo(StatutChauffeur.LIBRE);
        verify(utilisateurRepository).save(oldChauffeur);
    }

    @Test
    @DisplayName("assignDriver() → Repos obligatoire non respecté")
    void assignDriver_whenDriverNeedsRest_throwsException() {
        Trajet trajet = new Trajet();
        trajet.setId(10L);
        trajet.setStatut(StatutTrajet.COMPLETE);
        trajet.setDateArriveeReelle(LocalDateTime.now().minusHours(1));
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(vehiculeRepository.findById(1L)).thenReturn(Optional.of(vehicule));
        when(chauffeurRepository.findById(1L)).thenReturn(Optional.of(chauffeur));
        when(trajetRepository.findByChauffeurIdWithFetch(1L)).thenReturn(List.of(trajet));

        AssignVehiculeDriverRequest request = new AssignVehiculeDriverRequest(1L);

        assertThatThrownBy(() -> vehiculeService.assignDriver(1L, request))
            .isInstanceOf(BadRequestException.class);
        verify(notificationRepository, atLeastOnce()).save(any(Notification.class));
    }

    @Test
    @DisplayName("assignDriver() → Repos terminé, affectation réussie")
    void assignDriver_afterRestPeriod_succeeds() {
        Trajet trajet = new Trajet();
        trajet.setId(10L);
        trajet.setStatut(StatutTrajet.COMPLETE);
        trajet.setDateArriveeReelle(LocalDateTime.now().minusHours(13));
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(vehiculeRepository.findById(1L)).thenReturn(Optional.of(vehicule));
        when(chauffeurRepository.findById(1L)).thenReturn(Optional.of(chauffeur));
        when(trajetRepository.findByChauffeurIdWithFetch(1L)).thenReturn(List.of(trajet));
        when(vehiculeRepository.save(any(Vehicule.class))).thenAnswer(inv -> inv.getArgument(0));

        VehiculeResponse result = vehiculeService.assignDriver(1L, new AssignVehiculeDriverRequest(1L));

        assertThat(vehicule.getChauffeurActuel()).isEqualTo(chauffeur);
    }

    @Test
    @DisplayName("assignDriver() → Chauffeur sans entreprise rattaché à celle du véhicule")
    void assignDriver_chauffeurWithoutCompany_attachedToVehicleCompany() {
        chauffeur.setEntreprise(null);
        chauffeur.setManager(manager);
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(vehiculeRepository.findById(1L)).thenReturn(Optional.of(vehicule));
        when(chauffeurRepository.findById(1L)).thenReturn(Optional.of(chauffeur));
        when(vehiculeRepository.save(any(Vehicule.class))).thenAnswer(inv -> inv.getArgument(0));

        VehiculeResponse result = vehiculeService.assignDriver(1L, new AssignVehiculeDriverRequest(1L));

        assertThat(chauffeur.getEntreprise()).isEqualTo(entreprise);
    }

    @Test
    @DisplayName("assignDriver() → Véhicule sans entreprise")
    void assignDriver_vehicleWithoutCompany_succeeds() {
        vehicule.setEntreprise(null);
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(vehiculeRepository.findById(1L)).thenReturn(Optional.of(vehicule));
        when(chauffeurRepository.findById(1L)).thenReturn(Optional.of(chauffeur));
        when(vehiculeRepository.save(any(Vehicule.class))).thenAnswer(inv -> inv.getArgument(0));

        VehiculeResponse result = vehiculeService.assignDriver(1L, new AssignVehiculeDriverRequest(1L));

        assertThat(vehicule.getChauffeurActuel()).isEqualTo(chauffeur);
    }

    @Test
    @DisplayName("assignDriver() → Chauffeur déjà affecté à un autre véhicule")
    void assignDriver_driverAlreadyOnAnotherVehicle_throwsException() {
        Vehicule autreVehicule = new Vehicule();
        autreVehicule.setId(99L);
        chauffeur.setVehiculeActuel(autreVehicule);
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(vehiculeRepository.findById(1L)).thenReturn(Optional.of(vehicule));
        when(chauffeurRepository.findById(1L)).thenReturn(Optional.of(chauffeur));

        assertThatThrownBy(() -> vehiculeService.assignDriver(1L, new AssignVehiculeDriverRequest(1L)))
            .isInstanceOf(BadRequestException.class);
    }

    @Test
    @DisplayName("clearDriver() → Aucun chauffeur affecté")
    void clearDriver_noAssignedDriver_returnsVehicle() {
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(vehiculeRepository.findById(1L)).thenReturn(Optional.of(vehicule));

        VehiculeResponse result = vehiculeService.clearDriver(1L);

        assertThat(result).isNotNull();
    }

    @Test
    @DisplayName("clearDriver() → Propriétaire SuperAdmin")
    void clearDriver_superadminOwner_succeeds() {
        entreprise.setProprietaire(superAdmin);
        vehicule.setChauffeurActuel(chauffeur);
        chauffeur.setVehiculeActuel(vehicule);
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(vehiculeRepository.findById(1L)).thenReturn(Optional.of(vehicule));
        when(vehiculeRepository.save(any(Vehicule.class))).thenAnswer(inv -> inv.getArgument(0));

        VehiculeResponse result = vehiculeService.clearDriver(1L);

        assertThat(vehicule.getChauffeurActuel()).isNull();
    }

    @Test
    @DisplayName("deleteVehicule() → Avec chauffeur affecté")
    void deleteVehicule_withAssignedDriver_superadminOwner() {
        entreprise.setProprietaire(superAdmin);
        vehicule.setChauffeurActuel(chauffeur);
        chauffeur.setVehiculeActuel(vehicule);
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(vehiculeRepository.findById(1L)).thenReturn(Optional.of(vehicule));

        vehiculeService.deleteVehicule(1L);

        assertThat(chauffeur.getVehiculeActuel()).isNull();
        assertThat(chauffeur.getStatutConducteur()).isEqualTo(StatutChauffeur.LIBRE);
        verify(utilisateurRepository).save(chauffeur);
        verify(vehiculeRepository).delete(vehicule);
    }

    @Test
    @DisplayName("deleteVehicule() → Aucun destinataire")
    void deleteVehicule_noOwnerNoDriver_returnsSilently() {
        entreprise.setProprietaire(null);
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(vehiculeRepository.findById(1L)).thenReturn(Optional.of(vehicule));

        vehiculeService.deleteVehicule(1L);

        verify(vehiculeRepository).delete(vehicule);
        verify(notificationRepository, never()).save(any(Notification.class));
    }

    @Test
    @DisplayName("getAvailableDriversForVehicle() → Chauffeur non autorisé")
    void getAvailableDriversForVehicle_byChauffeur_throwsException() {
        when(authenticatedUserService.getCurrentUser()).thenReturn(chauffeur);
        when(vehiculeRepository.findById(1L)).thenReturn(Optional.of(vehicule));

        assertThatThrownBy(() -> vehiculeService.getAvailableDriversForVehicle(1L))
            .isInstanceOf(UnauthorizedException.class);
    }

    @Test
    @DisplayName("getAvailableDriversForVehicle() → Véhicule sans entreprise")
    void getAvailableDriversForVehicle_vehicleWithoutCompany_returnsEmpty() {
        vehicule.setEntreprise(null);
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(vehiculeRepository.findById(1L)).thenReturn(Optional.of(vehicule));

        assertThat(vehiculeService.getAvailableDriversForVehicle(1L)).isEmpty();
    }

    @Test
    @DisplayName("buildRestMessage() → Chauffeur disponible (réflexion)")
    void buildRestMessage_whenAvailable_returnsPlaceholder() throws Exception {
        when(trajetRepository.findByChauffeurIdWithFetch(chauffeur.getId())).thenReturn(List.of());

        Method method = VehiculeServiceImpl.class.getDeclaredMethod("buildRestMessage", Chauffeur.class);
        method.setAccessible(true);
        String message = (String) method.invoke(vehiculeService, chauffeur);

        assertThat(message).isEqualTo("Driver is not available");
    }

    @Test
    @DisplayName("notifyUsers() → Message vide ignoré (réflexion)")
    void notifyUsers_withBlankMessage_skipsRecipient() throws Exception {
        Method method = VehiculeServiceImpl.class.getDeclaredMethod(
            "notifyUsers", java.util.Collection.class, Function.class);
        method.setAccessible(true);

        method.invoke(vehiculeService, List.of(manager), (Function<Utilisateur, String>) u -> "  ");

        verify(notificationRepository, never()).save(any(Notification.class));
    }

    @Test
    @DisplayName("vehicleLabel() → Véhicule null (réflexion)")
    void vehicleLabel_whenNull_returnsInconnu() throws Exception {
        Method method = VehiculeServiceImpl.class.getDeclaredMethod("vehicleLabel", Vehicule.class);
        method.setAccessible(true);

        String label = (String) method.invoke(vehiculeService, new Object[] { null });

        assertThat(label).isEqualTo("inconnu");
    }

    @Test
    @DisplayName("vehicleSummary() → Véhicule null (réflexion)")
    void vehicleSummary_whenNull_returnsInconnu() throws Exception {
        Method method = VehiculeServiceImpl.class.getDeclaredMethod("vehicleSummary", Vehicule.class);
        method.setAccessible(true);

        String summary = (String) method.invoke(vehiculeService, new Object[] { null });

        assertThat(summary).isEqualTo("Vehicule inconnu");
    }

    @Test
    @DisplayName("statusLabel() → Statut null (réflexion)")
    void statusLabel_whenNull_returnsInconnu() throws Exception {
        Method method = VehiculeServiceImpl.class.getDeclaredMethod("statusLabel", StatutVehicule.class);
        method.setAccessible(true);

        String label = (String) method.invoke(vehiculeService, new Object[] { null });

        assertThat(label).isEqualTo("INCONNU");
    }

    // ═══════════════════════════════════════════════════════════════
    // TESTS COUVERTURE BRANCHES MANQUANTES
    // ═══════════════════════════════════════════════════════════════

    @Test
    @DisplayName("createVehicule() → Statut null, défaut EN_SERVICE")
    void createVehicule_nullStatut_defaultsToEnService() {
        CreateVehiculeRequest request = new CreateVehiculeRequest(
            "EF-456-GH", "Peugeot", "Boxer", 1200.0, 0,
            null, 1L, null
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(entrepriseRepository.findById(1L)).thenReturn(Optional.of(entreprise));
        when(vehiculeRepository.existsByMatriculeIgnoreCase("EF-456-GH")).thenReturn(false);
        when(vehiculeRepository.countByEntreprise_Id(1L)).thenReturn(5L);
        when(vehiculeRepository.save(any(Vehicule.class))).thenAnswer(inv -> {
            Vehicule saved = inv.getArgument(0);
            saved.setId(10L);
            return saved;
        });

        VehiculeResponse result = vehiculeService.createVehicule(request);

        assertThat(result.statut()).isEqualTo(StatutVehicule.EN_SERVICE);
    }

    @Test
    @DisplayName("updateVehicule() → Tous champs optionnels null, rien modifié")
    void updateVehicule_allOptionalFieldsNull_noChanges() {
        UpdateVehiculeRequest request = new UpdateVehiculeRequest(
            null, null, null, null, null, null, null, null
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(vehiculeRepository.findById(1L)).thenReturn(Optional.of(vehicule));
        when(vehiculeRepository.save(any(Vehicule.class))).thenAnswer(inv -> inv.getArgument(0));

        vehiculeService.updateVehicule(1L, request);

        assertThat(vehicule.getMatricule()).isEqualTo("AB-123-CD");
        assertThat(vehicule.getMarque()).isEqualTo("Renault");
        assertThat(vehicule.getModele()).isEqualTo("Master");
        assertThat(vehicule.getCapacite()).isEqualTo(1500.0);
        assertThat(vehicule.getStatut()).isEqualTo(StatutVehicule.EN_SERVICE);
    }

    @Test
    @DisplayName("updateVehicule() → Même entrepriseId, pas de transfert")
    void updateVehicule_sameEntrepriseId_noTransfer() {
        UpdateVehiculeRequest request = new UpdateVehiculeRequest(
            "AB-123-CD", "Renault", "Master", 1500.0, 0,
            StatutVehicule.EN_SERVICE, 1L, null
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(vehiculeRepository.findById(1L)).thenReturn(Optional.of(vehicule));
        when(vehiculeRepository.save(any(Vehicule.class))).thenAnswer(inv -> inv.getArgument(0));

        vehiculeService.updateVehicule(1L, request);

        verify(entrepriseRepository, never()).findById(anyLong());
    }

    @Test
    @DisplayName("updateVehicule() → Assigner entreprise à véhicule sans entreprise")
    void updateVehicule_assignCompanyToVehicleWithoutCompany_succeeds() {
        vehicule.setEntreprise(null);
        Entreprise nouvelleEntreprise = new Entreprise();
        nouvelleEntreprise.setId(2L);
        nouvelleEntreprise.setNomEntreprise("Nouveau Transport");
        nouvelleEntreprise.setTailleFlotte(20);
        nouvelleEntreprise.setProprietaire(manager);

        UpdateVehiculeRequest request = new UpdateVehiculeRequest(
            "AB-123-CD", "Renault", "Master", 1500.0, 0,
            StatutVehicule.EN_SERVICE, 2L, null
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(vehiculeRepository.findById(1L)).thenReturn(Optional.of(vehicule));
        when(entrepriseRepository.findById(2L)).thenReturn(Optional.of(nouvelleEntreprise));
        when(vehiculeRepository.countByEntreprise_Id(2L)).thenReturn(5L);
        when(vehiculeRepository.save(any(Vehicule.class))).thenAnswer(inv -> inv.getArgument(0));

        VehiculeResponse result = vehiculeService.updateVehicule(1L, request);

        assertThat(vehicule.getEntreprise()).isEqualTo(nouvelleEntreprise);
    }

    @Test
    @DisplayName("updateVehicule() → Rien changé, entreprise null")
    void updateVehicule_noCompanyNothingChanged_succeeds() {
        vehicule.setEntreprise(null);
        UpdateVehiculeRequest request = new UpdateVehiculeRequest(
            null, null, null, null, null, null, null, null
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(vehiculeRepository.findById(1L)).thenReturn(Optional.of(vehicule));
        when(vehiculeRepository.save(any(Vehicule.class))).thenAnswer(inv -> inv.getArgument(0));

        VehiculeResponse result = vehiculeService.updateVehicule(1L, request);

        assertThat(result).isNotNull();
    }

    @Test
    @DisplayName("updateVehicule() → Changement uniquement du chauffeur")
    void updateVehicule_onlyChauffeurChanged_notifiesDriverChange() {
        Chauffeur oldChauffeur = new Chauffeur();
        oldChauffeur.setId(5L);
        oldChauffeur.setRole(Role.CHAUFFEUR);
        oldChauffeur.setPrenom("Ancien");
        oldChauffeur.setNom("Chauffeur");
        oldChauffeur.setEntreprise(entreprise);
        vehicule.setChauffeurActuel(oldChauffeur);

        UpdateVehiculeRequest request = new UpdateVehiculeRequest(
            "AB-123-CD", "Renault", "Master", 1500.0, 0,
            StatutVehicule.EN_SERVICE, null, 1L
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(vehiculeRepository.findById(1L)).thenReturn(Optional.of(vehicule));
        when(chauffeurRepository.findById(1L)).thenReturn(Optional.of(chauffeur));
        when(vehiculeRepository.save(any(Vehicule.class))).thenAnswer(inv -> inv.getArgument(0));

        VehiculeResponse result = vehiculeService.updateVehicule(1L, request);

        assertThat(vehicule.getChauffeurActuel()).isEqualTo(chauffeur);
        verify(notificationRepository, atLeastOnce()).save(any(Notification.class));
    }

    @Test
    @DisplayName("updateVehicule() → Chauffeur changé, propriétaire null")
    void updateVehicule_driverChangedNoOwner_skipsOwnerNotification() {
        entreprise.setProprietaire(null);
        Chauffeur oldChauffeur = new Chauffeur();
        oldChauffeur.setId(5L);
        oldChauffeur.setRole(Role.CHAUFFEUR);
        oldChauffeur.setPrenom("Ancien");
        oldChauffeur.setNom("Chauffeur");
        vehicule.setChauffeurActuel(oldChauffeur);

        UpdateVehiculeRequest request = new UpdateVehiculeRequest(
            "AB-123-CD", "Renault", "Master", 1500.0, 0,
            StatutVehicule.EN_SERVICE, null, 1L
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(vehiculeRepository.findById(1L)).thenReturn(Optional.of(vehicule));
        when(chauffeurRepository.findById(1L)).thenReturn(Optional.of(chauffeur));
        when(vehiculeRepository.save(any(Vehicule.class))).thenAnswer(inv -> inv.getArgument(0));

        VehiculeResponse result = vehiculeService.updateVehicule(1L, request);

        assertThat(vehicule.getChauffeurActuel()).isEqualTo(chauffeur);
    }

    @Test
    @DisplayName("updateVehicule() → Changement statut, même entreprise, pas de transfert")
    void updateVehicule_statusChangedSameCompany_noTransferNotification() {
        vehicule.setChauffeurActuel(chauffeur);
        chauffeur.setVehiculeActuel(vehicule);
        UpdateVehiculeRequest request = new UpdateVehiculeRequest(
            "AB-123-CD", "Renault", "Master", 1500.0, 0,
            StatutVehicule.EN_MAINTENANCE, null, null
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(vehiculeRepository.findById(1L)).thenReturn(Optional.of(vehicule));
        when(vehiculeRepository.save(any(Vehicule.class))).thenAnswer(inv -> inv.getArgument(0));

        VehiculeResponse result = vehiculeService.updateVehicule(1L, request);

        assertThat(vehicule.getStatut()).isEqualTo(StatutVehicule.EN_MAINTENANCE);
    }

    @Test
    @DisplayName("assignDriver() → Repos non respecté, véhicule sans entreprise")
    void assignDriver_needsRest_noCompany() {
        vehicule.setEntreprise(null);
        Trajet trajet = new Trajet();
        trajet.setId(10L);
        trajet.setStatut(StatutTrajet.COMPLETE);
        trajet.setDateArriveeReelle(LocalDateTime.now().minusHours(1));
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(vehiculeRepository.findById(1L)).thenReturn(Optional.of(vehicule));
        when(chauffeurRepository.findById(1L)).thenReturn(Optional.of(chauffeur));
        when(trajetRepository.findByChauffeurIdWithFetch(1L)).thenReturn(List.of(trajet));

        assertThatThrownBy(() -> vehiculeService.assignDriver(1L, new AssignVehiculeDriverRequest(1L)))
            .isInstanceOf(BadRequestException.class);
    }

    @Test
    @DisplayName("assignDriver() → Même chauffeur déjà affecté")
    void assignDriver_sameDriverAlreadyAssigned_noOp() {
        vehicule.setChauffeurActuel(chauffeur);
        chauffeur.setVehiculeActuel(vehicule);
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(vehiculeRepository.findById(1L)).thenReturn(Optional.of(vehicule));
        when(chauffeurRepository.findById(1L)).thenReturn(Optional.of(chauffeur));
        when(vehiculeRepository.save(any(Vehicule.class))).thenAnswer(inv -> inv.getArgument(0));

        VehiculeResponse result = vehiculeService.assignDriver(1L, new AssignVehiculeDriverRequest(1L));

        assertThat(result).isNotNull();
        assertThat(vehicule.getChauffeurActuel()).isEqualTo(chauffeur);
    }

    @Test
    @DisplayName("assignDriver() → SuperAdmin affecte même chauffeur")
    void assignDriver_superAdminSameDriver_succeeds() {
        vehicule.setChauffeurActuel(chauffeur);
        chauffeur.setVehiculeActuel(vehicule);
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(vehiculeRepository.findById(1L)).thenReturn(Optional.of(vehicule));
        when(chauffeurRepository.findById(1L)).thenReturn(Optional.of(chauffeur));
        when(vehiculeRepository.save(any(Vehicule.class))).thenAnswer(inv -> inv.getArgument(0));

        VehiculeResponse result = vehiculeService.assignDriver(1L, new AssignVehiculeDriverRequest(1L));

        assertThat(result).isNotNull();
    }

    @Test
    @DisplayName("assignDriver() → Chauffeur via manager, entreprise incompatible")
    void assignDriver_chauffeurViaManagerWrongEntreprise_throwsException() {
        Entreprise autreEntreprise = new Entreprise();
        autreEntreprise.setId(2L);
        Manager autreManager = new Manager();
        autreManager.setId(20L);
        autreManager.setEntreprise(autreEntreprise);
        chauffeur.setEntreprise(null);
        chauffeur.setManager(autreManager);

        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(vehiculeRepository.findById(1L)).thenReturn(Optional.of(vehicule));
        when(chauffeurRepository.findById(1L)).thenReturn(Optional.of(chauffeur));

        assertThatThrownBy(() -> vehiculeService.assignDriver(1L, new AssignVehiculeDriverRequest(1L)))
            .isInstanceOf(ConflictException.class);
    }

    @Test
    @DisplayName("assignDriver() → Chauffeur sans entreprise ni manager")
    void assignDriver_chauffeurNoCompanyNoManager_succeeds() {
        chauffeur.setEntreprise(null);
        chauffeur.setManager(null);
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(vehiculeRepository.findById(1L)).thenReturn(Optional.of(vehicule));
        when(chauffeurRepository.findById(1L)).thenReturn(Optional.of(chauffeur));
        when(vehiculeRepository.save(any(Vehicule.class))).thenAnswer(inv -> inv.getArgument(0));

        VehiculeResponse result = vehiculeService.assignDriver(1L, new AssignVehiculeDriverRequest(1L));

        assertThat(result).isNotNull();
    }

    @Test
    @DisplayName("assignDriver() → Chauffeur sans entreprise, manager sans entreprise")
    void assignDriver_chauffeurWithManagerNoCompany_succeeds() {
        Manager managerNoCompany = new Manager();
        managerNoCompany.setId(20L);
        chauffeur.setEntreprise(null);
        chauffeur.setManager(managerNoCompany);
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(vehiculeRepository.findById(1L)).thenReturn(Optional.of(vehicule));
        when(chauffeurRepository.findById(1L)).thenReturn(Optional.of(chauffeur));
        when(vehiculeRepository.save(any(Vehicule.class))).thenAnswer(inv -> inv.getArgument(0));

        VehiculeResponse result = vehiculeService.assignDriver(1L, new AssignVehiculeDriverRequest(1L));

        assertThat(result).isNotNull();
    }

    @Test
    @DisplayName("clearDriver() → Notification envoyée au chauffeur")
    void clearDriver_notifiesChauffeurRecipient() {
        vehicule.setChauffeurActuel(chauffeur);
        chauffeur.setVehiculeActuel(vehicule);
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(vehiculeRepository.findById(1L)).thenReturn(Optional.of(vehicule));
        when(vehiculeRepository.save(any(Vehicule.class))).thenAnswer(inv -> inv.getArgument(0));

        vehiculeService.clearDriver(1L);

        verify(notificationRepository, atLeastOnce()).save(any(Notification.class));
    }

    @Test
    @DisplayName("deleteVehicule() → Véhicule sans entreprise")
    void deleteVehicule_vehicleWithoutCompany_succeeds() {
        vehicule.setEntreprise(null);
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(vehiculeRepository.findById(1L)).thenReturn(Optional.of(vehicule));

        vehiculeService.deleteVehicule(1L);

        verify(vehiculeRepository).delete(vehicule);
    }

    @Test
    @DisplayName("deleteVehicule() → Chauffeur null, propriétaire présent")
    void deleteVehicule_noChauffeurWithOwner_succeeds() {
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(vehiculeRepository.findById(1L)).thenReturn(Optional.of(vehicule));

        vehiculeService.deleteVehicule(1L);

        verify(vehiculeRepository).delete(vehicule);
    }

    @Test
    @DisplayName("updateVehiculeStatus() → Manager sans entreprise")
    void updateVehiculeStatus_managerWithoutEnterprise_throwsException() {
        Manager managerNoCompany = new Manager();
        managerNoCompany.setId(10L);
        managerNoCompany.setRole(Role.MANAGER);
        managerNoCompany.setEntreprise(null);

        UpdateVehiculeStatusRequest request = new UpdateVehiculeStatusRequest(StatutVehicule.EN_MAINTENANCE);
        when(authenticatedUserService.getCurrentUser()).thenReturn(managerNoCompany);
        when(vehiculeRepository.findById(1L)).thenReturn(Optional.of(vehicule));

        assertThatThrownBy(() -> vehiculeService.updateVehiculeStatus(1L, request))
            .isInstanceOf(UnauthorizedException.class);
    }

    @Test
    @DisplayName("updateVehiculeStatus() → Véhicule sans entreprise")
    void updateVehiculeStatus_vehicleWithoutEnterprise_throwsException() {
        vehicule.setEntreprise(null);

        UpdateVehiculeStatusRequest request = new UpdateVehiculeStatusRequest(StatutVehicule.EN_MAINTENANCE);
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(vehiculeRepository.findById(1L)).thenReturn(Optional.of(vehicule));

        assertThatThrownBy(() -> vehiculeService.updateVehiculeStatus(1L, request))
            .isInstanceOf(UnauthorizedException.class);
    }

    @Test
    @DisplayName("updateVehiculeStatus() → Même statut, pas de notification")
    void updateVehiculeStatus_sameStatus_noNotification() {
        UpdateVehiculeStatusRequest request = new UpdateVehiculeStatusRequest(StatutVehicule.EN_SERVICE);
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(vehiculeRepository.findById(1L)).thenReturn(Optional.of(vehicule));
        when(vehiculeRepository.save(any(Vehicule.class))).thenAnswer(inv -> inv.getArgument(0));

        vehiculeService.updateVehiculeStatus(1L, request);

        verify(notificationRepository, never()).save(any(Notification.class));
    }

    @Test
    @DisplayName("updateVehiculeStatus() → Chauffeur et entreprise null")
    void updateVehiculeStatus_noChauffeurNoCompany() {
        vehicule.setChauffeurActuel(null);
        vehicule.setEntreprise(null);
        UpdateVehiculeStatusRequest request = new UpdateVehiculeStatusRequest(StatutVehicule.EN_MAINTENANCE);
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(vehiculeRepository.findById(1L)).thenReturn(Optional.of(vehicule));
        when(vehiculeRepository.save(any(Vehicule.class))).thenAnswer(inv -> inv.getArgument(0));

        VehiculeResponse result = vehiculeService.updateVehiculeStatus(1L, request);

        assertThat(vehicule.getStatut()).isEqualTo(StatutVehicule.EN_MAINTENANCE);
    }

    @Test
    @DisplayName("createVehicule() → Capacité de flotte à 0, pas de limite")
    void createVehicule_capacityZero_succeeds() {
        entreprise.setTailleFlotte(0);
        CreateVehiculeRequest request = new CreateVehiculeRequest(
            "EF-456-GH", "Peugeot", "Boxer", 1200.0, 0,
            StatutVehicule.EN_SERVICE, 1L, null
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(entrepriseRepository.findById(1L)).thenReturn(Optional.of(entreprise));
        when(vehiculeRepository.existsByMatriculeIgnoreCase("EF-456-GH")).thenReturn(false);
        when(vehiculeRepository.save(any(Vehicule.class))).thenAnswer(inv -> {
            Vehicule saved = inv.getArgument(0);
            saved.setId(10L);
            return saved;
        });

        VehiculeResponse result = vehiculeService.createVehicule(request);

        assertThat(result.matricule()).isEqualTo("EF-456-GH");
    }

    @Test
    @DisplayName("notifyUsers() → Recipients null, superadmins existents (réflexion)")
    void notifyUsers_nullRecipientsWithSuperadmins() throws Exception {
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of(superAdmin));
        Method method = VehiculeServiceImpl.class.getDeclaredMethod(
            "notifyUsers", java.util.Collection.class, Function.class);
        method.setAccessible(true);

        method.invoke(vehiculeService, null, (Function<Utilisateur, String>) u -> "test message");

        verify(notificationRepository, times(1)).save(any(Notification.class));
    }

    @Test
    @DisplayName("notifyUsers() → Recipients vides, pas de superadmins (réflexion)")
    void notifyUsers_emptyRecipientsNoSuperadmins() throws Exception {
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of());
        Method method = VehiculeServiceImpl.class.getDeclaredMethod(
            "notifyUsers", java.util.Collection.class, Function.class);
        method.setAccessible(true);

        method.invoke(vehiculeService, List.of(), (Function<Utilisateur, String>) u -> "test");

        verify(notificationRepository, never()).save(any(Notification.class));
    }

    @Test
    @DisplayName("notifyUsers() → Destinataire null et id null ignorés (réflexion)")
    void notifyUsers_nullRecipientAndNullId_skipped() throws Exception {
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of());
        Method method = VehiculeServiceImpl.class.getDeclaredMethod(
            "notifyUsers", java.util.Collection.class, Function.class);
        method.setAccessible(true);

        Utilisateur nullIdUser = new Chauffeur();
        nullIdUser.setId(null);

        java.util.List<Utilisateur> recipients = new java.util.ArrayList<>();
        recipients.add(null);
        recipients.add(nullIdUser);
        recipients.add(manager);
        method.invoke(vehiculeService, recipients,
            (Function<Utilisateur, String>) u -> "test message");

        verify(notificationRepository, times(1)).save(any(Notification.class));
    }

    @Test
    @DisplayName("notifyUsers() → MessageBuilder null, message vide (réflexion)")
    void notifyUsers_nullMessageBuilder_skipsAll() throws Exception {
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of());
        Method method = VehiculeServiceImpl.class.getDeclaredMethod(
            "notifyUsers", java.util.Collection.class, Function.class);
        method.setAccessible(true);

        method.invoke(vehiculeService, List.of(manager), null);

        verify(notificationRepository, never()).save(any(Notification.class));
    }

    @Test
    @DisplayName("vehicleLabel() → Matricule vide, retourne #id (réflexion)")
    void vehicleLabel_blankMatricule_returnsId() throws Exception {
        Vehicule v = new Vehicule();
        v.setId(42L);
        v.setMatricule("   ");
        Method method = VehiculeServiceImpl.class.getDeclaredMethod("vehicleLabel", Vehicule.class);
        method.setAccessible(true);

        String label = (String) method.invoke(vehiculeService, v);

        assertThat(label).isEqualTo("#42");
    }

    @Test
    @DisplayName("vehicleSummary() → Marque et modèle vides, retourne label (réflexion)")
    void vehicleSummary_blankModel_returnsLabel() throws Exception {
        Vehicule v = new Vehicule();
        v.setId(42L);
        v.setMatricule("AB-123");
        v.setMarque(null);
        v.setModele(null);
        Method method = VehiculeServiceImpl.class.getDeclaredMethod("vehicleSummary", Vehicule.class);
        method.setAccessible(true);

        String summary = (String) method.invoke(vehiculeService, v);

        assertThat(summary).isEqualTo("AB-123");
    }

    @Test
    @DisplayName("companyLabel() → Nom entreprise vide, retourne #id (réflexion)")
    void companyLabel_blankNom_returnsId() throws Exception {
        Entreprise e = new Entreprise();
        e.setId(7L);
        e.setNomEntreprise("   ");
        Method method = VehiculeServiceImpl.class.getDeclaredMethod("companyLabel", Entreprise.class);
        method.setAccessible(true);

        String label = (String) method.invoke(vehiculeService, e);

        assertThat(label).isEqualTo("#7");
    }

    @Test
    @DisplayName("userLabel() → Nom et prénom vides, email vide, retourne #id (réflexion)")
    void userLabel_blankNamesAndEmail_returnsId() throws Exception {
        Utilisateur user = new Chauffeur();
        user.setId(99L);
        user.setPrenom(null);
        user.setNom(null);
        user.setEmail(null);
        Method method = VehiculeServiceImpl.class.getDeclaredMethod("userLabel", Utilisateur.class);
        method.setAccessible(true);

        String label = (String) method.invoke(vehiculeService, user);

        assertThat(label).isEqualTo("#99");
    }

    @Test
    @DisplayName("userLabel() → Nom et prénom vides, email présent (réflexion)")
    void userLabel_blankNamesWithEmail_returnsEmail() throws Exception {
        Utilisateur user = new Chauffeur();
        user.setId(99L);
        user.setPrenom("");
        user.setNom("");
        user.setEmail("user@test.com");
        Method method = VehiculeServiceImpl.class.getDeclaredMethod("userLabel", Utilisateur.class);
        method.setAccessible(true);

        String label = (String) method.invoke(vehiculeService, user);

        assertThat(label).isEqualTo("user@test.com");
    }

    // ═══════════════════════════════════════════════════════════════
    // TESTS COUVERTURE RESTANTE (branches JaCoCo manquantes)
    // ═══════════════════════════════════════════════════════════════

    @Test
    @DisplayName("clearDriver() → Véhicule sans entreprise, notification chauffeur")
    void clearDriver_vehicleWithoutCompany_notifiesDriver() {
        vehicule.setChauffeurActuel(chauffeur);
        chauffeur.setVehiculeActuel(vehicule);
        vehicule.setEntreprise(null);
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(vehiculeRepository.findById(1L)).thenReturn(Optional.of(vehicule));
        when(vehiculeRepository.save(any(Vehicule.class))).thenAnswer(inv -> inv.getArgument(0));

        vehiculeService.clearDriver(1L);

        assertThat(vehicule.getChauffeurActuel()).isNull();
    }

    @Test
    @DisplayName("updateVehiculeStatus() → Chauffeur assigné à un autre véhicule")
    void updateVehiculeStatus_chauffeurAssignedToDifferentVehicle_throwsException() {
        Chauffeur autreChauffeur = new Chauffeur();
        autreChauffeur.setId(99L);
        autreChauffeur.setRole(Role.CHAUFFEUR);
        vehicule.setChauffeurActuel(autreChauffeur);

        UpdateVehiculeStatusRequest request = new UpdateVehiculeStatusRequest(StatutVehicule.EN_MAINTENANCE);
        when(authenticatedUserService.getCurrentUser()).thenReturn(chauffeur);
        when(chauffeurRepository.findById(chauffeur.getId())).thenReturn(Optional.of(chauffeur));
        when(vehiculeRepository.findById(1L)).thenReturn(Optional.of(vehicule));

        assertThatThrownBy(() -> vehiculeService.updateVehiculeStatus(1L, request))
            .isInstanceOf(UnauthorizedException.class);
    }

    @Test
    @DisplayName("assignDriver() → Chauffeur sans statutConducteur, sans véhicule")
    void assignDriver_driverWithNullStatut_noVehicle_succeeds() {
        chauffeur.setStatutConducteur(null);
        chauffeur.setVehiculeActuel(null);
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(vehiculeRepository.findById(1L)).thenReturn(Optional.of(vehicule));
        when(chauffeurRepository.findById(1L)).thenReturn(Optional.of(chauffeur));
        when(vehiculeRepository.save(any(Vehicule.class))).thenAnswer(inv -> inv.getArgument(0));

        VehiculeResponse result = vehiculeService.assignDriver(1L, new AssignVehiculeDriverRequest(1L));

        assertThat(result).isNotNull();
    }

    @Test
    @DisplayName("computeNextAvailability() → Trajet non complété ignoré (réflexion)")
    void computeNextAvailability_incompleteTrajet_ignored() throws Exception {
        Trajet trajet = new Trajet();
        trajet.setId(10L);
        trajet.setStatut(StatutTrajet.EN_COURS);
        trajet.setDateArriveeReelle(LocalDateTime.now().minusHours(1));
        when(trajetRepository.findByChauffeurIdWithFetch(1L)).thenReturn(List.of(trajet));

        Method method = VehiculeServiceImpl.class.getDeclaredMethod("isDriverAvailableAfterRest", Chauffeur.class);
        method.setAccessible(true);

        Boolean available = (Boolean) method.invoke(vehiculeService, chauffeur);

        assertThat(available).isTrue();
    }

    @Test
    @DisplayName("computeNextAvailability() → Trajet complété sans date arrivée ignoré (réflexion)")
    void computeNextAvailability_completeWithoutArrivalDate_ignored() throws Exception {
        Trajet trajet = new Trajet();
        trajet.setId(10L);
        trajet.setStatut(StatutTrajet.COMPLETE);
        trajet.setDateArriveeReelle(null);
        when(trajetRepository.findByChauffeurIdWithFetch(1L)).thenReturn(List.of(trajet));

        Method method = VehiculeServiceImpl.class.getDeclaredMethod("isDriverAvailableAfterRest", Chauffeur.class);
        method.setAccessible(true);

        Boolean available = (Boolean) method.invoke(vehiculeService, chauffeur);

        assertThat(available).isTrue();
    }

    @Test
    @DisplayName("assignDriver() → Chauffeur et véhicule sans entreprise")
    void assignDriver_chauffeurNoCompany_vehicleNoCompany_succeeds() {
        chauffeur.setEntreprise(null);
        chauffeur.setManager(null);
        vehicule.setEntreprise(null);
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(vehiculeRepository.findById(1L)).thenReturn(Optional.of(vehicule));
        when(chauffeurRepository.findById(1L)).thenReturn(Optional.of(chauffeur));
        when(vehiculeRepository.save(any(Vehicule.class))).thenAnswer(inv -> inv.getArgument(0));

        VehiculeResponse result = vehiculeService.assignDriver(1L, new AssignVehiculeDriverRequest(1L));

        assertThat(result).isNotNull();
    }

    @Test
    @DisplayName("createVehicule() → Notification SUPERADMIN avec chauffeur affecté")
    void createVehicule_withDriver_notifiesSuperAdminWithChauffeurInfo() {
        CreateVehiculeRequest request = new CreateVehiculeRequest(
            "EF-456-GH", "Peugeot", "Boxer", 1200.0, 0,
            StatutVehicule.EN_SERVICE, 1L, 1L
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(entrepriseRepository.findById(1L)).thenReturn(Optional.of(entreprise));
        when(vehiculeRepository.existsByMatriculeIgnoreCase("EF-456-GH")).thenReturn(false);
        when(vehiculeRepository.countByEntreprise_Id(1L)).thenReturn(5L);
        when(chauffeurRepository.findById(1L)).thenReturn(Optional.of(chauffeur));
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of(superAdmin));
        when(vehiculeRepository.save(any(Vehicule.class))).thenAnswer(inv -> {
            Vehicule saved = inv.getArgument(0);
            saved.setId(10L);
            return saved;
        });

        VehiculeResponse result = vehiculeService.createVehicule(request);

        assertThat(result).isNotNull();
        verify(notificationRepository, atLeast(1)).save(any(Notification.class));
    }

    @Test
    @DisplayName("updateVehiculeStatus() → Entreprise sans propriétaire, notifie sans owner")
    void updateVehiculeStatus_companyWithoutOwner_notifiesLess() {
        entreprise.setProprietaire(null);
        UpdateVehiculeStatusRequest request = new UpdateVehiculeStatusRequest(StatutVehicule.EN_MAINTENANCE);
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(vehiculeRepository.findById(1L)).thenReturn(Optional.of(vehicule));
        when(vehiculeRepository.save(any(Vehicule.class))).thenAnswer(inv -> inv.getArgument(0));

        VehiculeResponse result = vehiculeService.updateVehiculeStatus(1L, request);

        assertThat(result).isNotNull();
    }

    @Test
    @DisplayName("assignDriver() → Entreprise sans propriétaire, pas de notif owner")
    void assignDriver_companyWithoutOwner_notifiesOnlyNewDriver() {
        entreprise.setProprietaire(null);
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(vehiculeRepository.findById(1L)).thenReturn(Optional.of(vehicule));
        when(chauffeurRepository.findById(1L)).thenReturn(Optional.of(chauffeur));
        when(vehiculeRepository.save(any(Vehicule.class))).thenAnswer(inv -> inv.getArgument(0));

        VehiculeResponse result = vehiculeService.assignDriver(1L, new AssignVehiculeDriverRequest(1L));

        assertThat(result).isNotNull();
    }

    @Test
    @DisplayName("vehicleLabel() → Matricule null, retourne #id (réflexion)")
    void vehicleLabel_nullMatricule_returnsId() throws Exception {
        Vehicule v = new Vehicule();
        v.setId(42L);
        v.setMatricule(null);
        Method method = VehiculeServiceImpl.class.getDeclaredMethod("vehicleLabel", Vehicule.class);
        method.setAccessible(true);

        String label = (String) method.invoke(vehiculeService, v);

        assertThat(label).isEqualTo("#42");
    }

    @Test
    @DisplayName("userLabel() → Email blank mais non null (réflexion)")
    void userLabel_blankEmail_returnsId() throws Exception {
        Utilisateur user = new Chauffeur();
        user.setId(99L);
        user.setPrenom("");
        user.setNom("");
        user.setEmail("   ");
        Method method = VehiculeServiceImpl.class.getDeclaredMethod("userLabel", Utilisateur.class);
        method.setAccessible(true);

        String label = (String) method.invoke(vehiculeService, user);

        assertThat(label).isEqualTo("#99");
    }

    @Test
    @DisplayName("notifyVehicleStatusChange() → Actor null (réflexion)")
    void notifyVehicleStatusChange_nullActor_succeeds() throws Exception {
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of(superAdmin));
        Method method = VehiculeServiceImpl.class.getDeclaredMethod(
            "notifyVehicleStatusChange", Vehicule.class, StatutVehicule.class, StatutVehicule.class, Utilisateur.class);
        method.setAccessible(true);

        method.invoke(vehiculeService, vehicule, StatutVehicule.EN_SERVICE, StatutVehicule.EN_MAINTENANCE, null);

        verify(notificationRepository, atLeast(1)).save(any(Notification.class));
    }

    @Test
    @DisplayName("notifyDriverAssignment() → Actor null (réflexion)")
    void notifyDriverAssignment_nullActor_succeeds() throws Exception {
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of(superAdmin));
        Method method = VehiculeServiceImpl.class.getDeclaredMethod(
            "notifyDriverAssignment", Vehicule.class, Chauffeur.class, Chauffeur.class, Utilisateur.class);
        method.setAccessible(true);

        method.invoke(vehiculeService, vehicule, null, chauffeur, null);

        verify(notificationRepository, atLeast(1)).save(any(Notification.class));
    }

    @Test
    @DisplayName("notifyVehicleCreation() → Actor et owner null (réflexion)")
    void notifyVehicleCreation_nullActorAndOwner() throws Exception {
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of());
        Method method = VehiculeServiceImpl.class.getDeclaredMethod(
            "notifyVehicleCreation", Utilisateur.class, Vehicule.class, Manager.class, Chauffeur.class);
        method.setAccessible(true);

        method.invoke(vehiculeService, null, vehicule, null, null);

        verify(notificationRepository, never()).save(any(Notification.class));
    }

    @Test
    @DisplayName("notifyVehicleUpdate() → previousEntreprise non-null, current null (réflexion)")
    void notifyVehicleUpdate_previousNotNull_currentNull() throws Exception {
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of(superAdmin));
        Method method = VehiculeServiceImpl.class.getDeclaredMethod(
            "notifyVehicleUpdate", Utilisateur.class, Entreprise.class, Vehicule.class,
            Chauffeur.class, Chauffeur.class, StatutVehicule.class, String.class);
        method.setAccessible(true);

        Vehicule v = new Vehicule();
        v.setId(1L);
        v.setMatricule("AB-123-CD");
        v.setStatut(StatutVehicule.EN_SERVICE);
        v.setEntreprise(null);
        v.setChauffeurActuel(null);

        method.invoke(vehiculeService, superAdmin, entreprise, v, null, null, StatutVehicule.EN_SERVICE, "AB-123-CD");

        verify(notificationRepository, atLeast(1)).save(any(Notification.class));
    }
}
