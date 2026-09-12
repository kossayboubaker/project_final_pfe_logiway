package com.logiway.controllers;

import com.logiway.dto.request.ChatbotMessageRequest;
import com.logiway.entities.Utilisateur;
import com.logiway.security.AuthenticatedUserService;
import com.logiway.services.ChatbotRAGService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Controller Chatbot — Tests Unitaires")
class ChatbotControllerTest {

    @Mock
    private ChatbotRAGService chatbotRAGService;

    @Mock
    private AuthenticatedUserService authenticatedUserService;

    @InjectMocks
    private ChatbotController chatbotController;

    private static Utilisateur utilisateur() {
        return Utilisateur.builder()
            .id(1L)
            .prenom("Jean")
            .nom("Dupont")
            .email("jean@logiway.com")
            .build();
    }

    @Test
    @DisplayName("POST /api/chat/message → Traite la question et retourne la réponse")
    void sendMessage_returnsOk() {
        ChatbotMessageRequest request = new ChatbotMessageRequest("Quel est le taux d'absence ?");
        when(authenticatedUserService.getCurrentUser()).thenReturn(utilisateur());
        when(chatbotRAGService.traiterQuestion("Quel est le taux d'absence ?", "Jean Dupont"))
            .thenReturn("Le taux d'absence est de 5%");

        ResponseEntity<Map<String, Object>> response = chatbotController.sendMessage(request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).containsKey("reponse");
        assertThat(response.getBody().get("reponse")).isEqualTo("Le taux d'absence est de 5%");
        verify(authenticatedUserService, times(1)).getCurrentUser();
        verify(chatbotRAGService, times(1)).traiterQuestion("Quel est le taux d'absence ?", "Jean Dupont");
    }

    @Test
    @DisplayName("POST /api/chat/message → Question vide → 400")
    void sendMessage_blankQuestion_returnsBadRequest() {
        ChatbotMessageRequest request = new ChatbotMessageRequest("   ");

        ResponseEntity<Map<String, Object>> response = chatbotController.sendMessage(request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).containsEntry("error", "La question ne peut pas être vide");
        verifyNoInteractions(authenticatedUserService, chatbotRAGService);
    }

    @Test
    @DisplayName("POST /api/chat/message → Question null → 400")
    void sendMessage_nullQuestion_returnsBadRequest() {
        ChatbotMessageRequest request = new ChatbotMessageRequest(null);

        ResponseEntity<Map<String, Object>> response = chatbotController.sendMessage(request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).containsEntry("error", "La question ne peut pas être vide");
        verifyNoInteractions(authenticatedUserService, chatbotRAGService);
    }

    @Test
    @DisplayName("POST /api/chat/message → Erreur service → 500")
    void sendMessage_error_returnsInternalServerError() {
        ChatbotMessageRequest request = new ChatbotMessageRequest("Quel est le taux d'absence ?");
        when(authenticatedUserService.getCurrentUser()).thenReturn(utilisateur());
        when(chatbotRAGService.traiterQuestion(anyString(), anyString())).thenThrow(new RuntimeException("boom"));

        ResponseEntity<Map<String, Object>> response = chatbotController.sendMessage(request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody()).containsKey("error");
    }
}
