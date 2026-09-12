package com.logiway.services;

import com.logiway.dto.request.CreateUserRequest;
import com.logiway.dto.request.UpdateUserRequest;
import com.logiway.dto.response.ApiMessageResponse;
import com.logiway.dto.response.UserResponse;
import com.logiway.entities.*;
import com.logiway.entities.enums.Role;
import com.logiway.entities.enums.StatutChauffeur;
import com.logiway.entities.enums.StatutCompte;
import com.logiway.exceptions.BadRequestException;
import com.logiway.exceptions.ResourceNotFoundException;
import com.logiway.mappers.UserMapper;
import com.logiway.repositories.*;
import com.logiway.security.AuthenticatedUserService;
import com.logiway.services.impl.UserServiceImpl;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.mockito.Mockito.lenient;

/**
 * Tests unitaires du service User.
 * Valide la gestion des utilisateurs, permissions, et workflow d'activation.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("Service User — Tests Unitaires")
class UserServiceTest {

    @Mock private UtilisateurRepository utilisateurRepository;
    @Mock private ChauffeurRepository chauffeurRepository;
    @Mock private ManagerRepository managerRepository;
    @Mock private EntrepriseRepository entrepriseRepository;
    @Mock private CongeRepository congeRepository;
    @Mock private TrajetRepository trajetRepository;
    @Mock private ResetTokenRepository resetTokenRepository;
    @Mock private RefreshTokenRepository refreshTokenRepository;
    @Mock private NotificationRepository notificationRepository;
    @Mock private AuthenticatedUserService authenticatedUserService;
    @Mock private KeycloakService keycloakService;
    @Mock private MailService mailService;
    @Mock private NotificationRealtimeService notificationRealtimeService;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private UserMapper userMapper;

    @InjectMocks
    private UserServiceImpl userService;

    private Manager superAdmin;
    private Manager manager;
    private Chauffeur chauffeur;

    @BeforeEach
    void setUp() {
        superAdmin = new Manager();
        superAdmin.setId(1L);
        superAdmin.setEmail("superadmin@test.com");
        superAdmin.setPrenom("Super");
        superAdmin.setNom("Admin");
        superAdmin.setRole(Role.SUPERADMIN);
        superAdmin.setEstActif(StatutCompte.ACTIF);
        superAdmin.setDateCreation(java.time.LocalDateTime.now());

        manager = new Manager();
        manager.setId(2L);
        manager.setEmail("manager@test.com");
        manager.setPrenom("Manager");
        manager.setNom("Test");
        manager.setRole(Role.MANAGER);
        manager.setEstActif(StatutCompte.ACTIF);
        manager.setDateCreation(java.time.LocalDateTime.now());

        chauffeur = new Chauffeur();
        chauffeur.setId(3L);
        chauffeur.setEmail("chauffeur@test.com");
        chauffeur.setPrenom("Jean");
        chauffeur.setNom("Dupont");
        chauffeur.setRole(Role.CHAUFFEUR);
        chauffeur.setEstActif(StatutCompte.ACTIF);
        chauffeur.setManager(manager);
        chauffeur.setStatutConducteur(StatutChauffeur.LIBRE);
        chauffeur.setDateCreation(java.time.LocalDateTime.now());
    }

    // ═══════════════════════════════════════════════════════════════
    // TEST 1: SuperAdmin peut créer un manager
    // ═══════════════════════════════════════════════════════════════
    @Test
    @DisplayName("createUser() → SuperAdmin crée un manager avec succès")
    void createUser_superAdminCreatesManager_succeeds() {
        // GIVEN
        CreateUserRequest request = new CreateUserRequest(
            "John", "Doe", "john@test.com", "+33612345678", "France",
            null, Role.MANAGER, true, null
        );

        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(utilisateurRepository.existsByEmailIgnoreCase("john@test.com")).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");
        when(keycloakService.createUserAccount(anyString(), anyString(), anyString(), anyString(), anyString(), anyBoolean()))
            .thenReturn("keycloak-id-123");
        when(utilisateurRepository.save(any(Manager.class))).thenAnswer(inv -> {
            Manager saved = inv.getArgument(0);
            saved.setId(10L);
            return saved;
        });

        UserResponse mockResponse = new UserResponse(
            10L, "keycloak-id-123", "John", "Doe", "john@test.com",
            "+33612345678", "France", null, StatutCompte.ACTIF, true, false,
            null, Role.MANAGER, null, null, null, null, null, null, null, null, null
        );
        when(userMapper.toResponse(any(Manager.class))).thenReturn(mockResponse);

        // WHEN
        UserResponse result = userService.createUser(request);

        // THEN
        assertThat(result).isNotNull();
        assertThat(result.email()).isEqualTo("john@test.com");
        assertThat(result.role()).isEqualTo(Role.MANAGER);
        verify(utilisateurRepository, times(1)).save(any(Manager.class));
        verify(mailService, times(1)).sendActivationEmail(any(), anyString());
    }

    // ═══════════════════════════════════════════════════════════════
    // TEST 2: Manager crée un chauffeur → statut INACTIF par défaut
    // ═══════════════════════════════════════════════════════════════
    @Test
    @DisplayName("createUser() → Manager crée chauffeur avec statut INACTIF")
    void createUser_managerCreatesChauffeur_defaultsToInactive() {
        // GIVEN
        CreateUserRequest request = new CreateUserRequest(
            "Pierre", "Martin", "pierre@test.com", "+33612345679", "France",
            null, Role.CHAUFFEUR, true, null
        );

        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(utilisateurRepository.existsByEmailIgnoreCase("pierre@test.com")).thenReturn(false);
        when(managerRepository.findById(2L)).thenReturn(Optional.of(manager));
        when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");
        when(keycloakService.createUserAccount(anyString(), anyString(), anyString(), anyString(), anyString(), anyBoolean()))
            .thenReturn("keycloak-id-456");
        when(utilisateurRepository.save(any(Chauffeur.class))).thenAnswer(inv -> {
            Chauffeur saved = inv.getArgument(0);
            saved.setId(11L);
            return saved;
        });

        UserResponse mockResponse = new UserResponse(
            11L, "keycloak-id-456", "Pierre", "Martin", "pierre@test.com",
            "+33612345679", "France", null, StatutCompte.INACTIF, false, false,
            null, Role.CHAUFFEUR, StatutChauffeur.LIBRE, 2L, "Manager", "Test",
            null, null, null, null, null
        );
        when(userMapper.toResponse(any(Chauffeur.class))).thenReturn(mockResponse);

        // WHEN
        UserResponse result = userService.createUser(request);

        // THEN
        assertThat(result).isNotNull();
        assertThat(result.estActif()).isEqualTo(StatutCompte.INACTIF);
        assertThat(result.role()).isEqualTo(Role.CHAUFFEUR);
        verify(utilisateurRepository, times(1)).save(any(Chauffeur.class));
    }

    // ═══════════════════════════════════════════════════════════════
    // TEST 3: Email déjà existant lance exception
    // ═══════════════════════════════════════════════════════════════
    @Test
    @DisplayName("createUser() → Email existant lance BadRequestException")
    void createUser_withExistingEmail_throwsException() {
        // GIVEN
        CreateUserRequest request = new CreateUserRequest(
            "Test", "User", "existing@test.com", "+33612345680", "France",
            null, Role.CHAUFFEUR, true, null
        );

        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(utilisateurRepository.existsByEmailIgnoreCase("existing@test.com")).thenReturn(true);

        // THEN
        assertThatThrownBy(() -> userService.createUser(request))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("Email already exists");
    }

    // ═══════════════════════════════════════════════════════════════
    // TEST 4: Manager ne peut pas créer un SuperAdmin
    // ═══════════════════════════════════════════════════════════════
    @Test
    @DisplayName("createUser() → Manager ne peut pas créer SuperAdmin")
    void createUser_managerCannotCreateSuperAdmin_throwsException() {
        // GIVEN
        CreateUserRequest request = new CreateUserRequest(
            "New", "Admin", "newadmin@test.com", "+33612345681", "France",
            null, Role.SUPERADMIN, true, null
        );

        lenient().when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        lenient().when(utilisateurRepository.existsByEmailIgnoreCase("newadmin@test.com")).thenReturn(false);

        // THEN
        assertThatThrownBy(() -> userService.createUser(request))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("not allowed to create");
    }

    // ═══════════════════════════════════════════════════════════════
    // TEST 5: SuperAdmin voit tous les utilisateurs
    // ═══════════════════════════════════════════════════════════════
    @Test
    @DisplayName("getUsers() → SuperAdmin voit tous les utilisateurs")
    void getUsers_asSuperAdmin_returnsAllUsers() {
        // GIVEN
        lenient().when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        lenient().when(utilisateurRepository.findAll()).thenReturn(List.of(superAdmin, manager, chauffeur));
        lenient().when(userMapper.toResponse(any(Utilisateur.class))).thenAnswer(inv -> {
            Utilisateur user = inv.getArgument(0);
            return new UserResponse(
                user.getId(), null, user.getPrenom(), user.getNom(), user.getEmail(),
                null, null, null, user.getEstActif(), null, null, null, user.getRole(),
                null, null, null, null, null, null, null, null, null
            );
        });

        // WHEN
        List<UserResponse> result = userService.getUsers();

        // THEN
        assertThat(result).hasSize(3);
        verify(utilisateurRepository, times(1)).findAll();
    }

    // ═══════════════════════════════════════════════════════════════
    // TEST 6: Manager voit uniquement ses chauffeurs
    // ═══════════════════════════════════════════════════════════════
    @Test
    @DisplayName("getUsers() → Manager voit uniquement ses chauffeurs")
    void getUsers_asManager_returnsOnlyOwnDrivers() {
        // GIVEN
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(chauffeurRepository.findByManagerId(2L)).thenReturn(List.of(chauffeur));
        when(userMapper.toResponse(any(Utilisateur.class))).thenAnswer(inv -> {
            Utilisateur user = inv.getArgument(0);
            return new UserResponse(
                user.getId(), null, user.getPrenom(), user.getNom(), user.getEmail(),
                null, null, null, user.getEstActif(), null, null, null, user.getRole(),
                null, null, null, null, null, null, null, null, null
            );
        });

        // WHEN
        List<UserResponse> result = userService.getUsers();

        // THEN
        assertThat(result).hasSize(1);
        assertThat(result.get(0).role()).isEqualTo(Role.CHAUFFEUR);
        verify(chauffeurRepository, times(1)).findByManagerId(2L);
    }

    // ═══════════════════════════════════════════════════════════════
    // TEST 7: Mise à jour du prénom et nom
    // ═══════════════════════════════════════════════════════════════
    @Test
    @DisplayName("updateUser() → Mise à jour du prénom et nom réussie")
    void updateUser_updatesName_succeeds() {
        // GIVEN
        UpdateUserRequest request = new UpdateUserRequest(
            "Jean-Pierre", "Dupont-Martin", null, null, null, null, null, null, null, null
        );

        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(utilisateurRepository.findById(3L)).thenReturn(Optional.of(chauffeur));
        when(utilisateurRepository.save(any(Chauffeur.class))).thenAnswer(inv -> inv.getArgument(0));

        UserResponse mockResponse = new UserResponse(
            3L, null, "Jean-Pierre", "Dupont-Martin", "chauffeur@test.com",
            null, null, null, StatutCompte.ACTIF, true, null, null, Role.CHAUFFEUR,
            null, null, null, null, null, null, null, null, null
        );
        when(userMapper.toResponse(any(Chauffeur.class))).thenReturn(mockResponse);

        // WHEN
        UserResponse result = userService.updateUser(3L, request);

        // THEN
        assertThat(result).isNotNull();
        assertThat(result.prenom()).isEqualTo("Jean-Pierre");
        assertThat(result.nom()).isEqualTo("Dupont-Martin");
        verify(utilisateurRepository, times(1)).save(chauffeur);
    }

    // ═══════════════════════════════════════════════════════════════
    // TEST 8: Manager ne peut pas modifier un chauffeur d'un autre manager
    // ═══════════════════════════════════════════════════════════════
    @Test
    @DisplayName("updateUser() → Manager ne peut pas modifier chauffeur d'un autre")
    void updateUser_managerCannotUpdateOtherManagersDriver_throwsException() {
        // GIVEN
        Manager otherManager = new Manager();
        otherManager.setId(99L);
        otherManager.setRole(Role.MANAGER);

        UpdateUserRequest request = new UpdateUserRequest(
            "NewName", null, null, null, null, null, null, null, null, null
        );

        when(authenticatedUserService.getCurrentUser()).thenReturn(otherManager);
        when(utilisateurRepository.findById(3L)).thenReturn(Optional.of(chauffeur));

        // THEN
        assertThatThrownBy(() -> userService.updateUser(3L, request))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("not allowed to update");
    }

    // ═══════════════════════════════════════════════════════════════
    // TEST 9: Activation d'un compte INACTIF → envoi email
    // ═══════════════════════════════════════════════════════════════
    @Test
    @DisplayName("updateUser() → Activation envoie email de réactivation")
    void updateUser_activatingAccount_sendsEmail() {
        // GIVEN
        chauffeur.setEstActif(StatutCompte.INACTIF);
        UpdateUserRequest request = new UpdateUserRequest(
            null, null, null, null, null, null, true, null, null, null
        );

        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(utilisateurRepository.findById(3L)).thenReturn(Optional.of(chauffeur));
        when(utilisateurRepository.save(any(Chauffeur.class))).thenAnswer(inv -> inv.getArgument(0));

        UserResponse mockResponse = new UserResponse(
            3L, null, "Jean", "Dupont", "chauffeur@test.com",
            null, null, null, StatutCompte.ACTIF, true, null, null, Role.CHAUFFEUR,
            null, null, null, null, null, null, null, null, null
        );
        when(userMapper.toResponse(any(Chauffeur.class))).thenReturn(mockResponse);

        // WHEN
        UserResponse result = userService.updateUser(3L, request);

        // THEN
        assertThat(result.estActif()).isEqualTo(StatutCompte.ACTIF);
        verify(mailService, times(1)).sendAccountReactivationEmail(chauffeur);
    }

    // ═══════════════════════════════════════════════════════════════
    // TEST 10: Rejet d'un compte avec raison
    // ═══════════════════════════════════════════════════════════════
    @Test
    @DisplayName("updateUser() → Rejet avec raison met statut REJETE")
    void updateUser_rejectingWithReason_setsRejected() {
        // GIVEN
        UpdateUserRequest request = new UpdateUserRequest(
            null, null, null, null, null, null, false, "Documents incomplets", null, null
        );

        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(utilisateurRepository.findById(3L)).thenReturn(Optional.of(chauffeur));
        when(utilisateurRepository.save(any(Chauffeur.class))).thenAnswer(inv -> inv.getArgument(0));

        UserResponse mockResponse = new UserResponse(
            3L, null, "Jean", "Dupont", "chauffeur@test.com",
            null, null, null, StatutCompte.REJETE, false, null, "Documents incomplets", Role.CHAUFFEUR,
            null, null, null, null, null, null, null, null, null
        );
        when(userMapper.toResponse(any(Chauffeur.class))).thenReturn(mockResponse);

        // WHEN
        UserResponse result = userService.updateUser(3L, request);

        // THEN
        assertThat(result.estActif()).isEqualTo(StatutCompte.REJETE);
        assertThat(result.rejectionReason()).isEqualTo("Documents incomplets");
        verify(mailService, times(1)).sendAccountRejectionEmail(chauffeur, "Documents incomplets");
    }

    // ═══════════════════════════════════════════════════════════════
    // TEST 11: SuperAdmin peut supprimer n'importe quel utilisateur
    // ═══════════════════════════════════════════════════════════════
    @Test
    @DisplayName("deleteUser() → SuperAdmin supprime utilisateur")
    void deleteUser_asSuperAdmin_succeeds() {
        // GIVEN
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(utilisateurRepository.findById(3L)).thenReturn(Optional.of(chauffeur));

        // WHEN
        ApiMessageResponse result = userService.deleteUser(3L);

        // THEN
        assertThat(result.message()).contains("deleted");
        verify(utilisateurRepository, times(1)).delete(chauffeur);
        verify(resetTokenRepository, times(1)).deleteByUtilisateur(chauffeur);
        verify(refreshTokenRepository, times(1)).deleteAllByUtilisateur(chauffeur);
    }

    // ═══════════════════════════════════════════════════════════════
    // TEST 12: Manager retire un chauffeur de sa liste
    // ═══════════════════════════════════════════════════════════════
    @Test
    @DisplayName("deleteUser() → Manager retire chauffeur de sa liste")
    void deleteUser_managerRemovesDriver_succeeds() {
        // GIVEN
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(utilisateurRepository.findById(3L)).thenReturn(Optional.of(chauffeur));
        when(utilisateurRepository.save(any(Chauffeur.class))).thenAnswer(inv -> inv.getArgument(0));

        // WHEN
        ApiMessageResponse result = userService.deleteUser(3L);

        // THEN
        assertThat(result.message()).contains("removed from your list");
        assertThat(chauffeur.getManager()).isNull();
        verify(utilisateurRepository, times(1)).save(chauffeur);
        verify(utilisateurRepository, never()).delete(any());
    }

    // ═══════════════════════════════════════════════════════════════
    // TEST 13: Manager ne peut pas supprimer un autre manager
    // ═══════════════════════════════════════════════════════════════
    @Test
    @DisplayName("deleteUser() → Manager ne peut pas supprimer autre manager")
    void deleteUser_managerCannotDeleteOtherManager_throwsException() {
        // GIVEN
        Manager otherManager = new Manager();
        otherManager.setId(99L);
        otherManager.setRole(Role.MANAGER);

        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(utilisateurRepository.findById(99L)).thenReturn(Optional.of(otherManager));

        // THEN
        assertThatThrownBy(() -> userService.deleteUser(99L))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("only remove drivers");
    }

    // ═══════════════════════════════════════════════════════════════
    // TEST 14: Utilisateur inexistant lance exception
    // ═══════════════════════════════════════════════════════════════
    @Test
    @DisplayName("updateUser() → Utilisateur inexistant lance exception")
    void updateUser_whenUserNotFound_throwsException() {
        // GIVEN
        UpdateUserRequest request = new UpdateUserRequest(
            "Test", null, null, null, null, null, null, null, null, null
        );

        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(utilisateurRepository.findById(999L)).thenReturn(Optional.empty());

        // THEN
        assertThatThrownBy(() -> userService.updateUser(999L, request))
            .isInstanceOf(ResourceNotFoundException.class)
            .hasMessageContaining("User not found");
    }

    // ═══════════════════════════════════════════════════════════════
    // TESTS DE COUVERTURE COMPLÉMENTAIRES
    // ═══════════════════════════════════════════════════════════════

    @Test
    @DisplayName("createUser() → ID Keycloak vide → poursuit sans ID")
    void createUser_keycloakIdBlank_continuesWithoutId() {
        CreateUserRequest request = new CreateUserRequest(
            "John", "Doe", "john@test.com", null, "France", null, Role.MANAGER, true, null
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(utilisateurRepository.existsByEmailIgnoreCase("john@test.com")).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");
        when(keycloakService.createUserAccount(anyString(), anyString(), anyString(), anyString(), anyString(), anyBoolean()))
            .thenReturn("");
        when(utilisateurRepository.save(any(Manager.class))).thenAnswer(inv -> {
            Manager saved = inv.getArgument(0);
            saved.setId(10L);
            return saved;
        });
        when(userMapper.toResponse(any(Manager.class))).thenAnswer(inv -> {
            Manager m = inv.getArgument(0);
            return new UserResponse(
                m.getId(), m.getKeycloakId(), m.getPrenom(), m.getNom(), m.getEmail(),
                null, null, null, m.getEstActif(), null, null, null, m.getRole(),
                null, null, null, null, null, null, null, null, null
            );
        });

        UserResponse result = userService.createUser(request);

        assertThat(result.keycloakId()).isNull();
    }

    @Test
    @DisplayName("createUser() → Échec email SMTP absorbé")
    void createUser_mailFailure_isAbsorbed() {
        CreateUserRequest request = new CreateUserRequest(
            "John", "Doe", "john@test.com", null, "France", null, Role.MANAGER, true, null
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(utilisateurRepository.existsByEmailIgnoreCase("john@test.com")).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");
        when(keycloakService.createUserAccount(anyString(), anyString(), anyString(), anyString(), anyString(), anyBoolean()))
            .thenReturn("keycloak-id");
        when(utilisateurRepository.save(any(Manager.class))).thenAnswer(inv -> {
            Manager saved = inv.getArgument(0);
            saved.setId(10L);
            return saved;
        });
        doThrow(new RuntimeException("smtp down")).when(mailService).sendActivationEmail(any(), anyString());
        when(userMapper.toResponse(any(Manager.class))).thenAnswer(inv -> {
            Manager m = inv.getArgument(0);
            return new UserResponse(
                m.getId(), m.getKeycloakId(), m.getPrenom(), m.getNom(), m.getEmail(),
                null, null, null, m.getEstActif(), null, null, null, m.getRole(),
                null, null, null, null, null, null, null, null, null
            );
        });

        UserResponse result = userService.createUser(request);

        assertThat(result).isNotNull();
    }

    @Test
    @DisplayName("createUser() → Échec notification affectation absorbé")
    void createUser_affectationNotificationFailure_isAbsorbed() {
        CreateUserRequest request = new CreateUserRequest(
            "Pierre", "Martin", "pierre@test.com", null, "France", null, Role.CHAUFFEUR, true, null
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(utilisateurRepository.existsByEmailIgnoreCase("pierre@test.com")).thenReturn(false);
        when(managerRepository.findById(2L)).thenReturn(Optional.of(manager));
        when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");
        when(keycloakService.createUserAccount(anyString(), anyString(), anyString(), anyString(), anyString(), anyBoolean()))
            .thenReturn("keycloak-id");
        when(utilisateurRepository.save(any(Chauffeur.class))).thenAnswer(inv -> {
            Chauffeur saved = inv.getArgument(0);
            saved.setId(11L);
            return saved;
        });
        doThrow(new RuntimeException("notif down")).when(notificationRepository).save(any(Notification.class));
        when(userMapper.toResponse(any(Chauffeur.class))).thenAnswer(inv ->
            new UserResponse(11L, null, null, null, null, null, null, null, null, null, null, null,
                Role.CHAUFFEUR, null, null, null, null, null, null, null, null, null));

        UserResponse result = userService.createUser(request);

        assertThat(result).isNotNull();
    }

    @Test
    @DisplayName("getUsers() → Autre rôle → BadRequest")
    void getUsers_otherRole_throwsBadRequest() {
        when(authenticatedUserService.getCurrentUser()).thenReturn(chauffeur);

        assertThatThrownBy(() -> userService.getUsers())
            .isInstanceOf(BadRequestException.class);
    }

    @Test
    @DisplayName("updateUser() → Changement email réussi")
    void updateUser_changesEmail_succeeds() {
        UpdateUserRequest request = new UpdateUserRequest(
            null, null, "new@test.com", null, null, null, null, null, null, null
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(utilisateurRepository.findById(3L)).thenReturn(Optional.of(chauffeur));
        when(utilisateurRepository.existsByEmailIgnoreCase("new@test.com")).thenReturn(false);
        when(utilisateurRepository.save(any(Chauffeur.class))).thenAnswer(inv -> inv.getArgument(0));
        when(userMapper.toResponse(any(Chauffeur.class))).thenAnswer(inv ->
            new UserResponse(3L, null, null, null, "new@test.com", null, null, null, null, null, null, null,
                Role.CHAUFFEUR, null, null, null, null, null, null, null, null, null));

        UserResponse result = userService.updateUser(3L, request);

        assertThat(result.email()).isEqualTo("new@test.com");
        assertThat(chauffeur.getEmail()).isEqualTo("new@test.com");
    }

    @Test
    @DisplayName("updateUser() → Email dupliqué → BadRequest")
    void updateUser_duplicateEmail_throws() {
        UpdateUserRequest request = new UpdateUserRequest(
            null, null, "dup@test.com", null, null, null, null, null, null, null
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(utilisateurRepository.findById(3L)).thenReturn(Optional.of(chauffeur));
        when(utilisateurRepository.existsByEmailIgnoreCase("dup@test.com")).thenReturn(true);

        assertThatThrownBy(() -> userService.updateUser(3L, request))
            .isInstanceOf(BadRequestException.class);
    }

    @Test
    @DisplayName("updateUser() → Changement de rôle")
    void updateUser_changesRole_succeeds() {
        UpdateUserRequest request = new UpdateUserRequest(
            null, null, null, null, null, null, null, null, Role.MANAGER, null
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(utilisateurRepository.findById(3L)).thenReturn(Optional.of(chauffeur));
        when(utilisateurRepository.save(any(Chauffeur.class))).thenAnswer(inv -> inv.getArgument(0));

        userService.updateUser(3L, request);

        assertThat(chauffeur.getRole()).isEqualTo(Role.MANAGER);
    }

    @Test
    @DisplayName("updateUser() → Réaffectation chauffeur avec notifications")
    void updateUser_reassignManager_sendsNotifications() {
        manager.setPrenom(null);
        manager.setNom(null);
        manager.setEmail(null);
        Manager newManager = new Manager();
        newManager.setId(3L);
        newManager.setPrenom("Nouveau");
        newManager.setNom("Chef");
        newManager.setEmail("nouveau@test.com");
        newManager.setRole(Role.MANAGER);

        UpdateUserRequest request = new UpdateUserRequest(
            null, null, null, null, null, null, null, null, null, 3L
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(utilisateurRepository.findById(3L)).thenReturn(Optional.of(chauffeur));
        when(managerRepository.findById(3L)).thenReturn(Optional.of(newManager));
        when(utilisateurRepository.save(any(Chauffeur.class))).thenAnswer(inv -> inv.getArgument(0));
        when(userMapper.toResponse(any(Chauffeur.class))).thenAnswer(inv ->
            new UserResponse(3L, null, null, null, null, null, null, null, null, null, null, null,
                Role.CHAUFFEUR, null, null, null, null, null, null, null, null, null));

        UserResponse result = userService.updateUser(3L, request);

        assertThat(chauffeur.getManager()).isEqualTo(newManager);
        verify(notificationRepository, atLeast(3)).save(any(Notification.class));
    }

    @Test
    @DisplayName("updateUser() → Échec notification réaffectation absorbé")
    void updateUser_reassignNotificationFailure_isAbsorbed() {
        Manager newManager = new Manager();
        newManager.setId(3L);
        newManager.setPrenom("Nouveau");
        newManager.setNom("Chef");
        newManager.setEmail("nouveau@test.com");
        newManager.setRole(Role.MANAGER);

        UpdateUserRequest request = new UpdateUserRequest(
            null, null, null, null, null, null, null, null, null, 3L
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(utilisateurRepository.findById(3L)).thenReturn(Optional.of(chauffeur));
        when(managerRepository.findById(3L)).thenReturn(Optional.of(newManager));
        when(utilisateurRepository.save(any(Chauffeur.class))).thenAnswer(inv -> inv.getArgument(0));
        doThrow(new RuntimeException("notif down")).when(notificationRepository).save(any(Notification.class));
        when(userMapper.toResponse(any(Chauffeur.class))).thenAnswer(inv ->
            new UserResponse(3L, null, null, null, null, null, null, null, null, null, null, null,
                Role.CHAUFFEUR, null, null, null, null, null, null, null, null, null));

        UserResponse result = userService.updateUser(3L, request);

        assertThat(chauffeur.getManager()).isEqualTo(newManager);
    }

    @Test
    @DisplayName("updateUser() → Désactivation sans raison → INACTIF")
    void updateUser_deactivateWithoutReason_setsInactive() {
        UpdateUserRequest request = new UpdateUserRequest(
            null, null, null, null, null, null, false, null, null, null
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(utilisateurRepository.findById(3L)).thenReturn(Optional.of(chauffeur));
        when(utilisateurRepository.save(any(Chauffeur.class))).thenAnswer(inv -> inv.getArgument(0));

        userService.updateUser(3L, request);

        assertThat(chauffeur.getEstActif()).isEqualTo(StatutCompte.INACTIF);
        assertThat(chauffeur.getRejectionReason()).isNull();
    }

    @Test
    @DisplayName("updateUser() → Réactivation avec échec email + notification absorbés")
    void updateUser_reactivationFailures_areAbsorbed() {
        chauffeur.setEstActif(StatutCompte.INACTIF);
        UpdateUserRequest request = new UpdateUserRequest(
            null, null, null, null, null, null, true, null, null, null
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(utilisateurRepository.findById(3L)).thenReturn(Optional.of(chauffeur));
        when(utilisateurRepository.save(any(Chauffeur.class))).thenAnswer(inv -> inv.getArgument(0));
        doThrow(new RuntimeException("smtp down")).when(mailService).sendAccountReactivationEmail(any());
        doThrow(new RuntimeException("notif down")).when(notificationRepository).save(any(Notification.class));

        UserResponse result = userService.updateUser(3L, request);

        assertThat(chauffeur.getEstActif()).isEqualTo(StatutCompte.ACTIF);
        assertThat(result).isNull();
    }

    @Test
    @DisplayName("updateUser() → Rejet avec échecs email + notification absorbés")
    void updateUser_rejectionFailures_areAbsorbed() {
        UpdateUserRequest request = new UpdateUserRequest(
            null, null, null, null, null, null, false, "Documents incomplets", null, null
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(utilisateurRepository.findById(3L)).thenReturn(Optional.of(chauffeur));
        when(utilisateurRepository.save(any(Chauffeur.class))).thenAnswer(inv -> inv.getArgument(0));
        doThrow(new RuntimeException("smtp down")).when(mailService).sendAccountRejectionEmail(any(), anyString());
        doThrow(new RuntimeException("notif down")).when(notificationRepository).save(any(Notification.class));

        UserResponse result = userService.updateUser(3L, request);

        assertThat(chauffeur.getEstActif()).isEqualTo(StatutCompte.REJETE);
        assertThat(result).isNull();
    }

    @Test
    @DisplayName("updateUser() → Désactivation avec échecs email + notification absorbés")
    void updateUser_deactivationFailures_areAbsorbed() {
        UpdateUserRequest request = new UpdateUserRequest(
            null, null, null, null, null, null, false, null, null, null
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(utilisateurRepository.findById(3L)).thenReturn(Optional.of(chauffeur));
        when(utilisateurRepository.save(any(Chauffeur.class))).thenAnswer(inv -> inv.getArgument(0));
        doThrow(new RuntimeException("smtp down")).when(mailService).sendAccountDeactivationEmail(any());
        doThrow(new RuntimeException("notif down")).when(notificationRepository).save(any(Notification.class));

        UserResponse result = userService.updateUser(3L, request);

        assertThat(chauffeur.getEstActif()).isEqualTo(StatutCompte.INACTIF);
        assertThat(result).isNull();
    }

    @Test
    @DisplayName("updateUser() → Manager modifie son propre chauffeur")
    void updateUser_byManagerOwnDriver_succeeds() {
        UpdateUserRequest request = new UpdateUserRequest(
            "Jean-Baptiste", null, null, null, null, null, null, null, null, null
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(utilisateurRepository.findById(3L)).thenReturn(Optional.of(chauffeur));
        when(utilisateurRepository.save(any(Chauffeur.class))).thenAnswer(inv -> inv.getArgument(0));

        userService.updateUser(3L, request);

        assertThat(chauffeur.getPrenom()).isEqualTo("Jean-Baptiste");
    }

    @Test
    @DisplayName("deleteUser() → Manager ne peut retirer que ses propres chauffeurs")
    void deleteUser_managerCannotRemoveOtherManagersDriver_throws() {
        Manager otherManager = new Manager();
        otherManager.setId(99L);
        otherManager.setRole(Role.MANAGER);
        chauffeur.setManager(otherManager);

        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(utilisateurRepository.findById(3L)).thenReturn(Optional.of(chauffeur));

        assertThatThrownBy(() -> userService.deleteUser(3L))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("only remove drivers");
    }

    @Test
    @DisplayName("deleteUser() → Chauffeur ne peut pas supprimer")
    void deleteUser_byChauffeur_throws() {
        when(authenticatedUserService.getCurrentUser()).thenReturn(chauffeur);
        when(utilisateurRepository.findById(2L)).thenReturn(Optional.of(manager));

        assertThatThrownBy(() -> userService.deleteUser(2L))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("Only superadmin can delete users");
    }

    @Test
    @DisplayName("deleteUser() → Auto-suppression interdite")
    void deleteUser_selfDeletion_throws() {
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(utilisateurRepository.findById(1L)).thenReturn(Optional.of(superAdmin));

        assertThatThrownBy(() -> userService.deleteUser(1L))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("cannot delete your own account");
    }

    @Test
    @DisplayName("deleteUser() → Échec notification suppression absorbé")
    void deleteUser_driverDeletionNotificationFailure_isAbsorbed() {
        chauffeur.setPrenom(null);
        chauffeur.setNom(null);
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(utilisateurRepository.findById(3L)).thenReturn(Optional.of(chauffeur));
        doThrow(new RuntimeException("notif down")).when(notificationRepository).save(any(Notification.class));

        ApiMessageResponse result = userService.deleteUser(3L);

        assertThat(result.message()).contains("deleted");
        verify(utilisateurRepository, times(1)).delete(chauffeur);
    }

    @Test
    @DisplayName("deleteUser() → Suppression manager nettoie dépendances")
    void deleteUser_deletesManager_cleansDependencies() {
        Manager targetManager = new Manager();
        targetManager.setId(5L);
        targetManager.setRole(Role.MANAGER);
        targetManager.setEmail("target@test.com");

        Chauffeur subDriver = new Chauffeur();
        subDriver.setId(7L);
        subDriver.setManager(targetManager);

        Conge conge = new Conge();
        conge.setId(1L);
        conge.setManager(targetManager);

        Trajet trajet = new Trajet();
        trajet.setId(1L);
        trajet.setManager(targetManager);

        Entreprise ownedCompany = new Entreprise();
        ownedCompany.setId(20L);
        ownedCompany.setNomEntreprise("Flotte");
        ownedCompany.setProprietaire(targetManager);

        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(utilisateurRepository.findById(5L)).thenReturn(Optional.of(targetManager));
        when(chauffeurRepository.findByManagerId(5L)).thenReturn(List.of(subDriver));
        when(utilisateurRepository.save(any(Chauffeur.class))).thenAnswer(inv -> inv.getArgument(0));
        when(congeRepository.findByManager_IdOrderByDateDebutDesc(5L)).thenReturn(List.of(conge));
        when(trajetRepository.findByManagerId(5L)).thenReturn(List.of(trajet));
        when(entrepriseRepository.findByProprietaire_Id(5L)).thenReturn(Optional.of(ownedCompany));
        when(entrepriseRepository.save(any(Entreprise.class))).thenAnswer(inv -> inv.getArgument(0));

        ApiMessageResponse result = userService.deleteUser(5L);

        assertThat(result.message()).contains("deleted");
        assertThat(subDriver.getManager()).isNull();
        assertThat(conge.getManager()).isNull();
        assertThat(trajet.getManager()).isNull();
        assertThat(ownedCompany.getProprietaire()).isNull();
        verify(congeRepository, times(1)).flush();
        verify(trajetRepository, times(1)).flush();
    }

    @Test
    @DisplayName("createUser() → SuperAdmin crée un SuperAdmin")
    void createUser_superAdminCreatesSuperAdmin_succeeds() {
        CreateUserRequest request = new CreateUserRequest(
            "Root", "Admin", "root@test.com", null, "France", null, Role.SUPERADMIN, true, null
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(utilisateurRepository.existsByEmailIgnoreCase("root@test.com")).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");
        when(keycloakService.createUserAccount(anyString(), anyString(), anyString(), anyString(), anyString(), anyBoolean()))
            .thenReturn("keycloak-root");
        when(utilisateurRepository.save(any(SuperAdministrateur.class))).thenAnswer(inv -> {
            SuperAdministrateur saved = inv.getArgument(0);
            saved.setId(20L);
            return saved;
        });
        when(userMapper.toResponse(any(SuperAdministrateur.class))).thenAnswer(inv -> {
            SuperAdministrateur u = inv.getArgument(0);
            return new UserResponse(
                u.getId(), u.getKeycloakId(), u.getPrenom(), u.getNom(), u.getEmail(),
                null, null, null, u.getEstActif(), null, null, null, u.getRole(),
                null, null, null, null, null, null, null, null, null
            );
        });

        UserResponse result = userService.createUser(request);

        assertThat(result).isNotNull();
        assertThat(result.role()).isEqualTo(Role.SUPERADMIN);
        verify(utilisateurRepository, times(1)).save(any(SuperAdministrateur.class));
    }

    @Test
    @DisplayName("createUser() → Chauffeur superadmin sans managerId → BadRequest")
    void createUser_superAdminChauffeurWithoutManagerId_throws() {
        CreateUserRequest request = new CreateUserRequest(
            "Solo", "Driver", "solo@test.com", null, "France", null, Role.CHAUFFEUR, true, null
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(utilisateurRepository.existsByEmailIgnoreCase("solo@test.com")).thenReturn(false);

        assertThatThrownBy(() -> userService.createUser(request))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("managerId is required");
    }

    @Test
    @DisplayName("createUser() → Manager introuvable pour chauffeur → NotFound")
    void createUser_superAdminChauffeurManagerNotFound_throws() {
        CreateUserRequest request = new CreateUserRequest(
            "Solo", "Driver", "solo@test.com", null, "France", null, Role.CHAUFFEUR, true, 999L
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(utilisateurRepository.existsByEmailIgnoreCase("solo@test.com")).thenReturn(false);
        when(managerRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.createUser(request))
            .isInstanceOf(ResourceNotFoundException.class)
            .hasMessageContaining("Manager not found");
    }

    @Test
    @DisplayName("createUser() → Noms vides → fallback email / #id")
    void createUser_blankNames_usesFallbacks() {
        CreateUserRequest request = new CreateUserRequest(
            null, null, null, null, "France", null, Role.CHAUFFEUR, true, null
        );
        manager.setPrenom(null);
        manager.setNom(null);
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(utilisateurRepository.existsByEmailIgnoreCase(null)).thenReturn(false);
        when(managerRepository.findById(2L)).thenReturn(Optional.of(manager));
        when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");
        when(utilisateurRepository.save(any(Chauffeur.class))).thenAnswer(inv -> {
            Chauffeur saved = inv.getArgument(0);
            saved.setId(11L);
            return saved;
        });
        when(userMapper.toResponse(any(Chauffeur.class))).thenAnswer(inv ->
            new UserResponse(11L, null, null, null, null, null, null, null, null, null, null, null,
                Role.CHAUFFEUR, null, null, null, null, null, null, null, null, null));

        UserResponse result = userService.createUser(request);

        assertThat(result).isNotNull();
        verify(notificationRepository, atLeast(2)).save(any(Notification.class));
    }

    @Test
    @DisplayName("updateUser() → Désactivation sans raison → statut INACTIF")
    void updateUser_deactivatingWithoutReason_setsInactive() {
        UpdateUserRequest request = new UpdateUserRequest(
            null, null, null, null, null, null, false, null, null, null
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(utilisateurRepository.findById(3L)).thenReturn(Optional.of(chauffeur));
        when(utilisateurRepository.save(any(Chauffeur.class))).thenAnswer(inv -> inv.getArgument(0));
        when(userMapper.toResponse(any(Chauffeur.class))).thenAnswer(inv ->
            new UserResponse(3L, null, null, null, null, null, null, null, StatutCompte.INACTIF, false, null, null,
                Role.CHAUFFEUR, null, null, null, null, null, null, null, null, null));

        UserResponse result = userService.updateUser(3L, request);

        assertThat(result.estActif()).isEqualTo(StatutCompte.INACTIF);
        assertThat(chauffeur.getEstActif()).isEqualTo(StatutCompte.INACTIF);
        assertThat(chauffeur.getRejectionReason()).isNull();
        verify(mailService).sendAccountDeactivationEmail(chauffeur);
    }

    @Test
    @DisplayName("updateUser() → Réactivation depuis REJETE → email envoyé")
    void updateUser_reactivatingFromRejected_sendsEmail() {
        chauffeur.setEstActif(StatutCompte.REJETE);
        chauffeur.setRejectionReason("Test rejection");
        UpdateUserRequest request = new UpdateUserRequest(
            null, null, null, null, null, null, true, null, null, null
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(utilisateurRepository.findById(3L)).thenReturn(Optional.of(chauffeur));
        when(utilisateurRepository.save(any(Chauffeur.class))).thenAnswer(inv -> inv.getArgument(0));
        when(userMapper.toResponse(any(Chauffeur.class))).thenAnswer(inv ->
            new UserResponse(3L, null, null, null, null, null, null, null, StatutCompte.ACTIF, true, null, null,
                Role.CHAUFFEUR, null, null, null, null, null, null, null, null, null));

        userService.updateUser(3L, request);

        assertThat(chauffeur.getEstActif()).isEqualTo(StatutCompte.ACTIF);
        assertThat(chauffeur.getRejectionReason()).isNull();
        verify(mailService).sendAccountReactivationEmail(chauffeur);
    }

    @Test
    @DisplayName("updateUser() → Échec email réactivation → absorbé")
    void updateUser_reactivationEmailFailure_isAbsorbed() {
        chauffeur.setEstActif(StatutCompte.INACTIF);
        UpdateUserRequest request = new UpdateUserRequest(
            null, null, null, null, null, null, true, null, null, null
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(utilisateurRepository.findById(3L)).thenReturn(Optional.of(chauffeur));
        when(utilisateurRepository.save(any(Chauffeur.class))).thenAnswer(inv -> inv.getArgument(0));
        doThrow(new RuntimeException("smtp down")).when(mailService).sendAccountReactivationEmail(any());
        when(userMapper.toResponse(any(Chauffeur.class))).thenAnswer(inv ->
            new UserResponse(3L, null, null, null, null, null, null, null, StatutCompte.ACTIF, true, null, null,
                Role.CHAUFFEUR, null, null, null, null, null, null, null, null, null));

        UserResponse result = userService.updateUser(3L, request);

        assertThat(result.estActif()).isEqualTo(StatutCompte.ACTIF);
    }

    @Test
    @DisplayName("updateUser() → Échec notification réactivation → absorbé")
    void updateUser_reactivationNotificationFailure_isAbsorbed() {
        chauffeur.setEstActif(StatutCompte.INACTIF);
        UpdateUserRequest request = new UpdateUserRequest(
            null, null, null, null, null, null, true, null, null, null
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(utilisateurRepository.findById(3L)).thenReturn(Optional.of(chauffeur));
        when(utilisateurRepository.save(any(Chauffeur.class))).thenAnswer(inv -> inv.getArgument(0));
        doThrow(new RuntimeException("notif down")).when(notificationRepository).save(any(Notification.class));
        when(userMapper.toResponse(any(Chauffeur.class))).thenAnswer(inv ->
            new UserResponse(3L, null, null, null, null, null, null, null, StatutCompte.ACTIF, true, null, null,
                Role.CHAUFFEUR, null, null, null, null, null, null, null, null, null));

        UserResponse result = userService.updateUser(3L, request);

        assertThat(result.estActif()).isEqualTo(StatutCompte.ACTIF);
    }

    @Test
    @DisplayName("updateUser() → Échec email rejet → absorbé")
    void updateUser_rejectionEmailFailure_isAbsorbed() {
        UpdateUserRequest request = new UpdateUserRequest(
            null, null, null, null, null, null, false, "Raison", null, null
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(utilisateurRepository.findById(3L)).thenReturn(Optional.of(chauffeur));
        when(utilisateurRepository.save(any(Chauffeur.class))).thenAnswer(inv -> inv.getArgument(0));
        doThrow(new RuntimeException("smtp down")).when(mailService).sendAccountRejectionEmail(any(), anyString());
        when(userMapper.toResponse(any(Chauffeur.class))).thenAnswer(inv ->
            new UserResponse(3L, null, null, null, null, null, null, null, StatutCompte.REJETE, false, null, "Raison",
                Role.CHAUFFEUR, null, null, null, null, null, null, null, null, null));

        UserResponse result = userService.updateUser(3L, request);

        assertThat(result.estActif()).isEqualTo(StatutCompte.REJETE);
    }

    @Test
    @DisplayName("updateUser() → Échec email désactivation → absorbé")
    void updateUser_deactivationEmailFailure_isAbsorbed() {
        UpdateUserRequest request = new UpdateUserRequest(
            null, null, null, null, null, null, false, null, null, null
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(utilisateurRepository.findById(3L)).thenReturn(Optional.of(chauffeur));
        when(utilisateurRepository.save(any(Chauffeur.class))).thenAnswer(inv -> inv.getArgument(0));
        doThrow(new RuntimeException("smtp down")).when(mailService).sendAccountDeactivationEmail(any());
        when(userMapper.toResponse(any(Chauffeur.class))).thenAnswer(inv ->
            new UserResponse(3L, null, null, null, null, null, null, null, StatutCompte.INACTIF, false, null, null,
                Role.CHAUFFEUR, null, null, null, null, null, null, null, null, null));

        UserResponse result = userService.updateUser(3L, request);

        assertThat(result.estActif()).isEqualTo(StatutCompte.INACTIF);
    }

    @Test
    @DisplayName("deleteUser() → SuperAdmin se supprime lui-même → exception")
    void deleteUser_superAdminDeletesSelf_throws() {
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(utilisateurRepository.findById(1L)).thenReturn(Optional.of(superAdmin));

        assertThatThrownBy(() -> userService.deleteUser(1L))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("cannot delete your own account");
    }

    @Test
    @DisplayName("deleteUser() → Manager non assigné → exception")
    void deleteUser_managerRemovesUnassignedDriver_throws() {
        Chauffeur unassigned = new Chauffeur();
        unassigned.setId(99L);
        unassigned.setRole(Role.CHAUFFEUR);
        unassigned.setManager(null);
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(utilisateurRepository.findById(99L)).thenReturn(Optional.of(unassigned));

        assertThatThrownBy(() -> userService.deleteUser(99L))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("can only remove drivers assigned to you");
    }

    @Test
    @DisplayName("deleteUser() → Manager avec entreprise, nettoyage entreprise")
    void deleteUser_deletingManagerWithEnterprise_clearsEntreprise() {
        Manager managerToDelete = new Manager();
        managerToDelete.setId(99L);
        managerToDelete.setRole(Role.MANAGER);
        Entreprise e = new Entreprise();
        e.setId(50L);
        e.setProprietaire(managerToDelete);
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(utilisateurRepository.findById(99L)).thenReturn(Optional.of(managerToDelete));
        when(entrepriseRepository.findByProprietaire_Id(99L)).thenReturn(Optional.of(e));

        userService.deleteUser(99L);

        assertThat(e.getProprietaire()).isNull();
        verify(entrepriseRepository).save(e);
        verify(utilisateurRepository).delete(managerToDelete);
    }

    @Test
    @DisplayName("deleteUser() → Chauffeur avec notifications suppression manager")
    void deleteUser_deletingDriverWithManager_notifiesManager() {
        chauffeur.setManager(manager);
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(utilisateurRepository.findById(3L)).thenReturn(Optional.of(chauffeur));

        userService.deleteUser(3L);

        verify(notificationRepository, atLeastOnce()).save(any(Notification.class));
        verify(utilisateurRepository).delete(chauffeur);
    }

    @Test
    @DisplayName("deleteUser() → Échec notification suppression → absorbé")
    void deleteUser_deletionNotificationFailure_isAbsorbed() {
        chauffeur.setManager(manager);
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(utilisateurRepository.findById(3L)).thenReturn(Optional.of(chauffeur));
        doThrow(new RuntimeException("notif down")).when(notificationRepository).save(any(Notification.class));

        assertThatCode(() -> userService.deleteUser(3L)).doesNotThrowAnyException();

        verify(utilisateurRepository).delete(chauffeur);
    }

    @Test
    @DisplayName("createUser() → Manager crée chauffeur sans managerId → utilise lui-même")
    void createUser_managerCreatesDriverWithoutManagerId_usesSelf() {
        CreateUserRequest request = new CreateUserRequest(
            "Pierre", "Martin", "pierre@test.com", null, "France", null, Role.CHAUFFEUR, true, null
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(utilisateurRepository.existsByEmailIgnoreCase("pierre@test.com")).thenReturn(false);
        when(managerRepository.findById(2L)).thenReturn(Optional.of(manager));
        when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");
        when(keycloakService.createUserAccount(anyString(), anyString(), anyString(), anyString(), anyString(), anyBoolean()))
            .thenReturn("keycloak-id");
        when(utilisateurRepository.save(any(Chauffeur.class))).thenAnswer(inv -> {
            Chauffeur saved = inv.getArgument(0);
            saved.setId(11L);
            return saved;
        });
        when(userMapper.toResponse(any(Chauffeur.class))).thenAnswer(inv ->
            new UserResponse(11L, null, null, null, null, null, null, null, null, null, null, null,
                Role.CHAUFFEUR, null, 2L, null, null, null, null, null, null, null));

        UserResponse result = userService.createUser(request);

        assertThat(result.managerId()).isEqualTo(2L);
    }

    @Test
    @DisplayName("createUser() → SuperAdmin crée chauffeur sans managerId → exception")
    void createUser_superAdminCreatesDriverWithoutManagerId_throws() {
        CreateUserRequest request = new CreateUserRequest(
            "Pierre", "Martin", "pierre@test.com", null, "France", null, Role.CHAUFFEUR, true, null
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(utilisateurRepository.existsByEmailIgnoreCase("pierre@test.com")).thenReturn(false);

        assertThatThrownBy(() -> userService.createUser(request))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("managerId is required");
    }

    @Test
    @DisplayName("createUser() → SuperAdmin crée chauffeur avec managerId invalide → exception")
    void createUser_superAdminCreatesDriverWithInvalidManagerId_throws() {
        CreateUserRequest request = new CreateUserRequest(
            "Pierre", "Martin", "pierre@test.com", null, "France", null, Role.CHAUFFEUR, true, 999L
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(utilisateurRepository.existsByEmailIgnoreCase("pierre@test.com")).thenReturn(false);
        when(managerRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.createUser(request))
            .isInstanceOf(ResourceNotFoundException.class)
            .hasMessageContaining("Manager not found");
    }

    @Test
    @DisplayName("createUser() → Manager non trouvé pour créateur Manager → exception")
    void createUser_managerCreatorProfileNotFound_throws() {
        CreateUserRequest request = new CreateUserRequest(
            "Pierre", "Martin", "pierre@test.com", null, "France", null, Role.CHAUFFEUR, true, null
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(utilisateurRepository.existsByEmailIgnoreCase("pierre@test.com")).thenReturn(false);
        when(managerRepository.findById(2L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.createUser(request))
            .isInstanceOf(ResourceNotFoundException.class)
            .hasMessageContaining("Manager profile not found");
    }

    @Test
    @DisplayName("createUser() → Rôle non supporté → exception")
    void createUser_unsupportedRole_throws() {
        CreateUserRequest request = new CreateUserRequest(
            "Test", "User", "test@test.com", null, "France", null, null, true, null
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);

        assertThatThrownBy(() -> userService.createUser(request))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("You are not allowed to create this user role");
    }

    @Test
    @DisplayName("updateUser() → Manager autorisé via chauffeur.manager → OK")
    void updateUser_managerAuthorizedViaChauffeurManager_succeeds() {
        UpdateUserRequest request = new UpdateUserRequest(
            "Updated", null, null, null, null, null, null, null, null, null
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(utilisateurRepository.findById(3L)).thenReturn(Optional.of(chauffeur));
        when(utilisateurRepository.save(any(Chauffeur.class))).thenAnswer(inv -> inv.getArgument(0));
        when(userMapper.toResponse(any(Chauffeur.class))).thenAnswer(inv ->
            new UserResponse(3L, null, "Updated", null, null, null, null, null, null, null, null, null,
                Role.CHAUFFEUR, null, null, null, null, null, null, null, null, null));

        UserResponse result = userService.updateUser(3L, request);

        assertThat(result.prenom()).isEqualTo("Updated");
        assertThat(chauffeur.getPrenom()).isEqualTo("Updated");
    }

    @Test
    @DisplayName("updateUser() → Chauffeur sans manager ne peut être mis à jour par manager")
    void updateUser_chauffeurWithoutManager_managerCannotUpdate() {
        chauffeur.setManager(null);
        UpdateUserRequest request = new UpdateUserRequest(
            "Updated", null, null, null, null, null, null, null, null, null
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(utilisateurRepository.findById(3L)).thenReturn(Optional.of(chauffeur));

        assertThatThrownBy(() -> userService.updateUser(3L, request))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("not allowed to update");
    }

    @Test
    @DisplayName("updateUser() → Mise à jour téléphone, pays, image")
    void updateUser_updatesContactInfo_succeeds() {
        UpdateUserRequest request = new UpdateUserRequest(
            null, null, null, "+33987654321", "Belgium", "http://image.com/photo.jpg", null, null, null, null
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(utilisateurRepository.findById(3L)).thenReturn(Optional.of(chauffeur));
        when(utilisateurRepository.save(any(Chauffeur.class))).thenAnswer(inv -> inv.getArgument(0));
        when(userMapper.toResponse(any(Chauffeur.class))).thenAnswer(inv ->
            new UserResponse(3L, null, null, null, null, "+33987654321", "Belgium", "http://image.com/photo.jpg",
                null, null, null, null, Role.CHAUFFEUR, null, null, null, null, null, null, null, null, null));

        UserResponse result = userService.updateUser(3L, request);

        assertThat(result.telephone()).isEqualTo("+33987654321");
        assertThat(result.pays()).isEqualTo("Belgium");
        assertThat(result.image()).isEqualTo("http://image.com/photo.jpg");
    }

    @Test
    @DisplayName("emitAffectationNotifications() → Noms null ou vides → fallback email/id")
    void emitAffectationNotifications_nullNames_usesFallback() {
        chauffeur.setPrenom(null);
        chauffeur.setNom(null);
        chauffeur.setEmail(null);
        Manager newManager = new Manager();
        newManager.setId(3L);
        newManager.setPrenom(null);
        newManager.setNom(null);
        newManager.setEmail(null);
        newManager.setRole(Role.MANAGER);

        UpdateUserRequest request = new UpdateUserRequest(
            null, null, null, null, null, null, null, null, null, 3L
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(utilisateurRepository.findById(3L)).thenReturn(Optional.of(chauffeur));
        when(managerRepository.findById(3L)).thenReturn(Optional.of(newManager));
        when(utilisateurRepository.save(any(Chauffeur.class))).thenAnswer(inv -> inv.getArgument(0));
        when(userMapper.toResponse(any(Chauffeur.class))).thenAnswer(inv ->
            new UserResponse(3L, null, null, null, null, null, null, null, null, null, null, null,
                Role.CHAUFFEUR, null, 3L, null, null, null, null, null, null, null));

        userService.updateUser(3L, request);

        verify(notificationRepository, atLeastOnce()).save(any(Notification.class));
    }

    @Test
    @DisplayName("emitDriverDeletionNotification() → Nom chauffeur null → fallback")
    void emitDriverDeletionNotification_nullDriverName_usesFallback() {
        chauffeur.setPrenom(null);
        chauffeur.setNom(null);
        chauffeur.setEmail(null);
        chauffeur.setManager(manager);
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(utilisateurRepository.findById(3L)).thenReturn(Optional.of(chauffeur));

        userService.deleteUser(3L);

        verify(notificationRepository, atLeastOnce()).save(any(Notification.class));
    }

    // ═══════════════════════════════════════════════════════════════
    // TESTS DE COUVERTURE COMPLÉMENTAIRES — Branches / Lines manquantes
    // ═══════════════════════════════════════════════════════════════

    @Test
    @DisplayName("deleteUser() → Utilisateur inexistant → ResourceNotFoundException")
    void deleteUser_whenUserNotFound_throwsException() {
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(utilisateurRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.deleteUser(999L))
            .isInstanceOf(ResourceNotFoundException.class)
            .hasMessageContaining("User not found");
    }

    @Test
    @DisplayName("deleteUser() → SuperAdmin supprime chauffeur → nettoyage conges/trajets")
    void deleteUser_superAdminDeletesChauffeur_cleansChauffeurDependencies() {
        Conge conge = new Conge();
        conge.setId(10L);
        conge.setChauffeur(chauffeur);

        Trajet trajet = new Trajet();
        trajet.setId(10L);
        trajet.setChauffeur(chauffeur);

        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(utilisateurRepository.findById(3L)).thenReturn(Optional.of(chauffeur));
        when(congeRepository.findByChauffeur_IdOrderByDateDebutDesc(3L)).thenReturn(List.of(conge));
        when(trajetRepository.findByChauffeurId(3L)).thenReturn(List.of(trajet));

        ApiMessageResponse result = userService.deleteUser(3L);

        assertThat(result.message()).contains("deleted");
        assertThat(conge.getChauffeur()).isNull();
        assertThat(trajet.getChauffeur()).isNull();
        verify(congeRepository, times(1)).flush();
        verify(trajetRepository, times(1)).flush();
    }

    @Test
    @DisplayName("updateUser() → Réaffectation au même manager → pas de notification")
    void updateUser_reassignToSameManager_sendsNoNotifications() {
        UpdateUserRequest request = new UpdateUserRequest(
            null, null, null, null, null, null, null, null, null, 2L
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(utilisateurRepository.findById(3L)).thenReturn(Optional.of(chauffeur));
        when(managerRepository.findById(2L)).thenReturn(Optional.of(manager));
        when(utilisateurRepository.save(any(Chauffeur.class))).thenAnswer(inv -> inv.getArgument(0));
        when(userMapper.toResponse(any(Chauffeur.class))).thenAnswer(inv ->
            new UserResponse(3L, null, null, null, null, null, null, null, null, null, null, null,
                Role.CHAUFFEUR, null, 2L, null, null, null, null, null, null, null));

        userService.updateUser(3L, request);

        assertThat(chauffeur.getManager()).isEqualTo(manager);
        verify(notificationRepository, never()).save(any(Notification.class));
    }

    @Test
    @DisplayName("updateUser() → Utilisateur déjà ACTIF + estActif=true → pas de réactivation")
    void updateUser_alreadyActive_noReactivationEmail() {
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(utilisateurRepository.findById(3L)).thenReturn(Optional.of(chauffeur));
        when(utilisateurRepository.save(any(Chauffeur.class))).thenAnswer(inv -> inv.getArgument(0));
        when(userMapper.toResponse(any(Chauffeur.class))).thenAnswer(inv ->
            new UserResponse(3L, null, null, null, null, null, null, null, StatutCompte.ACTIF, true, null, null,
                Role.CHAUFFEUR, null, null, null, null, null, null, null, null, null));

        UpdateUserRequest request = new UpdateUserRequest(
            null, null, null, null, null, null, true, null, null, null
        );

        userService.updateUser(3L, request);

        verify(mailService, never()).sendAccountReactivationEmail(any());
    }

    @Test
    @DisplayName("createUser() → SuperAdmin crée chauffeur avec managerId valide → succès")
    void createUser_superAdminCreatesChauffeurWithValidManagerId_succeeds() {
        CreateUserRequest request = new CreateUserRequest(
            "Pierre", "Martin", "pierre@test.com", null, "France", null, Role.CHAUFFEUR, true, 2L
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(utilisateurRepository.existsByEmailIgnoreCase("pierre@test.com")).thenReturn(false);
        when(managerRepository.findById(2L)).thenReturn(Optional.of(manager));
        when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");
        when(keycloakService.createUserAccount(anyString(), anyString(), anyString(), anyString(), anyString(), anyBoolean()))
            .thenReturn("keycloak-id");
        when(utilisateurRepository.save(any(Chauffeur.class))).thenAnswer(inv -> {
            Chauffeur saved = inv.getArgument(0);
            saved.setId(11L);
            return saved;
        });
        when(userMapper.toResponse(any(Chauffeur.class))).thenAnswer(inv ->
            new UserResponse(11L, "keycloak-id", "Pierre", "Martin", "pierre@test.com",
                null, null, null, StatutCompte.ACTIF, true, null, null, Role.CHAUFFEUR,
                StatutChauffeur.LIBRE, 2L, null, null, null, null, null, null, null));

        UserResponse result = userService.createUser(request);

        assertThat(result).isNotNull();
        assertThat(result.role()).isEqualTo(Role.CHAUFFEUR);
        assertThat(result.managerId()).isEqualTo(2L);
    }

    @Test
    @DisplayName("deleteUser() → Manager supprime chauffeur assigné → notification envoyée")
    void deleteUser_managerRemovesOwnDriver_notifiesDriver() {
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(utilisateurRepository.findById(3L)).thenReturn(Optional.of(chauffeur));
        when(utilisateurRepository.save(any(Chauffeur.class))).thenAnswer(inv -> inv.getArgument(0));

        ApiMessageResponse result = userService.deleteUser(3L);

        assertThat(result.message()).contains("removed from your list");
        assertThat(chauffeur.getManager()).isNull();
    }

    @Test
    @DisplayName("updateUser() → Chauffeur sans manager ne peut pas être mis à jour par un autre manager")
    void updateUser_chauffeurAssignedToOtherManager_throwsException() {
        Manager otherManager = new Manager();
        otherManager.setId(50L);
        otherManager.setRole(Role.MANAGER);

        Chauffeur otherDriver = new Chauffeur();
        otherDriver.setId(60L);
        otherDriver.setRole(Role.CHAUFFEUR);
        otherDriver.setManager(otherManager);

        UpdateUserRequest request = new UpdateUserRequest(
            "Hacked", null, null, null, null, null, null, null, null, null
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(utilisateurRepository.findById(60L)).thenReturn(Optional.of(otherDriver));

        assertThatThrownBy(() -> userService.updateUser(60L, request))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("not allowed to update");
    }

    @Test
    @DisplayName("updateUser() → Manager tente de modifier un Manager → interdit")
    void updateUser_managerCannotUpdateManager_throwsException() {
        Manager targetManager = new Manager();
        targetManager.setId(70L);
        targetManager.setRole(Role.MANAGER);

        UpdateUserRequest request = new UpdateUserRequest(
            "Hacked", null, null, null, null, null, null, null, null, null
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(utilisateurRepository.findById(70L)).thenReturn(Optional.of(targetManager));

        assertThatThrownBy(() -> userService.updateUser(70L, request))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("not allowed to update");
    }

    @Test
    @DisplayName("createUser() → Manager crée chauffeur avec managerId différent → utilise managerId fourni")
    void createUser_managerCreatesChauffeurWithExplicitManagerId_usesProvidedManagerId() {
        Entreprise ent = new Entreprise();
        ent.setId(10L);
        ent.setNomEntreprise("EntTest");
        manager.setEntreprise(ent);

        CreateUserRequest request = new CreateUserRequest(
            "Paul", "Durand", "paul@test.com", null, "France", null, Role.CHAUFFEUR, true, 80L
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(utilisateurRepository.existsByEmailIgnoreCase("paul@test.com")).thenReturn(false);
        when(managerRepository.findById(2L)).thenReturn(Optional.of(manager));
        when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");
        when(keycloakService.createUserAccount(anyString(), anyString(), anyString(), anyString(), anyString(), anyBoolean()))
            .thenReturn("keycloak-id");
        when(utilisateurRepository.save(any(Chauffeur.class))).thenAnswer(inv -> {
            Chauffeur saved = inv.getArgument(0);
            saved.setId(12L);
            return saved;
        });
        when(userMapper.toResponse(any(Chauffeur.class))).thenAnswer(inv ->
            new UserResponse(12L, "keycloak-id", "Paul", "Durand", "paul@test.com",
                null, null, null, StatutCompte.INACTIF, false, null, null, Role.CHAUFFEUR,
                StatutChauffeur.LIBRE, 2L, null, null, null, null, null, null, null));

        UserResponse result = userService.createUser(request);

        assertThat(result).isNotNull();
        assertThat(result.role()).isEqualTo(Role.CHAUFFEUR);
    }

    @Test
    @DisplayName("createUser() → SuperAdmin crée Manager avec estActif=false → INACTIF")
    void createUser_superAdminCreatesInactiveManager_setsInactive() {
        CreateUserRequest request = new CreateUserRequest(
            "Inactive", "Manager", "inactive@test.com", null, "France", null, Role.MANAGER, false, null
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(utilisateurRepository.existsByEmailIgnoreCase("inactive@test.com")).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");
        when(keycloakService.createUserAccount(anyString(), anyString(), anyString(), anyString(), anyString(), anyBoolean()))
            .thenReturn("keycloak-id");
        when(utilisateurRepository.save(any(Manager.class))).thenAnswer(inv -> {
            Manager saved = inv.getArgument(0);
            saved.setId(15L);
            return saved;
        });
        when(userMapper.toResponse(any(Manager.class))).thenAnswer(inv ->
            new UserResponse(15L, null, null, null, null, null, null, null, StatutCompte.INACTIF, false, null, null,
                Role.MANAGER, null, null, null, null, null, null, null, null, null));

        UserResponse result = userService.createUser(request);

        assertThat(result.estActif()).isEqualTo(StatutCompte.INACTIF);
    }

    @Test
    @DisplayName("deleteUser() → SuperAdmin supprime Manager → nettoyage complet avec conges/trajets")
    void deleteUser_superAdminDeletesManager_cleansAllDependencies() {
        Manager targetManager = new Manager();
        targetManager.setId(5L);
        targetManager.setRole(Role.MANAGER);

        Chauffeur subDriver = new Chauffeur();
        subDriver.setId(7L);
        subDriver.setManager(targetManager);

        Conge conge = new Conge();
        conge.setId(20L);
        conge.setManager(targetManager);

        Trajet trajet = new Trajet();
        trajet.setId(20L);
        trajet.setManager(targetManager);

        Entreprise ownedCompany = new Entreprise();
        ownedCompany.setId(30L);
        ownedCompany.setProprietaire(targetManager);

        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(utilisateurRepository.findById(5L)).thenReturn(Optional.of(targetManager));
        when(chauffeurRepository.findByManagerId(5L)).thenReturn(List.of(subDriver));
        when(utilisateurRepository.save(any(Chauffeur.class))).thenAnswer(inv -> inv.getArgument(0));
        when(congeRepository.findByManager_IdOrderByDateDebutDesc(5L)).thenReturn(List.of(conge));
        when(trajetRepository.findByManagerId(5L)).thenReturn(List.of(trajet));
        when(entrepriseRepository.findByProprietaire_Id(5L)).thenReturn(Optional.of(ownedCompany));
        when(entrepriseRepository.save(any(Entreprise.class))).thenAnswer(inv -> inv.getArgument(0));

        ApiMessageResponse result = userService.deleteUser(5L);

        assertThat(result.message()).contains("deleted");
        verify(congeRepository).flush();
        verify(trajetRepository).flush();
        verify(entrepriseRepository).save(ownedCompany);
        verify(notificationRepository).deleteByUtilisateur(targetManager);
    }

    @Test
    @DisplayName("createUser() → SuperAdmin crée SuperAdmin avec estActif=null → traite comme true")
    void createUser_superAdminCreatesSuperAdminWithNullEstActif_defaultsToActive() {
        CreateUserRequest request = new CreateUserRequest(
            "Root", "Admin", "root@test.com", null, "France", null, Role.SUPERADMIN, null, null
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(utilisateurRepository.existsByEmailIgnoreCase("root@test.com")).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");
        when(keycloakService.createUserAccount(anyString(), anyString(), anyString(), anyString(), anyString(), anyBoolean()))
            .thenReturn("keycloak-id");
        when(utilisateurRepository.save(any(SuperAdministrateur.class))).thenAnswer(inv -> {
            SuperAdministrateur saved = inv.getArgument(0);
            saved.setId(20L);
            return saved;
        });
        when(userMapper.toResponse(any(SuperAdministrateur.class))).thenAnswer(inv -> {
            SuperAdministrateur u = inv.getArgument(0);
            return new UserResponse(
                u.getId(), u.getKeycloakId(), u.getPrenom(), u.getNom(), u.getEmail(),
                null, null, null, u.getEstActif(), null, null, null, u.getRole(),
                null, null, null, null, null, null, null, null, null
            );
        });

        UserResponse result = userService.createUser(request);

        assertThat(result).isNotNull();
        assertThat(result.role()).isEqualTo(Role.SUPERADMIN);
        verify(keycloakService).createUserAccount(anyString(), anyString(), anyString(), anyString(), anyString(), eq(true));
    }

    @Test
    @DisplayName("updateUser() → Changement téléphone et pays")
    void updateUser_updatesPhoneAndCountry_succeeds() {
        UpdateUserRequest request = new UpdateUserRequest(
            null, null, null, "+33777666555", "Germany", null, null, null, null, null
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(utilisateurRepository.findById(3L)).thenReturn(Optional.of(chauffeur));
        when(utilisateurRepository.save(any(Chauffeur.class))).thenAnswer(inv -> inv.getArgument(0));
        when(userMapper.toResponse(any(Chauffeur.class))).thenAnswer(inv ->
            new UserResponse(3L, null, null, null, null, "+33777666555", "Germany", null,
                null, null, null, null, Role.CHAUFFEUR, null, null, null, null, null, null, null, null, null));

        UserResponse result = userService.updateUser(3L, request);

        assertThat(result.telephone()).isEqualTo("+33777666555");
        assertThat(result.pays()).isEqualTo("Germany");
    }

    @Test
    @DisplayName("updateUser() → Changement image")
    void updateUser_updatesImage_succeeds() {
        UpdateUserRequest request = new UpdateUserRequest(
            null, null, null, null, null, "http://new-image.com/pic.jpg", null, null, null, null
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(utilisateurRepository.findById(3L)).thenReturn(Optional.of(chauffeur));
        when(utilisateurRepository.save(any(Chauffeur.class))).thenAnswer(inv -> inv.getArgument(0));
        when(userMapper.toResponse(any(Chauffeur.class))).thenAnswer(inv ->
            new UserResponse(3L, null, null, null, null, null, null, "http://new-image.com/pic.jpg",
                null, null, null, null, Role.CHAUFFEUR, null, null, null, null, null, null, null, null, null));

        UserResponse result = userService.updateUser(3L, request);

        assertThat(result.image()).isEqualTo("http://new-image.com/pic.jpg");
    }

    @Test
    @DisplayName("updateUser() → Mise à jour complète tous les champs")
    void updateUser_updatesAllFields_succeeds() {
        UpdateUserRequest request = new UpdateUserRequest(
            "NewPrenom", "NewNom", "new@test.com", "+33111222333", "Spain",
            "http://img.com/new.jpg", true, null, Role.CHAUFFEUR, null
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(utilisateurRepository.findById(3L)).thenReturn(Optional.of(chauffeur));
        when(utilisateurRepository.existsByEmailIgnoreCase("new@test.com")).thenReturn(false);
        when(utilisateurRepository.save(any(Chauffeur.class))).thenAnswer(inv -> inv.getArgument(0));
        when(userMapper.toResponse(any(Chauffeur.class))).thenAnswer(inv ->
            new UserResponse(3L, null, "NewPrenom", "NewNom", "new@test.com",
                "+33111222333", "Spain", "http://img.com/new.jpg",
                StatutCompte.ACTIF, true, null, null, Role.CHAUFFEUR,
                null, null, null, null, null, null, null, null, null));

        UserResponse result = userService.updateUser(3L, request);

        assertThat(result.prenom()).isEqualTo("NewPrenom");
        assertThat(result.nom()).isEqualTo("NewNom");
        assertThat(result.email()).isEqualTo("new@test.com");
        assertThat(result.telephone()).isEqualTo("+33111222333");
        assertThat(result.pays()).isEqualTo("Spain");
        assertThat(result.image()).isEqualTo("http://img.com/new.jpg");
    }

    // ═══════════════════════════════════════════════════════════════
    // TESTS DE COUVERTURE BRANCHES MANQUANTES
    // ═══════════════════════════════════════════════════════════════

    @Test
    @DisplayName("updateUser() → Même email → pas de vérification doublon")
    void updateUser_sameEmail_noDuplicateCheck() {
        UpdateUserRequest request = new UpdateUserRequest(
            null, null, "chauffeur@test.com", null, null, null, null, null, null, null
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(utilisateurRepository.findById(3L)).thenReturn(Optional.of(chauffeur));
        when(utilisateurRepository.save(any(Chauffeur.class))).thenAnswer(inv -> inv.getArgument(0));
        when(userMapper.toResponse(any(Chauffeur.class))).thenAnswer(inv ->
            new UserResponse(3L, null, null, null, "chauffeur@test.com",
                null, null, null, null, null, null, null, Role.CHAUFFEUR,
                null, null, null, null, null, null, null, null, null));

        UserResponse result = userService.updateUser(3L, request);

        assertThat(chauffeur.getEmail()).isEqualTo("chauffeur@test.com");
        verify(utilisateurRepository, never()).existsByEmailIgnoreCase(anyString());
    }

    @Test
    @DisplayName("updateUser() → Désactivation avec raison vide → INACTIF")
    void updateUser_deactivateWithBlankReason_setsInactive() {
        UpdateUserRequest request = new UpdateUserRequest(
            null, null, null, null, null, null, false, "   ", null, null
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(utilisateurRepository.findById(3L)).thenReturn(Optional.of(chauffeur));
        when(utilisateurRepository.save(any(Chauffeur.class))).thenAnswer(inv -> inv.getArgument(0));
        when(userMapper.toResponse(any(Chauffeur.class))).thenAnswer(inv ->
            new UserResponse(3L, null, null, null, null, null, null, null, StatutCompte.INACTIF, false, null, null,
                Role.CHAUFFEUR, null, null, null, null, null, null, null, null, null));

        UserResponse result = userService.updateUser(3L, request);

        assertThat(chauffeur.getEstActif()).isEqualTo(StatutCompte.INACTIF);
        assertThat(chauffeur.getRejectionReason()).isNull();
    }

    @Test
    @DisplayName("deleteUser() → SuperAdmin supprime chauffeur sans manager → sans notification")
    void deleteUser_superAdminDeletesUnassignedDriver_noNotification() {
        Chauffeur unassigned = new Chauffeur();
        unassigned.setId(80L);
        unassigned.setPrenom("Solo");
        unassigned.setNom("Driver");
        unassigned.setEmail("solo@test.com");
        unassigned.setRole(Role.CHAUFFEUR);
        unassigned.setManager(null);

        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(utilisateurRepository.findById(80L)).thenReturn(Optional.of(unassigned));

        ApiMessageResponse result = userService.deleteUser(80L);

        assertThat(result.message()).contains("deleted");
        verify(utilisateurRepository).delete(unassigned);
        verify(notificationRepository, never()).save(any(Notification.class));
    }

    @Test
    @DisplayName("updateUser() → SuperAdmin met à jour un Manager avec managerId → pas de réaffectation")
    void updateUser_superAdminUpdatesManagerWithManagerId_noChauffeurBlock() {
        UpdateUserRequest request = new UpdateUserRequest(
            "UpdatedManager", null, null, null, null, null, null, null, null, 3L
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(utilisateurRepository.findById(2L)).thenReturn(Optional.of(manager));
        when(utilisateurRepository.save(any(Manager.class))).thenAnswer(inv -> inv.getArgument(0));
        when(userMapper.toResponse(any(Manager.class))).thenAnswer(inv ->
            new UserResponse(2L, null, "UpdatedManager", null, "manager@test.com",
                null, null, null, null, null, null, null, Role.MANAGER,
                null, null, null, null, null, null, null, null, null));

        UserResponse result = userService.updateUser(2L, request);

        assertThat(result.prenom()).isEqualTo("UpdatedManager");
        verify(utilisateurRepository).save(manager);
    }

    @Test
    @DisplayName("updateUser() → Réaffectation chauffeur sans nom avec email → utilise email")
    void updateUser_reassignDriverWithNoNames_usesEmail() {
        Chauffeur driverNoNames = new Chauffeur();
        driverNoNames.setId(80L);
        driverNoNames.setPrenom(null);
        driverNoNames.setNom(null);
        driverNoNames.setEmail("noname@test.com");
        driverNoNames.setRole(Role.CHAUFFEUR);
        driverNoNames.setManager(manager);
        driverNoNames.setStatutConducteur(StatutChauffeur.LIBRE);

        Manager newManager = new Manager();
        newManager.setId(3L);
        newManager.setPrenom("New");
        newManager.setNom("Manager");
        newManager.setEmail("new@test.com");
        newManager.setRole(Role.MANAGER);

        UpdateUserRequest request = new UpdateUserRequest(
            null, null, null, null, null, null, null, null, null, 3L
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(utilisateurRepository.findById(80L)).thenReturn(Optional.of(driverNoNames));
        when(managerRepository.findById(3L)).thenReturn(Optional.of(newManager));
        when(utilisateurRepository.save(any(Chauffeur.class))).thenAnswer(inv -> inv.getArgument(0));
        when(userMapper.toResponse(any(Chauffeur.class))).thenAnswer(inv ->
            new UserResponse(80L, null, null, null, "noname@test.com", null, null, null, null, null, null, null,
                Role.CHAUFFEUR, null, 3L, null, null, null, null, null, null, null));

        userService.updateUser(80L, request);

        verify(notificationRepository, atLeast(3)).save(any(Notification.class));
    }

    @Test
    @DisplayName("updateUser() → Réaffectation avec ancien manager sans nom avec email → utilise email")
    void updateUser_reassignWithOldManagerNoNames_usesEmail() {
        Manager oldManagerNoNames = new Manager();
        oldManagerNoNames.setId(10L);
        oldManagerNoNames.setPrenom(null);
        oldManagerNoNames.setNom(null);
        oldManagerNoNames.setEmail("old@test.com");
        oldManagerNoNames.setRole(Role.MANAGER);

        Chauffeur driver = new Chauffeur();
        driver.setId(80L);
        driver.setPrenom("Jean");
        driver.setNom("Dupont");
        driver.setEmail("jean@test.com");
        driver.setRole(Role.CHAUFFEUR);
        driver.setManager(oldManagerNoNames);
        driver.setStatutConducteur(StatutChauffeur.LIBRE);

        Manager newManager = new Manager();
        newManager.setId(20L);
        newManager.setPrenom("New");
        newManager.setNom("Manager");
        newManager.setEmail("new@test.com");
        newManager.setRole(Role.MANAGER);

        UpdateUserRequest request = new UpdateUserRequest(
            null, null, null, null, null, null, null, null, null, 20L
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(utilisateurRepository.findById(80L)).thenReturn(Optional.of(driver));
        when(managerRepository.findById(20L)).thenReturn(Optional.of(newManager));
        when(utilisateurRepository.save(any(Chauffeur.class))).thenAnswer(inv -> inv.getArgument(0));
        when(userMapper.toResponse(any(Chauffeur.class))).thenAnswer(inv ->
            new UserResponse(80L, null, null, null, null, null, null, null, null, null, null, null,
                Role.CHAUFFEUR, null, 20L, null, null, null, null, null, null, null));

        userService.updateUser(80L, request);

        verify(notificationRepository, atLeast(3)).save(any(Notification.class));
    }

    @Test
    @DisplayName("updateUser() → Chauffeur ne peut pas modifier un Manager")
    void updateUser_byChauffeurCannotUpdateManager_throwsException() {
        Manager target = new Manager();
        target.setId(50L);
        target.setRole(Role.MANAGER);

        UpdateUserRequest request = new UpdateUserRequest(
            "Hacked", null, null, null, null, null, null, null, null, null
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(chauffeur);
        when(utilisateurRepository.findById(50L)).thenReturn(Optional.of(target));

        assertThatThrownBy(() -> userService.updateUser(50L, request))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("not allowed to update");
    }

    @Test
    @DisplayName("updateUser() → Chauffeur ne peut pas modifier un autre Chauffeur")
    void updateUser_byChauffeurCannotUpdateChauffeur_throwsException() {
        Chauffeur target = new Chauffeur();
        target.setId(60L);
        target.setRole(Role.CHAUFFEUR);
        target.setManager(manager);

        UpdateUserRequest request = new UpdateUserRequest(
            "Hacked", null, null, null, null, null, null, null, null, null
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(chauffeur);
        when(utilisateurRepository.findById(60L)).thenReturn(Optional.of(target));

        assertThatThrownBy(() -> userService.updateUser(60L, request))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("not allowed to update");
    }
}
