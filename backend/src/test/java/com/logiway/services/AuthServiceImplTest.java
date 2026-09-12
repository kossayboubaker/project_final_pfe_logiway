package com.logiway.services;

import com.logiway.dto.request.ForgotPasswordRequest;
import com.logiway.dto.request.LoginRequest;
import com.logiway.dto.request.ResetPasswordRequest;
import com.logiway.dto.response.ApiMessageResponse;
import com.logiway.dto.response.AuthSessionResponse;
import com.logiway.dto.response.LoginResult;
import com.logiway.entities.Entreprise;
import com.logiway.entities.ResetToken;
import com.logiway.entities.Utilisateur;
import com.logiway.entities.enums.Role;
import com.logiway.entities.enums.StatutCompte;
import com.logiway.exceptions.AccountRejectedException;
import com.logiway.exceptions.AuthProviderUnavailableException;
import com.logiway.exceptions.BadRequestException;
import com.logiway.exceptions.UnauthorizedException;
import com.logiway.mappers.UserMapper;
import com.logiway.repositories.ResetTokenRepository;
import com.logiway.repositories.UtilisateurRepository;
import com.logiway.security.AuthenticatedUserService;
import com.logiway.services.impl.AuthServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Service Authentification — Tests Unitaires")
class AuthServiceImplTest {

    @Mock private UtilisateurRepository utilisateurRepository;
    @Mock private ResetTokenRepository resetTokenRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private KeycloakService keycloakService;
    @Mock private MailService mailService;
    @Mock private UserMapper userMapper;
    @Mock private AuthenticatedUserService authenticatedUserService;

    @InjectMocks
    private AuthServiceImpl authService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(authService, "resetTokenTtlMinutes", 15L);
    }

    private Utilisateur utilisateur(Long id, StatutCompte statut, String passwordHash, Boolean emailVerifie) {
        Utilisateur user = new Utilisateur();
        user.setId(id);
        user.setPrenom("Jean");
        user.setNom("Dupont");
        user.setEmail("Jean.Dupont@Logiway.com");
        user.setRole(Role.MANAGER);
        user.setEstActif(statut);
        user.setPasswordHash(passwordHash);
        user.setEmailVerifie(emailVerifie);
        return user;
    }

    private Map<String, Object> tokenPayload() {
        return Map.of(
            "access_token", "access-tok",
            "refresh_token", "refresh-tok",
            "expires_in", "3600",
            "refresh_expires_in", "1800");
    }

    @Test
    @DisplayName("login() → Email null normalise en chaine vide")
    void login_nullEmail_normalizesToEmptyString() {
        when(utilisateurRepository.findByEmailIgnoreCase("")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(new LoginRequest(null, "pass")))
            .isInstanceOf(UnauthorizedException.class)
            .hasMessageContaining("Invalid credentials");
        verify(utilisateurRepository).findByEmailIgnoreCase("");
    }

    @Test
    @DisplayName("getRejectionReason() → Email null normalise en chaine vide")
    void getRejectionReason_nullEmail_normalizesToEmptyString() {
        when(utilisateurRepository.findByEmailIgnoreCase("")).thenReturn(Optional.empty());

        ApiMessageResponse response = authService.getRejectionReason(new ForgotPasswordRequest(null));

        assertThat(response.message()).contains("Email ou mot de passe invalide");
        verify(utilisateurRepository).findByEmailIgnoreCase("");
    }

    @Test
    @DisplayName("login() → Succes avec token et session")
    void login_success() {
        Utilisateur user = utilisateur(1L, StatutCompte.ACTIF, "encoded", false);
        Entreprise entreprise = new Entreprise();
        entreprise.setId(10L);
        user.setEntreprise(entreprise);
        when(utilisateurRepository.findByEmailIgnoreCase("jean.dupont@logiway.com")).thenReturn(Optional.of(user));
        when(keycloakService.fetchTokenByPassword(anyString(), anyString())).thenReturn(tokenPayload());
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(true);

        LoginResult result = authService.login(new LoginRequest("Jean.Dupont@Logiway.com", "pass"));

        assertThat(result.accessToken()).isEqualTo("access-tok");
        assertThat(result.refreshToken()).isEqualTo("refresh-tok");
        assertThat(result.accessTokenExpiresIn()).isEqualTo(3600L);
        assertThat(result.refreshTokenExpiresIn()).isEqualTo(1800L);
        assertThat(result.firstLogin()).isTrue();
        assertThat(result.hasCompany()).isTrue();
        verify(userMapper).toResponse(user);
    }

    @Test
    @DisplayName("login() → Email inconnu lance UnauthorizedException")
    void login_unknownEmail_throws() {
        when(utilisateurRepository.findByEmailIgnoreCase(anyString())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(new LoginRequest("x@y.com", "pass")))
            .isInstanceOf(UnauthorizedException.class)
            .hasMessageContaining("Invalid credentials");
        verify(keycloakService, never()).fetchTokenByPassword(anyString(), anyString());
    }

    @Test
    @DisplayName("login() → Compte rejete avec motif lance AccountRejectedException")
    void login_rejectedWithReason_throws() {
        Utilisateur user = utilisateur(1L, StatutCompte.REJETE, null, false);
        user.setRejectionReason("Fraude documentaire");
        when(utilisateurRepository.findByEmailIgnoreCase(anyString())).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> authService.login(new LoginRequest("x@y.com", "pass")))
            .isInstanceOf(AccountRejectedException.class)
            .hasMessageContaining("Fraude documentaire");
    }

    @Test
    @DisplayName("login() → Compte rejete sans motif lance AccountRejectedException generique")
    void login_rejectedWithoutReason_throws() {
        Utilisateur user = utilisateur(1L, StatutCompte.REJETE, null, false);
        when(utilisateurRepository.findByEmailIgnoreCase(anyString())).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> authService.login(new LoginRequest("x@y.com", "pass")))
            .isInstanceOf(AccountRejectedException.class)
            .hasMessageContaining("par l'administrateur");
    }

    @Test
    @DisplayName("login() → Compte inactif lance UnauthorizedException")
    void login_inactive_throws() {
        Utilisateur user = utilisateur(1L, StatutCompte.INACTIF, null, false);
        when(utilisateurRepository.findByEmailIgnoreCase(anyString())).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> authService.login(new LoginRequest("x@y.com", "pass")))
            .isInstanceOf(UnauthorizedException.class)
            .hasMessageContaining("disabled");
    }

    @Test
    @DisplayName("login() → Echec Keycloak unauthorized lance Invalid credentials")
    void login_keycloakUnauthorized_throws() {
        Utilisateur user = utilisateur(1L, StatutCompte.ACTIF, "h", false);
        when(utilisateurRepository.findByEmailIgnoreCase(anyString())).thenReturn(Optional.of(user));
        when(keycloakService.fetchTokenByPassword(anyString(), anyString()))
            .thenThrow(new UnauthorizedException("bad"));

        assertThatThrownBy(() -> authService.login(new LoginRequest("x@y.com", "pass")))
            .isInstanceOf(UnauthorizedException.class)
            .hasMessageContaining("Invalid credentials");
    }

    @Test
    @DisplayName("login() → Indisponibilite Keycloak est propagee")
    void login_keycloakUnavailable_propagates() {
        Utilisateur user = utilisateur(1L, StatutCompte.ACTIF, "h", false);
        when(utilisateurRepository.findByEmailIgnoreCase(anyString())).thenReturn(Optional.of(user));
        when(keycloakService.fetchTokenByPassword(anyString(), anyString()))
            .thenThrow(new AuthProviderUnavailableException("down"));

        assertThatThrownBy(() -> authService.login(new LoginRequest("x@y.com", "pass")))
            .isInstanceOf(AuthProviderUnavailableException.class)
            .hasMessageContaining("down");
    }

    @Test
    @DisplayName("login() → Erreur Keycloak BadRequest devient indisponibilite")
    void login_keycloakBadRequest_becomesUnavailable() {
        Utilisateur user = utilisateur(1L, StatutCompte.ACTIF, "h", false);
        when(utilisateurRepository.findByEmailIgnoreCase(anyString())).thenReturn(Optional.of(user));
        when(keycloakService.fetchTokenByPassword(anyString(), anyString()))
            .thenThrow(new BadRequestException("bad"));

        assertThatThrownBy(() -> authService.login(new LoginRequest("x@y.com", "pass")))
            .isInstanceOf(AuthProviderUnavailableException.class)
            .hasMessageContaining("temporarily unavailable");
    }

    @Test
    @DisplayName("login() → Token absent lance Unable to generate access token")
    void login_missingAccessToken_throws() {
        Utilisateur user = utilisateur(1L, StatutCompte.ACTIF, "h", false);
        when(utilisateurRepository.findByEmailIgnoreCase(anyString())).thenReturn(Optional.of(user));
        when(keycloakService.fetchTokenByPassword(anyString(), anyString())).thenReturn(Map.of("refresh_token", "rt"));

        assertThatThrownBy(() -> authService.login(new LoginRequest("x@y.com", "pass")))
            .isInstanceOf(UnauthorizedException.class)
            .hasMessageContaining("Unable to generate access token");
    }

    @Test
    @DisplayName("login() → Mot de passe local desynchronise est re-synchronise")
    void login_passwordDrift_selfHeals() {
        Utilisateur user = utilisateur(1L, StatutCompte.ACTIF, "old-hash", false);
        when(utilisateurRepository.findByEmailIgnoreCase(anyString())).thenReturn(Optional.of(user));
        when(keycloakService.fetchTokenByPassword(anyString(), anyString())).thenReturn(tokenPayload());
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("new-hash");

        authService.login(new LoginRequest("x@y.com", "pass"));

        verify(passwordEncoder).encode("pass");
        assertThat(user.getPasswordHash()).isEqualTo("new-hash");
        verify(utilisateurRepository).save(user);
    }

    @Test
    @DisplayName("login() → Hash invalide entraine la re-synchronisation")
    void login_illegalPasswordHash_selfHeals() {
        Utilisateur user = utilisateur(1L, StatutCompte.ACTIF, null, false);
        when(utilisateurRepository.findByEmailIgnoreCase(anyString())).thenReturn(Optional.of(user));
        when(keycloakService.fetchTokenByPassword(anyString(), anyString())).thenReturn(tokenPayload());
        when(passwordEncoder.matches(anyString(), isNull())).thenThrow(new IllegalArgumentException("null hash"));
        when(passwordEncoder.encode(anyString())).thenReturn("new-hash");

        authService.login(new LoginRequest("x@y.com", "pass"));

        verify(passwordEncoder).encode("pass");
        verify(utilisateurRepository).save(user);
    }

    @Test
    @DisplayName("login() → Sans entreprise le flag hasCompany est false")
    void login_withoutCompany_hasCompanyFalse() {
        Utilisateur user = utilisateur(1L, StatutCompte.ACTIF, "h", true);
        when(utilisateurRepository.findByEmailIgnoreCase(anyString())).thenReturn(Optional.of(user));
        when(keycloakService.fetchTokenByPassword(anyString(), anyString())).thenReturn(tokenPayload());
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(true);

        LoginResult result = authService.login(new LoginRequest("x@y.com", "pass"));

        assertThat(result.firstLogin()).isFalse();
        assertThat(result.hasCompany()).isFalse();
    }

    @Test
    @DisplayName("me() → Retourne la session de l'utilisateur courant")
    void me_returnsSession() {
        Utilisateur user = utilisateur(1L, StatutCompte.ACTIF, "h", true);
        when(authenticatedUserService.getCurrentUser()).thenReturn(user);

        AuthSessionResponse session = authService.me();

        assertThat(session.role()).isEqualTo("MANAGER");
        assertThat(session.prenom()).isEqualTo("Jean");
        assertThat(session.nom()).isEqualTo("Dupont");
        assertThat(session.firstLogin()).isFalse();
        assertThat(session.hasCompany()).isFalse();
    }

    @Test
    @DisplayName("me() → Premier login et entreprise detectes")
    void me_firstLoginAndCompany() {
        Utilisateur user = utilisateur(1L, StatutCompte.ACTIF, "h", false);
        Entreprise entreprise = new Entreprise();
        entreprise.setId(10L);
        user.setEntreprise(entreprise);
        when(authenticatedUserService.getCurrentUser()).thenReturn(user);

        AuthSessionResponse session = authService.me();

        assertThat(session.firstLogin()).isTrue();
        assertThat(session.hasCompany()).isTrue();
    }

    @Test
    @DisplayName("logout() → Avec token, revoque la session Keycloak")
    void logout_withToken_revokesKeycloak() {
        ApiMessageResponse response = authService.logout("refresh-token");

        assertThat(response.message()).contains("Logged out");
        verify(keycloakService).logoutByRefreshToken("refresh-token");
    }

    @Test
    @DisplayName("logout() → Token vide ne contacte pas Keycloak")
    void logout_blankToken_noop() {
        authService.logout(" ");
        authService.logout(null);

        verify(keycloakService, never()).logoutByRefreshToken(anyString());
    }

    @Test
    @DisplayName("forgotPassword() → Genere un code et l'envoie par email")
    void forgotPassword_userExists() {
        Utilisateur user = utilisateur(1L, StatutCompte.ACTIF, "h", true);
        when(utilisateurRepository.findByEmailIgnoreCase(anyString())).thenReturn(Optional.of(user));

        ApiMessageResponse response = authService.forgotPassword(new ForgotPasswordRequest("x@y.com"));

        assertThat(response.message()).contains("If the email exists");
        verify(resetTokenRepository).deleteByUtilisateur(user);
        verify(resetTokenRepository).deleteByExpiresAtBefore(any(LocalDateTime.class));
        ArgumentCaptor<ResetToken> captor = ArgumentCaptor.forClass(ResetToken.class);
        verify(resetTokenRepository).save(captor.capture());
        assertThat(captor.getValue().getCode()).matches("\\d{6}");
        assertThat(captor.getValue().getUtilisateur()).isSameAs(user);
        assertThat(captor.getValue().isUsed()).isFalse();
        verify(mailService).sendResetCodeEmail(eq(user), anyString());
    }

    @Test
    @DisplayName("forgotPassword() → Email inconnu retourne le meme message")
    void forgotPassword_unknownEmail() {
        when(utilisateurRepository.findByEmailIgnoreCase(anyString())).thenReturn(Optional.empty());

        ApiMessageResponse response = authService.forgotPassword(new ForgotPasswordRequest("x@y.com"));

        assertThat(response.message()).contains("If the email exists");
        verify(resetTokenRepository, never()).save(any());
        verify(mailService, never()).sendResetCodeEmail(any(), anyString());
    }

    @Test
    @DisplayName("resetPassword() → Reinitialise le mot de passe")
    void resetPassword_success() {
        Utilisateur user = utilisateur(1L, StatutCompte.ACTIF, "old", true);
        ResetToken token = ResetToken.builder()
            .id(1L)
            .code("123456")
            .expiresAt(LocalDateTime.now().plusMinutes(15))
            .used(false)
            .utilisateur(user)
            .build();
        when(resetTokenRepository.findByCodeAndUsedFalse("123456")).thenReturn(Optional.of(token));
        when(passwordEncoder.encode("newPass123")).thenReturn("new-hash");

        ApiMessageResponse response = authService.resetPassword(new ResetPasswordRequest("123456", "newPass123"));

        assertThat(response.message()).contains("Password updated");
        assertThat(user.getPasswordHash()).isEqualTo("new-hash");
        assertThat(token.isUsed()).isTrue();
        verify(utilisateurRepository).save(user);
        verify(keycloakService).updatePasswordByEmail(user.getEmail(), "newPass123");
        verify(resetTokenRepository).save(token);
    }

    @Test
    @DisplayName("resetPassword() → Code invalide lance BadRequestException")
    void resetPassword_invalidCode_throws() {
        when(resetTokenRepository.findByCodeAndUsedFalse(anyString())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.resetPassword(new ResetPasswordRequest("000000", "newPass123")))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("Invalid reset code");
    }

    @Test
    @DisplayName("resetPassword() → Code expire lance BadRequestException")
    void resetPassword_expiredCode_throws() {
        Utilisateur user = utilisateur(1L, StatutCompte.ACTIF, "old", true);
        ResetToken token = ResetToken.builder()
            .id(1L)
            .code("123456")
            .expiresAt(LocalDateTime.now().minusMinutes(1))
            .used(false)
            .utilisateur(user)
            .build();
        when(resetTokenRepository.findByCodeAndUsedFalse("123456")).thenReturn(Optional.of(token));

        assertThatThrownBy(() -> authService.resetPassword(new ResetPasswordRequest("123456", "newPass123")))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("expired");
        verify(utilisateurRepository, never()).save(any());
    }

    @Test
    @DisplayName("getRejectionReason() → Email inconnu retourne message generique")
    void getRejectionReason_unknownEmail() {
        when(utilisateurRepository.findByEmailIgnoreCase(anyString())).thenReturn(Optional.empty());

        ApiMessageResponse response = authService.getRejectionReason(new ForgotPasswordRequest("x@y.com"));

        assertThat(response.message()).contains("Email ou mot de passe invalide");
    }

    @Test
    @DisplayName("getRejectionReason() → Compte actif retourne message generique")
    void getRejectionReason_activeAccount() {
        Utilisateur user = utilisateur(1L, StatutCompte.ACTIF, "h", true);
        when(utilisateurRepository.findByEmailIgnoreCase(anyString())).thenReturn(Optional.of(user));

        ApiMessageResponse response = authService.getRejectionReason(new ForgotPasswordRequest("x@y.com"));

        assertThat(response.message()).contains("Email ou mot de passe invalide");
    }

    @Test
    @DisplayName("getRejectionReason() → Rejet sans motif retourne message generique")
    void getRejectionReason_noReason() {
        Utilisateur user = utilisateur(1L, StatutCompte.REJETE, "h", true);
        when(utilisateurRepository.findByEmailIgnoreCase(anyString())).thenReturn(Optional.of(user));

        ApiMessageResponse response = authService.getRejectionReason(new ForgotPasswordRequest("x@y.com"));

        assertThat(response.message()).isEqualTo("Compte rejeté par l'administrateur");
    }

    @Test
    @DisplayName("getRejectionReason() → Rejet avec motif retourne le motif")
    void getRejectionReason_withReason() {
        Utilisateur user = utilisateur(1L, StatutCompte.REJETE, "h", true);
        user.setRejectionReason("Document non conforme");
        when(utilisateurRepository.findByEmailIgnoreCase(anyString())).thenReturn(Optional.of(user));

        ApiMessageResponse response = authService.getRejectionReason(new ForgotPasswordRequest("x@y.com"));

        assertThat(response.message()).isEqualTo("Compte rejeté : Document non conforme");
    }

    @Test
    @DisplayName("verifyEmail() → Verifie l'email et efface le token")
    void verifyEmail_success() {
        Utilisateur user = utilisateur(1L, StatutCompte.ACTIF, "h", false);
        user.setVerificationToken("vtok");
        when(utilisateurRepository.findByVerificationToken("vtok")).thenReturn(Optional.of(user));

        ApiMessageResponse response = authService.verifyEmail("vtok");

        assertThat(response.message()).contains("Email verified");
        assertThat(user.getEmailVerifie()).isTrue();
        assertThat(user.getVerificationToken()).isNull();
        verify(utilisateurRepository).save(user);
    }

    @Test
    @DisplayName("verifyEmail() → Token invalide lance BadRequestException")
    void verifyEmail_invalidToken_throws() {
        when(utilisateurRepository.findByVerificationToken(anyString())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.verifyEmail("bad"))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("Invalid verification token");
    }

    @Test
    @DisplayName("refreshTokenFromKeycloak() → Delegue au service Keycloak")
    void refreshTokenFromKeycloak_delegates() {
        Map<String, Object> tokens = Map.of("access_token", "new-tok");
        when(keycloakService.refreshAccessToken("rt")).thenReturn(tokens);

        assertThat(authService.refreshTokenFromKeycloak("rt")).isSameAs(tokens);
    }

    @Test
    @DisplayName("login() → Rejet avec motif vide lance exception generique")
    void login_rejectedWithBlankReason_throws() {
        Utilisateur user = utilisateur(1L, StatutCompte.REJETE, "h", true);
        user.setRejectionReason("  ");
        when(utilisateurRepository.findByEmailIgnoreCase(anyString())).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> authService.login(new LoginRequest("x@y.com", "pass")))
            .hasMessageContaining("par l'administrateur");
    }

    @Test
    @DisplayName("login() → Token null retourne exception")
    void login_keycloakReturnsNull_throws() {
        Utilisateur user = utilisateur(1L, StatutCompte.ACTIF, "h", true);
        when(utilisateurRepository.findByEmailIgnoreCase(anyString())).thenReturn(Optional.of(user));
        when(keycloakService.fetchTokenByPassword(anyString(), anyString())).thenReturn(null);

        assertThatThrownBy(() -> authService.login(new LoginRequest("x@y.com", "pass")))
            .hasMessageContaining("Unable to generate access token");
    }

    @Test
    @DisplayName("getRejectionReason() → Rejet avec motif vide retourne message generique")
    void getRejectionReason_blankReason() {
        Utilisateur user = utilisateur(1L, StatutCompte.REJETE, "h", true);
        user.setRejectionReason("  ");
        when(utilisateurRepository.findByEmailIgnoreCase(anyString())).thenReturn(Optional.of(user));

        ApiMessageResponse response = authService.getRejectionReason(new ForgotPasswordRequest("x@y.com"));

        assertThat(response.message()).isEqualTo("Compte rejeté par l'administrateur");
    }
}
