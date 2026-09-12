package com.logiway.services.impl;

import com.logiway.dto.request.CreateEntrepriseRequest;
import com.logiway.dto.request.UpdateEntrepriseRequest;
import com.logiway.dto.response.EntrepriseResponse;
import com.logiway.entities.Entreprise;
import com.logiway.entities.Manager;
import com.logiway.entities.Notification;
import com.logiway.entities.Utilisateur;
import com.logiway.entities.enums.Role;
import com.logiway.entities.enums.StatutEntreprise;
import com.logiway.entities.enums.TypeNotif;
import com.logiway.exceptions.BadRequestException;
import com.logiway.exceptions.UnauthorizedException;
import com.logiway.repositories.EntrepriseRepository;
import com.logiway.repositories.ManagerRepository;
import com.logiway.repositories.NotificationRepository;
import com.logiway.repositories.UtilisateurRepository;
import com.logiway.repositories.VehiculeRepository;
import com.logiway.repositories.ChauffeurRepository;
import com.logiway.security.AuthenticatedUserService;
import com.logiway.services.EntrepriseService;
import com.logiway.services.MailService;
import com.logiway.services.NotificationRealtimeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
@Slf4j
public class EntrepriseServiceImpl implements EntrepriseService {

    private final EntrepriseRepository entrepriseRepository;
    private final ManagerRepository managerRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final VehiculeRepository vehiculeRepository;
    private final NotificationRepository notificationRepository;
    private final NotificationRealtimeService notificationRealtimeService;
    private final MailService mailService;
    private final AuthenticatedUserService authenticatedUserService;
    private final ChauffeurRepository chauffeurRepository;

    @Override
    @Transactional(readOnly = true)
    public List<EntrepriseResponse> getAccessibleEntreprises() {
        Utilisateur currentUser = authenticatedUserService.getCurrentUser();

        if (currentUser.getRole() == Role.SUPERADMIN) {
            return entrepriseRepository.findAllByOrderByDateCreationDesc().stream()
                .map(this::toResponse)
                .toList();
        }

        Entreprise company = currentUser.getEntreprise();
        if (company == null) {
            return List.of();
        }

        return List.of(toResponse(company));
    }

    @Override
    @Transactional(readOnly = true)
    public EntrepriseResponse getMyEntreprise() {
        Utilisateur currentUser = authenticatedUserService.getCurrentUser();
        Entreprise company = currentUser.getEntreprise();
        return company == null ? null : toResponse(company);
    }

    @Override
    @Transactional
    public EntrepriseResponse createEntreprise(CreateEntrepriseRequest request) {
        Utilisateur currentUser = authenticatedUserService.getCurrentUser();
        Entreprise entreprise = buildEntreprise(request);

        if (currentUser.getRole() == Role.MANAGER) {
            Manager owner = requireCurrentManager(currentUser);
            ensureManagerHasNoEntreprise(owner);
            entreprise.setProprietaire(owner);
            entreprise.setStatut(StatutEntreprise.EN_ATTENTE);
            owner.setEntreprise(entreprise);
            entrepriseRepository.save(entreprise);
            utilisateurRepository.save(owner);

            // Synchronize all drivers managed by this manager to the new enterprise
            chauffeurRepository.findByManagerId(owner.getId()).forEach(chauffeur -> {
                chauffeur.setEntreprise(entreprise);
                utilisateurRepository.save(chauffeur);
            });

            notifyCompanyAudience(owner, currentUser, entreprise, "Votre entreprise a ete creee et est en attente de validation par le SuperAdmin.");
            return toResponse(entreprise);
        }

        if (currentUser.getRole() == Role.SUPERADMIN) {
            Manager owner = request.managerOwnerId() == null ? null : requireManager(request.managerOwnerId());
            if (owner != null) {
                ensureManagerHasNoEntreprise(owner);
                entreprise.setProprietaire(owner);
            }
            entreprise.setStatut(StatutEntreprise.ACTIF);
            entrepriseRepository.save(entreprise);
            if (owner != null) {
                owner.setEntreprise(entreprise);
                utilisateurRepository.save(owner);

                // Synchronize all drivers managed by this manager to the new enterprise
                chauffeurRepository.findByManagerId(owner.getId()).forEach(chauffeur -> {
                    chauffeur.setEntreprise(entreprise);
                    utilisateurRepository.save(chauffeur);
                });
            }

            if (owner != null) {
                notifyCompanyAudience(owner, currentUser, entreprise, "Une entreprise vous a ete affectee avec succes.");
                sendCompanyEmail(owner,
                    "Affectation d'entreprise",
                    "Votre entreprise a ete affectee",
                    "Une nouvelle entreprise vous a ete affectee par le SuperAdmin.",
                    entreprise);
                notifySuperAdmins("L'entreprise " + entreprise.getNomEntreprise() + " a ete creee et affectee a " + labelForUser(owner) + ".");
            } else {
                notifySuperAdmins("L'entreprise " + entreprise.getNomEntreprise() + " a ete creee sans manager affecte.");
            }
            return toResponse(entreprise);
        }

        throw new UnauthorizedException("You are not allowed to create companies");
    }

    @Override
    @Transactional
    public EntrepriseResponse updateEntreprise(Long id, UpdateEntrepriseRequest request) {
        Utilisateur currentUser = authenticatedUserService.getCurrentUser();
        Entreprise entreprise = entrepriseRepository.findById(id)
            .orElseThrow(() -> new BadRequestException("Entreprise introuvable"));

        Manager previousOwner = entreprise.getProprietaire();
        StatutEntreprise previousStatus = entreprise.getStatut();

        if (currentUser.getRole() == Role.MANAGER) {
            if (!isOwnedByCurrentManager(currentUser, entreprise)) {
                throw new UnauthorizedException("You are not allowed to modify this company");
            }
            if (entreprise.getStatut() != StatutEntreprise.ACTIF) {
                throw new UnauthorizedException("Your company must be active before modification");
            }
        }

        if (currentUser.getRole() == Role.SUPERADMIN) {
            if (request.managerOwnerId() != null && !Objects.equals(request.managerOwnerId(), previousOwner != null ? previousOwner.getId() : null)) {
                Manager newOwner = requireManager(request.managerOwnerId());
                ensureManagerHasNoEntreprise(newOwner);
                entreprise.setProprietaire(newOwner);
                newOwner.setEntreprise(entreprise);
                // Synchronisation: détacher le manager de son ancien secteur (appartient à l'ancienne entreprise)
                newOwner.setSecteur(null);
                utilisateurRepository.save(newOwner);

                // Synchronize all drivers managed by this manager to the new enterprise
                chauffeurRepository.findByManagerId(newOwner.getId()).forEach(chauffeur -> {
                    chauffeur.setEntreprise(entreprise);
                    utilisateurRepository.save(chauffeur);
                });

                sendNotification(newOwner, "Vous avez ete affecte a l'entreprise " + entreprise.getNomEntreprise() + ".");
                if (previousOwner != null && !Objects.equals(previousOwner.getId(), newOwner.getId())) {
                    previousOwner.setEntreprise(null);
                    // Synchronisation: détacher l'ancien propriétaire de son secteur
                    previousOwner.setSecteur(null);
                    utilisateurRepository.save(previousOwner);

                    // Reset enterprise for previous owner's chauffeurs
                    chauffeurRepository.findByManagerId(previousOwner.getId()).forEach(chauffeur -> {
                        chauffeur.setEntreprise(null);
                        utilisateurRepository.save(chauffeur);
                    });

                    sendNotification(previousOwner, "Vous avez ete retire de l'entreprise " + entreprise.getNomEntreprise() + ".");
                }
                sendCompanyEmail(newOwner,
                    "Modification d'entreprise",
                    "Votre entreprise a ete mise a jour",
                    "Le SuperAdmin a modifie les informations de votre entreprise et a defini un nouveau managerOwner.",
                    entreprise);
            }

            if (request.statut() != null) {
                entreprise.setStatut(parseStatut(request.statut()));
            }
        }

        applyUpdates(entreprise, request);
        entrepriseRepository.save(entreprise);

        Manager currentOwner = entreprise.getProprietaire();

        if (currentUser.getRole() == Role.SUPERADMIN && request.statut() != null && currentOwner != null) {
            StatutEntreprise newStatus = entreprise.getStatut();
            if (newStatus == StatutEntreprise.ACTIF && previousStatus != StatutEntreprise.ACTIF) {
                sendNotification(currentOwner, "Votre entreprise a ete validee. Vous pouvez acceder a toutes les fonctionnalites.");
            } else if ((newStatus == StatutEntreprise.INACTIF || newStatus == StatutEntreprise.SUSPENDU) && previousStatus != newStatus) {
                sendNotification(currentOwner, "Votre entreprise a ete suspendue/desactivee. Votre acces est restreint.");
            }
        }

        if (currentOwner != null) {
            sendCompanyEmail(currentOwner,
                currentUser.getRole() == Role.SUPERADMIN ? "Modification d'entreprise" : "Modification de votre entreprise",
                "Entreprise mise a jour",
                currentUser.getRole() == Role.SUPERADMIN
                    ? "Le SuperAdmin a modifie les informations de votre entreprise."
                    : "Vos informations entreprise ont ete mises a jour avec succes.",
                entreprise);
        }

        notifyCompanyAudience(currentOwner, currentUser, entreprise,
            currentUser.getRole() == Role.SUPERADMIN
                ? "Le SuperAdmin a modifie l'entreprise " + entreprise.getNomEntreprise() + "."
                : "Le manager " + labelForUser(currentUser) + " a modifie son entreprise " + entreprise.getNomEntreprise() + ".");

        if (currentUser.getRole() == Role.SUPERADMIN) {
            notifySuperAdmins("L'entreprise " + entreprise.getNomEntreprise() + " a ete modifiee.");
        }

        return toResponse(entreprise);
    }

    @Override
    @Transactional
    public EntrepriseResponse clearEntrepriseOwner(Long id) {
        Utilisateur currentUser = authenticatedUserService.getCurrentUser();
        if (currentUser.getRole() != Role.SUPERADMIN) {
            throw new UnauthorizedException("Only SuperAdmin can clear company owner");
        }

        Entreprise entreprise = entrepriseRepository.findById(id)
            .orElseThrow(() -> new BadRequestException("Entreprise introuvable"));

        Manager previousOwner = entreprise.getProprietaire();
        if (previousOwner == null) {
            return toResponse(entreprise);
        }

        previousOwner.setEntreprise(null);
        // Synchronisation: détacher le manager de son secteur lors du retrait de l'entreprise
        previousOwner.setSecteur(null);
        utilisateurRepository.save(previousOwner);

        // Reset enterprise for previous owner's chauffeurs
        chauffeurRepository.findByManagerId(previousOwner.getId()).forEach(chauffeur -> {
            chauffeur.setEntreprise(null);
            utilisateurRepository.save(chauffeur);
        });

        entreprise.setProprietaire(null);
        entrepriseRepository.save(entreprise);

        sendNotification(previousOwner, "Vous avez ete retire de l'entreprise " + entreprise.getNomEntreprise() + ".");
        notifySuperAdmins("L'affectation manager de l'entreprise " + entreprise.getNomEntreprise() + " a ete annulee.");

        return toResponse(entreprise);
    }

    @Override
    @Transactional
    public void deleteEntreprise(Long id) {
        Utilisateur currentUser = authenticatedUserService.getCurrentUser();
        if (currentUser.getRole() != Role.SUPERADMIN) {
            throw new UnauthorizedException("Only SuperAdmin can delete companies");
        }

        Entreprise entreprise = entrepriseRepository.findById(id)
            .orElseThrow(() -> new BadRequestException("Entreprise introuvable"));

        Manager owner = entreprise.getProprietaire();

        List<Utilisateur> linkedUsers = utilisateurRepository.findByEntreprise_Id(id);
        linkedUsers.forEach(user -> user.setEntreprise(null));
        if (!linkedUsers.isEmpty()) {
            utilisateurRepository.saveAll(linkedUsers);
        }

        var linkedVehicules = vehiculeRepository.findByEntreprise_Id(id);
        linkedVehicules.forEach(vehicule -> vehicule.setEntreprise(null));
        if (!linkedVehicules.isEmpty()) {
            vehiculeRepository.saveAll(linkedVehicules);
        }

        if (owner != null) {
            owner.setEntreprise(null);
            utilisateurRepository.save(owner);
            sendCompanyEmail(owner,
                "Suppression d'entreprise",
                "Votre entreprise a ete supprimee",
                "Le SuperAdmin a supprime votre entreprise. Votre acces au dashboard est de nouveau restreint.",
                entreprise);
        }

            entreprise.setProprietaire(null);
            entrepriseRepository.save(entreprise);

        entrepriseRepository.delete(entreprise);

        if (owner != null) {
            notifyCompanyAudience(owner, currentUser, entreprise, "Votre entreprise " + entreprise.getNomEntreprise() + " a ete supprimee par le SuperAdmin.");
        }
        notifySuperAdmins("L'entreprise " + entreprise.getNomEntreprise() + " a ete supprimee avec succes.");
    }

    private Entreprise buildEntreprise(CreateEntrepriseRequest request) {
        return Entreprise.builder()
            .nomEntreprise(trimOrNull(request.nomEntreprise()))
            .emailEntreprise(trimOrNull(request.emailEntreprise()))
            .adresseEntreprise(trimOrNull(request.adresseEntreprise()))
            .numeroEntreprise(trimOrNull(request.numeroEntreprise()))
            .codeTVA(trimOrNull(request.codeTVA()))
            .representantLegal(trimOrNull(request.representantLegal()))
            .documentJustificatif(trimOrNull(request.documentJustificatif()))
            .image(trimOrNull(request.image()))
            .secteurActivite(trimOrNull(request.secteurActivite()))
            .tailleFlotte(request.tailleFlotte())
            .statut(defaultStatutForCreate())
            .build();
    }

    private void applyUpdates(Entreprise entreprise, UpdateEntrepriseRequest request) {
        if (request.nomEntreprise() != null) {
            entreprise.setNomEntreprise(trimOrNull(request.nomEntreprise()));
        }
        if (request.emailEntreprise() != null) {
            entreprise.setEmailEntreprise(trimOrNull(request.emailEntreprise()));
        }
        if (request.adresseEntreprise() != null) {
            entreprise.setAdresseEntreprise(trimOrNull(request.adresseEntreprise()));
        }
        if (request.numeroEntreprise() != null) {
            entreprise.setNumeroEntreprise(trimOrNull(request.numeroEntreprise()));
        }
        if (request.codeTVA() != null) {
            entreprise.setCodeTVA(trimOrNull(request.codeTVA()));
        }
        if (request.representantLegal() != null) {
            entreprise.setRepresentantLegal(trimOrNull(request.representantLegal()));
        }
        if (request.documentJustificatif() != null) {
            entreprise.setDocumentJustificatif(trimOrNull(request.documentJustificatif()));
        }
        if (request.image() != null) {
            entreprise.setImage(trimOrNull(request.image()));
        }
        if (request.secteurActivite() != null) {
            entreprise.setSecteurActivite(trimOrNull(request.secteurActivite()));
        }
        if (request.tailleFlotte() != null) {
            entreprise.setTailleFlotte(request.tailleFlotte());
        }
    }

    private EntrepriseResponse toResponse(Entreprise entreprise) {
        Manager owner = entreprise.getProprietaire();
        return new EntrepriseResponse(
            entreprise.getId(),
            entreprise.getNomEntreprise(),
            entreprise.getEmailEntreprise(),
            entreprise.getAdresseEntreprise(),
            entreprise.getNumeroEntreprise(),
            entreprise.getCodeTVA(),
            entreprise.getRepresentantLegal(),
            entreprise.getDocumentJustificatif(),
            entreprise.getSecteurActivite(),
            entreprise.getImage(),
            entreprise.getTailleFlotte(),
            entreprise.getStatut(),
            owner != null ? owner.getId() : null,
            owner != null ? labelForUser(owner) : null,
            entreprise.getDateCreation(),
            0
        );
    }

    private Manager requireCurrentManager(Utilisateur currentUser) {
        if (!(currentUser instanceof Manager manager)) {
            throw new BadRequestException("Current user is not a manager");
        }
        return manager;
    }

    private Manager requireManager(Long managerId) {
        return managerRepository.findById(managerId)
            .orElseThrow(() -> new BadRequestException("Manager introuvable"));
    }

    private void ensureManagerHasNoEntreprise(Manager manager) {
        if (manager.getEntreprise() != null) {
            throw new BadRequestException("Ce manager est deja rattache a une entreprise");
        }
    }

    private boolean isOwnedByCurrentManager(Utilisateur currentUser, Entreprise entreprise) {
        Manager owner = entreprise.getProprietaire();
        return owner != null && Objects.equals(owner.getId(), currentUser.getId());
    }

    private void notifyCompanyAudience(Manager owner, Utilisateur actor, Entreprise entreprise, String message) {
        if (owner != null) {
            sendNotification(owner, message);
        }
        notifySuperAdmins("L'entreprise " + entreprise.getNomEntreprise() + " a ete impactee par l'action de " + labelForUser(actor) + ".");
    }

    private void notifySuperAdmins(String message) {
        utilisateurRepository.findByRole(Role.SUPERADMIN)
            .forEach(superAdmin -> sendNotification(superAdmin, message));
    }

    private void sendNotification(Utilisateur recipient, String message) {
        try {
            Notification notification = Notification.builder()
                .type(TypeNotif.NOTIF_ENTREPRISE)
                .message(message)
                .utilisateur(recipient)
                .estLu(false)
                .build();
            notificationRepository.save(notification);
            notificationRealtimeService.publishToUsers(List.of(recipient.getId()), notification);
        } catch (Exception ex) {
            log.warn("Company notification could not be saved for recipient {}", recipient.getEmail(), ex);
        }
    }

    private void sendCompanyEmail(Manager manager, String subject, String headline, String bodyText, Entreprise entreprise) {
        try {
            String summary = buildCompanySummary(entreprise);
            mailService.sendCompanyNotificationEmail(manager, subject, headline, bodyText, summary);
        } catch (Exception ex) {
            log.warn("Company email could not be sent to {}", manager.getEmail(), ex);
        }
    }

    private String buildCompanySummary(Entreprise entreprise) {
        return "Nom: " + safe(entreprise.getNomEntreprise()) +
            "\nStatut: " + entreprise.getStatut() +
            "\nSecteur: " + safe(entreprise.getSecteurActivite()) +
            "\nEmail: " + safe(entreprise.getEmailEntreprise()) +
            "\nTelephone: " + safe(entreprise.getNumeroEntreprise()) +
            "\nAdresse: " + safe(entreprise.getAdresseEntreprise()) +
            "\nCode TVA: " + safe(entreprise.getCodeTVA()) +
            "\nRepresentant legal: " + safe(entreprise.getRepresentantLegal()) +
            "\nDocument justificatif: " + fileLabel(entreprise.getDocumentJustificatif(), "PDF charge") +
            "\nTaille flotte: " + (entreprise.getTailleFlotte() == null ? "" : entreprise.getTailleFlotte()) +
            "\nImage: " + fileLabel(entreprise.getImage(), "Image chargee");
    }

    private StatutEntreprise defaultStatutForCreate() {
        return StatutEntreprise.ACTIF;
    }

    private StatutEntreprise parseStatut(String status) {
        try {
            return StatutEntreprise.valueOf(status.trim().toUpperCase());
        } catch (Exception ex) {
            return StatutEntreprise.ACTIF;
        }
    }

    private String trimOrNull(String value) {
        return value == null ? null : value.trim();
    }

    private String safe(String value) {
        return value == null ? "" : value;
    }

    private String fileLabel(String value, String fallback) {
        if (value == null || value.isBlank()) {
            return "";
        }

        if (value.startsWith("data:")) {
            return fallback;
        }

        return value.length() > 80 ? value.substring(0, 80) + "..." : value;
    }

    private String labelForUser(Utilisateur user) {
        String fullName = ((user.getPrenom() == null ? "" : user.getPrenom()) + " " + (user.getNom() == null ? "" : user.getNom())).trim();
        return fullName.isBlank() ? user.getEmail() : fullName;
    }
}
