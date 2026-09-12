package com.logiway.dto.request;

import jakarta.validation.constraints.NotBlank;

public record CreateEntrepriseRequest(
    @NotBlank String nomEntreprise,
    String emailEntreprise,
    String adresseEntreprise,
    String numeroEntreprise,
    String codeTVA,
    String representantLegal,
    String documentJustificatif,
    String secteurActivite,
    Integer tailleFlotte,
    String image,
    Long managerOwnerId,
    String statut
) {
}
