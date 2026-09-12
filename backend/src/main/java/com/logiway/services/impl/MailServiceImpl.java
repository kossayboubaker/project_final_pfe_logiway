package com.logiway.services.impl;

import com.logiway.entities.Utilisateur;
import com.logiway.entities.Chauffeur;
import com.logiway.entities.Manager;
import com.logiway.services.MailService;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class MailServiceImpl implements MailService {

  private final JavaMailSender mailSender;

  @Value("${app.mail.from}")
  private String from;

  @Value("${app.frontend-url}")
  private String frontendUrl;

  @Override
  public void sendActivationEmail(Utilisateur user, String temporaryPassword) {
    String loginUrl = frontendUrl + "/auth/signin";
    String managerName = "Aucun";
    if (user instanceof Chauffeur chauffeur && chauffeur.getManager() != null) {
      Manager manager = chauffeur.getManager();
      managerName = safe(manager.getPrenom()) + " " + safe(manager.getNom());
    }

    String body = """
        <html>
          <body style='font-family: Arial, sans-serif; background:#f5f6fa; padding:24px;'>
            <table style='max-width:700px; margin:auto; background:#ffffff; border-radius:12px; overflow:hidden;'>
              <tr><td style='background:#0f172a; color:#ffffff; padding:16px 24px;'><h2 style='margin:0;'>Bienvenue - Activation de votre compte</h2></td></tr>
              <tr><td style='padding:24px;'>
                <p>Bonjour %s %s,</p>
                <p>Votre compte a ete cree par un administrateur.</p>
                <div style='background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:16px;'>
                  <p><strong>Nom complet:</strong> %s %s</p>
                  <p><strong>Email:</strong> %s</p>
                  <p><strong>Mot de passe temporaire:</strong> %s</p>
                  <p><strong>Role:</strong> %s</p>
                  <p><strong>Telephone:</strong> %s</p>
                  <p><strong>Manager:</strong> %s</p>
                </div>
                <p style='margin-top:20px;'>
                  <a href='%s' style='display:inline-block; background:#2563eb; color:#fff; text-decoration:none; padding:10px 16px; border-radius:6px;'>Acceder a mon compte</a>
                </p>
                <p style='color:#b91c1c;'>Pour votre securite, modifiez votre mot de passe des la premiere connexion.</p>
                <hr/>
                <p style='font-size:12px; color:#64748b;'>Support: support@logiway.com | LogiWay</p>
              </td></tr>
            </table>
          </body>
        </html>
        """
        .formatted(
            safe(user.getPrenom()),
            safe(user.getNom()),
            safe(user.getPrenom()),
            safe(user.getNom()),
            safe(user.getEmail()),
            safe(temporaryPassword),
            safe(user.getRole().name()),
            safe(user.getTelephone()),
            safe(managerName),
            loginUrl);

    sendHtml(user.getEmail(), "Bienvenue - Activation de votre compte", body);
  }

  @Override
  public void sendResetCodeEmail(Utilisateur user, String code) {
    String body = """
        <html>
          <body style='font-family: Arial, sans-serif; background:#f5f6fa; padding:24px;'>
            <table style='max-width:600px; margin:auto; background:#ffffff; border-radius:12px; padding:20px;'>
              <h3>Code de reinitialisation</h3>
              <p>Bonjour %s %s,</p>
              <p>Utilisez ce code pour reinitialiser votre mot de passe (valide 15 minutes):</p>
              <p style='font-size:24px; letter-spacing:3px; font-weight:bold;'>%s</p>
            </table>
          </body>
        </html>
        """.formatted(safe(user.getPrenom()), safe(user.getNom()), safe(code));

    sendHtml(user.getEmail(), "Code de reinitialisation", body);
  }

  @Override
  public void sendAccountActivationConfirmationEmail(Utilisateur user) {
    String body = """
        <html>
          <body style='font-family: Arial, sans-serif; background:#f5f6fa; padding:24px;'>
            <table style='max-width:700px; margin:auto; background:#ffffff; border-radius:12px; overflow:hidden;'>
              <tr><td style='background:#10b981; color:#ffffff; padding:16px 24px;'><h2 style='margin:0;'>Compte Activé</h2></td></tr>
              <tr><td style='padding:24px;'>
                <p>Bonjour %s %s,</p>
                <p>Votre compte a ete active avec succes!</p>
                <div style='background:#f0fdf4; border:1px solid #86efac; border-radius:8px; padding:16px; margin:20px 0;'>
                  <p style='margin:0; color:#166534;'><strong>✓ Votre email</strong> %s <strong>est maintenant verifie et votre compte est opérationnel.</strong></p>
                </div>
                <p>Vous pouvez maintenant utiliser toutes les fonctionnalités de LogiWay avec votre compte.</p>
                <p style='color:#b91c1c;'>Si vous n'avez pas activé ce compte ou si vous avez des questions, contactez support@logiway.com</p>
                <hr/>
                <p style='font-size:12px; color:#64748b;'>Support: support@logiway.com | LogiWay</p>
              </td></tr>
            </table>
          </body>
        </html>
        """
        .formatted(safe(user.getPrenom()), safe(user.getNom()), safe(user.getEmail()));

    sendHtml(user.getEmail(), "Votre compte a ete active", body);
  }

  @Override
  public void sendAccountRejectionEmail(Utilisateur user, String rejectionReason) {
    String body = """
        <html>
          <body style='font-family: Arial, sans-serif; background:#f5f6fa; padding:24px;'>
            <table style='max-width:700px; margin:auto; background:#ffffff; border-radius:12px; overflow:hidden;'>
              <tr><td style='background:#dc2626; color:#ffffff; padding:16px 24px;'><h2 style='margin:0;'>Compte Rejete</h2></td></tr>
              <tr><td style='padding:24px;'>
                <p>Bonjour %s %s,</p>
                <p>Votre compte a ete rejete par un administrateur.</p>
                <div style='background:#fef2f2; border:1px solid #fecaca; border-radius:8px; padding:16px; margin:20px 0;'>
                  <p style='margin:0 0 8px 0; color:#991b1b;'><strong>Raison du rejet:</strong></p>
                  <p style='margin:0; color:#7f1d1d;'>%s</p>
                </div>
                <p>Pour plus d'informations, veuillez contacter le support ou votre administrateur.</p>
                <hr/>
                <p style='font-size:12px; color:#64748b;'>Support: support@logiway.com | LogiWay</p>
              </td></tr>
            </table>
          </body>
        </html>
        """
        .formatted(
            safe(user.getPrenom()),
            safe(user.getNom()),
            safe(rejectionReason));

    sendHtml(user.getEmail(), "Votre compte a ete rejete", body);
  }

  @Override
  public void sendAccountReactivationEmail(Utilisateur user) {
    String body = """
        <html>
          <body style='font-family: Arial, sans-serif; background:#f5f6fa; padding:24px;'>
            <table style='max-width:700px; margin:auto; background:#ffffff; border-radius:12px; overflow:hidden;'>
              <tr><td style='background:#2563eb; color:#ffffff; padding:16px 24px;'><h2 style='margin:0;'>Compte Réactivé</h2></td></tr>
              <tr><td style='padding:24px;'>
                <p>Bonjour %s %s,</p>
                <p>Votre compte a ete reactivé avec succes.</p>
                <div style='background:#eff6ff; border:1px solid #bfdbfe; border-radius:8px; padding:16px; margin:20px 0;'>
                  <p style='margin:0; color:#1e3a8a;'><strong>Votre compte est à nouveau actif et vous pouvez vous reconnecter normalement.</strong></p>
                </div>
                <p>Si vous avez des questions, veuillez contacter le support ou votre administrateur.</p>
                <hr/>
                <p style='font-size:12px; color:#64748b;'>Support: support@logiway.com | LogiWay</p>
              </td></tr>
            </table>
          </body>
        </html>
        """
        .formatted(safe(user.getPrenom()), safe(user.getNom()));

    sendHtml(user.getEmail(), "Votre compte a ete reactiver", body);
  }

  @Override
  public void sendAccountDeactivationEmail(Utilisateur user) {
    String body = """
        <html>
          <body style='font-family: Arial, sans-serif; background:#f5f6fa; padding:24px;'>
            <table style='max-width:700px; margin:auto; background:#ffffff; border-radius:12px; overflow:hidden;'>
              <tr><td style='background:#f59e0b; color:#ffffff; padding:16px 24px;'><h2 style='margin:0;'>Compte Inactif</h2></td></tr>
              <tr><td style='padding:24px;'>
                <p>Bonjour %s %s,</p>
                <p>Votre compte est passe au statut inactif (en attente).</p>
                <div style='background:#fffbeb; border:1px solid #fde68a; border-radius:8px; padding:16px; margin:20px 0;'>
                  <p style='margin:0; color:#92400e;'><strong>Votre acces est temporairement suspendu jusqu'a reactivation par un administrateur.</strong></p>
                </div>
                <p>Pour plus d'informations, veuillez contacter le support ou votre administrateur.</p>
                <hr/>
                <p style='font-size:12px; color:#64748b;'>Support: support@logiway.com | LogiWay</p>
              </td></tr>
            </table>
          </body>
        </html>
        """
        .formatted(safe(user.getPrenom()), safe(user.getNom()));

    sendHtml(user.getEmail(), "Votre compte est inactif", body);
  }

  @Override
  public void sendCompanyNotificationEmail(Utilisateur user, String subject, String headline, String bodyText, String companySummary) {
    String status = extractCompanyStatus(companySummary, bodyText, headline);
    String headerColor = resolveHeaderColor(status);
    String cardBackground = resolveCardBackground(status);
    String cardBorder = resolveCardBorder(status);
    String body = """
        <html>
          <body style='font-family: Arial, sans-serif; background:#f5f6fa; padding:24px;'>
            <table style='max-width:700px; margin:auto; background:#ffffff; border-radius:12px; overflow:hidden;'>
              <tr><td style='background:%s; color:#ffffff; padding:16px 24px;'><h2 style='margin:0;'>%s</h2></td></tr>
              <tr><td style='padding:24px;'>
                <p>Bonjour %s %s,</p>
                <p>%s</p>
                <div style='background:%s; border:1px solid %s; border-radius:8px; padding:16px; margin:20px 0;'>
                  <pre style='margin:0; white-space:pre-wrap; font-family:inherit;'>%s</pre>
                </div>
                <hr/>
                <p style='font-size:12px; color:#64748b;'>Support: support@logiway.com | LogiWay</p>
              </td></tr>
            </table>
          </body>
        </html>
        """.formatted(
        headerColor,
        headline,
        safe(user.getPrenom()),
        safe(user.getNom()),
        bodyText,
        cardBackground,
        cardBorder,
        companySummary
    );

    sendHtml(user.getEmail(), subject, body);
  }

  @Override
  public void sendSectorNotificationEmail(Utilisateur user, String subject, String headline, String bodyText, String sectorSummary) {
    String status = extractCompanyStatus(sectorSummary, bodyText, headline);
    String headerColor = resolveHeaderColor(status);
    String cardBackground = resolveCardBackground(status);
    String cardBorder = resolveCardBorder(status);
    String body = """
        <html>
          <body style='font-family: Arial, sans-serif; background:#f5f6fa; padding:24px;'>
            <table style='max-width:700px; margin:auto; background:#ffffff; border-radius:12px; overflow:hidden;'>
              <tr><td style='background:%s; color:#ffffff; padding:16px 24px;'><h2 style='margin:0;'>%s</h2></td></tr>
              <tr><td style='padding:24px;'>
                <p>Bonjour %s %s,</p>
                <p>%s</p>
                <div style='background:%s; border:1px solid %s; border-radius:8px; padding:16px; margin:20px 0;'>
                  <pre style='margin:0; white-space:pre-wrap; font-family:inherit;'>%s</pre>
                </div>
                <hr/>
                <p style='font-size:12px; color:#64748b;'>Support: support@logiway.com | LogiWay</p>
              </td></tr>
            </table>
          </body>
        </html>
        """.formatted(
        headerColor,
        headline,
        safe(user.getPrenom()),
        safe(user.getNom()),
        bodyText,
        cardBackground,
        cardBorder,
        sectorSummary
    );

    sendHtml(user.getEmail(), subject, body);
  }

  private void sendHtml(String to, String subject, String html) {
    try {
      MimeMessage mimeMessage = mailSender.createMimeMessage();
      MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
      helper.setFrom(from);
      helper.setTo(to);
      helper.setSubject(subject);
      helper.setText(html, true);
      mailSender.send(mimeMessage);
    } catch (MessagingException ex) {
      throw new IllegalStateException("Unable to send email: " + ex.getMessage(), ex);
    }
  }

  private String safe(String value) {
    return value == null ? "" : value;
  }

  private String extractCompanyStatus(String companySummary, String bodyText, String headline) {
    String merged = ((companySummary == null ? "" : companySummary) + "\n" + (bodyText == null ? "" : bodyText) + "\n" + (headline == null ? "" : headline)).toUpperCase();
    if (merged.contains("SUSPENDU")) {
      return "SUSPENDU";
    }
    if (merged.contains("INACTIF")) {
      return "INACTIF";
    }
    if (merged.contains("EN ATTENTE") || merged.contains("EN_ATTENTE")) {
      return "EN_ATTENTE";
    }
    if (merged.contains("ACTIF") || merged.contains("VALIDE")) {
      return "ACTIF";
    }
    return "INFO";
  }

  private String resolveHeaderColor(String status) {
    return switch (status) {
      case "ACTIF" -> "#16a34a";
      case "EN_ATTENTE" -> "#f59e0b";
      case "INACTIF", "SUSPENDU" -> "#dc2626";
      default -> "#2563eb";
    };
  }

  private String resolveCardBackground(String status) {
    return switch (status) {
      case "ACTIF" -> "#f0fdf4";
      case "EN_ATTENTE" -> "#fffbeb";
      case "INACTIF", "SUSPENDU" -> "#fef2f2";
      default -> "#f8fafc";
    };
  }

  private String resolveCardBorder(String status) {
    return switch (status) {
      case "ACTIF" -> "#86efac";
      case "EN_ATTENTE" -> "#fde68a";
      case "INACTIF", "SUSPENDU" -> "#fecaca";
      default -> "#e2e8f0";
    };
  }
}
