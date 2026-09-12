package com.logiway.services.impl;

import com.logiway.services.MessengerRealtimeService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.Duration;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
@RequiredArgsConstructor
public class MessengerRealtimeServiceImpl implements MessengerRealtimeService {

    private static final long EMITTER_TIMEOUT_MS = Duration.ofMinutes(30).toMillis();

    private final Map<Long, CopyOnWriteArrayList<SseEmitter>> emittersByUser = new ConcurrentHashMap<>();

    @Override
    public SseEmitter register(Long userId) {
        if (userId == null) {
            throw new com.logiway.exceptions.UnauthorizedException("User id is missing for messenger realtime registration");
        }

        SseEmitter emitter = new SseEmitter(EMITTER_TIMEOUT_MS);
        emittersByUser.computeIfAbsent(userId, key -> new CopyOnWriteArrayList<>()).add(emitter);

        emitter.onCompletion(() -> removeEmitter(userId, emitter));
        emitter.onTimeout(() -> removeEmitter(userId, emitter));
        emitter.onError((ignored) -> removeEmitter(userId, emitter));

        try {
            emitter.send(SseEmitter.event().name("connected").data("ok"));
        } catch (IOException ex) {
            removeEmitter(userId, emitter);
        }

        return emitter;
    }

    @Override
    public void publishMessageToUsers(Collection<Long> userIds, Object payload) {
        publish("message", userIds, payload);
    }

    @Override
    public void publishStatusToUsers(Collection<Long> userIds, Object payload) {
        publish("status", userIds, payload);
    }

    @Override
    public void publishConversationToUsers(Collection<Long> userIds, Object payload) {
        publish("conversation", userIds, payload);
    }

    @Override
    public void publishPresenceToAll(Object payload) {
        for (Long userId : emittersByUser.keySet()) {
            publish("presence", List.of(userId), payload);
        }
    }

    @Override
    public void publishNamedEventToUsers(Collection<Long> userIds, String eventName, Object payload) {
        publish(eventName, userIds, payload);
    }

    @Override
    public boolean hasActiveConnection(Long userId) {
        List<SseEmitter> emitters = emittersByUser.get(userId);
        return emitters != null && !emitters.isEmpty();
    }

    @Override
    public void disconnectUser(Long userId) {
        List<SseEmitter> emitters = emittersByUser.remove(userId);
        if (emitters == null) {
            return;
        }

        for (SseEmitter emitter : emitters) {
            emitter.complete();
        }
    }

    private void publish(String eventName, Collection<Long> userIds, Object payload) {
        if (userIds == null || userIds.isEmpty() || payload == null) {
            return;
        }

        for (Long userId : userIds) {
            List<SseEmitter> emitters = emittersByUser.get(userId);
            if (emitters == null || emitters.isEmpty()) {
                continue;
            }

            for (SseEmitter emitter : emitters) {
                try {
                    emitter.send(SseEmitter.event().name(eventName).data(payload));
                } catch (IOException ex) {
                    removeEmitter(userId, emitter);
                }
            }
        }
    }

    private void removeEmitter(Long userId, SseEmitter emitter) {
        List<SseEmitter> emitters = emittersByUser.get(userId);
        if (emitters == null) {
            return;
        }

        emitters.remove(emitter);
        if (emitters.isEmpty()) {
            emittersByUser.remove(userId);
        }
    }
}