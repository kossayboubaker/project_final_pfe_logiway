package com.logiway.services;

import com.logiway.entities.Utilisateur;

public interface MailService {

    void sendActivationEmail(Utilisateur user, String temporaryPassword);

    void sendResetCodeEmail(Utilisateur user, String code);

    void sendAccountActivationConfirmationEmail(Utilisateur user);

    void sendAccountRejectionEmail(Utilisateur user, String rejectionReason);

    void sendAccountReactivationEmail(Utilisateur user);

    void sendAccountDeactivationEmail(Utilisateur user);

    void sendCompanyNotificationEmail(Utilisateur user, String subject, String headline, String bodyText, String companySummary);

    void sendSectorNotificationEmail(Utilisateur user, String subject, String headline, String bodyText, String sectorSummary);
}
