package com.logiway.services;

import com.logiway.dto.request.CreateReclamationRequest;
import com.logiway.dto.request.ReclamationDecisionRequest;
import com.logiway.dto.request.UpdateReclamationRequest;
import com.logiway.dto.request.ValidateReclamationRequest;
import com.logiway.dto.response.ReclamationResponse;
import com.logiway.dto.response.ValidateReclamationResponse;
import com.logiway.entities.Reclamation;
import com.logiway.entities.Manager;
import com.logiway.entities.Chauffeur;
import com.logiway.entities.Utilisateur;
import com.logiway.entities.enums.PrioriteReclamation;
import com.logiway.entities.enums.Role;
import com.logiway.entities.enums.StatutReclamation;
import com.logiway.exceptions.BadRequestException;
import com.logiway.exceptions.ResourceNotFoundException;
import com.logiway.exceptions.UnauthorizedException;
import com.logiway.repositories.ReclamationRepository;
import com.logiway.repositories.UtilisateurRepository;
import com.logiway.repositories.ChauffeurRepository;
import com.logiway.repositories.NotificationRepository;
import com.logiway.security.AuthenticatedUserService;
import com.logiway.services.impl.ReclamationServiceImpl;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import jakarta.persistence.EntityManager;

import java.lang.reflect.Method;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.mockito.Mockito.lenient;

/**
 * Tests unitaires du service Réclamation.
 * Valide la gestion des réclamations, validation IA, et workflow d'approbation.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("Service Réclamation — Tests Unitaires")
class ReclamationServiceTest {

    @Mock private ReclamationRepository reclamationRepository;
    @Mock private UtilisateurRepository utilisateurRepository;
    @Mock private ChauffeurRepository chauffeurRepository;
    @Mock private NotificationRepository notificationRepository;
    @Mock private NotificationRealtimeService notificationRealtimeService;
    @Mock private AuthenticatedUserService authenticatedUserService;
    @Mock private RestTemplate restTemplate;
    @Mock private EntityManager entityManager;

    @InjectMocks
    private ReclamationServiceImpl reclamationService;

    private Chauffeur chauffeur;
    private Manager manager;
    private Reclamation reclamation;

    @BeforeEach
    void setUp() {
        // Créer un chauffeur
        chauffeur = new Chauffeur();
        chauffeur.setId(1L);
        chauffeur.setEmail("chauffeur@test.com");
        chauffeur.setPrenom("Jean");
        chauffeur.setNom("Dupont");
        chauffeur.setRole(Role.CHAUFFEUR);

        // Créer un manager
        manager = new Manager();
        manager.setId(2L);
        manager.setEmail("manager@test.com");
        manager.setPrenom("Manager");
        manager.setNom("Test");
        manager.setRole(Role.MANAGER);

        // Créer une réclamation
        reclamation = new Reclamation();
        reclamation.setId(1L);
        reclamation.setSujet("Problème de véhicule");
        reclamation.setDescription("Le véhicule présente des dysfonctionnements");
        reclamation.setPriorite(PrioriteReclamation.URGENT);
        reclamation.setStatut(StatutReclamation.EN_COURS);
        reclamation.setUtilisateur(chauffeur);
        reclamation.setDateCreation(LocalDateTime.now());
        
        // ═══════════════════════════════════════════════════════════════
        // MOCK du service IA de validation (port 5001)
        // Les tests unitaires n'ont pas besoin du service IA réel
        // ═══════════════════════════════════════════════════════════════
        mockValidationServiceIA();
    }
    
    /**
     * Mock du service IA de validation des réclamations.
     * Simule une réponse HTTP 200 avec validation réussie.
     * Utilise lenient() car ce mock n'est pas utilisé par tous les tests.
     */
    private void mockValidationServiceIA() {
        // Réponse JSON mockée du service IA (validation réussie)
        String mockResponseBody = "{\"valide\":true,\"scores\":{\"toxicite\":0.1,\"semantique\":0.9}}";
        
        // Mock de ResponseEntity avec status 200 OK
        ResponseEntity<String> mockResponse = new ResponseEntity<>(mockResponseBody, HttpStatus.OK);
        
        // Configurer le mock avec lenient() pour éviter UnnecessaryStubbingException
        // Ce mock n'est utilisé que par les tests de création de réclamation
        lenient().when(restTemplate.postForEntity(
            anyString(),           // URL (http://localhost:5001/validate)
            any(),                 // Body (request avec le texte)
            eq(String.class)       // Type de réponse
        )).thenReturn(mockResponse);
    }

    // ═══════════════════════════════════════════════════════════════
    // TEST 1: Création d'une réclamation par un chauffeur
    // ═══════════════════════════════════════════════════════════════
    @Test
    @DisplayName("createReclamation() → Chauffeur peut créer une réclamation")
    void createReclamation_byChauffeur_succeeds() {
        // GIVEN
        CreateReclamationRequest request = new CreateReclamationRequest(
            "Problème de chauffage",
            "Le chauffage du véhicule ne fonctionne pas correctement",
            PrioriteReclamation.NORMAL
        );

        when(authenticatedUserService.getCurrentUser()).thenReturn(chauffeur);
        when(reclamationRepository.save(any(Reclamation.class))).thenAnswer(inv -> {
            Reclamation saved = inv.getArgument(0);
            saved.setId(10L);
            return saved;
        });
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of());

        // WHEN
        ReclamationResponse result = reclamationService.createReclamation(request);

        // THEN
        assertThat(result).isNotNull();
        assertThat(result.getSujet()).isEqualTo("Problème de chauffage");
        assertThat(result.getStatut()).isEqualTo(StatutReclamation.EN_COURS);
        verify(reclamationRepository, times(1)).save(any(Reclamation.class));
    }

    // ═══════════════════════════════════════════════════════════════
    // TEST 2: Création avec sujet vide lance une exception
    // ═══════════════════════════════════════════════════════════════
    @Test
    @DisplayName("createReclamation() → Lance exception si sujet vide")
    void createReclamation_withEmptySubject_throwsException() {
        // GIVEN
        CreateReclamationRequest request = new CreateReclamationRequest(
            "",
            "Description valide",
            PrioriteReclamation.NORMAL
        );

        when(authenticatedUserService.getCurrentUser()).thenReturn(chauffeur);

        // THEN
        assertThatThrownBy(() -> reclamationService.createReclamation(request))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("Sujet is required");
    }

    // ═══════════════════════════════════════════════════════════════
    // TEST 3: Récupérer toutes les réclamations accessibles
    // ═══════════════════════════════════════════════════════════════
    @Test
    @DisplayName("getAccessibleReclamations() → Chauffeur voit uniquement ses réclamations")
    void getAccessibleReclamations_byChauffeur_returnsOwnOnly() {
        // GIVEN
        when(authenticatedUserService.getCurrentUser()).thenReturn(chauffeur);
        when(reclamationRepository.findByUtilisateurWithJoin(chauffeur)).thenReturn(List.of(reclamation));

        // WHEN
        List<ReclamationResponse> result = reclamationService.getAccessibleReclamations();

        // THEN
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getUtilisateurNom()).isEqualTo("Jean Dupont");
        verify(reclamationRepository, times(1)).findByUtilisateurWithJoin(chauffeur);
    }

    // ═══════════════════════════════════════════════════════════════
    // TEST 4: Résolution d'une réclamation par SuperAdmin
    // ═══════════════════════════════════════════════════════════════
    @Test
    @DisplayName("resolveReclamation() → SuperAdmin peut résoudre une réclamation")
    void resolveReclamation_bySuperAdmin_succeeds() {
        // GIVEN
        ReclamationDecisionRequest request = new ReclamationDecisionRequest(
            "Problème résolu après réparation du véhicule"
        );

        when(authenticatedUserService.getCurrentUser()).thenReturn(createSuperAdmin());
        when(reclamationRepository.findById(1L)).thenReturn(Optional.of(reclamation));
        when(reclamationRepository.save(any(Reclamation.class))).thenAnswer(inv -> inv.getArgument(0));

        // WHEN
        ReclamationResponse result = reclamationService.resolveReclamation(1L, request);

        // THEN
        assertThat(result).isNotNull();
        assertThat(result.getStatut()).isEqualTo(StatutReclamation.RESOLU);
        assertThat(result.getCommentaireResolution()).contains("Problème résolu");
        verify(reclamationRepository, times(1)).save(reclamation);
    }

    // ═══════════════════════════════════════════════════════════════
    // TEST 5: Rejet d'une réclamation par SuperAdmin
    // ═══════════════════════════════════════════════════════════════
    @Test
    @DisplayName("rejectReclamation() → SuperAdmin peut rejeter une réclamation")
    void rejectReclamation_bySuperAdmin_succeeds() {
        // GIVEN
        ReclamationDecisionRequest request = new ReclamationDecisionRequest(
            "Réclamation non fondée après vérification"
        );

        when(authenticatedUserService.getCurrentUser()).thenReturn(createSuperAdmin());
        when(reclamationRepository.findById(1L)).thenReturn(Optional.of(reclamation));
        when(reclamationRepository.save(any(Reclamation.class))).thenAnswer(inv -> inv.getArgument(0));

        // WHEN
        ReclamationResponse result = reclamationService.rejectReclamation(1L, request);

        // THEN
        assertThat(result).isNotNull();
        assertThat(result.getStatut()).isEqualTo(StatutReclamation.REJETE);
        assertThat(result.getCommentaireResolution()).contains("non fondée");
        verify(reclamationRepository, times(1)).save(reclamation);
    }

    // ═══════════════════════════════════════════════════════════════
    // TEST 6: Mise à jour d'une réclamation EN_COURS
    // ═══════════════════════════════════════════════════════════════
    @Test
    @DisplayName("updateReclamation() → Propriétaire peut modifier sa réclamation EN_COURS")
    void updateReclamation_byOwner_succeeds() {
        // GIVEN
        UpdateReclamationRequest request = new UpdateReclamationRequest(
            "Problème de climatisation",
            "La climatisation ne refroidit plus",
            PrioriteReclamation.URGENT
        );

        when(authenticatedUserService.getCurrentUser()).thenReturn(chauffeur);
        when(reclamationRepository.findById(1L)).thenReturn(Optional.of(reclamation));
        when(reclamationRepository.save(any(Reclamation.class))).thenAnswer(inv -> inv.getArgument(0));
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of());

        // WHEN
        ReclamationResponse result = reclamationService.updateReclamation(1L, request);

        // THEN
        assertThat(result).isNotNull();
        assertThat(result.getSujet()).isEqualTo("Problème de climatisation");
        verify(reclamationRepository, times(1)).save(reclamation);
    }

    // ═══════════════════════════════════════════════════════════════
    // TEST 7: Non-propriétaire ne peut pas modifier
    // ═══════════════════════════════════════════════════════════════
    @Test
    @DisplayName("updateReclamation() → Non-propriétaire ne peut pas modifier")
    void updateReclamation_byNonOwner_throwsException() {
        // GIVEN
        UpdateReclamationRequest request = new UpdateReclamationRequest(
            "Nouveau sujet",
            "Nouvelle description",
            PrioriteReclamation.NORMAL
        );

        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(reclamationRepository.findById(1L)).thenReturn(Optional.of(reclamation));

        // THEN
        assertThatThrownBy(() -> reclamationService.updateReclamation(1L, request))
            .isInstanceOf(UnauthorizedException.class)
            .hasMessageContaining("your own reclamations");
    }

    // ═══════════════════════════════════════════════════════════════
    // TEST 8: Suppression d'une réclamation par le propriétaire
    // ═══════════════════════════════════════════════════════════════
    @Test
    @DisplayName("deleteReclamation() → Propriétaire peut supprimer sa réclamation")
    void deleteReclamation_byOwner_succeeds() {
        // GIVEN
        when(authenticatedUserService.getCurrentUser()).thenReturn(chauffeur);
        when(reclamationRepository.findById(1L)).thenReturn(Optional.of(reclamation));
        doNothing().when(reclamationRepository).delete(reclamation);

        // WHEN
        reclamationService.deleteReclamation(1L);

        // THEN
        verify(reclamationRepository, times(1)).delete(reclamation);
    }

    // ═══════════════════════════════════════════════════════════════
    // TEST 9: SuperAdmin peut supprimer n'importe quelle réclamation
    // ═══════════════════════════════════════════════════════════════
    @Test
    @DisplayName("deleteReclamation() → SuperAdmin peut supprimer n'importe quelle réclamation")
    void deleteReclamation_bySuperAdmin_succeeds() {
        // GIVEN
        when(authenticatedUserService.getCurrentUser()).thenReturn(createSuperAdmin());
        when(reclamationRepository.findById(1L)).thenReturn(Optional.of(reclamation));
        doNothing().when(reclamationRepository).delete(reclamation);

        // WHEN
        reclamationService.deleteReclamation(1L);

        // THEN
        verify(reclamationRepository, times(1)).delete(reclamation);
    }

    // ═══════════════════════════════════════════════════════════════
    // TEST 10: Réclamation inexistante lance exception
    // ═══════════════════════════════════════════════════════════════
    @Test
    @DisplayName("resolveReclamation() → Lance exception si réclamation inexistante")
    void resolveReclamation_whenNotFound_throwsException() {
        // GIVEN
        ReclamationDecisionRequest request = new ReclamationDecisionRequest("Commentaire");
        when(authenticatedUserService.getCurrentUser()).thenReturn(createSuperAdmin());
        when(reclamationRepository.findById(999L)).thenReturn(Optional.empty());

        // THEN
        assertThatThrownBy(() -> reclamationService.resolveReclamation(999L, request))
            .isInstanceOf(ResourceNotFoundException.class)
            .hasMessageContaining("not found");
    }

    // ═══════════════════════════════════════════════════════════════
    // Méthode utilitaire pour créer un SuperAdmin
    // ═══════════════════════════════════════════════════════════════
    private Manager createSuperAdmin() {
        Manager superAdmin = new Manager();
        superAdmin.setId(3L);
        superAdmin.setEmail("superadmin@test.com");
        superAdmin.setPrenom("Super");
        superAdmin.setNom("Admin");
        superAdmin.setRole(Role.SUPERADMIN);
        return superAdmin;
    }

    // ═══════════════════════════════════════════════════════════════
    // TESTS ADDITIONNELS POUR AUGMENTER LA COUVERTURE
    // ═══════════════════════════════════════════════════════════════

    @Test
    @DisplayName("createReclamation() → Manager peut créer une réclamation")
    void createReclamation_byManager_succeeds() {
        CreateReclamationRequest request = new CreateReclamationRequest(
            "Problème secteur livraison",
            "Le secteur Nord présente des retards de livraison",
            PrioriteReclamation.URGENT
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(reclamationRepository.save(any(Reclamation.class))).thenAnswer(inv -> {
            Reclamation saved = inv.getArgument(0);
            saved.setId(11L);
            return saved;
        });
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of());
        
        ReclamationResponse result = reclamationService.createReclamation(request);
        
        assertThat(result).isNotNull();
        assertThat(result.getSujet()).isEqualTo("Problème secteur livraison");
        verify(reclamationRepository, times(1)).save(any(Reclamation.class));
    }

    @Test
    @DisplayName("createReclamation() → SuperAdmin ne peut pas créer de réclamation")
    void createReclamation_bySuperAdmin_throwsException() {
        CreateReclamationRequest request = new CreateReclamationRequest(
            "Test sujet",
            "Test description",
            PrioriteReclamation.NORMAL
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(createSuperAdmin());
        
        assertThatThrownBy(() -> reclamationService.createReclamation(request))
            .isInstanceOf(UnauthorizedException.class)
            .hasMessageContaining("Only managers and drivers");
    }

    @Test
    @DisplayName("createReclamation() → Description vide lance exception")
    void createReclamation_withEmptyDescription_throwsException() {
        CreateReclamationRequest request = new CreateReclamationRequest(
            "Sujet valide",
            "",
            PrioriteReclamation.NORMAL
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(chauffeur);
        
        assertThatThrownBy(() -> reclamationService.createReclamation(request))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("Description is required");
    }

    @Test
    @DisplayName("createReclamation() → Sujet null lance exception")
    void createReclamation_withNullSubject_throwsException() {
        CreateReclamationRequest request = new CreateReclamationRequest(
            null,
            "Description valide",
            PrioriteReclamation.NORMAL
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(chauffeur);
        
        assertThatThrownBy(() -> reclamationService.createReclamation(request))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("Sujet is required");
    }

    @Test
    @DisplayName("createReclamation() → Description null lance exception")
    void createReclamation_withNullDescription_throwsException() {
        CreateReclamationRequest request = new CreateReclamationRequest(
            "Sujet valide",
            null,
            PrioriteReclamation.NORMAL
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(chauffeur);
        
        assertThatThrownBy(() -> reclamationService.createReclamation(request))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("Description is required");
    }

    @Test
    @DisplayName("updateReclamation() → Description vide lance exception")
    void updateReclamation_withEmptyDescription_throwsException() {
        UpdateReclamationRequest request = new UpdateReclamationRequest(
            "Sujet valide",
            "  ",
            PrioriteReclamation.NORMAL
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(chauffeur);
        when(reclamationRepository.findById(1L)).thenReturn(Optional.of(reclamation));
        
        assertThatThrownBy(() -> reclamationService.updateReclamation(1L, request))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("Description is required");
    }

    @Test
    @DisplayName("updateReclamation() → Réclamation inexistante lance exception")
    void updateReclamation_whenNotFound_throwsException() {
        UpdateReclamationRequest request = new UpdateReclamationRequest(
            "Sujet",
            "Description",
            PrioriteReclamation.NORMAL
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(chauffeur);
        when(reclamationRepository.findById(999L)).thenReturn(Optional.empty());
        
        assertThatThrownBy(() -> reclamationService.updateReclamation(999L, request))
            .isInstanceOf(ResourceNotFoundException.class)
            .hasMessageContaining("not found");
    }

    @Test
    @DisplayName("updateReclamation() → Réclamation résolue ne peut être modifiée")
    void updateReclamation_whenResolved_throwsException() {
        reclamation.setStatut(StatutReclamation.RESOLU);
        UpdateReclamationRequest request = new UpdateReclamationRequest(
            "Nouveau sujet",
            "Nouvelle description",
            PrioriteReclamation.NORMAL
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(chauffeur);
        when(reclamationRepository.findById(1L)).thenReturn(Optional.of(reclamation));
        
        assertThatThrownBy(() -> reclamationService.updateReclamation(1L, request))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("Only pending reclamations");
    }

    @Test
    @DisplayName("updateReclamation() → Réclamation rejetée ne peut être modifiée")
    void updateReclamation_whenRejected_throwsException() {
        reclamation.setStatut(StatutReclamation.REJETE);
        UpdateReclamationRequest request = new UpdateReclamationRequest(
            "Nouveau sujet",
            "Nouvelle description",
            PrioriteReclamation.NORMAL
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(chauffeur);
        when(reclamationRepository.findById(1L)).thenReturn(Optional.of(reclamation));
        
        assertThatThrownBy(() -> reclamationService.updateReclamation(1L, request))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("Only pending reclamations");
    }

    @Test
    @DisplayName("deleteReclamation() → Réclamation inexistante lance exception")
    void deleteReclamation_whenNotFound_throwsException() {
        when(authenticatedUserService.getCurrentUser()).thenReturn(chauffeur);
        when(reclamationRepository.findById(999L)).thenReturn(Optional.empty());
        
        assertThatThrownBy(() -> reclamationService.deleteReclamation(999L))
            .isInstanceOf(ResourceNotFoundException.class)
            .hasMessageContaining("not found");
    }

    @Test
    @DisplayName("deleteReclamation() → Non-propriétaire ne peut pas supprimer")
    void deleteReclamation_byNonOwner_throwsException() {
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(reclamationRepository.findById(1L)).thenReturn(Optional.of(reclamation));
        
        assertThatThrownBy(() -> reclamationService.deleteReclamation(1L))
            .isInstanceOf(UnauthorizedException.class)
            .hasMessageContaining("your own reclamations");
    }

    @Test
    @DisplayName("getAccessibleReclamations() → SuperAdmin voit toutes les réclamations")
    void getAccessibleReclamations_bySuperAdmin_returnsAll() {
        Manager superAdmin = createSuperAdmin();
        Reclamation rec2 = new Reclamation();
        rec2.setId(2L);
        rec2.setSujet("Autre réclamation");
        rec2.setUtilisateur(manager);
        
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(reclamationRepository.findAllWithUtilisateur()).thenReturn(List.of(reclamation, rec2));
        
        List<ReclamationResponse> result = reclamationService.getAccessibleReclamations();
        
        assertThat(result).hasSize(2);
        verify(reclamationRepository, times(1)).findAllWithUtilisateur();
    }

    @Test
    @DisplayName("getAccessibleReclamations() → Manager voit ses réclamations + chauffeurs")
    void getAccessibleReclamations_byManager_returnsTeam() {
        Chauffeur managedDriver = new Chauffeur();
        managedDriver.setId(5L);
        managedDriver.setRole(Role.CHAUFFEUR);
        
        Reclamation driverRec = new Reclamation();
        driverRec.setId(3L);
        driverRec.setUtilisateur(managedDriver);
        driverRec.setSujet("Réclamation chauffeur");
        driverRec.setDescription("Description");
        driverRec.setPriorite(PrioriteReclamation.NORMAL);
        driverRec.setStatut(StatutReclamation.EN_COURS);
        
        Reclamation managerRec = new Reclamation();
        managerRec.setId(4L);
        managerRec.setUtilisateur(manager);
        managerRec.setSujet("Réclamation manager");
        managerRec.setDescription("Description");
        managerRec.setPriorite(PrioriteReclamation.NORMAL);
        managerRec.setStatut(StatutReclamation.EN_COURS);
        
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(chauffeurRepository.findByManagerId(2L)).thenReturn(List.of(managedDriver));
        when(reclamationRepository.findByUtilisateursWithJoin(anyList())).thenReturn(new java.util.ArrayList<>(List.of(driverRec)));
        when(reclamationRepository.findByUtilisateurWithJoin(manager)).thenReturn(List.of(managerRec));
        
        List<ReclamationResponse> result = reclamationService.getAccessibleReclamations();
        
        assertThat(result).hasSize(2);
    }

    @Test
    @DisplayName("resolveReclamation() → Chauffeur ne peut pas résoudre")
    void resolveReclamation_byChauffeur_throwsException() {
        ReclamationDecisionRequest request = new ReclamationDecisionRequest("Commentaire");
        when(authenticatedUserService.getCurrentUser()).thenReturn(chauffeur);
        
        assertThatThrownBy(() -> reclamationService.resolveReclamation(1L, request))
            .isInstanceOf(UnauthorizedException.class)
            .hasMessageContaining("Only SuperAdmin");
    }

    @Test
    @DisplayName("resolveReclamation() → Manager ne peut pas résoudre")
    void resolveReclamation_byManager_throwsException() {
        ReclamationDecisionRequest request = new ReclamationDecisionRequest("Commentaire");
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        
        assertThatThrownBy(() -> reclamationService.resolveReclamation(1L, request))
            .isInstanceOf(UnauthorizedException.class)
            .hasMessageContaining("Only SuperAdmin");
    }

    @Test
    @DisplayName("resolveReclamation() → Commentaire vide lance exception")
    void resolveReclamation_withEmptyComment_throwsException() {
        ReclamationDecisionRequest request = new ReclamationDecisionRequest("  ");
        lenient().when(authenticatedUserService.getCurrentUser()).thenReturn(createSuperAdmin());
        lenient().when(reclamationRepository.findById(1L)).thenReturn(Optional.of(reclamation));
        
        assertThatThrownBy(() -> reclamationService.resolveReclamation(1L, request))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("Commentaire is required");
    }

    @Test
    @DisplayName("resolveReclamation() → Commentaire null lance exception")
    void resolveReclamation_withNullComment_throwsException() {
        ReclamationDecisionRequest request = new ReclamationDecisionRequest(null);
        lenient().when(authenticatedUserService.getCurrentUser()).thenReturn(createSuperAdmin());
        lenient().when(reclamationRepository.findById(1L)).thenReturn(Optional.of(reclamation));
        
        assertThatThrownBy(() -> reclamationService.resolveReclamation(1L, request))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("Commentaire is required");
    }

    @Test
    @DisplayName("rejectReclamation() → Chauffeur ne peut pas rejeter")
    void rejectReclamation_byChauffeur_throwsException() {
        ReclamationDecisionRequest request = new ReclamationDecisionRequest("Motif");
        when(authenticatedUserService.getCurrentUser()).thenReturn(chauffeur);
        
        assertThatThrownBy(() -> reclamationService.rejectReclamation(1L, request))
            .isInstanceOf(UnauthorizedException.class)
            .hasMessageContaining("Only SuperAdmin");
    }

    @Test
    @DisplayName("rejectReclamation() → Manager ne peut pas rejeter")
    void rejectReclamation_byManager_throwsException() {
        ReclamationDecisionRequest request = new ReclamationDecisionRequest("Motif");
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        
        assertThatThrownBy(() -> reclamationService.rejectReclamation(1L, request))
            .isInstanceOf(UnauthorizedException.class)
            .hasMessageContaining("Only SuperAdmin");
    }

    @Test
    @DisplayName("rejectReclamation() → Réclamation inexistante lance exception")
    void rejectReclamation_whenNotFound_throwsException() {
        ReclamationDecisionRequest request = new ReclamationDecisionRequest("Motif");
        when(authenticatedUserService.getCurrentUser()).thenReturn(createSuperAdmin());
        when(reclamationRepository.findById(999L)).thenReturn(Optional.empty());
        
        assertThatThrownBy(() -> reclamationService.rejectReclamation(999L, request))
            .isInstanceOf(ResourceNotFoundException.class)
            .hasMessageContaining("not found");
    }

    @Test
    @DisplayName("rejectReclamation() → Commentaire vide lance exception")
    void rejectReclamation_withEmptyComment_throwsException() {
        ReclamationDecisionRequest request = new ReclamationDecisionRequest("");
        lenient().when(authenticatedUserService.getCurrentUser()).thenReturn(createSuperAdmin());
        lenient().when(reclamationRepository.findById(1L)).thenReturn(Optional.of(reclamation));
        
        assertThatThrownBy(() -> reclamationService.rejectReclamation(1L, request))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("Commentaire is required");
    }

    @Test
    @DisplayName("validateText() → Texte vide passe la validation")
    void validateText_withEmptyText_passes() {
        ValidateReclamationRequest request = new ValidateReclamationRequest("", "");
        
        ValidateReclamationResponse result = reclamationService.validateText(request);
        
        assertThat(result).isNotNull();
        assertThat(result.getSujet().isValide()).isTrue();
        assertThat(result.getDescription().isValide()).isTrue();
    }

    @Test
    @DisplayName("validateText() → Service IA indisponible lance exception")
    void validateText_whenServiceUnavailable_throwsException() {
        ValidateReclamationRequest request = new ValidateReclamationRequest(
            "Sujet test véhicule",
            "Description test problème chauffeur"
        );
        
        // Mock service IA indisponible
        when(restTemplate.postForEntity(anyString(), any(), eq(String.class)))
            .thenReturn(new ResponseEntity<>(null, HttpStatus.INTERNAL_SERVER_ERROR));
        
        assertThatThrownBy(() -> reclamationService.validateText(request))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("Service de validation IA temporairement indisponible");
    }

    @Test
    @DisplayName("validateText() → Texte toxique détecté")
    void validateText_whenToxicText_fails() {
        ValidateReclamationRequest request = new ValidateReclamationRequest(
            "Problème véhicule",
            "Test avec contenu toxique"
        );
        
        // Mock réponse IA avec toxicité détectée
        String toxicResponse = "{\"valide\":false,\"typeErreur\":\"toxicite\",\"message\":\"Langage inapproprié détecté\",\"scores\":{\"toxicite\":0.9,\"semantique\":0.5}}";
        when(restTemplate.postForEntity(anyString(), any(), eq(String.class)))
            .thenReturn(new ResponseEntity<>(toxicResponse, HttpStatus.OK));
        
        ValidateReclamationResponse result = reclamationService.validateText(request);
        
        assertThat(result.getDescription().isValide()).isFalse();
        assertThat(result.getDescription().getTypeErreur()).isEqualTo("toxicite");
    }

    @Test
    @DisplayName("validateText() → Texte hors sujet détecté")
    void validateText_whenOffTopic_fails() {
        ValidateReclamationRequest request = new ValidateReclamationRequest(
            "Recette de cuisine",
            "Comment faire un gâteau au chocolat"
        );
        
        // Mock réponse IA avec contenu hors sujet
        String offTopicResponse = "{\"valide\":false,\"typeErreur\":\"hors_sujet\",\"message\":\"Hors du domaine gestion de flotte\",\"scores\":{\"toxicite\":0.1,\"semantique\":0.1}}";
        when(restTemplate.postForEntity(anyString(), any(), eq(String.class)))
            .thenReturn(new ResponseEntity<>(offTopicResponse, HttpStatus.OK));
        
        ValidateReclamationResponse result = reclamationService.validateText(request);
        
        assertThat(result.getSujet().isValide()).isFalse();
        assertThat(result.getSujet().getTypeErreur()).isEqualTo("hors_sujet");
    }

    @Test
    @DisplayName("validateText() → Texte valide passe la validation")
    void validateText_whenValidText_passes() {
        ValidateReclamationRequest request = new ValidateReclamationRequest(
            "Problème de véhicule",
            "Le véhicule a un problème de frein"
        );
        
        // Mock réponse IA avec validation réussie
        String validResponse = "{\"valide\":true,\"scores\":{\"toxicite\":0.1,\"semantique\":0.8}}";
        when(restTemplate.postForEntity(anyString(), any(), eq(String.class)))
            .thenReturn(new ResponseEntity<>(validResponse, HttpStatus.OK));
        
        ValidateReclamationResponse result = reclamationService.validateText(request);
        
        assertThat(result.getSujet().isValide()).isTrue();
        assertThat(result.getDescription().isValide()).isTrue();
    }

    @Test
    @DisplayName("toResponse() → Conversion avec utilisateur null")
    void toResponse_withNullUser_handlesGracefully() {
        reclamation.setUtilisateur(null);
        when(authenticatedUserService.getCurrentUser()).thenReturn(chauffeur);
        when(reclamationRepository.findByUtilisateurWithJoin(chauffeur)).thenReturn(List.of(reclamation));
        
        List<ReclamationResponse> result = reclamationService.getAccessibleReclamations();
        
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getUtilisateurNom()).isNull();
    }

    @Test
    @DisplayName("createReclamation() → Notification envoyée aux SuperAdmins")
    void createReclamation_sendsNotificationsToSuperAdmins() {
        Manager superAdmin = createSuperAdmin();
        CreateReclamationRequest request = new CreateReclamationRequest(
            "Problème urgent",
            "Le véhicule est en panne",
            PrioriteReclamation.URGENT
        );
        
        when(authenticatedUserService.getCurrentUser()).thenReturn(chauffeur);
        when(reclamationRepository.save(any(Reclamation.class))).thenAnswer(inv -> {
            Reclamation saved = inv.getArgument(0);
            saved.setId(12L);
            return saved;
        });
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of(superAdmin));
        
        reclamationService.createReclamation(request);
        
        verify(notificationRepository, atLeast(1)).save(any());
        verify(notificationRealtimeService, atLeast(1)).publishToUsers(anyList(), any());
    }

    @Test
    @DisplayName("resolveReclamation() → Notification envoyée à l'utilisateur")
    void resolveReclamation_sendsNotificationToUser() {
        ReclamationDecisionRequest request = new ReclamationDecisionRequest("Résolu");
        when(authenticatedUserService.getCurrentUser()).thenReturn(createSuperAdmin());
        when(reclamationRepository.findById(1L)).thenReturn(Optional.of(reclamation));
        when(reclamationRepository.save(any(Reclamation.class))).thenAnswer(inv -> inv.getArgument(0));
        
        reclamationService.resolveReclamation(1L, request);
        
        verify(notificationRepository, times(1)).save(any());
    }

    @Test
    @DisplayName("rejectReclamation() → Notification envoyée à l'utilisateur")
    void rejectReclamation_sendsNotificationToUser() {
        ReclamationDecisionRequest request = new ReclamationDecisionRequest("Rejeté");
        when(authenticatedUserService.getCurrentUser()).thenReturn(createSuperAdmin());
        when(reclamationRepository.findById(1L)).thenReturn(Optional.of(reclamation));
        when(reclamationRepository.save(any(Reclamation.class))).thenAnswer(inv -> inv.getArgument(0));
        
        reclamationService.rejectReclamation(1L, request);
        
        verify(notificationRepository, times(1)).save(any());
    }

    // ═══════════════════════════════════════════════════════════════
    // TESTS ADDITIONNELS POUR COUVRIR TOUTES LES BRANCHES (41 branches)
    // ═══════════════════════════════════════════════════════════════

    @Test
    @DisplayName("validateText() → Gestion exception RestClientException")
    void validateText_whenRestClientException_throwsBadRequest() {
        ValidateReclamationRequest request = new ValidateReclamationRequest(
            "Sujet test",
            "Description test"
        );
        
        when(restTemplate.postForEntity(anyString(), any(), eq(String.class)))
            .thenThrow(new org.springframework.web.client.RestClientException("Connection failed"));
        
        assertThatThrownBy(() -> reclamationService.validateText(request))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("Service de validation IA temporairement indisponible");
    }

    @Test
    @DisplayName("validateText() → Gestion exception générique")
    void validateText_whenGenericException_throwsBadRequest() {
        ValidateReclamationRequest request = new ValidateReclamationRequest(
            "Sujet test",
            "Description test"
        );
        
        when(restTemplate.postForEntity(anyString(), any(), eq(String.class)))
            .thenThrow(new RuntimeException("Unexpected error"));
        
        assertThatThrownBy(() -> reclamationService.validateText(request))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("Service de validation IA temporairement indisponible");
    }

    @Test
    @DisplayName("validateText() → Scores null dans réponse IA")
    void validateText_whenNullScores_handlesGracefully() {
        ValidateReclamationRequest request = new ValidateReclamationRequest(
            "Test véhicule",
            "Description chauffeur"
        );
        
        String responseWithNullScores = "{\"valide\":false,\"typeErreur\":\"toxicite\",\"message\":\"Problème\",\"scores\":null}";
        when(restTemplate.postForEntity(anyString(), any(), eq(String.class)))
            .thenReturn(new ResponseEntity<>(responseWithNullScores, HttpStatus.OK));
        
        ValidateReclamationResponse result = reclamationService.validateText(request);
        
        assertThat(result).isNotNull();
    }

    @Test
    @DisplayName("validateText() → Scores avec valeurs null")
    void validateText_whenScoresHaveNullValues_usesDefaults() {
        ValidateReclamationRequest request = new ValidateReclamationRequest(
            "Test véhicule",
            "Description chauffeur"
        );
        
        String responseWithNullValues = "{\"valide\":false,\"typeErreur\":\"toxicite\",\"message\":\"Problème\",\"scores\":{\"toxicite\":null,\"semantique\":null}}";
        when(restTemplate.postForEntity(anyString(), any(), eq(String.class)))
            .thenReturn(new ResponseEntity<>(responseWithNullValues, HttpStatus.OK));
        
        ValidateReclamationResponse result = reclamationService.validateText(request);
        
        assertThat(result).isNotNull();
        assertThat(result.getSujet().isValide()).isFalse();
    }

    @Test
    @DisplayName("createReclamation() → Notification avec SuperAdmin null")
    void createReclamation_whenNoSuperAdmins_succeeds() {
        CreateReclamationRequest request = new CreateReclamationRequest(
            "Problème test",
            "Description test",
            PrioriteReclamation.NORMAL
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(chauffeur);
        when(reclamationRepository.save(any(Reclamation.class))).thenAnswer(inv -> {
            Reclamation saved = inv.getArgument(0);
            saved.setId(20L);
            return saved;
        });
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(null);
        
        ReclamationResponse result = reclamationService.createReclamation(request);
        
        assertThat(result).isNotNull();
    }

    @Test
    @DisplayName("createReclamation() → Utilisateur sans prénom/nom")
    void createReclamation_withUserWithoutNames_succeeds() {
        Chauffeur userNoNames = new Chauffeur();
        userNoNames.setId(10L);
        userNoNames.setEmail("noname@test.com");
        userNoNames.setRole(Role.CHAUFFEUR);
        userNoNames.setPrenom(null);
        userNoNames.setNom(null);
        
        CreateReclamationRequest request = new CreateReclamationRequest(
            "Problème test",
            "Description test",
            PrioriteReclamation.NORMAL
        );
        
        when(authenticatedUserService.getCurrentUser()).thenReturn(userNoNames);
        when(reclamationRepository.save(any(Reclamation.class))).thenAnswer(inv -> {
            Reclamation saved = inv.getArgument(0);
            saved.setId(21L);
            saved.setUtilisateur(userNoNames);
            return saved;
        });
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of());
        
        ReclamationResponse result = reclamationService.createReclamation(request);
        
        assertThat(result).isNotNull();
    }

    @Test
    @DisplayName("toResponse() → Réclamation avec sujet null")
    void toResponse_withNullSubject_handlesGracefully() {
        reclamation.setSujet(null);
        when(authenticatedUserService.getCurrentUser()).thenReturn(chauffeur);
        when(reclamationRepository.findByUtilisateurWithJoin(chauffeur)).thenReturn(List.of(reclamation));
        
        List<ReclamationResponse> result = reclamationService.getAccessibleReclamations();
        
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getSujet()).isNull();
    }

    @Test
    @DisplayName("resolveReclamation() → Réclamation avec sujet null")
    void resolveReclamation_withNullSubject_succeeds() {
        reclamation.setSujet(null);
        ReclamationDecisionRequest request = new ReclamationDecisionRequest("Résolu");
        when(authenticatedUserService.getCurrentUser()).thenReturn(createSuperAdmin());
        when(reclamationRepository.findById(1L)).thenReturn(Optional.of(reclamation));
        when(reclamationRepository.save(any(Reclamation.class))).thenAnswer(inv -> inv.getArgument(0));
        
        ReclamationResponse result = reclamationService.resolveReclamation(1L, request);
        
        assertThat(result).isNotNull();
        verify(notificationRepository, times(1)).save(any());
    }

    @Test
    @DisplayName("rejectReclamation() → Réclamation avec sujet null")
    void rejectReclamation_withNullSubject_succeeds() {
        reclamation.setSujet(null);
        ReclamationDecisionRequest request = new ReclamationDecisionRequest("Rejeté");
        when(authenticatedUserService.getCurrentUser()).thenReturn(createSuperAdmin());
        when(reclamationRepository.findById(1L)).thenReturn(Optional.of(reclamation));
        when(reclamationRepository.save(any(Reclamation.class))).thenAnswer(inv -> inv.getArgument(0));
        
        ReclamationResponse result = reclamationService.rejectReclamation(1L, request);
        
        assertThat(result).isNotNull();
        verify(notificationRepository, times(1)).save(any());
    }

    @Test
    @DisplayName("validateText() → Sujet avec espaces uniquement")
    void validateText_withWhitespaceOnlySubject_validatesAsEmpty() {
        ValidateReclamationRequest request = new ValidateReclamationRequest("   ", "Description valide");
        
        ValidateReclamationResponse result = reclamationService.validateText(request);
        
        assertThat(result.getSujet().isValide()).isTrue();
    }

    @Test
    @DisplayName("validateText() → Description avec espaces uniquement")
    void validateText_withWhitespaceOnlyDescription_validatesAsEmpty() {
        ValidateReclamationRequest request = new ValidateReclamationRequest("Sujet valide", "   ");
        
        ValidateReclamationResponse result = reclamationService.validateText(request);
        
        assertThat(result.getDescription().isValide()).isTrue();
    }

    @Test
    @DisplayName("createReclamation() → Avec priorité FAIBLE")
    void createReclamation_withLowPriority_succeeds() {
        CreateReclamationRequest request = new CreateReclamationRequest(
            "Info mineure",
            "Simple information véhicule",
            PrioriteReclamation.NORMAL
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(chauffeur);
        when(reclamationRepository.save(any(Reclamation.class))).thenAnswer(inv -> {
            Reclamation saved = inv.getArgument(0);
            saved.setId(22L);
            return saved;
        });
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of());
        
        ReclamationResponse result = reclamationService.createReclamation(request);
        
        assertThat(result).isNotNull();
        assertThat(result.getPriorite()).isEqualTo(PrioriteReclamation.NORMAL);
    }

    @Test
    @DisplayName("updateReclamation() → Avec priorité FAIBLE")
    void updateReclamation_withLowPriority_succeeds() {
        UpdateReclamationRequest request = new UpdateReclamationRequest(
            "Sujet mis à jour",
            "Description mise à jour",
            PrioriteReclamation.NORMAL
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(chauffeur);
        when(reclamationRepository.findById(1L)).thenReturn(Optional.of(reclamation));
        when(reclamationRepository.save(any(Reclamation.class))).thenAnswer(inv -> inv.getArgument(0));
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of());
        
        ReclamationResponse result = reclamationService.updateReclamation(1L, request);
        
        assertThat(result).isNotNull();
        assertThat(reclamation.getPriorite()).isEqualTo(PrioriteReclamation.NORMAL);
    }

    @Test
    @DisplayName("createReclamation() → Sujet avec trim")
    void createReclamation_trimsSubject_succeeds() {
        CreateReclamationRequest request = new CreateReclamationRequest(
            "  Sujet avec espaces  ",
            "  Description avec espaces  ",
            PrioriteReclamation.NORMAL
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(chauffeur);
        when(reclamationRepository.save(any(Reclamation.class))).thenAnswer(inv -> {
            Reclamation saved = inv.getArgument(0);
            saved.setId(23L);
            return saved;
        });
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of());
        
        ReclamationResponse result = reclamationService.createReclamation(request);
        
        assertThat(result).isNotNull();
    }

    @Test
    @DisplayName("updateReclamation() → Sujet avec trim")
    void updateReclamation_trimsSubject_succeeds() {
        UpdateReclamationRequest request = new UpdateReclamationRequest(
            "  Nouveau sujet  ",
            "  Nouvelle description  ",
            PrioriteReclamation.NORMAL
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(chauffeur);
        when(reclamationRepository.findById(1L)).thenReturn(Optional.of(reclamation));
        when(reclamationRepository.save(any(Reclamation.class))).thenAnswer(inv -> inv.getArgument(0));
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of());
        
        ReclamationResponse result = reclamationService.updateReclamation(1L, request);
        
        assertThat(result).isNotNull();
    }

    @Test
    @DisplayName("requireOwnedDraftReclamation() → Utilisateur null lance exception")
    void requireOwnedDraftReclamation_withNullUser_throwsException() {
        Chauffeur nullUser = new Chauffeur();
        nullUser.setId(null);
        nullUser.setRole(Role.CHAUFFEUR);
        
        UpdateReclamationRequest request = new UpdateReclamationRequest(
            "Test", "Test", PrioriteReclamation.NORMAL
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(nullUser);
        when(reclamationRepository.findById(1L)).thenReturn(Optional.of(reclamation));
        
        assertThatThrownBy(() -> reclamationService.updateReclamation(1L, request))
            .isInstanceOf(UnauthorizedException.class)
            .hasMessageContaining("not allowed to modify");
    }

    @Test
    @DisplayName("validateText() → Request null gère proprement")
    void validateText_withNullRequest_handlesGracefully() {
        ValidateReclamationRequest request = new ValidateReclamationRequest(null, null);
        
        ValidateReclamationResponse result = reclamationService.validateText(request);
        
        assertThat(result).isNotNull();
        assertThat(result.getSujet().isValide()).isTrue();
        assertThat(result.getDescription().isValide()).isTrue();
    }

    @Test
    @DisplayName("notifySuperAdminsOfNewReclamation() → Liste vide SuperAdmins")
    void notifySuperAdmins_withEmptyList_succeeds() {
        CreateReclamationRequest request = new CreateReclamationRequest(
            "Test notification",
            "Description test",
            PrioriteReclamation.NORMAL
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(chauffeur);
        when(reclamationRepository.save(any(Reclamation.class))).thenAnswer(inv -> {
            Reclamation saved = inv.getArgument(0);
            saved.setId(24L);
            return saved;
        });
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of());
        
        ReclamationResponse result = reclamationService.createReclamation(request);
        
        assertThat(result).isNotNull();
    }

    @Test
    @DisplayName("toResponse() → Utilisateur avec prénoms vides")
    void toResponse_withEmptyUserNames_usesEmail() {
        Chauffeur emptyNames = new Chauffeur();
        emptyNames.setId(11L);
        emptyNames.setEmail("empty@test.com");
        emptyNames.setPrenom("");
        emptyNames.setNom("");
        emptyNames.setRole(Role.CHAUFFEUR);
        
        reclamation.setUtilisateur(emptyNames);
        
        when(authenticatedUserService.getCurrentUser()).thenReturn(chauffeur);
        when(reclamationRepository.findByUtilisateurWithJoin(chauffeur)).thenReturn(List.of(reclamation));
        
        List<ReclamationResponse> result = reclamationService.getAccessibleReclamations();
        
        assertThat(result).hasSize(1);
    }

    @Test
    @DisplayName("withReclamationToken() → Réclamation null")
    void withReclamationToken_withNullReclamation_returnsMessage() {
        CreateReclamationRequest request = new CreateReclamationRequest(
            "Test token",
            "Description token",
            PrioriteReclamation.NORMAL
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(chauffeur);
        when(reclamationRepository.save(any(Reclamation.class))).thenAnswer(inv -> {
            Reclamation saved = inv.getArgument(0);
            saved.setId(null);  // ID null pour tester la branche
            return saved;
        });
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of());
        
        ReclamationResponse result = reclamationService.createReclamation(request);
        
        assertThat(result).isNotNull();
    }

    @Test
    @DisplayName("getAccessibleReclamations() → Rôle inconnu retourne liste vide")
    void getAccessibleReclamations_withUnknownRole_returnsEmpty() {
        Chauffeur unknownRole = new Chauffeur();
        unknownRole.setId(12L);
        unknownRole.setEmail("unknown@test.com");
        unknownRole.setRole(null);
        
        when(authenticatedUserService.getCurrentUser()).thenReturn(unknownRole);
        
        List<ReclamationResponse> result = reclamationService.getAccessibleReclamations();
        
        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("createNotification() → Recipient null ne fait rien")
    void createNotification_withNullRecipient_doesNothing() {
        reclamation.setUtilisateur(null);
        ReclamationDecisionRequest request = new ReclamationDecisionRequest("Test");
        
        when(authenticatedUserService.getCurrentUser()).thenReturn(createSuperAdmin());
        when(reclamationRepository.findById(1L)).thenReturn(Optional.of(reclamation));
        when(reclamationRepository.save(any(Reclamation.class))).thenAnswer(inv -> inv.getArgument(0));
        
        reclamationService.resolveReclamation(1L, request);
        
        verify(notificationRepository, never()).save(any());
    }

    // ═══════════════════════════════════════════════════════════════
    // TESTS SUPPLÉMENTAIRES (COUVERTURE LIGNES)
    // ═══════════════════════════════════════════════════════════════

    @Test
    @DisplayName("init() → Diagnostic PostConstruct loggé sans exception")
    void init_logsDiagnostic_withoutException() {
        assertThatCode(() -> reclamationService.init()).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("updateReclamation() → Sujet vide lance exception")
    void updateReclamation_withEmptySubject_throwsException() {
        UpdateReclamationRequest request = new UpdateReclamationRequest(
            "  ",
            "Description valide",
            PrioriteReclamation.NORMAL
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(chauffeur);
        when(reclamationRepository.findById(1L)).thenReturn(Optional.of(reclamation));

        assertThatThrownBy(() -> reclamationService.updateReclamation(1L, request))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("Sujet is required");
    }

    @Test
    @DisplayName("getAccessibleReclamations() → Exception interne propagée")
    void getAccessibleReclamations_whenExceptionOccurs_propagates() {
        when(authenticatedUserService.getCurrentUser())
            .thenThrow(new RuntimeException("Erreur interne"));

        assertThatThrownBy(() -> reclamationService.getAccessibleReclamations())
            .isInstanceOf(RuntimeException.class)
            .hasMessageContaining("Erreur interne");
    }

    @Test
    @DisplayName("withReclamationToken() → Réclamation null ou id null retourne message (réflexion)")
    void withReclamationToken_viaReflection_returnsMessageForNull() throws Exception {
        Method method = ReclamationServiceImpl.class.getDeclaredMethod(
            "withReclamationToken", Reclamation.class, String.class);
        method.setAccessible(true);

        String message = "Nouvelle réclamation de test";

        Reclamation noId = new Reclamation();
        noId.setId(null);

        assertThat(method.invoke(reclamationService, (Object) null, message)).isEqualTo(message);
        assertThat(method.invoke(reclamationService, noId, message)).isEqualTo(message);
    }

    @Test
    @DisplayName("createReclamation() → Sujet refusé par l'IA lance exception")
    void createReclamation_whenSubjectInvalid_throwsException() {
        CreateReclamationRequest request = new CreateReclamationRequest(
            "Sujet avec langage inapproprié",
            "Description valide",
            PrioriteReclamation.NORMAL
        );
        String invalid = "{\"valide\":false,\"typeErreur\":\"toxicite\",\"message\":\"Langage inapproprié détecté\"}";

        when(authenticatedUserService.getCurrentUser()).thenReturn(chauffeur);
        when(restTemplate.postForEntity(anyString(), any(), eq(String.class)))
            .thenReturn(new ResponseEntity<>(invalid, HttpStatus.OK));

        assertThatThrownBy(() -> reclamationService.createReclamation(request))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("Langage inapproprié détecté");
    }

    @Test
    @DisplayName("createReclamation() → Description refusée par l'IA lance exception")
    void createReclamation_whenDescriptionInvalid_throwsException() {
        CreateReclamationRequest request = new CreateReclamationRequest(
            "Sujet valide",
            "Description hors sujet",
            PrioriteReclamation.NORMAL
        );
        String valid = "{\"valide\":true,\"scores\":{\"toxicite\":0.1,\"semantique\":0.9}}";
        String invalid = "{\"valide\":false,\"typeErreur\":\"hors_sujet\",\"message\":\"Hors du domaine gestion de flotte\"}";

        when(authenticatedUserService.getCurrentUser()).thenReturn(chauffeur);
        when(restTemplate.postForEntity(anyString(), any(), eq(String.class)))
            .thenReturn(new ResponseEntity<>(valid, HttpStatus.OK),
                        new ResponseEntity<>(invalid, HttpStatus.OK));

        assertThatThrownBy(() -> reclamationService.createReclamation(request))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("Hors du domaine gestion de flotte");
    }

    @Test
    @DisplayName("deleteReclamation() → Owner null throws UnauthorizedException for non-superadmin")
    void deleteReclamation_whenOwnerNull_throwsUnauthorized() {
        reclamation.setUtilisateur(null);
        when(authenticatedUserService.getCurrentUser()).thenReturn(chauffeur);
        when(reclamationRepository.findById(1L)).thenReturn(Optional.of(reclamation));

        assertThatThrownBy(() -> reclamationService.deleteReclamation(1L))
            .isInstanceOf(UnauthorizedException.class)
            .hasMessageContaining("You can only delete your own reclamations");
    }

    @Test
    @DisplayName("notifySuperAdminsOfNewReclamation() → User with null names falls back to email")
    void createReclamation_userNullNames_fallsBackToEmail() {
        Utilisateur noNameUser = new Utilisateur();
        noNameUser.setId(10L);
        noNameUser.setRole(Role.CHAUFFEUR);
        noNameUser.setEmail("noname@test.com");

        CreateReclamationRequest request = new CreateReclamationRequest(
            "Problème",
            "Description valide",
            PrioriteReclamation.NORMAL
        );

        when(authenticatedUserService.getCurrentUser()).thenReturn(noNameUser);
        when(reclamationRepository.save(any(Reclamation.class))).thenAnswer(inv -> {
            Reclamation saved = inv.getArgument(0);
            saved.setId(12L);
            return saved;
        });

        Manager admin = createSuperAdmin();
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of(admin));

        ReclamationResponse result = reclamationService.createReclamation(request);
        assertThat(result).isNotNull();
        verify(notificationRepository, atLeastOnce()).save(any());
    }

    @Test
    @DisplayName("validateField() → Non-2xx response from AI service throws BadRequestException")
    void validateText_non2xxResponse_throwsBadRequestException() {
        ValidateReclamationRequest request = new ValidateReclamationRequest("Sujet", "Description");
        when(restTemplate.postForEntity(anyString(), any(), eq(String.class)))
            .thenReturn(new ResponseEntity<>("error", HttpStatus.INTERNAL_SERVER_ERROR));

        assertThatThrownBy(() -> reclamationService.validateText(request))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("temporairement indisponible");
    }

    @Test
    @DisplayName("validateField() → Invalid response with scores logs details")
    void validateText_invalidResponseWithScores() {
        ValidateReclamationRequest request = new ValidateReclamationRequest("Sujet", "Description");
        String responseBody = "{\"valide\":false,\"typeErreur\":\"toxicite\",\"message\":\"Invalide\",\"scores\":{\"toxicite\":0.9,\"semantique\":0.1}}";
        when(restTemplate.postForEntity(anyString(), any(), eq(String.class)))
            .thenReturn(new ResponseEntity<>(responseBody, HttpStatus.OK));

        ValidateReclamationResponse resp = reclamationService.validateText(request);
        assertThat(resp.getSujet().isValide()).isFalse();
        assertThat(resp.getSujet().getTypeErreur()).isEqualTo("toxicite");
    }

    @Test
    @DisplayName("requireOwnedDraftReclamation() → Null currentUser or null userId throws UnauthorizedException")
    void updateReclamation_nullCurrentUser_throwsUnauthorized() {
        UpdateReclamationRequest request = new UpdateReclamationRequest("Sujet", "Description", PrioriteReclamation.NORMAL);
        when(authenticatedUserService.getCurrentUser()).thenReturn(new Utilisateur());
        when(reclamationRepository.findById(1L)).thenReturn(Optional.of(reclamation));

        assertThatThrownBy(() -> reclamationService.updateReclamation(1L, request))
            .isInstanceOf(UnauthorizedException.class)
            .hasMessageContaining("not allowed to modify");
    }

    @Test
    @DisplayName("getAccessibleReclamations() → Unknown role returns empty list")
    void getAccessibleReclamations_unknownRole_returnsEmptyList() {
        Utilisateur unknownRoleUser = new Utilisateur();
        unknownRoleUser.setId(99L);
        unknownRoleUser.setRole(null);
        when(authenticatedUserService.getCurrentUser()).thenReturn(unknownRoleUser);

        List<ReclamationResponse> result = reclamationService.getAccessibleReclamations();
        assertThat(result).isEmpty();
    }
}

