package com.logiway.services.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.logiway.dto.request.CreateReclamationRequest;
import com.logiway.dto.request.ReclamationDecisionRequest;
import com.logiway.dto.request.UpdateReclamationRequest;
import com.logiway.dto.request.ValidateReclamationRequest;
import com.logiway.dto.response.ValidateReclamationFieldResponse;
import com.logiway.dto.response.ValidateReclamationResponse;
import com.logiway.dto.response.ReclamationResponse;
import com.logiway.entities.Chauffeur;
import com.logiway.entities.Reclamation;
import com.logiway.entities.Utilisateur;
import com.logiway.entities.enums.PrioriteReclamation;
import com.logiway.entities.enums.Role;
import com.logiway.entities.enums.StatutReclamation;
import com.logiway.entities.enums.TypeNotif;
import com.logiway.exceptions.BadRequestException;
import com.logiway.exceptions.ResourceNotFoundException;
import com.logiway.exceptions.UnauthorizedException;
import jakarta.persistence.EntityManager;
import jakarta.annotation.PostConstruct;
import com.logiway.repositories.ReclamationRepository;
import com.logiway.repositories.UtilisateurRepository;
import com.logiway.repositories.ChauffeurRepository;
import com.logiway.repositories.NotificationRepository;
import com.logiway.security.AuthenticatedUserService;
import com.logiway.services.ReclamationService;
import com.logiway.services.NotificationRealtimeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReclamationServiceImpl implements ReclamationService {

    private final ReclamationRepository reclamationRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final ChauffeurRepository chauffeurRepository;
    private final NotificationRepository notificationRepository;
    private final NotificationRealtimeService notificationRealtimeService;
    private final AuthenticatedUserService authenticatedUserService;
    private final RestTemplate restTemplate;
    private final EntityManager em;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${hf.api.token:}")
    private String hfApiToken;

    @Value("${reclamation.ai.local-service-url}")
    private String localAiServiceUrl;

    private static final double TOXICITY_THRESHOLD = 0.55;
    private static final double SEMANTIC_THRESHOLD = 0.25;

    @PostConstruct
    public void init() {
        log.info("[RECLAMATION-AI] ═══════════════════════════════════════");
        log.info("[RECLAMATION-AI] Pipeline IA Réclamations — Diagnostic");
        log.info("[RECLAMATION-AI] Service local = {}", localAiServiceUrl);
        log.info("[RECLAMATION-AI] Token HF configuré = {}", hfApiToken != null && !hfApiToken.isBlank());
        log.info("[RECLAMATION-AI] Seuil toxicité = {}", TOXICITY_THRESHOLD);
        log.info("[RECLAMATION-AI] Seuil sémantique = {}", SEMANTIC_THRESHOLD);
        log.info("[RECLAMATION-AI] ═══════════════════════════════════════");
    }

    @Override
    @Transactional
    public ReclamationResponse createReclamation(CreateReclamationRequest request) {
        Utilisateur currentUser = authenticatedUserService.getCurrentUser();
        if (currentUser.getRole() != Role.MANAGER && currentUser.getRole() != Role.CHAUFFEUR) {
            throw new UnauthorizedException("Only managers and drivers can submit reclamations");
        }

        String subject = request.getSujet() == null ? "" : request.getSujet().trim();
        String description = request.getDescription() == null ? "" : request.getDescription().trim();
        if (subject.isBlank()) {
            throw new BadRequestException("Sujet is required");
        }
        if (description.isBlank()) {
            throw new BadRequestException("Description is required");
        }

        validateSubmissionOrThrow(subject, description);

        Reclamation reclamation = Reclamation.builder()
            .sujet(subject)
            .description(description)
            .priorite(request.getPriorite())
            .statut(StatutReclamation.EN_COURS)
            .utilisateur(currentUser)
            .build();

        reclamationRepository.save(reclamation);

        notifySuperAdminsOfNewReclamation(reclamation);
        createNotificationForUser(currentUser, "Votre réclamation a été soumise avec succès. Le SuperAdmin en a été informé.");

        return toResponse(reclamation);
    }

    @Override
    @Transactional
    public ReclamationResponse updateReclamation(Long id, UpdateReclamationRequest request) {
        Utilisateur currentUser = authenticatedUserService.getCurrentUser();
        Reclamation reclamation = requireOwnedDraftReclamation(id, currentUser);

        String subject = request.getSujet() == null ? "" : request.getSujet().trim();
        String description = request.getDescription() == null ? "" : request.getDescription().trim();
        if (subject.isBlank()) {
            throw new BadRequestException("Sujet is required");
        }
        if (description.isBlank()) {
            throw new BadRequestException("Description is required");
        }

        validateSubmissionOrThrow(subject, description);

        reclamation.setSujet(subject);
        reclamation.setDescription(description);
        reclamation.setPriorite(request.getPriorite());
        reclamation.setStatut(StatutReclamation.EN_COURS);
        reclamation.setCommentaireResolution(null);
        reclamationRepository.save(reclamation);

        notifySuperAdminsOfNewReclamation(reclamation);
        return toResponse(reclamation);
    }

    @Override
    @Transactional
    public void deleteReclamation(Long id) {
        Utilisateur currentUser = authenticatedUserService.getCurrentUser();

        Reclamation reclamation = reclamationRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Reclamation not found"));

        if (currentUser.getRole() == Role.SUPERADMIN) {
            reclamationRepository.delete(reclamation);
            return;
        }

        Long ownerId = reclamation.getUtilisateur() != null ? reclamation.getUtilisateur().getId() : null;
        if (ownerId == null || !ownerId.equals(currentUser.getId())) {
            throw new UnauthorizedException("You can only delete your own reclamations");
        }

        reclamationRepository.delete(reclamation);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReclamationResponse> getAccessibleReclamations() {
        try {
            Utilisateur currentUser = authenticatedUserService.getCurrentUser();
            log.info("[RECLAMATION] GET /api/reclamations - User: {} ({})", 
                currentUser.getEmail(), currentUser.getRole());

            if (currentUser.getRole() == Role.SUPERADMIN) {
                log.info("[RECLAMATION] SuperAdmin - chargement toutes réclamations avec JOIN FETCH");
                List<Reclamation> reclamations = reclamationRepository.findAllWithUtilisateur();
                log.info("[RECLAMATION] {} réclamations trouvées", reclamations.size());
                return reclamations.stream().map(this::toResponse).toList();
            }

            if (currentUser.getRole() == Role.MANAGER) {
                log.info("[RECLAMATION] Manager - chargement réclamations équipe avec JOIN FETCH");
                List<Utilisateur> managedUsers = chauffeurRepository.findByManagerId(currentUser.getId())
                    .stream().map(u -> (Utilisateur) u).toList();
                log.info("[RECLAMATION] Manager gère {} utilisateurs", managedUsers.size());
                
                List<Reclamation> reclamations = reclamationRepository.findByUtilisateursWithJoin(managedUsers);
                List<Reclamation> ownReclamations = reclamationRepository.findByUtilisateurWithJoin(currentUser);
                
                reclamations.addAll(ownReclamations);
                log.info("[RECLAMATION] {} réclamations trouvées pour manager", reclamations.size());
                return reclamations.stream().map(this::toResponse).toList();
            }

            if (currentUser.getRole() == Role.CHAUFFEUR) {
                log.info("[RECLAMATION] Chauffeur - chargement ses propres réclamations avec JOIN FETCH");
                List<Reclamation> reclamations = reclamationRepository.findByUtilisateurWithJoin(currentUser);
                log.info("[RECLAMATION] {} réclamations trouvées", reclamations.size());
                return reclamations.stream().map(this::toResponse).toList();
            }

            log.warn("[RECLAMATION] Rôle inconnu: {}", currentUser.getRole());
            return List.of();
        } catch (Exception ex) {
            log.error("[RECLAMATION] Erreur GET /api/reclamations", ex);
            throw ex;
        }
    }

    @Override
    @Transactional
    public ReclamationResponse resolveReclamation(Long id, ReclamationDecisionRequest request) {
        Utilisateur currentUser = authenticatedUserService.getCurrentUser();
        if (currentUser.getRole() != Role.SUPERADMIN) {
            throw new UnauthorizedException("Only SuperAdmin can resolve reclamations");
        }

        if (request == null || request.getCommentaire() == null || request.getCommentaire().isBlank()) {
            throw new BadRequestException("Commentaire is required");
        }

        Reclamation reclamation = reclamationRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Reclamation not found"));
        reclamation.setStatut(StatutReclamation.RESOLU);
        reclamation.setCommentaireResolution(request.getCommentaire());
        reclamationRepository.save(reclamation);

        String sujet = reclamation.getSujet() != null ? reclamation.getSujet() : "votre réclamation";
        String notification = "Votre réclamation concernant '" + sujet + "' a été résolue. Commentaire: " + request.getCommentaire();
        createNotificationForUser(reclamation.getUtilisateur(), notification);

        return toResponse(reclamation);
    }

    @Override
    @Transactional
    public ReclamationResponse rejectReclamation(Long id, ReclamationDecisionRequest request) {
        Utilisateur currentUser = authenticatedUserService.getCurrentUser();
        if (currentUser.getRole() != Role.SUPERADMIN) {
            throw new UnauthorizedException("Only SuperAdmin can reject reclamations");
        }

        if (request == null || request.getCommentaire() == null || request.getCommentaire().isBlank()) {
            throw new BadRequestException("Commentaire is required");
        }

        Reclamation reclamation = reclamationRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Reclamation not found"));
        reclamation.setStatut(StatutReclamation.REJETE);
        reclamation.setCommentaireResolution(request.getCommentaire());
        reclamationRepository.save(reclamation);

        String sujet = reclamation.getSujet() != null ? reclamation.getSujet() : "votre réclamation";
        String notification = "Votre réclamation concernant '" + sujet + "' a été rejetée. Motif: " + request.getCommentaire();
        createNotificationForUser(reclamation.getUtilisateur(), notification);

        return toResponse(reclamation);
    }

    private ReclamationResponse toResponse(Reclamation r) {
        Utilisateur u = r.getUtilisateur();
        return new ReclamationResponse(
            r.getId(),
            r.getSujet(),
            r.getDescription(),
            r.getPriorite(),
            r.getStatut(),
            r.getCommentaireResolution(),
            u != null ? u.getId() : null,
            u != null ? (u.getPrenom() + " " + u.getNom()).trim() : null,
            u != null ? u.getEmail() : null,
            r.getDateCreation()
        );
    }

    private void notifySuperAdminsOfNewReclamation(Reclamation reclamation) {
        List<Utilisateur> superAdmins = utilisateurRepository.findByRole(Role.SUPERADMIN);

        String userFullName = "-";
        if (reclamation.getUtilisateur() != null) {
            String firstName = reclamation.getUtilisateur().getPrenom() != null ? reclamation.getUtilisateur().getPrenom() : "";
            String lastName = reclamation.getUtilisateur().getNom() != null ? reclamation.getUtilisateur().getNom() : "";
            userFullName = (firstName + " " + lastName).trim();
            if (userFullName.isEmpty()) userFullName = reclamation.getUtilisateur().getEmail();
        }

        String sujet = reclamation.getSujet() != null ? reclamation.getSujet() : "-";
        String priorite = reclamation.getPriorite() != null ? reclamation.getPriorite().toString() : "-";

        String message = "Nouvelle réclamation de " + userFullName + " — Sujet: " + sujet + " — Priorité: " + priorite;

        if (superAdmins == null || superAdmins.isEmpty()) {
            return;
        }

        superAdmins.forEach(admin -> createNotification(admin, withReclamationToken(reclamation, message)));
        notificationRealtimeService.publishToUsers(superAdmins.stream().map(Utilisateur::getId).toList(), null);
    }

    private String withReclamationToken(Reclamation r, String message) {
        if (r == null || r.getId() == null) {
            return message;
        }
        return "[RECLAMATION_ID:" + r.getId() + "] " + message;
    }

    private void createNotification(Utilisateur recipient, String message) {
        if (recipient == null) return;

        com.logiway.entities.Notification notification = com.logiway.entities.Notification.builder()
            .type(TypeNotif.NOTIF_RECLAMATION)
            .message(message)
            .utilisateur(recipient)
            .build();
        notificationRepository.save(notification);
        notificationRealtimeService.publishToUsers(List.of(recipient.getId()), notification);
    }

    private void createNotificationForUser(Utilisateur user, String message) {
        if (user == null) return;
        createNotification(user, message);
    }

    @Override
    public ValidateReclamationResponse validateText(ValidateReclamationRequest request) {
        String sujet = request.getSujet() == null ? "" : request.getSujet().trim();
        String description = request.getDescription() == null ? "" : request.getDescription().trim();

        log.info("[RECLAMATION-VALIDATE] ═══ Début validation ═══");
        log.info("[RECLAMATION-VALIDATE] Validation sujet = \"{}\"", sujet.length() > 50 ? sujet.substring(0, 50) + "..." : sujet);
        log.info("[RECLAMATION-VALIDATE] Validation description = \"{}\"", description.length() > 50 ? description.substring(0, 50) + "..." : description);

        // Validation du sujet
        ValidateReclamationFieldResponse sujetResult = validateField(sujet, "SUJET");
        
        // Validation de la description
        ValidateReclamationFieldResponse descriptionResult = validateField(description, "DESCRIPTION");

        log.info("[RECLAMATION-VALIDATE] Résultat sujet = {}", sujetResult.isValide() ? "VALIDE" : sujetResult.getTypeErreur());
        log.info("[RECLAMATION-VALIDATE] Résultat description = {}", descriptionResult.isValide() ? "VALIDE" : descriptionResult.getTypeErreur());
        log.info("[RECLAMATION-VALIDATE] ═══ Fin validation ═══");

        return ValidateReclamationResponse.builder()
            .sujet(sujetResult)
            .description(descriptionResult)
            .build();
    }

    private ValidateReclamationFieldResponse validateField(String text, String fieldName) {
        if (text.isBlank()) {
            return ValidateReclamationFieldResponse.builder().valide(true).build();
        }

        try {
            log.info("[LOCAL-AI] Appel service local pour validation du champ {}", fieldName);
            
            String url = localAiServiceUrl + "/validate";
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            Map<String, Object> body = Map.of(
                "text", text,
                "field", fieldName.toLowerCase()
            );
            
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
            ResponseEntity<String> resp = restTemplate.postForEntity(url, entity, String.class);
            
            if (!resp.getStatusCode().is2xxSuccessful() || resp.getBody() == null) {
                log.error("[LOCAL-AI] Service indisponible - code={}", resp.getStatusCode());
                throw new BadRequestException("Service de validation IA temporairement indisponible. Veuillez réessayer dans quelques instants.");
            }

            JsonNode node = objectMapper.readTree(resp.getBody());
            boolean valide = node.get("valide").asBoolean();
            
            if (!valide) {
                String typeErreur = node.get("typeErreur").asText();
                String message = node.get("message").asText();
                
                JsonNode scores = node.get("scores");
                if (scores != null) {
                    double toxicite = scores.has("toxicite") && !scores.get("toxicite").isNull() 
                        ? scores.get("toxicite").asDouble() : 0.0;
                    double semantique = scores.has("semantique") && !scores.get("semantique").isNull() 
                        ? scores.get("semantique").asDouble() : 0.0;
                    
                    log.info("[LOCAL-AI] {} - Score toxicité = {} | Score sémantique = {} | Décision = BLOCK ({})",
                        fieldName, toxicite, semantique, typeErreur);
                }
                
                return ValidateReclamationFieldResponse.builder()
                    .valide(false)
                    .typeErreur(typeErreur)
                    .message(message)
                    .build();
            }
            
            JsonNode scores = node.get("scores");
            if (scores != null) {
                double toxicite = scores.get("toxicite").asDouble();
                double semantique = scores.get("semantique").asDouble();
                log.info("[LOCAL-AI] {} - Score toxicité = {} | Score sémantique = {} | Décision = PASS",
                    fieldName, toxicite, semantique);
            }
            
            return ValidateReclamationFieldResponse.builder().valide(true).build();
            
        } catch (BadRequestException ex) {
            throw ex;
        } catch (Exception ex) {
            log.error("[LOCAL-AI] Erreur appel service local: {}", ex.getMessage());
            throw new BadRequestException("Service de validation IA temporairement indisponible. Veuillez réessayer dans quelques instants.");
        }
    }

    private void validateSubmissionOrThrow(String subject, String description) {
        log.info("[RECLAMATION-SUBMIT] Validation finale avant soumission");
        
        // Valider le sujet
        ValidateReclamationFieldResponse sujetResult = validateField(subject, "SUJET");
        if (!sujetResult.isValide()) {
            log.warn("[RECLAMATION-SUBMIT] Sujet refusé: {}", sujetResult.getTypeErreur());
            throw new BadRequestException(sujetResult.getMessage());
        }
        
        // Valider la description
        ValidateReclamationFieldResponse descriptionResult = validateField(description, "DESCRIPTION");
        if (!descriptionResult.isValide()) {
            log.warn("[RECLAMATION-SUBMIT] Description refusée: {}", descriptionResult.getTypeErreur());
            throw new BadRequestException(descriptionResult.getMessage());
        }
        
        log.info("[RECLAMATION-SUBMIT] Validation réussie");
    }

    private Reclamation requireOwnedDraftReclamation(Long id, Utilisateur currentUser) {
        Reclamation reclamation = reclamationRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Reclamation not found"));

        if (currentUser == null || currentUser.getId() == null) {
            throw new UnauthorizedException("You are not allowed to modify reclamations");
        }

        Long ownerId = reclamation.getUtilisateur() != null ? reclamation.getUtilisateur().getId() : null;
        if (ownerId == null || !ownerId.equals(currentUser.getId())) {
            throw new UnauthorizedException("You can only modify your own reclamations");
        }

        if (reclamation.getStatut() != StatutReclamation.EN_COURS) {
            throw new BadRequestException("Only pending reclamations can be modified or deleted");
        }

        return reclamation;
    }

}