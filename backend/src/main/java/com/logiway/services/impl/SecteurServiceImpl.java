package com.logiway.services.impl;

import com.logiway.dto.request.CreateSectorRequest;
import com.logiway.dto.request.UpdateSectorRequest;
import com.logiway.dto.response.SectorResponse;
import com.logiway.entities.Chauffeur;
import com.logiway.entities.Entreprise;
import com.logiway.entities.Manager;
import com.logiway.entities.Notification;
import com.logiway.entities.Secteur;
import com.logiway.entities.Utilisateur;
import com.logiway.entities.enums.Role;
import com.logiway.entities.enums.TypeNotif;
import com.logiway.exceptions.BadRequestException;
import com.logiway.exceptions.ResourceNotFoundException;
import com.logiway.exceptions.UnauthorizedException;
import com.logiway.repositories.ChauffeurRepository;
import com.logiway.repositories.EntrepriseRepository;
import com.logiway.repositories.ManagerRepository;
import com.logiway.repositories.NotificationRepository;
import com.logiway.repositories.SecteurRepository;
import com.logiway.repositories.UtilisateurRepository;
import com.logiway.security.AuthenticatedUserService;
import com.logiway.services.NotificationRealtimeService;
import com.logiway.services.SecteurService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class SecteurServiceImpl implements SecteurService {

    private final SecteurRepository secteurRepository;
    private final EntrepriseRepository entrepriseRepository;
    private final ManagerRepository managerRepository;
    private final ChauffeurRepository chauffeurRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final NotificationRepository notificationRepository;
    private final NotificationRealtimeService notificationRealtimeService;
    private final AuthenticatedUserService authenticatedUserService;

    @Override
    @Transactional(readOnly = true)
    public List<SectorResponse> getAccessibleSectors() {
        Utilisateur currentUser = authenticatedUserService.getCurrentUser();

        if (currentUser.getRole() == Role.SUPERADMIN) {
            // ✅ FIX: Utiliser findAllWithRelations() pour charger toutes les relations
            // Évite LazyInitializationException et améliore les performances (1 query au lieu de N+1)
            List<Secteur> secteurs = secteurRepository.findAllWithRelations();
            log.info("[SECTEUR-AFFICHAGE] SUPERADMIN {} accède à {} secteur(s)", 
                     currentUser.getId(), secteurs.size());
            return secteurs.stream()
                .map(this::toResponse)
                .toList();
        }

        if (currentUser.getRole() == Role.MANAGER) {
            Long entrepriseId = currentUser.getEntreprise() != null ? currentUser.getEntreprise().getId() : null;
            if (entrepriseId == null) {
                log.warn("[SECTEUR-AFFICHAGE] MANAGER {} n'a pas d'entreprise assignée - retour liste vide", 
                         currentUser.getId());
                return List.of();
            }
            
            // ✅ FIX: Utiliser findByEntrepriseIdWithRelations() pour charger les relations
            // Résout le problème : les managers voient maintenant leurs secteurs avec tous les détails
            List<Secteur> secteurs = secteurRepository.findByEntrepriseIdWithRelations(entrepriseId);
            log.info("[SECTEUR-AFFICHAGE] MANAGER {} (entreprise {}) accède à {} secteur(s)", 
                     currentUser.getId(), entrepriseId, secteurs.size());
            
            if (secteurs.isEmpty()) {
                log.warn("[SECTEUR-AFFICHAGE] Aucun secteur trouvé pour l'entreprise {} du MANAGER {}", 
                         entrepriseId, currentUser.getId());
            }
            
            return secteurs.stream()
                .map(this::toResponse)
                .toList();
        }

        if (currentUser.getRole() == Role.CHAUFFEUR) {
            Chauffeur chauffeur = chauffeurRepository.findById(currentUser.getId()).orElse(null);
            if (chauffeur == null) {
                log.warn("[SECTEUR-AFFICHAGE] CHAUFFEUR {} non trouvé dans la base", currentUser.getId());
                return List.of();
            }
            
            // ✅ FIX: Utiliser resolveChauffeurSectorWithRelations() pour charger les relations
            // Résout le problème : les chauffeurs voient maintenant leur secteur avec tous les détails
            Secteur secteur = resolveChauffeurSectorWithRelations(chauffeur);
            if (secteur == null) {
                log.warn("[SECTEUR-AFFICHAGE] Aucun secteur résolu pour CHAUFFEUR {} - " +
                        "secteur direct: {}, manager: {}, entreprise: {}", 
                         currentUser.getId(),
                         chauffeur.getSecteur() != null ? chauffeur.getSecteur().getId() : "null",
                         chauffeur.getManager() != null ? chauffeur.getManager().getId() : "null",
                         chauffeur.getEntreprise() != null ? chauffeur.getEntreprise().getId() : "null");
                return List.of();
            }
            
            log.info("[SECTEUR-AFFICHAGE] CHAUFFEUR {} accède au secteur {} ({})", 
                     currentUser.getId(), secteur.getId(), secteur.getNom());
            return List.of(toResponse(secteur));
        }

        log.warn("[SECTEUR-AFFICHAGE] Rôle inconnu pour utilisateur {}: {}", 
                 currentUser.getId(), currentUser.getRole());
        return List.of();
    }

    @Override
    @Transactional(readOnly = true)
    public SectorResponse getSectorById(Long id) {
        Secteur secteur = requireSector(id);
        authorizeRead(secteur);
        return toResponse(secteur);
    }

    @Override
    @Transactional
    public SectorResponse createSector(CreateSectorRequest request) {
        Utilisateur currentUser = authenticatedUserService.getCurrentUser();
        requireSuperAdmin(currentUser);

        Long entrepriseId = requireEntrepriseId(request.entrepriseId());
        if (secteurRepository.existsByNomIgnoreCaseAndEntreprise_Id(request.nom().trim(), entrepriseId)) {
            throw new BadRequestException("Un secteur avec ce nom existe déjà pour cette entreprise.");
        }

        Entreprise entreprise = entrepriseRepository.findById(entrepriseId)
            .orElseThrow(() -> new ResourceNotFoundException("Entreprise not found"));

        Secteur secteur = Secteur.builder()
            .nom(trim(request.nom()))
            .description(trimOrNull(request.description()))
            .zoneGeographique(trim(request.zoneGeographique()))
            .codesPostaux(trimOrNull(request.codesPostaux()))
            .entreprise(entreprise)
            .build();

        secteurRepository.save(secteur);

        if (request.managerId() != null) {
            assignManager(secteur.getId(), request.managerId());
        }

        notifySuperAdminsSector("Le secteur " + secteurLabel(secteur) + " a ete cree.");

        return toResponse(requireSector(secteur.getId()));
    }

    @Override
    @Transactional
    public SectorResponse updateSector(Long id, UpdateSectorRequest request) {
        Utilisateur currentUser = authenticatedUserService.getCurrentUser();
        requireSuperAdmin(currentUser);

        Secteur secteur = requireSector(id);
        String newName = trim(request.nom());
        if (newName != null && secteurRepository.existsByNomIgnoreCaseAndEntreprise_IdAndIdNot(newName, resolveEntrepriseId(request.entrepriseId(), secteur), secteur.getId())) {
            throw new BadRequestException("Un secteur avec ce nom existe déjà pour cette entreprise.");
        }

        Long previousEntrepriseId = secteur.getEntreprise() != null ? secteur.getEntreprise().getId() : null;
        Long targetEntrepriseId = resolveEntrepriseId(request.entrepriseId(), secteur);
        boolean enterpriseChanged = targetEntrepriseId != null && !Objects.equals(previousEntrepriseId, targetEntrepriseId);

        if (enterpriseChanged) {
            ensureCanMoveSector(secteur);
            Entreprise targetEntreprise = entrepriseRepository.findById(targetEntrepriseId)
                .orElseThrow(() -> new ResourceNotFoundException("Entreprise not found"));
            secteur.setEntreprise(targetEntreprise);
            detachSectorUsers(secteur, true);
        }

        if (newName != null) secteur.setNom(newName);
        if (request.description() != null) secteur.setDescription(trimOrNull(request.description()));
        if (request.zoneGeographique() != null) secteur.setZoneGeographique(trim(request.zoneGeographique()));
        if (request.codesPostaux() != null) secteur.setCodesPostaux(trimOrNull(request.codesPostaux()));

        secteurRepository.save(secteur);

        if (request.managerId() != null) {
            assignManager(secteur.getId(), request.managerId());
        }

        Secteur updatedSecteur = requireSector(secteur.getId());
        notifySuperAdminsSector("Le secteur " + secteurLabel(updatedSecteur) + " a ete modifie.");
        notifyUsersSector(collectSectorAudience(updatedSecteur),
            "Les informations du secteur " + secteurLabel(updatedSecteur) + " ont ete mises a jour.");

        return toResponse(updatedSecteur);
    }

    @Override
    @Transactional
    public void deleteSector(Long id) {
        Utilisateur currentUser = authenticatedUserService.getCurrentUser();
        requireSuperAdmin(currentUser);

        Secteur secteur = requireSector(id);
        int managersCount = secteur.getManagers() != null ? secteur.getManagers().size() : 0;
        int chauffeursCount = secteur.getChauffeurs() != null ? secteur.getChauffeurs().size() : 0;
        if (managersCount > 0 || chauffeursCount > 0) {
            throw new BadRequestException(String.format(
                "Suppression impossible: %d manager(s) et %d chauffeur(s) sont encore assignés à ce secteur.",
                managersCount,
                chauffeursCount
            ));
        }

        String deletedSectorLabel = secteurLabel(secteur);

        secteurRepository.delete(secteur);
        notifySuperAdminsSector("Le secteur " + deletedSectorLabel + " a ete supprime.");
    }

    @Override
    @Transactional
    public SectorResponse assignManager(Long sectorId, Long managerId) {
        requireSuperAdmin(authenticatedUserService.getCurrentUser());

        Secteur secteur = requireSector(sectorId);
        Manager manager = requireManager(managerId);
        String previousSectorLabel = manager.getSecteur() != null ? secteurLabel(manager.getSecteur()) : null;

        if (manager.getSecteur() != null && !Objects.equals(manager.getSecteur().getId(), secteur.getId())) {
            manager.setSecteur(null);
        }

        manager.setSecteur(secteur);
        manager.setEntreprise(secteur.getEntreprise());
        managerRepository.save(manager);

        notifySectorUser(manager,
            previousSectorLabel == null
                ? "Vous avez ete affecte au secteur " + secteurLabel(secteur) + "."
                : "Votre affectation secteur est passee de " + previousSectorLabel + " a " + secteurLabel(secteur) + ".");
        notifySuperAdminsSector("Manager " + userLabel(manager) + " affecte au secteur " + secteurLabel(secteur) + ".");

        return toResponse(requireSector(sectorId));
    }

    @Override
    @Transactional
    public SectorResponse removeManager(Long sectorId, Long managerId) {
        requireSuperAdmin(authenticatedUserService.getCurrentUser());

        Secteur secteur = requireSector(sectorId);
        Manager manager = requireManager(managerId);
        if (manager.getSecteur() != null && Objects.equals(manager.getSecteur().getId(), secteur.getId())) {
            manager.setSecteur(null);
            managerRepository.save(manager);
            notifySectorUser(manager, "Vous avez ete retire du secteur " + secteurLabel(secteur) + ".");
            notifySuperAdminsSector("Manager " + userLabel(manager) + " retire du secteur " + secteurLabel(secteur) + ".");
        }

        return toResponse(requireSector(sectorId));
    }

    @Override
    @Transactional
    public SectorResponse assignChauffeur(Long sectorId, Long chauffeurId) {
        requireSuperAdmin(authenticatedUserService.getCurrentUser());

        Secteur secteur = requireSector(sectorId);
        Chauffeur chauffeur = requireChauffeur(chauffeurId);
        String previousSectorLabel = chauffeur.getSecteur() != null ? secteurLabel(chauffeur.getSecteur()) : null;
        chauffeur.setSecteur(secteur);
        chauffeur.setEntreprise(secteur.getEntreprise());
        chauffeurRepository.save(chauffeur);

        notifySectorUser(chauffeur,
            previousSectorLabel == null
                ? "Vous avez ete affecte au secteur " + secteurLabel(secteur) + "."
                : "Votre affectation secteur est passee de " + previousSectorLabel + " a " + secteurLabel(secteur) + ".");
        notifySuperAdminsSector("Chauffeur " + userLabel(chauffeur) + " affecte au secteur " + secteurLabel(secteur) + ".");
        return toResponse(requireSector(sectorId));
    }

    @Override
    @Transactional
    public SectorResponse removeChauffeur(Long sectorId, Long chauffeurId) {
        requireSuperAdmin(authenticatedUserService.getCurrentUser());

        Secteur secteur = requireSector(sectorId);
        Chauffeur chauffeur = requireChauffeur(chauffeurId);
        if (chauffeur.getSecteur() != null && Objects.equals(chauffeur.getSecteur().getId(), secteur.getId())) {
            chauffeur.setSecteur(null);
            chauffeurRepository.save(chauffeur);
            notifySectorUser(chauffeur, "Vous avez ete retire du secteur " + secteurLabel(secteur) + ".");
            notifySuperAdminsSector("Chauffeur " + userLabel(chauffeur) + " retire du secteur " + secteurLabel(secteur) + ".");
        }

        return toResponse(requireSector(sectorId));
    }

    private void detachSectorUsers(Secteur secteur, boolean notifyUsers) {
        List<Utilisateur> impacted = new ArrayList<>();

        if (secteur.getManagers() != null) {
            for (Manager manager : new ArrayList<>(secteur.getManagers())) {
                manager.setSecteur(null);
                managerRepository.save(manager);
                impacted.add(manager);
            }
        }

        if (secteur.getChauffeurs() != null) {
            for (Chauffeur chauffeur : new ArrayList<>(secteur.getChauffeurs())) {
                chauffeur.setSecteur(null);
                chauffeurRepository.save(chauffeur);
                impacted.add(chauffeur);
            }
        }

        if (notifyUsers) {
            impacted.forEach(user -> notifySectorUser(user,
                user instanceof Chauffeur
                    ? "Votre secteur a été modifié par l'administrateur. Veuillez contacter votre manager pour plus d'informations."
                    : "Le secteur qui vous était assigné a été réattribué à une autre entreprise par l'administrateur."));
        }
    }

    private void notifySectorUser(Utilisateur user, String message) {
        if (user == null) {
            return;
        }

        Notification notification = Notification.builder()
            .type(TypeNotif.SECTEUR)
            .message(message)
            .utilisateur(user)
            .estLu(false)
            .build();
        notificationRepository.save(notification);
        notificationRealtimeService.publishToUsers(List.of(user.getId()), notification);
    }

    private void notifyUsersSector(Collection<? extends Utilisateur> recipients, String message) {
        if (recipients == null || recipients.isEmpty()) {
            return;
        }

        LinkedHashSet<Long> notifiedIds = new LinkedHashSet<>();
        for (Utilisateur recipient : recipients) {
            if (recipient == null || recipient.getId() == null || !notifiedIds.add(recipient.getId())) {
                continue;
            }
            notifySectorUser(recipient, message);
        }
    }

    private void notifySuperAdminsSector(String message) {
        notifyUsersSector(utilisateurRepository.findByRole(Role.SUPERADMIN), message);
    }

    private Collection<Utilisateur> collectSectorAudience(Secteur secteur) {
        LinkedHashSet<Utilisateur> recipients = new LinkedHashSet<>();
        recipients.addAll(secteur.getManagers());
        recipients.addAll(collectSectorDriverEntities(secteur));
        return recipients;
    }

    private void ensureCanMoveSector(Secteur secteur) {
        if ((secteur.getManagers() != null && !secteur.getManagers().isEmpty()) || (secteur.getChauffeurs() != null && !secteur.getChauffeurs().isEmpty())) {
            detachSectorUsers(secteur, true);
        }
    }

    private SectorResponse toResponse(Secteur secteur) {
        List<SectorResponse.SectorManagerInfo> managers = secteur.getManagers().stream()
            .sorted(Comparator.comparing(Manager::getId))
            .map(manager -> new SectorResponse.SectorManagerInfo(
                manager.getId(),
                manager.getPrenom(),
                manager.getNom(),
                manager.getEmail(),
                manager.getRole()
            ))
            .toList();

        List<SectorResponse.SectorDriverInfo> chauffeurs = collectSectorDrivers(secteur);

        return new SectorResponse(
            secteur.getId(),
            secteur.getNom(),
            secteur.getDescription(),
            secteur.getZoneGeographique(),
            secteur.getCodesPostaux(),
            secteur.getEntreprise() != null ? secteur.getEntreprise().getId() : null,
            managers,
            chauffeurs
        );
    }

    /**
     * ✅ FIX: Nouvelle méthode pour résoudre le secteur d'un chauffeur avec toutes les relations chargées
     * Remplace resolveChauffeurSector() pour éviter LazyInitializationException
     * 
     * Stratégie de résolution (par ordre de priorité):
     * 1. Secteur directement assigné au chauffeur (via chauffeur.secteur_id)
     * 2. Secteur du manager du chauffeur (via chauffeur.manager.secteur_id)
     * 3. Premier secteur de l'entreprise du chauffeur (fallback)
     */
    private Secteur resolveChauffeurSectorWithRelations(Chauffeur chauffeur) {
        if (chauffeur == null) {
            log.warn("[SECTEUR-RESOLUTION] Chauffeur null fourni");
            return null;
        }

        // Cas 1 : Chauffeur directement assigné à un secteur
        if (chauffeur.getSecteur() != null && chauffeur.getSecteur().getId() != null) {
            Long secteurId = chauffeur.getSecteur().getId();
            log.info("[SECTEUR-RESOLUTION] Chauffeur {} - Secteur direct trouvé: {}", 
                     chauffeur.getId(), secteurId);
            Optional<Secteur> secteurOpt = secteurRepository.findByIdWithRelations(secteurId);
            if (secteurOpt.isPresent()) {
                return secteurOpt.get();
            }
        }

        // Cas 2 : Chauffeur assigné via son manager
        if (chauffeur.getManager() != null && chauffeur.getManager().getSecteur() != null 
            && chauffeur.getManager().getSecteur().getId() != null) {
            Long secteurId = chauffeur.getManager().getSecteur().getId();
            log.info("[SECTEUR-RESOLUTION] Chauffeur {} - Secteur via manager {} trouvé: {}", 
                     chauffeur.getId(), chauffeur.getManager().getId(), secteurId);
            Optional<Secteur> secteurOpt = secteurRepository.findByIdWithRelations(secteurId);
            if (secteurOpt.isPresent()) {
                return secteurOpt.get();
            }
        }

        // Cas 3 : Fallback sur l'entreprise (premier secteur de l'entreprise)
        Long entrepriseId = chauffeur.getEntreprise() != null
            ? chauffeur.getEntreprise().getId()
            : (chauffeur.getManager() != null && chauffeur.getManager().getEntreprise() != null
                ? chauffeur.getManager().getEntreprise().getId()
                : null);

        if (entrepriseId == null) {
            log.warn("[SECTEUR-RESOLUTION] Chauffeur {} - Aucune entreprise trouvée", chauffeur.getId());
            return null;
        }

        log.info("[SECTEUR-RESOLUTION] Chauffeur {} - Fallback sur entreprise {}", 
                 chauffeur.getId(), entrepriseId);
        List<Secteur> secteursEntreprise = secteurRepository.findByEntrepriseIdWithRelations(entrepriseId);
        
        if (secteursEntreprise.isEmpty()) {
            log.warn("[SECTEUR-RESOLUTION] Chauffeur {} - Aucun secteur trouvé pour entreprise {}", 
                     chauffeur.getId(), entrepriseId);
            return null;
        }
        
        Secteur secteur = secteursEntreprise.get(0);
        log.info("[SECTEUR-RESOLUTION] Chauffeur {} - Fallback secteur: {} ({})", 
                 chauffeur.getId(), secteur.getId(), secteur.getNom());
        return secteur;
    }

    /**
     * @deprecated Utiliser resolveChauffeurSectorWithRelations() à la place
     * Cette méthode ne charge pas les relations et cause des LazyInitializationException
     */
    @Deprecated
    private Secteur resolveChauffeurSector(Chauffeur chauffeur) {
        if (chauffeur == null) {
            return null;
        }

        if (chauffeur.getSecteur() != null) {
            return chauffeur.getSecteur();
        }

        if (chauffeur.getManager() != null && chauffeur.getManager().getSecteur() != null) {
            return chauffeur.getManager().getSecteur();
        }

        Long entrepriseId = chauffeur.getEntreprise() != null
            ? chauffeur.getEntreprise().getId()
            : (chauffeur.getManager() != null && chauffeur.getManager().getEntreprise() != null
                ? chauffeur.getManager().getEntreprise().getId()
                : null);

        if (entrepriseId == null) {
            return null;
        }

        List<Secteur> secteursEntreprise = secteurRepository.findByEntreprise_Id(entrepriseId);
        return secteursEntreprise.isEmpty() ? null : secteursEntreprise.get(0);
    }

    private List<SectorResponse.SectorDriverInfo> collectSectorDrivers(Secteur secteur) {
        return collectSectorDriverEntities(secteur).stream()
            .sorted(Comparator.comparing(Chauffeur::getId))
            .map(chauffeur -> new SectorResponse.SectorDriverInfo(
                chauffeur.getId(),
                chauffeur.getPrenom(),
                chauffeur.getNom(),
                chauffeur.getManager() != null ? chauffeur.getManager().getId() : null
            ))
            .toList();
    }

    private List<Chauffeur> collectSectorDriverEntities(Secteur secteur) {
        LinkedHashMap<Long, Chauffeur> uniqueDrivers = new LinkedHashMap<>();

        // Keep direct sector-driver assignments when they exist.
        for (Chauffeur chauffeur : secteur.getChauffeurs()) {
            if (chauffeur.getId() != null) {
                uniqueDrivers.put(chauffeur.getId(), chauffeur);
            }
        }

        // Also include drivers attached through managers assigned to this sector.
        List<Long> managerIds = secteur.getManagers().stream()
            .map(Manager::getId)
            .filter(Objects::nonNull)
            .toList();

        if (!managerIds.isEmpty()) {
            for (Chauffeur chauffeur : chauffeurRepository.findByManagerIdIn(managerIds)) {
                if (chauffeur.getId() != null) {
                    uniqueDrivers.putIfAbsent(chauffeur.getId(), chauffeur);
                }
            }
        }

        return new ArrayList<>(uniqueDrivers.values());
    }

    private String secteurLabel(Secteur secteur) {
        if (secteur == null) {
            return "Secteur";
        }

        String nom = trim(secteur.getNom());
        return nom != null ? nom : "Secteur";
    }

    private String userLabel(Utilisateur user) {
        if (user == null) {
            return "Utilisateur";
        }

        String fullName = (trim(user.getPrenom()) == null ? "" : user.getPrenom().trim()) + " " + (trim(user.getNom()) == null ? "" : user.getNom().trim());
        String normalizedName = fullName.trim();
        if (!normalizedName.isEmpty()) {
            return normalizedName;
        }

        String email = trim(user.getEmail());
        return email != null ? email : "Utilisateur";
    }

    private Secteur requireSector(Long id) {
        return secteurRepository.findByIdWithRelations(id)
            .orElseThrow(() -> new ResourceNotFoundException("Secteur not found"));
    }

    private Manager requireManager(Long id) {
        return managerRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Manager not found"));
    }

    private Chauffeur requireChauffeur(Long id) {
        return chauffeurRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Chauffeur not found"));
    }

    private void authorizeRead(Secteur secteur) {
        Utilisateur currentUser = authenticatedUserService.getCurrentUser();
        if (currentUser.getRole() == Role.SUPERADMIN) {
            return;
        }

        if (currentUser.getRole() == Role.MANAGER) {
            Long entrepriseId = currentUser.getEntreprise() != null ? currentUser.getEntreprise().getId() : null;
            if (entrepriseId != null && Objects.equals(entrepriseId, secteur.getEntreprise() != null ? secteur.getEntreprise().getId() : null)) {
                return;
            }
        }

        if (currentUser.getRole() == Role.CHAUFFEUR) {
            Chauffeur chauffeur = chauffeurRepository.findById(currentUser.getId()).orElse(null);
            if (chauffeur != null && chauffeur.getSecteur() != null && Objects.equals(chauffeur.getSecteur().getId(), secteur.getId())) {
                return;
            }
        }

        throw new UnauthorizedException("You are not allowed to access this sector");
    }

    private void requireSuperAdmin(Utilisateur currentUser) {
        if (currentUser == null || currentUser.getRole() != Role.SUPERADMIN) {
            throw new UnauthorizedException("Only SuperAdmin can manage sectors");
        }
    }

    private Long requireEntrepriseId(Long entrepriseId) {
        if (entrepriseId == null) {
            throw new BadRequestException("Entreprise is required");
        }
        return entrepriseId;
    }

    private Long resolveEntrepriseId(Long newEntrepriseId, Secteur secteur) {
        return newEntrepriseId != null ? newEntrepriseId : (secteur.getEntreprise() != null ? secteur.getEntreprise().getId() : null);
    }

    private String trim(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String trimOrNull(String value) {
        return trim(value);
    }
}