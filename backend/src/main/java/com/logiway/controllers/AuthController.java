package com.logiway.controllers;

import com.logiway.dto.request.ForgotPasswordRequest;
import com.logiway.dto.request.LoginRequest;
import com.logiway.dto.request.ResetPasswordRequest;
import com.logiway.dto.response.ApiMessageResponse;
import com.logiway.dto.response.AuthSessionResponse;
import com.logiway.dto.response.LoginResult;
import com.logiway.exceptions.BadRequestException;
import com.logiway.services.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @Value("${app.cookie.name:kc_token}")
    private String accessCookieName;

    @Value("${app.cookie.refresh-name:kc_refresh}")
    private String refreshCookieName;

    @Value("${app.cookie.secure:false}")
    private boolean secureCookies;

    @PostMapping("/login")
    public ResponseEntity<AuthSessionResponse> login(@Valid @RequestBody LoginRequest request) {
        LoginResult result = authService.login(request);

        ResponseCookie accessCookie = ResponseCookie.from(accessCookieName, result.accessToken())
            .httpOnly(true)
            .secure(secureCookies)
            .sameSite("Strict")
            .path("/")
            .maxAge(cookieMaxAge(result.accessTokenExpiresIn()))
            .build();

        ResponseCookie refreshCookie = ResponseCookie.from(refreshCookieName, result.refreshToken())
            .httpOnly(true)
            .secure(secureCookies)
            .sameSite("Strict")
            .path("/")
            .maxAge(cookieMaxAge(result.refreshTokenExpiresIn()))
            .build();

        AuthSessionResponse body = new AuthSessionResponse(
            result.user().role().name(),
            result.user().prenom(),
            result.user().nom(),
            result.firstLogin(),
            result.hasCompany()
        );

        return ResponseEntity.ok()
            .header(HttpHeaders.SET_COOKIE, accessCookie.toString())
            .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
            .body(body);
    }

    @GetMapping("/me")
    public ResponseEntity<AuthSessionResponse> me() {
        return ResponseEntity.ok(authService.me());
    }

    @PostMapping("/refresh")
    public ResponseEntity<Void> refresh(HttpServletRequest request) {
        String refreshToken = null;
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if (refreshCookieName.equals(cookie.getName())) {
                    refreshToken = cookie.getValue();
                    break;
                }
            }
        }

        if (refreshToken == null || refreshToken.isBlank()) {
            throw new BadRequestException("Refresh token is missing");
        }

        try {
            Map<String, Object> newTokenPayload = authService.refreshTokenFromKeycloak(refreshToken);

            String newAccessToken = (String) newTokenPayload.get("access_token");
            String newRefreshToken = (String) newTokenPayload.getOrDefault("refresh_token", refreshToken);
            Number expiresIn = (Number) newTokenPayload.get("expires_in");
            Number refreshExpiresIn = (Number) newTokenPayload.getOrDefault("refresh_expires_in", expiresIn);

            ResponseCookie newAccessCookie = ResponseCookie.from(accessCookieName, newAccessToken)
                .httpOnly(true)
                .secure(secureCookies)
                .sameSite("Strict")
                .path("/")
                .maxAge(cookieMaxAge(expiresIn.longValue()))
                .build();

            ResponseCookie newRefreshCookie = ResponseCookie.from(refreshCookieName, newRefreshToken)
                .httpOnly(true)
                .secure(secureCookies)
                .sameSite("Strict")
                .path("/")
                .maxAge(cookieMaxAge(refreshExpiresIn.longValue()))
                .build();

            return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, newAccessCookie.toString())
                .header(HttpHeaders.SET_COOKIE, newRefreshCookie.toString())
                .build();
        } catch (Exception ex) {
            throw new BadRequestException("Token refresh failed. Please login again.");
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiMessageResponse> logout(HttpServletRequest request) {
        String refreshToken = null;
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if (refreshCookieName.equals(cookie.getName())) {
                    refreshToken = cookie.getValue();
                    break;
                }
            }
        }

        ApiMessageResponse response = authService.logout(refreshToken);

        ResponseCookie clearAccessCookie = ResponseCookie.from(accessCookieName, "")
            .httpOnly(true)
            .secure(secureCookies)
            .sameSite("Strict")
            .path("/")
            .maxAge(0)
            .build();

        ResponseCookie clearRefreshCookie = ResponseCookie.from(refreshCookieName, "")
            .httpOnly(true)
            .secure(secureCookies)
            .sameSite("Strict")
            .path("/")
            .maxAge(0)
            .build();

        return ResponseEntity.ok()
            .header(HttpHeaders.SET_COOKIE, clearAccessCookie.toString())
            .header(HttpHeaders.SET_COOKIE, clearRefreshCookie.toString())
            .body(response);
    }

    private Duration cookieMaxAge(long tokenExpiresInSeconds) {
        long effectiveSeconds = Math.max(tokenExpiresInSeconds, 0);
        return Duration.ofSeconds(effectiveSeconds);
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiMessageResponse> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        return ResponseEntity.ok(authService.forgotPassword(request));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiMessageResponse> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        return ResponseEntity.ok(authService.resetPassword(request));
    }

    @PostMapping("/rejection-reason")
    public ResponseEntity<ApiMessageResponse> rejectionReason(@Valid @RequestBody ForgotPasswordRequest request) {
        return ResponseEntity.ok(authService.getRejectionReason(request));
    }

    @GetMapping("/verify-email")
    public ResponseEntity<ApiMessageResponse> verifyEmail(@RequestParam("token") String token) {
        return ResponseEntity.ok(authService.verifyEmail(token));
    }
}
