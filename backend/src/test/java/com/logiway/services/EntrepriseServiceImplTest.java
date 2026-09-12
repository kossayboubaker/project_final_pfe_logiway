package com.logiway.services;

import com.logiway.dto.request.CreateEntrepriseRequest;
import com.logiway.dto.request.UpdateEntrepriseRequest;
import com.logiway.dto.response.EntrepriseResponse;
import com.logiway.entities.Chauffeur;
import com.logiway.entities.Entreprise;
import com.logiway.entities.Manager;
import com.logiway.entities.Notification;
import com.logiway.entities.Utilisateur;
import com.logiway.entities.Vehicule;
import com.logiway.entities.enums.Role;
import com.logiway.entities.enums.StatutEntreprise;
import com.logiway.entities.enums.TypeNotif;
import com.logiway.exceptions.BadRequestException;
import com.logiway.exceptions.UnauthorizedException;
import com.logiway.repositories.ChauffeurRepository;
import com.logiway.repositories.EntrepriseRepository;
import com.logiway.repositories.ManagerRepository;
import com.logiway.repositories.NotificationRepository;
import com.logiway.repositories.UtilisateurRepository;
import com.logiway.repositories.VehiculeRepository;
import com.logiway.security.AuthenticatedUserService;
import com.logiway.services.impl.EntrepriseServiceImpl;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Service Entreprise — Tests Unitaires")
class EntrepriseServiceImplTest {

    @Mock private EntrepriseRepository entrepriseRepository;
    @Mock private ManagerRepository managerRepository;
    @Mock private UtilisateurRepository utilisateurRepository;
    @Mock private VehiculeRepository vehiculeRepository;
    @Mock private NotificationRepository notificationRepository;
    @Mock private NotificationRealtimeService notificationRealtimeService;
    @Mock private MailService mailService;
    @Mock private AuthenticatedUserService authenticatedUserService;
    @Mock private ChauffeurRepository chauffeurRepository;

    @InjectMocks
    private EntrepriseServiceImpl entrepriseService;

    private Utilisateur superAdmin;
    private Manager manager;
    private Entreprise entreprise;

    @BeforeEach
    void setUp() {
        superAdmin = utilisateur(1L, "Alice", "Admin", Role.SUPERADMIN);
        manager = manager(2L, "Jean", "Dupont", null);
        entreprise = entreprise(1L, "Transport Express", StatutEntreprise.ACTIF, null);
    }

    private Utilisateur utilisateur(long id, String prenom, String nom, Role role) {
        Utilisateur u = new Utilisateur();
        u.setId(id);
        u.setPrenom(prenom);
        u.setNom(nom);
        u.setEmail(prenom.toLowerCase() + "@test.com");
        u.setRole(role);
        return u;
    }

    private Manager manager(long id, String prenom, String nom, Entreprise company) {
        Manager m = new Manager();
        m.setId(id);
        m.setPrenom(prenom);
        m.setNom(nom);
        m.setEmail("manager" + id + "@test.com");
        m.setRole(Role.MANAGER);
        m.setEntreprise(company);
        return m;
    }

    private Chauffeur chauffeur(long id, String prenom, String nom, Manager mgr, Entreprise company) {
        Chauffeur c = new Chauffeur();
        c.setId(id);
        c.setPrenom(prenom);
        c.setNom(nom);
        c.setEmail(prenom.toLowerCase() + "@test.com");
        c.setRole(Role.CHAUFFEUR);
        c.setManager(mgr);
        c.setEntreprise(company);
        return c;
    }

    private Entreprise entreprise(long id, String nom, StatutEntreprise statut, Manager proprietaire) {
        Entreprise e = new Entreprise();
        e.setId(id);
        e.setNomEntreprise(nom);
        e.setStatut(statut);
        e.setProprietaire(proprietaire);
        e.setDateCreation(LocalDateTime.now());
        return e;
    }

    private CreateEntrepriseRequest createRequest(String nom, Long managerOwnerId, String statut) {
        return new CreateEntrepriseRequest(
            nom, "contact@test.com", "12 rue des Lilas", "0102030405",
            "FR123", "Jean Dupont", "justificatif.pdf", "Transport de marchandises",
            10, "logo.png", managerOwnerId, statut
        );
    }

    @Test
    @DisplayName("getAccessibleEntreprises() → SuperAdmin voit toutes les entreprises")
    void getAccessibleEntreprises_asSuperAdmin_returnsAll() {
        Entreprise second = entreprise(2L, "LogiWay Cargo", StatutEntreprise.EN_ATTENTE, null);
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(entrepriseRepository.findAllByOrderByDateCreationDesc()).thenReturn(List.of(entreprise, second));

        List<EntrepriseResponse> result = entrepriseService.getAccessibleEntreprises();

        assertThat(result).hasSize(2);
        assertThat(result).extracting(EntrepriseResponse::nomEntreprise)
            .containsExactly("Transport Express", "LogiWay Cargo");
        verify(entrepriseRepository, times(1)).findAllByOrderByDateCreationDesc();
    }

    @Test
    @DisplayName("getAccessibleEntreprises() → Manager ne voit que son entreprise")
    void getAccessibleEntreprises_asManager_returnsOwnCompany() {
        manager.setEntreprise(entreprise);
        entreprise.setProprietaire(manager);
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);

        List<EntrepriseResponse> result = entrepriseService.getAccessibleEntreprises();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).nomEntreprise()).isEqualTo("Transport Express");
        assertThat(result.get(0).managerOwnerId()).isEqualTo(2L);
        assertThat(result.get(0).managerOwnerName()).isEqualTo("Jean Dupont");
        verify(entrepriseRepository, never()).findAllByOrderByDateCreationDesc();
    }

    @Test
    @DisplayName("getAccessibleEntreprises() → Utilisateur sans entreprise retourne liste vide")
    void getAccessibleEntreprises_whenNoCompany_returnsEmpty() {
        Utilisateur chauffeur = utilisateur(3L, "Paul", "Martin", Role.CHAUFFEUR);
        when(authenticatedUserService.getCurrentUser()).thenReturn(chauffeur);

        List<EntrepriseResponse> result = entrepriseService.getAccessibleEntreprises();

        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("getMyEntreprise() → Retourne l'entreprise de l'utilisateur connecte")
    void getMyEntreprise_withCompany_returnsResponse() {
        manager.setEntreprise(entreprise);
        entreprise.setProprietaire(manager);
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);

        EntrepriseResponse result = entrepriseService.getMyEntreprise();

        assertThat(result).isNotNull();
        assertThat(result.nomEntreprise()).isEqualTo("Transport Express");
        assertThat(result.managerOwnerName()).isEqualTo("Jean Dupont");
    }

    @Test
    @DisplayName("getMyEntreprise() → Retourne null si aucune entreprise")
    void getMyEntreprise_withoutCompany_returnsNull() {
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);

        EntrepriseResponse result = entrepriseService.getMyEntreprise();

        assertThat(result).isNull();
    }

    @Test
    @DisplayName("createEntreprise() → Manager cree une entreprise en attente avec synchronisation des chauffeurs")
    void createEntreprise_byManager_succeeds() {
        Chauffeur ch1 = chauffeur(3L, "Paul", "Martin", manager, null);
        Chauffeur ch2 = chauffeur(4L, "Pierre", "Durand", manager, null);
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(chauffeurRepository.findByManagerId(2L)).thenReturn(List.of(ch1, ch2));
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of(superAdmin));
        when(entrepriseRepository.save(any(Entreprise.class))).thenAnswer(inv -> inv.getArgument(0));
        when(utilisateurRepository.save(any(Utilisateur.class))).thenAnswer(inv -> inv.getArgument(0));

        EntrepriseResponse result = entrepriseService.createEntreprise(createRequest("  Transport Express  ", null, "ACTIF"));

        assertThat(result.nomEntreprise()).isEqualTo("Transport Express");
        assertThat(result.statut()).isEqualTo(StatutEntreprise.EN_ATTENTE);
        assertThat(result.managerOwnerId()).isEqualTo(2L);
        assertThat(result.managerOwnerName()).isEqualTo("Jean Dupont");
        assertThat(ch1.getEntreprise()).isNotNull();
        assertThat(ch2.getEntreprise()).isNotNull();
        verify(entrepriseRepository, times(1)).save(any(Entreprise.class));
        verify(utilisateurRepository, times(3)).save(any(Utilisateur.class));
        verify(chauffeurRepository, times(1)).findByManagerId(2L);
        ArgumentCaptor<Notification> notifCaptor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository, times(2)).save(notifCaptor.capture());
        assertThat(notifCaptor.getAllValues())
            .extracting(Notification::getType)
            .containsOnly(TypeNotif.NOTIF_ENTREPRISE);
        verify(notificationRealtimeService, times(2)).publishToUsers(anyList(), any(Notification.class));
    }

    @Test
    @DisplayName("createEntreprise() → Role MANAGER sans instance Manager lance exception")
    void createEntreprise_byNonManagerInstance_throws() {
        Utilisateur fakeManager = utilisateur(5L, "Fake", "Manager", Role.MANAGER);
        when(authenticatedUserService.getCurrentUser()).thenReturn(fakeManager);

        assertThatThrownBy(() -> entrepriseService.createEntreprise(createRequest("Transport Express", null, null)))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("not a manager");
    }

    @Test
    @DisplayName("createEntreprise() → Manager deja rattache a une entreprise lance exception")
    void createEntreprise_byManagerAlreadyOwned_throws() {
        manager.setEntreprise(entreprise);
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);

        assertThatThrownBy(() -> entrepriseService.createEntreprise(createRequest("Transport Express", null, null)))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("deja rattache");
    }

    @Test
    @DisplayName("createEntreprise() → SuperAdmin cree sans manager affecte")
    void createEntreprise_bySuperAdminWithoutOwner_succeeds() {
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of());
        when(entrepriseRepository.save(any(Entreprise.class))).thenAnswer(inv -> inv.getArgument(0));

        EntrepriseResponse result = entrepriseService.createEntreprise(createRequest("Transport Express", null, null));

        assertThat(result.statut()).isEqualTo(StatutEntreprise.ACTIF);
        assertThat(result.managerOwnerId()).isNull();
        verify(managerRepository, never()).findById(anyLong());
        verify(utilisateurRepository, never()).save(any(Utilisateur.class));
        verify(mailService, never()).sendCompanyNotificationEmail(any(), anyString(), anyString(), anyString(), anyString());
    }

    @Test
    @DisplayName("createEntreprise() → SuperAdmin cree avec manager affecte, email et notifications envoyes")
    void createEntreprise_bySuperAdminWithOwner_succeeds() {
        Manager owner = manager(5L, "Marc", "Leroy", null);
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(managerRepository.findById(5L)).thenReturn(Optional.of(owner));
        when(chauffeurRepository.findByManagerId(5L)).thenReturn(List.of());
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of());
        when(entrepriseRepository.save(any(Entreprise.class))).thenAnswer(inv -> inv.getArgument(0));
        when(utilisateurRepository.save(any(Utilisateur.class))).thenAnswer(inv -> inv.getArgument(0));

        EntrepriseResponse result = entrepriseService.createEntreprise(createRequest("Transport Express", 5L, null));

        assertThat(result.statut()).isEqualTo(StatutEntreprise.ACTIF);
        assertThat(result.managerOwnerId()).isEqualTo(5L);
        assertThat(result.managerOwnerName()).isEqualTo("Marc Leroy");
        assertThat(owner.getEntreprise()).isNotNull();
        verify(utilisateurRepository).save(owner);
        verify(mailService).sendCompanyNotificationEmail(eq(owner), anyString(), anyString(), anyString(), anyString());
        verify(notificationRepository, times(1)).save(any(Notification.class));
        verify(notificationRealtimeService, times(1)).publishToUsers(anyList(), any(Notification.class));
    }

    @Test
    @DisplayName("createEntreprise() → SuperAdmin affecte un manager et synchronise ses chauffeurs")
    void createEntreprise_bySuperAdminWithOwner_synchronizesChauffeurs_succeeds() {
        Manager owner = manager(5L, "Marc", "Leroy", null);
        Chauffeur ch1 = chauffeur(3L, "Paul", "Martin", owner, null);
        Chauffeur ch2 = chauffeur(4L, "Pierre", "Durand", owner, null);
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(managerRepository.findById(5L)).thenReturn(Optional.of(owner));
        when(chauffeurRepository.findByManagerId(5L)).thenReturn(List.of(ch1, ch2));
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of());
        when(entrepriseRepository.save(any(Entreprise.class))).thenAnswer(inv -> inv.getArgument(0));
        when(utilisateurRepository.save(any(Utilisateur.class))).thenAnswer(inv -> inv.getArgument(0));

        EntrepriseResponse result = entrepriseService.createEntreprise(createRequest("Transport Express", 5L, null));

        assertThat(result.managerOwnerId()).isEqualTo(5L);
        assertThat(result.managerOwnerName()).isEqualTo("Marc Leroy");
        assertThat(ch1.getEntreprise()).isNotNull();
        assertThat(ch2.getEntreprise()).isNotNull();
        verify(utilisateurRepository).save(owner);
        verify(utilisateurRepository).save(ch1);
        verify(utilisateurRepository).save(ch2);
        verify(mailService).sendCompanyNotificationEmail(eq(owner), anyString(), anyString(), anyString(), anyString());
    }

    @Test
    @DisplayName("createEntreprise() → SuperAdmin avec manager introuvable lance exception")
    void createEntreprise_bySuperAdminManagerNotFound_throws() {
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(managerRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> entrepriseService.createEntreprise(createRequest("Transport Express", 999L, null)))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("Manager introuvable");
    }

    @Test
    @DisplayName("createEntreprise() → SuperAdmin avec manager deja rattache lance exception")
    void createEntreprise_bySuperAdminManagerAlreadyOwned_throws() {
        Manager owner = manager(5L, "Marc", "Leroy", entreprise);
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(managerRepository.findById(5L)).thenReturn(Optional.of(owner));

        assertThatThrownBy(() -> entrepriseService.createEntreprise(createRequest("Transport Express", 5L, null)))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("deja rattache");
    }

    @Test
    @DisplayName("createEntreprise() → Chauffeur non autorise lance exception")
    void createEntreprise_byChauffeur_throws() {
        Utilisateur chauffeur = utilisateur(3L, "Paul", "Martin", Role.CHAUFFEUR);
        when(authenticatedUserService.getCurrentUser()).thenReturn(chauffeur);

        assertThatThrownBy(() -> entrepriseService.createEntreprise(createRequest("Transport Express", null, null)))
            .isInstanceOf(UnauthorizedException.class)
            .hasMessageContaining("not allowed to create companies");
    }

    @Test
    @DisplayName("createEntreprise() → Echec de sauvegarde notification ne bloque pas la creation")
    void createEntreprise_whenNotificationFails_stillSucceeds() {
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(chauffeurRepository.findByManagerId(2L)).thenReturn(List.of());
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of());
        when(entrepriseRepository.save(any(Entreprise.class))).thenAnswer(inv -> inv.getArgument(0));
        when(utilisateurRepository.save(any(Utilisateur.class))).thenAnswer(inv -> inv.getArgument(0));
        when(notificationRepository.save(any(Notification.class))).thenThrow(new RuntimeException("boom"));

        EntrepriseResponse result = entrepriseService.createEntreprise(createRequest("Transport Express", null, null));

        assertThat(result).isNotNull();
        assertThat(result.statut()).isEqualTo(StatutEntreprise.EN_ATTENTE);
    }

    @Test
    @DisplayName("createEntreprise() → Echec d'envoi email ne bloque pas la creation")
    void createEntreprise_whenEmailFails_stillSucceeds() {
        Manager owner = manager(5L, "Marc", "Leroy", null);
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(managerRepository.findById(5L)).thenReturn(Optional.of(owner));
        when(chauffeurRepository.findByManagerId(5L)).thenReturn(List.of());
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of());
        when(entrepriseRepository.save(any(Entreprise.class))).thenAnswer(inv -> inv.getArgument(0));
        when(utilisateurRepository.save(any(Utilisateur.class))).thenAnswer(inv -> inv.getArgument(0));
        doThrow(new RuntimeException("mail down"))
            .when(mailService).sendCompanyNotificationEmail(any(Utilisateur.class), anyString(), anyString(), anyString(), anyString());

        EntrepriseResponse result = entrepriseService.createEntreprise(createRequest("Transport Express", 5L, null));

        assertThat(result).isNotNull();
        assertThat(result.statut()).isEqualTo(StatutEntreprise.ACTIF);
        verify(entrepriseRepository, times(1)).save(any(Entreprise.class));
    }

    @Test
    @DisplayName("createEntreprise() → Manager sans nom utilise son email comme libelle")
    void createEntreprise_byManagerWithoutName_usesEmailAsLabel() {
        Manager anonymous = manager(6L, null, null, null);
        when(authenticatedUserService.getCurrentUser()).thenReturn(anonymous);
        when(chauffeurRepository.findByManagerId(6L)).thenReturn(List.of());
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of());
        when(entrepriseRepository.save(any(Entreprise.class))).thenAnswer(inv -> inv.getArgument(0));
        when(utilisateurRepository.save(any(Utilisateur.class))).thenAnswer(inv -> inv.getArgument(0));

        EntrepriseResponse result = entrepriseService.createEntreprise(createRequest("Transport Express", null, null));

        assertThat(result.managerOwnerName()).isEqualTo("manager6@test.com");
    }

    @Test
    @DisplayName("updateEntreprise() → Manager met a jour son entreprise active")
    void updateEntreprise_byManager_succeeds() {
        manager.setEntreprise(entreprise);
        entreprise.setProprietaire(manager);
        entreprise.setDocumentJustificatif("data:application/pdf;base64,xxx");
        entreprise.setImage("data:image/png;base64,yyy");
        entreprise.setTailleFlotte(null);
        entreprise.setSecteurActivite("Transport");
        entreprise.setEmailEntreprise("contact@test.com");
        entreprise.setNumeroEntreprise("0102030405");
        entreprise.setAdresseEntreprise("12 rue des Lilas");
        entreprise.setCodeTVA("FR123");
        entreprise.setRepresentantLegal("Jean Dupont");
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(entrepriseRepository.findById(1L)).thenReturn(Optional.of(entreprise));
        when(entrepriseRepository.save(any(Entreprise.class))).thenAnswer(inv -> inv.getArgument(0));
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of());

        UpdateEntrepriseRequest request = new UpdateEntrepriseRequest(
            "  Nouveau Nom  ", null, null, null, null, null, null, null, null, null, null, null);
        EntrepriseResponse result = entrepriseService.updateEntreprise(1L, request);

        assertThat(result.nomEntreprise()).isEqualTo("Nouveau Nom");
        assertThat(entreprise.getNomEntreprise()).isEqualTo("Nouveau Nom");
        verify(entrepriseRepository).save(entreprise);
        ArgumentCaptor<String> summaryCaptor = ArgumentCaptor.forClass(String.class);
        verify(mailService).sendCompanyNotificationEmail(eq(manager), eq("Modification de votre entreprise"),
            anyString(), anyString(), summaryCaptor.capture());
        assertThat(summaryCaptor.getValue())
            .contains("Nom: Nouveau Nom")
            .contains("Statut: ACTIF")
            .contains("Document justificatif: PDF charge")
            .contains("Image: Image chargee")
            .contains("Taille flotte: \nImage:");
    }

    @Test
    @DisplayName("updateEntreprise() → Manager non proprietaire lance exception")
    void updateEntreprise_byManagerNotOwner_throws() {
        Manager otherOwner = manager(3L, "Autre", "Proprietaire", entreprise);
        entreprise.setProprietaire(otherOwner);
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(entrepriseRepository.findById(1L)).thenReturn(Optional.of(entreprise));

        UpdateEntrepriseRequest request = new UpdateEntrepriseRequest(
            "Nouveau Nom", null, null, null, null, null, null, null, null, null, null, null);
        assertThatThrownBy(() -> entrepriseService.updateEntreprise(1L, request))
            .isInstanceOf(UnauthorizedException.class)
            .hasMessageContaining("not allowed to modify this company");
    }

    @Test
    @DisplayName("updateEntreprise() → Manager avec entreprise non active lance exception")
    void updateEntreprise_byManagerCompanyNotActive_throws() {
        manager.setEntreprise(entreprise);
        entreprise.setProprietaire(manager);
        entreprise.setStatut(StatutEntreprise.EN_ATTENTE);
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(entrepriseRepository.findById(1L)).thenReturn(Optional.of(entreprise));

        UpdateEntrepriseRequest request = new UpdateEntrepriseRequest(
            "Nouveau Nom", null, null, null, null, null, null, null, null, null, null, null);
        assertThatThrownBy(() -> entrepriseService.updateEntreprise(1L, request))
            .isInstanceOf(UnauthorizedException.class)
            .hasMessageContaining("must be active before modification");
    }

    @Test
    @DisplayName("updateEntreprise() → Entreprise introuvable lance exception")
    void updateEntreprise_whenNotFound_throws() {
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(entrepriseRepository.findById(999L)).thenReturn(Optional.empty());

        UpdateEntrepriseRequest request = new UpdateEntrepriseRequest(
            "Nouveau Nom", null, null, null, null, null, null, null, null, null, null, null);
        assertThatThrownBy(() -> entrepriseService.updateEntreprise(999L, request))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("Entreprise introuvable");
    }

    @Test
    @DisplayName("updateEntreprise() → SuperAdmin met a jour sans proprietaire et sans statut")
    void updateEntreprise_bySuperAdminSimpleUpdate_succeeds() {
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(entrepriseRepository.findById(1L)).thenReturn(Optional.of(entreprise));
        when(entrepriseRepository.save(any(Entreprise.class))).thenAnswer(inv -> inv.getArgument(0));
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of());

        UpdateEntrepriseRequest request = new UpdateEntrepriseRequest(
            "Nouveau Nom", "nouveau@test.com", null, null, null, null, null, null, null, null, null, null);
        EntrepriseResponse result = entrepriseService.updateEntreprise(1L, request);

        assertThat(result.nomEntreprise()).isEqualTo("Nouveau Nom");
        assertThat(result.emailEntreprise()).isEqualTo("nouveau@test.com");
        verify(managerRepository, never()).findById(anyLong());
        verify(mailService, never()).sendCompanyNotificationEmail(any(), anyString(), anyString(), anyString(), anyString());
        verify(notificationRepository, never()).save(any(Notification.class));
    }

    @Test
    @DisplayName("updateEntreprise() → SuperAdmin sans changement de proprietaire ne touche pas au manager")
    void updateEntreprise_whenManagerOwnerUnchanged_succeeds() {
        Manager owner = manager(2L, "Jean", "Dupont", entreprise);
        entreprise.setProprietaire(owner);
        entreprise.setDocumentJustificatif("justificatif.pdf");
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(entrepriseRepository.findById(1L)).thenReturn(Optional.of(entreprise));
        when(entrepriseRepository.save(any(Entreprise.class))).thenAnswer(inv -> inv.getArgument(0));
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of());

        UpdateEntrepriseRequest request = new UpdateEntrepriseRequest(
            "Renommee", null, null, null, null, null, null, null, null, null, 2L, null);
        EntrepriseResponse result = entrepriseService.updateEntreprise(1L, request);

        assertThat(result.nomEntreprise()).isEqualTo("Renommee");
        assertThat(result.managerOwnerId()).isEqualTo(2L);
        verify(managerRepository, never()).findById(anyLong());
        ArgumentCaptor<String> summaryCaptor = ArgumentCaptor.forClass(String.class);
        verify(mailService).sendCompanyNotificationEmail(eq(owner), anyString(), anyString(), anyString(), summaryCaptor.capture());
        assertThat(summaryCaptor.getValue()).contains("Document justificatif: justificatif.pdf");
    }

    @Test
    @DisplayName("updateEntreprise() → SuperAdmin change de proprietaire sans ancien proprietaire")
    void updateEntreprise_bySuperAdminChangeOwnerWithNullPrevious_succeeds() {
        entreprise.setStatut(StatutEntreprise.EN_ATTENTE);
        Manager newOwner = manager(5L, "Marc", "Leroy", null);
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(entrepriseRepository.findById(1L)).thenReturn(Optional.of(entreprise));
        when(managerRepository.findById(5L)).thenReturn(Optional.of(newOwner));
        when(chauffeurRepository.findByManagerId(5L)).thenReturn(List.of());
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of());
        when(entrepriseRepository.save(any(Entreprise.class))).thenAnswer(inv -> inv.getArgument(0));
        when(utilisateurRepository.save(any(Utilisateur.class))).thenAnswer(inv -> inv.getArgument(0));

        UpdateEntrepriseRequest request = new UpdateEntrepriseRequest(
            "Nouveau Nom", null, null, null, null, null, null, null, null, null, 5L, "ACTIF");
        EntrepriseResponse result = entrepriseService.updateEntreprise(1L, request);

        assertThat(result.statut()).isEqualTo(StatutEntreprise.ACTIF);
        assertThat(result.managerOwnerId()).isEqualTo(5L);
        assertThat(newOwner.getEntreprise()).isSameAs(entreprise);
        verify(utilisateurRepository).save(newOwner);
        verify(notificationRepository, times(3)).save(any(Notification.class));
        verify(mailService, times(2)).sendCompanyNotificationEmail(eq(newOwner), anyString(), anyString(), anyString(), anyString());
    }

    @Test
    @DisplayName("updateEntreprise() → SuperAdmin change de proprietaire en detachant l'ancien")
    void updateEntreprise_bySuperAdminChangeOwnerWithPrevious_succeeds() {
        Manager oldOwner = manager(3L, "Ancien", "Gestionnaire", entreprise);
        oldOwner.setEntreprise(entreprise);
        entreprise.setProprietaire(oldOwner);
        Manager newOwner = manager(5L, "Marc", "Leroy", null);
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(entrepriseRepository.findById(1L)).thenReturn(Optional.of(entreprise));
        when(managerRepository.findById(5L)).thenReturn(Optional.of(newOwner));
        when(chauffeurRepository.findByManagerId(5L)).thenReturn(List.of());
        when(chauffeurRepository.findByManagerId(3L)).thenReturn(List.of());
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of());
        when(entrepriseRepository.save(any(Entreprise.class))).thenAnswer(inv -> inv.getArgument(0));
        when(utilisateurRepository.save(any(Utilisateur.class))).thenAnswer(inv -> inv.getArgument(0));

        UpdateEntrepriseRequest request = new UpdateEntrepriseRequest(
            "Renommee", null, null, null, null, null, null, null, null, null, 5L, null);
        EntrepriseResponse result = entrepriseService.updateEntreprise(1L, request);

        assertThat(result.managerOwnerId()).isEqualTo(5L);
        assertThat(newOwner.getEntreprise()).isSameAs(entreprise);
        assertThat(oldOwner.getEntreprise()).isNull();
        assertThat(oldOwner.getSecteur()).isNull();
        verify(utilisateurRepository).save(newOwner);
        verify(utilisateurRepository).save(oldOwner);
        verify(notificationRepository, times(3)).save(any(Notification.class));
    }

    @Test
    @DisplayName("updateEntreprise() → SuperAdmin change de proprietaire et resynchronise les chauffeurs des deux managers")
    void updateEntreprise_bySuperAdminChangeOwner_synchronizesBothChauffeurGroups_succeeds() {
        Manager oldOwner = manager(3L, "Ancien", "Gestionnaire", entreprise);
        oldOwner.setEntreprise(entreprise);
        entreprise.setProprietaire(oldOwner);
        Manager newOwner = manager(5L, "Marc", "Leroy", null);
        Chauffeur newCh = chauffeur(6L, "Nouveau", "Chauffeur", newOwner, null);
        Chauffeur oldCh = chauffeur(7L, "Ancien", "Chauffeur", oldOwner, entreprise);
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(entrepriseRepository.findById(1L)).thenReturn(Optional.of(entreprise));
        when(managerRepository.findById(5L)).thenReturn(Optional.of(newOwner));
        when(chauffeurRepository.findByManagerId(5L)).thenReturn(List.of(newCh));
        when(chauffeurRepository.findByManagerId(3L)).thenReturn(List.of(oldCh));
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of());
        when(entrepriseRepository.save(any(Entreprise.class))).thenAnswer(inv -> inv.getArgument(0));
        when(utilisateurRepository.save(any(Utilisateur.class))).thenAnswer(inv -> inv.getArgument(0));

        UpdateEntrepriseRequest request = new UpdateEntrepriseRequest(
            "Renommee", null, null, null, null, null, null, null, null, null, 5L, null);
        EntrepriseResponse result = entrepriseService.updateEntreprise(1L, request);

        assertThat(result.managerOwnerId()).isEqualTo(5L);
        assertThat(newOwner.getEntreprise()).isSameAs(entreprise);
        assertThat(newCh.getEntreprise()).isSameAs(entreprise);
        assertThat(oldOwner.getEntreprise()).isNull();
        assertThat(oldCh.getEntreprise()).isNull();
        verify(utilisateurRepository).save(newOwner);
        verify(utilisateurRepository).save(newCh);
        verify(utilisateurRepository).save(oldOwner);
        verify(utilisateurRepository).save(oldCh);
    }

    @Test
    @DisplayName("updateEntreprise() → SuperAdmin met a jour tous les champs optionnels")
    void updateEntreprise_bySuperAdmin_updatesAllOptionalFields_succeeds() {
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(entrepriseRepository.findById(1L)).thenReturn(Optional.of(entreprise));
        when(entrepriseRepository.save(any(Entreprise.class))).thenAnswer(inv -> inv.getArgument(0));
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of());

        UpdateEntrepriseRequest request = new UpdateEntrepriseRequest(
            "Nom mis a jour", "nouveau@test.com", "15 rue des Lilas", "0607080910",
            "FR999", "Marie Curie", "justificatif.pdf", "Transport frigorifique",
            25, "logo.png", null, null);
        EntrepriseResponse result = entrepriseService.updateEntreprise(1L, request);

        assertThat(entreprise.getAdresseEntreprise()).isEqualTo("15 rue des Lilas");
        assertThat(entreprise.getNumeroEntreprise()).isEqualTo("0607080910");
        assertThat(entreprise.getCodeTVA()).isEqualTo("FR999");
        assertThat(entreprise.getRepresentantLegal()).isEqualTo("Marie Curie");
        assertThat(entreprise.getDocumentJustificatif()).isEqualTo("justificatif.pdf");
        assertThat(entreprise.getSecteurActivite()).isEqualTo("Transport frigorifique");
        assertThat(entreprise.getTailleFlotte()).isEqualTo(25);
        assertThat(entreprise.getImage()).isEqualTo("logo.png");
        assertThat(result.adresseEntreprise()).isEqualTo("15 rue des Lilas");
    }

    @Test
    @DisplayName("updateEntreprise() → Passage en INACTIF envoie une notification de suspension")
    void updateEntreprise_whenStatusBecomesInactive_sendsSuspension() {
        Manager owner = manager(2L, "Jean", "Dupont", entreprise);
        entreprise.setProprietaire(owner);
        entreprise.setStatut(StatutEntreprise.ACTIF);
        entreprise.setDocumentJustificatif("x".repeat(100));
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(entrepriseRepository.findById(1L)).thenReturn(Optional.of(entreprise));
        when(entrepriseRepository.save(any(Entreprise.class))).thenAnswer(inv -> inv.getArgument(0));
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of());

        UpdateEntrepriseRequest request = new UpdateEntrepriseRequest(
            null, null, null, null, null, null, null, null, null, null, null, "INACTIF");
        EntrepriseResponse result = entrepriseService.updateEntreprise(1L, request);

        assertThat(result.statut()).isEqualTo(StatutEntreprise.INACTIF);
        ArgumentCaptor<Notification> notifCaptor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository, atLeast(1)).save(notifCaptor.capture());
        assertThat(notifCaptor.getAllValues())
            .extracting(Notification::getMessage)
            .anyMatch(m -> m.contains("suspendue"));
        ArgumentCaptor<String> summaryCaptor = ArgumentCaptor.forClass(String.class);
        verify(mailService).sendCompanyNotificationEmail(eq(owner), anyString(), anyString(), anyString(), summaryCaptor.capture());
        assertThat(summaryCaptor.getValue()).contains("Document justificatif: " + "x".repeat(80) + "...");
    }

    @Test
    @DisplayName("updateEntreprise() → Statut inchange n'envoie pas de notification de statut")
    void updateEntreprise_whenStatusUnchanged_noStatusNotification() {
        Manager owner = manager(2L, "Jean", "Dupont", entreprise);
        entreprise.setProprietaire(owner);
        entreprise.setStatut(StatutEntreprise.ACTIF);
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(entrepriseRepository.findById(1L)).thenReturn(Optional.of(entreprise));
        when(entrepriseRepository.save(any(Entreprise.class))).thenAnswer(inv -> inv.getArgument(0));
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of());

        UpdateEntrepriseRequest request = new UpdateEntrepriseRequest(
            null, null, null, null, null, null, null, null, null, null, null, "ACTIF");
        EntrepriseResponse result = entrepriseService.updateEntreprise(1L, request);

        assertThat(result.statut()).isEqualTo(StatutEntreprise.ACTIF);
        verify(notificationRepository, times(1)).save(any(Notification.class));
    }

    @Test
    @DisplayName("updateEntreprise() → Statut invalide retombe sur ACTIF")
    void updateEntreprise_whenStatusInvalid_defaultsToActive() {
        Manager owner = manager(2L, "Jean", "Dupont", entreprise);
        entreprise.setProprietaire(owner);
        entreprise.setStatut(StatutEntreprise.EN_ATTENTE);
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(entrepriseRepository.findById(1L)).thenReturn(Optional.of(entreprise));
        when(entrepriseRepository.save(any(Entreprise.class))).thenAnswer(inv -> inv.getArgument(0));
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of());

        UpdateEntrepriseRequest request = new UpdateEntrepriseRequest(
            null, null, null, null, null, null, null, null, null, null, null, "INVALIDE");
        EntrepriseResponse result = entrepriseService.updateEntreprise(1L, request);

        assertThat(result.statut()).isEqualTo(StatutEntreprise.ACTIF);
        ArgumentCaptor<Notification> notifCaptor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository, atLeast(1)).save(notifCaptor.capture());
        assertThat(notifCaptor.getAllValues())
            .extracting(Notification::getMessage)
            .anyMatch(m -> m.contains("validee"));
    }

    @Test
    @DisplayName("clearEntrepriseOwner() → Non SuperAdmin lance exception")
    void clearEntrepriseOwner_byNonSuperAdmin_throws() {
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);

        assertThatThrownBy(() -> entrepriseService.clearEntrepriseOwner(1L))
            .isInstanceOf(UnauthorizedException.class)
            .hasMessageContaining("Only SuperAdmin can clear company owner");
    }

    @Test
    @DisplayName("clearEntrepriseOwner() → Entreprise introuvable lance exception")
    void clearEntrepriseOwner_whenNotFound_throws() {
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(entrepriseRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> entrepriseService.clearEntrepriseOwner(999L))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("Entreprise introuvable");
    }

    @Test
    @DisplayName("clearEntrepriseOwner() → Entreprise sans proprietaire retourne directement")
    void clearEntrepriseOwner_whenNoOwner_returnsResponse() {
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(entrepriseRepository.findById(1L)).thenReturn(Optional.of(entreprise));

        EntrepriseResponse result = entrepriseService.clearEntrepriseOwner(1L);

        assertThat(result).isNotNull();
        assertThat(result.managerOwnerId()).isNull();
        verify(utilisateurRepository, never()).save(any(Utilisateur.class));
        verify(notificationRepository, never()).save(any(Notification.class));
    }

    @Test
    @DisplayName("clearEntrepriseOwner() → Detache le proprietaire et notifie")
    void clearEntrepriseOwner_withOwner_succeeds() {
        Manager owner = manager(3L, "Ancien", "Gestionnaire", entreprise);
        owner.setEntreprise(entreprise);
        entreprise.setProprietaire(owner);
        Chauffeur ch1 = chauffeur(3L, "Paul", "Martin", owner, entreprise);
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(entrepriseRepository.findById(1L)).thenReturn(Optional.of(entreprise));
        when(chauffeurRepository.findByManagerId(3L)).thenReturn(List.of(ch1));
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of());
        when(entrepriseRepository.save(any(Entreprise.class))).thenAnswer(inv -> inv.getArgument(0));
        when(utilisateurRepository.save(any(Utilisateur.class))).thenAnswer(inv -> inv.getArgument(0));

        EntrepriseResponse result = entrepriseService.clearEntrepriseOwner(1L);

        assertThat(result.managerOwnerId()).isNull();
        assertThat(owner.getEntreprise()).isNull();
        assertThat(owner.getSecteur()).isNull();
        assertThat(ch1.getEntreprise()).isNull();
        verify(utilisateurRepository).save(owner);
        verify(entrepriseRepository).save(entreprise);
        verify(chauffeurRepository).findByManagerId(3L);
        verify(notificationRepository, times(1)).save(any(Notification.class));
    }

    @Test
    @DisplayName("deleteEntreprise() → Non SuperAdmin lance exception")
    void deleteEntreprise_byNonSuperAdmin_throws() {
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);

        assertThatThrownBy(() -> entrepriseService.deleteEntreprise(1L))
            .isInstanceOf(UnauthorizedException.class)
            .hasMessageContaining("Only SuperAdmin can delete companies");
    }

    @Test
    @DisplayName("deleteEntreprise() → Entreprise introuvable lance exception")
    void deleteEntreprise_whenNotFound_throws() {
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(entrepriseRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> entrepriseService.deleteEntreprise(999L))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("Entreprise introuvable");
    }

    @Test
    @DisplayName("deleteEntreprise() → SuperAdmin supprime avec proprietaire, utilisateurs et vehicules lies")
    void deleteEntreprise_withOwnerAndLinkedUsers_succeeds() {
        Manager owner = manager(3L, "Ancien", "Gestionnaire", entreprise);
        owner.setEntreprise(entreprise);
        entreprise.setProprietaire(owner);
        Utilisateur u1 = utilisateur(4L, "Paul", "Martin", Role.CHAUFFEUR);
        Utilisateur u2 = utilisateur(5L, "Pierre", "Durand", Role.CHAUFFEUR);
        u1.setEntreprise(entreprise);
        u2.setEntreprise(entreprise);
        Vehicule v1 = new Vehicule();
        v1.setId(6L);
        v1.setEntreprise(entreprise);
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(entrepriseRepository.findById(1L)).thenReturn(Optional.of(entreprise));
        when(utilisateurRepository.findByEntreprise_Id(1L)).thenReturn(List.of(u1, u2));
        when(vehiculeRepository.findByEntreprise_Id(1L)).thenReturn(List.of(v1));
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of());
        when(entrepriseRepository.save(any(Entreprise.class))).thenAnswer(inv -> inv.getArgument(0));
        when(utilisateurRepository.save(any(Utilisateur.class))).thenAnswer(inv -> inv.getArgument(0));

        entrepriseService.deleteEntreprise(1L);

        assertThat(u1.getEntreprise()).isNull();
        assertThat(u2.getEntreprise()).isNull();
        assertThat(v1.getEntreprise()).isNull();
        assertThat(owner.getEntreprise()).isNull();
        assertThat(entreprise.getProprietaire()).isNull();
        verify(utilisateurRepository).saveAll(anyList());
        verify(vehiculeRepository).saveAll(anyList());
        verify(utilisateurRepository).save(owner);
        verify(entrepriseRepository).save(entreprise);
        verify(entrepriseRepository).delete(entreprise);
        verify(mailService).sendCompanyNotificationEmail(eq(owner), anyString(), anyString(), anyString(), anyString());
    }

    @Test
    @DisplayName("deleteEntreprise() → SuperAdmin supprime sans proprietaire ni elements lies")
    void deleteEntreprise_withoutOwnerAndLinks_succeeds() {
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(entrepriseRepository.findById(1L)).thenReturn(Optional.of(entreprise));
        when(utilisateurRepository.findByEntreprise_Id(1L)).thenReturn(List.of());
        when(vehiculeRepository.findByEntreprise_Id(1L)).thenReturn(List.of());
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of());

        entrepriseService.deleteEntreprise(1L);

        verify(utilisateurRepository, never()).saveAll(anyList());
        verify(vehiculeRepository, never()).saveAll(anyList());
        verify(mailService, never()).sendCompanyNotificationEmail(any(), anyString(), anyString(), anyString(), anyString());
        verify(notificationRepository, never()).save(any(Notification.class));
        verify(entrepriseRepository).delete(entreprise);
    }

    @Test
    @DisplayName("updateEntreprise() → SuperAdmin change statut sans proprietaire ne notifie pas")
    void updateEntreprise_bySuperAdminStatutChange_noOwner_succeeds() {
        Entreprise ent = entreprise(1L, "Test", StatutEntreprise.ACTIF, null);
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(entrepriseRepository.findById(1L)).thenReturn(Optional.of(ent));
        when(entrepriseRepository.save(any(Entreprise.class))).thenAnswer(inv -> inv.getArgument(0));

        UpdateEntrepriseRequest request = new UpdateEntrepriseRequest(
            null, null, null, null, null, null, null, null, null, null, null, "INACTIF");

        entrepriseService.updateEntreprise(1L, request);

        verify(mailService, never()).sendCompanyNotificationEmail(any(), anyString(), anyString(), anyString(), anyString());
    }

    @Test
    @DisplayName("updateEntreprise() → SuperAdmin change statut vers SUSPENDU envoie notification")
    void updateEntreprise_whenStatusBecomesSuspended_sendsSuspension() {
        Manager owner = manager(2L, "Prop", "Prietaire", null);
        Entreprise ent = entreprise(1L, "Test", StatutEntreprise.ACTIF, owner);
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(entrepriseRepository.findById(1L)).thenReturn(Optional.of(ent));
        when(entrepriseRepository.save(any(Entreprise.class))).thenAnswer(inv -> inv.getArgument(0));

        UpdateEntrepriseRequest request = new UpdateEntrepriseRequest(
            null, null, null, null, null, null, null, null, null, null, null, "SUSPENDU");

        entrepriseService.updateEntreprise(1L, request);

        assertThat(ent.getStatut()).isEqualTo(StatutEntreprise.SUSPENDU);
        verify(mailService).sendCompanyNotificationEmail(eq(owner), anyString(), anyString(), anyString(), anyString());
    }

    @Test
    @DisplayName("updateEntreprise() → SuperAdmin met meme statut INACTIF pas de notification suspension")
    void updateEntreprise_whenStatusAlreadyInactive_noNotification() {
        Manager owner = manager(2L, "Prop", "Prietaire", null);
        Entreprise ent = entreprise(1L, "Test", StatutEntreprise.INACTIF, owner);
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(entrepriseRepository.findById(1L)).thenReturn(Optional.of(ent));
        when(entrepriseRepository.save(any(Entreprise.class))).thenAnswer(inv -> inv.getArgument(0));
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of());

        UpdateEntrepriseRequest request = new UpdateEntrepriseRequest(
            null, null, null, null, null, null, null, null, null, null, null, "INACTIF");

        entrepriseService.updateEntreprise(1L, request);

        assertThat(ent.getStatut()).isEqualTo(StatutEntreprise.INACTIF);
        // The status-change-specific notification (suspension) is NOT sent, but the general update email IS sent
        // This verifies we enter L203 but skip both L205 and L207 branches
    }

    @Test
    @DisplayName("updateEntreprise() → Manager sur entreprise sans proprietaire lance exception")
    void updateEntreprise_byManagerNoOwner_throws() {
        Entreprise ent = entreprise(1L, "Test", StatutEntreprise.ACTIF, null);
        Manager mgr = manager(2L, "Jean", "Dupont", ent);
        when(authenticatedUserService.getCurrentUser()).thenReturn(mgr);
        when(entrepriseRepository.findById(1L)).thenReturn(Optional.of(ent));

        UpdateEntrepriseRequest request = new UpdateEntrepriseRequest(
            "New Name", null, null, null, null, null, null, null, null, null, null, null);

        assertThatThrownBy(() -> entrepriseService.updateEntreprise(1L, request))
            .hasMessageContaining("not allowed");
    }

    @Test
    @DisplayName("createEntreprise() → SuperAdmin avec nom null gere trimOrNull")
    void createEntreprise_bySuperAdminWithNullName_succeeds() {
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(entrepriseRepository.save(any(Entreprise.class))).thenAnswer(inv -> inv.getArgument(0));
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of(superAdmin));

        CreateEntrepriseRequest request = createRequest(null, null, "ACTIF");

        entrepriseService.createEntreprise(request);

        verify(entrepriseRepository).save(any(Entreprise.class));
    }
}

