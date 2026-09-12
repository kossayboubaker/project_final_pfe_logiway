package com.logiway.services.impl;

import com.logiway.dto.request.ForgotPasswordRequest;
import com.logiway.dto.request.LoginRequest;
import com.logiway.dto.request.ResetPasswordRequest;
import com.logiway.dto.response.ApiMessageResponse;
import com.logiway.dto.response.AuthSessionResponse;
import com.logiway.dto.response.LoginResult;
import com.logiway.dto.response.UserResponse;
import com.logiway.entities.ResetToken;
import com.logiway.entities.Utilisateur;
import com.logiway.entities.enums.StatutCompte;
import com.logiway.exceptions.AccountRejectedException;
import com.logiway.exceptions.AuthProviderUnavailableException;
import com.logiway.exceptions.BadRequestException;
import com.logiway.exceptions.UnauthorizedException;
import com.logiway.mappers.UserMapper;
import com.logiway.repositories.ResetTokenRepository;
import com.logiway.repositories.UtilisateurRepository;
import com.logiway.security.AuthenticatedUserService;
import com.logiway.services.AuthService;
import com.logiway.services.KeycloakService;
import com.logiway.services.MailService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UtilisateurRepository utilisateurRepository;
    private final ResetTokenRepository resetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final KeycloakService keycloakService;
    private final MailService mailService;
    private final UserMapper userMapper;
    private final AuthenticatedUserService authenticatedUserService;

    @Value("${app.reset-password.ttl-minutes:15}")
    private long resetTokenTtlMinutes;

    @Override
    @Transactional
    public LoginResult login(LoginRequest request) {
        String normalizedEmail = normalizeEmail(request.email());

        Utilisateur user = utilisateurRepository.findByEmailIgnoreCase(normalizedEmail)
            .orElseThrow(() -> new UnauthorizedException("Invalid credentials"));

        if (user.getEstActif() != StatutCompte.ACTIF) {
            if (user.getEstActif() == StatutCompte.REJETE) {
                String reason = user.getRejectionReason();
                if (reason != null && !reason.isBlank()) {
                    throw new AccountRejectedException("Compte rejeté : " + reason);
                }
                throw new AccountRejectedException("Compte rejeté par l'administrateur");
            }
            throw new UnauthorizedException("Account is disabled");
        }

        Map<String, Object> tokenPayload;
        try {
            tokenPayload = keycloakService.fetchTokenByPassword(normalizedEmail, request.password());
        } catch (UnauthorizedException ex) {
            throw new UnauthorizedException("Invalid credentials");
        } catch (AuthProviderUnavailableException ex) {
            throw ex;
        } catch (BadRequestException ex) {
            throw new AuthProviderUnavailableException("Authentication service is temporarily unavailable");
        }

        if (tokenPayload == null || tokenPayload.get("access_token") == null) {
            throw new UnauthorizedException("Unable to generate access token");
        }

        // Keycloak is the source of truth; if local hash drifted, self-heal it after successful auth.
        boolean needsLocalPasswordSync = false;
        try {
            needsLocalPasswordSync = !passwordEncoder.matches(request.password(), user.getPasswordHash());
        } catch (IllegalArgumentException ex) {
            needsLocalPasswordSync = true;
        }

        if (needsLocalPasswordSync) {
            user.setPasswordHash(passwordEncoder.encode(request.password()));
            utilisateurRepository.save(user);
        }

        long expiresIn = Long.parseLong(tokenPayload.getOrDefault("expires_in", 0).toString());
        long refreshExpiresIn = Long.parseLong(tokenPayload.getOrDefault("refresh_expires_in", 0).toString());
        UserResponse userResponse = userMapper.toResponse(user);
        boolean isFirstLogin = !user.getEmailVerifie();

        return new LoginResult(
            tokenPayload.get("access_token").toString(),
            tokenPayload.getOrDefault("refresh_token", "").toString(),
            expiresIn,
            refreshExpiresIn,
            userResponse,
            isFirstLogin,
            user.getEntreprise() != null
        );
    }

    @Override
    public AuthSessionResponse me() {
        Utilisateur currentUser = authenticatedUserService.getCurrentUser();
        return new AuthSessionResponse(
            currentUser.getRole().name(),
            currentUser.getPrenom(),
            currentUser.getNom(),
            !Boolean.TRUE.equals(currentUser.getEmailVerifie()),
            currentUser.getEntreprise() != null
        );
    }

    @Override
    public ApiMessageResponse logout(String refreshToken) {
        if (refreshToken != null && !refreshToken.isBlank()) {
            keycloakService.logoutByRefreshToken(refreshToken);
        }
        return new ApiMessageResponse("Logged out successfully");
    }

    @Override
    @Transactional
    public ApiMessageResponse forgotPassword(ForgotPasswordRequest request) {
        Utilisateur user = utilisateurRepository.findByEmailIgnoreCase(request.email()).orElse(null);
        if (user == null) {
            return new ApiMessageResponse("If the email exists, a reset code has been sent.");
        }

        resetTokenRepository.deleteByUtilisateur(user);
        resetTokenRepository.deleteByExpiresAtBefore(LocalDateTime.now());

        String code = String.format("%06d", ThreadLocalRandom.current().nextInt(0, 1_000_000));
        ResetToken token = ResetToken.builder()
            .code(code)
            .expiresAt(LocalDateTime.now().plusMinutes(resetTokenTtlMinutes))
            .used(false)
            .utilisateur(user)
            .build();

        resetTokenRepository.save(token);
        mailService.sendResetCodeEmail(user, code);

        return new ApiMessageResponse("If the email exists, a reset code has been sent.");
    }

    @Override
    @Transactional
    public ApiMessageResponse resetPassword(ResetPasswordRequest request) {
        ResetToken resetToken = resetTokenRepository.findByCodeAndUsedFalse(request.code())
            .orElseThrow(() -> new BadRequestException("Invalid reset code"));

        if (resetToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Reset code expired");
        }

        Utilisateur user = resetToken.getUtilisateur();
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        utilisateurRepository.save(user);
        keycloakService.updatePasswordByEmail(user.getEmail(), request.newPassword());

        resetToken.setUsed(true);
        resetTokenRepository.save(resetToken);

        return new ApiMessageResponse("Password updated successfully");
    }

    @Override
    @Transactional(readOnly = true)
    public ApiMessageResponse getRejectionReason(ForgotPasswordRequest request) {
        String normalizedEmail = normalizeEmail(request.email());
        Utilisateur user = utilisateurRepository.findByEmailIgnoreCase(normalizedEmail).orElse(null);
        if (user == null || user.getEstActif() == StatutCompte.ACTIF) {
            return new ApiMessageResponse("Email ou mot de passe invalide");
        }

        String reason = user.getRejectionReason();
        if (reason == null || reason.isBlank()) {
            return new ApiMessageResponse("Compte rejeté par l'administrateur");
        }

        return new ApiMessageResponse("Compte rejeté : " + reason);
    }

    @Override
    @Transactional(readOnly = true)
    public ApiMessageResponse verifyEmail(String token) {
        Utilisateur user = utilisateurRepository.findByVerificationToken(token)
            .orElseThrow(() -> new BadRequestException("Invalid verification token"));

        user.setEmailVerifie(true);
        user.setVerificationToken(null);
        utilisateurRepository.save(user);
        return new ApiMessageResponse("Email verified");
    }

    @Override
    public Map<String, Object> refreshTokenFromKeycloak(String refreshToken) {
        return keycloakService.refreshAccessToken(refreshToken);
    }

    private String normalizeEmail(String email) {
        if (email == null) {
            return "";
        }
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
