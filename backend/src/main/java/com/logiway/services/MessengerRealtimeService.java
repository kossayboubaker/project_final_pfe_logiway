package com.logiway.services;

import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.Collection;

public interface MessengerRealtimeService {
    SseEmitter register(Long userId);

    void publishMessageToUsers(Collection<Long> userIds, Object payload);

    void publishStatusToUsers(Collection<Long> userIds, Object payload);

    void publishConversationToUsers(Collection<Long> userIds, Object payload);

    void publishPresenceToAll(Object payload);

    void publishNamedEventToUsers(Collection<Long> userIds, String eventName, Object payload);

    boolean hasActiveConnection(Long userId);

    void disconnectUser(Long userId);
}