package com.logiway.security;

import com.logiway.entities.Utilisateur;
import com.logiway.entities.enums.Role;
import com.logiway.entities.enums.StatutCompte;
import com.logiway.exceptions.UnauthorizedException;
import com.logiway.repositories.UtilisateurRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@DisplayName("AuthenticatedUserService — Tests unitaires")
class AuthenticatedUserServiceTest {

    private UtilisateurRepository utilisateurRepository;
    private AuthenticatedUserService service;

    @BeforeEach
    void setUp() {
        utilisateurRepository = mock(UtilisateurRepository.class);
        service = new AuthenticatedUserService(utilisateurRepository);
    }

    private Utilisateur buildUser(Long id, String email, String keycloakId) {
        Utilisateur u = new Utilisateur();
        u.setId(id);
        u.setEmail(email);
        u.setKeycloakId(keycloakId);
        u.setRole(Role.MANAGER);
        u.setEstActif(StatutCompte.ACTIF);
        u.setEmailVerifie(true);
        u.setPasswordHash("hash");
        return u;
    }

    private void setSecurityContext(Authentication auth) {
        SecurityContext ctx = mock(SecurityContext.class);
        when(ctx.getAuthentication()).thenReturn(auth);
        SecurityContextHolder.setContext(ctx);
    }

    @Test @DisplayName("authentication null → UnauthorizedException")
    void auth_null() {
        setSecurityContext(null);
        assertThatThrownBy(() -> service.getCurrentUser())
            .isInstanceOf(UnauthorizedException.class)
            .hasMessageContaining("not authenticated");
    }

    @Test @DisplayName("authentication non authentifié → UnauthorizedException")
    void auth_notAuthenticated() {
        Authentication auth = mock(Authentication.class);
        when(auth.isAuthenticated()).thenReturn(false);
        setSecurityContext(auth);
        assertThatThrownBy(() -> service.getCurrentUser())
            .isInstanceOf(UnauthorizedException.class);
    }

    @Test @DisplayName("JWT avec claim email → user trouvé")
    void jwt_withEmail() {
        Utilisateur u = buildUser(1L, "jean@t.fr", "kc-1");
        Jwt jwt = mock(Jwt.class);
        when(jwt.getClaimAsString("email")).thenReturn("jean@t.fr");

        Authentication auth = mock(Authentication.class);
        when(auth.isAuthenticated()).thenReturn(true);
        when(auth.getPrincipal()).thenReturn(jwt);
        when(utilisateurRepository.findByEmailIgnoreCase("jean@t.fr")).thenReturn(Optional.of(u));
        setSecurityContext(auth);

        assertThat(service.getCurrentUser().getEmail()).isEqualTo("jean@t.fr");
    }

    @Test @DisplayName("JWT avec claim email → user non trouvé → UnauthorizedException")
    void jwt_withEmail_notFound() {
        Jwt jwt = mock(Jwt.class);
        when(jwt.getClaimAsString("email")).thenReturn("unknown@t.fr");

        Authentication auth = mock(Authentication.class);
        when(auth.isAuthenticated()).thenReturn(true);
        when(auth.getPrincipal()).thenReturn(jwt);
        when(utilisateurRepository.findByEmailIgnoreCase("unknown@t.fr")).thenReturn(Optional.empty());
        setSecurityContext(auth);

        assertThatThrownBy(() -> service.getCurrentUser())
            .isInstanceOf(UnauthorizedException.class);
    }

    @Test @DisplayName("JWT sans email → preferred_username → user trouvé")
    void jwt_withPreferredUsername() {
        Utilisateur u = buildUser(2L, "pref@t.fr", "kc-2");
        Jwt jwt = mock(Jwt.class);
        when(jwt.getClaimAsString("email")).thenReturn(null);
        when(jwt.getClaimAsString("preferred_username")).thenReturn("pref@t.fr");

        Authentication auth = mock(Authentication.class);
        when(auth.isAuthenticated()).thenReturn(true);
        when(auth.getPrincipal()).thenReturn(jwt);
        when(utilisateurRepository.findByEmailIgnoreCase("pref@t.fr")).thenReturn(Optional.of(u));
        setSecurityContext(auth);

        assertThat(service.getCurrentUser().getId()).isEqualTo(2L);
    }

    @Test @DisplayName("JWT sans email ni preferred_username → subject (keycloakId)")
    void jwt_withSubject() {
        Utilisateur u = buildUser(3L, "sub@t.fr", "kc-subject");
        Jwt jwt = mock(Jwt.class);
        when(jwt.getClaimAsString("email")).thenReturn(null);
        when(jwt.getClaimAsString("preferred_username")).thenReturn(null);
        when(jwt.getSubject()).thenReturn("kc-subject");

        Authentication auth = mock(Authentication.class);
        when(auth.isAuthenticated()).thenReturn(true);
        when(auth.getPrincipal()).thenReturn(jwt);
        when(utilisateurRepository.findAll()).thenReturn(List.of(u));
        setSecurityContext(auth);

        assertThat(service.getCurrentUser().getKeycloakId()).isEqualTo("kc-subject");
    }

    @Test @DisplayName("JWT sans email/preferred_username/subject → UnauthorizedException")
    void jwt_noSubject_notFound() {
        Utilisateur u = buildUser(3L, "sub@t.fr", "other-kc");
        Jwt jwt = mock(Jwt.class);
        when(jwt.getClaimAsString("email")).thenReturn(null);
        when(jwt.getClaimAsString("preferred_username")).thenReturn(null);
        when(jwt.getSubject()).thenReturn("kc-missing");

        Authentication auth = mock(Authentication.class);
        when(auth.isAuthenticated()).thenReturn(true);
        when(auth.getPrincipal()).thenReturn(jwt);
        when(utilisateurRepository.findAll()).thenReturn(List.of(u));
        setSecurityContext(auth);

        assertThatThrownBy(() -> service.getCurrentUser())
            .isInstanceOf(UnauthorizedException.class);
    }

    @Test @DisplayName("principal non-JWT → fallback par authentication.getName()")
    void nonJwt_principal_fallback() {
        Utilisateur u = buildUser(4L, "name@t.fr", "kc-4");

        Authentication auth = mock(Authentication.class);
        when(auth.isAuthenticated()).thenReturn(true);
        when(auth.getPrincipal()).thenReturn("not-a-jwt-principal");
        when(auth.getName()).thenReturn("name@t.fr");
        when(utilisateurRepository.findByEmailIgnoreCase("name@t.fr")).thenReturn(Optional.of(u));
        setSecurityContext(auth);

        assertThat(service.getCurrentUser().getId()).isEqualTo(4L);
    }

    @Test @DisplayName("fallback par name → user non trouvé → UnauthorizedException")
    void nonJwt_principal_fallback_notFound() {
        Authentication auth = mock(Authentication.class);
        when(auth.isAuthenticated()).thenReturn(true);
        when(auth.getPrincipal()).thenReturn("string-principal");
        when(auth.getName()).thenReturn("ghost@t.fr");
        when(utilisateurRepository.findByEmailIgnoreCase("ghost@t.fr")).thenReturn(Optional.empty());
        setSecurityContext(auth);

        assertThatThrownBy(() -> service.getCurrentUser())
            .isInstanceOf(UnauthorizedException.class);
    }
}
