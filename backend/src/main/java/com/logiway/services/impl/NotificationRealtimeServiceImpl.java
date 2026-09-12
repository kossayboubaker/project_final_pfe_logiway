package com.logiway.services.impl;

import com.logiway.dto.response.NotificationResponse;
import com.logiway.entities.Chauffeur;
import com.logiway.entities.Notification;
import com.logiway.entities.Utilisateur;
import com.logiway.entities.enums.Role;
import com.logiway.entities.enums.TypeNotif;
import com.logiway.repositories.UtilisateurRepository;
import com.logiway.services.NotificationRealtimeService;
import com.logiway.utils.NotificationMessageResolver;
import com.logiway.utils.NotificationToneResolver;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.Duration;
import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
@RequiredArgsConstructor
public class NotificationRealtimeServiceImpl implements NotificationRealtimeService {

    private static final long EMITTER_TIMEOUT_MS = Duration.ofMinutes(30).toMillis();

    private final UtilisateurRepository utilisateurRepository;
    private final Map<Long, CopyOnWriteArrayList<SseEmitter>> emittersByUser = new ConcurrentHashMap<>();

    @Override
    public SseEmitter register(Long userId) {
        if (userId == null) {
            throw new com.logiway.exceptions.UnauthorizedException("User id is missing for realtime registration");
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
    public void publishToUsers(Collection<Long> userIds, Notification notification) {
        if (userIds == null || userIds.isEmpty() || notification == null) {
            return;
        }

        Set<Long> audience = new LinkedHashSet<>(userIds);
        audience.addAll(resolveAuditAudience(notification));
        Map<Long, Utilisateur> audienceUsers = utilisateurRepository.findAllById(audience).stream()
            .collect(java.util.stream.Collectors.toMap(Utilisateur::getId, user -> user));

        for (Long userId : audience) {
            List<SseEmitter> emitters = emittersByUser.get(userId);
            if (emitters == null || emitters.isEmpty()) {
                continue;
            }

            NotificationResponse response = toResponse(notification, audienceUsers.get(userId));

            for (SseEmitter emitter : emitters) {
                try {
                    emitter.send(SseEmitter.event().name("notification").data(response));
                } catch (IOException ex) {
                    removeEmitter(userId, emitter);
                }
            }
        }
    }

    @Override
    public void publishNamedEventToUsers(Collection<Long> userIds, String eventName, Object payload) {
        if (userIds == null || userIds.isEmpty() || eventName == null || eventName.isBlank() || payload == null) {
            return;
        }

        Set<Long> audience = new LinkedHashSet<>(userIds);

        for (Long userId : audience) {
            List<SseEmitter> emitters = emittersByUser.get(userId);
            if (emitters == null || emitters.isEmpty()) {
                continue;
            }

            for (SseEmitter emitter : emitters) {
                try {
                    emitter.send(SseEmitter.event().name(eventName).data(payload));
                } catch (Exception ex) {
                    // Catch any exception (IO or otherwise) to ensure one bad emitter doesn't break the loop
                    removeEmitter(userId, emitter);
                }
            }
        }
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

    private NotificationResponse toResponse(Notification notification, Utilisateur recipient) {
        String message = NotificationMessageResolver.resolveForRecipient(recipient, notification);
        String tone = NotificationToneResolver.resolve(notification.getType(), message);
        return new NotificationResponse(
            notification.getId(),
            notification.getType(),
            message,
            notification.getDateCreation(),
            notification.getEstLu(),
            tone
        );
    }

    private Set<Long> resolveAuditAudience(Notification notification) {
        Set<Long> audience = new LinkedHashSet<>();

        // Do not broadcast message notifications to audit audience (SuperAdmins).
        // Only keep audit audience for specific notification types when needed.
        if (notification.getType() == TypeNotif.NOTIF_VEHICULE || notification.getType() == TypeNotif.NOTIF_RECLAMATION || notification.getType() == TypeNotif.NOTIF_ENTREPRISE) {
            utilisateurRepository.findByRole(Role.SUPERADMIN)
                .forEach(superAdmin -> audience.add(superAdmin.getId()));
        }

        Utilisateur target = notification.getUtilisateur();
        if (target instanceof Chauffeur chauffeur && chauffeur.getManager() != null) {
            if (chauffeur.getManager().getEntreprise() == null
                || chauffeur.getEntreprise() == null
                || chauffeur.getManager().getEntreprise().getId().equals(chauffeur.getEntreprise().getId())) {
                audience.add(chauffeur.getManager().getId());
            }
        }

        if (target != null && target.getCreatedBy() != null && target.getCreatedBy().getRole() == Role.MANAGER) {
            audience.add(target.getCreatedBy().getId());
        }

        return audience;
    }
}