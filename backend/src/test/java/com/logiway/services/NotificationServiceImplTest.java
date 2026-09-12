package com.logiway.services;

import com.logiway.dto.response.NotificationResponse;
import com.logiway.entities.Chauffeur;
import com.logiway.entities.Entreprise;
import com.logiway.entities.Manager;
import com.logiway.entities.Notification;
import com.logiway.entities.Utilisateur;
import com.logiway.entities.enums.Role;
import com.logiway.entities.enums.TypeNotif;
import com.logiway.repositories.ChauffeurRepository;
import com.logiway.repositories.NotificationRepository;
import com.logiway.security.AuthenticatedUserService;
import com.logiway.services.impl.NotificationServiceImpl;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Service Notification — Tests Unitaires")
class NotificationServiceImplTest {

    @Mock private NotificationRepository notificationRepository;
    @Mock private AuthenticatedUserService authenticatedUserService;
    @Mock private ChauffeurRepository chauffeurRepository;

    @InjectMocks
    private NotificationServiceImpl notificationService;

    private Utilisateur superAdmin;
    private Manager manager;
    private Entreprise entreprise;
    private Chauffeur driver;

    @BeforeEach
    void setUp() {
        superAdmin = utilisateur(1L, "Alice", "Admin", Role.SUPERADMIN);
        manager = manager(2L, "Jean", "Dupont", null);
        entreprise = entreprise(1L);
        driver = chauffeur(3L, "Paul", "Martin", manager, entreprise);
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
        m.setEmail(prenom.toLowerCase() + "@test.com");
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

    private Entreprise entreprise(long id) {
        Entreprise e = new Entreprise();
        e.setId(id);
        return e;
    }

    private Notification notification(long id, TypeNotif type, String message, Utilisateur utilisateur, boolean estLu) {
        return Notification.builder()
            .id(id)
            .type(type)
            .message(message)
            .utilisateur(utilisateur)
            .estLu(estLu)
            .dateCreation(LocalDateTime.now())
            .build();
    }

    @Test
    @DisplayName("getCurrentUserNotifications() → SuperAdmin reçoit toutes les notifications")
    void getCurrentUserNotifications_asSuperAdmin_returnsAll() {
        Notification n = notification(1L, TypeNotif.NOTIF_ENTREPRISE,
            "L'entreprise Transport Express a ete creee et affectee.", superAdmin, false);
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(notificationRepository.findAllByOrderByDateCreationDesc()).thenReturn(List.of(n));

        List<NotificationResponse> result = notificationService.getCurrentUserNotifications();

        assertThat(result).hasSize(1);
        NotificationResponse response = result.get(0);
        assertThat(response.id()).isEqualTo(1L);
        assertThat(response.message()).contains("creee et affectee");
        assertThat(response.tone()).isEqualTo("SUCCESS");
        assertThat(response.estLu()).isFalse();
        assertThat(response.type()).isEqualTo(TypeNotif.NOTIF_ENTREPRISE);
    }

    @Test
    @DisplayName("getCurrentUserUnreadNotifications() → SuperAdmin ne voit que les non lues")
    void getCurrentUserUnreadNotifications_asSuperAdmin_filtersRead() {
        Notification read = notification(1L, TypeNotif.NOTIF_COMPTE, "Votre compte est actif.", superAdmin, true);
        Notification unread = notification(2L, TypeNotif.NOTIF_COMPTE, "Votre compte est actif.", superAdmin, false);
        when(authenticatedUserService.getCurrentUser()).thenReturn(superAdmin);
        when(notificationRepository.findAllByOrderByDateCreationDesc()).thenReturn(List.of(read, unread));

        List<NotificationResponse> result = notificationService.getCurrentUserUnreadNotifications();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).id()).isEqualTo(2L);
        assertThat(result.get(0).tone()).isEqualTo("INFO");
    }

    @Test
    @DisplayName("getCurrentUserNotifications() → Chauffeur reçoit ses notifications")
    void getCurrentUserNotifications_asChauffeur_returnsOwn() {
        Notification n = notification(1L, TypeNotif.NOTIF_TRAJET, "Un nouveau trajet vous est assigne.", driver, false);
        when(authenticatedUserService.getCurrentUser()).thenReturn(driver);
        when(notificationRepository.findByUtilisateurOrderByDateCreationDesc(driver)).thenReturn(List.of(n));

        List<NotificationResponse> result = notificationService.getCurrentUserNotifications();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).id()).isEqualTo(1L);
        assertThat(result.get(0).message()).isEqualTo("Un nouveau trajet vous est assigne.");
    }

    @Test
    @DisplayName("getCurrentUserUnreadNotifications() → Chauffeur ne voit que les non lues")
    void getCurrentUserUnreadNotifications_asChauffeur_returnsUnread() {
        Notification n = notification(1L, TypeNotif.NOTIF_TRAJET, "Un nouveau trajet vous est assigne.", driver, false);
        when(authenticatedUserService.getCurrentUser()).thenReturn(driver);
        when(notificationRepository.findByUtilisateurAndEstLuFalseOrderByDateCreationDesc(driver)).thenReturn(List.of(n));

        List<NotificationResponse> result = notificationService.getCurrentUserUnreadNotifications();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).id()).isEqualTo(1L);
    }

    @Test
    @DisplayName("getCurrentUserNotifications() → Manager voit ses notifications et celles de ses chauffeurs")
    void getCurrentUserNotifications_asManager_returnsScopedNotifications() {
        manager.setEntreprise(entreprise);
        Notification forManager = notification(1L, TypeNotif.NOTIF_CONGE,
            "votre demande de congé du 10 au 12 a été approuvée", manager, false);
        Notification forDriver = notification(2L, TypeNotif.NOTIF_CONGE,
            "votre demande de congé du 3 au 5", driver, false);
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(chauffeurRepository.findByManagerId(2L)).thenReturn(List.of(driver));
        when(notificationRepository.findByUtilisateurInOrderByDateCreationDesc(anyList()))
            .thenReturn(List.of(forManager, forDriver));

        List<NotificationResponse> result = notificationService.getCurrentUserNotifications();

        assertThat(result).hasSize(2);
        assertThat(result).extracting(NotificationResponse::id).containsExactly(1L, 2L);
        assertThat(result.get(1).message()).isEqualTo("Demande de congé de Paul Martin du 3 au 5");
    }

    @Test
    @DisplayName("getCurrentUserUnreadNotifications() → Manager ne voit que les non lues de son perimetre")
    void getCurrentUserUnreadNotifications_asManager_returnsScopedUnread() {
        manager.setEntreprise(entreprise);
        Notification n = notification(1L, TypeNotif.NOTIF_AFFECTATION,
            "Vous avez ete affecte a l'entreprise Transport Express.", manager, false);
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(chauffeurRepository.findByManagerId(2L)).thenReturn(List.of(driver));
        when(notificationRepository.findByUtilisateurInAndEstLuFalseOrderByDateCreationDesc(anyList()))
            .thenReturn(List.of(n));

        List<NotificationResponse> result = notificationService.getCurrentUserUnreadNotifications();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).tone()).isEqualTo("SUCCESS");
    }

    @Test
    @DisplayName("getCurrentUserNotifications() → Manager sans entreprise voit tous ses chauffeurs")
    void getCurrentUserNotifications_asManagerWithoutCompany_includesAllDrivers() {
        Notification forDriver = notification(1L, TypeNotif.NOTIF_TRAJET,
            "Un nouveau trajet vous est assigne.", driver, false);
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(chauffeurRepository.findByManagerId(2L)).thenReturn(List.of(driver));
        when(notificationRepository.findByUtilisateurInOrderByDateCreationDesc(anyList()))
            .thenReturn(List.of(forDriver));

        List<NotificationResponse> result = notificationService.getCurrentUserNotifications();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).id()).isEqualTo(1L);
    }

    @Test
    @DisplayName("getCurrentUserNotifications() → Manager exclut les chauffeurs d'une autre entreprise")
    void getCurrentUserNotifications_asManager_excludesDriversFromOtherCompany() {
        manager.setEntreprise(entreprise);
        Entreprise other = entreprise(2L);
        Chauffeur otherDriver = chauffeur(9L, "Pierre", "Durand", manager, other);
        Notification forManager = notification(1L, TypeNotif.NOTIF_TRAJET,
            "Un nouveau trajet vous est assigne.", manager, false);
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(chauffeurRepository.findByManagerId(2L)).thenReturn(List.of(driver, otherDriver));
        when(notificationRepository.findByUtilisateurInOrderByDateCreationDesc(anyList()))
            .thenReturn(List.of(forManager));

        notificationService.getCurrentUserNotifications();

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<Utilisateur>> captor = ArgumentCaptor.forClass(List.class);
        verify(notificationRepository).findByUtilisateurInOrderByDateCreationDesc(captor.capture());
        assertThat(captor.getValue()).extracting(Utilisateur::getId).containsExactly(2L, 3L);
    }

    @Test
    @DisplayName("getCurrentUserNotifications() → Notification d'un chauffeur d'une autre entreprise exclue")
    void getCurrentUserNotifications_asManager_filtersDriverFromOtherCompany() {
        manager.setEntreprise(entreprise);
        Entreprise other = entreprise(2L);
        Chauffeur otherDriver = chauffeur(9L, "Pierre", "Durand", manager, other);
        Notification forManager = notification(1L, TypeNotif.NOTIF_TRAJET,
            "Un nouveau trajet vous est assigne.", manager, false);
        Notification forOtherDriver = notification(2L, TypeNotif.NOTIF_TRAJET,
            "Un nouveau trajet vous est assigne.", otherDriver, false);
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(chauffeurRepository.findByManagerId(2L)).thenReturn(List.of(driver, otherDriver));
        when(notificationRepository.findByUtilisateurInOrderByDateCreationDesc(anyList()))
            .thenReturn(List.of(forManager, forOtherDriver));

        List<NotificationResponse> result = notificationService.getCurrentUserNotifications();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).id()).isEqualTo(1L);
    }

    @Test
    @DisplayName("getCurrentUserNotifications() → Notification d'un utilisateur non chauffeur exclue pour le manager")
    void getCurrentUserNotifications_asManager_excludesNonChauffeurTarget() {
        manager.setEntreprise(entreprise);
        Utilisateur autreManager = manager(7L, "Robert", "Martin", null);
        Notification notVisible = notification(1L, TypeNotif.NOTIF_CONGE,
            "votre demande de congé du 3 au 5", autreManager, false);
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(chauffeurRepository.findByManagerId(2L)).thenReturn(List.of(driver));
        when(notificationRepository.findByUtilisateurInOrderByDateCreationDesc(anyList()))
            .thenReturn(List.of(notVisible));

        List<NotificationResponse> result = notificationService.getCurrentUserNotifications();

        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("getCurrentUserNotifications() → Notification sans destinataire exclue pour le manager")
    void getCurrentUserNotifications_asManager_excludesNotificationWithNullTarget() {
        manager.setEntreprise(entreprise);
        Notification notVisible = notification(1L, TypeNotif.NOTIF_TRAJET,
            "Un nouveau trajet vous est assigne.", null, false);
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(chauffeurRepository.findByManagerId(2L)).thenReturn(List.of(driver));
        when(notificationRepository.findByUtilisateurInOrderByDateCreationDesc(anyList()))
            .thenReturn(List.of(notVisible));

        List<NotificationResponse> result = notificationService.getCurrentUserNotifications();

        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("getCurrentUserNotifications() → Notification d'un chauffeur sans manager exclue")
    void getCurrentUserNotifications_asManager_excludesDriverWithoutManager() {
        manager.setEntreprise(entreprise);
        Chauffeur orphan = chauffeur(9L, "Pierre", "Durand", null, entreprise);
        Notification notVisible = notification(1L, TypeNotif.NOTIF_TRAJET,
            "Un nouveau trajet vous est assigne.", orphan, false);
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(chauffeurRepository.findByManagerId(2L)).thenReturn(List.of(driver, orphan));
        when(notificationRepository.findByUtilisateurInOrderByDateCreationDesc(anyList()))
            .thenReturn(List.of(notVisible));

        List<NotificationResponse> result = notificationService.getCurrentUserNotifications();

        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("getCurrentUserNotifications() → Notification d'un chauffeur d'un autre manager exclue")
    void getCurrentUserNotifications_asManager_excludesDriverOfAnotherManager() {
        manager.setEntreprise(entreprise);
        Manager autreManager = manager(8L, "Robert", "Martin", null);
        Chauffeur autreChauffeur = chauffeur(9L, "Pierre", "Durand", autreManager, entreprise);
        Notification notVisible = notification(1L, TypeNotif.NOTIF_TRAJET,
            "Un nouveau trajet vous est assigne.", autreChauffeur, false);
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(chauffeurRepository.findByManagerId(2L)).thenReturn(List.of(driver, autreChauffeur));
        when(notificationRepository.findByUtilisateurInOrderByDateCreationDesc(anyList()))
            .thenReturn(List.of(notVisible));

        List<NotificationResponse> result = notificationService.getCurrentUserNotifications();

        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("getCurrentUserNotifications() → Notification d'un chauffeur dont le manager n'a pas d'id exclue")
    void getCurrentUserNotifications_asManager_excludesDriverWithManagerWithoutId() {
        manager.setEntreprise(entreprise);
        Manager noIdManager = new Manager();
        noIdManager.setRole(Role.MANAGER);
        Chauffeur autreChauffeur = chauffeur(9L, "Pierre", "Durand", noIdManager, entreprise);
        Notification notVisible = notification(1L, TypeNotif.NOTIF_TRAJET,
            "Un nouveau trajet vous est assigne.", autreChauffeur, false);
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(chauffeurRepository.findByManagerId(2L)).thenReturn(List.of(driver, autreChauffeur));
        when(notificationRepository.findByUtilisateurInOrderByDateCreationDesc(anyList()))
            .thenReturn(List.of(notVisible));

        List<NotificationResponse> result = notificationService.getCurrentUserNotifications();

        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("getCurrentUserNotifications() → Notification d'un chauffeur sans entreprise exclue pour le manager")
    void getCurrentUserNotifications_asManager_excludesDriverWithoutCompany() {
        manager.setEntreprise(entreprise);
        Chauffeur sansEntreprise = chauffeur(9L, "Pierre", "Durand", manager, null);
        Notification notVisible = notification(1L, TypeNotif.NOTIF_TRAJET,
            "Un nouveau trajet vous est assigne.", sansEntreprise, false);
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(chauffeurRepository.findByManagerId(2L)).thenReturn(List.of(driver, sansEntreprise));
        when(notificationRepository.findByUtilisateurInOrderByDateCreationDesc(anyList()))
            .thenReturn(List.of(notVisible));

        List<NotificationResponse> result = notificationService.getCurrentUserNotifications();

        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("getCurrentUserNotifications() → Exception lors du mapping ignore la notification")
    void getCurrentUserNotifications_whenMappingFails_skipsNotification() {
        Notification broken = mock(Notification.class);
        when(broken.getId()).thenThrow(new RuntimeException("boom"));
        when(authenticatedUserService.getCurrentUser()).thenReturn(driver);
        when(notificationRepository.findByUtilisateurOrderByDateCreationDesc(driver))
            .thenReturn(List.of(broken));

        List<NotificationResponse> result = notificationService.getCurrentUserNotifications();

        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("getCurrentUserNotifications() → Notification sans id ignoree")
    void getCurrentUserNotifications_whenNotificationHasNoId_skips() {
        Notification noId = notification(0L, TypeNotif.NOTIF_TRAJET,
            "Un nouveau trajet vous est assigne.", driver, false);
        noId.setId(null);
        when(authenticatedUserService.getCurrentUser()).thenReturn(driver);
        when(notificationRepository.findByUtilisateurOrderByDateCreationDesc(driver))
            .thenReturn(List.of(noId));

        List<NotificationResponse> result = notificationService.getCurrentUserNotifications();

        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("getCurrentUserNotifications() → Notification nulle dans la liste ignoree")
    void getCurrentUserNotifications_nullNotificationInList_skipped() {
        when(authenticatedUserService.getCurrentUser()).thenReturn(driver);
        when(notificationRepository.findByUtilisateurOrderByDateCreationDesc(driver))
            .thenReturn(Collections.singletonList(null));

        List<NotificationResponse> result = notificationService.getCurrentUserNotifications();

        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("isVisibleToManager() → Utilisateur sans id retourne false")
    void getCurrentUserNotifications_asManager_targetWithoutId_excluded() {
        manager.setEntreprise(entreprise);
        Utilisateur noIdTarget = utilisateur(4L, "Sans", "Id", Role.CHAUFFEUR);
        noIdTarget.setId(null);
        Notification notifForNoIdTarget = notification(1L, TypeNotif.NOTIF_TRAJET,
            "Un nouveau trajet vous est assigne.", noIdTarget, false);
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager);
        when(chauffeurRepository.findByManagerId(2L)).thenReturn(List.of(driver));
        when(notificationRepository.findByUtilisateurInOrderByDateCreationDesc(anyList()))
            .thenReturn(List.of(notifForNoIdTarget));

        List<NotificationResponse> result = notificationService.getCurrentUserNotifications();

        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("isVisibleToManager() → Manager sans id retourne false")
    void getCurrentUserNotifications_asManagerWithoutId_excluded() {
        Manager noIdManager = manager(10L, "NoId", "Manager", entreprise);
        noIdManager.setId(null);
        when(authenticatedUserService.getCurrentUser()).thenReturn(noIdManager);
        when(chauffeurRepository.findByManagerId(null)).thenReturn(List.of());
        Notification notif = notification(1L, TypeNotif.NOTIF_TRAJET,
            "Un nouveau trajet vous est assigne.", driver, false);
        when(notificationRepository.findByUtilisateurInOrderByDateCreationDesc(anyList()))
            .thenReturn(List.of(notif));

        List<NotificationResponse> result = notificationService.getCurrentUserNotifications();

        assertThat(result).isEmpty();
    }
}
