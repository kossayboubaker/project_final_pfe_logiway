package com.logiway.dto.response;

import com.logiway.entities.enums.Role;
import com.logiway.entities.enums.StatutConge;
import com.logiway.entities.enums.TypeConge;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record CongeResponse(
    Long id,
    TypeConge type,
    LocalDate dateDebut,
    LocalDate dateFin,
    Integer periode,
    String motif,
    StatutConge statut,
    String commentaireValidation,
    Long requesterId,
    String requesterNom,
    String requesterEmail,
    Role requesterRole,
    Long managerId,
    String managerNom,
    String managerEmail,
    Long chauffeurId,
    String chauffeurNom,
    String chauffeurEmail,
    LocalDateTime dateCreation,
    LocalDateTime dateMiseAJour
) {
}