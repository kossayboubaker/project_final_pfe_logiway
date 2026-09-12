package com.logiway.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportMetadataResponse {
    
    private String reportId;
    private String titre;
    private String format;
    private String domaine;
    private String statut;
    private String userId;
    private String entrepriseId;
    private LocalDateTime dateCreation;
    private LocalDateTime dateDebutDonnees;
    private LocalDateTime dateFinDonnees;
    private Integer tailleFichierKo;
    private String urlTelechargement;
    private Integer nbLignes;
    private Integer tempsGenerationMs;
    private String erreur;
}
