package com.logiway.config;

import com.logiway.controllers.HealthController;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.security.oauth2.server.resource.web.BearerTokenResolver;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;

import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.time.Instant;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Tests unitaires + intégration légère de SecurityConfig.
 *
 * Stratégie :
 * - Méthodes privées (extractFromCookies, extractRoleAuthorities, jwtAuthenticationConverter)
 *   → testées via réflexion (pas de contexte Spring)
 * - cookieBearerTokenResolver(), corsConfigurationSource() → testés directement sur l'instance
 * - securityFilterChain() → testé via @WebMvcTest (charge le filtre sans DB ni Keycloak réel)
 */
@DisplayName("SecurityConfig — Tests Unitaires + Intégration")
class SecurityConfigTest {

    // ══════════════════════════════════════════════════════════════════════
    // ── Helpers communs ───────────────────────────────────────────────────
    // ══════════════════════════════════════════════════════════════════════

    private SecurityConfig cfg(String origins, String cookie) throws Exception {
        SecurityConfig cfg = new SecurityConfig();
        set(cfg, "allowedOrigins",   origins);
        set(cfg, "accessCookieName", cookie);
        return cfg;
    }

    private void set(Object o, String field, Object val) throws Exception {
        Field f = o.getClass().getDeclaredField(field);
        f.setAccessible(true);
        f.set(o, val);
    }

    private String callExtractFromCookies(SecurityConfig cfg, HttpServletRequest req) throws Exception {
        Method m = SecurityConfig.class.getDeclaredMethod("extractFromCookies", HttpServletRequest.class);
        m.setAccessible(true);
        return (String) m.invoke(cfg, req);
    }

    @SuppressWarnings("unchecked")
    private Collection<GrantedAuthority> callExtractRoleAuthorities(SecurityConfig cfg, Jwt jwt) throws Exception {
        Method m = SecurityConfig.class.getDeclaredMethod("extractRoleAuthorities", Jwt.class);
        m.setAccessible(true);
        return (Collection<GrantedAuthority>) m.invoke(cfg, jwt);
    }

    @SuppressWarnings("unchecked")
    private Converter<Jwt, AbstractAuthenticationToken> getJwtConverter(SecurityConfig cfg) throws Exception {
        Method m = SecurityConfig.class.getDeclaredMethod("jwtAuthenticationConverter");
        m.setAccessible(true);
        return (Converter<Jwt, AbstractAuthenticationToken>) m.invoke(cfg);
    }

    private Jwt buildJwt(Map<String, Object> claims) {
        return Jwt.withTokenValue("token")
            .header("alg", "RS256")
            .claims(c -> c.putAll(claims))
            .issuedAt(Instant.now())
            .expiresAt(Instant.now().plusSeconds(3600))
            .build();
    }

    // ══════════════════════════════════════════════════════════════════════
    // 1. extractFromCookies — toutes les branches
    // ══════════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("extractFromCookies")
    class ExtractFromCookiesTests {

        @Test
        @DisplayName("cookies = null → retourne null")
        void cookies_null() throws Exception {
            SecurityConfig cfg = cfg("http://localhost:4200", "kc_token");
            HttpServletRequest req = mock(HttpServletRequest.class);
            when(req.getCookies()).thenReturn(null);
            assertThat(callExtractFromCookies(cfg, req)).isNull();
        }

        @Test
        @DisplayName("cookie absent (tableau non null) → retourne null")
        void cookie_notFound() throws Exception {
            SecurityConfig cfg = cfg("http://localhost:4200", "kc_token");
            HttpServletRequest req = mock(HttpServletRequest.class);
            when(req.getCookies()).thenReturn(new Cookie[]{new Cookie("other", "x")});
            assertThat(callExtractFromCookies(cfg, req)).isNull();
        }

        @Test
        @DisplayName("cookie kc_token trouvé → retourne sa valeur")
        void cookie_found() throws Exception {
            SecurityConfig cfg = cfg("http://localhost:4200", "kc_token");
            HttpServletRequest req = mock(HttpServletRequest.class);
            when(req.getCookies()).thenReturn(new Cookie[]{new Cookie("kc_token", "my-jwt")});
            assertThat(callExtractFromCookies(cfg, req)).isEqualTo("my-jwt");
        }

        @Test
        @DisplayName("plusieurs cookies → retourne le bon")
        void multiple_cookies() throws Exception {
            SecurityConfig cfg = cfg("http://localhost:4200", "kc_token");
            HttpServletRequest req = mock(HttpServletRequest.class);
            when(req.getCookies()).thenReturn(new Cookie[]{
                new Cookie("session_id", "s"), new Cookie("kc_token", "bearer-xyz"), new Cookie("theme", "dark")
            });
            assertThat(callExtractFromCookies(cfg, req)).isEqualTo("bearer-xyz");
        }

        @Test
        @DisplayName("nom de cookie personnalisé → trouvé")
        void customCookieName() throws Exception {
            SecurityConfig cfg = cfg("http://localhost:4200", "my_token");
            HttpServletRequest req = mock(HttpServletRequest.class);
            when(req.getCookies()).thenReturn(new Cookie[]{new Cookie("my_token", "custom-jwt")});
            assertThat(callExtractFromCookies(cfg, req)).isEqualTo("custom-jwt");
        }
    }

    // ══════════════════════════════════════════════════════════════════════
    // 2. extractRoleAuthorities — toutes les branches
    // ══════════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("extractRoleAuthorities")
    class ExtractRoleAuthoritiesTests {

        @Test
        @DisplayName("realm_access absent → collection vide")
        void noRealmAccess() throws Exception {
            assertThat(callExtractRoleAuthorities(
                cfg("http://localhost:4200", "kc_token"),
                buildJwt(Map.of("sub", "user1"))
            )).isEmpty();
        }

        @Test
        @DisplayName("realm_access non-Map → collection vide")
        void realmAccess_notMap() throws Exception {
            assertThat(callExtractRoleAuthorities(
                cfg("http://localhost:4200", "kc_token"),
                buildJwt(Map.of("realm_access", "not-a-map"))
            )).isEmpty();
        }

        @Test
        @DisplayName("realm_access sans clé 'roles' → collection vide")
        void noRolesKey() throws Exception {
            assertThat(callExtractRoleAuthorities(
                cfg("http://localhost:4200", "kc_token"),
                buildJwt(Map.of("realm_access", Map.of("other", "val")))
            )).isEmpty();
        }

        @Test
        @DisplayName("roles non-Collection (String) → collection vide")
        void roles_notCollection() throws Exception {
            Map<String, Object> realm = new HashMap<>();
            realm.put("roles", "not-a-list");
            Map<String, Object> claims = new HashMap<>();
            claims.put("realm_access", realm);
            assertThat(callExtractRoleAuthorities(
                cfg("http://localhost:4200", "kc_token"), buildJwt(claims)
            )).isEmpty();
        }

        @Test
        @DisplayName("rôles en minuscules → préfixés ROLE_ en majuscules")
        void roles_lowercase_prefixed() throws Exception {
            Map<String, Object> realm = new HashMap<>();
            realm.put("roles", List.of("manager", "chauffeur"));
            Map<String, Object> claims = new HashMap<>();
            claims.put("realm_access", realm);
            Collection<GrantedAuthority> result = callExtractRoleAuthorities(
                cfg("http://localhost:4200", "kc_token"), buildJwt(claims)
            );
            assertThat(result).extracting(GrantedAuthority::getAuthority)
                .containsExactlyInAnyOrder("ROLE_MANAGER", "ROLE_CHAUFFEUR");
        }

        @Test
        @DisplayName("rôle déjà ROLE_ → non doublé")
        void role_alreadyPrefixed() throws Exception {
            Map<String, Object> realm = new HashMap<>();
            realm.put("roles", List.of("ROLE_SUPERADMIN"));
            Map<String, Object> claims = new HashMap<>();
            claims.put("realm_access", realm);
            Collection<GrantedAuthority> result = callExtractRoleAuthorities(
                cfg("http://localhost:4200", "kc_token"), buildJwt(claims)
            );
            assertThat(result).extracting(GrantedAuthority::getAuthority)
                .containsExactly("ROLE_SUPERADMIN");
        }

        @Test
        @DisplayName("rôles vides → collection vide")
        void emptyRoles() throws Exception {
            Map<String, Object> realm = new HashMap<>();
            realm.put("roles", List.of());
            Map<String, Object> claims = new HashMap<>();
            claims.put("realm_access", realm);
            assertThat(callExtractRoleAuthorities(
                cfg("http://localhost:4200", "kc_token"), buildJwt(claims)
            )).isEmpty();
        }

        @Test
        @DisplayName("trois rôles → tous préfixés")
        void threeRoles() throws Exception {
            Map<String, Object> realm = new HashMap<>();
            realm.put("roles", List.of("superadmin", "manager", "chauffeur"));
            Map<String, Object> claims = new HashMap<>();
            claims.put("realm_access", realm);
            Collection<GrantedAuthority> result = callExtractRoleAuthorities(
                cfg("http://localhost:4200", "kc_token"), buildJwt(claims)
            );
            assertThat(result).extracting(GrantedAuthority::getAuthority)
                .containsExactlyInAnyOrder("ROLE_SUPERADMIN", "ROLE_MANAGER", "ROLE_CHAUFFEUR");
        }
    }

    // ══════════════════════════════════════════════════════════════════════
    // 3. jwtAuthenticationConverter — ternaires principal/token/anonymous
    // ══════════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("jwtAuthenticationConverter")
    class JwtConverterTests {

        @Test
        @DisplayName("preferred_username présent → nom = preferred_username")
        void preferredUsername_usedAsPrincipal() throws Exception {
            Map<String, Object> realm = new HashMap<>();
            realm.put("roles", List.of("manager"));
            Map<String, Object> claims = new HashMap<>();
            claims.put("preferred_username", "jean.dupont");
            claims.put("realm_access", realm);
            AbstractAuthenticationToken token = getJwtConverter(
                cfg("http://localhost:4200", "kc_token")
            ).convert(buildJwt(claims));
            assertThat(token).isInstanceOf(JwtAuthenticationToken.class);
            assertThat(token.getName()).isEqualTo("jean.dupont");
        }

        @Test
        @DisplayName("preferred_username absent → fallback token.getName() (sub)")
        void noPreferredUsername_fallbackSub() throws Exception {
            Map<String, Object> claims = new HashMap<>();
            claims.put("sub", "user-sub-id");
            AbstractAuthenticationToken token = getJwtConverter(
                cfg("http://localhost:4200", "kc_token")
            ).convert(buildJwt(claims));
            assertThat(token).isNotNull();
            assertThat(token.getName()).isEqualTo("user-sub-id");
        }

        @Test
        @DisplayName("rôles + scopes → autorités fusionnées")
        void rolesAndScopes_merged() throws Exception {
            Map<String, Object> realm = new HashMap<>();
            realm.put("roles", List.of("superadmin"));
            Map<String, Object> claims = new HashMap<>();
            claims.put("preferred_username", "admin");
            claims.put("realm_access", realm);
            claims.put("scope", "openid profile");
            AbstractAuthenticationToken token = getJwtConverter(
                cfg("http://localhost:4200", "kc_token")
            ).convert(buildJwt(claims));
            assertThat(token.getAuthorities()).extracting(GrantedAuthority::getAuthority)
                .contains("ROLE_SUPERADMIN");
        }

        @Test
        @DisplayName("aucun realm_access ni scope → token valide")
        void noRolesNoScope_tokenValid() throws Exception {
            Map<String, Object> claims = new HashMap<>();
            claims.put("preferred_username", "user");
            AbstractAuthenticationToken token = getJwtConverter(
                cfg("http://localhost:4200", "kc_token")
            ).convert(buildJwt(claims));
            assertThat(token).isNotNull();
            assertThat(token.getName()).isEqualTo("user");
        }
    }

    // ══════════════════════════════════════════════════════════════════════
    // 4. cookieBearerTokenResolver
    // ══════════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("cookieBearerTokenResolver")
    class BearerResolverTests {

        @Test
        @DisplayName("cookie présent → retourne le token")
        void cookie_present() throws Exception {
            BearerTokenResolver resolver = cfg("http://localhost:4200", "kc_token").cookieBearerTokenResolver();
            HttpServletRequest req = mock(HttpServletRequest.class);
            when(req.getCookies()).thenReturn(new Cookie[]{new Cookie("kc_token", "bearer-token")});
            assertThat(resolver.resolve(req)).isEqualTo("bearer-token");
        }

        @Test
        @DisplayName("cookies null → null (pas d'Authorization header)")
        void no_cookie_null() throws Exception {
            BearerTokenResolver resolver = cfg("http://localhost:4200", "kc_token").cookieBearerTokenResolver();
            HttpServletRequest req = mock(HttpServletRequest.class);
            when(req.getCookies()).thenReturn(null);
            when(req.getHeader("Authorization")).thenReturn(null);
            assertThat(resolver.resolve(req)).isNull();
        }

        @Test
        @DisplayName("cookie vide → délègue au DefaultBearerTokenResolver → null")
        void empty_cookie() throws Exception {
            BearerTokenResolver resolver = cfg("http://localhost:4200", "kc_token").cookieBearerTokenResolver();
            HttpServletRequest req = mock(HttpServletRequest.class);
            when(req.getCookies()).thenReturn(new Cookie[]{new Cookie("kc_token", "")});
            when(req.getHeader("Authorization")).thenReturn(null);
            assertThat(resolver.resolve(req)).isNull();
        }

        @Test
        @DisplayName("cookie blanc (espaces) → délègue → null")
        void blank_cookie() throws Exception {
            BearerTokenResolver resolver = cfg("http://localhost:4200", "kc_token").cookieBearerTokenResolver();
            HttpServletRequest req = mock(HttpServletRequest.class);
            when(req.getCookies()).thenReturn(new Cookie[]{new Cookie("kc_token", "   ")});
            when(req.getHeader("Authorization")).thenReturn(null);
            assertThat(resolver.resolve(req)).isNull();
        }
    }

    // ══════════════════════════════════════════════════════════════════════
    // 5. corsConfigurationSource
    // ══════════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("corsConfigurationSource")
    class CorsConfigTests {

        @Test
        @DisplayName("une origine → source non null")
        void single_origin() throws Exception {
            assertThat(cfg("http://localhost:4200", "kc_token").corsConfigurationSource()).isNotNull();
        }

        @Test
        @DisplayName("origines multiples (virgule) → source non null")
        void multiple_origins() throws Exception {
            assertThat(cfg("http://localhost:4200,https://prod.logiway.com", "kc_token")
                .corsConfigurationSource()).isNotNull();
        }
    }

    // ══════════════════════════════════════════════════════════════════════
    // 6. securityFilterChain — test d'intégration WebMvc
    //    Charge le vrai SecurityConfig pour couvrir securityFilterChain()
    // ══════════════════════════════════════════════════════════════════════

    /**
     * Test d'intégration léger : charge uniquement le layer Web avec SecurityConfig.
     * - /api/v1/health est public → 200 sans token
     * - /api/users est protégé → 401 sans token
     * - /api/auth/login est public → 404 (pas de contrôleur, mais pas 401)
     */
    @WebMvcTest(controllers = HealthController.class)
    @AutoConfigureMockMvc(addFilters = true)
    @Import(SecurityConfig.class)
    @TestPropertySource(properties = {
        "spring.security.oauth2.resourceserver.jwt.jwk-set-uri=http://localhost:8180/realms/logiway/protocol/openid-connect/certs",
        "app.cors.allowed-origins=http://localhost:4200",
        "app.cookie.name=kc_token"
    })
    @DisplayName("securityFilterChain — intégration WebMvc")
    static class SecurityFilterChainIntegrationTest {

        @Autowired
        private MockMvc mockMvc;

        @Test
        @DisplayName("GET /api/v1/health → 200 (endpoint public)")
        void healthEndpoint_isPermitAll() throws Exception {
            mockMvc.perform(get("/api/v1/health"))
                .andExpect(status().isOk());
        }

        @Test
        @DisplayName("GET /api/users → 401 (endpoint protégé, pas de token)")
        void protectedEndpoint_withoutToken_returns401() throws Exception {
            mockMvc.perform(get("/api/users"))
                .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("GET /api/auth/login (permitAll) → pas 401")
        void authLogin_isPermitAll() throws Exception {
            // L'URL est dans permitAll → pas 401 même si le handler n'existe pas
            mockMvc.perform(get("/api/auth/login"))
                .andExpect(result ->
                    assertThat(result.getResponse().getStatus()).isNotEqualTo(401));
        }

        @Test
        @DisplayName("GET /api/auth/logout → pas 401 (permitAll)")
        void authLogout_isPermitAll() throws Exception {
            mockMvc.perform(get("/api/auth/logout"))
                .andExpect(result ->
                    assertThat(result.getResponse().getStatus()).isNotEqualTo(401));
        }

        @Test
        @DisplayName("GET /swagger-ui/index.html → pas 401 (permitAll)")
        void swaggerUi_isPermitAll() throws Exception {
            mockMvc.perform(get("/swagger-ui/index.html"))
                .andExpect(result ->
                    assertThat(result.getResponse().getStatus()).isNotEqualTo(401));
        }

        @Test
        @DisplayName("GET /api/meteo → pas 401 (GPS endpoint, permitAll)")
        void meteo_isPermitAll() throws Exception {
            mockMvc.perform(get("/api/meteo"))
                .andExpect(result ->
                    assertThat(result.getResponse().getStatus()).isNotEqualTo(401));
        }

        @Test
        @DisplayName("GET /api/trajets/carte → pas 401 (permitAll)")
        void trajetsCarte_isPermitAll() throws Exception {
            mockMvc.perform(get("/api/trajets/carte"))
                .andExpect(result ->
                    assertThat(result.getResponse().getStatus()).isNotEqualTo(401));
        }
    }
}
