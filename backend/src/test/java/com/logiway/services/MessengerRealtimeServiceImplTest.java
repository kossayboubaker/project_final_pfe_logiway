package com.logiway.services;

import com.logiway.exceptions.UnauthorizedException;
import com.logiway.services.impl.MessengerRealtimeServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.MockedConstruction;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.lang.reflect.Method;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.function.Consumer;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@DisplayName("Service Messenger Realtime — Tests Unitaires")
class MessengerRealtimeServiceImplTest {

    private MessengerRealtimeServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new MessengerRealtimeServiceImpl();
    }

    private Map<Long, CopyOnWriteArrayList<SseEmitter>> injectEmitters(SseEmitter... emitters) {
        Map<Long, CopyOnWriteArrayList<SseEmitter>> map = new ConcurrentHashMap<>();
        for (int i = 0; i < emitters.length; i++) {
            Long userId = (long) (i + 1);
            map.computeIfAbsent(userId, k -> new CopyOnWriteArrayList<>()).add(emitters[i]);
        }
        ReflectionTestUtils.setField(service, "emittersByUser", map);
        return map;
    }

    @Test
    @DisplayName("register() → Id utilisateur manquant lance exception")
    void register_nullUserId_throws() {
        assertThatThrownBy(() -> service.register(null))
            .isInstanceOf(UnauthorizedException.class)
            .hasMessageContaining("missing");
    }

    @Test
    @DisplayName("register() → Enregistre un emitter actif")
    void register_success() {
        SseEmitter emitter = service.register(1L);

        assertThat(emitter).isNotNull();
        assertThat(service.hasActiveConnection(1L)).isTrue();
    }

    @Test
    @DisplayName("register() + disconnectUser() → Deconnexion complete")
    void register_thenDisconnect() {
        service.register(1L);
        service.register(1L);
        assertThat(service.hasActiveConnection(1L)).isTrue();

        service.disconnectUser(1L);

        assertThat(service.hasActiveConnection(1L)).isFalse();
    }

    @Test
    @DisplayName("disconnectUser() → Utilisateur inconnu ne fait rien")
    void disconnectUser_unknownUser_noop() {
        service.disconnectUser(42L);
        assertThat(service.hasActiveConnection(42L)).isFalse();
    }

    @Test
    @DisplayName("hasActiveConnection() → Aucun emitter retourne false")
    void hasActiveConnection_withoutEmitters_false() {
        assertThat(service.hasActiveConnection(1L)).isFalse();
    }

    @Test
    @DisplayName("publishMessageToUsers() → Diffuse le message aux emitters")
    void publishMessageToUsers_sends() throws Exception {
        SseEmitter emitter = mock(SseEmitter.class);
        injectEmitters(emitter);

        service.publishMessageToUsers(List.of(1L), "payload");

        verify(emitter).send(any(SseEmitter.SseEventBuilder.class));
    }

    @Test
    @DisplayName("publishStatusToUsers() → Diffuse le statut aux emitters")
    void publishStatusToUsers_sends() throws Exception {
        SseEmitter emitter = mock(SseEmitter.class);
        injectEmitters(emitter);

        service.publishStatusToUsers(List.of(1L), "status");

        verify(emitter).send(any(SseEmitter.SseEventBuilder.class));
    }

    @Test
    @DisplayName("publishConversationToUsers() → Diffuse la conversation aux emitters")
    void publishConversationToUsers_sends() throws Exception {
        SseEmitter emitter = mock(SseEmitter.class);
        injectEmitters(emitter);

        service.publishConversationToUsers(List.of(1L), "conv");

        verify(emitter).send(any(SseEmitter.SseEventBuilder.class));
    }

    @Test
    @DisplayName("publishPresenceToAll() → Diffuse la presence a tous les utilisateurs enregistres")
    void publishPresenceToAll_sendsToAll() throws Exception {
        SseEmitter emitter1 = mock(SseEmitter.class);
        SseEmitter emitter2 = mock(SseEmitter.class);
        injectEmitters(emitter1, emitter2);

        service.publishPresenceToAll("presence");

        verify(emitter1).send(any(SseEmitter.SseEventBuilder.class));
        verify(emitter2).send(any(SseEmitter.SseEventBuilder.class));
    }

    @Test
    @DisplayName("publishNamedEventToUsers() → Diffuse un evenement nomme")
    void publishNamedEventToUsers_sends() throws Exception {
        SseEmitter emitter = mock(SseEmitter.class);
        injectEmitters(emitter);

        service.publishNamedEventToUsers(List.of(1L), "custom-event", "data");

        verify(emitter).send(any(SseEmitter.SseEventBuilder.class));
    }

    @Test
    @DisplayName("publish() → Destinataires vides ou payload null ne font rien")
    void publish_invalidArgs_noop() throws Exception {
        SseEmitter emitter = mock(SseEmitter.class);
        injectEmitters(emitter);

        service.publishMessageToUsers(List.of(), "payload");
        service.publishMessageToUsers(null, "payload");
        service.publishMessageToUsers(List.of(1L), null);

        verify(emitter, never()).send(any(SseEmitter.SseEventBuilder.class));
    }

    @Test
    @DisplayName("publish() → Utilisateur sans emitter est ignore")
    void publish_userWithoutEmitter_skipped() throws Exception {
        SseEmitter emitter = mock(SseEmitter.class);
        injectEmitters(emitter);

        service.publishMessageToUsers(List.of(1L, 999L), "payload");

        verify(emitter).send(any(SseEmitter.SseEventBuilder.class));
    }

    @Test
    @DisplayName("publish() → Liste d'emitters vide (non null) ignoree")
    void publish_userWithEmptyEmitterList_skipped() throws Exception {
        SseEmitter emitter = mock(SseEmitter.class);
        Map<Long, CopyOnWriteArrayList<SseEmitter>> map = new ConcurrentHashMap<>();
        map.put(1L, new CopyOnWriteArrayList<>(List.of(emitter)));
        map.put(999L, new CopyOnWriteArrayList<>());
        ReflectionTestUtils.setField(service, "emittersByUser", map);

        service.publishMessageToUsers(List.of(1L, 999L), "payload");

        verify(emitter).send(any(SseEmitter.SseEventBuilder.class));
    }

    @Test
    @DisplayName("publish() → Erreur d'envoi retire l'emitter")
    void publish_sendFails_removesEmitter() throws Exception {
        SseEmitter emitter = mock(SseEmitter.class);
        doThrow(new IOException("boom")).when(emitter).send(any(SseEmitter.SseEventBuilder.class));
        Map<Long, CopyOnWriteArrayList<SseEmitter>> map = injectEmitters(emitter);

        service.publishMessageToUsers(List.of(1L), "payload");

        assertThat(map.containsKey(1L)).isFalse();
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

            assertThat(service.hasActiveConnection(1L)).isFalse();
        }
    }

    @Test
    @DisplayName("removeEmitter() → Utilisateur inconnu ne fait rien")
    void removeEmitter_unknownUser_noop() throws Exception {
        Method method = MessengerRealtimeServiceImpl.class.getDeclaredMethod("removeEmitter", Long.class, SseEmitter.class);
        method.setAccessible(true);

        method.invoke(service, 42L, mock(SseEmitter.class));
    }

    @Test
    @DisplayName("hasActiveConnection() → Liste vide retourne false")
    void hasActiveConnection_emptyEmitterList_returnsFalse() {
        ConcurrentHashMap<Long, CopyOnWriteArrayList<SseEmitter>> map = new ConcurrentHashMap<>();
        map.put(1L, new CopyOnWriteArrayList<>());
        ReflectionTestUtils.setField(service, "emittersByUser", map);

        assertThat(service.hasActiveConnection(1L)).isFalse();
    }

    @Test
    @DisplayName("removeEmitter() → Liste avec plusieurs emitters ne supprime pas l'entree")
    void removeEmitter_multipleEmitters_keepsEntry() throws Exception {
        SseEmitter emitter1 = mock(SseEmitter.class);
        SseEmitter emitter2 = mock(SseEmitter.class);
        ConcurrentHashMap<Long, CopyOnWriteArrayList<SseEmitter>> map = new ConcurrentHashMap<>();
        CopyOnWriteArrayList<SseEmitter> list = new CopyOnWriteArrayList<>(List.of(emitter1, emitter2));
        map.put(1L, list);
        ReflectionTestUtils.setField(service, "emittersByUser", map);

        Method method = MessengerRealtimeServiceImpl.class.getDeclaredMethod("removeEmitter", Long.class, SseEmitter.class);
        method.setAccessible(true);
        method.invoke(service, 1L, emitter1);

        assertThat(service.hasActiveConnection(1L)).isTrue();
        assertThat(map.get(1L)).hasSize(1);
    }

    @Test
    @DisplayName("register() → onCompletion retire l'emitter")
    void register_onCompletion_removesEmitter() {
        try (MockedConstruction<SseEmitter> mocked = mockConstruction(SseEmitter.class)) {
            service.register(1L);
            assertThat(service.hasActiveConnection(1L)).isTrue();

            ArgumentCaptor<Runnable> captor = ArgumentCaptor.forClass(Runnable.class);
            verify(mocked.constructed().get(0)).onCompletion(captor.capture());
            captor.getValue().run();

            assertThat(service.hasActiveConnection(1L)).isFalse();
        }
    }

    @Test
    @DisplayName("register() → onTimeout retire l'emitter")
    void register_onTimeout_removesEmitter() {
        try (MockedConstruction<SseEmitter> mocked = mockConstruction(SseEmitter.class)) {
            service.register(1L);
            assertThat(service.hasActiveConnection(1L)).isTrue();

            ArgumentCaptor<Runnable> captor = ArgumentCaptor.forClass(Runnable.class);
            verify(mocked.constructed().get(0)).onTimeout(captor.capture());
            captor.getValue().run();

            assertThat(service.hasActiveConnection(1L)).isFalse();
        }
    }

    @Test
    @DisplayName("register() → onError retire l'emitter")
    void register_onError_removesEmitter() {
        try (MockedConstruction<SseEmitter> mocked = mockConstruction(SseEmitter.class)) {
            service.register(1L);
            assertThat(service.hasActiveConnection(1L)).isTrue();

            ArgumentCaptor<Consumer<Throwable>> captor = ArgumentCaptor.forClass(Consumer.class);
            verify(mocked.constructed().get(0)).onError(captor.capture());
            captor.getValue().accept(new RuntimeException("boom"));

            assertThat(service.hasActiveConnection(1L)).isFalse();
        }
    }
}
