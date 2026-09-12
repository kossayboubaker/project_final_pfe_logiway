package com.logiway.controllers;

import com.logiway.dto.response.NotificationResponse;
import com.logiway.security.AuthenticatedUserService;
import com.logiway.services.NotificationRealtimeService;
import com.logiway.services.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@PreAuthorize("hasAnyAuthority('ROLE_SUPERADMIN','ROLE_MANAGER','ROLE_CHAUFFEUR')")
public class NotificationController {

    private final NotificationService notificationService;
    private final NotificationRealtimeService notificationRealtimeService;
    private final AuthenticatedUserService authenticatedUserService;

    @GetMapping
    public ResponseEntity<List<NotificationResponse>> getMyNotifications() {
        return ResponseEntity.ok(notificationService.getCurrentUserNotifications());
    }

    @GetMapping("/unread")
    public ResponseEntity<List<NotificationResponse>> getUnreadNotifications() {
        return ResponseEntity.ok(notificationService.getCurrentUserUnreadNotifications());
    }

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream() {
        Long currentUserId = authenticatedUserService.getCurrentUser().getId();
        if (currentUserId == null) {
            throw new com.logiway.exceptions.UnauthorizedException("User id is missing");
        }
        return notificationRealtimeService.register(currentUserId);
    }
}
