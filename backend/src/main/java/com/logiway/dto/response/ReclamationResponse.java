package com.logiway.dto.response;

import com.logiway.entities.enums.PrioriteReclamation;
import com.logiway.entities.enums.StatutReclamation;
import lombok.Value;

import java.time.LocalDateTime;

@Value
public class ReclamationResponse {
    Long id;
    String sujet;
    String description;
    PrioriteReclamation priorite;
    StatutReclamation statut;
    String commentaireResolution;
    Long utilisateurId;
    String utilisateurNom;
    String utilisateurEmail;
    LocalDateTime dateCreation;
}
