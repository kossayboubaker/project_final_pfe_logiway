package com.logiway.services;

import com.logiway.dto.response.NotificationResponse;
import com.logiway.entities.Chauffeur;
import com.logiway.entities.Entreprise;
import com.logiway.entities.Manager;
import com.logiway.entities.Notification;
import com.logiway.entities.Utilisateur;
import com.logiway.entities.enums.Role;
import com.logiway.entities.enums.TypeNotif;
import com.logiway.exceptions.UnauthorizedException;
import com.logiway.repositories.UtilisateurRepository;
import com.logiway.services.impl.NotificationRealtimeServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.MockedConstruction;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.lang.reflect.Method;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Service Notification Realtime — Tests Unitaires")
class NotificationRealtimeServiceImplTest {

    @Mock
    private UtilisateurRepository utilisateurRepository;

    private NotificationRealtimeServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new NotificationRealtimeServiceImpl(utilisateurRepository);
    }

    private Map<Long, CopyOnWriteArrayList<SseEmitter>> injectEmitters(Map<Long, SseEmitter> emitters) {
        Map<Long, CopyOnWriteArrayList<SseEmitter>> map = new ConcurrentHashMap<>();
        emitters.forEach((userId, emitter) ->
            map.computeIfAbsent(userId, k -> new CopyOnWriteArrayList<>()).add(emitter));
        ReflectionTestUtils.setField(service, "emittersByUser", map);
        return map;
    }

    private Notification notification(TypeNotif type, Utilisateur target) {
        return Notification.builder()
            .id(1L)
            .type(type)
            .dateCreation(LocalDateTime.now())
            .estLu(false)
            .message("Un evenement s'est produit")
            .utilisateur(target)
            .build();
    }

    private Manager manager(Long id, Long entrepriseId) {
        Manager manager = new Manager();
        manager.setId(id);
        manager.setRole(Role.MANAGER);
        manager.setPrenom("M" + id);
        manager.setNom("Manager");
        if (entrepriseId != null) {
            Entreprise entreprise = new Entreprise();
            entreprise.setId(entrepriseId);
            manager.setEntreprise(entreprise);
        }
        return manager;
    }

    private Chauffeur chauffeur(Long id, Long entrepriseId, Manager manager) {
        Chauffeur chauffeur = new Chauffeur();
        chauffeur.setId(id);
        chauffeur.setRole(Role.CHAUFFEUR);
        chauffeur.setPrenom("C" + id);
        chauffeur.setNom("Chauffeur");
        chauffeur.setManager(manager);
        if (entrepriseId != null) {
            Entreprise entreprise = new Entreprise();
            entreprise.setId(entrepriseId);
            chauffeur.setEntreprise(entreprise);
        }
        return chauffeur;
    }

    @Test
    @DisplayName("register() → Id utilisateur manquant lance exception")
    void register_nullUserId_throws() {
        assertThatThrownBy(() -> service.register(null))
            .isInstanceOf(UnauthorizedException.class)
            .hasMessageContaining("missing");
    }

    @Test
    @DisplayName("register() → Enregistre un emitter et deconnecte proprement")
    void register_thenDisconnect() {
        SseEmitter emitter = service.register(1L);
        assertThat(emitter).isNotNull();

        service.disconnectUser(1L);
        service.disconnectUser(99L);
    }

    @Test
    @DisplayName("publishToUsers() → Destinataires vides ou notification null ne font rien")
    void publishToUsers_invalidArgs_noop() throws Exception {
        SseEmitter emitter = mock(SseEmitter.class);
        injectEmitters(Map.of(1L, emitter));

        service.publishToUsers(List.of(), notification(TypeNotif.NOTIF_CONGE, null));
        service.publishToUsers(null, notification(TypeNotif.NOTIF_CONGE, null));
        service.publishToUsers(List.of(1L), null);

        verify(emitter, never()).send(any(SseEmitter.SseEventBuilder.class));
    }

    @Test
    @DisplayName("publishToUsers() → Diffuse a l'audience complete (destinataire + audit)")
    void publishToUsers_sendsToAudience() throws Exception {
        Manager manager = manager(2L, 100L);
        Chauffeur chauffeur = chauffeur(1L, 100L, manager);
        chauffeur.setCreatedBy(manager(3L, 100L));
        Utilisateur superAdmin = new Utilisateur();
        superAdmin.setId(4L);
        superAdmin.setRole(Role.SUPERADMIN);

        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of(superAdmin));
        when(utilisateurRepository.findAllById(anyCollection()))
            .thenReturn(List.of(chauffeur, manager, chauffeur.getCreatedBy(), superAdmin));

        SseEmitter chauffeurEmitter = mock(SseEmitter.class);
        SseEmitter managerEmitter = mock(SseEmitter.class);
        SseEmitter createdByEmitter = mock(SseEmitter.class);
        SseEmitter superAdminEmitter = mock(SseEmitter.class);
        injectEmitters(Map.of(1L, chauffeurEmitter, 2L, managerEmitter, 3L, createdByEmitter, 4L, superAdminEmitter));

        service.publishToUsers(List.of(1L), notification(TypeNotif.NOTIF_VEHICULE, chauffeur));

        verify(chauffeurEmitter).send(any(SseEmitter.SseEventBuilder.class));
        verify(managerEmitter).send(any(SseEmitter.SseEventBuilder.class));
        verify(createdByEmitter).send(any(SseEmitter.SseEventBuilder.class));
        verify(superAdminEmitter).send(any(SseEmitter.SseEventBuilder.class));
        verify(utilisateurRepository).findByRole(Role.SUPERADMIN);
    }

    @Test
    @DisplayName("publishToUsers() → Envoie une NotificationResponse au destinataire")
    void publishToUsers_sendsNotificationResponse() throws Exception {
        Chauffeur chauffeur = chauffeur(1L, null, null);
        when(utilisateurRepository.findAllById(anyCollection())).thenReturn(List.of(chauffeur));

        SseEmitter emitter = mock(SseEmitter.class);
        injectEmitters(Map.of(1L, emitter));

        service.publishToUsers(List.of(1L), notification(TypeNotif.NOTIF_CONGE, chauffeur));

        ArgumentCaptor<SseEmitter.SseEventBuilder> captor =
            ArgumentCaptor.forClass(SseEmitter.SseEventBuilder.class);
        verify(emitter).send(captor.capture());
    }

    @Test
    @DisplayName("publishToUsers() → Utilisateur sans emitter est ignore")
    void publishToUsers_userWithoutEmitter_skipped() throws Exception {
        Chauffeur chauffeur = chauffeur(1L, null, null);
        when(utilisateurRepository.findAllById(anyCollection())).thenReturn(List.of(chauffeur));

        SseEmitter emitter = mock(SseEmitter.class);
        injectEmitters(Map.of(1L, emitter));

        service.publishToUsers(List.of(1L, 999L), notification(TypeNotif.NOTIF_CONGE, chauffeur));

        verify(emitter).send(any(SseEmitter.SseEventBuilder.class));
    }

    @Test
    @DisplayName("publishToUsers() → Liste d'emitters vide (non null) ignoree")
    void publishToUsers_userWithEmptyEmitterList_skipped() throws Exception {
        Chauffeur chauffeur = chauffeur(1L, null, null);
        when(utilisateurRepository.findAllById(anyCollection())).thenReturn(List.of(chauffeur));

        SseEmitter emitter = mock(SseEmitter.class);
        Map<Long, CopyOnWriteArrayList<SseEmitter>> map = new ConcurrentHashMap<>();
        map.put(1L, new CopyOnWriteArrayList<>(List.of(emitter)));
        map.put(999L, new CopyOnWriteArrayList<>());
        ReflectionTestUtils.setField(service, "emittersByUser", map);

        service.publishToUsers(List.of(1L, 999L), notification(TypeNotif.NOTIF_CONGE, chauffeur));

        verify(emitter).send(any(SseEmitter.SseEventBuilder.class));
    }

    @Test
    @DisplayName("publishToUsers() → Erreur d'envoi retire l'emitter")
    void publishToUsers_sendFails_removesEmitter() throws Exception {
        Chauffeur chauffeur = chauffeur(1L, null, null);
        when(utilisateurRepository.findAllById(anyCollection())).thenReturn(List.of(chauffeur));

        SseEmitter emitter = mock(SseEmitter.class);
        doThrow(new IOException("boom")).when(emitter).send(any(SseEmitter.SseEventBuilder.class));
        Map<Long, CopyOnWriteArrayList<SseEmitter>> map = injectEmitters(Map.of(1L, emitter));

        service.publishToUsers(List.of(1L), notification(TypeNotif.NOTIF_CONGE, chauffeur));

        assertThat(map.containsKey(1L)).isFalse();
    }

    @Test
    @DisplayName("publishToUsers() → Type message ne sollicite pas l'audience SuperAdmin")
    void publishToUsers_messageType_noAuditAudience() throws Exception {
        Chauffeur chauffeur = chauffeur(1L, null, null);
        when(utilisateurRepository.findAllById(anyCollection())).thenReturn(List.of(chauffeur));

        SseEmitter emitter = mock(SseEmitter.class);
        injectEmitters(Map.of(1L, emitter));

        service.publishToUsers(List.of(1L), notification(TypeNotif.NOTIF_MESSAGE, chauffeur));

        verify(emitter).send(any(SseEmitter.SseEventBuilder.class));
        verify(utilisateurRepository, never()).findByRole(Role.SUPERADMIN);
    }

    @Test
    @DisplayName("resolveAuditAudience() → Manager d'entreprise differente non ajoute")
    void publishToUsers_managerDifferentCompany_notInAudience() throws Exception {
        Manager manager = manager(2L, 100L);
        Chauffeur chauffeur = chauffeur(1L, 200L, manager);
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of());
        when(utilisateurRepository.findAllById(anyCollection())).thenReturn(List.of(chauffeur));

        SseEmitter chauffeurEmitter = mock(SseEmitter.class);
        SseEmitter managerEmitter = mock(SseEmitter.class);
        injectEmitters(Map.of(1L, chauffeurEmitter, 2L, managerEmitter));

        service.publishToUsers(List.of(1L), notification(TypeNotif.NOTIF_VEHICULE, chauffeur));

        verify(chauffeurEmitter).send(any(SseEmitter.SseEventBuilder.class));
        verify(managerEmitter, never()).send(any(SseEmitter.SseEventBuilder.class));
    }

    @Test
    @DisplayName("publishNamedEventToUsers() → Diffuse un evenement nomme")
    void publishNamedEventToUsers_sends() throws Exception {
        SseEmitter emitter = mock(SseEmitter.class);
        injectEmitters(Map.of(1L, emitter));

        service.publishNamedEventToUsers(List.of(1L), "notification-event", "data");

        verify(emitter).send(any(SseEmitter.SseEventBuilder.class));
    }

    @Test
    @DisplayName("publishNamedEventToUsers() → Arguments invalides ne font rien")
    void publishNamedEventToUsers_invalidArgs_noop() throws Exception {
        SseEmitter emitter = mock(SseEmitter.class);
        injectEmitters(Map.of(1L, emitter));

        service.publishNamedEventToUsers(List.of(), "e", "p");
        service.publishNamedEventToUsers(null, "e", "p");
        service.publishNamedEventToUsers(List.of(1L), null, "p");
        service.publishNamedEventToUsers(List.of(1L), " ", "p");
        service.publishNamedEventToUsers(List.of(1L), "e", null);

        verify(emitter, never()).send(any(SseEmitter.SseEventBuilder.class));
    }

    @Test
    @DisplayName("publishNamedEventToUsers() → Erreur d'envoi retire l'emitter")
    void publishNamedEventToUsers_sendFails_removesEmitter() throws Exception {
        SseEmitter emitter = mock(SseEmitter.class);
        doThrow(new RuntimeException("boom")).when(emitter).send(any(SseEmitter.SseEventBuilder.class));
        Map<Long, CopyOnWriteArrayList<SseEmitter>> map = injectEmitters(Map.of(1L, emitter));

        service.publishNamedEventToUsers(List.of(1L), "e", "p");

        assertThat(map.containsKey(1L)).isFalse();
    }

    @Test
    @DisplayName("publishNamedEventToUsers() → Liste d'emitters vide (non null) ignoree")
    void publishNamedEventToUsers_userWithEmptyEmitterList_skipped() throws Exception {
        SseEmitter emitter = mock(SseEmitter.class);
        Map<Long, CopyOnWriteArrayList<SseEmitter>> map = new ConcurrentHashMap<>();
        map.put(1L, new CopyOnWriteArrayList<>(List.of(emitter)));
        map.put(999L, new CopyOnWriteArrayList<>());
        ReflectionTestUtils.setField(service, "emittersByUser", map);

        service.publishNamedEventToUsers(List.of(1L, 999L), "notification-event", "data");

        verify(emitter).send(any(SseEmitter.SseEventBuilder.class));
    }

    @Test
    @DisplayName("register() → Erreur d'envoi initiale retire l'emitter")
    void register_sendFails_removesEmitter() throws Exception {
        try (MockedConstruction<SseEmitter> mocked = mockConstruction(SseEmitter.class, (mock, context) -> {
            try {
                doThrow(new IOException("boom")).when(mock).send(any(SseEmitter.SseEventBuilder.class));
            } catch (Exception ex) {
                throw new RuntimeException(ex);
            }
        })) {
            service.register(1L);

            Map<Long, ?> map = (Map<Long, ?>) ReflectionTestUtils.getField(service, "emittersByUser");
            assertThat(map).doesNotContainKey(1L);
        }
    }

    @Test
    @DisplayName("removeEmitter() → Utilisateur inconnu ne fait rien")
    void removeEmitter_unknownUser_noop() throws Exception {
        Method method = NotificationRealtimeServiceImpl.class.getDeclaredMethod("removeEmitter", Long.class, SseEmitter.class);
        method.setAccessible(true);

        method.invoke(service, 42L, mock(SseEmitter.class));
    }

    @Test
    @DisplayName("publishNamedEventToUsers() → Utilisateur sans emitter ignore la boucle")
    void publishNamedEventToUsers_userNotInMap_skipped() throws Exception {
        SseEmitter emitter = mock(SseEmitter.class);
        injectEmitters(Map.of(1L, emitter));

        service.publishNamedEventToUsers(List.of(1L, 999L), "notification-event", "data");

        verify(emitter).send(any(SseEmitter.SseEventBuilder.class));
    }

    @Test
    @DisplayName("removeEmitter() → Liste non vide apres retrait garde l'entree")
    void removeEmitter_listNotEmptyAfterRemove_keepsEntry() throws Exception {
        Method method = NotificationRealtimeServiceImpl.class.getDeclaredMethod("removeEmitter", Long.class, SseEmitter.class);
        method.setAccessible(true);

        SseEmitter emitter1 = mock(SseEmitter.class);
        SseEmitter emitter2 = mock(SseEmitter.class);
        Map<Long, CopyOnWriteArrayList<SseEmitter>> map = new ConcurrentHashMap<>();
        map.put(1L, new CopyOnWriteArrayList<>(List.of(emitter1, emitter2)));
        ReflectionTestUtils.setField(service, "emittersByUser", map);

        method.invoke(service, 1L, emitter1);

        assertThat(map.containsKey(1L)).isTrue();
        assertThat(map.get(1L)).hasSize(1);
    }

    @Test
    @DisplayName("resolveAuditAudience() → NOTIF_RECLAMATION ajoute les superAdmins")
    void publishToUsers_notifReclamation_addsSuperAdmins() throws Exception {
        Utilisateur superAdmin = new Utilisateur();
        superAdmin.setId(10L);
        superAdmin.setRole(Role.SUPERADMIN);

        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of(superAdmin));
        when(utilisateurRepository.findAllById(anyCollection())).thenReturn(List.of(superAdmin));

        SseEmitter superAdminEmitter = mock(SseEmitter.class);
        injectEmitters(Map.of(10L, superAdminEmitter));

        service.publishToUsers(List.of(10L), notification(TypeNotif.NOTIF_RECLAMATION, null));

        verify(superAdminEmitter).send(any(SseEmitter.SseEventBuilder.class));
        verify(utilisateurRepository).findByRole(Role.SUPERADMIN);
    }

    @Test
    @DisplayName("resolveAuditAudience() → NOTIF_ENTREPRISE ajoute les superAdmins")
    void publishToUsers_notifEntreprise_addsSuperAdmins() throws Exception {
        Utilisateur superAdmin = new Utilisateur();
        superAdmin.setId(10L);
        superAdmin.setRole(Role.SUPERADMIN);

        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of(superAdmin));
        when(utilisateurRepository.findAllById(anyCollection())).thenReturn(List.of(superAdmin));

        SseEmitter superAdminEmitter = mock(SseEmitter.class);
        injectEmitters(Map.of(10L, superAdminEmitter));

        service.publishToUsers(List.of(10L), notification(TypeNotif.NOTIF_ENTREPRISE, null));

        verify(superAdminEmitter).send(any(SseEmitter.SseEventBuilder.class));
    }

    @Test
    @DisplayName("resolveAuditAudience() → Target non Chauffeur ignore le bloc manager")
    void publishToUsers_targetNotChauffeur_skipsManagerBlock() throws Exception {
        Utilisateur plainUser = new Utilisateur();
        plainUser.setId(1L);
        plainUser.setRole(Role.MANAGER);
        when(utilisateurRepository.findAllById(anyCollection())).thenReturn(List.of(plainUser));

        SseEmitter emitter = mock(SseEmitter.class);
        injectEmitters(Map.of(1L, emitter));

        service.publishToUsers(List.of(1L), notification(TypeNotif.NOTIF_VEHICULE, plainUser));

        verify(emitter).send(any(SseEmitter.SseEventBuilder.class));
    }

    @Test
    @DisplayName("resolveAuditAudience() → Manager sans entreprise ajoute le manager")
    void publishToUsers_managerWithNullEntreprise_addsManager() throws Exception {
        Manager managerWithoutEntreprise = manager(2L, null);
        Chauffeur chauffeur = chauffeur(1L, 100L, managerWithoutEntreprise);
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of());
        when(utilisateurRepository.findAllById(anyCollection())).thenReturn(List.of(chauffeur, managerWithoutEntreprise));

        SseEmitter chauffeurEmitter = mock(SseEmitter.class);
        SseEmitter managerEmitter = mock(SseEmitter.class);
        injectEmitters(Map.of(1L, chauffeurEmitter, 2L, managerEmitter));

        service.publishToUsers(List.of(1L), notification(TypeNotif.NOTIF_VEHICULE, chauffeur));

        verify(chauffeurEmitter).send(any(SseEmitter.SseEventBuilder.class));
        verify(managerEmitter).send(any(SseEmitter.SseEventBuilder.class));
    }

    @Test
    @DisplayName("resolveAuditAudience() → Chauffeur sans entreprise ajoute le manager")
    void publishToUsers_chauffeurWithNullEntreprise_addsManager() throws Exception {
        Manager manager = manager(2L, 100L);
        Chauffeur chauffeurWithoutEntreprise = chauffeur(1L, null, manager);
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of());
        when(utilisateurRepository.findAllById(anyCollection())).thenReturn(List.of(chauffeurWithoutEntreprise, manager));

        SseEmitter chauffeurEmitter = mock(SseEmitter.class);
        SseEmitter managerEmitter = mock(SseEmitter.class);
        injectEmitters(Map.of(1L, chauffeurEmitter, 2L, managerEmitter));

        service.publishToUsers(List.of(1L), notification(TypeNotif.NOTIF_VEHICULE, chauffeurWithoutEntreprise));

        verify(chauffeurEmitter).send(any(SseEmitter.SseEventBuilder.class));
        verify(managerEmitter).send(any(SseEmitter.SseEventBuilder.class));
    }

    @Test
    @DisplayName("resolveAuditAudience() → Target avec createdBy null ne l'ajoute pas")
    void publishToUsers_targetWithNullCreatedBy_skipped() throws Exception {
        Chauffeur chauffeur = chauffeur(1L, 100L, manager(2L, 100L));
        chauffeur.setCreatedBy(null);
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of());
        when(utilisateurRepository.findAllById(anyCollection())).thenReturn(List.of(chauffeur));

        SseEmitter emitter = mock(SseEmitter.class);
        injectEmitters(Map.of(1L, emitter));

        service.publishToUsers(List.of(1L), notification(TypeNotif.NOTIF_VEHICULE, chauffeur));

        verify(emitter).send(any(SseEmitter.SseEventBuilder.class));
    }

    @Test
    @DisplayName("resolveAuditAudience() → Target avec createdBy role non MANAGER ne l'ajoute pas")
    void publishToUsers_targetWithCreatedByNotManager_skipped() throws Exception {
        Chauffeur chauffeur = chauffeur(1L, 100L, manager(2L, 100L));
        Utilisateur nonManagerCreator = new Utilisateur();
        nonManagerCreator.setId(5L);
        nonManagerCreator.setRole(Role.SUPERADMIN);
        chauffeur.setCreatedBy(nonManagerCreator);
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of());
        when(utilisateurRepository.findAllById(anyCollection())).thenReturn(List.of(chauffeur));

        SseEmitter emitter = mock(SseEmitter.class);
        injectEmitters(Map.of(1L, emitter));

        service.publishToUsers(List.of(1L), notification(TypeNotif.NOTIF_VEHICULE, chauffeur));

        verify(emitter).send(any(SseEmitter.SseEventBuilder.class));
    }

    @Test
    @DisplayName("register() → Verifie les callbacks onCompletion, onTimeout, onError")
    void register_callbacksTriggerRemoveEmitter() {
        try (MockedConstruction<SseEmitter> mocked = mockConstruction(SseEmitter.class)) {
            service.register(1L);
            ArgumentCaptor<Runnable> completionCaptor = ArgumentCaptor.forClass(Runnable.class);
            ArgumentCaptor<Runnable> timeoutCaptor = ArgumentCaptor.forClass(Runnable.class);
            ArgumentCaptor<java.util.function.Consumer> errorCaptor = ArgumentCaptor.forClass(java.util.function.Consumer.class);

            SseEmitter constructed = mocked.constructed().get(0);
            verify(constructed).onCompletion(completionCaptor.capture());
            verify(constructed).onTimeout(timeoutCaptor.capture());
            verify(constructed).onError(errorCaptor.capture());

            // Run completion callback
            completionCaptor.getValue().run();

            // Run timeout callback
            timeoutCaptor.getValue().run();

            // Run error callback
            errorCaptor.getValue().accept(new IOException("test"));
        }
    }
}


