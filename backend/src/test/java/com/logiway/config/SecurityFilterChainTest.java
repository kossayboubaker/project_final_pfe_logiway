package com.logiway.config;

import com.logiway.controllers.HealthController;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Test d'intégration léger pour SecurityConfig.securityFilterChain().
 *
 * Charge le vrai SecurityConfig via @WebMvcTest + @Import sans démarrer DB ni Keycloak.
 * Couvre securityFilterChain(), cors, bearer resolver, jwt converter (appels réels).
 */
@WebMvcTest(controllers = HealthController.class)
@AutoConfigureMockMvc(addFilters = true)
@Import(SecurityConfig.class)
@TestPropertySource(properties = {
    "spring.security.oauth2.resourceserver.jwt.jwk-set-uri=" +
        "http://localhost:8180/realms/logiway/protocol/openid-connect/certs",
    "app.cors.allowed-origins=http://localhost:4200",
    "app.cookie.name=kc_token"
})
@DisplayName("SecurityConfig — securityFilterChain (intégration WebMvc)")
class SecurityFilterChainTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("GET /api/v1/health → 200 OK (endpoint public permitAll)")
    void healthEndpoint_isPermitAll() throws Exception {
        mockMvc.perform(get("/api/v1/health"))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/users → 401 Unauthorized (endpoint protégé, sans token)")
    void protectedEndpoint_withoutToken_returns401() throws Exception {
        mockMvc.perform(get("/api/users"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /api/auth/login → pas 401 (dans permitAll)")
    void authLogin_isPermitAll() throws Exception {
        int status = mockMvc.perform(get("/api/auth/login"))
            .andReturn().getResponse().getStatus();
        assertThat(status).isNotEqualTo(401);
    }

    @Test
    @DisplayName("GET /api/auth/logout → pas 401 (dans permitAll)")
    void authLogout_isPermitAll() throws Exception {
        int status = mockMvc.perform(get("/api/auth/logout"))
            .andReturn().getResponse().getStatus();
        assertThat(status).isNotEqualTo(401);
    }

    @Test
    @DisplayName("GET /api/auth/refresh → pas 401 (dans permitAll)")
    void authRefresh_isPermitAll() throws Exception {
        int status = mockMvc.perform(get("/api/auth/refresh"))
            .andReturn().getResponse().getStatus();
        assertThat(status).isNotEqualTo(401);
    }

    @Test
    @DisplayName("GET /api/auth/forgot-password → pas 401 (dans permitAll)")
    void authForgotPassword_isPermitAll() throws Exception {
        int status = mockMvc.perform(get("/api/auth/forgot-password"))
            .andReturn().getResponse().getStatus();
        assertThat(status).isNotEqualTo(401);
    }

    @Test
    @DisplayName("GET /api/meteo → pas 401 (GPS endpoint, permitAll)")
    void meteo_isPermitAll() throws Exception {
        int status = mockMvc.perform(get("/api/meteo"))
            .andReturn().getResponse().getStatus();
        assertThat(status).isNotEqualTo(401);
    }

    @Test
    @DisplayName("GET /api/trajets/carte → pas 401 (permitAll)")
    void trajetsCarte_isPermitAll() throws Exception {
        int status = mockMvc.perform(get("/api/trajets/carte"))
            .andReturn().getResponse().getStatus();
        assertThat(status).isNotEqualTo(401);
    }

    @Test
    @DisplayName("GET /api/trajets/1/position → pas 401 (permitAll wildcard)")
    void trajetsPosition_isPermitAll() throws Exception {
        int status = mockMvc.perform(get("/api/trajets/1/position"))
            .andReturn().getResponse().getStatus();
        assertThat(status).isNotEqualTo(401);
    }

    @Test
    @DisplayName("GET /swagger-ui/index.html → pas 401 (permitAll)")
    void swaggerUi_isPermitAll() throws Exception {
        int status = mockMvc.perform(get("/swagger-ui/index.html"))
            .andReturn().getResponse().getStatus();
        assertThat(status).isNotEqualTo(401);
    }

    @Test
    @DisplayName("GET /api/conges → 401 (endpoint protégé quelconque)")
    void conges_returns401() throws Exception {
        mockMvc.perform(get("/api/conges"))
            .andExpect(status().isUnauthorized());
    }
}
