package com.logiway.services;

import com.logiway.entities.RefreshToken;
import com.logiway.entities.Utilisateur;
import com.logiway.repositories.RefreshTokenRepository;
import com.logiway.repositories.UtilisateurRepository;
import com.logiway.services.impl.TokenRefreshServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Service Token Refresh — Tests Unitaires")
class TokenRefreshServiceImplTest {

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @Mock
    private UtilisateurRepository utilisateurRepository;

    @InjectMocks
    private TokenRefreshServiceImpl tokenRefreshService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(tokenRefreshService, "refreshTokenExpirationMs", 604800000L);
    }

    private Utilisateur utilisateur(long id) {
        Utilisateur user = new Utilisateur();
        user.setId(id);
        user.setEmail("user" + id + "@logiway.com");
        return user;
    }

    private RefreshToken token(String value, Utilisateur user, LocalDateTime expiry, boolean revoked) {
        RefreshToken token = new RefreshToken();
        token.setToken(value);
        token.setUtilisateur(user);
        token.setExpiryDate(expiry);
        token.setRevoked(revoked);
        return token;
    }

    @Test
    @DisplayName("generateRefreshToken() → Genere un token et revoque les anciens")
    void generateRefreshToken_success() {
        Utilisateur user = utilisateur(1L);
        when(utilisateurRepository.findById(1L)).thenReturn(Optional.of(user));

        String token = tokenRefreshService.generateRefreshToken(1L);

        assertThat(token).isNotBlank();
        ArgumentCaptor<RefreshToken> captor = ArgumentCaptor.forClass(RefreshToken.class);
        verify(refreshTokenRepository).save(captor.capture());
        assertThat(captor.getValue().getToken()).isEqualTo(token);
        assertThat(captor.getValue().getUtilisateur()).isSameAs(user);
        assertThat(captor.getValue().getExpiryDate()).isAfter(LocalDateTime.now());
        assertThat(captor.getValue().getExpiryDate())
            .isCloseTo(LocalDateTime.now().plus(604800L, ChronoUnit.SECONDS), within(60L, ChronoUnit.SECONDS));
        verify(refreshTokenRepository).revokeAllByUtilisateur(user);
    }

    @Test
    @DisplayName("generateRefreshToken() → Utilisateur introuvable lance une exception")
    void generateRefreshToken_userNotFound_throws() {
        when(utilisateurRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> tokenRefreshService.generateRefreshToken(99L))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Utilisateur not found");
        verify(refreshTokenRepository, never()).save(any());
    }

    @Test
    @DisplayName("validateRefreshToken() → Token valide retourne l'id utilisateur")
    void validateRefreshToken_valid() {
        Utilisateur user = utilisateur(7L);
        RefreshToken token = token("abc", user, LocalDateTime.now().plusDays(1), false);
        when(refreshTokenRepository.findByToken("abc")).thenReturn(Optional.of(token));

        assertThat(tokenRefreshService.validateRefreshToken("abc")).contains(7L);
    }

    @Test
    @DisplayName("validateRefreshToken() → Token revoque retourne empty")
    void validateRefreshToken_revoked() {
        Utilisateur user = utilisateur(7L);
        RefreshToken token = token("abc", user, LocalDateTime.now().plusDays(1), true);
        when(refreshTokenRepository.findByToken("abc")).thenReturn(Optional.of(token));

        assertThat(tokenRefreshService.validateRefreshToken("abc")).isEmpty();
    }

    @Test
    @DisplayName("validateRefreshToken() → Token expire retourne empty")
    void validateRefreshToken_expired() {
        Utilisateur user = utilisateur(7L);
        RefreshToken token = token("abc", user, LocalDateTime.now().minusMinutes(1), false);
        when(refreshTokenRepository.findByToken("abc")).thenReturn(Optional.of(token));

        assertThat(tokenRefreshService.validateRefreshToken("abc")).isEmpty();
    }

    @Test
    @DisplayName("validateRefreshToken() → Token absent retourne empty")
    void validateRefreshToken_absent() {
        when(refreshTokenRepository.findByToken("xyz")).thenReturn(Optional.empty());

        assertThat(tokenRefreshService.validateRefreshToken("xyz")).isEmpty();
    }

    @Test
    @DisplayName("revokeRefreshToken() → Revoke le token existant")
    void revokeRefreshToken_present() {
        Utilisateur user = utilisateur(1L);
        RefreshToken token = token("abc", user, LocalDateTime.now().plusDays(1), false);
        when(refreshTokenRepository.findByToken("abc")).thenReturn(Optional.of(token));

        tokenRefreshService.revokeRefreshToken("abc");

        assertThat(token.getRevoked()).isTrue();
        verify(refreshTokenRepository).save(token);
    }

    @Test
    @DisplayName("revokeRefreshToken() → Token absent ne fait rien")
    void revokeRefreshToken_absent() {
        when(refreshTokenRepository.findByToken("abc")).thenReturn(Optional.empty());

        tokenRefreshService.revokeRefreshToken("abc");

        verify(refreshTokenRepository, never()).save(any());
    }

    @Test
    @DisplayName("revokeAllUserTokens() → Revoke tous les tokens de l'utilisateur")
    void revokeAllUserTokens_userPresent() {
        Utilisateur user = utilisateur(1L);
        when(utilisateurRepository.findById(1L)).thenReturn(Optional.of(user));

        tokenRefreshService.revokeAllUserTokens(1L);

        verify(refreshTokenRepository).revokeAllByUtilisateur(user);
    }

    @Test
    @DisplayName("revokeAllUserTokens() → Utilisateur absent ne fait rien")
    void revokeAllUserTokens_userAbsent() {
        when(utilisateurRepository.findById(1L)).thenReturn(Optional.empty());

        tokenRefreshService.revokeAllUserTokens(1L);

        verify(refreshTokenRepository, never()).revokeAllByUtilisateur(any());
    }

    @Test
    @DisplayName("isRefreshTokenValid() → Delegue a validateRefreshToken")
    void isRefreshTokenValid_delegates() {
        Utilisateur user = utilisateur(7L);
        RefreshToken token = token("abc", user, LocalDateTime.now().plusDays(1), false);
        when(refreshTokenRepository.findByToken("abc")).thenReturn(Optional.of(token));

        assertThat(tokenRefreshService.isRefreshTokenValid("abc")).isTrue();
        assertThat(tokenRefreshService.isRefreshTokenValid("xyz")).isFalse();
    }

    @Test
    @DisplayName("cleanupExpiredTokens() → Supprime les tokens expires")
    void cleanupExpiredTokens_callsRepository() {
        tokenRefreshService.cleanupExpiredTokens();

        verify(refreshTokenRepository).deleteExpiredTokens(any(LocalDateTime.class));
    }
}
