package com.logiway.services.impl;

import com.logiway.dto.response.NotificationResponse;
import com.logiway.entities.Chauffeur;
import com.logiway.entities.Utilisateur;
import com.logiway.entities.enums.Role;
import com.logiway.repositories.ChauffeurRepository;
import com.logiway.repositories.NotificationRepository;
import com.logiway.security.AuthenticatedUserService;
import com.logiway.services.NotificationService;
import com.logiway.utils.NotificationMessageResolver;
import com.logiway.utils.NotificationToneResolver;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final AuthenticatedUserService authenticatedUserService;
    private final ChauffeurRepository chauffeurRepository;

    @Override
    @Transactional(readOnly = true)
    public List<NotificationResponse> getCurrentUserNotifications() {
        Utilisateur currentUser = authenticatedUserService.getCurrentUser();
        return getScopedNotifications(currentUser, false).stream()
            .map(n -> safeToResponse(currentUser, n))
            .filter(java.util.Objects::nonNull)
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<NotificationResponse> getCurrentUserUnreadNotifications() {
        Utilisateur currentUser = authenticatedUserService.getCurrentUser();
        return getScopedNotifications(currentUser, true).stream()
            .map(n -> safeToResponse(currentUser, n))
            .filter(java.util.Objects::nonNull)
            .toList();
    }

    private NotificationResponse safeToResponse(Utilisateur currentUser, com.logiway.entities.Notification notification) {
        try {
            return toResponse(currentUser, notification);
        } catch (Exception ex) {
            return null;
        }
    }

    private NotificationResponse toResponse(Utilisateur currentUser, com.logiway.entities.Notification notification) {
        if (currentUser.getRole() == Role.MANAGER && !isVisibleToManager(currentUser, notification)) {
            return null;
        }

        if (notification == null || notification.getId() == null) {
            return null;
        }

        String resolvedMessage = NotificationMessageResolver.resolveForRecipient(currentUser, notification);
        return new NotificationResponse(
            notification.getId(),
            notification.getType(),
            resolvedMessage,
            notification.getDateCreation(),
            notification.getEstLu(),
            NotificationToneResolver.resolve(notification.getType(), resolvedMessage)
        );
    }

    private List<com.logiway.entities.Notification> getScopedNotifications(Utilisateur currentUser, boolean unreadOnly) {
        if (currentUser.getRole() == Role.SUPERADMIN) {
            return unreadOnly
                ? notificationRepository.findAllByOrderByDateCreationDesc().stream().filter(n -> !Boolean.TRUE.equals(n.getEstLu())).toList()
                : notificationRepository.findAllByOrderByDateCreationDesc();
        }

        if (currentUser.getRole() == Role.MANAGER) {
            Set<Long> visibleUserIds = new LinkedHashSet<>();
            visibleUserIds.add(currentUser.getId());

            List<Chauffeur> managedDrivers = chauffeurRepository.findByManagerId(currentUser.getId());
            Long managerCompanyId = currentUser.getEntreprise() != null ? currentUser.getEntreprise().getId() : null;
            managedDrivers.stream()
                .filter(driver -> managerCompanyId == null
                    || (driver.getEntreprise() != null && Objects.equals(driver.getEntreprise().getId(), managerCompanyId)))
                .forEach(driver -> visibleUserIds.add(driver.getId()));

            if (visibleUserIds.isEmpty()) {
                return List.of();
            }

            List<Utilisateur> visibleUsers = new ArrayList<>();
            visibleUsers.add(currentUser);
            visibleUsers.addAll(managedDrivers.stream()
                .filter(driver -> visibleUserIds.contains(driver.getId()))
                .map(Utilisateur.class::cast)
                .toList());

            return unreadOnly
                ? notificationRepository.findByUtilisateurInAndEstLuFalseOrderByDateCreationDesc(visibleUsers)
                : notificationRepository.findByUtilisateurInOrderByDateCreationDesc(visibleUsers);
        }

        return unreadOnly
            ? notificationRepository.findByUtilisateurAndEstLuFalseOrderByDateCreationDesc(currentUser)
            : notificationRepository.findByUtilisateurOrderByDateCreationDesc(currentUser);
    }

    private boolean isVisibleToManager(Utilisateur manager, com.logiway.entities.Notification notification) {
        Utilisateur target = notification.getUtilisateur();
        if (target == null || target.getId() == null || manager.getId() == null) {
            return false;
        }

        if (Objects.equals(target.getId(), manager.getId())) {
            return true;
        }

        if (!(target instanceof Chauffeur chauffeur)) {
            return false;
        }

        if (chauffeur.getManager() == null || chauffeur.getManager().getId() == null) {
            return false;
        }

        if (!Objects.equals(chauffeur.getManager().getId(), manager.getId())) {
            return false;
        }

        Long managerCompanyId = manager.getEntreprise() != null ? manager.getEntreprise().getId() : null;
        if (managerCompanyId == null) {
            return true;
        }

        return chauffeur.getEntreprise() != null && Objects.equals(chauffeur.getEntreprise().getId(), managerCompanyId);
    }
}
