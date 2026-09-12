package com.logiway.services;

import com.logiway.dto.request.MessengerMessageUpdateRequest;
import com.logiway.dto.request.MessengerTextRequest;
import com.logiway.dto.response.MessengerConversationResponse;
import com.logiway.dto.response.MessengerMessagePageResponse;
import com.logiway.dto.response.MessengerMessageResponse;
import com.logiway.dto.response.MessengerPresenceResponse;
import com.logiway.dto.response.MessengerReadResponse;
import com.logiway.dto.response.MessengerUserResponse;
import com.logiway.entities.MessengerMessage;
import com.logiway.entities.Notification;
import com.logiway.entities.Utilisateur;
import com.logiway.entities.enums.MessengerMessageStatus;
import com.logiway.entities.enums.MessengerMessageType;
import com.logiway.entities.enums.Role;
import com.logiway.exceptions.BadRequestException;
import com.logiway.exceptions.ForbiddenException;
import com.logiway.exceptions.ResourceNotFoundException;
import com.logiway.repositories.MessengerMessageRepository;
import com.logiway.repositories.NotificationRepository;
import com.logiway.repositories.UtilisateurRepository;
import com.logiway.security.AuthenticatedUserService;
import com.logiway.services.impl.MessengerServiceImpl;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Service Messenger — Tests Unitaires")
class MessengerServiceImplTest {

    @Mock private AuthenticatedUserService authenticatedUserService;
    @Mock private UtilisateurRepository utilisateurRepository;
    @Mock private MessengerMessageRepository messengerMessageRepository;
    @Mock private NotificationRepository notificationRepository;
    @Mock private NotificationRealtimeService notificationRealtimeService;
    @Mock private MessengerRealtimeService messengerRealtimeService;

    @InjectMocks
    private MessengerServiceImpl messengerService;

    private Utilisateur currentUser;
    private Utilisateur destinataire;
    private MessengerMessage message;
    private MessengerMessage messageIncoming;

    @BeforeEach
    void setUp() {
        currentUser = user(1L, "Alice", "Admin", Role.SUPERADMIN);
        destinataire = user(2L, "Bob", "Martin", Role.MANAGER);

        message = message(1L, 1L, 2L, MessengerMessageType.TEXTE, MessengerMessageStatus.LU,
            LocalDateTime.now().minusHours(2));
        message.setContenu("Salut");
        message.setConnecte(true);
        message.setDerniereActivite(LocalDateTime.now().minusMinutes(5));
        message.setSupprime(false);

        messageIncoming = message(2L, 2L, 1L, MessengerMessageType.IMAGE, MessengerMessageStatus.NON_LU,
            LocalDateTime.now().minusMinutes(10));
        messageIncoming.setConnecte(true);
        messageIncoming.setDerniereActivite(LocalDateTime.now().minusSeconds(10));
        messageIncoming.setSupprime(false);
    }

    private Utilisateur user(long id, String prenom, String nom, Role role) {
        Utilisateur u = new Utilisateur();
        u.setId(id);
        u.setPrenom(prenom);
        u.setNom(nom);
        u.setEmail(prenom.toLowerCase() + "@test.com");
        u.setRole(role);
        return u;
    }

    private MessengerMessage message(long id, Long expediteur, Long destinataire,
                                     MessengerMessageType type, MessengerMessageStatus statut, LocalDateTime date) {
        MessengerMessage m = new MessengerMessage();
        m.setId(id);
        m.setExpediteurId(expediteur);
        m.setDestinataireId(destinataire);
        m.setType(type);
        m.setStatut(statut);
        m.setDateEnvoi(date);
        return m;
    }

    private void cleanupStoredFile(String storedPath) {
        if (storedPath == null || storedPath.isBlank()) {
            return;
        }
        try {
            Path file = Paths.get(storedPath);
            Files.deleteIfExists(file);
            Path parent = file.getParent();
            Path grandParent = parent != null ? parent.getParent() : null;
            for (Path dir : new Path[]{parent, grandParent}) {
                if (dir != null && Files.isDirectory(dir) && Files.list(dir).findAny().isEmpty()) {
                    Files.deleteIfExists(dir);
                }
            }
        } catch (Exception ignored) {
        }
    }

    private Object reflectCall(Object target, String name, Class<?>[] paramTypes, Object... args) {
        try {
            Method method = target.getClass().getDeclaredMethod(name, paramTypes);
            method.setAccessible(true);
            return method.invoke(target, args);
        } catch (InvocationTargetException ex) {
            throw new RuntimeException(ex.getCause());
        } catch (ReflectiveOperationException ex) {
            throw new RuntimeException(ex);
        }
    }

    private Object reflectGet(Object target, String accessorName) {
        return reflectCall(target, accessorName, new Class<?>[0]);
    }

    @Test
    @DisplayName("getConversations() → Retourne les conversations avec messages non lus et presence")
    void getConversations_returnsConversations() {
        when(authenticatedUserService.getCurrentUser()).thenReturn(currentUser);
        when(messengerMessageRepository.findConversationSeed(anyLong()))
            .thenReturn(List.of(message, messageIncoming));
        when(utilisateurRepository.findAllById(anyCollection())).thenReturn(List.of(destinataire));

        List<MessengerConversationResponse> result = messengerService.getConversations(null);

        assertThat(result).hasSize(1);
        MessengerConversationResponse conversation = result.get(0);
        assertThat(conversation.destinataireId()).isEqualTo(2L);
        assertThat(conversation.connecte()).isTrue();
        assertThat(conversation.dernierType()).isEqualTo(MessengerMessageType.IMAGE);
        assertThat(conversation.dernierMessage()).isEqualTo("Photo envoyee");
        assertThat(conversation.messagesNonLus()).isEqualTo(1L);
    }

    @Test
    @DisplayName("getConversations() → Filtre par recherche sur le nom")
    void getConversations_filtersBySearch() {
        when(authenticatedUserService.getCurrentUser()).thenReturn(currentUser);
        when(messengerMessageRepository.findConversationSeed(anyLong()))
            .thenReturn(List.of(message, messageIncoming));
        when(utilisateurRepository.findAllById(anyCollection())).thenReturn(List.of(destinataire));

        List<MessengerConversationResponse> result = messengerService.getConversations("bob");

        assertThat(result).hasSize(1);
        assertThat(messengerService.getConversations("zzz")).isEmpty();
    }

    @Test
    @DisplayName("getConversations() → Pas de messages retourne liste vide")
    void getConversations_whenNoMessages_returnsEmpty() {
        when(authenticatedUserService.getCurrentUser()).thenReturn(currentUser);
        when(messengerMessageRepository.findConversationSeed(1L)).thenReturn(List.of());

        List<MessengerConversationResponse> result = messengerService.getConversations(null);

        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("getConversations() → Exception capturee retourne liste vide")
    void getConversations_whenException_returnsEmptyList() {
        when(authenticatedUserService.getCurrentUser()).thenThrow(new RuntimeException("boom"));

        List<MessengerConversationResponse> result = messengerService.getConversations(null);

        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("getConversations() → Participant introuvable, conversation ignoree")
    void getConversations_whenParticipantMissing_skipsConversation() {
        when(authenticatedUserService.getCurrentUser()).thenReturn(currentUser);
        when(messengerMessageRepository.findConversationSeed(1L))
            .thenReturn(List.of(message, messageIncoming));
        when(utilisateurRepository.findAllById(anyCollection())).thenReturn(List.of());

        List<MessengerConversationResponse> result = messengerService.getConversations(null);

        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("getConversations() → Erreur pendant la construction, conversation ignoree")
    void getConversations_whenMappingFails_skipsEntry() {
        when(authenticatedUserService.getCurrentUser()).thenReturn(currentUser);
        when(messengerMessageRepository.findConversationSeed(1L))
            .thenReturn(List.of(message, messageIncoming));
        when(messengerMessageRepository.findConversationSeed(2L)).thenThrow(new RuntimeException("boom"));
        when(utilisateurRepository.findAllById(anyCollection())).thenReturn(List.of(destinataire));

        List<MessengerConversationResponse> result = messengerService.getConversations(null);

        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("getConversations() → Message APPEL affiche son contenu en apercu")
    void getConversations_appelType_showsContentInPreview() {
        MessengerMessage appel = message(3L, 1L, 2L, MessengerMessageType.APPEL, MessengerMessageStatus.LU,
            LocalDateTime.now().minusMinutes(1));
        appel.setContenu("Debut d'appel");
        appel.setSupprime(false);
        when(authenticatedUserService.getCurrentUser()).thenReturn(currentUser);
        when(messengerMessageRepository.findConversationSeed(anyLong())).thenReturn(List.of(appel));
        when(utilisateurRepository.findAllById(anyCollection())).thenReturn(List.of(destinataire));

        List<MessengerConversationResponse> result = messengerService.getConversations(null);

        assertThat(result.get(0).dernierMessage())
            .isEqualTo("Debut d'appel");
    }

    @Test
    @DisplayName("getConversations() → Message supprime affiche l'apercu de suppression")
    void getConversations_deletedMessage_showsDeletedPreview() {
        message.setSupprime(true);
        when(authenticatedUserService.getCurrentUser()).thenReturn(currentUser);
        when(messengerMessageRepository.findConversationSeed(anyLong())).thenReturn(List.of(message));
        when(utilisateurRepository.findAllById(anyCollection())).thenReturn(List.of(destinataire));

        List<MessengerConversationResponse> result = messengerService.getConversations(null);

        assertThat(result.get(0).dernierMessage())
            .isEqualTo("Message supprimé");
    }

    @Test
    @DisplayName("getConversationMessages() → Retourne la page de messages")
    void getConversationMessages_returnsPage() {
        when(authenticatedUserService.getCurrentUser()).thenReturn(currentUser);
        when(utilisateurRepository.findById(1L)).thenReturn(Optional.of(currentUser));
        when(utilisateurRepository.findById(2L)).thenReturn(Optional.of(destinataire));
        when(messengerMessageRepository.findConversationMessages(eq(1L), eq(2L), any(Pageable.class)))
            .thenAnswer(inv -> new PageImpl<>(List.of(message), inv.getArgument(2), 1));

        MessengerMessagePageResponse result = messengerService.getConversationMessages(2L, 0, 30);

        assertThat(result.messages()).hasSize(1);
        assertThat(result.page()).isZero();
        assertThat(result.size()).isEqualTo(30);
        assertThat(result.totalElements()).isEqualTo(1);
        assertThat(result.hasMore()).isFalse();
    }

    @Test
    @DisplayName("getConversationMessages() → Taille et page securisees")
    void getConversationMessages_clampsSizeAndPage() {
        when(authenticatedUserService.getCurrentUser()).thenReturn(currentUser);
        when(utilisateurRepository.findById(1L)).thenReturn(Optional.of(currentUser));
        when(utilisateurRepository.findById(2L)).thenReturn(Optional.of(destinataire));
        when(messengerMessageRepository.findConversationMessages(eq(1L), eq(2L), any(Pageable.class)))
            .thenAnswer(inv -> new PageImpl<>(List.of(message), inv.getArgument(2), 1));

        messengerService.getConversationMessages(2L, -3, 500);

        ArgumentCaptor<Pageable> captor = ArgumentCaptor.forClass(Pageable.class);
        verify(messengerMessageRepository).findConversationMessages(eq(1L), eq(2L), captor.capture());
        assertThat(captor.getValue().getPageSize()).isEqualTo(100);
        assertThat(captor.getValue().getOffset()).isZero();
    }

    @Test
    @DisplayName("getConversationMessages() → Taille zero utilise la taille par defaut")
    void getConversationMessages_whenSizeZero_usesDefaultSize() {
        when(authenticatedUserService.getCurrentUser()).thenReturn(currentUser);
        when(utilisateurRepository.findById(1L)).thenReturn(Optional.of(currentUser));
        when(utilisateurRepository.findById(2L)).thenReturn(Optional.of(destinataire));
        when(messengerMessageRepository.findConversationMessages(eq(1L), eq(2L), any(Pageable.class)))
            .thenAnswer(inv -> new PageImpl<>(List.of(message), inv.getArgument(2), 1));

        messengerService.getConversationMessages(2L, 0, 0);

        ArgumentCaptor<Pageable> captor = ArgumentCaptor.forClass(Pageable.class);
        verify(messengerMessageRepository).findConversationMessages(eq(1L), eq(2L), captor.capture());
        assertThat(captor.getValue().getPageSize()).isEqualTo(30);
    }

    @Test
    @DisplayName("getConversationMessages() → Destinataire inexistant lance exception")
    void getConversationMessages_whenDestinataireNotFound_throws() {
        when(authenticatedUserService.getCurrentUser()).thenReturn(currentUser);
        when(utilisateurRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> messengerService.getConversationMessages(999L, 0, 30))
            .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("getConversationMessages() → Destinataire null lance exception")
    void getConversationMessages_whenDestinataireIdNull_throws() {
        when(authenticatedUserService.getCurrentUser()).thenReturn(currentUser);

        assertThatThrownBy(() -> messengerService.getConversationMessages(null, 0, 30))
            .isInstanceOf(BadRequestException.class);
    }

    @Test
    @DisplayName("sendTextMessage() → Envoi reussi avec notification si hors ligne")
    void sendTextMessage_happyPath_savesAndPublishes() {
        when(authenticatedUserService.getCurrentUser()).thenReturn(currentUser);
        when(utilisateurRepository.findById(1L)).thenReturn(Optional.of(currentUser));
        when(utilisateurRepository.findById(2L)).thenReturn(Optional.of(destinataire));
        when(messengerMessageRepository.findConversationSeed(anyLong())).thenReturn(List.of());
        when(messengerMessageRepository.save(any(MessengerMessage.class))).thenAnswer(inv -> {
            MessengerMessage saved = inv.getArgument(0);
            saved.setId(10L);
            return saved;
        });
        when(messengerRealtimeService.hasActiveConnection(2L)).thenReturn(false);

        MessengerMessageResponse result = messengerService.sendTextMessage(new MessengerTextRequest(2L, "Bonjour"));

        assertThat(result).isNotNull();
        assertThat(result.type()).isEqualTo(MessengerMessageType.TEXTE);
        assertThat(result.contenu()).isEqualTo("Bonjour");
        assertThat(result.statut()).isEqualTo(MessengerMessageStatus.NON_LU);
        verify(messengerMessageRepository, times(1)).save(any(MessengerMessage.class));
        verify(messengerRealtimeService, times(1)).publishMessageToUsers(anyList(), any());
        verify(notificationRepository, times(1)).save(any(Notification.class));
        verify(notificationRealtimeService, times(1)).publishToUsers(eq(List.of(2L)), any(Notification.class));
    }

    @Test
    @DisplayName("sendTextMessage() → Destinataire connecte, pas de notification")
    void sendTextMessage_whenDestinataireConnected_noNotification() {
        when(authenticatedUserService.getCurrentUser()).thenReturn(currentUser);
        when(utilisateurRepository.findById(1L)).thenReturn(Optional.of(currentUser));
        when(utilisateurRepository.findById(2L)).thenReturn(Optional.of(destinataire));
        when(messengerMessageRepository.findConversationSeed(anyLong())).thenReturn(List.of());
        when(messengerMessageRepository.save(any(MessengerMessage.class))).thenAnswer(inv -> inv.getArgument(0));
        when(messengerRealtimeService.hasActiveConnection(2L)).thenReturn(true);

        messengerService.sendTextMessage(new MessengerTextRequest(2L, "Salut"));

        verify(notificationRepository, never()).save(any(Notification.class));
    }

    @Test
    @DisplayName("sendTextMessage() → Requete null lance exception")
    void sendTextMessage_whenRequestNull_throws() {
        assertThatThrownBy(() -> messengerService.sendTextMessage(null))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("destinataire");
    }

    @Test
    @DisplayName("sendTextMessage() → Destinataire null dans la requete lance exception")
    void sendTextMessage_whenDestinataireNull_throws() {
        assertThatThrownBy(() -> messengerService.sendTextMessage(new MessengerTextRequest(null, "Salut")))
            .isInstanceOf(BadRequestException.class);
    }

    @Test
    @DisplayName("sendTextMessage() → Contenu vide lance exception")
    void sendTextMessage_whenContentBlank_throws() {
        assertThatThrownBy(() -> messengerService.sendTextMessage(new MessengerTextRequest(2L, "   ")))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("vide");
    }

    @Test
    @DisplayName("sendTextMessage() → Destinataire inexistant lance exception")
    void sendTextMessage_whenDestinataireNotFound_throws() {
        when(authenticatedUserService.getCurrentUser()).thenReturn(currentUser);
        when(utilisateurRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> messengerService.sendTextMessage(new MessengerTextRequest(999L, "Salut")))
            .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("sendFileMessage() → Fichier PDF enregistre et publie")
    void sendFileMessage_pdf_succeeds() throws Exception {
        MultipartFile file = mock(MultipartFile.class);
        when(file.isEmpty()).thenReturn(false);
        when(file.getContentType()).thenReturn("application/pdf");
        when(file.getSize()).thenReturn(1024L);
        when(file.getOriginalFilename()).thenReturn("rapport.pdf");
        when(file.getInputStream()).thenReturn(new ByteArrayInputStream(new byte[]{1, 2, 3}));
        when(authenticatedUserService.getCurrentUser()).thenReturn(currentUser);
        when(utilisateurRepository.findById(1L)).thenReturn(Optional.of(currentUser));
        when(utilisateurRepository.findById(2L)).thenReturn(Optional.of(destinataire));
        when(messengerMessageRepository.findConversationSeed(anyLong())).thenReturn(List.of());
        when(messengerMessageRepository.save(any(MessengerMessage.class))).thenAnswer(inv -> {
            MessengerMessage saved = inv.getArgument(0);
            saved.setId(20L);
            return saved;
        });
        when(messengerRealtimeService.hasActiveConnection(2L)).thenReturn(true);

        MessengerMessageResponse result = messengerService.sendFileMessage(2L, file);

        assertThat(result.type()).isEqualTo(MessengerMessageType.PDF);
        assertThat(result.fichierUrl()).startsWith("/api/messenger/fichiers/");
        assertThat(result.tailleFichier()).isEqualTo(1024L);
        cleanupStoredFile(result.cheminFichier());
    }

    @Test
    @DisplayName("sendFileMessage() → Image enregistree")
    void sendFileMessage_image_succeeds() throws Exception {
        MultipartFile file = mock(MultipartFile.class);
        when(file.isEmpty()).thenReturn(false);
        when(file.getContentType()).thenReturn("image/png");
        when(file.getSize()).thenReturn(2048L);
        when(file.getOriginalFilename()).thenReturn("photo.png");
        when(file.getInputStream()).thenReturn(new ByteArrayInputStream(new byte[]{1, 2, 3}));
        when(authenticatedUserService.getCurrentUser()).thenReturn(currentUser);
        when(utilisateurRepository.findById(1L)).thenReturn(Optional.of(currentUser));
        when(utilisateurRepository.findById(2L)).thenReturn(Optional.of(destinataire));
        when(messengerMessageRepository.findConversationSeed(anyLong())).thenReturn(List.of());
        when(messengerMessageRepository.save(any(MessengerMessage.class))).thenAnswer(inv -> inv.getArgument(0));
        when(messengerRealtimeService.hasActiveConnection(2L)).thenReturn(true);

        MessengerMessageResponse result = messengerService.sendFileMessage(2L, file);

        assertThat(result.type()).isEqualTo(MessengerMessageType.IMAGE);
        cleanupStoredFile(result.cheminFichier());
    }

    @Test
    @DisplayName("sendFileMessage() → Fichier null lance exception")
    void sendFileMessage_whenFileNull_throws() {
        when(authenticatedUserService.getCurrentUser()).thenReturn(currentUser);
        when(utilisateurRepository.findById(2L)).thenReturn(Optional.of(destinataire));

        assertThatThrownBy(() -> messengerService.sendFileMessage(2L, null))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("obligatoire");
    }

    @Test
    @DisplayName("sendFileMessage() → Fichier vide lance exception")
    void sendFileMessage_whenFileEmpty_throws() {
        MultipartFile file = mock(MultipartFile.class);
        when(file.isEmpty()).thenReturn(true);
        when(authenticatedUserService.getCurrentUser()).thenReturn(currentUser);
        when(utilisateurRepository.findById(2L)).thenReturn(Optional.of(destinataire));

        assertThatThrownBy(() -> messengerService.sendFileMessage(2L, file))
            .isInstanceOf(BadRequestException.class);
    }

    @Test
    @DisplayName("sendFileMessage() → Type de contenu non autorise lance exception")
    void sendFileMessage_whenInvalidContentType_throws() {
        MultipartFile file = mock(MultipartFile.class);
        when(file.isEmpty()).thenReturn(false);
        when(file.getContentType()).thenReturn("application/octet-stream");
        when(authenticatedUserService.getCurrentUser()).thenReturn(currentUser);
        when(utilisateurRepository.findById(2L)).thenReturn(Optional.of(destinataire));

        assertThatThrownBy(() -> messengerService.sendFileMessage(2L, file))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("Seuls les fichiers image");
    }

    @Test
    @DisplayName("sendFileMessage() → PDF trop volumineux lance exception")
    void sendFileMessage_whenPdfTooLarge_throws() {
        MultipartFile file = mock(MultipartFile.class);
        when(file.isEmpty()).thenReturn(false);
        when(file.getContentType()).thenReturn("application/pdf");
        when(file.getSize()).thenReturn(11L * 1024L * 1024L);
        when(authenticatedUserService.getCurrentUser()).thenReturn(currentUser);
        when(utilisateurRepository.findById(2L)).thenReturn(Optional.of(destinataire));

        assertThatThrownBy(() -> messengerService.sendFileMessage(2L, file))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("10 Mo");
    }

    @Test
    @DisplayName("sendFileMessage() → Image trop volumineuse lance exception")
    void sendFileMessage_whenImageTooLarge_throws() {
        MultipartFile file = mock(MultipartFile.class);
        when(file.isEmpty()).thenReturn(false);
        when(file.getContentType()).thenReturn("image/jpeg");
        when(file.getSize()).thenReturn(6L * 1024L * 1024L);
        when(authenticatedUserService.getCurrentUser()).thenReturn(currentUser);
        when(utilisateurRepository.findById(2L)).thenReturn(Optional.of(destinataire));

        assertThatThrownBy(() -> messengerService.sendFileMessage(2L, file))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("5 Mo");
    }

    @Test
    @DisplayName("sendFileMessage() → Destinataire inexistant lance exception")
    void sendFileMessage_whenDestinataireNotFound_throws() {
        when(authenticatedUserService.getCurrentUser()).thenReturn(currentUser);
        when(utilisateurRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> messengerService.sendFileMessage(999L, mock(MultipartFile.class)))
            .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("sendVocalMessage() → Vocal WebM enregistre")
    void sendVocalMessage_webm_succeeds() throws Exception {
        MultipartFile file = mock(MultipartFile.class);
        when(file.isEmpty()).thenReturn(false);
        when(file.getContentType()).thenReturn("audio/webm");
        when(file.getSize()).thenReturn(500L);
        when(file.getOriginalFilename()).thenReturn("note.webm");
        when(file.getInputStream()).thenReturn(new ByteArrayInputStream(new byte[]{1, 2, 3}));
        when(authenticatedUserService.getCurrentUser()).thenReturn(currentUser);
        when(utilisateurRepository.findById(1L)).thenReturn(Optional.of(currentUser));
        when(utilisateurRepository.findById(2L)).thenReturn(Optional.of(destinataire));
        when(messengerMessageRepository.findConversationSeed(anyLong())).thenReturn(List.of());
        when(messengerMessageRepository.save(any(MessengerMessage.class))).thenAnswer(inv -> inv.getArgument(0));
        when(messengerRealtimeService.hasActiveConnection(2L)).thenReturn(true);

        MessengerMessageResponse result = messengerService.sendVocalMessage(2L, file, null);

        assertThat(result.type()).isEqualTo(MessengerMessageType.VOCAL);
        assertThat(result.dureeVocale()).isNull();
        cleanupStoredFile(result.cheminFichier());
    }

    @Test
    @DisplayName("sendVocalMessage() → Vocal avec duree enregistre")
    void sendVocalMessage_withDuration_succeeds() throws Exception {
        MultipartFile file = mock(MultipartFile.class);
        when(file.isEmpty()).thenReturn(false);
        when(file.getContentType()).thenReturn("audio/mpeg");
        when(file.getSize()).thenReturn(800L);
        when(file.getOriginalFilename()).thenReturn("note.mp3");
        when(file.getInputStream()).thenReturn(new ByteArrayInputStream(new byte[]{1, 2, 3}));
        when(authenticatedUserService.getCurrentUser()).thenReturn(currentUser);
        when(utilisateurRepository.findById(1L)).thenReturn(Optional.of(currentUser));
        when(utilisateurRepository.findById(2L)).thenReturn(Optional.of(destinataire));
        when(messengerMessageRepository.findConversationSeed(anyLong())).thenReturn(List.of());
        when(messengerMessageRepository.save(any(MessengerMessage.class))).thenAnswer(inv -> inv.getArgument(0));
        when(messengerRealtimeService.hasActiveConnection(2L)).thenReturn(true);

        MessengerMessageResponse result = messengerService.sendVocalMessage(2L, file, 45);

        assertThat(result.dureeVocale()).isEqualTo(45);
        cleanupStoredFile(result.cheminFichier());
    }

    @Test
    @DisplayName("sendVocalMessage() → Fichier null lance exception")
    void sendVocalMessage_whenFileNull_throws() {
        when(authenticatedUserService.getCurrentUser()).thenReturn(currentUser);
        when(utilisateurRepository.findById(2L)).thenReturn(Optional.of(destinataire));

        assertThatThrownBy(() -> messengerService.sendVocalMessage(2L, null, null))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("vocal");
    }

    @Test
    @DisplayName("sendVocalMessage() → Format non autorise lance exception")
    void sendVocalMessage_whenInvalidContentType_throws() {
        MultipartFile file = mock(MultipartFile.class);
        when(file.isEmpty()).thenReturn(false);
        when(file.getContentType()).thenReturn("audio/ogg");
        when(authenticatedUserService.getCurrentUser()).thenReturn(currentUser);
        when(utilisateurRepository.findById(2L)).thenReturn(Optional.of(destinataire));

        assertThatThrownBy(() -> messengerService.sendVocalMessage(2L, file, null))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("WebM ou MP3");
    }

    @Test
    @DisplayName("sendVocalMessage() → Vocal trop volumineux lance exception")
    void sendVocalMessage_whenTooLarge_throws() {
        MultipartFile file = mock(MultipartFile.class);
        when(file.isEmpty()).thenReturn(false);
        when(file.getContentType()).thenReturn("audio/webm");
        when(file.getSize()).thenReturn(21L * 1024L * 1024L);
        when(authenticatedUserService.getCurrentUser()).thenReturn(currentUser);
        when(utilisateurRepository.findById(2L)).thenReturn(Optional.of(destinataire));

        assertThatThrownBy(() -> messengerService.sendVocalMessage(2L, file, null))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("trop volumineux");
    }

    @Test
    @DisplayName("sendVocalMessage() → Duree superieure a 2 minutes lance exception")
    void sendVocalMessage_whenDurationTooLong_throws() {
        MultipartFile file = mock(MultipartFile.class);
        when(file.isEmpty()).thenReturn(false);
        when(file.getContentType()).thenReturn("audio/webm");
        when(file.getSize()).thenReturn(500L);
        when(authenticatedUserService.getCurrentUser()).thenReturn(currentUser);
        when(utilisateurRepository.findById(2L)).thenReturn(Optional.of(destinataire));

        assertThatThrownBy(() -> messengerService.sendVocalMessage(2L, file, 121))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("2 minutes");
    }

    @Test
    @DisplayName("loadFile() → Retourne la ressource si autorise")
    void loadFile_happyPath_returnsResource() throws Exception {
        Path temp = Files.createTempFile("msg", ".png");
        message.setCheminFichier(temp.toString());
        when(authenticatedUserService.getCurrentUser()).thenReturn(currentUser);
        when(messengerMessageRepository.findFirstByCheminFichierEndingWith(anyString()))
            .thenReturn(Optional.of(message));

        Resource resource = messengerService.loadFile(temp.getFileName().toString());

        assertThat(resource.exists()).isTrue();
        Files.deleteIfExists(temp);
    }

    @Test
    @DisplayName("loadFile() → Nom de fichier vide lance exception")
    void loadFile_whenBlankFilename_throws() {
        assertThatThrownBy(() -> messengerService.loadFile(null))
            .isInstanceOf(ResourceNotFoundException.class);
        assertThatThrownBy(() -> messengerService.loadFile("  "))
            .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("loadFile() → Message introuvable lance exception")
    void loadFile_whenMessageNotFound_throws() {
        when(messengerMessageRepository.findFirstByCheminFichierEndingWith("x.png"))
            .thenReturn(Optional.empty());

        assertThatThrownBy(() -> messengerService.loadFile("x.png"))
            .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("loadFile() → Utilisateur non autorise lance exception")
    void loadFile_whenNotParticipant_throws() {
        message.setExpediteurId(3L);
        message.setDestinataireId(4L);
        when(authenticatedUserService.getCurrentUser()).thenReturn(currentUser);
        when(messengerMessageRepository.findFirstByCheminFichierEndingWith(anyString()))
            .thenReturn(Optional.of(message));

        assertThatThrownBy(() -> messengerService.loadFile("x.png"))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("autorise");
    }

    @Test
    @DisplayName("markConversationAsRead() → Marque les messages comme lus et publie")
    void markConversationAsRead_updatesMessages() {
        when(authenticatedUserService.getCurrentUser()).thenReturn(currentUser);
        when(utilisateurRepository.findById(1L)).thenReturn(Optional.of(currentUser));
        when(utilisateurRepository.findById(2L)).thenReturn(Optional.of(destinataire));
        when(messengerMessageRepository.findUnreadMessagesFromSender(1L, 2L, MessengerMessageStatus.NON_LU))
            .thenReturn(List.of(message));
        when(messengerMessageRepository.markConversationAsRead(eq(2L), eq(1L),
            eq(MessengerMessageStatus.LU), any(LocalDateTime.class))).thenReturn(1);
        when(messengerMessageRepository.findConversationSeed(anyLong())).thenReturn(List.of());

        MessengerReadResponse result = messengerService.markConversationAsRead(2L);

        assertThat(result.destinataireId()).isEqualTo(2L);
        assertThat(result.messagesMarquesLus()).isEqualTo(1L);
        assertThat(message.getStatut()).isEqualTo(MessengerMessageStatus.LU);
        verify(messengerRealtimeService, times(1)).publishStatusToUsers(anyList(), any());
        verify(messengerRealtimeService, times(1)).publishConversationToUsers(anyList(), any());
    }

    @Test
    @DisplayName("markConversationAsRead() → Aucun message non lu ne publie pas de statut")
    void markConversationAsRead_whenNoUnread_returnsZero() {
        when(authenticatedUserService.getCurrentUser()).thenReturn(currentUser);
        when(utilisateurRepository.findById(2L)).thenReturn(Optional.of(destinataire));
        when(messengerMessageRepository.findUnreadMessagesFromSender(1L, 2L, MessengerMessageStatus.NON_LU))
            .thenReturn(List.of());
        when(messengerMessageRepository.markConversationAsRead(eq(2L), eq(1L),
            eq(MessengerMessageStatus.LU), any(LocalDateTime.class))).thenReturn(0);
        when(messengerMessageRepository.findConversationSeed(anyLong())).thenReturn(List.of());

        MessengerReadResponse result = messengerService.markConversationAsRead(2L);

        assertThat(result.messagesMarquesLus()).isZero();
        verify(messengerRealtimeService, never()).publishStatusToUsers(anyList(), any());
    }

    @Test
    @DisplayName("markConversationAsRead() → Destinataire inexistant lance exception")
    void markConversationAsRead_whenDestinataireNotFound_throws() {
        when(authenticatedUserService.getCurrentUser()).thenReturn(currentUser);
        when(utilisateurRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> messengerService.markConversationAsRead(999L))
            .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("getAuthorizedUsers() → Retourne tous les utilisateurs tries par nom")
    void getAuthorizedUsers_returnsAllUsersSorted() {
        Utilisateur carla = user(3L, "Carla", "Dupont", Role.CHAUFFEUR);
        when(authenticatedUserService.getCurrentUser()).thenReturn(currentUser);
        when(utilisateurRepository.findAll()).thenReturn(List.of(currentUser, destinataire, carla));
        when(messengerMessageRepository.findConversationSeed(anyLong()))
            .thenReturn(List.of(message, messageIncoming));
        when(utilisateurRepository.findAllById(anyCollection())).thenReturn(List.of(destinataire));

        List<MessengerUserResponse> result = messengerService.getAuthorizedUsers(null);

        assertThat(result).hasSize(2);
        assertThat(result.get(0).prenom()).isEqualTo("Bob");
        assertThat(result.get(0).dernierMessage()).isEqualTo("Photo envoyee");
        assertThat(result.get(0).messagesNonLus()).isEqualTo(1L);
        assertThat(result.get(1).prenom()).isEqualTo("Carla");
        assertThat(result.get(1).dernierMessage()).isNull();
        assertThat(result.get(1).messagesNonLus()).isZero();
    }

    @Test
    @DisplayName("getAuthorizedUsers() → Filtre par recherche")
    void getAuthorizedUsers_filtersBySearch() {
        when(authenticatedUserService.getCurrentUser()).thenReturn(currentUser);
        when(utilisateurRepository.findAll()).thenReturn(List.of(currentUser, destinataire));
        when(messengerMessageRepository.findConversationSeed(anyLong()))
            .thenReturn(List.of(message, messageIncoming));
        when(utilisateurRepository.findAllById(anyCollection())).thenReturn(List.of(destinataire));

        List<MessengerUserResponse> result = messengerService.getAuthorizedUsers("martin");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).nom()).isEqualTo("Martin");
    }

    @Test
    @DisplayName("getAuthorizedUsers() → Echec de presence utilise le fallback")
    void getAuthorizedUsers_whenPresenceFails_usesFallback() {
        Utilisateur ghost = user(999L, "Ghost", "User", Role.CHAUFFEUR);
        when(authenticatedUserService.getCurrentUser()).thenReturn(currentUser);
        when(utilisateurRepository.findAll()).thenReturn(List.of(currentUser, destinataire, ghost));
        when(messengerMessageRepository.findConversationSeed(1L))
            .thenReturn(List.of(message, messageIncoming));
        when(messengerMessageRepository.findConversationSeed(2L))
            .thenReturn(List.of(message, messageIncoming));
        when(messengerMessageRepository.findConversationSeed(999L))
            .thenThrow(new RuntimeException("boom"));
        when(utilisateurRepository.findAllById(anyCollection())).thenReturn(List.of(destinataire));

        List<MessengerUserResponse> result = messengerService.getAuthorizedUsers(null);

        assertThat(result).hasSize(2);
        assertThat(result).extracting(MessengerUserResponse::id).contains(999L);
        assertThat(result.stream().filter(u -> u.id().equals(999L)).findFirst().orElseThrow().connecte())
            .isFalse();
    }

    @Test
    @DisplayName("heartbeat() → Met a jour la presence et publie a tous")
    void heartbeat_updatesPresenceAndPublishes() {
        when(authenticatedUserService.getCurrentUser()).thenReturn(currentUser);

        MessengerPresenceResponse result = messengerService.heartbeat();

        assertThat(result.utilisateurId()).isEqualTo(1L);
        assertThat(result.connecte()).isTrue();
        verify(messengerMessageRepository, times(1)).updatePresenceForSender(eq(1L), eq(true),
            any(LocalDateTime.class));
        verify(messengerRealtimeService, times(1)).publishPresenceToAll(any(MessengerPresenceResponse.class));
    }

    @Test
    @DisplayName("disconnectPresence() → Passe hors ligne et publie")
    void disconnectPresence_updatesOfflineAndPublishes() {
        when(authenticatedUserService.getCurrentUser()).thenReturn(currentUser);

        messengerService.disconnectPresence();

        verify(messengerMessageRepository, times(1)).updatePresenceForSender(eq(1L), eq(false),
            any(LocalDateTime.class));
        verify(messengerRealtimeService, times(1)).publishPresenceToAll(any(MessengerPresenceResponse.class));
    }

    @Test
    @DisplayName("updateMessage() → Modifie le contenu et publie les evenements")
    void updateMessage_updatesContentAndPublishes() {
        message.setContenu("ancien");
        when(authenticatedUserService.getCurrentUser()).thenReturn(currentUser);
        when(messengerMessageRepository.findById(1L)).thenReturn(Optional.of(message));
        when(utilisateurRepository.findById(1L)).thenReturn(Optional.of(currentUser));
        when(utilisateurRepository.findById(2L)).thenReturn(Optional.of(destinataire));
        when(messengerMessageRepository.save(any(MessengerMessage.class))).thenAnswer(inv -> inv.getArgument(0));
        when(messengerMessageRepository.findConversationSeed(1L)).thenReturn(List.of(message));

        MessengerMessageResponse result = messengerService.updateMessage(1L,
            new MessengerMessageUpdateRequest("nouveau"));

        assertThat(result.contenu()).isEqualTo("nouveau");
        assertThat(message.getContenuOriginal()).isEqualTo("ancien");
        assertThat(message.getModifie()).isTrue();
        verify(messengerRealtimeService, times(1)).publishNamedEventToUsers(eq(List.of(2L)),
            eq("MESSAGE_MODIFIE"), anyMap());
        verify(messengerRealtimeService, times(1)).publishMessageToUsers(anyList(), any());
    }

    @Test
    @DisplayName("updateMessage() → Id null lance exception")
    void updateMessage_whenIdNull_throws() {
        assertThatThrownBy(() -> messengerService.updateMessage(null,
            new MessengerMessageUpdateRequest("x")))
            .isInstanceOf(BadRequestException.class);
    }

    @Test
    @DisplayName("updateMessage() → Message introuvable lance exception")
    void updateMessage_whenNotFound_throws() {
        when(authenticatedUserService.getCurrentUser()).thenReturn(currentUser);
        when(messengerMessageRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> messengerService.updateMessage(999L,
            new MessengerMessageUpdateRequest("x")))
            .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("updateMessage() → Message supprime lance exception")
    void updateMessage_whenDeleted_throws() {
        message.setSupprime(true);
        when(authenticatedUserService.getCurrentUser()).thenReturn(currentUser);
        when(messengerMessageRepository.findById(1L)).thenReturn(Optional.of(message));

        assertThatThrownBy(() -> messengerService.updateMessage(1L,
            new MessengerMessageUpdateRequest("x")))
            .isInstanceOf(ForbiddenException.class);
    }

    @Test
    @DisplayName("updateMessage() → Message non texte lance exception")
    void updateMessage_whenNotText_throws() {
        message.setType(MessengerMessageType.IMAGE);
        when(authenticatedUserService.getCurrentUser()).thenReturn(currentUser);
        when(messengerMessageRepository.findById(1L)).thenReturn(Optional.of(message));

        assertThatThrownBy(() -> messengerService.updateMessage(1L,
            new MessengerMessageUpdateRequest("x")))
            .isInstanceOf(ForbiddenException.class)
            .hasMessageContaining("texte");
    }

    @Test
    @DisplayName("updateMessage() → Contenu vide lance exception")
    void updateMessage_whenContentBlank_throws() {
        when(authenticatedUserService.getCurrentUser()).thenReturn(currentUser);
        when(messengerMessageRepository.findById(1L)).thenReturn(Optional.of(message));

        assertThatThrownBy(() -> messengerService.updateMessage(1L,
            new MessengerMessageUpdateRequest("   ")))
            .isInstanceOf(BadRequestException.class);
    }

    @Test
    @DisplayName("deleteMessage() → Marque le message comme supprime")
    void deleteMessage_marksDeleted() {
        message.setCheminFichier(null);
        when(authenticatedUserService.getCurrentUser()).thenReturn(currentUser);
        when(messengerMessageRepository.findById(1L)).thenReturn(Optional.of(message));
        when(utilisateurRepository.findById(1L)).thenReturn(Optional.of(currentUser));
        when(utilisateurRepository.findById(2L)).thenReturn(Optional.of(destinataire));
        when(messengerMessageRepository.save(any(MessengerMessage.class))).thenAnswer(inv -> inv.getArgument(0));
        when(messengerMessageRepository.findConversationSeed(1L)).thenReturn(List.of(message));

        messengerService.deleteMessage(1L);

        assertThat(message.getSupprime()).isTrue();
        assertThat(message.getContenu()).isEqualTo("Message supprimé");
        verify(messengerRealtimeService, times(1)).publishNamedEventToUsers(eq(List.of(2L)),
            eq("MESSAGE_SUPPRIME"), anyMap());
        verify(messengerRealtimeService, times(1)).publishMessageToUsers(anyList(), any());
    }

    @Test
    @DisplayName("deleteMessage() → Supprime le fichier associe")
    void deleteMessage_deletesFile() throws Exception {
        Path temp = Files.createTempFile("msgdel", ".png");
        message.setCheminFichier(temp.toString());
        when(authenticatedUserService.getCurrentUser()).thenReturn(currentUser);
        when(messengerMessageRepository.findById(1L)).thenReturn(Optional.of(message));
        when(utilisateurRepository.findById(1L)).thenReturn(Optional.of(currentUser));
        when(utilisateurRepository.findById(2L)).thenReturn(Optional.of(destinataire));
        when(messengerMessageRepository.save(any(MessengerMessage.class))).thenAnswer(inv -> inv.getArgument(0));
        when(messengerMessageRepository.findConversationSeed(1L)).thenReturn(List.of(message));

        messengerService.deleteMessage(1L);

        assertThat(Files.exists(temp)).isFalse();
    }

    @Test
    @DisplayName("deleteMessage() → Id null lance exception")
    void deleteMessage_whenIdNull_throws() {
        assertThatThrownBy(() -> messengerService.deleteMessage(null))
            .isInstanceOf(BadRequestException.class);
    }

    @Test
    @DisplayName("deleteMessage() → Message introuvable lance exception")
    void deleteMessage_whenNotFound_throws() {
        when(authenticatedUserService.getCurrentUser()).thenReturn(currentUser);
        when(messengerMessageRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> messengerService.deleteMessage(999L))
            .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("deleteMessage() → Message deja supprime lance exception")
    void deleteMessage_whenAlreadyDeleted_throws() {
        message.setSupprime(true);
        when(authenticatedUserService.getCurrentUser()).thenReturn(currentUser);
        when(messengerMessageRepository.findById(1L)).thenReturn(Optional.of(message));

        assertThatThrownBy(() -> messengerService.deleteMessage(1L))
            .isInstanceOf(ForbiddenException.class)
            .hasMessageContaining("deja ete supprime");
    }

    @Test
    @DisplayName("deleteMessage() → Echec suppression du fichier lance exception")
    void deleteMessage_whenFileDeletionFails_throws() throws Exception {
        Path dir = Files.createTempDirectory("msgdir");
        Files.createFile(dir.resolve("inner.bin"));
        message.setCheminFichier(dir.toString());
        when(authenticatedUserService.getCurrentUser()).thenReturn(currentUser);
        when(messengerMessageRepository.findById(1L)).thenReturn(Optional.of(message));

        try {
            assertThatThrownBy(() -> messengerService.deleteMessage(1L))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Impossible de supprimer");
        } finally {
            Files.deleteIfExists(dir.resolve("inner.bin"));
            Files.deleteIfExists(dir);
        }
    }

    @Test
    @DisplayName("sendFileMessage() → Echec stockage fichier lance exception")
    void sendFileMessage_whenStoreFails_throws() throws Exception {
        MultipartFile file = mock(MultipartFile.class);
        when(file.isEmpty()).thenReturn(false);
        when(file.getContentType()).thenReturn("application/pdf");
        when(file.getSize()).thenReturn(1024L);
        when(file.getOriginalFilename()).thenReturn("rapport.pdf");
        when(file.getInputStream()).thenThrow(new IOException("disk full"));
        when(authenticatedUserService.getCurrentUser()).thenReturn(currentUser);
        when(utilisateurRepository.findById(2L)).thenReturn(Optional.of(destinataire));

        assertThatThrownBy(() -> messengerService.sendFileMessage(2L, file))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("Impossible de stocker");
    }

    @Test
    @DisplayName("sendFileMessage() → Nom de fichier original absent utilise le defaut")
    void sendFileMessage_whenOriginalFilenameNull_usesDefault() throws Exception {
        MultipartFile file = mock(MultipartFile.class);
        when(file.isEmpty()).thenReturn(false);
        when(file.getContentType()).thenReturn("image/png");
        when(file.getSize()).thenReturn(100L);
        when(file.getOriginalFilename()).thenReturn(null);
        when(file.getInputStream()).thenReturn(new ByteArrayInputStream(new byte[]{1, 2, 3}));
        when(authenticatedUserService.getCurrentUser()).thenReturn(currentUser);
        when(utilisateurRepository.findById(1L)).thenReturn(Optional.of(currentUser));
        when(utilisateurRepository.findById(2L)).thenReturn(Optional.of(destinataire));
        when(messengerMessageRepository.findConversationSeed(anyLong())).thenReturn(List.of());
        when(messengerMessageRepository.save(any(MessengerMessage.class))).thenAnswer(inv -> inv.getArgument(0));
        when(messengerRealtimeService.hasActiveConnection(2L)).thenReturn(true);

        MessengerMessageResponse result = messengerService.sendFileMessage(2L, file);

        assertThat(result.nomFichierOriginal()).isEqualTo("fichier");
        cleanupStoredFile(result.cheminFichier());
    }

    @Test
    @DisplayName("sendTextMessage() → Expediteur sans nom utilise son email dans la notification")
    void sendTextMessage_whenSenderHasNoName_usesEmailInNotification() {
        Utilisateur anonyme = new Utilisateur();
        anonyme.setId(1L);
        anonyme.setPrenom("");
        anonyme.setNom("");
        anonyme.setEmail("anonyme@test.com");
        anonyme.setRole(Role.SUPERADMIN);
        when(authenticatedUserService.getCurrentUser()).thenReturn(anonyme);
        when(utilisateurRepository.findById(1L)).thenReturn(Optional.of(anonyme));
        when(utilisateurRepository.findById(2L)).thenReturn(Optional.of(destinataire));
        when(messengerMessageRepository.findConversationSeed(anyLong())).thenReturn(List.of());
        when(messengerMessageRepository.save(any(MessengerMessage.class))).thenAnswer(inv -> inv.getArgument(0));
        when(messengerRealtimeService.hasActiveConnection(2L)).thenReturn(false);

        messengerService.sendTextMessage(new MessengerTextRequest(2L, "Salut"));

        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(captor.capture());
        assertThat(captor.getValue().getMessage()).contains("anonyme@test.com");
    }

    @Test
    @DisplayName("loadFile() → Fichier absent du disque lance exception")
    void loadFile_whenFileMissingOnDisk_throws() {
        String missing = Paths.get(System.getProperty("java.io.tmpdir"),
            "fichier-inexistant-" + System.nanoTime() + ".png").toString();
        message.setCheminFichier(missing);
        when(authenticatedUserService.getCurrentUser()).thenReturn(currentUser);
        when(messengerMessageRepository.findFirstByCheminFichierEndingWith(anyString()))
            .thenReturn(Optional.of(message));

        assertThatThrownBy(() -> messengerService.loadFile("fichier-inexistant.png"))
            .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("sendFileMessage() → Notification photo quand destinataire hors ligne")
    void sendFileMessage_image_createsPhotoNotification() throws Exception {
        MultipartFile file = mock(MultipartFile.class);
        when(file.isEmpty()).thenReturn(false);
        when(file.getContentType()).thenReturn("image/png");
        when(file.getSize()).thenReturn(2048L);
        when(file.getOriginalFilename()).thenReturn("photo.png");
        when(file.getInputStream()).thenReturn(new ByteArrayInputStream(new byte[]{1, 2, 3}));
        when(authenticatedUserService.getCurrentUser()).thenReturn(currentUser);
        when(utilisateurRepository.findById(1L)).thenReturn(Optional.of(currentUser));
        when(utilisateurRepository.findById(2L)).thenReturn(Optional.of(destinataire));
        when(messengerMessageRepository.findConversationSeed(anyLong())).thenReturn(List.of());
        when(messengerMessageRepository.save(any(MessengerMessage.class))).thenAnswer(inv -> inv.getArgument(0));
        when(messengerRealtimeService.hasActiveConnection(2L)).thenReturn(false);

        MessengerMessageResponse result = messengerService.sendFileMessage(2L, file);

        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(captor.capture());
        assertThat(captor.getValue().getMessage()).contains("envoye une photo");
        cleanupStoredFile(result.cheminFichier());
    }

    @Test
    @DisplayName("sendFileMessage() → Notification document quand destinataire hors ligne")
    void sendFileMessage_pdf_createsDocumentNotification() throws Exception {
        MultipartFile file = mock(MultipartFile.class);
        when(file.isEmpty()).thenReturn(false);
        when(file.getContentType()).thenReturn("application/pdf");
        when(file.getSize()).thenReturn(1024L);
        when(file.getOriginalFilename()).thenReturn("rapport.pdf");
        when(file.getInputStream()).thenReturn(new ByteArrayInputStream(new byte[]{1, 2, 3}));
        when(authenticatedUserService.getCurrentUser()).thenReturn(currentUser);
        when(utilisateurRepository.findById(1L)).thenReturn(Optional.of(currentUser));
        when(utilisateurRepository.findById(2L)).thenReturn(Optional.of(destinataire));
        when(messengerMessageRepository.findConversationSeed(anyLong())).thenReturn(List.of());
        when(messengerMessageRepository.save(any(MessengerMessage.class))).thenAnswer(inv -> inv.getArgument(0));
        when(messengerRealtimeService.hasActiveConnection(2L)).thenReturn(false);

        MessengerMessageResponse result = messengerService.sendFileMessage(2L, file);

        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(captor.capture());
        assertThat(captor.getValue().getMessage()).contains("envoye un document");
        cleanupStoredFile(result.cheminFichier());
    }

    @Test
    @DisplayName("sendVocalMessage() → Notification vocal quand destinataire hors ligne")
    void sendVocalMessage_createsVocalNotification() throws Exception {
        MultipartFile file = mock(MultipartFile.class);
        when(file.isEmpty()).thenReturn(false);
        when(file.getContentType()).thenReturn("audio/webm");
        when(file.getSize()).thenReturn(500L);
        when(file.getOriginalFilename()).thenReturn("note.webm");
        when(file.getInputStream()).thenReturn(new ByteArrayInputStream(new byte[]{1, 2, 3}));
        when(authenticatedUserService.getCurrentUser()).thenReturn(currentUser);
        when(utilisateurRepository.findById(1L)).thenReturn(Optional.of(currentUser));
        when(utilisateurRepository.findById(2L)).thenReturn(Optional.of(destinataire));
        when(messengerMessageRepository.findConversationSeed(anyLong())).thenReturn(List.of());
        when(messengerMessageRepository.save(any(MessengerMessage.class))).thenAnswer(inv -> inv.getArgument(0));
        when(messengerRealtimeService.hasActiveConnection(2L)).thenReturn(false);

        MessengerMessageResponse result = messengerService.sendVocalMessage(2L, file, null);

        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(captor.capture());
        assertThat(captor.getValue().getMessage()).contains("envoye un message vocal");
        cleanupStoredFile(result.cheminFichier());
    }

    @Test
    @DisplayName("buildMessageNotification() → Message APPEL cree la notification d'appel")
    void buildMessageNotification_appel_buildsAppelText() {
        MessengerMessage appel = message(3L, 1L, 2L, MessengerMessageType.APPEL, MessengerMessageStatus.LU,
            LocalDateTime.now().minusMinutes(1));

        Object notification = reflectCall(messengerService, "buildMessageNotification",
            new Class<?>[]{Utilisateur.class, MessengerMessage.class}, currentUser, appel);

        assertThat(notification).asString().contains("a partage un appel");
    }

    @Test
    @DisplayName("resolvePresence() → Utilisateur null renvoie hors ligne")
    void resolvePresence_whenUserIdNull_returnsOffline() {
        Object snapshot = reflectCall(messengerService, "resolvePresence",
            new Class<?>[]{Long.class, Long.class, Long.class, Utilisateur.class},
            null, null, 1L, currentUser);

        assertThat(reflectGet(snapshot, "connecte")).isEqualTo(false);
        assertThat(reflectGet(snapshot, "derniereActivite")).isNull();
    }

    @Test
    @DisplayName("resolvePresence() → Presence connectee obsolette consideree hors ligne")
    void resolvePresence_whenStaleConnectedSnapshot_marksInactive() {
        LocalDateTime stale = LocalDateTime.now().minusMinutes(10);
        reflectCall(messengerService, "touchPresence",
            new Class<?>[]{Long.class, boolean.class, LocalDateTime.class},
            2L, true, stale);

        Object snapshot = reflectCall(messengerService, "resolvePresence",
            new Class<?>[]{Long.class, Long.class, Long.class, Utilisateur.class},
            2L, 2L, 1L, destinataire);

        assertThat(reflectGet(snapshot, "connecte")).isEqualTo(false);
        assertThat(reflectGet(snapshot, "derniereActivite")).isEqualTo(stale);

        Object cached = reflectCall(messengerService, "resolvePresence",
            new Class<?>[]{Long.class, Long.class, Long.class, Utilisateur.class},
            2L, 2L, 1L, destinataire);
        assertThat(reflectGet(cached, "connecte")).isEqualTo(false);
    }

    @Test
    @DisplayName("resolvePreview() → Message null renvoie null")
    void resolvePreview_whenNull_returnsNull() {
        Object preview = reflectCall(messengerService, "resolvePreview",
            new Class<?>[]{MessengerMessage.class}, new Object[]{null});

        assertThat(preview).isNull();
    }

    @Test
    @DisplayName("resolvePreview() → Case TEXTE du switch est execute")
    void resolvePreview_switchTexteCase_executes() {
        MessengerMessage mocked = mock(MessengerMessage.class);
        when(mocked.getSupprime()).thenReturn(false);
        when(mocked.getType()).thenReturn(MessengerMessageType.IMAGE, MessengerMessageType.TEXTE);

        Object preview = reflectCall(messengerService, "resolvePreview",
            new Class<?>[]{MessengerMessage.class}, mocked);

        assertThat(preview).isNull();
    }

    @Test
    @DisplayName("loadParticipants() → Ensemble ne contenant que null renvoie une map vide")
    void loadParticipants_whenOnlyNullIds_returnsEmptyMap() {
        Set<Long> ids = new HashSet<>();
        ids.add(null);

        Object result = reflectCall(messengerService, "loadParticipants",
            new Class<?>[]{Set.class}, ids);

        assertThat((Map<?, ?>) result).isEmpty();
    }

    // ========== Branch coverage tests ==========

    @Test
    @DisplayName("sendTextMessage() → Contenu null est traite comme chaine vide")
    void sendTextMessage_whenContenuNull_throwsBlankMessage() {
        MessengerTextRequest req = new MessengerTextRequest(2L, null);

        assertThatThrownBy(() -> messengerService.sendTextMessage(req))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("vide");
    }

    @Test
    @DisplayName("sendVocalMessage() → Fichier vide (non null) lance exception")
    void sendVocalMessage_whenFileEmpty_throws() {
        MultipartFile file = mock(MultipartFile.class);
        when(file.isEmpty()).thenReturn(true);
        when(authenticatedUserService.getCurrentUser()).thenReturn(currentUser);
        when(utilisateurRepository.findById(2L)).thenReturn(Optional.of(destinataire));

        assertThatThrownBy(() -> messengerService.sendVocalMessage(2L, file, null))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("vocal");
    }

    @Test
    @DisplayName("sendVocalMessage() → Format mp3 est accepte")
    void sendVocalMessage_mp3_succeeds() throws Exception {
        MultipartFile file = mock(MultipartFile.class);
        when(file.isEmpty()).thenReturn(false);
        when(file.getContentType()).thenReturn("audio/mp3");
        when(file.getSize()).thenReturn(500L);
        when(file.getOriginalFilename()).thenReturn("note.mp3");
        when(file.getInputStream()).thenReturn(new ByteArrayInputStream(new byte[]{1, 2, 3}));
        when(authenticatedUserService.getCurrentUser()).thenReturn(currentUser);
        when(utilisateurRepository.findById(1L)).thenReturn(Optional.of(currentUser));
        when(utilisateurRepository.findById(2L)).thenReturn(Optional.of(destinataire));
        when(messengerMessageRepository.findConversationSeed(anyLong())).thenReturn(List.of());
        when(messengerMessageRepository.save(any(MessengerMessage.class))).thenAnswer(inv -> inv.getArgument(0));
        when(messengerRealtimeService.hasActiveConnection(2L)).thenReturn(true);

        MessengerMessageResponse result = messengerService.sendVocalMessage(2L, file, null);

        assertThat(result.type()).isEqualTo(MessengerMessageType.VOCAL);
        cleanupStoredFile(result.cheminFichier());
    }

    @Test
    @DisplayName("loadFile() → Utilisateur expediteur autorise a acceder au fichier")
    void loadFile_whenUserIsExpediteur_returnsResource() throws Exception {
        Path temp = Files.createTempFile("msgexp", ".png");
        message.setCheminFichier(temp.toString());
        message.setExpediteurId(1L);
        message.setDestinataireId(2L);
        when(authenticatedUserService.getCurrentUser()).thenReturn(currentUser);
        when(messengerMessageRepository.findFirstByCheminFichierEndingWith(anyString()))
            .thenReturn(Optional.of(message));

        Resource resource = messengerService.loadFile(temp.getFileName().toString());

        assertThat(resource.exists()).isTrue();
        Files.deleteIfExists(temp);
    }

    @Test
    @DisplayName("loadFile() → Fichier non lisible lance exception")
    void loadFile_whenFileNotReadable_throws() throws Exception {
        Path temp = Files.createTempFile("msgunread", ".dat");
        message.setCheminFichier(temp.toString());
        when(authenticatedUserService.getCurrentUser()).thenReturn(currentUser);
        when(messengerMessageRepository.findFirstByCheminFichierEndingWith(anyString()))
            .thenReturn(Optional.of(message));

        Files.deleteIfExists(temp);

        assertThatThrownBy(() -> messengerService.loadFile("msgunread.dat"))
            .isInstanceOf(ResourceNotFoundException.class)
            .hasMessageContaining("Fichier introuvable");
    }

    @Test
    @DisplayName("getAuthorizedUsers() → Utilisateurs avec prenom/nom null sont tries correctement")
    void getAuthorizedUsers_nullNames_sortsCorrectly() {
        Utilisateur noName = new Utilisateur();
        noName.setId(4L);
        noName.setPrenom(null);
        noName.setNom(null);
        noName.setEmail("noname@test.com");
        noName.setRole(Role.CHAUFFEUR);
        when(authenticatedUserService.getCurrentUser()).thenReturn(currentUser);
        when(utilisateurRepository.findAll()).thenReturn(List.of(currentUser, destinataire, noName));
        when(messengerMessageRepository.findConversationSeed(anyLong())).thenReturn(List.of());

        List<MessengerUserResponse> result = messengerService.getAuthorizedUsers(null);

        assertThat(result).hasSize(2);
    }

    @Test
    @DisplayName("updateMessage() → ContenuOriginal deja set ne l'ecrase pas")
    void updateMessage_whenContenuOriginalAlreadySet_doesNotOverwrite() {
        message.setContenu("ancien");
        message.setContenuOriginal("original");
        when(authenticatedUserService.getCurrentUser()).thenReturn(currentUser);
        when(messengerMessageRepository.findById(1L)).thenReturn(Optional.of(message));
        when(utilisateurRepository.findById(1L)).thenReturn(Optional.of(currentUser));
        when(utilisateurRepository.findById(2L)).thenReturn(Optional.of(destinataire));
        when(messengerMessageRepository.save(any(MessengerMessage.class))).thenAnswer(inv -> inv.getArgument(0));
        when(messengerMessageRepository.findConversationSeed(1L)).thenReturn(List.of(message));

        messengerService.updateMessage(1L, new MessengerMessageUpdateRequest("nouveau"));

        assertThat(message.getContenuOriginal()).isEqualTo("original");
    }

    @Test
    @DisplayName("deleteMessage() → Chemin fichier vide ne tente pas de supprimer")
    void deleteMessage_whenCheminFichierBlank_skipsFileDeletion() {
        message.setCheminFichier(null);
        when(authenticatedUserService.getCurrentUser()).thenReturn(currentUser);
        when(messengerMessageRepository.findById(1L)).thenReturn(Optional.of(message));
        when(utilisateurRepository.findById(1L)).thenReturn(Optional.of(currentUser));
        when(utilisateurRepository.findById(2L)).thenReturn(Optional.of(destinataire));
        when(messengerMessageRepository.save(any(MessengerMessage.class))).thenAnswer(inv -> inv.getArgument(0));
        when(messengerMessageRepository.findConversationSeed(1L)).thenReturn(List.of(message));

        messengerService.deleteMessage(1L);

        assertThat(message.getSupprime()).isTrue();
    }

    @Test
    @DisplayName("buildFullName() → Prenom et nom null utilisent email")
    void buildFullName_bothNamesNull_usesEmail() {
        Utilisateur ghost = new Utilisateur();
        ghost.setId(77L);
        ghost.setPrenom(null);
        ghost.setNom(null);
        ghost.setEmail("ghost@test.com");
        ghost.setRole(Role.CHAUFFEUR);

        Object result = reflectCall(messengerService, "buildFullName",
            new Class<?>[]{Utilisateur.class}, ghost);

        assertThat(result).asString().isEqualTo("ghost@test.com");
    }

    @Test
    @DisplayName("buildFullName() → Email null utilise #id")
    void buildFullName_emailNull_usesHashId() {
        Utilisateur ghost = new Utilisateur();
        ghost.setId(77L);
        ghost.setPrenom(null);
        ghost.setNom(null);
        ghost.setEmail(null);
        ghost.setRole(Role.CHAUFFEUR);

        Object result = reflectCall(messengerService, "buildFullName",
            new Class<?>[]{Utilisateur.class}, ghost);

        assertThat(result).asString().isEqualTo("#77");
    }

    @Test
    @DisplayName("buildFullName() → Prenom present, nom null")
    void buildFullName_prenomPresentNomNull() {
        Utilisateur partial = new Utilisateur();
        partial.setId(88L);
        partial.setPrenom("Alice");
        partial.setNom(null);
        partial.setEmail("alice@test.com");
        partial.setRole(Role.CHAUFFEUR);

        Object result = reflectCall(messengerService, "buildFullName",
            new Class<?>[]{Utilisateur.class}, partial);

        assertThat(result).asString().isEqualTo("Alice");
    }

    @Test
    @DisplayName("matchesSearch() → Recherche vide ou null retourne vrai")
    void matchesSearch_blankSearch_returnsTrue() {
        assertThat(reflectCall(messengerService, "matchesSearch",
            new Class<?>[]{String.class, String.class, String.class},
            "Alice", "Bob", "")).isEqualTo(true);
        assertThat(reflectCall(messengerService, "matchesSearch",
            new Class<?>[]{String.class, String.class, String.class},
            "Alice", "Bob", "   ")).isEqualTo(true);
    }

    @Test
    @DisplayName("matchesSearch() → Recherche sur nom combine prenom+nom")
    void matchesSearch_combinedNameMatch() {
        assertThat(reflectCall(messengerService, "matchesSearch",
            new Class<?>[]{String.class, String.class, String.class},
            "Alice", "Bob", "alice bob")).isEqualTo(true);
    }

    @Test
    @DisplayName("matchesSearch() → Prenom null, recherche sur nom")
    void matchesSearch_prenomNull_searchesNom() {
        assertThat(reflectCall(messengerService, "matchesSearch",
            new Class<?>[]{String.class, String.class, String.class},
            null, "Bob", "bob")).isEqualTo(true);
    }

    @Test
    @DisplayName("matchesSearch() → Aucune correspondance retourne faux")
    void matchesSearch_noMatch_returnsFalse() {
        assertThat(reflectCall(messengerService, "matchesSearch",
            new Class<?>[]{String.class, String.class, String.class},
            "Alice", "Bob", "zzz")).isEqualTo(false);
    }

    @Test
    @DisplayName("getExtension() → Filename null retourne chaine vide")
    void getExtension_nullFilename_returnsEmpty() {
        Object result = reflectCall(messengerService, "getExtension",
            new Class<?>[]{String.class}, new Object[]{null});
        assertThat(result).asString().isEmpty();
    }

    @Test
    @DisplayName("getExtension() → Filename sans point retourne chaine vide")
    void getExtension_noDot_returnsEmpty() {
        Object result = reflectCall(messengerService, "getExtension",
            new Class<?>[]{String.class}, "noext");
        assertThat(result).asString().isEmpty();
    }

    @Test
    @DisplayName("getExtension() → Filename avec extension retourne l'extension")
    void getExtension_withDot_returnsExtension() {
        Object result = reflectCall(messengerService, "getExtension",
            new Class<?>[]{String.class}, "photo.PNG");
        assertThat(result).asString().isEqualTo(".png");
    }

    @Test
    @DisplayName("toConversationResponse() → Participant null retourne null")
    void toConversationResponse_nullParticipant_returnsNull() {
        Object result = reflectCall(messengerService, "toConversationResponse",
            new Class<?>[]{Long.class, Utilisateur.class, List.class},
            1L, null, List.of(message));
        assertThat(result).isNull();
    }

    @Test
    @DisplayName("toConversationResponse() → Messages null retourne null")
    void toConversationResponse_nullMessages_returnsNull() {
        Object result = reflectCall(messengerService, "toConversationResponse",
            new Class<?>[]{Long.class, Utilisateur.class, List.class},
            1L, destinataire, null);
        assertThat(result).isNull();
    }

    @Test
    @DisplayName("toConversationResponse() → Messages vide retourne null")
    void toConversationResponse_emptyMessages_returnsNull() {
        Object result = reflectCall(messengerService, "toConversationResponse",
            new Class<?>[]{Long.class, Utilisateur.class, List.class},
            1L, destinataire, List.of());
        assertThat(result).isNull();
    }

    @Test
    @DisplayName("loadParticipants() → Ensemble vide retourne map vide")
    void loadParticipants_emptySet_returnsEmptyMap() {
        Object result = reflectCall(messengerService, "loadParticipants",
            new Class<?>[]{Set.class}, Set.of());
        assertThat((Map<?, ?>) result).isEmpty();
    }

    @Test
    @DisplayName("loadParticipants() → Null retourne map vide")
    void loadParticipants_nullSet_returnsEmptyMap() {
        Object result = reflectCall(messengerService, "loadParticipants",
            new Class<?>[]{Set.class}, new Object[]{null});
        assertThat((Map<?, ?>) result).isEmpty();
    }

    @Test
    @DisplayName("resolvePresence() → Snapshot expiré retourne inactif")
    void resolvePresence_expiredSnapshot_returnsInactive() {
        LocalDateTime stale = LocalDateTime.now().minusMinutes(2);
        reflectCall(messengerService, "touchPresence",
            new Class<?>[]{Long.class, boolean.class, LocalDateTime.class},
            5L, true, stale);

        Object snapshot = reflectCall(messengerService, "resolvePresence",
            new Class<?>[]{Long.class, Long.class, Long.class, Utilisateur.class},
            5L, 5L, 1L, destinataire);

        assertThat(reflectGet(snapshot, "connecte")).isEqualTo(false);
    }

    @Test
    @DisplayName("resolvePresence() → Pas de cache, message recent avec connecte=true retourne connecte")
    void resolvePresence_noCache_recentConnectedMessage_returnsConnected() {
        MessengerMessage recentMsg = message(10L, 5L, 1L, MessengerMessageType.TEXTE,
            MessengerMessageStatus.NON_LU, LocalDateTime.now().minusSeconds(10));
        recentMsg.setConnecte(true);
        recentMsg.setDerniereActivite(LocalDateTime.now().minusSeconds(10));
        when(messengerMessageRepository.findConversationSeed(5L)).thenReturn(List.of(recentMsg));

        Object snapshot = reflectCall(messengerService, "resolvePresence",
            new Class<?>[]{Long.class, Long.class, Long.class, Utilisateur.class},
            5L, 5L, 1L, destinataire);

        assertThat(reflectGet(snapshot, "connecte")).isEqualTo(true);
        assertThat(reflectGet(snapshot, "derniereActivite")).isNotNull();
    }

    @Test
    @DisplayName("resolvePresence() → Pas de cache, message sans activite retourne inactif")
    void resolvePresence_noCache_messageWithNullActivity_returnsInactive() {
        MessengerMessage oldMsg = message(10L, 5L, 1L, MessengerMessageType.TEXTE,
            MessengerMessageStatus.NON_LU, LocalDateTime.now().minusMinutes(5));
        oldMsg.setConnecte(true);
        oldMsg.setDerniereActivite(null);
        when(messengerMessageRepository.findConversationSeed(5L)).thenReturn(List.of(oldMsg));

        Object snapshot = reflectCall(messengerService, "resolvePresence",
            new Class<?>[]{Long.class, Long.class, Long.class, Utilisateur.class},
            5L, 5L, 1L, destinataire);

        assertThat(reflectGet(snapshot, "connecte")).isEqualTo(false);
    }

    @Test
    @DisplayName("resolvePresence() → Pas de cache, pas de messages retourne inactif")
    void resolvePresence_noCache_noMessages_returnsInactive() {
        when(messengerMessageRepository.findConversationSeed(6L)).thenReturn(List.of());

        Object snapshot = reflectCall(messengerService, "resolvePresence",
            new Class<?>[]{Long.class, Long.class, Long.class, Utilisateur.class},
            6L, 6L, 1L, destinataire);

        assertThat(reflectGet(snapshot, "connecte")).isEqualTo(false);
        assertThat(reflectGet(snapshot, "derniereActivite")).isNull();
    }

    @Test
    @DisplayName("resolvePresence() → Pas de cache, pas de message envoyé par l'utilisateur")
    void resolvePresence_noCache_noOutgoingMessages_returnsInactive() {
        MessengerMessage incoming = message(10L, 1L, 5L, MessengerMessageType.TEXTE,
            MessengerMessageStatus.NON_LU, LocalDateTime.now().minusMinutes(5));
        when(messengerMessageRepository.findConversationSeed(5L)).thenReturn(List.of(incoming));

        Object snapshot = reflectCall(messengerService, "resolvePresence",
            new Class<?>[]{Long.class, Long.class, Long.class, Utilisateur.class},
            5L, 5L, 1L, destinataire);

        assertThat(reflectGet(snapshot, "connecte")).isEqualTo(false);
    }

    @Test
    @DisplayName("resolvePreview() → Message supprime retourne texte de suppression")
    void resolvePreview_deletedMessage_returnsDeletedText() {
        MessengerMessage deleted = mock(MessengerMessage.class);
        when(deleted.getSupprime()).thenReturn(true);

        Object preview = reflectCall(messengerService, "resolvePreview",
            new Class<?>[]{MessengerMessage.class}, deleted);

        assertThat(preview).asString().contains("supprimé");
    }

    @Test
    @DisplayName("resolvePreview() → Message VOCAL retourne le texte vocal")
    void resolvePreview_vocalType_returnsVocalText() {
        MessengerMessage vocal = mock(MessengerMessage.class);
        when(vocal.getSupprime()).thenReturn(false);
        when(vocal.getType()).thenReturn(MessengerMessageType.VOCAL);

        Object preview = reflectCall(messengerService, "resolvePreview",
            new Class<?>[]{MessengerMessage.class}, vocal);

        assertThat(preview).asString().contains("vocal");
    }

    @Test
    @DisplayName("resolvePreview() → Message PDF retourne le texte PDF")
    void resolvePreview_pdfType_returnsPdfText() {
        MessengerMessage pdf = mock(MessengerMessage.class);
        when(pdf.getSupprime()).thenReturn(false);
        when(pdf.getType()).thenReturn(MessengerMessageType.PDF);

        Object preview = reflectCall(messengerService, "resolvePreview",
            new Class<?>[]{MessengerMessage.class}, pdf);

        assertThat(preview).asString().contains("PDF");
    }

    @Test
    @DisplayName("resolvePreview() → Message APPEL retourne le contenu")
    void resolvePreview_appelType_returnsContent() {
        MessengerMessage appel = mock(MessengerMessage.class);
        when(appel.getSupprime()).thenReturn(false);
        when(appel.getType()).thenReturn(MessengerMessageType.APPEL);
        when(appel.getContenu()).thenReturn("Appel sortant");

        Object preview = reflectCall(messengerService, "resolvePreview",
            new Class<?>[]{MessengerMessage.class}, appel);

        assertThat(preview).asString().isEqualTo("Appel sortant");
    }

    @Test
    @DisplayName("getConversations() → Messages avec counterpartId null sont ignores")
    void getConversations_nullCounterpartId_skipsMessage() {
        MessengerMessage badMsg = message(10L, 1L, null, MessengerMessageType.TEXTE,
            MessengerMessageStatus.LU, LocalDateTime.now());
        badMsg.setSupprime(false);
        when(authenticatedUserService.getCurrentUser()).thenReturn(currentUser);
        when(messengerMessageRepository.findConversationSeed(anyLong())).thenReturn(List.of(badMsg));

        List<MessengerConversationResponse> result = messengerService.getConversations(null);

        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("sendFileMessage() → ContentType null traite comme type non autorise")
    void sendFileMessage_nullContentType_throws() {
        MultipartFile file = mock(MultipartFile.class);
        when(file.isEmpty()).thenReturn(false);
        when(file.getContentType()).thenReturn(null);
        when(authenticatedUserService.getCurrentUser()).thenReturn(currentUser);
        when(utilisateurRepository.findById(2L)).thenReturn(Optional.of(destinataire));

        assertThatThrownBy(() -> messengerService.sendFileMessage(2L, file))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("Seuls les fichiers image");
    }

    @Test
    @DisplayName("sendVocalMessage() → ContentType null traite comme non autorise")
    void sendVocalMessage_nullContentType_throws() {
        MultipartFile file = mock(MultipartFile.class);
        when(file.isEmpty()).thenReturn(false);
        when(file.getContentType()).thenReturn(null);
        when(authenticatedUserService.getCurrentUser()).thenReturn(currentUser);
        when(utilisateurRepository.findById(2L)).thenReturn(Optional.of(destinataire));

        assertThatThrownBy(() -> messengerService.sendVocalMessage(2L, file, null))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("WebM ou MP3");
    }

    @Test
    @DisplayName("toMessageResponse() → DateEnvoi null retourne chaine vide pour heureFormattee")
    void toMessageResponse_nullDateEnvoi_emptyTimeString() throws Exception {
        MessengerMessage noDate = message(99L, 1L, 2L, MessengerMessageType.TEXTE,
            MessengerMessageStatus.LU, null);
        noDate.setContenu("test");
        when(utilisateurRepository.findById(1L)).thenReturn(Optional.of(currentUser));
        when(utilisateurRepository.findById(2L)).thenReturn(Optional.of(destinataire));

        MessengerMessageResponse result = (MessengerMessageResponse) reflectCall(messengerService, "toMessageResponse",
            new Class<?>[]{MessengerMessage.class, Long.class}, noDate, 1L);

        assertThat(result.heureEnvoi()).isEmpty();
    }

    @Test
    @DisplayName("sendTextMessage() → Contenu avec seulement espaces est considere vide")
    void sendTextMessage_onlySpaces_throws() {
        assertThatThrownBy(() -> messengerService.sendTextMessage(new MessengerTextRequest(2L, "   ")))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("vide");
    }

    @Test
    @DisplayName("toMessageResponse() → Chemin fichier non null construit l'URL")
    void toMessageResponse_withFile_buildsUrl() throws Exception {
        MessengerMessage withFile = message(100L, 1L, 2L, MessengerMessageType.IMAGE,
            MessengerMessageStatus.NON_LU, LocalDateTime.now());
        withFile.setCheminFichier("uploads/messenger/2026/08/abc.png");
        when(utilisateurRepository.findById(1L)).thenReturn(Optional.of(currentUser));
        when(utilisateurRepository.findById(2L)).thenReturn(Optional.of(destinataire));

        MessengerMessageResponse result = (MessengerMessageResponse) reflectCall(messengerService, "toMessageResponse",
            new Class<?>[]{MessengerMessage.class, Long.class}, withFile, 1L);

        assertThat(result.fichierUrl()).contains("/api/messenger/fichiers/abc.png");
    }

    @Test
    @DisplayName("loadFile() → Fichier introuvable via repo lance exception")
    void loadFile_whenRepoReturnsEmpty_throws() {
        when(messengerMessageRepository.findFirstByCheminFichierEndingWith("missing.png"))
            .thenReturn(Optional.empty());

        assertThatThrownBy(() -> messengerService.loadFile("missing.png"))
            .isInstanceOf(ResourceNotFoundException.class)
            .hasMessageContaining("Fichier introuvable");
    }

    @Test
    @DisplayName("markConversationAsRead() → Messages non lu sont marques comme lus")
    void markConversationAsRead_unreadMessages_returnsUpdatedCount() {
        MessengerMessage unread = message(5L, 2L, 1L, MessengerMessageType.TEXTE,
            MessengerMessageStatus.NON_LU, LocalDateTime.now().minusMinutes(5));
        unread.setContenu("non lu");
        when(authenticatedUserService.getCurrentUser()).thenReturn(currentUser);
        when(utilisateurRepository.findById(1L)).thenReturn(Optional.of(currentUser));
        when(utilisateurRepository.findById(2L)).thenReturn(Optional.of(destinataire));
        when(messengerMessageRepository.findUnreadMessagesFromSender(1L, 2L, MessengerMessageStatus.NON_LU))
            .thenReturn(List.of(unread));
        when(messengerMessageRepository.markConversationAsRead(eq(2L), eq(1L),
            eq(MessengerMessageStatus.LU), any(LocalDateTime.class))).thenReturn(1);
        when(messengerMessageRepository.findConversationSeed(anyLong())).thenReturn(List.of());

        MessengerReadResponse result = messengerService.markConversationAsRead(2L);

        assertThat(result.messagesMarquesLus()).isEqualTo(1L);
        verify(messengerRealtimeService).publishStatusToUsers(anyList(), any());
    }

    @Test
    @DisplayName("getConversations() → Tri par dateDernierMessage avec null en dernier")
    void getConversations_sortByDateWithNull() {
        MessengerMessage msg1 = message(10L, 2L, 1L, MessengerMessageType.TEXTE,
            MessengerMessageStatus.LU, LocalDateTime.now().minusMinutes(5));
        msg1.setSupprime(false);
        msg1.setContenu("recent");

        when(authenticatedUserService.getCurrentUser()).thenReturn(currentUser);
        when(messengerMessageRepository.findConversationSeed(anyLong())).thenReturn(List.of(msg1));
        when(utilisateurRepository.findAllById(anyCollection())).thenReturn(List.of(destinataire));

        List<MessengerConversationResponse> result = messengerService.getConversations(null);

        assertThat(result).hasSize(1);
    }

    @Test
    @DisplayName("sendFileMessage() → File store avec extension inconnue")
    void sendFileMessage_withUnknownExtension_succeeds() throws Exception {
        MultipartFile file = mock(MultipartFile.class);
        when(file.isEmpty()).thenReturn(false);
        when(file.getContentType()).thenReturn("image/png");
        when(file.getSize()).thenReturn(100L);
        when(file.getOriginalFilename()).thenReturn("noextension");
        when(file.getInputStream()).thenReturn(new ByteArrayInputStream(new byte[]{1}));
        when(authenticatedUserService.getCurrentUser()).thenReturn(currentUser);
        when(utilisateurRepository.findById(1L)).thenReturn(Optional.of(currentUser));
        when(utilisateurRepository.findById(2L)).thenReturn(Optional.of(destinataire));
        when(messengerMessageRepository.findConversationSeed(anyLong())).thenReturn(List.of());
        when(messengerMessageRepository.save(any(MessengerMessage.class))).thenAnswer(inv -> inv.getArgument(0));
        when(messengerRealtimeService.hasActiveConnection(2L)).thenReturn(true);

        MessengerMessageResponse result = messengerService.sendFileMessage(2L, file);

        assertThat(result.type()).isEqualTo(MessengerMessageType.IMAGE);
        cleanupStoredFile(result.cheminFichier());
    }

    @Test
    @DisplayName("getAuthorizedUsers() → Recherche vide retourne tous les utilisateurs")
    void getAuthorizedUsers_blankSearch_returnsAll() {
        when(authenticatedUserService.getCurrentUser()).thenReturn(currentUser);
        when(utilisateurRepository.findAll()).thenReturn(List.of(currentUser, destinataire));
        when(messengerMessageRepository.findConversationSeed(anyLong())).thenReturn(List.of());

        List<MessengerUserResponse> result = messengerService.getAuthorizedUsers("");

        assertThat(result).hasSize(1);
    }

    @Test
    @DisplayName("sendVocalMessage() → Notification vocal creee quand destinataire hors ligne")
    void sendVocalMessage_offlineDest_createsNotification() throws Exception {
        MultipartFile file = mock(MultipartFile.class);
        when(file.isEmpty()).thenReturn(false);
        when(file.getContentType()).thenReturn("audio/webm");
        when(file.getSize()).thenReturn(500L);
        when(file.getOriginalFilename()).thenReturn(null);
        when(file.getInputStream()).thenReturn(new ByteArrayInputStream(new byte[]{1, 2, 3}));
        when(authenticatedUserService.getCurrentUser()).thenReturn(currentUser);
        when(utilisateurRepository.findById(1L)).thenReturn(Optional.of(currentUser));
        when(utilisateurRepository.findById(2L)).thenReturn(Optional.of(destinataire));
        when(messengerMessageRepository.findConversationSeed(anyLong())).thenReturn(List.of());
        when(messengerMessageRepository.save(any(MessengerMessage.class))).thenAnswer(inv -> {
            MessengerMessage saved = inv.getArgument(0);
            saved.setId(50L);
            return saved;
        });
        when(messengerRealtimeService.hasActiveConnection(2L)).thenReturn(false);

        MessengerMessageResponse result = messengerService.sendVocalMessage(2L, file, null);

        assertThat(result.nomFichierOriginal()).isEqualTo("vocal.webm");
        verify(notificationRepository).save(any(Notification.class));
        cleanupStoredFile(result.cheminFichier());
    }

    @Test
    @DisplayName("sendVocalMessage() → Destinataire connecte, pas de notification")
    void sendVocalMessage_connectedDest_noNotification() throws Exception {
        MultipartFile file = mock(MultipartFile.class);
        when(file.isEmpty()).thenReturn(false);
        when(file.getContentType()).thenReturn("audio/mpeg");
        when(file.getSize()).thenReturn(200L);
        when(file.getOriginalFilename()).thenReturn("msg.mp3");
        when(file.getInputStream()).thenReturn(new ByteArrayInputStream(new byte[]{1}));
        when(authenticatedUserService.getCurrentUser()).thenReturn(currentUser);
        when(utilisateurRepository.findById(1L)).thenReturn(Optional.of(currentUser));
        when(utilisateurRepository.findById(2L)).thenReturn(Optional.of(destinataire));
        when(messengerMessageRepository.findConversationSeed(anyLong())).thenReturn(List.of());
        when(messengerMessageRepository.save(any(MessengerMessage.class))).thenAnswer(inv -> inv.getArgument(0));
        when(messengerRealtimeService.hasActiveConnection(2L)).thenReturn(true);

        messengerService.sendVocalMessage(2L, file, 60);

        verify(notificationRepository, never()).save(any(Notification.class));
    }
}
