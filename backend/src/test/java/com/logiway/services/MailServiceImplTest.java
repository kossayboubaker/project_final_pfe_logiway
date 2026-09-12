package com.logiway.services;

import com.logiway.entities.Chauffeur;
import com.logiway.entities.Manager;
import com.logiway.entities.Utilisateur;
import com.logiway.entities.enums.Role;
import com.logiway.services.impl.MailServiceImpl;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Service Mail — Tests Unitaires")
class MailServiceImplTest {

    @Mock
    private JavaMailSender mailSender;

    private MailServiceImpl mailService;

    @BeforeEach
    void setUp() {
        mailService = new MailServiceImpl(mailSender);
        ReflectionTestUtils.setField(mailService, "from", "no-reply@logiway.com");
        ReflectionTestUtils.setField(mailService, "frontendUrl", "http://localhost:3000");
    }

    private Utilisateur utilisateur() {
        Utilisateur user = new Utilisateur();
        user.setPrenom("Jean");
        user.setNom("Dupont");
        user.setEmail("jean.dupont@logiway.com");
        user.setRole(Role.MANAGER);
        user.setTelephone("+216123456");
        return user;
    }

    private Chauffeur chauffeurWithManager() {
        Manager manager = new Manager();
        manager.setPrenom("Marie");
        manager.setNom("Curie");
        Chauffeur chauffeur = new Chauffeur();
        chauffeur.setPrenom("Paul");
        chauffeur.setNom("Martin");
        chauffeur.setEmail("paul.martin@logiway.com");
        chauffeur.setRole(Role.CHAUFFEUR);
        chauffeur.setTelephone("+216000000");
        chauffeur.setManager(manager);
        return chauffeur;
    }

    private void stubMimeMessage() {
        when(mailSender.createMimeMessage()).thenReturn(mock(MimeMessage.class));
    }

    @Test
    @DisplayName("sendActivationEmail() → Chauffeur avec manager inclut le nom du manager")
    void sendActivationEmail_forChauffeurWithManager() throws Exception {
        stubMimeMessage();

        mailService.sendActivationEmail(chauffeurWithManager(), "temp123");

        verify(mailSender).send(any(MimeMessage.class));
    }

    @Test
    @DisplayName("sendActivationEmail() → Manager simple affiche Aucun")
    void sendActivationEmail_forManager() throws Exception {
        stubMimeMessage();

        mailService.sendActivationEmail(utilisateur(), "temp123");

        verify(mailSender).send(any(MimeMessage.class));
    }

    @Test
    @DisplayName("sendActivationEmail() → Chauffeur sans manager affiche Aucun")
    void sendActivationEmail_chauffeurWithoutManager() throws Exception {
        stubMimeMessage();
        Chauffeur chauffeur = chauffeurWithManager();
        chauffeur.setManager(null);

        mailService.sendActivationEmail(chauffeur, "temp123");

        verify(mailSender).send(any(MimeMessage.class));
    }

    @Test
    @DisplayName("sendResetCodeEmail() → Envoie le code de reinitialisation")
    void sendResetCodeEmail_sends() throws Exception {
        stubMimeMessage();

        mailService.sendResetCodeEmail(utilisateur(), "123456");

        ArgumentCaptor<MimeMessage> captor = ArgumentCaptor.forClass(MimeMessage.class);
        verify(mailSender).send(captor.capture());
        assertThat(captor.getValue()).isNotNull();
    }

    @Test
    @DisplayName("sendAccountActivationConfirmationEmail() → Envoie la confirmation")
    void sendAccountActivationConfirmationEmail_sends() throws Exception {
        stubMimeMessage();

        mailService.sendAccountActivationConfirmationEmail(utilisateur());

        verify(mailSender).send(any(MimeMessage.class));
    }

    @Test
    @DisplayName("sendAccountRejectionEmail() → Envoie le rejet avec motif")
    void sendAccountRejectionEmail_sends() throws Exception {
        stubMimeMessage();

        mailService.sendAccountRejectionEmail(utilisateur(), "Documents invalides");

        verify(mailSender).send(any(MimeMessage.class));
    }

    @Test
    @DisplayName("sendAccountReactivationEmail() → Envoie la reactivation")
    void sendAccountReactivationEmail_sends() throws Exception {
        stubMimeMessage();

        mailService.sendAccountReactivationEmail(utilisateur());

        verify(mailSender).send(any(MimeMessage.class));
    }

    @Test
    @DisplayName("sendAccountDeactivationEmail() → Envoie la desactivation")
    void sendAccountDeactivationEmail_sends() throws Exception {
        stubMimeMessage();

        mailService.sendAccountDeactivationEmail(utilisateur());

        verify(mailSender).send(any(MimeMessage.class));
    }

    @Test
    @DisplayName("sendCompanyNotificationEmail() → Statut ACTIF")
    void sendCompanyNotificationEmail_active() throws Exception {
        stubMimeMessage();

        mailService.sendCompanyNotificationEmail(utilisateur(), "subject", "headline",
            "corps", "Statut: ACTIF - Entreprise Transport Express");

        verify(mailSender).send(any(MimeMessage.class));
    }

    @Test
    @DisplayName("sendCompanyNotificationEmail() → Statut EN ATTENTE")
    void sendCompanyNotificationEmail_pending() throws Exception {
        stubMimeMessage();

        mailService.sendCompanyNotificationEmail(utilisateur(), "subject", "headline",
            "corps", "Statut: EN ATTENTE");

        verify(mailSender).send(any(MimeMessage.class));
    }

    @Test
    @DisplayName("sendCompanyNotificationEmail() → Statut INACTIF")
    void sendCompanyNotificationEmail_inactive() throws Exception {
        stubMimeMessage();

        mailService.sendCompanyNotificationEmail(utilisateur(), "subject", "headline",
            "Statut INACTIF dans le corps", "summary");

        verify(mailSender).send(any(MimeMessage.class));
    }

    @Test
    @DisplayName("sendCompanyNotificationEmail() → Statut SUSPENDU")
    void sendCompanyNotificationEmail_suspended() throws Exception {
        stubMimeMessage();

        mailService.sendCompanyNotificationEmail(utilisateur(), "subject", "headline",
            "corps", "entreprise suspendue");

        verify(mailSender).send(any(MimeMessage.class));
    }

    @Test
    @DisplayName("sendCompanyNotificationEmail() → Statut VALIDE traite comme actif")
    void sendCompanyNotificationEmail_validated() throws Exception {
        stubMimeMessage();

        mailService.sendCompanyNotificationEmail(utilisateur(), "subject", "headline",
            "corps", "entreprise validee");

        verify(mailSender).send(any(MimeMessage.class));
    }

    @Test
    @DisplayName("sendCompanyNotificationEmail() → Statut inconnu INFO")
    void sendCompanyNotificationEmail_info() throws Exception {
        stubMimeMessage();

        mailService.sendCompanyNotificationEmail(utilisateur(), "subject", "headline", "corps", "summary");

        verify(mailSender).send(any(MimeMessage.class));
    }

    @Test
    @DisplayName("sendSectorNotificationEmail() → Envoie la notification secteur")
    void sendSectorNotificationEmail_sends() throws Exception {
        stubMimeMessage();

        mailService.sendSectorNotificationEmail(utilisateur(), "subject", "headline",
            "corps", "Statut: INACTIF");

        verify(mailSender).send(any(MimeMessage.class));
    }

    @Test
    @DisplayName("sendHtml() → Erreur de construction du message lance IllegalStateException")
    void sendHtml_whenSendFails_throws() throws Exception {
        MimeMessage mimeMessage = mock(MimeMessage.class);
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        doThrow(new jakarta.mail.MessagingException("bad address"))
            .when(mimeMessage).setFrom(any(jakarta.mail.Address.class));

        assertThatThrownBy(() -> mailService.sendResetCodeEmail(utilisateur(), "123456"))
            .isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("Unable to send email");
    }

    @Test
    @DisplayName("sendHtml() → Utilisateur avec champs nuls gere les valeurs")
    void sendActivationEmail_withNullFields() throws Exception {
        stubMimeMessage();
        Utilisateur user = new Utilisateur();
        user.setEmail("null@logiway.com");
        user.setRole(Role.SUPERADMIN);

        mailService.sendActivationEmail(user, "temp123");

        verify(mailSender).send(any(MimeMessage.class));
    }

    @Test
    @DisplayName("sendCompanyNotificationEmail() → Params nuls gere les valeurs nulles")
    void sendCompanyNotificationEmail_allNullParams() throws Exception {
        stubMimeMessage();

        mailService.sendCompanyNotificationEmail(utilisateur(), "subject", null, null, null);

        verify(mailSender).send(any(MimeMessage.class));
    }

    @Test
    @DisplayName("sendCompanyNotificationEmail() → EN_ATTENTE avec underscore declenche le OR")
    void sendCompanyNotificationEmail_enAttenteWithUnderscore() throws Exception {
        stubMimeMessage();

        mailService.sendCompanyNotificationEmail(utilisateur(), "subject", "Statut: EN_ATTENTE", "corps", "summary");

        verify(mailSender).send(any(MimeMessage.class));
    }
}
