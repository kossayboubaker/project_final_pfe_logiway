package com.logiway.controllers;

import com.logiway.dto.request.MessengerTextRequest;
import com.logiway.dto.request.MessengerMessageUpdateRequest;
import com.logiway.dto.response.MessengerConversationResponse;
import com.logiway.dto.response.MessengerMessagePageResponse;
import com.logiway.dto.response.MessengerMessageResponse;
import com.logiway.dto.response.MessengerPresenceResponse;
import com.logiway.dto.response.MessengerReadResponse;
import com.logiway.dto.response.MessengerUserResponse;
import com.logiway.security.AuthenticatedUserService;
import com.logiway.services.MessengerRealtimeService;
import com.logiway.services.MessengerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/messenger")
@RequiredArgsConstructor
@PreAuthorize("hasAnyAuthority('ROLE_SUPERADMIN','ROLE_MANAGER','ROLE_CHAUFFEUR')")
public class MessengerController {

    private final MessengerService messengerService;
    private final MessengerRealtimeService messengerRealtimeService;
    private final AuthenticatedUserService authenticatedUserService;

    @GetMapping("/conversations")
    public ResponseEntity<List<MessengerConversationResponse>> getConversations(@RequestParam(required = false) String search) {
        return ResponseEntity.ok(messengerService.getConversations(search));
    }

    @GetMapping("/conversations/{destinataireId}/messages")
    public ResponseEntity<MessengerMessagePageResponse> getConversationMessages(@PathVariable Long destinataireId,
                                                                                @RequestParam(defaultValue = "0") int page,
                                                                                @RequestParam(defaultValue = "30") int size) {
        return ResponseEntity.ok(messengerService.getConversationMessages(destinataireId, page, size));
    }

    @PostMapping("/messages")
    public ResponseEntity<MessengerMessageResponse> sendTextMessage(@Valid @RequestBody MessengerTextRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(messengerService.sendTextMessage(request));
    }

    @PostMapping(value = "/messages/fichiers", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<MessengerMessageResponse> sendFileMessage(@RequestParam Long destinataireId,
                                                                    @RequestParam MultipartFile fichier) {
        return ResponseEntity.status(HttpStatus.CREATED).body(messengerService.sendFileMessage(destinataireId, fichier));
    }

    @PostMapping(value = "/messages/vocal", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<MessengerMessageResponse> sendVocalMessage(@RequestParam Long destinataireId,
                                                                     @RequestParam MultipartFile fichier,
                                                                     @RequestParam(required = false) Integer dureeVocale) {
        return ResponseEntity.status(HttpStatus.CREATED).body(messengerService.sendVocalMessage(destinataireId, fichier, dureeVocale));
    }

    @PutMapping("/messages/{messageId}")
    public ResponseEntity<MessengerMessageResponse> updateMessage(@PathVariable Long messageId,
                                                                  @Valid @RequestBody MessengerMessageUpdateRequest request) {
        return ResponseEntity.ok(messengerService.updateMessage(messageId, request));
    }

    @DeleteMapping("/messages/{messageId}")
    public ResponseEntity<Void> deleteMessage(@PathVariable Long messageId) {
        messengerService.deleteMessage(messageId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/fichiers/{filename}")
    public ResponseEntity<Resource> getFile(@PathVariable String filename) {
        Resource resource = messengerService.loadFile(filename);
        String contentType = "application/octet-stream";
        try {
            contentType = resource.getURL().toString().toLowerCase().endsWith(".pdf") ? MediaType.APPLICATION_PDF_VALUE : contentType;
        } catch (IOException ignored) {
            // Fallback to octet-stream.
        }

        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
            .contentType(MediaType.parseMediaType(contentType))
            .body(resource);
    }

    @PutMapping("/conversations/{destinataireId}/lu")
    public ResponseEntity<MessengerReadResponse> markAsRead(@PathVariable Long destinataireId) {
        return ResponseEntity.ok(messengerService.markConversationAsRead(destinataireId));
    }

    @GetMapping("/utilisateurs")
    public ResponseEntity<List<MessengerUserResponse>> getAuthorizedUsers(@RequestParam(required = false) String search) {
        return ResponseEntity.ok(messengerService.getAuthorizedUsers(search));
    }

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream() {
        Long currentUserId = authenticatedUserService.getCurrentUser().getId();
        if (currentUserId == null) {
            throw new com.logiway.exceptions.UnauthorizedException("User id is missing");
        }
        return messengerRealtimeService.register(currentUserId);
    }

    @PostMapping("/presence")
    public ResponseEntity<MessengerPresenceResponse> heartbeat() {
        return ResponseEntity.ok(messengerService.heartbeat());
    }

    @PostMapping("/presence/disconnect")
    public ResponseEntity<MessengerPresenceResponse> disconnectPresence() {
        messengerService.disconnectPresence();
        return ResponseEntity.ok(new MessengerPresenceResponse(authenticatedUserService.getCurrentUser().getId(), false, java.time.LocalDateTime.now()));
    }
}