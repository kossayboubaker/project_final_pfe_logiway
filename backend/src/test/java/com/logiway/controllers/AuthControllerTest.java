package com.logiway.controllers;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.logiway.dto.request.ForgotPasswordRequest;
import com.logiway.dto.request.LoginRequest;
import com.logiway.dto.request.ResetPasswordRequest;
import com.logiway.dto.response.ApiMessageResponse;
import com.logiway.dto.response.AuthSessionResponse;
import com.logiway.dto.response.LoginResult;
import com.logiway.dto.response.UserResponse;
import com.logiway.entities.enums.Role;
import com.logiway.entities.enums.StatutCompte;
import com.logiway.services.AuthService;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AuthService authService;

    @Test
    void loginReturnsTokenPayload() throws Exception {
        when(authService.login(any(LoginRequest.class))).thenReturn(new LoginResult(
            "access-token-value",
            "refresh-token-value",
            3600,
            86400,
            new UserResponse(1L, "kc-1", "Logi", "Admin", "logiAdmin@logiway.com", null, null, null, StatutCompte.ACTIF, true, true, null, Role.SUPERADMIN, null, null, null, null, null, null, null, null, LocalDateTime.now()),
            false,
            true
        ));
        
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new LoginRequest("logiAdmin@logiway.com", "logiway2026"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.role").value("SUPERADMIN"))
            .andExpect(jsonPath("$.prenom").value("Logi"))
            .andExpect(jsonPath("$.nom").value("Admin"))
            .andExpect(jsonPath("$.firstLogin").value(false));
    }

    @Test
    void meReturnsSession() throws Exception {
        when(authService.me()).thenReturn(new AuthSessionResponse("MANAGER", "Jean", "Dupont", true, true));

        mockMvc.perform(get("/api/auth/me"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.role").value("MANAGER"))
            .andExpect(jsonPath("$.prenom").value("Jean"))
            .andExpect(jsonPath("$.firstLogin").value(true));
    }

    @Test
    void refreshWithCookieReturnsNewTokens() throws Exception {
        Map<String, Object> payload = new HashMap<>();
        payload.put("access_token", "new-access");
        payload.put("refresh_token", "new-refresh");
        payload.put("expires_in", 3600);
        payload.put("refresh_expires_in", 86400);
        when(authService.refreshTokenFromKeycloak("old-refresh")).thenReturn(payload);

        mockMvc.perform(post("/api/auth/refresh")
                .cookie(new Cookie("kc_refresh", "old-refresh")))
            .andExpect(status().isOk())
            .andExpect(header().exists(HttpHeaders.SET_COOKIE));
    }

    @Test
    void refreshWithoutCookieReturns400() throws Exception {
        mockMvc.perform(post("/api/auth/refresh"))
            .andExpect(status().isBadRequest());
    }

    @Test
    void refreshServiceFailureReturns400() throws Exception {
        when(authService.refreshTokenFromKeycloak(any())).thenThrow(new RuntimeException("boom"));

        mockMvc.perform(post("/api/auth/refresh")
                .cookie(new Cookie("kc_refresh", "old-refresh")))
            .andExpect(status().isBadRequest());
    }

    @Test
    void logoutWithCookieClearsSession() throws Exception {
        when(authService.logout("old-refresh")).thenReturn(new ApiMessageResponse("Déconnecté"));

        mockMvc.perform(post("/api/auth/logout")
                .cookie(new Cookie("kc_refresh", "old-refresh")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.message").value("Déconnecté"));
    }

    @Test
    void logoutWithoutCookieClearsSession() throws Exception {
        when(authService.logout(null)).thenReturn(new ApiMessageResponse("Déconnecté"));

        mockMvc.perform(post("/api/auth/logout"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.message").value("Déconnecté"));
    }

    @Test
    void forgotPasswordReturnsMessage() throws Exception {
        when(authService.forgotPassword(any(ForgotPasswordRequest.class)))
            .thenReturn(new ApiMessageResponse("Email envoyé"));

        mockMvc.perform(post("/api/auth/forgot-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"a@b.fr\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.message").value("Email envoyé"));
    }

    @Test
    void resetPasswordReturnsMessage() throws Exception {
        when(authService.resetPassword(any(ResetPasswordRequest.class)))
            .thenReturn(new ApiMessageResponse("Mot de passe réinitialisé"));

        mockMvc.perform(post("/api/auth/reset-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"code\":\"1234\",\"newPassword\":\"newpassword1\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.message").value("Mot de passe réinitialisé"));
    }

    @Test
    void rejectionReasonReturnsMessage() throws Exception {
        when(authService.getRejectionReason(any(ForgotPasswordRequest.class)))
            .thenReturn(new ApiMessageResponse("Raison du rejet"));

        mockMvc.perform(post("/api/auth/rejection-reason")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"a@b.fr\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.message").value("Raison du rejet"));
    }

    @Test
    void verifyEmailReturnsMessage() throws Exception {
        when(authService.verifyEmail("tok123")).thenReturn(new ApiMessageResponse("Email vérifié"));

        mockMvc.perform(get("/api/auth/verify-email").param("token", "tok123"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.message").value("Email vérifié"));
    }

    @Test
    void refreshWithBlankCookieReturns400() throws Exception {
        mockMvc.perform(post("/api/auth/refresh")
                .cookie(new Cookie("kc_refresh", "")))
            .andExpect(status().isBadRequest());
    }

    @Test
    void refreshWithNoCookiesReturns400() throws Exception {
        mockMvc.perform(post("/api/auth/refresh"))
            .andExpect(status().isBadRequest());
    }

    @Test
    void logoutWithNoCookiesClearsSession() throws Exception {
        when(authService.logout(null)).thenReturn(new ApiMessageResponse("Déconnecté"));

        mockMvc.perform(post("/api/auth/logout"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.message").value("Déconnecté"));
    }

    @Test
    void loginSetsAccessAndRefreshCookies() throws Exception {
        when(authService.login(any(LoginRequest.class))).thenReturn(new LoginResult(
            "access-token",
            "refresh-token",
            3600,
            86400,
            new UserResponse(1L, "kc-1", "Test", "User", "test@logiway.com", null, null, null, StatutCompte.ACTIF, true, true, null, Role.MANAGER, null, null, null, null, null, null, null, null, LocalDateTime.now()),
            true,
            false
        ));

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new LoginRequest("test@logiway.com", "password"))))
            .andExpect(status().isOk())
            .andExpect(header().exists(HttpHeaders.SET_COOKIE));
    }

    @Test
    void refreshWithValidCookieReturnsNewTokens() throws Exception {
        Map<String, Object> payload = new HashMap<>();
        payload.put("access_token", "new-access-token");
        payload.put("refresh_token", "new-refresh-token");
        payload.put("expires_in", 3600);
        payload.put("refresh_expires_in", 86400);
        when(authService.refreshTokenFromKeycloak("valid-refresh")).thenReturn(payload);

        mockMvc.perform(post("/api/auth/refresh")
                .cookie(new Cookie("kc_refresh", "valid-refresh")))
            .andExpect(status().isOk())
            .andExpect(header().exists(HttpHeaders.SET_COOKIE));
    }

    @Test
    void refreshWithDifferentCookieNameReturns400() throws Exception {
        mockMvc.perform(post("/api/auth/refresh")
                .cookie(new Cookie("different_cookie", "some-value")))
            .andExpect(status().isBadRequest());
    }

    @Test
    void logoutWithDifferentCookieNameClearsSession() throws Exception {
        when(authService.logout(null)).thenReturn(new ApiMessageResponse("Déconnecté"));

        mockMvc.perform(post("/api/auth/logout")
                .cookie(new Cookie("different_cookie", "some-value")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.message").value("Déconnecté"));
    }
}
