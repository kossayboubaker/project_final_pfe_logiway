package com.logiway.mappers;

import com.logiway.dto.response.UserResponse;
import com.logiway.entities.Chauffeur;
import com.logiway.entities.Manager;
import com.logiway.entities.Utilisateur;
import com.logiway.entities.enums.StatutChauffeur;
import com.logiway.entities.enums.StatutCompte;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

    public UserResponse toResponse(Utilisateur utilisateur) {
        Long managerId = null;
        String managerPrenom = null;
        String managerNom = null;
        Long secteurId = null;
        String secteurNom = null;
        StatutChauffeur statutConducteur = null;
        
        if (utilisateur instanceof Chauffeur chauffeur) {
            // Manager direct du chauffeur
            if (chauffeur.getManager() != null) {
                managerId = chauffeur.getManager().getId();
                managerPrenom = chauffeur.getManager().getPrenom();
                managerNom = chauffeur.getManager().getNom();
            }
            statutConducteur = chauffeur.getStatutConducteur();
            if (chauffeur.getSecteur() != null) {
                secteurId = chauffeur.getSecteur().getId();
                secteurNom = chauffeur.getSecteur().getNom();
            }
        } else if (utilisateur instanceof Manager manager && manager.getSecteur() != null) {
            secteurId = manager.getSecteur().getId();
            secteurNom = manager.getSecteur().getNom();
        }

        return new UserResponse(
            utilisateur.getId(),
            utilisateur.getKeycloakId(),
            utilisateur.getPrenom(),
            utilisateur.getNom(),
            utilisateur.getEmail(),
            utilisateur.getTelephone(),
            utilisateur.getPays(),
            utilisateur.getImage(),
            utilisateur.getEstActif(),
            utilisateur.getEstActif() == StatutCompte.ACTIF,
            utilisateur.getEmailVerifie(),
            utilisateur.getRejectionReason(),
            utilisateur.getRole(),
            statutConducteur,
            managerId,
            managerPrenom,
            managerNom,
            utilisateur.getEntreprise() != null ? utilisateur.getEntreprise().getId() : null,
            utilisateur.getEntreprise() != null ? utilisateur.getEntreprise().getNomEntreprise() : null,
            secteurId,
            secteurNom,
            utilisateur.getDateCreation()
        );
    }
}
