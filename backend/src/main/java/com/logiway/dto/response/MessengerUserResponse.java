package com.logiway.dto.response;

import com.logiway.entities.enums.Role;

import java.time.LocalDateTime;

public record MessengerUserResponse(
    Long id,
    String prenom,
    String nom,
    String email,
    String image,
    Role role,
    Boolean connecte,
    LocalDateTime derniereActivite,
    String dernierMessage,
    LocalDateTime dateDernierMessage,
    Long messagesNonLus
) {
}