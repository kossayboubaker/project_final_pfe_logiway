package com.logiway.controllers;

import com.logiway.dto.response.NotificationResponse;
import com.logiway.entities.Utilisateur;
import com.logiway.entities.enums.TypeNotif;
import com.logiway.exceptions.UnauthorizedException;
import com.logiway.security.AuthenticatedUserService;
import com.logiway.services.NotificationRealtimeService;
import com.logiway.services.NotificationService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Controller Notification — Tests Unitaires")
class NotificationControllerTest {

    @Mock
    private NotificationService notificationService;

    @Mock
    private NotificationRealtimeService notificationRealtimeService;

    @Mock
    private AuthenticatedUserService authenticatedUserService;

    @InjectMocks
    private NotificationController notificationController;

    private NotificationResponse notification() {
        return new NotificationResponse(
            1L, TypeNotif.NOTIF_TRAJET, "Nouvelle mission assignée",
            LocalDateTime.of(2025, 2, 10, 8, 0), false, "info"
        );
    }

    @Test
    @DisplayName("GET /api/notifications → Retourne les notifications de l'utilisateur connecté")
    void getMyNotifications_returnsOk() {
        when(notificationService.getCurrentUserNotifications()).thenReturn(List.of(notification()));

        ResponseEntity<List<NotificationResponse>> response = notificationController.getMyNotifications();

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).hasSize(1);
        assertThat(response.getBody().get(0).type()).isEqualTo(TypeNotif.NOTIF_TRAJET);
        verify(notificationService, times(1)).getCurrentUserNotifications();
    }

    @Test
    @DisplayName("GET /api/notifications/unread → Retourne les notifications non lues")
    void getUnreadNotifications_returnsOk() {
        when(notificationService.getCurrentUserUnreadNotifications()).thenReturn(List.of(notification()));

        ResponseEntity<List<NotificationResponse>> response = notificationController.getUnreadNotifications();

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).hasSize(1);
        assertThat(response.getBody().get(0).estLu()).isFalse();
        verify(notificationService, times(1)).getCurrentUserUnreadNotifications();
    }

    @Test
    @DisplayName("GET /api/notifications/stream → Enregistre l'utilisateur sur le flux SSE")
    void stream_returnsSseEmitter() {
        Utilisateur utilisateur = new Utilisateur();
        utilisateur.setId(5L);
        when(authenticatedUserService.getCurrentUser()).thenReturn(utilisateur);
        SseEmitter emitter = new SseEmitter();
        when(notificationRealtimeService.register(5L)).thenReturn(emitter);

        SseEmitter result = notificationController.stream();

        assertThat(result).isSameAs(emitter);
        verify(authenticatedUserService, times(1)).getCurrentUser();
        verify(notificationRealtimeService, times(1)).register(5L);
    }

    @Test
    @DisplayName("GET /api/notifications/stream → Lève UnauthorizedException si l'id est manquant")
    void stream_nullUserId_throwsUnauthorizedException() {
        Utilisateur utilisateur = new Utilisateur();
        when(authenticatedUserService.getCurrentUser()).thenReturn(utilisateur);

        assertThatThrownBy(() -> notificationController.stream())
            .isInstanceOf(UnauthorizedException.class)
            .hasMessage("User id is missing");

        verify(notificationRealtimeService, never()).register(anyLong());
    }
}
