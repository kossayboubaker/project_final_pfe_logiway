package com.logiway.services.impl;

import com.logiway.dto.request.MessengerTextRequest;
import com.logiway.dto.request.MessengerMessageUpdateRequest;
import com.logiway.dto.response.*;
import com.logiway.entities.MessengerMessage;
import com.logiway.entities.Notification;
import com.logiway.entities.Utilisateur;
import com.logiway.entities.enums.MessengerMessageStatus;
import com.logiway.entities.enums.MessengerMessageType;
import com.logiway.entities.enums.TypeNotif;
import com.logiway.exceptions.BadRequestException;
import com.logiway.exceptions.ForbiddenException;
import com.logiway.exceptions.ResourceNotFoundException;
import com.logiway.repositories.MessengerMessageRepository;
import com.logiway.repositories.NotificationRepository;
import com.logiway.repositories.UtilisateurRepository;
import com.logiway.security.AuthenticatedUserService;
import com.logiway.services.MessengerRealtimeService;
import com.logiway.services.MessengerService;
import com.logiway.services.NotificationRealtimeService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

@Service
@RequiredArgsConstructor
@Transactional
public class MessengerServiceImpl implements MessengerService {

    private static final int DEFAULT_PAGE_SIZE = 30;
    private static final long MAX_IMAGE_SIZE = 5L * 1024L * 1024L;
    private static final long MAX_PDF_SIZE = 10L * 1024L * 1024L;
    private static final long MAX_VOCAL_SIZE = 20L * 1024L * 1024L;
    private static final DateTimeFormatter FILE_MONTH_FORMAT = DateTimeFormatter.ofPattern("yyyy/MM");
    private static final DateTimeFormatter TIME_FORMAT = DateTimeFormatter.ofPattern("HH:mm", Locale.FRANCE);

    private final AuthenticatedUserService authenticatedUserService;
    private final UtilisateurRepository utilisateurRepository;
    private final MessengerMessageRepository messengerMessageRepository;
    private final NotificationRepository notificationRepository;
    private final NotificationRealtimeService notificationRealtimeService;
    private final MessengerRealtimeService messengerRealtimeService;

    private final ConcurrentMap<Long, PresenceSnapshot> presenceCache = new ConcurrentHashMap<>();

    @Override
    public List<MessengerConversationResponse> getConversations(String search) {
        try {
            Utilisateur currentUser = authenticatedUserService.getCurrentUser();
            List<MessengerMessage> messages = messengerMessageRepository.findConversationSeed(currentUser.getId());
            Map<Long, List<MessengerMessage>> grouped = groupByCounterpart(currentUser.getId(), messages);
            Map<Long, Utilisateur> participantsById = loadParticipants(grouped.keySet());

            String normalizedSearch = normalize(search);

            return grouped.entrySet().stream()
                .map(entry -> {
                    try {
                        return toConversationResponse(currentUser.getId(), participantsById.get(entry.getKey()), entry.getValue());
                    } catch (RuntimeException ex) {
                        return null;
                    }
                })
                .filter(Objects::nonNull)
                .filter(conversation -> matchesSearch(conversation.prenom(), conversation.nom(), normalizedSearch))
                .sorted(Comparator
                    .comparing(MessengerConversationResponse::dateDernierMessage, Comparator.nullsLast(Comparator.naturalOrder()))
                    .reversed())
                .toList();
        } catch (Exception ex) {
            return List.of();
        }
    }

    @Override
    public MessengerMessagePageResponse getConversationMessages(Long destinataireId, int page, int size) {
        Utilisateur currentUser = authenticatedUserService.getCurrentUser();
        getRequiredUser(destinataireId);

        int safeSize = size > 0 ? Math.min(size, 100) : DEFAULT_PAGE_SIZE;
        int safePage = Math.max(page, 0);
        Pageable pageable = PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "dateEnvoi"));
        Page<MessengerMessage> result = messengerMessageRepository.findConversationMessages(currentUser.getId(), destinataireId, pageable);
        List<MessengerMessageResponse> messages = result.getContent().stream()
            .map(message -> toMessageResponse(message, currentUser.getId()))
            .toList();

        return new MessengerMessagePageResponse(messages, safePage, safeSize, result.getTotalElements(), result.hasNext());
    }

    @Override
    public MessengerMessageResponse sendTextMessage(MessengerTextRequest request) {
        if (request == null || request.destinataireId() == null) {
            throw new BadRequestException("Le destinataire est obligatoire");
        }

        String contenu = request.contenu() == null ? "" : request.contenu().trim();
        if (contenu.isBlank()) {
            throw new BadRequestException("Le message texte ne peut pas etre vide");
        }

        Utilisateur currentUser = authenticatedUserService.getCurrentUser();
        Utilisateur destinataire = getRequiredUser(request.destinataireId());

        MessengerMessage message = MessengerMessage.builder()
            .expediteurId(currentUser.getId())
            .destinataireId(destinataire.getId())
            .contenu(contenu)
            .type(MessengerMessageType.TEXTE)
            .statut(MessengerMessageStatus.NON_LU)
            .connecte(Boolean.TRUE)
            .derniereActivite(LocalDateTime.now())
            .build();

        MessengerMessage saved = messengerMessageRepository.save(message);
        touchPresence(currentUser.getId(), true, saved.getDerniereActivite());
        emitMessageSideEffects(currentUser, destinataire, saved);
        return toMessageResponse(saved, currentUser.getId());
    }

    @Override
    public MessengerMessageResponse sendFileMessage(Long destinataireId, MultipartFile file) {
        Utilisateur currentUser = authenticatedUserService.getCurrentUser();
        Utilisateur destinataire = getRequiredUser(destinataireId);

        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Le fichier est obligatoire");
        }

        String contentType = Optional.ofNullable(file.getContentType()).orElse("").toLowerCase(Locale.ROOT);
        MessengerMessageType type;
        long maxSize;
        if (contentType.contains("pdf")) {
            type = MessengerMessageType.PDF;
            maxSize = MAX_PDF_SIZE;
        } else if (contentType.startsWith("image/")) {
            type = MessengerMessageType.IMAGE;
            maxSize = MAX_IMAGE_SIZE;
        } else {
            throw new BadRequestException("Seuls les fichiers image JPG, PNG, GIF ou PDF sont autorises");
        }

        if (file.getSize() > maxSize) {
            throw new BadRequestException(type == MessengerMessageType.PDF
                ? "Le document PDF ne doit pas depasser 10 Mo"
                : "L'image ne doit pas depasser 5 Mo");
        }

        Path storedPath = storeMessengerFile(file);
        MessengerMessage saved = messengerMessageRepository.save(MessengerMessage.builder()
            .expediteurId(currentUser.getId())
            .destinataireId(destinataire.getId())
            .type(type)
            .contenu(null)
            .cheminFichier(storedPath.toString().replace('\\', '/'))
            .nomFichierOriginal(StringUtils.cleanPath(Optional.ofNullable(file.getOriginalFilename()).orElse("fichier")))
            .tailleFichier(file.getSize())
            .statut(MessengerMessageStatus.NON_LU)
            .connecte(Boolean.TRUE)
            .derniereActivite(LocalDateTime.now())
            .build());

        touchPresence(currentUser.getId(), true, saved.getDerniereActivite());
        emitMessageSideEffects(currentUser, destinataire, saved);
        return toMessageResponse(saved, currentUser.getId());
    }

    @Override
    public MessengerMessageResponse sendVocalMessage(Long destinataireId, MultipartFile file, Integer dureeVocale) {
        Utilisateur currentUser = authenticatedUserService.getCurrentUser();
        Utilisateur destinataire = getRequiredUser(destinataireId);

        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Le message vocal est obligatoire");
        }

        String contentType = Optional.ofNullable(file.getContentType()).orElse("").toLowerCase(Locale.ROOT);
        boolean validType = contentType.contains("webm") || contentType.contains("mpeg") || contentType.contains("mp3");
        if (!validType) {
            throw new BadRequestException("Le vocal doit etre au format WebM ou MP3");
        }

        if (file.getSize() > MAX_VOCAL_SIZE) {
            throw new BadRequestException("Le message vocal est trop volumineux");
        }

        if (dureeVocale != null && dureeVocale > 120) {
            throw new BadRequestException("La duree du message vocal ne doit pas depasser 2 minutes");
        }

        Path storedPath = storeMessengerFile(file);
        MessengerMessage saved = messengerMessageRepository.save(MessengerMessage.builder()
            .expediteurId(currentUser.getId())
            .destinataireId(destinataire.getId())
            .type(MessengerMessageType.VOCAL)
            .contenu(null)
            .cheminFichier(storedPath.toString().replace('\\', '/'))
            .nomFichierOriginal(StringUtils.cleanPath(Optional.ofNullable(file.getOriginalFilename()).orElse("vocal.webm")))
            .tailleFichier(file.getSize())
            .dureeVocale(dureeVocale)
            .statut(MessengerMessageStatus.NON_LU)
            .connecte(Boolean.TRUE)
            .derniereActivite(LocalDateTime.now())
            .build());

        touchPresence(currentUser.getId(), true, saved.getDerniereActivite());
        emitMessageSideEffects(currentUser, destinataire, saved);
        return toMessageResponse(saved, currentUser.getId());
    }

    @Override
    public Resource loadFile(String filename) {
        if (filename == null || filename.isBlank()) {
            throw new ResourceNotFoundException("Fichier introuvable");
        }

        MessengerMessage message = messengerMessageRepository.findFirstByCheminFichierEndingWith(filename)
            .orElseThrow(() -> new ResourceNotFoundException("Fichier introuvable"));

        Utilisateur currentUser = authenticatedUserService.getCurrentUser();
        if (!Objects.equals(currentUser.getId(), message.getExpediteurId())
            && !Objects.equals(currentUser.getId(), message.getDestinataireId())) {
            throw new BadRequestException("Vous n'etes pas autorise a acceder a ce fichier");
        }

        try {
            Path path = Paths.get(message.getCheminFichier());
            Resource resource = new UrlResource(path.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                throw new ResourceNotFoundException("Fichier introuvable");
            }
            return resource;
        } catch (MalformedURLException ex) {
            throw new BadRequestException("Chemin de fichier invalide");
        }
    }

    @Override
    public MessengerReadResponse markConversationAsRead(Long destinataireId) {
        Utilisateur currentUser = authenticatedUserService.getCurrentUser();
        Utilisateur destinataire = getRequiredUser(destinataireId);

        LocalDateTime now = LocalDateTime.now();
        List<MessengerMessageResponse> updatedMessages = messengerMessageRepository
            .findUnreadMessagesFromSender(currentUser.getId(), destinataire.getId(), MessengerMessageStatus.NON_LU)
            .stream()
            .map(message -> {
                message.setStatut(MessengerMessageStatus.LU);
                message.setDateLecture(now);
                return toMessageResponse(message, currentUser.getId());
            })
            .toList();
        int updated = messengerMessageRepository.markConversationAsRead(destinataire.getId(), currentUser.getId(), MessengerMessageStatus.LU, now);

        if (!updatedMessages.isEmpty()) {
            messengerRealtimeService.publishStatusToUsers(List.of(destinataire.getId()), updatedMessages);
        }

        messengerRealtimeService.publishConversationToUsers(List.of(destinataire.getId(), currentUser.getId()),
            new MessengerConversationResponse(destinataire.getId(), destinataire.getPrenom(), destinataire.getNom(), destinataire.getEmail(), destinataire.getImage(), destinataire.getRole(), resolvePresence(destinataire.getId(), destinataire.getId(), currentUser.getId(), destinataire).connecte(), now, null, null, now, 0L));
        return new MessengerReadResponse(destinataire.getId(), (long) updated, now);
    }

    @Override
    public List<MessengerUserResponse> getAuthorizedUsers(String search) {
        Utilisateur currentUser = authenticatedUserService.getCurrentUser();
        String normalizedSearch = normalize(search);

        // Return ALL users (online or offline), excluding self
        List<Utilisateur> candidates = utilisateurRepository.findAll().stream()
            .filter(candidate -> !Objects.equals(candidate.getId(), currentUser.getId()))
            .filter(candidate -> matchesSearch(candidate.getPrenom(), candidate.getNom(), normalizedSearch))
            .toList();

        Map<Long, MessengerConversationResponse> conversationMap = getConversations(null).stream()
            .collect(Collectors.toMap(MessengerConversationResponse::destinataireId, Function.identity(), (left, right) -> left, LinkedHashMap::new));

        return candidates.stream()
            .sorted((user1, user2) -> {
                String user1Name = (user1.getPrenom() == null ? "" : user1.getPrenom()) + " " + (user1.getNom() == null ? "" : user1.getNom());
                String user2Name = (user2.getPrenom() == null ? "" : user2.getPrenom()) + " " + (user2.getNom() == null ? "" : user2.getNom());
                return user1Name.trim().compareToIgnoreCase(user2Name.trim());
            })
            .map(candidate -> {
                MessengerConversationResponse conversation = conversationMap.get(candidate.getId());
                PresenceSnapshot presence;
                try {
                    presence = resolvePresence(candidate.getId(), candidate.getId(), currentUser.getId(), candidate);
                } catch (RuntimeException ex) {
                    presence = new PresenceSnapshot(false, null);
                }
                return new MessengerUserResponse(
                    candidate.getId(),
                    candidate.getPrenom(),
                    candidate.getNom(),
                    candidate.getEmail(),
                    candidate.getImage(),
                    candidate.getRole(),
                    presence.connecte(),
                    presence.derniereActivite(),
                    conversation != null ? conversation.dernierMessage() : null,
                    conversation != null ? conversation.dateDernierMessage() : null,
                    conversation != null ? conversation.messagesNonLus() : 0L
                );
            })
            .toList();
    }

    @Override
    public MessengerPresenceResponse heartbeat() {
        Utilisateur currentUser = authenticatedUserService.getCurrentUser();
        LocalDateTime now = LocalDateTime.now();
        touchPresence(currentUser.getId(), true, now);
        messengerMessageRepository.updatePresenceForSender(currentUser.getId(), true, now);
        messengerRealtimeService.publishPresenceToAll(new MessengerPresenceResponse(currentUser.getId(), true, now));
        return new MessengerPresenceResponse(currentUser.getId(), true, now);
    }

    @Override
    public void disconnectPresence() {
        Utilisateur currentUser = authenticatedUserService.getCurrentUser();
        LocalDateTime now = LocalDateTime.now();
        touchPresence(currentUser.getId(), false, now.minusSeconds(91));
        messengerMessageRepository.updatePresenceForSender(currentUser.getId(), false, now);
        messengerRealtimeService.publishPresenceToAll(new MessengerPresenceResponse(currentUser.getId(), false, now));
    }

    @Override
    public MessengerMessageResponse updateMessage(Long messageId, MessengerMessageUpdateRequest request) {
        if (messageId == null) {
            throw new BadRequestException("Message introuvable");
        }

        Utilisateur currentUser = authenticatedUserService.getCurrentUser();
        MessengerMessage message = messengerMessageRepository.findById(messageId)
            .orElseThrow(() -> new ResourceNotFoundException("Message introuvable"));

        // Allow any user to modify messages regardless of sender role/ownership
        ensureMessageEditable(message);

        String newContent = request.contenu().trim();
        if (newContent.isBlank()) {
            throw new BadRequestException("Le message texte ne peut pas etre vide");
        }

        if (message.getContenuOriginal() == null) {
            message.setContenuOriginal(message.getContenu());
        }

        message.setContenu(newContent);
        message.setModifie(Boolean.TRUE);
        message.setDateModification(LocalDateTime.now());

        MessengerMessage saved = messengerMessageRepository.save(message);
        MessengerMessageResponse response = toMessageResponse(saved, currentUser.getId());
        messengerRealtimeService.publishNamedEventToUsers(List.of(message.getDestinataireId()), "MESSAGE_MODIFIE", Map.of(
            "messageId", saved.getId(),
            "contenu", saved.getContenu(),
            "dateModification", saved.getDateModification()
        ));
        messengerRealtimeService.publishMessageToUsers(List.of(saved.getExpediteurId(), saved.getDestinataireId()), response);
        publishConversationSnapshot(currentUser.getId(), saved.getDestinataireId());
        return response;
    }

    @Override
    public void deleteMessage(Long messageId) {
        if (messageId == null) {
            throw new BadRequestException("Message introuvable");
        }

        Utilisateur currentUser = authenticatedUserService.getCurrentUser();
        MessengerMessage message = messengerMessageRepository.findById(messageId)
            .orElseThrow(() -> new ResourceNotFoundException("Message introuvable"));

        // Allow any user to delete messages regardless of sender role/ownership
        if (Boolean.TRUE.equals(message.getSupprime())) {
            throw new ForbiddenException("Ce message a deja ete supprime");
        }

        deleteMessageFileIfPresent(message);
        message.setSupprime(Boolean.TRUE);
        message.setDateSuppression(LocalDateTime.now());
        message.setContenu("Message supprimé");
        MessengerMessage saved = messengerMessageRepository.save(message);

        MessengerMessageResponse response = toMessageResponse(saved, currentUser.getId());
        messengerRealtimeService.publishNamedEventToUsers(List.of(message.getDestinataireId()), "MESSAGE_SUPPRIME", Map.of(
            "messageId", saved.getId(),
            "dateSuppression", saved.getDateSuppression()
        ));
        messengerRealtimeService.publishMessageToUsers(List.of(saved.getExpediteurId(), saved.getDestinataireId()), response);
        publishConversationSnapshot(currentUser.getId(), saved.getDestinataireId());
    }

    private void emitMessageSideEffects(Utilisateur currentUser, Utilisateur destinataire, MessengerMessage saved) {
        MessengerMessageResponse response = toMessageResponse(saved, currentUser.getId());
        messengerRealtimeService.publishMessageToUsers(List.of(currentUser.getId(), destinataire.getId()), response);
        messengerRealtimeService.publishConversationToUsers(List.of(currentUser.getId(), destinataire.getId()),
            toConversationResponse(currentUser.getId(), destinataire, List.of(saved)));

        messengerMessageRepository.updatePresenceForSender(currentUser.getId(), true, saved.getDerniereActivite());
        touchPresence(currentUser.getId(), true, saved.getDerniereActivite());

        if (!messengerRealtimeService.hasActiveConnection(destinataire.getId())) {
            Notification notification = Notification.builder()
                .type(TypeNotif.NOTIF_MESSAGE)
                .message(buildMessageNotification(currentUser, saved))
                .utilisateur(destinataire)
                .estLu(false)
                .build();
            notificationRepository.save(notification);
            notificationRealtimeService.publishToUsers(List.of(destinataire.getId()), notification);
        }
    }

    private String buildMessageNotification(Utilisateur sender, MessengerMessage message) {
        String fullName = buildFullName(sender);
        return switch (message.getType()) {
            case IMAGE -> "Nouveau message de " + fullName + " - a envoye une photo.";
            case PDF -> "Nouveau message de " + fullName + " - a envoye un document.";
            case VOCAL -> "Nouveau message de " + fullName + " - a envoye un message vocal.";
            case APPEL -> "Nouveau message de " + fullName + " - a partage un appel.";
            case TEXTE -> "Nouveau message de " + fullName + ".";
        };
    }

    private void publishConversationSnapshot(Long currentUserId, Long participantId) {
        Utilisateur participant = getRequiredUser(participantId);
        List<MessengerMessage> messages = messengerMessageRepository.findConversationSeed(currentUserId).stream()
            .filter(message -> Objects.equals(message.getExpediteurId(), participantId)
                || Objects.equals(message.getDestinataireId(), participantId))
            .toList();

        messengerRealtimeService.publishConversationToUsers(List.of(currentUserId, participantId),
            toConversationResponse(currentUserId, participant, messages));
    }

    private void touchPresence(Long userId, boolean connected, LocalDateTime lastActivity) {
        if (userId != null) {
            presenceCache.put(userId, new PresenceSnapshot(connected, lastActivity));
        }
    }

    private PresenceSnapshot resolvePresence(Long userId, Long fallbackUserId, Long currentUserId, Utilisateur user) {
        if (userId == null) {
            return new PresenceSnapshot(false, null);
        }
        PresenceSnapshot snapshot = presenceCache.get(userId);
        if (snapshot != null) {
            if (snapshot.connecte() && snapshot.derniereActivite() != null
                && snapshot.derniereActivite().isBefore(LocalDateTime.now().minusSeconds(90))) {
                PresenceSnapshot inactive = new PresenceSnapshot(false, snapshot.derniereActivite());
                presenceCache.put(userId, inactive);
                return inactive;
            }
            return snapshot;
        }

        MessengerMessage latest = messengerMessageRepository.findConversationSeed(userId).stream()
            .filter(message -> Objects.equals(message.getExpediteurId(), userId))
            .findFirst()
            .orElse(null);

        if (latest != null && latest.getDerniereActivite() != null) {
            boolean connecte = latest.getConnecte() != null && latest.getConnecte()
                && latest.getDerniereActivite().isAfter(LocalDateTime.now().minusSeconds(90));
            PresenceSnapshot resolved = new PresenceSnapshot(connecte, latest.getDerniereActivite());
            presenceCache.put(userId, resolved);
            return resolved;
        }

        return new PresenceSnapshot(false, null);
    }

    private MessengerMessageResponse toMessageResponse(MessengerMessage message, Long currentUserId) {
        Utilisateur expediteur = getRequiredUser(message.getExpediteurId());
        Utilisateur destinataire = getRequiredUser(message.getDestinataireId());
        String fichierUrl = message.getCheminFichier() == null ? null : "/api/messenger/fichiers/" + Paths.get(message.getCheminFichier()).getFileName();
        return new MessengerMessageResponse(
            message.getId(),
            expediteur.getId(),
            expediteur.getPrenom(),
            expediteur.getNom(),
            expediteur.getEmail(),
            expediteur.getImage(),
            expediteur.getRole(),
            destinataire.getId(),
            destinataire.getPrenom(),
            destinataire.getNom(),
            destinataire.getEmail(),
            destinataire.getImage(),
            destinataire.getRole(),
            message.getType(),
            message.getContenu(),
            message.getCheminFichier(),
            message.getNomFichierOriginal(),
            message.getTailleFichier(),
            message.getDureeVocale(),
            message.getStatut(),
            message.getDateEnvoi(),
            message.getDateLecture(),
            message.getModifie(),
            message.getDateModification(),
            message.getContenuOriginal(),
            message.getSupprime(),
            message.getDateSuppression(),
            message.getConnecte(),
            message.getDerniereActivite(),
            fichierUrl,
            message.getDateEnvoi() != null ? message.getDateEnvoi().format(TIME_FORMAT) : ""
        );
    }

    private MessengerConversationResponse toConversationResponse(Long currentUserId, Utilisateur participant, List<MessengerMessage> messages) {
        if (participant == null || messages == null || messages.isEmpty()) {
            return null;
        }

        MessengerMessage latest = messages.stream()
            .max(Comparator.comparing(MessengerMessage::getDateEnvoi, Comparator.nullsLast(Comparator.naturalOrder())))
            .orElse(messages.get(0));
        MessengerMessage visibleLatest = messages.stream()
            .filter(message -> !Boolean.TRUE.equals(message.getSupprime()))
            .max(Comparator.comparing(MessengerMessage::getDateEnvoi, Comparator.nullsLast(Comparator.naturalOrder())))
            .orElse(latest);

        long unreadCount = messages.stream()
            .filter(message -> Objects.equals(message.getDestinataireId(), currentUserId))
            .filter(message -> !Boolean.TRUE.equals(message.getSupprime()))
            .filter(message -> message.getStatut() == MessengerMessageStatus.NON_LU)
            .count();

        PresenceSnapshot presence = resolvePresence(participant.getId(), participant.getId(), currentUserId, participant);

        return new MessengerConversationResponse(
            participant.getId(),
            participant.getPrenom(),
            participant.getNom(),
            participant.getEmail(),
            participant.getImage(),
            participant.getRole(),
            presence.connecte(),
            presence.derniereActivite(),
            visibleLatest.getType(),
            resolvePreview(visibleLatest),
            visibleLatest.getDateEnvoi(),
            unreadCount
        );
    }

    private String resolvePreview(MessengerMessage message) {
        if (message == null) {
            return null;
        }

        if (Boolean.TRUE.equals(message.getSupprime())) {
            return "Message supprimé";
        }

        if (message.getType() == MessengerMessageType.TEXTE) {
            return message.getContenu();
        }

        return switch (message.getType()) {
            case IMAGE -> "Photo envoyee";
            case PDF -> "Document PDF envoye";
            case VOCAL -> "Message vocal envoye";
            case APPEL -> message.getContenu();
            case TEXTE -> message.getContenu();
        };
    }

    private Map<Long, List<MessengerMessage>> groupByCounterpart(Long currentUserId, List<MessengerMessage> messages) {
        Map<Long, List<MessengerMessage>> grouped = new LinkedHashMap<>();
        for (MessengerMessage message : messages) {
            Long counterpartId = Objects.equals(message.getExpediteurId(), currentUserId)
                ? message.getDestinataireId()
                : message.getExpediteurId();
            if (counterpartId != null) {
                grouped.computeIfAbsent(counterpartId, key -> new ArrayList<>()).add(message);
            }
        }
        return grouped;
    }

    private Map<Long, Utilisateur> loadParticipants(Set<Long> participantIds) {
        if (participantIds == null || participantIds.isEmpty()) {
            return Map.of();
        }

        Set<Long> safeIds = participantIds.stream().filter(Objects::nonNull).collect(Collectors.toSet());
        if (safeIds.isEmpty()) {
            return Map.of();
        }

        return utilisateurRepository.findAllById(safeIds).stream()
            .collect(Collectors.toMap(Utilisateur::getId, Function.identity(), (existing, replacement) -> existing));
    }

    private void ensureMessageEditable(MessengerMessage message) {
        if (Boolean.TRUE.equals(message.getSupprime())) {
            throw new ForbiddenException("Ce message a deja ete supprime");
        }
        if (message.getType() != MessengerMessageType.TEXTE) {
            throw new ForbiddenException("Seuls les messages texte peuvent etre modifies");
        }
        // No time-based restriction: allow modification regardless of send time
    }

    private void deleteMessageFileIfPresent(MessengerMessage message) {
        if (message.getCheminFichier() == null || message.getCheminFichier().isBlank()) {
            return;
        }

        try {
            Files.deleteIfExists(Paths.get(message.getCheminFichier()));
        } catch (IOException ex) {
            throw new BadRequestException("Impossible de supprimer le fichier associe");
        }
    }

    private Utilisateur getRequiredUser(Long userId) {
        if (userId == null) {
            throw new BadRequestException("Utilisateur introuvable");
        }
        return utilisateurRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));
    }

    private Path storeMessengerFile(MultipartFile file) {
        String monthFolder = FILE_MONTH_FORMAT.format(LocalDateTime.now());
        String extension = getExtension(file.getOriginalFilename());
        String safeName = UUID.randomUUID().toString().replace("-", "") + extension;
        Path baseDir = Paths.get("uploads", "messenger", monthFolder);
        Path targetPath = baseDir.resolve(safeName);

        try {
            Files.createDirectories(baseDir);
            Files.copy(file.getInputStream(), targetPath);
            return targetPath;
        } catch (IOException ex) {
            throw new BadRequestException("Impossible de stocker le fichier envoye");
        }
    }

    private String getExtension(String originalFilename) {
        if (originalFilename == null || !originalFilename.contains(".")) {
            return "";
        }
        return originalFilename.substring(originalFilename.lastIndexOf('.')).toLowerCase(Locale.ROOT);
    }

    private String buildFullName(Utilisateur user) {
        String fullName = ((user.getPrenom() != null ? user.getPrenom() : "") + " " + (user.getNom() != null ? user.getNom() : "")).trim();
        return fullName.isEmpty() ? (user.getEmail() != null ? user.getEmail() : "#" + user.getId()) : fullName;
    }

    private boolean matchesSearch(String prenom, String nom, String search) {
        if (search == null || search.isBlank()) {
            return true;
        }

        String normalizedPrenom = normalize(prenom);
        String normalizedNom = normalize(nom);
        return (normalizedPrenom != null && normalizedPrenom.contains(search))
            || (normalizedNom != null && normalizedNom.contains(search))
            || ((normalizedPrenom + " " + normalizedNom).trim().contains(search));
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }

        return value.trim().toLowerCase(Locale.ROOT);
    }







    private record PresenceSnapshot(boolean connecte, LocalDateTime derniereActivite) {
    }
}