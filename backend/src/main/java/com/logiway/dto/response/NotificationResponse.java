package com.logiway.dto.response;

import com.logiway.entities.enums.TypeNotif;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

public record NotificationResponse(
    Long id,
    TypeNotif type,
    String message,
    LocalDateTime dateCreation,
    Boolean estLu,
    String tone
) {
    public String getFormattedTime() {
        if (dateCreation == null) return "À l'instant";
        
        long seconds = ChronoUnit.SECONDS.between(dateCreation, LocalDateTime.now());
        long minutes = ChronoUnit.MINUTES.between(dateCreation, LocalDateTime.now());
        long hours = ChronoUnit.HOURS.between(dateCreation, LocalDateTime.now());
        long days = ChronoUnit.DAYS.between(dateCreation, LocalDateTime.now());
        
        if (seconds < 60) return "À l'instant";
        if (minutes < 60) return "Il y a " + minutes + " min";
        if (hours < 24) return "Il y a " + hours + "h";
        if (days == 1) return "Hier";
        if (days < 7) return "Il y a " + days + " jours";
        
        return dateCreation.toString();
    }
    
    public String getNotificationTitle() {
        if (type == null) {
            return "Notification";
        }

        return switch(type) {
            case NOTIF_COMPTE -> "Compte";
            case NOTIF_TRAJET -> "Trajet";
            case NOTIF_CONGE -> "Congé";
            case NOTIF_RECLAMATION -> "Réclamation";
            case NOTIF_MESSAGE -> "Message";
            case NOTIF_ENTREPRISE -> "Entreprise";
            case NOTIF_AFFECTATION -> "Affectation";
            case NOTIF_VEHICULE -> "Camion";
            case SECTEUR -> "Secteur";
            default -> "Notification";
        };
    }
}
