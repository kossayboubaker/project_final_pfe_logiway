package com.logiway.utils;

import com.logiway.entities.enums.TypeNotif;

import java.util.Locale;

public final class NotificationToneResolver {

    private NotificationToneResolver() {
    }

    public static String resolve(TypeNotif type, String message) {
        if (message == null) {
            return null;
        }

        String normalized = message.toLowerCase(Locale.ROOT);
        if (type == TypeNotif.NOTIF_ENTREPRISE) {
            // Status-driven color policy for company lifecycle notifications.
            if (containsAny(normalized, "statut: actif", " a ete validee", " est active", " passe a actif", "passer a actif", "status: actif")) {
                return "SUCCESS";
            }
            if (containsAny(normalized, "en attente", "en_attente", "attente de validation", "passer a en_attente", "statut: en attente", "status: en attente")) {
                return "WARNING";
            }
            if (containsAny(normalized, "inactif", "suspendu", "suspend", "desactive", "désactive", "bloque", "bloqué", "statut: inactif", "statut: suspendu", "status: inactif", "status: suspendu")) {
                return "DANGER";
            }

            if (normalized.contains("supprim") || normalized.contains("delete")) {
                return "DANGER";
            }
            if (normalized.contains("affect") || normalized.contains("cre") || normalized.contains("cré") || normalized.contains("modifi") || normalized.contains("mise a jour") || normalized.contains("mise à jour")) {
                return "SUCCESS";
            }
            return "INFO";
        }

        if (type == TypeNotif.NOTIF_AFFECTATION) {
            // Driver assignment/reassignment notifications color policy.
            if (containsAny(normalized, "supprimé", "supprime", "retiré", "retire", "désaffecté", "desaffecte", "retiree")) {
                return "DANGER";
            }
            if (containsAny(normalized, "réassigné", "reassigne", "transféré", "transfere", "changé", "change")) {
                return "INFO";
            }
            if (containsAny(normalized, "assigné", "assigne", "reçu", "recu", "charge", "affecté", "affecte")) {
                return "SUCCESS";
            }
            return "INFO";
        }

        if (type == TypeNotif.NOTIF_VEHICULE) {
            if (containsAny(normalized, "supprim", "delete", "archive", "archiv")) {
                return "DANGER";
            }
            if (containsAny(normalized, "maintenance", "en panne", "hors service", "panne")) {
                return "WARNING";
            }
            if (containsAny(normalized, "affect", "assign", "attrib", "transfer", "transfér", "modifi", "mise a jour", "mise à jour")) {
                return "SUCCESS";
            }
            return "INFO";
        }

        if (type == TypeNotif.NOTIF_CONGE) {
            if (containsAny(normalized, "rejet", "refus", "annul", "supprim")) {
                return "DANGER";
            }
            if (containsAny(normalized, "approuv", "valid", "accept", "confirm")) {
                return "SUCCESS";
            }
            if (containsAny(normalized, "nouvelle demande", "demande de congé", "mise a jour", "mise à jour", "modifi")) {
                return "WARNING";
            }
            return "INFO";
        }

        if (type != TypeNotif.NOTIF_COMPTE) {
            return null;
        }

        if (normalized.contains("rejet")) {
            return "DANGER";
        }
        if (normalized.contains("inactif") || normalized.contains("desactiv") || normalized.contains("désactiv")) {
            return "WARNING";
        }
        if (normalized.contains("en attente")) {
            return "WARNING";
        }
        if (normalized.contains("reactiv") || normalized.contains("réactiv")) {
            return "INFO";
        }
        if (normalized.contains("activ")) {
            return "SUCCESS";
        }
        return "INFO";
    }

    private static boolean containsAny(String normalized, String... needles) {
        for (String needle : needles) {
            if (normalized.contains(needle)) {
                return true;
            }
        }
        return false;
    }
}