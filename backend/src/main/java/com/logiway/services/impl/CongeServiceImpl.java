package com.logiway.services.impl;

import com.logiway.dto.request.CongeDecisionRequest;
import com.logiway.dto.request.CreateCongeRequest;
import com.logiway.dto.request.UpdateCongeRequest;
import com.logiway.dto.response.ApiMessageResponse;
import com.logiway.dto.response.CongeResponse;
import com.logiway.entities.Chauffeur;
import com.logiway.entities.Conge;
import com.logiway.entities.Manager;
import com.logiway.entities.Notification;
import com.logiway.entities.Utilisateur;
import com.logiway.entities.enums.Role;
import com.logiway.entities.enums.StatutConge;
import com.logiway.entities.enums.TypeNotif;
import com.logiway.exceptions.BadRequestException;
import com.logiway.exceptions.ResourceNotFoundException;
import com.logiway.exceptions.UnauthorizedException;
import com.logiway.repositories.CongeRepository;
import com.logiway.repositories.NotificationRepository;
import com.logiway.repositories.UtilisateurRepository;
import com.logiway.security.AuthenticatedUserService;
import com.logiway.services.CongeService;
import com.logiway.services.NotificationRealtimeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class CongeServiceImpl implements CongeService {

    private final CongeRepository congeRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final NotificationRepository notificationRepository;
    private final NotificationRealtimeService notificationRealtimeService;
    private final AuthenticatedUserService authenticatedUserService;
    private final GoogleCalendarLeaveSyncService googleCalendarLeaveSyncService;

    @Override
    @Transactional(readOnly = true)
    public List<CongeResponse> getAccessibleConges() {
        Utilisateur currentUser = authenticatedUserService.getCurrentUser();

        if (currentUser.getRole() == Role.SUPERADMIN) {
            return congeRepository.findAll().stream()
                .sorted(Comparator.comparing(Conge::getDateDebut, Comparator.nullsLast(Comparator.naturalOrder()))
                    .thenComparing(Conge::getId, Comparator.nullsLast(Comparator.naturalOrder())))
                .map(this::toResponse)
                .toList();
        }

        if (currentUser.getRole() == Role.MANAGER) {
            LinkedHashMap<Long, Conge> unique = new LinkedHashMap<>();
            congeRepository.findByManager_IdOrderByDateDebutDesc(currentUser.getId()).forEach(conge -> unique.putIfAbsent(conge.getId(), conge));
            congeRepository.findByChauffeur_Manager_IdOrderByDateDebutDesc(currentUser.getId()).forEach(conge -> unique.putIfAbsent(conge.getId(), conge));
            return unique.values().stream().map(this::toResponse).toList();
        }

        if (currentUser.getRole() == Role.CHAUFFEUR) {
            return congeRepository.findByChauffeur_IdOrderByDateDebutDesc(currentUser.getId()).stream()
                .map(this::toResponse)
                .toList();
        }

        return List.of();
    }

    @Override
    @Transactional
    public CongeResponse createConge(CreateCongeRequest request) {
        Utilisateur currentUser = authenticatedUserService.getCurrentUser();
        ensureCanCreate(currentUser);
        validateDates(request.dateDebut(), request.dateFin());
        ensureNoPendingLeave(currentUser);

        Conge conge = new Conge();
        conge.setType(request.type());
        conge.setDateDebut(request.dateDebut());
        conge.setDateFin(request.dateFin());
        conge.setMotif(request.motif().trim());
        conge.setStatut(StatutConge.EN_ATTENTE);
        conge.setCommentaireValidation(null);

        applyOwnership(conge, currentUser);

        congeRepository.save(conge);
        notifyReviewersOfRequest(conge, buildRequestMessage(conge, currentUser));

        return toResponse(conge);
    }

    @Override
    @Transactional
    public CongeResponse updateConge(Long id, UpdateCongeRequest request) {
        Utilisateur currentUser = authenticatedUserService.getCurrentUser();
        Conge conge = requireOwnedConge(id, currentUser);

        if (request.type() != null) {
            conge.setType(request.type());
        }
        if (request.dateDebut() != null) {
            conge.setDateDebut(request.dateDebut());
        }
        if (request.dateFin() != null) {
            conge.setDateFin(request.dateFin());
        }
        if (request.motif() != null && !request.motif().isBlank()) {
            conge.setMotif(request.motif().trim());
        }

        validateDates(conge.getDateDebut(), conge.getDateFin());

        if (conge.getStatut() == StatutConge.APPROUVE) {
            googleCalendarLeaveSyncService.deleteLeaveEvent(conge);
            conge.setCalendarEventId(null);
        }

        conge.setStatut(StatutConge.EN_ATTENTE);
        conge.setCommentaireValidation(null);
        congeRepository.save(conge);

        notifyReviewersOfRequest(conge, buildRequestMessage(conge, currentUser));
        return toResponse(conge);
    }

    @Override
    @Transactional
    public CongeResponse approveConge(Long id, CongeDecisionRequest request) {
        Utilisateur currentUser = authenticatedUserService.getCurrentUser();
        Conge conge = requireReviewableConge(id, currentUser);

        conge.setStatut(StatutConge.APPROUVE);
        conge.setCommentaireValidation(normalizeComment(request.commentaire()));
        congeRepository.save(conge);

        Optional<String> calendarEventId = googleCalendarLeaveSyncService.syncApprovedLeave(conge);
        calendarEventId.ifPresent(conge::setCalendarEventId);
        if (calendarEventId.isPresent()) {
            congeRepository.save(conge);
        }

        markDecisionNotificationAsHandled(currentUser, request.notificationId(), conge, true);

        notifyRequesterOfDecision(conge, "approuvée", request.commentaire());
        return toResponse(conge);
    }

    @Override
    @Transactional
    public CongeResponse rejectConge(Long id, CongeDecisionRequest request) {
        Utilisateur currentUser = authenticatedUserService.getCurrentUser();
        Conge conge = requireReviewableConge(id, currentUser);

        conge.setStatut(StatutConge.REJETE);
        conge.setCommentaireValidation(normalizeComment(request.commentaire()));
        googleCalendarLeaveSyncService.deleteLeaveEvent(conge);
        conge.setCalendarEventId(null);
        congeRepository.save(conge);

        markDecisionNotificationAsHandled(currentUser, request.notificationId(), conge, false);

        notifyRequesterOfDecision(conge, "rejetée", request.commentaire());
        return toResponse(conge);
    }

    @Override
    @Transactional
    public ApiMessageResponse deleteConge(Long id) {
        Utilisateur currentUser = authenticatedUserService.getCurrentUser();
        Conge conge = requireOwnedConge(id, currentUser);

        if (conge.getStatut() == StatutConge.APPROUVE) {
            conge.setStatut(StatutConge.ANNULE);
            conge.setCommentaireValidation(null);
            googleCalendarLeaveSyncService.deleteLeaveEvent(conge);
            conge.setCalendarEventId(null);
            congeRepository.save(conge);
            notifyReviewersOfCancellation(conge, currentUser);
            return new ApiMessageResponse("Le congé a été annulé avec succès.");
        }

        congeRepository.delete(conge);
        notifyReviewersOfCancellation(conge, currentUser);
        return new ApiMessageResponse("La demande de congé a été supprimée.");
    }

    private void ensureCanCreate(Utilisateur currentUser) {
        if (currentUser.getRole() != Role.MANAGER && currentUser.getRole() != Role.CHAUFFEUR) {
            throw new UnauthorizedException("Only managers and drivers can submit leave requests");
        }
    }

    private void ensureNoPendingLeave(Utilisateur currentUser) {
        boolean hasPending = currentUser.getRole() == Role.MANAGER
            ? congeRepository.existsByManager_IdAndStatut(currentUser.getId(), StatutConge.EN_ATTENTE)
            : congeRepository.existsByChauffeur_IdAndStatut(currentUser.getId(), StatutConge.EN_ATTENTE);

        if (hasPending) {
            throw new BadRequestException("You already have a pending leave request");
        }
    }

    private void applyOwnership(Conge conge, Utilisateur currentUser) {
        if (currentUser instanceof Manager manager) {
            conge.setManager(manager);
            return;
        }

        if (currentUser instanceof Chauffeur chauffeur) {
            conge.setChauffeur(chauffeur);
            if (chauffeur.getManager() == null) {
                throw new BadRequestException("Driver must be assigned to a manager before requesting leave");
            }
            conge.setManager(chauffeur.getManager());
            return;
        }

        throw new UnauthorizedException("Only managers and drivers can submit leave requests");
    }

    private void validateDates(LocalDate dateDebut, LocalDate dateFin) {
        if (dateDebut == null || dateFin == null) {
            throw new BadRequestException("Leave dates are required");
        }

        if (dateFin.isBefore(dateDebut)) {
            throw new BadRequestException("The end date must be on or after the start date");
        }
    }

    private Conge requireOwnedConge(Long id, Utilisateur currentUser) {
        Conge conge = congeRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Leave request not found"));

        if (currentUser.getRole() == Role.MANAGER) {
            if (conge.getManager() == null || !Objects.equals(conge.getManager().getId(), currentUser.getId())) {
                throw new UnauthorizedException("You can only modify your own leave requests");
            }
            return conge;
        }

        if (currentUser.getRole() == Role.CHAUFFEUR) {
            if (conge.getChauffeur() == null || !Objects.equals(conge.getChauffeur().getId(), currentUser.getId())) {
                throw new UnauthorizedException("You can only modify your own leave requests");
            }
            return conge;
        }

        throw new UnauthorizedException("SuperAdmin has read-only access on leave requests");
    }

    private Conge requireReviewableConge(Long id, Utilisateur currentUser) {
        Conge conge = congeRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Leave request not found"));

        if (currentUser.getRole() == Role.SUPERADMIN) {
            if (conge.getManager() == null) {
                throw new UnauthorizedException("SuperAdmin can only review manager leave requests");
            }
            return conge;
        }

        if (currentUser.getRole() == Role.MANAGER) {
            if (conge.getChauffeur() == null || conge.getChauffeur().getManager() == null
                || !Objects.equals(conge.getChauffeur().getManager().getId(), currentUser.getId())) {
                throw new UnauthorizedException("You can only review leaves of your direct drivers");
            }
            return conge;
        }

        throw new UnauthorizedException("You are not allowed to review leave requests");
    }

    private void notifyReviewersOfRequest(Conge conge, String message) {
        resolveReviewers(conge).forEach(recipient -> createNotification(recipient, message));
    }

    private void notifyRequesterOfDecision(Conge conge, String decisionLabel, String comment) {
        Utilisateur requester = resolveRequester(conge);
        if (requester == null) {
            return;
        }

        StringBuilder builder = new StringBuilder();
        builder.append("Votre demande de congé du ")
            .append(conge.getDateDebut())
            .append(" au ")
            .append(conge.getDateFin())
            .append(" a été ")
            .append(decisionLabel)
            .append(".");

        if (comment != null && !comment.isBlank()) {
            builder.append(" Commentaire: ").append(comment.trim());
        }

        createNotification(requester, withLeaveToken(conge, builder.toString()));
    }

    private void notifyReviewersOfCancellation(Conge conge, Utilisateur requester) {
        String message = "La demande de congé de " + requester.getPrenom() + " " + requester.getNom()
            + " a été annulée ou supprimée.";
        resolveReviewers(conge).forEach(recipient -> createNotification(recipient, withLeaveToken(conge, message)));
    }

    private List<Utilisateur> resolveReviewers(Conge conge) {
        List<Utilisateur> reviewers = new ArrayList<>();

        if (conge.getChauffeur() != null) {
            if (conge.getChauffeur().getManager() != null) {
                reviewers.add(conge.getChauffeur().getManager());
            }
            return reviewers;
        }

        if (conge.getManager() != null) {
            reviewers.addAll(utilisateurRepository.findByRole(Role.SUPERADMIN));
        }

        return reviewers;
    }

    private Utilisateur resolveRequester(Conge conge) {
        if (conge.getChauffeur() != null) {
            return conge.getChauffeur();
        }

        return conge.getManager();
    }

    private void createNotification(Utilisateur recipient, String message) {
        if (recipient == null) {
            return;
        }

        Notification notification = Notification.builder()
            .type(TypeNotif.NOTIF_CONGE)
            .message(message)
            .utilisateur(recipient)
            .build();

        notificationRepository.save(notification);
        notificationRealtimeService.publishToUsers(List.of(recipient.getId()), notification);
    }

    private String buildRequestMessage(Conge conge, Utilisateur requester) {
        String requesterLabel = (requester.getPrenom() + " " + requester.getNom()).trim();
        String message = "Nouvelle demande de congé de " + requesterLabel
            + " | type: " + conge.getType()
            + " | du " + conge.getDateDebut()
            + " au " + conge.getDateFin()
            + " | motif: " + conge.getMotif();
        return withLeaveToken(conge, message);
    }

    private String withLeaveToken(Conge conge, String message) {
        if (conge == null || conge.getId() == null) {
            return message;
        }

        return "[CONGE_ID:" + conge.getId() + "] " + message;
    }

    private void markDecisionNotificationAsHandled(Utilisateur actor, Long notificationId, Conge conge, boolean approved) {
        if (actor == null || notificationId == null || conge == null) {
            return;
        }

        notificationRepository.findById(notificationId).ifPresent(notification -> {
            if (notification.getUtilisateur() == null || !Objects.equals(notification.getUtilisateur().getId(), actor.getId())) {
                return;
            }

            if (notification.getType() != TypeNotif.NOTIF_CONGE) {
                return;
            }

            String verb = approved ? "approuvée" : "rejetée";
            String updatedMessage = "[CONGE_ID:" + conge.getId() + "] Demande de congé traitée: " + verb
                + " | période: " + conge.getDateDebut() + " au " + conge.getDateFin();

            notification.setMessage(updatedMessage);
            notification.setEstLu(Boolean.TRUE);
            notificationRepository.save(notification);
            notificationRealtimeService.publishToUsers(List.of(actor.getId()), notification);
        });
    }

    private String normalizeComment(String comment) {
        if (comment == null || comment.isBlank()) {
            return null;
        }

        return comment.trim();
    }

    private CongeResponse toResponse(Conge conge) {
        Utilisateur requester = resolveRequester(conge);
        return new CongeResponse(
            conge.getId(),
            conge.getType(),
            conge.getDateDebut(),
            conge.getDateFin(),
            conge.getPeriode(),
            conge.getMotif(),
            conge.getStatut(),
            conge.getCommentaireValidation(),
            requester != null ? requester.getId() : null,
            requester != null ? fullName(requester) : null,
            requester != null ? requester.getEmail() : null,
            requester != null ? requester.getRole() : null,
            conge.getManager() != null ? conge.getManager().getId() : null,
            conge.getManager() != null ? fullName(conge.getManager()) : null,
            conge.getManager() != null ? conge.getManager().getEmail() : null,
            conge.getChauffeur() != null ? conge.getChauffeur().getId() : null,
            conge.getChauffeur() != null ? fullName(conge.getChauffeur()) : null,
            conge.getChauffeur() != null ? conge.getChauffeur().getEmail() : null,
            conge.getDateCreation(),
            conge.getDateMiseAJour()
        );
    }

    private String fullName(Utilisateur utilisateur) {
        return (safe(utilisateur.getPrenom()) + " " + safe(utilisateur.getNom())).trim();
    }

    private String safe(String value) {
        return value == null ? "" : value;
    }
}