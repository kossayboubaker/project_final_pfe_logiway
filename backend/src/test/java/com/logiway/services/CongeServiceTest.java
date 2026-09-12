package com.logiway.services;

import com.logiway.dto.request.CongeDecisionRequest;
import com.logiway.dto.request.CreateCongeRequest;
import com.logiway.dto.request.UpdateCongeRequest;
import com.logiway.dto.response.ApiMessageResponse;
import com.logiway.dto.response.CongeResponse;
import com.logiway.entities.*;
import com.logiway.entities.enums.*;
import com.logiway.exceptions.BadRequestException;
import com.logiway.exceptions.ResourceNotFoundException;
import com.logiway.exceptions.UnauthorizedException;
import com.logiway.repositories.*;
import com.logiway.security.AuthenticatedUserService;
import com.logiway.services.impl.CongeServiceImpl;
import com.logiway.services.impl.GoogleCalendarLeaveSyncService;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.mockito.Mockito.lenient;

/**
 * Tests unitaires du service Congé.
 * Valide la gestion des demandes de congé, approbation, et workflow.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("Service Congé — Tests Unitaires")
class CongeServiceTest {

    @Mock private CongeRepository congeRepository;
    @Mock private UtilisateurRepository utilisateurRepository;
    @Mock private NotificationRepository notificationRepository;
    @Mock private NotificationRealtimeService notificationRealtimeService;
    @Mock private AuthenticatedUserService authenticatedUserService;
    @Mock private GoogleCalendarLeaveSyncService googleCalendarLeaveSyncService;

    @InjectMocks
    private CongeServiceImpl congeService;

    private Chauffeur chauffeur;
    private Manager manager;
    private Manager superAdmin;
    private Conge conge;

    @BeforeEach
    void setUp() {
        manager = new Manager();
        manager.setId(1L);
        manager.setEmail("manager@test.com");
        manager.setPrenom("Manager");
        manager.setNom("Test");
        manager.setRole(Role.MANAGER);

        chauffeur = new Chauffeur();
        chauffeur.setId(2L);
        chauffeur.setEmail("chauffeur@test.com");
        chauffeur.setPrenom("Jean");
        chauffeur.setNom("Dupont");
        chauffeur.setRole(Role.CHAUFFEUR);
        chauffeur.setManager(manager);

        superAdmin = new Manager();
        superAdmin.setId(3L);
        superAdmin.setEmail("superadmin@test.com");
        superAdmin.setRole(Role.SUPERADMIN);

        conge = new Conge();
        conge.setId(1L);
        conge.setType(TypeConge.VACANCES);
        conge.setDateDebut(LocalDate.now().plusDays(7));
        conge.setDateFin(LocalDate.now().plusDays(14));
        conge.setMotif("Vacances d'été");
        conge.setStatut(StatutConge.EN_ATTENTE);
        conge.setChauffeur(chauffeur);
        conge.setManager(manager);
    }

    @Test
    @DisplayName("createConge() → Chauffeur crée demande de congé")
    void createConge_byChauffeur_succeeds() {
        CreateCongeRequest request = new CreateCongeRequest(
            TypeConge.VACANCES,
            LocalDate.now().plusDays(10),
            LocalDate.now().plusDays(15),
            "Vacances familiales"
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(chauffeur);
        when(congeRepository.existsByChauffeur_IdAndStatut(2L, StatutConge.EN_ATTENTE)).thenReturn(false);
        when(congeRepository.save(any(Conge.class))).thenAnswer(inv -> {
            Conge saved = inv.getArgument(0);
            saved.setId(10L);
            return saved;
        });
        CongeResponse result = congeService.createConge(request);
        assertThat(result).isNotNull();
        assertThat(result.motif()).isEqualTo("Vacances familiales");
        assertThat(result.statut()).isEqualTo(StatutConge.EN_ATTENTE);
        verify(congeRepository, times(1)).save(any(Conge.class));
    }

    @Test
    @DisplayName("createConge() → Date fin avant date début lance exception")
    void createConge_withInvalidDates_throwsException() {
        CreateCongeRequest request = new CreateCongeRequest(
            TypeConge.VACANCES,
            LocalDate.now().plusDays(15),
            LocalDate.now().plusDays(10),
            "Dates invalides"
        );
        lenient().when(authenticatedUserService.getCurrentUser()).thenReturn(chauffeur);
        lenient().when(congeRepository.existsByChauffeur_IdAndStatut(2L, StatutConge.EN_ATTENTE)).thenReturn(false);
        assertThatThrownBy(() -> congeService.createConge(request))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("end date must be on or after");
    }

    @Test
    @DisplayName("createConge() → Demande en attente existante lance exception")
    void createConge_withPendingLeave_throwsException() {
        CreateCongeRequest request = new CreateCongeRequest(
            TypeConge.VACANCES,
            LocalDate.now().plusDays(10),
            LocalDate.now().plusDays(15),
            "Deuxième demande"
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(chauffeur);
        when(congeRepository.existsByChauffeur_IdAndStatut(2L, StatutConge.EN_ATTENTE)).thenReturn(true);
        assertThatThrownBy(() -> congeService.createConge(request))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("already have a pending leave");
    }

    @Test
    @DisplayName("createConge() → Chauffeur sans manager lance exception")
    void createConge_whenNoManager_throwsException() {
        chauffeur.setManager(null);
        CreateCongeRequest request = new CreateCongeRequest(
            TypeConge.VACANCES,
            LocalDate.now().plusDays(10),
            LocalDate.now().plusDays(15),
            "Vacances"
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(chauffeur);
        when(congeRepository.existsByChauffeur_IdAndStatut(2L, StatutConge.EN_ATTENTE)).thenReturn(false);
        assertThatThrownBy(() -> congeService.createConge(request))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("must be assigned to a manager");
    }

    @Test
    @DisplayName("updateConge() → Propriétaire modifie sa demande")
    void updateConge_byOwner_succeeds() {
        UpdateCongeRequest request = new UpdateCongeRequest(
            TypeConge.MALADIE,
            LocalDate.now().plusDays(5),
            LocalDate.now().plusDays(10),
            "Arrêt maladie"
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(chauffeur);
        when(congeRepository.findById(1L)).thenReturn(Optional.of(conge));
        when(congeRepository.save(any(Conge.class))).thenAnswer(inv -> inv.getArgument(0));
        CongeResponse result = congeService.updateConge(1L, request);
        assertThat(result).isNotNull();
        assertThat(conge.getType()).isEqualTo(TypeConge.MALADIE);
        assertThat(conge.getMotif()).isEqualTo("Arrêt maladie");
        verify(congeRepository, times(1)).save(conge);
    }

    @Test
    @DisplayName("approveConge() → Manager approuve congé de son chauffeur")
    void approveConge_byManager_succeeds() {
        CongeDecisionRequest request = new CongeDecisionRequest("Approuvé", null);
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(congeRepository.findById(1L)).thenReturn(Optional.of(conge));
        when(congeRepository.save(any(Conge.class))).thenAnswer(inv -> inv.getArgument(0));
        when(googleCalendarLeaveSyncService.syncApprovedLeave(any())).thenReturn(Optional.of("cal-event-123"));
        CongeResponse result = congeService.approveConge(1L, request);
        assertThat(result).isNotNull();
        assertThat(conge.getStatut()).isEqualTo(StatutConge.APPROUVE);
        assertThat(conge.getCommentaireValidation()).isEqualTo("Approuvé");
        verify(congeRepository, times(2)).save(conge);
    }

    @Test
    @DisplayName("rejectConge() → Manager rejette congé de son chauffeur")
    void rejectConge_byManager_succeeds() {
        CongeDecisionRequest request = new CongeDecisionRequest("Période chargée", null);
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(congeRepository.findById(1L)).thenReturn(Optional.of(conge));
        when(congeRepository.save(any(Conge.class))).thenAnswer(inv -> inv.getArgument(0));
        CongeResponse result = congeService.rejectConge(1L, request);
        assertThat(result).isNotNull();
        assertThat(conge.getStatut()).isEqualTo(StatutConge.REJETE);
        assertThat(conge.getCommentaireValidation()).isEqualTo("Période chargée");
        verify(congeRepository, times(1)).save(conge);
    }

    @Test
    @DisplayName("deleteConge() → Propriétaire supprime sa demande en attente")
    void deleteConge_whenPending_deletesRequest() {
        when(authenticatedUserService.getCurrentUser()).thenReturn(chauffeur);
        when(congeRepository.findById(1L)).thenReturn(Optional.of(conge));
        ApiMessageResponse result = congeService.deleteConge(1L);
        assertThat(result.message()).contains("supprimée");
        verify(congeRepository, times(1)).delete(conge);
    }

    @Test
    @DisplayName("deleteConge() → Propriétaire annule congé approuvé")
    void deleteConge_whenApproved_cancelsLeave() {
        conge.setStatut(StatutConge.APPROUVE);
        conge.setCalendarEventId("cal-event-123");
        when(authenticatedUserService.getCurrentUser()).thenReturn(chauffeur);
        when(congeRepository.findById(1L)).thenReturn(Optional.of(conge));
        when(congeRepository.save(any(Conge.class))).thenAnswer(inv -> inv.getArgument(0));
        ApiMessageResponse result = congeService.deleteConge(1L);
        assertThat(result.message()).contains("annulé");
        assertThat(conge.getStatut()).isEqualTo(StatutConge.ANNULE);
        verify(googleCalendarLeaveSyncService, times(1)).deleteLeaveEvent(conge);
        verify(congeRepository, times(1)).save(conge);
    }

    @Test
    @DisplayName("getAccessibleConges() → SuperAdmin voit tous les congés")
    void getAccessibleConges_asSuperAdmin_returnsAll() {
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(congeRepository.findAll()).thenReturn(List.of(conge));
        List<CongeResponse> result = congeService.getAccessibleConges();
        assertThat(result).hasSize(1);
        verify(congeRepository, times(1)).findAll();
    }

    // ═══════════════════════════════════════════════════════════════
    // TESTS ADDITIONNELS POUR 100% COUVERTURE
    // ═══════════════════════════════════════════════════════════════

    @Test
    @DisplayName("getAccessibleConges() → Manager voit ses congés et ceux de ses chauffeurs")
    void getAccessibleConges_asManager_returnsTeamLeaves() {
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(congeRepository.findByManager_IdOrderByDateDebutDesc(1L)).thenReturn(List.of(conge));
        when(congeRepository.findByChauffeur_Manager_IdOrderByDateDebutDesc(1L)).thenReturn(List.of());
        
        List<CongeResponse> result = congeService.getAccessibleConges();
        
        assertThat(result).hasSize(1);
        verify(congeRepository, times(1)).findByManager_IdOrderByDateDebutDesc(1L);
    }

    @Test
    @DisplayName("getAccessibleConges() → Chauffeur voit uniquement ses congés")
    void getAccessibleConges_asChauffeur_returnsOwnLeaves() {
        when(authenticatedUserService.getCurrentUser()).thenReturn(chauffeur);
        when(congeRepository.findByChauffeur_IdOrderByDateDebutDesc(2L)).thenReturn(List.of(conge));
        
        List<CongeResponse> result = congeService.getAccessibleConges();
        
        assertThat(result).hasSize(1);
        verify(congeRepository, times(1)).findByChauffeur_IdOrderByDateDebutDesc(2L);
    }

    @Test
    @DisplayName("createConge() → Manager crée demande de congé")
    void createConge_byManager_succeeds() {
        CreateCongeRequest request = new CreateCongeRequest(
            TypeConge.MARIAGE,
            LocalDate.now().plusDays(20),
            LocalDate.now().plusDays(25),
            "Mariage"
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(congeRepository.existsByManager_IdAndStatut(1L, StatutConge.EN_ATTENTE)).thenReturn(false);
        when(congeRepository.save(any(Conge.class))).thenAnswer(inv -> {
            Conge saved = inv.getArgument(0);
            saved.setId(20L);
            return saved;
        });
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of(superAdmin));
        
        CongeResponse result = congeService.createConge(request);
        
        assertThat(result).isNotNull();
        assertThat(result.type()).isEqualTo(TypeConge.MARIAGE);
        verify(congeRepository, times(1)).save(any(Conge.class));
    }

    @Test
    @DisplayName("createConge() → SuperAdmin ne peut pas créer de congé")
    void createConge_bySuperAdmin_throwsException() {
        CreateCongeRequest request = new CreateCongeRequest(
            TypeConge.VACANCES,
            LocalDate.now().plusDays(10),
            LocalDate.now().plusDays(15),
            "Test"
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        
        assertThatThrownBy(() -> congeService.createConge(request))
            .isInstanceOf(UnauthorizedException.class)
            .hasMessageContaining("Only managers and drivers");
    }

    @Test
    @DisplayName("createConge() → Date début null lance exception")
    void createConge_withNullStartDate_throwsException() {
        CreateCongeRequest request = new CreateCongeRequest(
            TypeConge.VACANCES,
            null,
            LocalDate.now().plusDays(15),
            "Test"
        );
        lenient().when(authenticatedUserService.getCurrentUser()).thenReturn(chauffeur);
        lenient().when(congeRepository.existsByChauffeur_IdAndStatut(2L, StatutConge.EN_ATTENTE)).thenReturn(false);
        
        assertThatThrownBy(() -> congeService.createConge(request))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("Leave dates are required");
    }

    @Test
    @DisplayName("createConge() → Date fin null lance exception")
    void createConge_withNullEndDate_throwsException() {
        CreateCongeRequest request = new CreateCongeRequest(
            TypeConge.VACANCES,
            LocalDate.now().plusDays(10),
            null,
            "Test"
        );
        lenient().when(authenticatedUserService.getCurrentUser()).thenReturn(chauffeur);
        lenient().when(congeRepository.existsByChauffeur_IdAndStatut(2L, StatutConge.EN_ATTENTE)).thenReturn(false);
        
        assertThatThrownBy(() -> congeService.createConge(request))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("Leave dates are required");
    }

    @Test
    @DisplayName("createConge() → Manager avec demande en attente lance exception")
    void createConge_byManagerWithPendingLeave_throwsException() {
        CreateCongeRequest request = new CreateCongeRequest(
            TypeConge.VACANCES,
            LocalDate.now().plusDays(10),
            LocalDate.now().plusDays(15),
            "Deuxième demande"
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(congeRepository.existsByManager_IdAndStatut(1L, StatutConge.EN_ATTENTE)).thenReturn(true);
        
        assertThatThrownBy(() -> congeService.createConge(request))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("already have a pending leave");
    }

    @Test
    @DisplayName("updateConge() → Congé inexistant lance exception")
    void updateConge_whenNotFound_throwsException() {
        UpdateCongeRequest request = new UpdateCongeRequest(
            TypeConge.MALADIE,
            LocalDate.now().plusDays(5),
            LocalDate.now().plusDays(10),
            "Test"
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(chauffeur);
        when(congeRepository.findById(999L)).thenReturn(Optional.empty());
        
        assertThatThrownBy(() -> congeService.updateConge(999L, request))
            .isInstanceOf(ResourceNotFoundException.class)
            .hasMessageContaining("Leave request not found");
    }

    @Test
    @DisplayName("updateConge() → Non-propriétaire ne peut pas modifier")
    void updateConge_byNonOwner_throwsException() {
        UpdateCongeRequest request = new UpdateCongeRequest(
            TypeConge.MALADIE,
            LocalDate.now().plusDays(5),
            LocalDate.now().plusDays(10),
            "Test"
        );
        Manager autreManager = new Manager();
        autreManager.setId(99L);
        autreManager.setRole(Role.MANAGER);
        
        when(authenticatedUserService.getCurrentUser()).thenReturn(autreManager);
        when(congeRepository.findById(1L)).thenReturn(Optional.of(conge));
        
        assertThatThrownBy(() -> congeService.updateConge(1L, request))
            .isInstanceOf(UnauthorizedException.class)
            .hasMessageContaining("your own leave");
    }

    @Test
    @DisplayName("updateConge() → Mise à jour partielle (type seulement)")
    void updateConge_partialUpdate_typeOnly() {
        UpdateCongeRequest request = new UpdateCongeRequest(
            TypeConge.MALADIE,
            null,
            null,
            null
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(chauffeur);
        when(congeRepository.findById(1L)).thenReturn(Optional.of(conge));
        when(congeRepository.save(any(Conge.class))).thenAnswer(inv -> inv.getArgument(0));
        
        CongeResponse result = congeService.updateConge(1L, request);
        
        assertThat(result).isNotNull();
        assertThat(conge.getType()).isEqualTo(TypeConge.MALADIE);
        verify(congeRepository, times(1)).save(conge);
    }

    @Test
    @DisplayName("updateConge() → Réinitialise congé approuvé à EN_ATTENTE")
    void updateConge_whenApproved_resetsToPending() {
        conge.setStatut(StatutConge.APPROUVE);
        conge.setCalendarEventId("cal-event-123");
        
        UpdateCongeRequest request = new UpdateCongeRequest(
            null,
            LocalDate.now().plusDays(8),
            null,
            null
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(chauffeur);
        when(congeRepository.findById(1L)).thenReturn(Optional.of(conge));
        when(congeRepository.save(any(Conge.class))).thenAnswer(inv -> inv.getArgument(0));
        
        CongeResponse result = congeService.updateConge(1L, request);
        
        assertThat(conge.getStatut()).isEqualTo(StatutConge.EN_ATTENTE);
        assertThat(conge.getCalendarEventId()).isNull();
        verify(googleCalendarLeaveSyncService, times(1)).deleteLeaveEvent(conge);
    }

    @Test
    @DisplayName("updateConge() → Motif vide ignoré")
    void updateConge_withBlankMotif_ignored() {
        UpdateCongeRequest request = new UpdateCongeRequest(
            null,
            null,
            null,
            "  "
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(chauffeur);
        when(congeRepository.findById(1L)).thenReturn(Optional.of(conge));
        when(congeRepository.save(any(Conge.class))).thenAnswer(inv -> inv.getArgument(0));
        
        CongeResponse result = congeService.updateConge(1L, request);
        
        assertThat(conge.getMotif()).isEqualTo("Vacances d'été");
    }

    @Test
    @DisplayName("updateConge() → Dates invalides après mise à jour lance exception")
    void updateConge_withInvalidUpdatedDates_throwsException() {
        UpdateCongeRequest request = new UpdateCongeRequest(
            null,
            LocalDate.now().plusDays(20),
            LocalDate.now().plusDays(10),
            null
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(chauffeur);
        when(congeRepository.findById(1L)).thenReturn(Optional.of(conge));
        
        assertThatThrownBy(() -> congeService.updateConge(1L, request))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("end date must be on or after");
    }

    @Test
    @DisplayName("approveConge() → SuperAdmin approuve congé manager")
    void approveConge_bySuperAdmin_succeeds() {
        Conge managerConge = new Conge();
        managerConge.setId(2L);
        managerConge.setType(TypeConge.VACANCES);
        managerConge.setDateDebut(LocalDate.now().plusDays(10));
        managerConge.setDateFin(LocalDate.now().plusDays(15));
        managerConge.setMotif("Vacances manager");
        managerConge.setStatut(StatutConge.EN_ATTENTE);
        managerConge.setManager(manager);
        
        CongeDecisionRequest request = new CongeDecisionRequest("Approuvé par SuperAdmin", null);
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(congeRepository.findById(2L)).thenReturn(Optional.of(managerConge));
        when(congeRepository.save(any(Conge.class))).thenAnswer(inv -> inv.getArgument(0));
        when(googleCalendarLeaveSyncService.syncApprovedLeave(any())).thenReturn(Optional.empty());
        
        CongeResponse result = congeService.approveConge(2L, request);
        
        assertThat(result).isNotNull();
        assertThat(managerConge.getStatut()).isEqualTo(StatutConge.APPROUVE);
        verify(congeRepository, times(1)).save(managerConge);
    }

    @Test
    @DisplayName("approveConge() → Chauffeur ne peut pas approuver")
    void approveConge_byChauffeur_throwsException() {
        CongeDecisionRequest request = new CongeDecisionRequest("Test", null);
        when(authenticatedUserService.getCurrentUser()).thenReturn(chauffeur);
        when(congeRepository.findById(1L)).thenReturn(Optional.of(conge));
        
        assertThatThrownBy(() -> congeService.approveConge(1L, request))
            .isInstanceOf(UnauthorizedException.class)
            .hasMessageContaining("not allowed to review");
    }

    @Test
    @DisplayName("approveConge() → Manager ne peut pas approuver congé d'un autre chauffeur")
    void approveConge_byWrongManager_throwsException() {
        Manager autreManager = new Manager();
        autreManager.setId(99L);
        autreManager.setRole(Role.MANAGER);
        
        CongeDecisionRequest request = new CongeDecisionRequest("Test", null);
        when(authenticatedUserService.getCurrentUser()).thenReturn(autreManager);
        when(congeRepository.findById(1L)).thenReturn(Optional.of(conge));
        
        assertThatThrownBy(() -> congeService.approveConge(1L, request))
            .isInstanceOf(UnauthorizedException.class)
            .hasMessageContaining("your direct drivers");
    }

    @Test
    @DisplayName("approveConge() → SuperAdmin ne peut pas approuver congé sans manager")
    void approveConge_superAdminDriverLeave_throwsException() {
        conge.setManager(null);
        CongeDecisionRequest request = new CongeDecisionRequest("Test", null);
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(congeRepository.findById(1L)).thenReturn(Optional.of(conge));
        
        assertThatThrownBy(() -> congeService.approveConge(1L, request))
            .isInstanceOf(UnauthorizedException.class)
            .hasMessageContaining("SuperAdmin can only review manager leave");
    }

    @Test
    @DisplayName("approveConge() → Congé inexistant lance exception")
    void approveConge_whenNotFound_throwsException() {
        CongeDecisionRequest request = new CongeDecisionRequest("Test", null);
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(congeRepository.findById(999L)).thenReturn(Optional.empty());
        
        assertThatThrownBy(() -> congeService.approveConge(999L, request))
            .isInstanceOf(ResourceNotFoundException.class)
            .hasMessageContaining("Leave request not found");
    }

    @Test
    @DisplayName("approveConge() → Commentaire null accepté")
    void approveConge_withNullComment_succeeds() {
        CongeDecisionRequest request = new CongeDecisionRequest(null, null);
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(congeRepository.findById(1L)).thenReturn(Optional.of(conge));
        when(congeRepository.save(any(Conge.class))).thenAnswer(inv -> inv.getArgument(0));
        when(googleCalendarLeaveSyncService.syncApprovedLeave(any())).thenReturn(Optional.empty());
        
        CongeResponse result = congeService.approveConge(1L, request);
        
        assertThat(result).isNotNull();
        assertThat(conge.getCommentaireValidation()).isNull();
    }

    @Test
    @DisplayName("approveConge() → Commentaire vide normalisé à null")
    void approveConge_withBlankComment_normalizesToNull() {
        CongeDecisionRequest request = new CongeDecisionRequest("  ", null);
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(congeRepository.findById(1L)).thenReturn(Optional.of(conge));
        when(congeRepository.save(any(Conge.class))).thenAnswer(inv -> inv.getArgument(0));
        when(googleCalendarLeaveSyncService.syncApprovedLeave(any())).thenReturn(Optional.empty());
        
        CongeResponse result = congeService.approveConge(1L, request);
        
        assertThat(conge.getCommentaireValidation()).isNull();
    }

    @Test
    @DisplayName("rejectConge() → SuperAdmin rejette congé manager")
    void rejectConge_bySuperAdmin_succeeds() {
        Conge managerConge = new Conge();
        managerConge.setId(3L);
        managerConge.setType(TypeConge.MARIAGE);
        managerConge.setDateDebut(LocalDate.now().plusDays(30));
        managerConge.setDateFin(LocalDate.now().plusDays(35));
        managerConge.setMotif("Mariage");
        managerConge.setStatut(StatutConge.EN_ATTENTE);
        managerConge.setManager(manager);
        managerConge.setCalendarEventId("cal-event-old");
        
        CongeDecisionRequest request = new CongeDecisionRequest("Période chargée", null);
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(congeRepository.findById(3L)).thenReturn(Optional.of(managerConge));
        when(congeRepository.save(any(Conge.class))).thenAnswer(inv -> inv.getArgument(0));
        
        CongeResponse result = congeService.rejectConge(3L, request);
        
        assertThat(result).isNotNull();
        assertThat(managerConge.getStatut()).isEqualTo(StatutConge.REJETE);
        assertThat(managerConge.getCalendarEventId()).isNull();
        verify(googleCalendarLeaveSyncService, times(1)).deleteLeaveEvent(managerConge);
    }

    @Test
    @DisplayName("rejectConge() → Chauffeur ne peut pas rejeter")
    void rejectConge_byChauffeur_throwsException() {
        CongeDecisionRequest request = new CongeDecisionRequest("Test", null);
        when(authenticatedUserService.getCurrentUser()).thenReturn(chauffeur);
        when(congeRepository.findById(1L)).thenReturn(Optional.of(conge));
        
        assertThatThrownBy(() -> congeService.rejectConge(1L, request))
            .isInstanceOf(UnauthorizedException.class)
            .hasMessageContaining("not allowed to review");
    }

    @Test
    @DisplayName("rejectConge() → Congé inexistant lance exception")
    void rejectConge_whenNotFound_throwsException() {
        CongeDecisionRequest request = new CongeDecisionRequest("Test", null);
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(congeRepository.findById(999L)).thenReturn(Optional.empty());
        
        assertThatThrownBy(() -> congeService.rejectConge(999L, request))
            .isInstanceOf(ResourceNotFoundException.class)
            .hasMessageContaining("Leave request not found");
    }

    @Test
    @DisplayName("deleteConge() → SuperAdmin ne peut pas supprimer")
    void deleteConge_bySuperAdmin_throwsException() {
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(congeRepository.findById(1L)).thenReturn(Optional.of(conge));
        
        assertThatThrownBy(() -> congeService.deleteConge(1L))
            .isInstanceOf(UnauthorizedException.class)
            .hasMessageContaining("SuperAdmin has read-only");
    }

    @Test
    @DisplayName("deleteConge() → Congé inexistant lance exception")
    void deleteConge_whenNotFound_throwsException() {
        when(authenticatedUserService.getCurrentUser()).thenReturn(chauffeur);
        when(congeRepository.findById(999L)).thenReturn(Optional.empty());
        
        assertThatThrownBy(() -> congeService.deleteConge(999L))
            .isInstanceOf(ResourceNotFoundException.class)
            .hasMessageContaining("Leave request not found");
    }

    @Test
    @DisplayName("deleteConge() → Manager supprime son propre congé")
    void deleteConge_byManagerOwner_succeeds() {
        Conge managerConge = new Conge();
        managerConge.setId(5L);
        managerConge.setType(TypeConge.VACANCES);
        managerConge.setDateDebut(LocalDate.now().plusDays(10));
        managerConge.setDateFin(LocalDate.now().plusDays(15));
        managerConge.setStatut(StatutConge.EN_ATTENTE);
        managerConge.setManager(manager);
        
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(congeRepository.findById(5L)).thenReturn(Optional.of(managerConge));
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of(superAdmin));
        
        ApiMessageResponse result = congeService.deleteConge(5L);
        
        assertThat(result.message()).contains("supprimée");
        verify(congeRepository, times(1)).delete(managerConge);
    }

    @Test
    @DisplayName("deleteConge() → Non-propriétaire ne peut pas supprimer")
    void deleteConge_byNonOwner_throwsException() {
        Chauffeur autreChauffeur = new Chauffeur();
        autreChauffeur.setId(99L);
        autreChauffeur.setRole(Role.CHAUFFEUR);
        
        when(authenticatedUserService.getCurrentUser()).thenReturn(autreChauffeur);
        when(congeRepository.findById(1L)).thenReturn(Optional.of(conge));
        
        assertThatThrownBy(() -> congeService.deleteConge(1L))
            .isInstanceOf(UnauthorizedException.class)
            .hasMessageContaining("your own leave");
    }

    @Test
    @DisplayName("createConge() → Tous les types de congé")
    void createConge_allTypes_succeeds() {
        when(authenticatedUserService.getCurrentUser()).thenReturn(chauffeur);
        when(congeRepository.existsByChauffeur_IdAndStatut(2L, StatutConge.EN_ATTENTE)).thenReturn(false);
        when(congeRepository.save(any(Conge.class))).thenAnswer(inv -> {
            Conge saved = inv.getArgument(0);
            saved.setId(100L);
            return saved;
        });
        
        CreateCongeRequest requestMaladie = new CreateCongeRequest(
            TypeConge.MALADIE,
            LocalDate.now().plusDays(1),
            LocalDate.now().plusDays(3),
            "Grippe"
        );
        CongeResponse result1 = congeService.createConge(requestMaladie);
        assertThat(result1.type()).isEqualTo(TypeConge.MALADIE);
        
        CreateCongeRequest requestMariage = new CreateCongeRequest(
            TypeConge.MARIAGE,
            LocalDate.now().plusDays(30),
            LocalDate.now().plusDays(35),
            "Mariage"
        );
        CongeResponse result2 = congeService.createConge(requestMariage);
        assertThat(result2.type()).isEqualTo(TypeConge.MARIAGE);
    }

    @Test
    @DisplayName("approveConge() → Avec notificationId pour marquer comme traitée")
    void approveConge_withNotificationId_marksAsHandled() {
        Notification notification = new Notification();
        notification.setId(50L);
        notification.setType(TypeNotif.NOTIF_CONGE);
        notification.setMessage("[CONGE_ID:1] Demande en attente");
        notification.setUtilisateur(manager);
        notification.setEstLu(false);
        
        CongeDecisionRequest request = new CongeDecisionRequest("Approuvé", 50L);
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(congeRepository.findById(1L)).thenReturn(Optional.of(conge));
        when(congeRepository.save(any(Conge.class))).thenAnswer(inv -> inv.getArgument(0));
        when(googleCalendarLeaveSyncService.syncApprovedLeave(any())).thenReturn(Optional.empty());
        when(notificationRepository.findById(50L)).thenReturn(Optional.of(notification));
        when(notificationRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        
        CongeResponse result = congeService.approveConge(1L, request);
        
        assertThat(result).isNotNull();
        verify(notificationRepository, times(1)).findById(50L);
        verify(notificationRepository, times(1)).save(notification);
    }

    // ═══════════════════════════════════════════════════════════════
    // TESTS SUPPLÉMENTAIRES POUR 98-100% COUVERTURE DES BRANCHES
    // ═══════════════════════════════════════════════════════════════

    @Test
    @DisplayName("approveConge() → SuperAdmin approuve congé avec manager null")
    void approveConge_superAdminWithNullManager_throwsException() {
        conge.setManager(null);
        conge.setChauffeur(chauffeur);
        
        CongeDecisionRequest request = new CongeDecisionRequest("Test", null);
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(congeRepository.findById(1L)).thenReturn(Optional.of(conge));
        
        assertThatThrownBy(() -> congeService.approveConge(1L, request))
            .isInstanceOf(UnauthorizedException.class)
            .hasMessageContaining("SuperAdmin can only review manager leave");
    }

    @Test
    @DisplayName("approveConge() → Manager ne peut pas approuver congé avec chauffeur null")
    void approveConge_managerWithNullChauffeur_throwsException() {
        conge.setChauffeur(null);
        
        CongeDecisionRequest request = new CongeDecisionRequest("Test", null);
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(congeRepository.findById(1L)).thenReturn(Optional.of(conge));
        
        assertThatThrownBy(() -> congeService.approveConge(1L, request))
            .isInstanceOf(UnauthorizedException.class)
            .hasMessageContaining("your direct drivers");
    }

    @Test
    @DisplayName("approveConge() → Manager ne peut pas approuver congé chauffeur sans manager")
    void approveConge_managerWithChauffeurNoManager_throwsException() {
        chauffeur.setManager(null);
        
        CongeDecisionRequest request = new CongeDecisionRequest("Test", null);
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(congeRepository.findById(1L)).thenReturn(Optional.of(conge));
        
        assertThatThrownBy(() -> congeService.approveConge(1L, request))
            .isInstanceOf(UnauthorizedException.class)
            .hasMessageContaining("your direct drivers");
    }

    @Test
    @DisplayName("rejectConge() → SuperAdmin rejette congé avec manager null")
    void rejectConge_superAdminWithNullManager_throwsException() {
        conge.setManager(null);
        conge.setChauffeur(chauffeur);
        
        CongeDecisionRequest request = new CongeDecisionRequest("Test", null);
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(congeRepository.findById(1L)).thenReturn(Optional.of(conge));
        
        assertThatThrownBy(() -> congeService.rejectConge(1L, request))
            .isInstanceOf(UnauthorizedException.class)
            .hasMessageContaining("SuperAdmin can only review manager leave");
    }

    @Test
    @DisplayName("rejectConge() → Manager ne peut pas rejeter congé avec chauffeur null")
    void rejectConge_managerWithNullChauffeur_throwsException() {
        conge.setChauffeur(null);
        
        CongeDecisionRequest request = new CongeDecisionRequest("Test", null);
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(congeRepository.findById(1L)).thenReturn(Optional.of(conge));
        
        assertThatThrownBy(() -> congeService.rejectConge(1L, request))
            .isInstanceOf(UnauthorizedException.class)
            .hasMessageContaining("your direct drivers");
    }

    @Test
    @DisplayName("rejectConge() → Manager ne peut pas rejeter congé chauffeur sans manager")
    void rejectConge_managerWithChauffeurNoManager_throwsException() {
        chauffeur.setManager(null);
        
        CongeDecisionRequest request = new CongeDecisionRequest("Test", null);
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(congeRepository.findById(1L)).thenReturn(Optional.of(conge));
        
        assertThatThrownBy(() -> congeService.rejectConge(1L, request))
            .isInstanceOf(UnauthorizedException.class)
            .hasMessageContaining("your direct drivers");
    }

    @Test
    @DisplayName("rejectConge() → Manager rejette congé d'un autre manager")
    void rejectConge_managerRejectsWrongManagerLeave_throwsException() {
        Manager autreManager = new Manager();
        autreManager.setId(99L);
        autreManager.setRole(Role.MANAGER);
        
        CongeDecisionRequest request = new CongeDecisionRequest("Test", null);
        when(authenticatedUserService.getCurrentUser()).thenReturn(autreManager);
        when(congeRepository.findById(1L)).thenReturn(Optional.of(conge));
        
        assertThatThrownBy(() -> congeService.rejectConge(1L, request))
            .isInstanceOf(UnauthorizedException.class)
            .hasMessageContaining("your direct drivers");
    }

    @Test
    @DisplayName("updateConge() → Mise à jour uniquement date début")
    void updateConge_onlyStartDate_succeeds() {
        UpdateCongeRequest request = new UpdateCongeRequest(
            null,
            LocalDate.now().plusDays(8),
            null,
            null
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(chauffeur);
        when(congeRepository.findById(1L)).thenReturn(Optional.of(conge));
        when(congeRepository.save(any(Conge.class))).thenAnswer(inv -> inv.getArgument(0));
        
        CongeResponse result = congeService.updateConge(1L, request);
        
        assertThat(conge.getDateDebut()).isEqualTo(LocalDate.now().plusDays(8));
        verify(congeRepository, times(1)).save(conge);
    }

    @Test
    @DisplayName("updateConge() → Mise à jour uniquement date fin")
    void updateConge_onlyEndDate_succeeds() {
        UpdateCongeRequest request = new UpdateCongeRequest(
            null,
            null,
            LocalDate.now().plusDays(20),
            null
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(chauffeur);
        when(congeRepository.findById(1L)).thenReturn(Optional.of(conge));
        when(congeRepository.save(any(Conge.class))).thenAnswer(inv -> inv.getArgument(0));
        
        CongeResponse result = congeService.updateConge(1L, request);
        
        assertThat(conge.getDateFin()).isEqualTo(LocalDate.now().plusDays(20));
        verify(congeRepository, times(1)).save(conge);
    }

    @Test
    @DisplayName("deleteConge() → Manager supprime congé approuvé avec calendarEventId")
    void deleteConge_managerCancelsApprovedLeaveWithCalendarId_succeeds() {
        Conge managerConge = new Conge();
        managerConge.setId(10L);
        managerConge.setType(TypeConge.VACANCES);
        managerConge.setDateDebut(LocalDate.now().plusDays(10));
        managerConge.setDateFin(LocalDate.now().plusDays(15));
        managerConge.setStatut(StatutConge.APPROUVE);
        managerConge.setManager(manager);
        managerConge.setCalendarEventId("cal-123");
        
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(congeRepository.findById(10L)).thenReturn(Optional.of(managerConge));
        when(congeRepository.save(any(Conge.class))).thenAnswer(inv -> inv.getArgument(0));
        
        ApiMessageResponse result = congeService.deleteConge(10L);
        
        assertThat(result.message()).contains("annulé");
        assertThat(managerConge.getStatut()).isEqualTo(StatutConge.ANNULE);
        verify(googleCalendarLeaveSyncService, times(1)).deleteLeaveEvent(managerConge);
    }

    @Test
    @DisplayName("createConge() → Motif null refusé par la validation du DTO")
    void createConge_withNullMotif_failsBeanValidation() {
        CreateCongeRequest request = new CreateCongeRequest(
            TypeConge.VACANCES,
            LocalDate.now().plusDays(10),
            LocalDate.now().plusDays(15),
            null
        );

        jakarta.validation.Validator validator = jakarta.validation.Validation.buildDefaultValidatorFactory().getValidator();
        var violations = validator.validate(request);

        assertThat(violations)
            .extracting(v -> v.getPropertyPath().toString())
            .contains("motif");
    }

    @Test
    @DisplayName("createConge() → Motif vide accepté")
    void createConge_withBlankMotif_succeeds() {
        CreateCongeRequest request = new CreateCongeRequest(
            TypeConge.VACANCES,
            LocalDate.now().plusDays(10),
            LocalDate.now().plusDays(15),
            "  "
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(chauffeur);
        when(congeRepository.existsByChauffeur_IdAndStatut(2L, StatutConge.EN_ATTENTE)).thenReturn(false);
        when(congeRepository.save(any(Conge.class))).thenAnswer(inv -> {
            Conge saved = inv.getArgument(0);
            saved.setId(101L);
            return saved;
        });
        
        CongeResponse result = congeService.createConge(request);
        
        assertThat(result).isNotNull();
        verify(congeRepository, times(1)).save(any(Conge.class));
    }

    @Test
    @DisplayName("getAccessibleConges() → Manager voit congés de ses chauffeurs")
    void getAccessibleConges_asManager_returnsDriverLeaves() {
        Conge chauffeurConge = new Conge();
        chauffeurConge.setId(50L);
        chauffeurConge.setType(TypeConge.MALADIE);
        chauffeurConge.setDateDebut(LocalDate.now().plusDays(1));
        chauffeurConge.setDateFin(LocalDate.now().plusDays(3));
        chauffeurConge.setStatut(StatutConge.EN_ATTENTE);
        chauffeurConge.setChauffeur(chauffeur);
        
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(congeRepository.findByManager_IdOrderByDateDebutDesc(1L)).thenReturn(List.of());
        when(congeRepository.findByChauffeur_Manager_IdOrderByDateDebutDesc(1L)).thenReturn(List.of(chauffeurConge));
        
        List<CongeResponse> result = congeService.getAccessibleConges();
        
        assertThat(result).hasSize(1);
        verify(congeRepository, times(1)).findByChauffeur_Manager_IdOrderByDateDebutDesc(1L);
    }

    @Test
    @DisplayName("getAccessibleConges() → Utilisateur sans rôle (role null) obtient liste vide")
    void getAccessibleConges_withNullRole_returnsEmpty() {
        Utilisateur utilisateurSansRole = new Utilisateur();
        utilisateurSansRole.setId(9L);

        when(authenticatedUserService.getCurrentUser()).thenReturn(utilisateurSansRole);

        List<CongeResponse> result = congeService.getAccessibleConges();

        assertThat(result).isEmpty();
        verifyNoInteractions(congeRepository);
    }

    @Test
    @DisplayName("createConge() → Utilisateur non Manager/Chauffeur même avec rôle MANAGER lance exception")
    void createConge_plainUserWithManagerRole_throwsUnauthorized() {
        Utilisateur plainUser = new Utilisateur();
        plainUser.setId(9L);
        plainUser.setRole(Role.MANAGER);

        CreateCongeRequest request = new CreateCongeRequest(
            TypeConge.VACANCES,
            LocalDate.now().plusDays(10),
            LocalDate.now().plusDays(15),
            "Test plain user"
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(plainUser);
        when(congeRepository.existsByManager_IdAndStatut(9L, StatutConge.EN_ATTENTE)).thenReturn(false);

        assertThatThrownBy(() -> congeService.createConge(request))
            .isInstanceOf(UnauthorizedException.class)
            .hasMessageContaining("Only managers and drivers");
    }

    @Test
    @DisplayName("notifyRequesterOfDecision() → Requester introuvable : ne fait rien")
    void notifyRequesterOfDecision_withoutRequester_doesNothing() {
        Conge congeSansRequester = new Conge();

        try {
            Method method = CongeServiceImpl.class.getDeclaredMethod(
                "notifyRequesterOfDecision", Conge.class, String.class, String.class);
            method.setAccessible(true);
            method.invoke(congeService, congeSansRequester, "approuvée", "Commentaire");
        } catch (NoSuchMethodException e) {
            throw new AssertionError("Private method not found", e);
        } catch (InvocationTargetException e) {
            throw new AssertionError("Unexpected exception during reflection invoke", e.getCause());
        } catch (IllegalAccessException e) {
            throw new AssertionError("Cannot access private method", e);
        }
    }

    @Test
    @DisplayName("createNotification() → Destinataire null : ne fait rien")
    void createNotification_withNullRecipient_doesNothing() {
        try {
            Method method = CongeServiceImpl.class.getDeclaredMethod(
                "createNotification", Utilisateur.class, String.class);
            method.setAccessible(true);
            method.invoke(congeService, null, "Message test");
        } catch (NoSuchMethodException e) {
            throw new AssertionError("Private method not found", e);
        } catch (InvocationTargetException e) {
            throw new AssertionError("Unexpected exception during reflection invoke", e.getCause());
        } catch (IllegalAccessException e) {
            throw new AssertionError("Cannot access private method", e);
        }
    }

    @Test
    @DisplayName("createConge() → Save ne renseignant pas l'id : message sans token")
    void createConge_whenSaveDoesNotSetId_returnsResponseWithoutToken() {
        CreateCongeRequest request = new CreateCongeRequest(
            TypeConge.VACANCES,
            LocalDate.now().plusDays(10),
            LocalDate.now().plusDays(15),
            "Sans id renseigné"
        );
        when(authenticatedUserService.getCurrentUser()).thenReturn(chauffeur);
        when(congeRepository.existsByChauffeur_IdAndStatut(2L, StatutConge.EN_ATTENTE)).thenReturn(false);
        when(congeRepository.save(any(Conge.class))).thenAnswer(inv -> inv.getArgument(0));

        CongeResponse result = congeService.createConge(request);

        assertThat(result).isNotNull();
        assertThat(result.id()).isNull();
    }

    @Test
    @DisplayName("approveConge() → Notification d'un autre utilisateur non marquée comme traitée")
    void approveConge_withNotificationOfAnotherUser_notHandled() {
        Utilisateur autreUtilisateur = new Utilisateur();
        autreUtilisateur.setId(99L);

        Notification notification = new Notification();
        notification.setId(50L);
        notification.setType(TypeNotif.NOTIF_CONGE);
        notification.setUtilisateur(autreUtilisateur);

        CongeDecisionRequest request = new CongeDecisionRequest("Approuvé", 50L);
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(congeRepository.findById(1L)).thenReturn(Optional.of(conge));
        when(congeRepository.save(any(Conge.class))).thenAnswer(inv -> inv.getArgument(0));
        when(googleCalendarLeaveSyncService.syncApprovedLeave(any())).thenReturn(Optional.empty());
        when(notificationRepository.findById(50L)).thenReturn(Optional.of(notification));

        CongeResponse result = congeService.approveConge(1L, request);

        assertThat(result).isNotNull();
        verify(notificationRepository, times(1)).findById(50L);
    }

    @Test
    @DisplayName("approveConge() → Notification non CONGE non marquée comme traitée")
    void approveConge_withNonCongeNotification_notHandled() {
        Notification notification = new Notification();
        notification.setId(50L);
        notification.setType(TypeNotif.NOTIF_VEHICULE);
        notification.setUtilisateur(manager);

        CongeDecisionRequest request = new CongeDecisionRequest("Approuvé", 50L);
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(congeRepository.findById(1L)).thenReturn(Optional.of(conge));
        when(congeRepository.save(any(Conge.class))).thenAnswer(inv -> inv.getArgument(0));
        when(googleCalendarLeaveSyncService.syncApprovedLeave(any())).thenReturn(Optional.empty());
        when(notificationRepository.findById(50L)).thenReturn(Optional.of(notification));

        CongeResponse result = congeService.approveConge(1L, request);

        assertThat(result).isNotNull();
        verify(notificationRepository, times(1)).findById(50L);
    }

    // ═══════════════════════════════════════════════════════════════
    // TESTS POUR 99% COUVERTURE DES BRANCHES (14 branches manquantes)
    // ═══════════════════════════════════════════════════════════════

    @Test
    @DisplayName("updateConge() → MANAGER sur conge sans manager lance exception")
    void updateConge_managerWithNullManagerOnConge_throwsException() {
        Conge congeSansManager = new Conge();
        congeSansManager.setId(1L);
        congeSansManager.setType(TypeConge.VACANCES);
        congeSansManager.setDateDebut(LocalDate.now().plusDays(7));
        congeSansManager.setDateFin(LocalDate.now().plusDays(14));
        congeSansManager.setMotif("Test");
        congeSansManager.setStatut(StatutConge.EN_ATTENTE);
        congeSansManager.setManager(null);

        UpdateCongeRequest request = new UpdateCongeRequest(TypeConge.MALADIE, null, null, null);
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(congeRepository.findById(1L)).thenReturn(Optional.of(congeSansManager));

        assertThatThrownBy(() -> congeService.updateConge(1L, request))
            .isInstanceOf(UnauthorizedException.class)
            .hasMessageContaining("your own leave");
    }

    @Test
    @DisplayName("updateConge() → CHAUFFEUR sur conge sans chauffeur lance exception")
    void updateConge_chauffeurWithNullChauffeurOnConge_throwsException() {
        Conge congeSansChauffeur = new Conge();
        congeSansChauffeur.setId(1L);
        congeSansChauffeur.setType(TypeConge.VACANCES);
        congeSansChauffeur.setDateDebut(LocalDate.now().plusDays(7));
        congeSansChauffeur.setDateFin(LocalDate.now().plusDays(14));
        congeSansChauffeur.setMotif("Test");
        congeSansChauffeur.setStatut(StatutConge.EN_ATTENTE);
        congeSansChauffeur.setChauffeur(null);

        UpdateCongeRequest request = new UpdateCongeRequest(TypeConge.MALADIE, null, null, null);
        when(authenticatedUserService.getCurrentUser()).thenReturn(chauffeur);
        when(congeRepository.findById(1L)).thenReturn(Optional.of(congeSansChauffeur));

        assertThatThrownBy(() -> congeService.updateConge(1L, request))
            .isInstanceOf(UnauthorizedException.class)
            .hasMessageContaining("your own leave");
    }

    @Test
    @DisplayName("resolveReviewers() → Chauffeur sans manager ne retourne aucun reviewer")
    void resolveReviewers_chauffeurWithNullManager_returnsEmpty() throws Exception {
        Conge congeTest = new Conge();
        Chauffeur chauffeurNoMgr = new Chauffeur();
        chauffeurNoMgr.setId(5L);
        chauffeurNoMgr.setManager(null);
        congeTest.setChauffeur(chauffeurNoMgr);

        Method method = CongeServiceImpl.class.getDeclaredMethod("resolveReviewers", Conge.class);
        method.setAccessible(true);
        @SuppressWarnings("unchecked")
        List<Utilisateur> result = (List<Utilisateur>) method.invoke(congeService, congeTest);

        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("resolveReviewers() → Sans chauffeur ni manager retourne liste vide")
    void resolveReviewers_noChauffeurNoManager_returnsEmpty() throws Exception {
        Conge congeTest = new Conge();

        Method method = CongeServiceImpl.class.getDeclaredMethod("resolveReviewers", Conge.class);
        method.setAccessible(true);
        @SuppressWarnings("unchecked")
        List<Utilisateur> result = (List<Utilisateur>) method.invoke(congeService, congeTest);

        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("withLeaveToken() → conge null retourne le message brut")
    void withLeaveToken_withNullConge_returnsRawMessage() throws Exception {
        Method method = CongeServiceImpl.class.getDeclaredMethod("withLeaveToken", Conge.class, String.class);
        method.setAccessible(true);
        String result = (String) method.invoke(congeService, null, "Test message");

        assertThat(result).isEqualTo("Test message");
    }

    @Test
    @DisplayName("markDecisionNotificationAsHandled() → actor null et conge null ne fait rien")
    void markDecisionNotificationAsHandled_withNullActorAndConge_doesNothing() throws Exception {
        Method method = CongeServiceImpl.class.getDeclaredMethod(
            "markDecisionNotificationAsHandled", Utilisateur.class, Long.class, Conge.class, boolean.class);
        method.setAccessible(true);
        method.invoke(congeService, null, 1L, null, true);

        verifyNoInteractions(notificationRepository);
    }

    @Test
    @DisplayName("approveConge() → Notification avec utilisateur null n'est pas marquée traitée")
    void approveConge_withNotificationNullUtilisateur_notHandled() {
        Notification notification = new Notification();
        notification.setId(60L);
        notification.setType(TypeNotif.NOTIF_CONGE);
        notification.setUtilisateur(null);

        CongeDecisionRequest request = new CongeDecisionRequest("Approuvé", 60L);
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(congeRepository.findById(1L)).thenReturn(Optional.of(conge));
        when(congeRepository.save(any(Conge.class))).thenAnswer(inv -> inv.getArgument(0));
        when(googleCalendarLeaveSyncService.syncApprovedLeave(any())).thenReturn(Optional.empty());
        when(notificationRepository.findById(60L)).thenReturn(Optional.of(notification));

        CongeResponse result = congeService.approveConge(1L, request);

        assertThat(result).isNotNull();
        assertThat(notification.getMessage()).isNull();
        assertThat(notification.getEstLu()).isNull();
    }

    @Test
    @DisplayName("rejectConge() → Avec notificationId valide la marque comme rejetée")
    void rejectConge_withNotificationId_marksAsHandled() {
        Notification notification = new Notification();
        notification.setId(70L);
        notification.setType(TypeNotif.NOTIF_CONGE);
        notification.setUtilisateur(manager);
        notification.setEstLu(false);

        CongeDecisionRequest request = new CongeDecisionRequest("Rejeté", 70L);
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(congeRepository.findById(1L)).thenReturn(Optional.of(conge));
        when(congeRepository.save(any(Conge.class))).thenAnswer(inv -> inv.getArgument(0));
        when(notificationRepository.findById(70L)).thenReturn(Optional.of(notification));
        when(notificationRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        CongeResponse result = congeService.rejectConge(1L, request);

        assertThat(result).isNotNull();
        verify(notificationRepository, times(1)).save(notification);
    }

    @Test
    @DisplayName("toResponse() → Sans chauffeur ni manager retourne requester null")
    void toResponse_withNoChauffeurNoManager_hasNullRequester() throws Exception {
        Conge congeOrphelin = new Conge();
        congeOrphelin.setId(99L);
        congeOrphelin.setType(TypeConge.VACANCES);
        congeOrphelin.setDateDebut(LocalDate.now().plusDays(7));
        congeOrphelin.setDateFin(LocalDate.now().plusDays(14));
        congeOrphelin.setMotif("Test");
        congeOrphelin.setStatut(StatutConge.EN_ATTENTE);

        Method method = CongeServiceImpl.class.getDeclaredMethod("toResponse", Conge.class);
        method.setAccessible(true);
        CongeResponse response = (CongeResponse) method.invoke(congeService, congeOrphelin);

        assertThat(response.requesterId()).isNull();
        assertThat(response.requesterNom()).isNull();
        assertThat(response.requesterEmail()).isNull();
        assertThat(response.requesterRole()).isNull();
    }

    @Test
    @DisplayName("fullName() → Utilisateur avec prenom null ne plante pas")
    void fullName_withNullPrenom_handlesGracefully() throws Exception {
        Utilisateur userSansPrenom = new Utilisateur();
        userSansPrenom.setPrenom(null);
        userSansPrenom.setNom("Dupont");

        Method method = CongeServiceImpl.class.getDeclaredMethod("fullName", Utilisateur.class);
        method.setAccessible(true);
        String result = (String) method.invoke(congeService, userSansPrenom);

        assertThat(result).isEqualTo("Dupont");
    }
}
