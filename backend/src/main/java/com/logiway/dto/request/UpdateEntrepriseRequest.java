package com.logiway.dto.request;

public record UpdateEntrepriseRequest(
    String nomEntreprise,
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
