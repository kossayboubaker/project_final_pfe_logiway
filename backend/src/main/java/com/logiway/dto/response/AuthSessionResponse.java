package com.logiway.dto.response;

public record AuthSessionResponse(
    String role,
    String prenom,
    String nom,
    boolean firstLogin,
    boolean hasCompany
) {
}