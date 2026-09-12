package com.logiway.dto.response;

public record AvailableDriverResponse(
    Long id,
    String prenom,
    String nom,
    String email
) {
    public String fullName() {
        String name = (prenom != null ? prenom : "") + " " + (nom != null ? nom : "");
        return name.trim().isEmpty() ? (email != null ? email : "#" + id) : name.trim();
    }
}
