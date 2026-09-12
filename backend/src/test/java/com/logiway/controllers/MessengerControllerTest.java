package com.logiway.controllers;

import com.logiway.dto.request.MessengerMessageUpdateRequest;
import com.logiway.dto.request.MessengerTextRequest;
import com.logiway.dto.response.MessengerConversationResponse;
import com.logiway.dto.response.MessengerMessagePageResponse;
import com.logiway.dto.response.MessengerMessageResponse;
import com.logiway.dto.response.MessengerPresenceResponse;
import com.logiway.dto.response.MessengerReadResponse;
import com.logiway.dto.response.MessengerUserResponse;
import com.logiway.entities.Utilisateur;
import com.logiway.entities.enums.MessengerMessageStatus;
import com.logiway.entities.enums.MessengerMessageType;
import com.logiway.entities.enums.Role;
import com.logiway.exceptions.UnauthorizedException;
import com.logiway.security.AuthenticatedUserService;
import com.logiway.services.MessengerRealtimeService;
import com.logiway.services.MessengerService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.net.URI;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Controller Messenger — Tests Unitaires")
class MessengerControllerTest {

    @Mock
    private MessengerService messengerService;

    @Mock
    private MessengerRealtimeService messengerRealtimeService;

    @Mock
    private AuthenticatedUserService authenticatedUserService;

    @InjectMocks
    private MessengerController messengerController;

    private MessengerMessageResponse message() {
        return new MessengerMessageResponse(
            100L, 1L, "Jean", "Dupont", "jean@test.com", "avatar.png",
            Role.MANAGER, 2L, "Pierre", "Martin", "pierre@test.com", null,
            Role.CHAUFFEUR, MessengerMessageType.TEXTE, "Bonjour",
            null, null, null, null, MessengerMessageStatus.NON_LU,
            LocalDateTime.of(2025, 2, 10, 9, 0), null, false, null,
            null, false, null, true,
            LocalDateTime.of(2025, 2, 10, 9, 5), null, "09:00"
        );
    }

    private MessengerConversationResponse conversation() {
        return new MessengerConversationResponse(
            2L, "Pierre", "Martin", "pierre@test.com", null, Role.CHAUFFEUR,
            true, LocalDateTime.of(2025, 2, 10, 9, 5), MessengerMessageType.TEXTE,
            "Bonjour", LocalDateTime.of(2025, 2, 10, 9, 0), 2L
        );
    }

    @Test
    @DisplayName("GET /api/messenger/conversations → Retourne les conversations")
    void getConversations_returnsOk() {
        when(messengerService.getConversations("jean")).thenReturn(List.of(conversation()));

        ResponseEntity<List<MessengerConversationResponse>> response = messengerController.getConversations("jean");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).hasSize(1);
        assertThat(response.getBody().get(0).destinataireId()).isEqualTo(2L);
        verify(messengerService, times(1)).getConversations("jean");
    }

    @Test
    @DisplayName("GET /api/messenger/conversations/{id}/messages → Retourne les messages paginés")
    void getConversationMessages_returnsOk() {
        MessengerMessagePageResponse pageResponse = new MessengerMessagePageResponse(
            List.of(message()), 0, 30, 1L, false
        );
        when(messengerService.getConversationMessages(2L, 0, 30)).thenReturn(pageResponse);

        ResponseEntity<MessengerMessagePageResponse> response = messengerController.getConversationMessages(2L, 0, 30);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().messages()).hasSize(1);
        assertThat(response.getBody().totalElements()).isEqualTo(1L);
        verify(messengerService, times(1)).getConversationMessages(2L, 0, 30);
    }

    @Test
    @DisplayName("POST /api/messenger/messages → Envoie un message texte")
    void sendTextMessage_returnsCreated() {
        MessengerTextRequest request = new MessengerTextRequest(2L, "Bonjour");
        when(messengerService.sendTextMessage(any(MessengerTextRequest.class))).thenReturn(message());

        ResponseEntity<MessengerMessageResponse> response = messengerController.sendTextMessage(request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody().contenu()).isEqualTo("Bonjour");
        verify(messengerService, times(1)).sendTextMessage(any(MessengerTextRequest.class));
    }

    @Test
    @DisplayName("POST /api/messenger/messages/fichiers → Envoie un message fichier")
    void sendFileMessage_returnsCreated() {
        MultipartFile fichier = mock(MultipartFile.class);
        when(messengerService.sendFileMessage(2L, fichier)).thenReturn(message());

        ResponseEntity<MessengerMessageResponse> response = messengerController.sendFileMessage(2L, fichier);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody().expediteurId()).isEqualTo(1L);
        verify(messengerService, times(1)).sendFileMessage(eq(2L), any(MultipartFile.class));
    }

    @Test
    @DisplayName("POST /api/messenger/messages/vocal → Envoie un message vocal")
    void sendVocalMessage_returnsCreated() {
        MultipartFile fichier = mock(MultipartFile.class);
        when(messengerService.sendVocalMessage(2L, fichier, 15)).thenReturn(message());

        ResponseEntity<MessengerMessageResponse> response = messengerController.sendVocalMessage(2L, fichier, 15);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody().id()).isEqualTo(100L);
        verify(messengerService, times(1)).sendVocalMessage(eq(2L), any(MultipartFile.class), eq(15));
    }

    @Test
    @DisplayName("PUT /api/messenger/messages/{id} → Modifie un message")
    void updateMessage_returnsOk() {
        MessengerMessageUpdateRequest request = new MessengerMessageUpdateRequest("Bonjour modifié");
        when(messengerService.updateMessage(eq(100L), any(MessengerMessageUpdateRequest.class))).thenReturn(message());

        ResponseEntity<MessengerMessageResponse> response = messengerController.updateMessage(100L, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().contenu()).isEqualTo("Bonjour");
        verify(messengerService, times(1)).updateMessage(eq(100L), any(MessengerMessageUpdateRequest.class));
    }

    @Test
    @DisplayName("DELETE /api/messenger/messages/{id} → Supprime un message")
    void deleteMessage_returnsNoContent() {
        doNothing().when(messengerService).deleteMessage(100L);

        ResponseEntity<Void> response = messengerController.deleteMessage(100L);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        assertThat(response.getBody()).isNull();
        verify(messengerService, times(1)).deleteMessage(100L);
    }

    @Test
    @DisplayName("GET /api/messenger/fichiers/{filename} → Retourne un fichier PDF")
    void getFile_pdf_returnsPdfContentType() throws Exception {
        Resource resource = mock(Resource.class);
        when(messengerService.loadFile("facture.pdf")).thenReturn(resource);
        when(resource.getURL()).thenReturn(new URI("file:///uploads/facture.pdf").toURL());

        ResponseEntity<Resource> response = messengerController.getFile("facture.pdf");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getHeaders().getFirst(HttpHeaders.CONTENT_DISPOSITION))
            .isEqualTo("inline; filename=\"facture.pdf\"");
        assertThat(response.getHeaders().getContentType()).isEqualTo(MediaType.APPLICATION_PDF);
        assertThat(response.getBody()).isSameAs(resource);
        verify(messengerService, times(1)).loadFile("facture.pdf");
    }

    @Test
    @DisplayName("GET /api/messenger/fichiers/{filename} → Retourne un fichier non-PDF en octet-stream")
    void getFile_nonPdf_returnsOctetStream() throws Exception {
        Resource resource = mock(Resource.class);
        when(messengerService.loadFile("photo.png")).thenReturn(resource);
        when(resource.getURL()).thenReturn(new URI("file:///uploads/photo.png").toURL());

        ResponseEntity<Resource> response = messengerController.getFile("photo.png");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getHeaders().getContentType()).isEqualTo(MediaType.APPLICATION_OCTET_STREAM);
        assertThat(response.getBody()).isSameAs(resource);
    }

    @Test
    @DisplayName("GET /api/messenger/fichiers/{filename} → Retourne octet-stream si l'URL échoue")
    void getFile_ioError_returnsOctetStream() throws Exception {
        Resource resource = mock(Resource.class);
        when(messengerService.loadFile("facture.pdf")).thenReturn(resource);
        when(resource.getURL()).thenThrow(new IOException("fichier introuvable"));

        ResponseEntity<Resource> response = messengerController.getFile("facture.pdf");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getHeaders().getContentType()).isEqualTo(MediaType.APPLICATION_OCTET_STREAM);
        assertThat(response.getBody()).isSameAs(resource);
    }

    @Test
    @DisplayName("PUT /api/messenger/conversations/{id}/lu → Marque la conversation comme lue")
    void markAsRead_returnsOk() {
        MessengerReadResponse readResponse = new MessengerReadResponse(
            2L, 2L, LocalDateTime.of(2025, 2, 10, 9, 10)
        );
        when(messengerService.markConversationAsRead(2L)).thenReturn(readResponse);

        ResponseEntity<MessengerReadResponse> response = messengerController.markAsRead(2L);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().messagesMarquesLus()).isEqualTo(2L);
        verify(messengerService, times(1)).markConversationAsRead(2L);
    }

    @Test
    @DisplayName("GET /api/messenger/utilisateurs → Retourne les utilisateurs autorisés")
    void getAuthorizedUsers_returnsOk() {
        MessengerUserResponse utilisateur = new MessengerUserResponse(
            2L, "Pierre", "Martin", "pierre@test.com", null, Role.CHAUFFEUR,
            true, LocalDateTime.of(2025, 2, 10, 9, 5), "Bonjour",
            LocalDateTime.of(2025, 2, 10, 9, 0), 2L
        );
        when(messengerService.getAuthorizedUsers("pierre")).thenReturn(List.of(utilisateur));

        ResponseEntity<List<MessengerUserResponse>> response = messengerController.getAuthorizedUsers("pierre");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).hasSize(1);
        assertThat(response.getBody().get(0).role()).isEqualTo(Role.CHAUFFEUR);
        verify(messengerService, times(1)).getAuthorizedUsers("pierre");
    }

    @Test
    @DisplayName("GET /api/messenger/stream → Enregistre l'utilisateur sur le flux SSE")
    void stream_returnsSseEmitter() {
        Utilisateur utilisateur = new Utilisateur();
        utilisateur.setId(5L);
        when(authenticatedUserService.getCurrentUser()).thenReturn(utilisateur);
        SseEmitter emitter = new SseEmitter();
        when(messengerRealtimeService.register(5L)).thenReturn(emitter);

        SseEmitter result = messengerController.stream();

        assertThat(result).isSameAs(emitter);
        verify(authenticatedUserService, times(1)).getCurrentUser();
        verify(messengerRealtimeService, times(1)).register(5L);
    }

    @Test
    @DisplayName("GET /api/messenger/stream → Lève UnauthorizedException si l'id est manquant")
    void stream_nullUserId_throwsUnauthorizedException() {
        Utilisateur utilisateur = new Utilisateur();
        when(authenticatedUserService.getCurrentUser()).thenReturn(utilisateur);

        assertThatThrownBy(() -> messengerController.stream())
            .isInstanceOf(UnauthorizedException.class)
            .hasMessage("User id is missing");

        verify(messengerRealtimeService, never()).register(anyLong());
    }

    @Test
    @DisplayName("POST /api/messenger/presence → Renvoie le heartbeat de présence")
    void heartbeat_returnsOk() {
        MessengerPresenceResponse presence = new MessengerPresenceResponse(
            1L, true, LocalDateTime.of(2025, 2, 10, 9, 15)
        );
        when(messengerService.heartbeat()).thenReturn(presence);

        ResponseEntity<MessengerPresenceResponse> response = messengerController.heartbeat();

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().connecte()).isTrue();
        verify(messengerService, times(1)).heartbeat();
    }

    @Test
    @DisplayName("POST /api/messenger/presence/disconnect → Déconnecte la présence")
    void disconnectPresence_returnsOk() {
        Utilisateur utilisateur = new Utilisateur();
        utilisateur.setId(1L);
        when(authenticatedUserService.getCurrentUser()).thenReturn(utilisateur);
        doNothing().when(messengerService).disconnectPresence();

        ResponseEntity<MessengerPresenceResponse> response = messengerController.disconnectPresence();

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().utilisateurId()).isEqualTo(1L);
        assertThat(response.getBody().connecte()).isFalse();
        verify(messengerService, times(1)).disconnectPresence();
        verify(authenticatedUserService, times(1)).getCurrentUser();
    }
}
