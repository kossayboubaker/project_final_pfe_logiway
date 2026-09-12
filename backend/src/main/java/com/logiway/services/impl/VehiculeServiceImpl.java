package com.logiway.services.impl;

import com.logiway.dto.request.AssignVehiculeDriverRequest;
import com.logiway.dto.request.CreateVehiculeRequest;
import com.logiway.dto.request.UpdateVehiculeRequest;
import com.logiway.dto.request.UpdateVehiculeStatusRequest;
import com.logiway.dto.response.AvailableDriverResponse;
import com.logiway.dto.response.VehiculeResponse;
import com.logiway.entities.Chauffeur;
import com.logiway.entities.Entreprise;
import com.logiway.entities.Manager;
import com.logiway.entities.Notification;
import com.logiway.entities.Trajet;
import com.logiway.entities.Utilisateur;
import com.logiway.entities.Vehicule;
import com.logiway.entities.enums.Role;
import com.logiway.entities.enums.StatutChauffeur;
import com.logiway.entities.enums.StatutVehicule;
import com.logiway.entities.enums.TypeNotif;
import com.logiway.exceptions.BadRequestException;
import com.logiway.exceptions.ConflictException;
import com.logiway.exceptions.ResourceNotFoundException;
import com.logiway.exceptions.UnauthorizedException;
import com.logiway.repositories.ChauffeurRepository;
import com.logiway.repositories.EntrepriseRepository;
import com.logiway.repositories.NotificationRepository;
import com.logiway.repositories.TrajetRepository;
import com.logiway.repositories.UtilisateurRepository;
import com.logiway.repositories.VehiculeRepository;
import com.logiway.security.AuthenticatedUserService;
import com.logiway.services.VehiculeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.function.Function;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
@Slf4j
public class VehiculeServiceImpl implements VehiculeService {

    private final VehiculeRepository vehiculeRepository;
    private final EntrepriseRepository entrepriseRepository;
    private final ChauffeurRepository chauffeurRepository;
    private final TrajetRepository trajetRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final NotificationRepository notificationRepository;
    private final com.logiway.services.NotificationRealtimeService notificationRealtimeService;
    private final AuthenticatedUserService authenticatedUserService;

    @Override
    @Transactional(readOnly = true)
    public List<VehiculeResponse> getAccessibleVehicules() {
        Utilisateur currentUser = authenticatedUserService.getCurrentUser();

        if (currentUser.getRole() == Role.SUPERADMIN) {
            return vehiculeRepository.findAll().stream()
                .sorted(Comparator.comparing(Vehicule::getId).reversed())
                .map(this::toResponse)
                .toList();
        }

        if (currentUser.getRole() == Role.MANAGER) {
            return vehiculeRepository.findByEntreprise_Proprietaire_IdOrderByIdDesc(currentUser.getId()).stream()
                .map(this::toResponse)
                .toList();
        }

        if (currentUser.getRole() == Role.CHAUFFEUR) {
            Chauffeur chauffeur = requireCurrentChauffeur(currentUser);
            Vehicule vehicule = chauffeur.getVehiculeActuel();
            return vehicule == null ? List.of() : List.of(toResponse(vehicule));
        }

        return List.of();
    }

    @Override
    @Transactional(readOnly = true)
    public VehiculeResponse getVehicule(Long id) {
        Utilisateur currentUser = authenticatedUserService.getCurrentUser();
        Vehicule vehicule = requireVehicule(id);
        ensureReadableByCurrentUser(currentUser, vehicule);
        return toResponse(vehicule);
    }

    @Override
    @Transactional
    public VehiculeResponse createVehicule(CreateVehiculeRequest request) {
        Utilisateur currentUser = authenticatedUserService.getCurrentUser();
        ensureSuperAdmin(currentUser);

        if (vehiculeRepository.existsByMatriculeIgnoreCase(request.matricule().trim())) {
            throw new BadRequestException("Vehicle matricule already exists");
        }

        Entreprise entreprise = requireEntreprise(request.entrepriseId());
        ensureEntrepriseCapacity(entreprise);

        Vehicule vehicule = Vehicule.builder()
            .matricule(request.matricule().trim())
            .marque(request.marque().trim())
            .modele(request.modele().trim())
            .capacite(request.capacite())
            .kilometrage(request.kilometrage())
            .statut(request.statut() == null ? StatutVehicule.EN_SERVICE : request.statut())
            .entreprise(entreprise)
            .build();

        vehiculeRepository.save(vehicule);
                Chauffeur chauffeur = null;
        if (request.chauffeurId() != null) {
            chauffeur = requireChauffeur(request.chauffeurId());
            ensureChauffeurCompatibleWithEntreprise(chauffeur, entreprise);
            ensureChauffeurAvailable(chauffeur, vehicule.getId());
            assignChauffeur(vehicule, chauffeur);
            vehiculeRepository.save(vehicule);
            utilisateurRepository.save(chauffeur);
        }

        notifyVehicleCreation(currentUser, vehicule, entreprise.getProprietaire(), chauffeur);
        return toResponse(vehicule);
    }

    @Override
    @Transactional
    public VehiculeResponse updateVehicule(Long id, UpdateVehiculeRequest request) {
        Utilisateur currentUser = authenticatedUserService.getCurrentUser();
        ensureSuperAdmin(currentUser);

        Vehicule vehicule = requireVehicule(id);
        Entreprise previousEntreprise = vehicule.getEntreprise();
        Chauffeur previousChauffeur = vehicule.getChauffeurActuel();
        StatutVehicule previousStatus = vehicule.getStatut();
        String previousMatricule = vehicule.getMatricule();

        if (request.matricule() != null && !request.matricule().trim().equalsIgnoreCase(previousMatricule)) {
            if (vehiculeRepository.existsByMatriculeIgnoreCase(request.matricule().trim())) {
                throw new BadRequestException("Vehicle matricule already exists");
            }
            vehicule.setMatricule(request.matricule().trim());
        }
        if (request.marque() != null) {
            vehicule.setMarque(request.marque().trim());
        }
        if (request.modele() != null) {
            vehicule.setModele(request.modele().trim());
        }
        if (request.capacite() != null) {
            vehicule.setCapacite(request.capacite());
        }
        if (request.kilometrage() != null) {
            vehicule.setKilometrage(request.kilometrage());
        }
        if (request.statut() != null) {
            vehicule.setStatut(request.statut());
        }

        if (request.entrepriseId() != null && (previousEntreprise == null || !Objects.equals(previousEntreprise.getId(), request.entrepriseId()))) {
            Entreprise newEntreprise = requireEntreprise(request.entrepriseId());
            ensureEntrepriseCapacity(newEntreprise);
            vehicule.setEntreprise(newEntreprise);
        }

        Chauffeur newChauffeur = null;
        if (request.chauffeurId() != null) {
            newChauffeur = requireChauffeur(request.chauffeurId());
            ensureChauffeurCompatibleWithEntreprise(newChauffeur, vehicule.getEntreprise());
            ensureChauffeurAvailable(newChauffeur, vehicule.getId());
            assignChauffeur(vehicule, newChauffeur);
            utilisateurRepository.save(newChauffeur);
        }

        vehiculeRepository.save(vehicule);

        notifyVehicleUpdate(currentUser, previousEntreprise, vehicule, previousChauffeur, newChauffeur, previousStatus, previousMatricule);
        return toResponse(vehicule);
    }

    @Override
    @Transactional
    public VehiculeResponse updateVehiculeStatus(Long id, UpdateVehiculeStatusRequest request) {
        Utilisateur currentUser = authenticatedUserService.getCurrentUser();
        Vehicule vehicule = requireVehicule(id);
        StatutVehicule previousStatus = vehicule.getStatut();

        if (currentUser.getRole() == Role.MANAGER) {
            ensureManagerOwnsVehicle(currentUser, vehicule);
            if (request.statut() != StatutVehicule.EN_MAINTENANCE) {
                throw new UnauthorizedException("Managers can only report vehicles as EN_MAINTENANCE");
            }
        } else if (currentUser.getRole() == Role.CHAUFFEUR) {
            ensureChauffeurIsAssignedToVehicle(currentUser, vehicule);
        } else {
            ensureSuperAdmin(currentUser);
        }

        vehicule.setStatut(request.statut());
        vehiculeRepository.save(vehicule);

        notifyVehicleStatusChange(vehicule, previousStatus, request.statut(), currentUser);
        return toResponse(vehicule);
    }

    @Override
    @Transactional
    public VehiculeResponse assignDriver(Long id, AssignVehiculeDriverRequest request) {
        Utilisateur currentUser = authenticatedUserService.getCurrentUser();
        Vehicule vehicule = requireVehicule(id);

        if (currentUser.getRole() == Role.MANAGER) {
            ensureManagerOwnsVehicle(currentUser, vehicule);
        } else {
            ensureSuperAdmin(currentUser);
        }

        Chauffeur chauffeur = requireChauffeur(request.chauffeurId());
        ensureChauffeurCompatibleWithEntreprise(chauffeur, vehicule.getEntreprise());
        if (!isDriverAvailableAfterRest(chauffeur)) {
            String message = buildRestMessage(chauffeur);
            notifyUsers(buildRecipients(vehicule.getEntreprise() != null ? vehicule.getEntreprise().getProprietaire() : null, chauffeur), recipient -> message);
            throw new BadRequestException(message);
        }
        ensureChauffeurAvailable(chauffeur, vehicule.getId());

        Chauffeur previousChauffeur = vehicule.getChauffeurActuel();
        assignChauffeur(vehicule, chauffeur);
        vehiculeRepository.save(vehicule);
        utilisateurRepository.save(chauffeur);
        if (previousChauffeur != null && !Objects.equals(previousChauffeur.getId(), chauffeur.getId())) {
            utilisateurRepository.save(previousChauffeur);
        }

        notifyDriverAssignment(vehicule, previousChauffeur, chauffeur, currentUser);
        return toResponse(vehicule);
    }

    @Override
    @Transactional
    public VehiculeResponse clearDriver(Long id) {
        Utilisateur currentUser = authenticatedUserService.getCurrentUser();
        ensureSuperAdmin(currentUser);

        Vehicule vehicule = requireVehicule(id);
        Chauffeur previousChauffeur = vehicule.getChauffeurActuel();
        if (previousChauffeur == null) {
            return toResponse(vehicule);
        }

        vehicule.setChauffeurActuel(null);
        previousChauffeur.setVehiculeActuel(null);
        previousChauffeur.setStatutConducteur(StatutChauffeur.LIBRE);
        vehiculeRepository.save(vehicule);
        utilisateurRepository.save(previousChauffeur);

        notifyUsers(buildRecipients(vehicule.getEntreprise() != null ? vehicule.getEntreprise().getProprietaire() : null, previousChauffeur), recipient -> {
            if (recipient.getRole() == Role.CHAUFFEUR) {
                return "Votre affectation au vehicule " + vehicleSummary(vehicule) + " a ete retiree par " + userLabel(currentUser) + ".";
            }
            if (recipient.getRole() == Role.MANAGER) {
                return "Le chauffeur " + userLabel(previousChauffeur) + " n'est plus affecte au vehicule " + vehicleSummary(vehicule) + ".";
            }
            return "Suppression d'affectation chauffeur sur vehicule " + vehicleSummary(vehicule)
                + " | entreprise: " + companyLabel(vehicule.getEntreprise())
                + " | acteur: " + userLabel(currentUser) + ".";
        });

        return toResponse(vehicule);
    }

    @Override
    @Transactional
    public void deleteVehicule(Long id) {
        Utilisateur currentUser = authenticatedUserService.getCurrentUser();
        ensureSuperAdmin(currentUser);

        Vehicule vehicule = requireVehicule(id);
        Chauffeur chauffeur = vehicule.getChauffeurActuel();
        Manager owner = vehicule.getEntreprise() != null ? vehicule.getEntreprise().getProprietaire() : null;

        if (chauffeur != null) {
            chauffeur.setVehiculeActuel(null);
            chauffeur.setStatutConducteur(StatutChauffeur.LIBRE);
            utilisateurRepository.save(chauffeur);
        }

        notifyUsers(buildRecipients(owner, chauffeur), recipient -> {
            if (recipient.getRole() == Role.CHAUFFEUR) {
                return "Le vehicule " + vehicleSummary(vehicule) + " auquel vous etiez affecte a ete supprime du systeme.";
            }
            if (recipient.getRole() == Role.MANAGER) {
                return "Un vehicule de votre flotte a ete supprime: " + vehicleSummary(vehicule) + ".";
            }
            return "Suppression vehicule " + vehicleSummary(vehicule)
                + " | entreprise: " + companyLabel(vehicule.getEntreprise())
                + " | chauffeur precedent: " + userLabel(chauffeur)
                + " | acteur: " + userLabel(currentUser) + ".";
        });

        vehiculeRepository.delete(vehicule);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AvailableDriverResponse> getAvailableDriversForVehicle(Long vehiculeId) {
        Utilisateur currentUser = authenticatedUserService.getCurrentUser();
        Vehicule vehicule = requireVehicule(vehiculeId);

        // Vérification d'accès : seul SuperAdmin o Manager propriétaire peut voir les chauffeurs disponibles
        if (currentUser.getRole() == Role.MANAGER) {
            ensureManagerOwnsVehicle(currentUser, vehicule);
        } else if (currentUser.getRole() != Role.SUPERADMIN) {
            throw new UnauthorizedException("Only SuperAdmin or Manager can access available drivers");
        }

        // Si le véhicule n'a pas d'entreprise assignée, retourner liste vide
        if (vehicule.getEntreprise() == null) {
            return List.of();
        }

        // Récupérer les chauffeurs LIBRES de l'entreprise du véhicule
        return chauffeurRepository.findAvailableDriversByEntreprise(
            vehicule.getEntreprise().getId(),
            StatutChauffeur.LIBRE
        ).stream()
            .filter(this::isDriverAvailableAfterRest)
            .map(chauffeur -> new AvailableDriverResponse(
                chauffeur.getId(),
                chauffeur.getPrenom(),
                chauffeur.getNom(),
                chauffeur.getEmail()
            ))
            .toList();
    }

    private Vehicule requireVehicule(Long id) {
        return vehiculeRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found"));
    }

    private Entreprise requireEntreprise(Long id) {
        return entrepriseRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Company not found"));
    }

    private Chauffeur requireChauffeur(Long id) {
        return chauffeurRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Driver not found"));
    }

    private Chauffeur requireCurrentChauffeur(Utilisateur currentUser) {
        return chauffeurRepository.findById(currentUser.getId())
            .orElseThrow(() -> new UnauthorizedException("Authenticated driver profile not found"));
    }

    private void ensureSuperAdmin(Utilisateur currentUser) {
        if (currentUser.getRole() != Role.SUPERADMIN) {
            throw new UnauthorizedException("Only SuperAdmin can perform this action");
        }
    }

    private void ensureReadableByCurrentUser(Utilisateur currentUser, Vehicule vehicule) {
        if (currentUser.getRole() == Role.SUPERADMIN) {
            return;
        }

        if (currentUser.getRole() == Role.MANAGER) {
            ensureManagerOwnsVehicle(currentUser, vehicule);
            return;
        }

        if (currentUser.getRole() == Role.CHAUFFEUR) {
            ensureChauffeurIsAssignedToVehicle(currentUser, vehicule);
            return;
        }

        throw new UnauthorizedException("You are not allowed to access this vehicle");
    }

    private void ensureManagerOwnsVehicle(Utilisateur currentUser, Vehicule vehicule) {
        Entreprise entreprise = currentUser.getEntreprise();
        if (entreprise == null || vehicule.getEntreprise() == null || !Objects.equals(entreprise.getId(), vehicule.getEntreprise().getId())) {
            throw new UnauthorizedException("You can only access vehicles from your company");
        }
    }

    private void ensureChauffeurIsAssignedToVehicle(Utilisateur currentUser, Vehicule vehicule) {
        Chauffeur chauffeur = requireCurrentChauffeur(currentUser);
        if (vehicule.getChauffeurActuel() == null || !Objects.equals(vehicule.getChauffeurActuel().getId(), chauffeur.getId())) {
            throw new UnauthorizedException("You can only access your assigned vehicle");
        }
    }

    private void ensureEntrepriseCapacity(Entreprise entreprise) {
        Integer capacity = entreprise.getTailleFlotte();
        if (capacity == null || capacity <= 0) {
            return;
        }

        long currentCount = vehiculeRepository.countByEntreprise_Id(entreprise.getId());
        if (currentCount >= capacity) {
            throw new BadRequestException("FLEET_CAPACITY_REACHED");
        }
    }

    private void ensureChauffeurCompatibleWithEntreprise(Chauffeur chauffeur, Entreprise entreprise) {
        if (entreprise == null) {
            return;
        }

        Long driverCompanyId = chauffeur.getEntreprise() != null
            ? chauffeur.getEntreprise().getId()
            : (chauffeur.getManager() != null && chauffeur.getManager().getEntreprise() != null
                ? chauffeur.getManager().getEntreprise().getId()
                : null);

        if (driverCompanyId != null && !Objects.equals(driverCompanyId, entreprise.getId())) {
            throw new ConflictException("Ce chauffeur n'appartient pas à l'entreprise du véhicule");
        }
    }

    private void ensureChauffeurAvailable(Chauffeur chauffeur, Long vehiculeId) {
        Vehicule currentVehicle = chauffeur.getVehiculeActuel();
        if (currentVehicle != null && !Objects.equals(currentVehicle.getId(), vehiculeId)) {
            throw new BadRequestException("Driver is already assigned to another vehicle");
        }

        if (currentVehicle == null && chauffeur.getStatutConducteur() != null && chauffeur.getStatutConducteur() != StatutChauffeur.LIBRE) {
            throw new BadRequestException("Driver is not available (statut chauffeur != LIBRE)");
        }
    }

    private boolean isDriverAvailableAfterRest(Chauffeur chauffeur) {
        return computeNextAvailability(chauffeur).available();
    }

    private String buildRestMessage(Chauffeur chauffeur) {
        DriverAvailability availability = computeNextAvailability(chauffeur);
        if (availability.available()) {
            return "Driver is not available";
        }

        String formatted = availability.availableAt() != null
            ? availability.availableAt().format(DateTimeFormatter.ofPattern("dd/MM/yyyy à HH:mm"))
            : "inconnue";

        return "⚠️ Ce chauffeur n'est pas encore disponible. Repos obligatoire de 12 heures après la dernière mission. Disponible le " + formatted + ".";
    }

    private DriverAvailability computeNextAvailability(Chauffeur chauffeur) {
        Trajet latestComplete = trajetRepository.findByChauffeurIdWithFetch(chauffeur.getId()).stream()
            .filter(trajet -> trajet.getStatut() == com.logiway.entities.enums.StatutTrajet.COMPLETE && trajet.getDateArriveeReelle() != null)
            .findFirst()
            .orElse(null);

        if (latestComplete == null) {
            return new DriverAvailability(null, true);
        }

        LocalDateTime availableAt = latestComplete.getDateArriveeReelle().plusHours(12);
        return new DriverAvailability(availableAt, !LocalDateTime.now().isBefore(availableAt));
    }

    private record DriverAvailability(LocalDateTime availableAt, boolean available) {}

    private void assignChauffeur(Vehicule vehicule, Chauffeur chauffeur) {
        Chauffeur previousChauffeur = vehicule.getChauffeurActuel();
        if (previousChauffeur != null && !Objects.equals(previousChauffeur.getId(), chauffeur.getId())) {
            previousChauffeur.setVehiculeActuel(null);
            previousChauffeur.setStatutConducteur(StatutChauffeur.LIBRE);
        }

        if (chauffeur.getEntreprise() == null && vehicule.getEntreprise() != null) {
            chauffeur.setEntreprise(vehicule.getEntreprise());
        }

        vehicule.setChauffeurActuel(chauffeur);
        chauffeur.setVehiculeActuel(vehicule);
        chauffeur.setStatutConducteur(StatutChauffeur.EN_SERVICE);
    }

    private void notifyVehicleCreation(Utilisateur actor, Vehicule vehicule, Manager owner, Chauffeur chauffeur) {
        List<Utilisateur> recipients = new ArrayList<>();
        if (owner != null) {
            recipients.add(owner);
        } else if (actor != null) {
            recipients.add(actor);
        }
        if (chauffeur != null) {
            recipients.add(chauffeur);
        }

        notifyUsers(recipients, recipient -> {
            if (recipient.getRole() == Role.CHAUFFEUR) {
                return "Vous etes affecte au vehicule " + vehicleSummary(vehicule)
                    + " dans l'entreprise " + companyLabel(vehicule.getEntreprise()) + ".";
            }
            if (recipient.getRole() == Role.MANAGER) {
                return "Nouveau vehicule ajoute a votre flotte: " + vehicleSummary(vehicule)
                    + " | statut: " + statusLabel(vehicule.getStatut())
                    + " | cree par: " + userLabel(actor)
                    + (chauffeur != null ? " | chauffeur: " + userLabel(chauffeur) : "") + ".";
            }
            return "Creation vehicule " + vehicleSummary(vehicule)
                + " | entreprise: " + companyLabel(vehicule.getEntreprise())
                + " | statut: " + statusLabel(vehicule.getStatut())
                + " | createur: " + userLabel(actor)
                + (chauffeur != null ? " | chauffeur affecte: " + userLabel(chauffeur) : "") + ".";
        });
    }

    private void notifyVehicleUpdate(Utilisateur actor, Entreprise previousEntreprise, Vehicule vehicule, Chauffeur previousChauffeur, Chauffeur newChauffeur, StatutVehicule previousStatus, String previousMatricule) {
        Manager currentOwner = vehicule.getEntreprise() != null ? vehicule.getEntreprise().getProprietaire() : null;
        Manager previousOwner = previousEntreprise != null ? previousEntreprise.getProprietaire() : null;

        if (!Objects.equals(previousMatricule, vehicule.getMatricule()) || !Objects.equals(previousStatus, vehicule.getStatut()) || !Objects.equals(previousEntreprise != null ? previousEntreprise.getId() : null, vehicule.getEntreprise() != null ? vehicule.getEntreprise().getId() : null)) {
            notifyUsers(buildRecipients(currentOwner, vehicule.getChauffeurActuel()), recipient -> {
                if (recipient.getRole() == Role.CHAUFFEUR) {
                    return "Le vehicule qui vous est affecte a ete mis a jour: " + vehicleSummary(vehicule)
                        + " | statut: " + statusLabel(vehicule.getStatut()) + ".";
                }
                if (recipient.getRole() == Role.MANAGER) {
                    return "Mise a jour d'un vehicule de votre flotte: " + vehicleSummary(vehicule)
                        + " | statut: " + statusLabel(vehicule.getStatut())
                        + " | acteur: " + userLabel(actor) + ".";
                }
                return "Mise a jour vehicule " + vehicleSummary(vehicule)
                    + " | ancienne matricule: " + previousMatricule
                    + " | nouveau statut: " + statusLabel(vehicule.getStatut())
                    + " | entreprise: " + companyLabel(vehicule.getEntreprise())
                    + " | acteur: " + userLabel(actor) + ".";
            });
        }

        if (previousEntreprise != null && vehicule.getEntreprise() != null && !Objects.equals(previousEntreprise.getId(), vehicule.getEntreprise().getId())) {
            notifyUsers(buildRecipients(previousOwner, null), recipient -> recipient.getRole() == Role.MANAGER
                ? "Le vehicule " + vehicleSummary(vehicule) + " a quitte votre flotte (transfert inter-entreprises)."
                : "Transfert vehicule " + vehicleSummary(vehicule) + " depuis " + companyLabel(previousEntreprise)
                    + " vers " + companyLabel(vehicule.getEntreprise()) + " | acteur: " + userLabel(actor) + ".");

            notifyUsers(buildRecipients(currentOwner, null), recipient -> recipient.getRole() == Role.MANAGER
                ? "Nouveau vehicule recu dans votre flotte: " + vehicleSummary(vehicule) + "."
                : "Reception vehicule apres transfert: " + vehicleSummary(vehicule)
                    + " | nouvelle entreprise: " + companyLabel(vehicule.getEntreprise()) + ".");
        }

        if (!Objects.equals(previousStatus, vehicule.getStatut())) {
            notifyUsers(buildRecipients(currentOwner, vehicule.getChauffeurActuel()), recipient -> {
                if (recipient.getRole() == Role.CHAUFFEUR) {
                    return "Statut de votre vehicule " + vehicleSummary(vehicule)
                        + " : " + statusLabel(previousStatus) + " -> " + statusLabel(vehicule.getStatut()) + ".";
                }
                if (recipient.getRole() == Role.MANAGER) {
                    return "Changement de statut vehicule: " + vehicleSummary(vehicule)
                        + " | " + statusLabel(previousStatus) + " -> " + statusLabel(vehicule.getStatut()) + ".";
                }
                return "Changement statut vehicule " + vehicleSummary(vehicule)
                    + " | " + statusLabel(previousStatus) + " -> " + statusLabel(vehicule.getStatut())
                    + " | acteur: " + userLabel(actor) + ".";
            });
        }

        if (!Objects.equals(previousChauffeur != null ? previousChauffeur.getId() : null, newChauffeur != null ? newChauffeur.getId() : null)) {
            if (previousChauffeur != null) {
                notifyUsers(List.of(previousChauffeur), recipient -> "Vous n'etes plus affecte au vehicule " + vehicleSummary(vehicule) + ".");
            }
            if (newChauffeur != null) {
                notifyUsers(List.of(newChauffeur), recipient -> "Vous avez ete affecte au vehicule " + vehicleSummary(vehicule) + ".");
            }
            if (currentOwner != null) {
                notifyUsers(buildRecipients(currentOwner, null), recipient -> recipient.getRole() == Role.MANAGER
                    ? "Le vehicule " + vehicleSummary(vehicule) + " a un nouveau chauffeur: " + userLabel(newChauffeur) + "."
                    : "Reaffectation chauffeur sur vehicule " + vehicleSummary(vehicule)
                        + " | ancien chauffeur: " + userLabel(previousChauffeur)
                        + " | nouveau chauffeur: " + userLabel(newChauffeur) + ".");
            }
        }
    }

    private void notifyVehicleStatusChange(Vehicule vehicule, StatutVehicule previousStatus, StatutVehicule newStatus, Utilisateur actor) {
        List<Utilisateur> recipients = new ArrayList<>();
        if (actor != null) {
            recipients.add(actor);
        }
        if (vehicule.getChauffeurActuel() != null) {
            recipients.add(vehicule.getChauffeurActuel());
        }
        if (vehicule.getEntreprise() != null && vehicule.getEntreprise().getProprietaire() != null) {
            recipients.add(vehicule.getEntreprise().getProprietaire());
        }

        if (!Objects.equals(previousStatus, newStatus)) {
            notifyUsers(recipients, recipient -> {
                if (recipient.getRole() == Role.CHAUFFEUR) {
                    return "Statut de votre vehicule " + vehicleSummary(vehicule)
                        + " : " + statusLabel(previousStatus) + " -> " + statusLabel(newStatus) + ".";
                }
                if (recipient.getRole() == Role.MANAGER) {
                    return "Le vehicule " + vehicleSummary(vehicule)
                        + " est passe de " + statusLabel(previousStatus) + " a " + statusLabel(newStatus)
                        + " (action: " + userLabel(actor) + ").";
                }
                return "Maj statut vehicule " + vehicleSummary(vehicule)
                    + " | " + statusLabel(previousStatus) + " -> " + statusLabel(newStatus)
                    + " | entreprise: " + companyLabel(vehicule.getEntreprise())
                    + " | acteur: " + userLabel(actor) + ".";
            });
        }
    }

    private void notifyDriverAssignment(Vehicule vehicule, Chauffeur previousChauffeur, Chauffeur newChauffeur, Utilisateur actor) {
        List<Utilisateur> recipients = new ArrayList<>();
        if (actor != null && actor.getRole() != Role.SUPERADMIN) {
            recipients.add(actor);
        }
        if (vehicule.getEntreprise() != null && vehicule.getEntreprise().getProprietaire() != null) {
            recipients.add(vehicule.getEntreprise().getProprietaire());
        }
        recipients.add(newChauffeur);

        if (previousChauffeur != null && !Objects.equals(previousChauffeur.getId(), newChauffeur.getId())) {
            notifyUsers(List.of(previousChauffeur), recipient -> "Vous n'etes plus affecte au vehicule " + vehicleSummary(vehicule)
                + " suite a une reaffectation par " + userLabel(actor) + ".");
        }

        notifyUsers(recipients, recipient -> {
            if (recipient.getRole() == Role.CHAUFFEUR) {
                return "Vous etes maintenant affecte au vehicule " + vehicleSummary(vehicule) + ".";
            }
            if (recipient.getRole() == Role.MANAGER) {
                return "Affectation chauffeur sur vehicule " + vehicleSummary(vehicule)
                    + " | chauffeur: " + userLabel(newChauffeur)
                    + " | acteur: " + userLabel(actor) + ".";
            }
            return "Affectation chauffeur vehicule " + vehicleSummary(vehicule)
                + " | chauffeur: " + userLabel(newChauffeur)
                + " | entreprise: " + companyLabel(vehicule.getEntreprise())
                + " | acteur: " + userLabel(actor) + ".";
        });
    }

    private List<Utilisateur> buildRecipients(Manager owner, Chauffeur chauffeur) {
        Set<Utilisateur> recipients = new LinkedHashSet<>();
        if (owner != null) {
            recipients.add(owner);
        }
        if (chauffeur != null) {
            recipients.add(chauffeur);
        }
        return new ArrayList<>(recipients);
    }



    private void notifyUsers(Collection<? extends Utilisateur> recipients, Function<Utilisateur, String> messageBuilder) {
        Set<Utilisateur> effectiveRecipients = new LinkedHashSet<>();
        if (recipients != null) {
            effectiveRecipients.addAll(recipients);
        }
        effectiveRecipients.addAll(utilisateurRepository.findByRole(Role.SUPERADMIN));
        if (effectiveRecipients.isEmpty()) {
            return;
        }

        Set<Long> notifiedIds = new LinkedHashSet<>();
        for (Utilisateur recipient : effectiveRecipients) {
            if (recipient == null || recipient.getId() == null || !notifiedIds.add(recipient.getId())) {
                continue;
            }

            String message = messageBuilder == null ? "" : safe(messageBuilder.apply(recipient));
            if (message.isBlank()) {
                continue;
            }

            Notification notification = Notification.builder()
                .type(TypeNotif.NOTIF_VEHICULE)
                .message(message)
                .utilisateur(recipient)
                .estLu(false)
                .build();
            notificationRepository.save(notification);
            notificationRealtimeService.publishToUsers(List.of(recipient.getId()), notification);
        }
    }

    private String vehicleLabel(Vehicule vehicule) {
        if (vehicule == null) {
            return "inconnu";
        }
        if (vehicule.getMatricule() != null && !vehicule.getMatricule().isBlank()) {
            return vehicule.getMatricule();
        }
        return "#" + vehicule.getId();
    }

    private String vehicleSummary(Vehicule vehicule) {
        if (vehicule == null) {
            return "Vehicule inconnu";
        }
        String model = (safe(vehicule.getMarque()) + " " + safe(vehicule.getModele())).trim();
        if (model.isBlank()) {
            return vehicleLabel(vehicule);
        }
        return vehicleLabel(vehicule) + " (" + model + ")";
    }

    private String companyLabel(Entreprise entreprise) {
        if (entreprise == null) {
            return "N/A";
        }
        if (entreprise.getNomEntreprise() != null && !entreprise.getNomEntreprise().isBlank()) {
            return entreprise.getNomEntreprise();
        }
        return "#" + entreprise.getId();
    }

    private String statusLabel(StatutVehicule statut) {
        if (statut == null) {
            return "INCONNU";
        }
        return statut.name();
    }

    private String userLabel(Utilisateur user) {
        if (user == null) {
            return "le systeme";
        }

        String fullName = safe(user.getPrenom()) + " " + safe(user.getNom());
        String trimmed = fullName.trim();
        if (!trimmed.isBlank()) {
            return trimmed;
        }
        if (user.getEmail() != null && !user.getEmail().isBlank()) {
            return user.getEmail();
        }
        return "#" + user.getId();
    }

    private String safe(String value) {
        return value == null ? "" : value;
    }

    private VehiculeResponse toResponse(Vehicule vehicule) {
        Manager owner = vehicule.getEntreprise() != null ? vehicule.getEntreprise().getProprietaire() : null;
        Chauffeur chauffeur = vehicule.getChauffeurActuel();
        return new VehiculeResponse(
            vehicule.getId(),
            vehicule.getMatricule(),
            vehicule.getMarque(),
            vehicule.getModele(),
            vehicule.getCapacite(),
            vehicule.getKilometrage(),
            vehicule.getStatut(),
            vehicule.getEntreprise() != null ? vehicule.getEntreprise().getId() : null,
            vehicule.getEntreprise() != null ? vehicule.getEntreprise().getNomEntreprise() : null,
            chauffeur != null ? chauffeur.getId() : null,
            chauffeur != null ? userLabel(chauffeur) : null,
            owner != null ? owner.getId() : null,
            owner != null ? owner.getPrenom() : null,
            owner != null ? owner.getNom() : null
        );
    }
}
