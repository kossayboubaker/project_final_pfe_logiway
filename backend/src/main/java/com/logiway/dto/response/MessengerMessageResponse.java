package com.logiway.dto.response;

import com.logiway.entities.enums.MessengerMessageStatus;
import com.logiway.entities.enums.MessengerMessageType;
import com.logiway.entities.enums.Role;

import java.time.LocalDateTime;

public record MessengerMessageResponse(
    Long id,
    Long expediteurId,
    String expediteurPrenom,
    String expediteurNom,
    String expediteurEmail,
    String expediteurImage,
    Role expediteurRole,
    Long destinataireId,
    String destinatairePrenom,
    String destinataireNom,
    String destinataireEmail,
    String destinataireImage,
    Role destinataireRole,
    MessengerMessageType type,
    String contenu,
    String cheminFichier,
    String nomFichierOriginal,
    Long tailleFichier,
    Integer dureeVocale,
    MessengerMessageStatus statut,
    LocalDateTime dateEnvoi,
    LocalDateTime dateLecture,
    Boolean modifie,
    LocalDateTime dateModification,
    String contenuOriginal,
    Boolean supprime,
    LocalDateTime dateSuppression,
    Boolean connecte,
    LocalDateTime derniereActivite,
    String fichierUrl,
    String heureEnvoi
) {
}