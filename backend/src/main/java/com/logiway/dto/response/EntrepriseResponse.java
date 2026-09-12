package com.logiway.dto.response;

import com.logiway.entities.enums.StatutEntreprise;

import java.time.LocalDateTime;

public record EntrepriseResponse(
    Long id,
    String nomEntreprise,
    String emailEntreprise,
    String adresseEntreprise,
    String numeroEntreprise,
    String codeTVA,
    String representantLegal,
    String documentJustificatif,
    String secteurActivite,
    String image,
    Integer tailleFlotte,
    StatutEntreprise statut,
    Long managerOwnerId,
    String managerOwnerName,
    LocalDateTime dateCreation,
    Integer activeMissions
) {
}
