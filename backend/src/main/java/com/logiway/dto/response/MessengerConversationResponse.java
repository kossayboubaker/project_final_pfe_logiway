package com.logiway.dto.response;

import com.logiway.entities.enums.MessengerMessageType;
import com.logiway.entities.enums.Role;

import java.time.LocalDateTime;

public record MessengerConversationResponse(
    Long destinataireId,
    String prenom,
    String nom,
    String email,
    String image,
    Role role,
    Boolean connecte,
    LocalDateTime derniereActivite,
    MessengerMessageType dernierType,
    String dernierMessage,
    LocalDateTime dateDernierMessage,
    Long messagesNonLus
) {
}