package com.logiway.services.impl;

import com.logiway.dto.request.CreateUserRequest;
import com.logiway.dto.request.UpdateUserRequest;
import com.logiway.dto.response.ApiMessageResponse;
import com.logiway.dto.response.UserResponse;
import com.logiway.entities.Chauffeur;
import com.logiway.entities.Manager;
import com.logiway.entities.SuperAdministrateur;
import com.logiway.entities.Notification;
import com.logiway.entities.Utilisateur;
import com.logiway.entities.enums.Role;
import com.logiway.entities.enums.StatutChauffeur;
import com.logiway.entities.enums.StatutCompte;
import com.logiway.entities.enums.TypeNotif;
import com.logiway.exceptions.BadRequestException;
import com.logiway.exceptions.ResourceNotFoundException;
import com.logiway.mappers.UserMapper;
import com.logiway.repositories.ChauffeurRepository;
import com.logiway.repositories.CongeRepository;
import com.logiway.repositories.EntrepriseRepository;
import com.logiway.repositories.ManagerRepository;
import com.logiway.repositories.NotificationRepository;
import com.logiway.repositories.RefreshTokenRepository;
import com.logiway.repositories.ResetTokenRepository;
import com.logiway.repositories.TrajetRepository;
import com.logiway.repositories.UtilisateurRepository;
import com.logiway.security.AuthenticatedUserService;
import com.logiway.services.KeycloakService;
import com.logiway.services.MailService;
import com.logiway.services.NotificationRealtimeService;
import com.logiway.services.UserService;
import com.logiway.utils.PasswordGenerator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UtilisateurRepository utilisateurRepository;
    private final ChauffeurRepository chauffeurRepository;
    private final ManagerRepository managerRepository;
    private final EntrepriseRepository entrepriseRepository;
    private final CongeRepository congeRepository;
    private final TrajetRepository trajetRepository;
    private final ResetTokenRepository resetTokenRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final NotificationRepository notificationRepository;
    private final AuthenticatedUserService authenticatedUserService;
    private final KeycloakService keycloakService;
    private final MailService mailService;
    private final NotificationRealtimeService notificationRealtimeService;
    private final PasswordEncoder passwordEncoder;
    private final UserMapper userMapper;

    @Override
    @Transactional
    public UserResponse createUser(CreateUserRequest request) {
        Utilisateur currentUser = authenticatedUserService.getCurrentUser();
        validateCreatePermissions(currentUser, request.role());

        if (utilisateurRepository.existsByEmailIgnoreCase(request.email())) {
            throw new BadRequestException("Email already exists");
        }

        String temporaryPassword = PasswordGenerator.generate(12);
        // Managers cannot explicitly set active status for chauffeurs
        // Manager-created chauffeurs default to INACTIF (EN ATTENTE) for SuperAdmin approval
        boolean active = currentUser.getRole() == Role.MANAGER && request.role() == Role.CHAUFFEUR
            ? false
            : (request.estActif() == null || request.estActif());

        Utilisateur user = buildByRole(request, currentUser, temporaryPassword, active);
        user.setCreatedBy(currentUser);
        
        String keycloakId = keycloakService.createUserAccount(
            user.getEmail(),
            temporaryPassword,
            user.getPrenom(),
            user.getNom(),
            user.getRole().name(),
            active
        );

        if (keycloakId == null || keycloakId.isBlank()) {
            log.error("Failed to retrieve Keycloak ID for user [{}] — user will not be able to authenticate", user.getEmail());
        } else {
            user.setKeycloakId(keycloakId);
        }

        utilisateurRepository.save(user);

        try {
            mailService.sendActivationEmail(user, temporaryPassword);
        } catch (Exception ex) {
            // User creation should not fail if SMTP is unavailable.
            log.warn("Activation email could not be sent for user {}", user.getEmail(), ex);
        }

        // Emit assignment notification if driver is created with a manager
        if (user instanceof Chauffeur chauffeur && chauffeur.getManager() != null) {
            try {
                emitAffectationNotifications(chauffeur, null, chauffeur.getManager());
            } catch (Exception ex) {
                log.warn("Assignment notification could not be saved for chauffeur {}", user.getEmail(), ex);
            }
        }

        return userMapper.toResponse(user);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserResponse> getUsers() {
        Utilisateur currentUser = authenticatedUserService.getCurrentUser();

        if (currentUser.getRole() == Role.SUPERADMIN) {
            return utilisateurRepository.findAll().stream()
                .sorted(Comparator.comparing(Utilisateur::getDateCreation).reversed())
                .map(userMapper::toResponse)
                .toList();
        }

        if (currentUser.getRole() == Role.MANAGER) {
            return chauffeurRepository.findByManagerId(currentUser.getId()).stream()
                .map(Utilisateur.class::cast)
                .sorted(Comparator.comparing(Utilisateur::getDateCreation).reversed())
                .map(userMapper::toResponse)
                .toList();
        }

        throw new BadRequestException("You are not allowed to list users");
    }

    @Override
    @Transactional
    public UserResponse updateUser(Long id, UpdateUserRequest request) {
        Utilisateur currentUser = authenticatedUserService.getCurrentUser();
        Utilisateur user = utilisateurRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        validateUpdatePermissions(currentUser, user);
        StatutCompte previousStatus = user.getEstActif();
        Manager previousManager = null;

        if (request.prenom() != null) user.setPrenom(request.prenom());
        if (request.nom() != null) user.setNom(request.nom());
        if (request.telephone() != null) user.setTelephone(request.telephone());
        if (request.pays() != null) user.setPays(request.pays());
        if (request.image() != null) user.setImage(request.image());

        if (request.email() != null && !request.email().equalsIgnoreCase(user.getEmail())) {
            if (utilisateurRepository.existsByEmailIgnoreCase(request.email())) {
                throw new BadRequestException("Email already exists");
            }
            user.setEmail(request.email());
        }

        if (request.role() != null) {
            user.setRole(request.role());
        }

        if (user instanceof Chauffeur chauffeur && request.managerId() != null) {
            previousManager = chauffeur.getManager();
            Manager manager = managerRepository.findById(request.managerId())
                .orElseThrow(() -> new ResourceNotFoundException("Manager not found"));
            chauffeur.setManager(manager);
            chauffeur.setEntreprise(manager != null ? manager.getEntreprise() : null);
        }

        if (request.estActif() != null) {
            boolean enabled = request.estActif();
            if (enabled) {
                user.setEstActif(StatutCompte.ACTIF);
                user.setRejectionReason(null);
            } else {
                if (request.rejectionReason() != null && !request.rejectionReason().isBlank()) {
                    user.setEstActif(StatutCompte.REJETE);
                    user.setRejectionReason(request.rejectionReason().trim());
                } else {
                    user.setEstActif(StatutCompte.INACTIF);
                    user.setRejectionReason(null);
                }
            }
        }

        utilisateurRepository.save(user);

        // Emit assignment notifications if manager was changed
        if (user instanceof Chauffeur chauffeur && request.managerId() != null) {
            try {
                emitAffectationNotifications(chauffeur, previousManager, chauffeur.getManager());
            } catch (Exception ex) {
                log.warn("Assignment notification could not be saved for chauffeur {}", user.getEmail(), ex);
            }
        }

        boolean reactivateAccount = request.estActif() != null
            && request.estActif()
            && previousStatus != StatutCompte.ACTIF;

        if (reactivateAccount) {
            try {
                mailService.sendAccountReactivationEmail(user);
            } catch (Exception ex) {
                log.warn("Reactivation email could not be sent for user {}", user.getEmail(), ex);
            }

            try {
                String message = (previousStatus == StatutCompte.REJETE || previousStatus == StatutCompte.INACTIF)
                    ? "Votre compte a ete reactive avec succes."
                    : "Votre compte a ete active avec succes.";
                sendAccountStatusNotifications(user, message);
            } catch (Exception ex) {
                log.warn("Reactivation notification could not be saved for user {}", user.getEmail(), ex);
            }
        }

        if (request.estActif() != null && !request.estActif() && user.getEstActif() == StatutCompte.REJETE) {
            try {
                mailService.sendAccountRejectionEmail(user, user.getRejectionReason());
            } catch (Exception ex) {
                log.warn("Rejection email could not be sent for user {}", user.getEmail(), ex);
            }

            try {
                sendAccountStatusNotifications(user, "Votre compte a ete rejete.");
            } catch (Exception ex) {
                log.warn("Rejection notification could not be saved for user {}", user.getEmail(), ex);
            }
        }

        if (request.estActif() != null && !request.estActif() && user.getEstActif() == StatutCompte.INACTIF) {
            try {
                mailService.sendAccountDeactivationEmail(user);
            } catch (Exception ex) {
                log.warn("Deactivation email could not be sent for user {}", user.getEmail(), ex);
            }

            try {
                sendAccountStatusNotifications(user, "Votre compte est passe au statut inactif (EN ATTENTE).");
            } catch (Exception ex) {
                log.warn("Deactivation notification could not be saved for user {}", user.getEmail(), ex);
            }
        }

        return userMapper.toResponse(user);
    }

    @Override
    @Transactional
    public ApiMessageResponse deleteUser(Long id) {
        Utilisateur currentUser = authenticatedUserService.getCurrentUser();
        Utilisateur user = utilisateurRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (currentUser.getRole() == Role.MANAGER) {
            if (!(user instanceof Chauffeur chauffeur)) {
                throw new BadRequestException("Managers can only remove drivers from their list");
            }

            if (chauffeur.getManager() == null || !chauffeur.getManager().getId().equals(currentUser.getId())) {
                throw new BadRequestException("You can only remove drivers assigned to you");
            }

            chauffeur.setManager(null);
            utilisateurRepository.save(chauffeur);
            return new ApiMessageResponse("Driver removed from your list");
        }

        if (currentUser.getRole() != Role.SUPERADMIN) {
            throw new BadRequestException("Only superadmin can delete users");
        }

        if (user.getId().equals(currentUser.getId())) {
            throw new BadRequestException("You cannot delete your own account");
        }

        // Notify manager before deleting driver
        if (user instanceof Chauffeur chauffeur && chauffeur.getManager() != null) {
            try {
                emitDriverDeletionNotification(chauffeur, chauffeur.getManager());
            } catch (Exception ex) {
                log.warn("Driver deletion notification could not be saved for manager {}", chauffeur.getManager().getEmail(), ex);
            }
        }

        cleanupUserDependencies(user);

        utilisateurRepository.delete(user);
        return new ApiMessageResponse("User deleted");
    }

    private void cleanupUserDependencies(Utilisateur user) {
        resetTokenRepository.deleteByUtilisateur(user);
        refreshTokenRepository.deleteAllByUtilisateur(user);
        notificationRepository.deleteByUtilisateur(user);

        if (user instanceof Manager manager) {
            chauffeurRepository.findByManagerId(manager.getId()).forEach(chauffeur -> {
                chauffeur.setManager(null);
                utilisateurRepository.save(chauffeur);
            });

            congeRepository.findByManager_IdOrderByDateDebutDesc(manager.getId()).forEach(conge -> conge.setManager(null));
            trajetRepository.findByManagerId(manager.getId()).forEach(trajet -> trajet.setManager(null));
            congeRepository.flush();
            trajetRepository.flush();

            entrepriseRepository.findByProprietaire_Id(manager.getId()).ifPresent(entreprise -> {
                entreprise.setProprietaire(null);
                entrepriseRepository.save(entreprise);
            });
        }

        if (user instanceof Chauffeur chauffeur) {
            congeRepository.findByChauffeur_IdOrderByDateDebutDesc(chauffeur.getId()).forEach(conge -> conge.setChauffeur(null));
            trajetRepository.findByChauffeurId(chauffeur.getId()).forEach(trajet -> trajet.setChauffeur(null));
            congeRepository.flush();
            trajetRepository.flush();
        }
    }

    private void validateCreatePermissions(Utilisateur currentUser, Role targetRole) {
        if (currentUser.getRole() == Role.SUPERADMIN) {
            if (targetRole == Role.MANAGER || targetRole == Role.CHAUFFEUR || targetRole == Role.SUPERADMIN) {
                return;
            }
        }

        if (currentUser.getRole() == Role.MANAGER && targetRole == Role.CHAUFFEUR) {
            return;
        }

        throw new BadRequestException("You are not allowed to create this user role");
    }

    private void validateUpdatePermissions(Utilisateur currentUser, Utilisateur target) {
        if (currentUser.getRole() == Role.SUPERADMIN) {
            return;
        }

        if (currentUser.getRole() == Role.MANAGER && target instanceof Chauffeur chauffeur) {
            if (chauffeur.getManager() != null && chauffeur.getManager().getId().equals(currentUser.getId())) {
                return;
            }
        }
        throw new BadRequestException("You are not allowed to update this user");
    }

    private void sendAccountStatusNotifications(Utilisateur targetUser, String message) {
        Notification notification = Notification.builder()
            .type(TypeNotif.NOTIF_COMPTE)
            .message(message)
            .utilisateur(targetUser)
            .estLu(false)
            .build();
        notificationRepository.save(notification);
        notificationRealtimeService.publishToUsers(List.of(targetUser.getId()), notification);
    }

    private void emitAffectationNotifications(Chauffeur chauffeur, Manager oldManager, Manager newManager) {
        String driverFullName = (chauffeur.getPrenom() != null ? chauffeur.getPrenom() : "") + " " +
                                 (chauffeur.getNom() != null ? chauffeur.getNom() : "");
        driverFullName = driverFullName.trim();
        if (driverFullName.isEmpty()) {
            driverFullName = chauffeur.getEmail() != null ? chauffeur.getEmail() : "#" + chauffeur.getId();
        }

        String newManagerFullName = (newManager.getPrenom() != null ? newManager.getPrenom() : "") + " " +
                                    (newManager.getNom() != null ? newManager.getNom() : "");
        newManagerFullName = newManagerFullName.trim();
        if (newManagerFullName.isEmpty()) {
            newManagerFullName = newManager.getEmail() != null ? newManager.getEmail() : "#" + newManager.getId();
        }

        if (oldManager == null) {
            // First assignment: notify driver and new manager
            Notification notifDriver = Notification.builder()
                .type(TypeNotif.NOTIF_AFFECTATION)
                .message("Vous avez été assigné au manager " + newManagerFullName)
                .utilisateur(chauffeur)
                .estLu(false)
                .build();
            notificationRepository.save(notifDriver);
            notificationRealtimeService.publishToUsers(List.of(chauffeur.getId()), notifDriver);

            Notification notifManager = Notification.builder()
                .type(TypeNotif.NOTIF_AFFECTATION)
                .message("Vous avez reçu la charge du chauffeur " + driverFullName)
                .utilisateur(newManager)
                .estLu(false)
                .build();
            notificationRepository.save(notifManager);
            notificationRealtimeService.publishToUsers(List.of(newManager.getId()), notifManager);
        } else if (!oldManager.getId().equals(newManager.getId())) {
            // Reassignment: notify driver, old manager, and new manager
            String oldManagerFullName = (oldManager.getPrenom() != null ? oldManager.getPrenom() : "") + " " +
                                        (oldManager.getNom() != null ? oldManager.getNom() : "");
            oldManagerFullName = oldManagerFullName.trim();
            if (oldManagerFullName.isEmpty()) {
                oldManagerFullName = oldManager.getEmail() != null ? oldManager.getEmail() : "#" + oldManager.getId();
            }

            Notification notifDriver = Notification.builder()
                .type(TypeNotif.NOTIF_AFFECTATION)
                .message("Vous avez été réassigné du manager " + oldManagerFullName + " au manager " + newManagerFullName)
                .utilisateur(chauffeur)
                .estLu(false)
                .build();
            notificationRepository.save(notifDriver);
            notificationRealtimeService.publishToUsers(List.of(chauffeur.getId()), notifDriver);

            Notification notifOldManager = Notification.builder()
                .type(TypeNotif.NOTIF_AFFECTATION)
                .message("Le chauffeur " + driverFullName + " a été transféré vers la gestion d'un autre manager")
                .utilisateur(oldManager)
                .estLu(false)
                .build();
            notificationRepository.save(notifOldManager);
            notificationRealtimeService.publishToUsers(List.of(oldManager.getId()), notifOldManager);

            Notification notifNewManager = Notification.builder()
                .type(TypeNotif.NOTIF_AFFECTATION)
                .message("Vous avez reçu la charge du chauffeur " + driverFullName + ", précédemment assigné à " + oldManagerFullName)
                .utilisateur(newManager)
                .estLu(false)
                .build();
            notificationRepository.save(notifNewManager);
            notificationRealtimeService.publishToUsers(List.of(newManager.getId()), notifNewManager);
        }
    }

    private void emitDriverDeletionNotification(Chauffeur chauffeur, Manager manager) {
        String driverFullName = (chauffeur.getPrenom() != null ? chauffeur.getPrenom() : "") + " " +
                                 (chauffeur.getNom() != null ? chauffeur.getNom() : "");
        driverFullName = driverFullName.trim();
        if (driverFullName.isEmpty()) {
            driverFullName = chauffeur.getEmail() != null ? chauffeur.getEmail() : "#" + chauffeur.getId();
        }

        Notification notification = Notification.builder()
            .type(TypeNotif.NOTIF_AFFECTATION)
            .message("Le chauffeur " + driverFullName + " a été supprimé du système")
            .utilisateur(manager)
            .estLu(false)
            .build();
        notificationRepository.save(notification);
        notificationRealtimeService.publishToUsers(List.of(manager.getId()), notification);
    }

    private Utilisateur buildByRole(CreateUserRequest request, Utilisateur creator, String temporaryPassword, boolean active) {
        String passwordHash = passwordEncoder.encode(temporaryPassword);
        StatutCompte statutCompte = active ? StatutCompte.ACTIF : StatutCompte.INACTIF;

        if (request.role() == Role.MANAGER) {
            return Manager.builder()
                .prenom(request.prenom())
                .nom(request.nom())
                .email(request.email())
                .telephone(request.telephone())
                .pays(request.pays())
                .image(request.image())
                .role(Role.MANAGER)
                .passwordHash(passwordHash)
                .estActif(statutCompte)
                .verificationToken(UUID.randomUUID().toString())
                .build();
        }

        if (request.role() == Role.CHAUFFEUR) {
            Manager manager = resolveDriverManager(request, creator);
            return Chauffeur.builder()
                .prenom(request.prenom())
                .nom(request.nom())
                .email(request.email())
                .telephone(request.telephone())
                .pays(request.pays())
                .image(request.image())
                .role(Role.CHAUFFEUR)
                .passwordHash(passwordHash)
                .estActif(statutCompte)
                .verificationToken(UUID.randomUUID().toString())
                .manager(manager)
                .entreprise(manager != null ? manager.getEntreprise() : null)
                .statutConducteur(StatutChauffeur.LIBRE)
                .build();
        }

        if (request.role() == Role.SUPERADMIN) {
            return SuperAdministrateur.builder()
                .prenom(request.prenom())
                .nom(request.nom())
                .email(request.email())
                .telephone(request.telephone())
                .pays(request.pays())
                .image(request.image())
                .role(Role.SUPERADMIN)
                .passwordHash(passwordHash)
                .estActif(statutCompte)
                .verificationToken(UUID.randomUUID().toString())
                .build();
        }

        throw new BadRequestException("Unsupported role");
    }

    private Manager resolveDriverManager(CreateUserRequest request, Utilisateur creator) {
        if (creator.getRole() == Role.MANAGER) {
            return managerRepository.findById(creator.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Manager profile not found"));
        }

        if (request.managerId() == null) {
            throw new BadRequestException("managerId is required to create a chauffeur as superadmin");
        }

        return managerRepository.findById(request.managerId())
            .orElseThrow(() -> new ResourceNotFoundException("Manager not found"));
    }

}
