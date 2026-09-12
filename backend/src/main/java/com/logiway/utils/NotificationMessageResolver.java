package com.logiway.utils;

import com.logiway.entities.Notification;
import com.logiway.entities.Utilisateur;
import com.logiway.entities.enums.TypeNotif;

import java.util.regex.Matcher;

public final class NotificationMessageResolver {

    private NotificationMessageResolver() {
    }

    public static String resolveForRecipient(Utilisateur recipient, Notification notification) {
        if (notification == null || notification.getMessage() == null) {
            return "";
        }

        String originalMessage = notification.getMessage();
        Utilisateur targetUser = notification.getUtilisateur();
        
        if (recipient == null || targetUser == null) {
            return originalMessage;
        }

        if (recipient.getId() != null && recipient.getId().equals(targetUser.getId())) {
            return originalMessage;
        }

        if (notification.getType() == TypeNotif.NOTIF_CONGE) {
            return resolveLeaveMessageForRecipient(originalMessage, targetUser);
        }

        String targetLabel = resolveUserLabel(targetUser);
        if (notification.getType() == TypeNotif.NOTIF_COMPTE) {
            return replaceLeadingVotreCompte(originalMessage, "Le compte " + targetLabel);
        }

        return "Utilisateur " + targetLabel + " : " + originalMessage;
    }

    private static String resolveLeaveMessageForRecipient(String originalMessage, Utilisateur targetUser) {
        String targetLabel = resolveUserLabel(targetUser);

        if (originalMessage == null || originalMessage.isBlank()) {
            return "Congé de " + targetLabel;
        }

        String normalized = originalMessage.trim();
        if (normalized.matches("(?i)^votre demande de congé.*")) {
            return normalized.replaceFirst("(?i)^votre demande de congé", "Demande de congé de " + targetLabel);
        }

        if (normalized.matches("(?i)^votre demande.*")) {
            return normalized.replaceFirst("(?i)^votre demande", "Demande de congé de " + targetLabel);
        }

        if (normalized.matches("(?i)^votre congé.*")) {
            return normalized.replaceFirst("(?i)^votre congé", "Congé de " + targetLabel);
        }

        if (normalized.matches("(?i)^demande de congé.*") || normalized.matches("(?i)^nouvelle demande de congé.*")) {
            return normalized;
        }

        if (normalized.matches("(?i)^congé.*") || normalized.matches("(?i)^le congé.*")) {
            return normalized;
        }

        return "Congé de " + targetLabel + " : " + normalized;
    }

    private static String replaceLeadingVotreCompte(String message, String replacement) {
        if (message == null || message.isBlank()) {
            return replacement;
        }

        if (message.matches("(?i)^votre compte.*")) {
            return message.replaceFirst("(?i)^votre compte", Matcher.quoteReplacement(replacement));
        }

        return replacement + " : " + message;
    }

    private static String resolveUserLabel(Utilisateur user) {
        String fullName = ((safe(user.getPrenom()) + " " + safe(user.getNom())).trim());
        if (!fullName.isBlank()) {
            return fullName;
        }

        if (user.getEmail() != null && !user.getEmail().isBlank()) {
            return user.getEmail();
        }

        return "#" + user.getId();
    }

    private static String safe(String value) {
        return value == null ? "" : value;
    }
}