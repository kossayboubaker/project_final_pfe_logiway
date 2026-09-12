package com.logiway.controllers;

import com.logiway.dto.request.ChatbotMessageRequest;
import com.logiway.security.AuthenticatedUserService;
import com.logiway.services.ChatbotRAGService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
@Slf4j
public class ChatbotController {

    private final ChatbotRAGService chatbotRAGService;
    private final AuthenticatedUserService authenticatedUserService;

    @PostMapping("/message")
    @PreAuthorize("hasAnyAuthority('ROLE_SUPERADMIN','ROLE_MANAGER','ROLE_CHAUFFEUR')")
    public ResponseEntity<Map<String, Object>> sendMessage(@Valid @RequestBody ChatbotMessageRequest request) {
        String question = request.getQuestion();
        if (question == null || question.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "La question ne peut pas être vide"));
        }

        try {
            var utilisateur = authenticatedUserService.getCurrentUser();
            String utilisateurInfo = utilisateur.getPrenom() + " " + utilisateur.getNom();
            log.debug("Question reçue de {} : {}", utilisateurInfo, question);

            String reponse = chatbotRAGService.traiterQuestion(question.trim(), utilisateurInfo);
            return ResponseEntity.ok(Map.of("reponse", reponse));
        } catch (Exception e) {
            log.error("Erreur traitement chatbot: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "Erreur lors du traitement de la demande: " + e.getMessage()));
        }
    }
}
