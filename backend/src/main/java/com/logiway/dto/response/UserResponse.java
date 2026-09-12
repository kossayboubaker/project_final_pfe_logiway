package com.logiway.dto.response;

import com.logiway.entities.enums.Role;
import com.logiway.entities.enums.StatutChauffeur;
import com.logiway.entities.enums.StatutCompte;

import java.time.LocalDateTime;

public record UserResponse(
    Long id,
    String keycloakId,
    String prenom,
    String nom,
    String email,
    String telephone,
    String pays,
    String image,
    StatutCompte estActif,
    Boolean actif,
    Boolean emailVerifie,
    String rejectionReason,
    Role role,
    StatutChauffeur statutConducteur,
    Long managerId,
    String managerPrenom,
    String managerNom,

    Long entrepriseId,
    String entrepriseNom,
    Long secteurId,
    String secteurNom,
    LocalDateTime dateCreation
) {
}
