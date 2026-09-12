package com.logiway.services;

import com.logiway.entities.Notification;

import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.Collection;

public interface NotificationRealtimeService {
    SseEmitter register(Long userId);

    void publishToUsers(Collection<Long> userIds, Notification notification);

    void publishNamedEventToUsers(Collection<Long> userIds, String eventName, Object payload);

    void disconnectUser(Long userId);
}