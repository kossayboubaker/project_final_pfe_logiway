package com.logiway.services.impl;

import com.logiway.entities.RefreshToken;
import com.logiway.entities.Utilisateur;
import com.logiway.repositories.RefreshTokenRepository;
import com.logiway.repositories.UtilisateurRepository;
import com.logiway.services.TokenRefreshService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
public class TokenRefreshServiceImpl implements TokenRefreshService {

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private UtilisateurRepository utilisateurRepository;

    @Value("${jwt.refresh-token-expiration:604800000}")
    private long refreshTokenExpirationMs;

    @Override
    @Transactional
    public String generateRefreshToken(Long userId) {
        Optional<Utilisateur> utilisateurOpt = utilisateurRepository.findById(userId);
        if (utilisateurOpt.isEmpty()) {
            throw new IllegalArgumentException("Utilisateur not found");
        }

        Utilisateur utilisateur = utilisateurOpt.get();

        // Revoke all existing refresh tokens for this user
        refreshTokenRepository.revokeAllByUtilisateur(utilisateur);

        // Generate new refresh token
        String token = UUID.randomUUID().toString();
        LocalDateTime expiryDate = LocalDateTime.now().plusSeconds(refreshTokenExpirationMs / 1000);

        RefreshToken refreshToken = new RefreshToken(token, utilisateur, expiryDate);
        refreshTokenRepository.save(refreshToken);

        return token;
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Long> validateRefreshToken(String refreshToken) {
        Optional<RefreshToken> tokenOpt = refreshTokenRepository.findByToken(refreshToken);

        if (tokenOpt.isPresent()) {
            RefreshToken token = tokenOpt.get();
            if (token.isValid()) {
                return Optional.of(token.getUtilisateur().getId());
            }
        }

        return Optional.empty();
    }

    @Override
    @Transactional
    public void revokeRefreshToken(String refreshToken) {
        Optional<RefreshToken> tokenOpt = refreshTokenRepository.findByToken(refreshToken);
        if (tokenOpt.isPresent()) {
            RefreshToken token = tokenOpt.get();
            token.setRevoked(true);
            refreshTokenRepository.save(token);
        }
    }

    @Override
    @Transactional
    public void revokeAllUserTokens(Long userId) {
        Optional<Utilisateur> utilisateurOpt = utilisateurRepository.findById(userId);
        if (utilisateurOpt.isPresent()) {
            refreshTokenRepository.revokeAllByUtilisateur(utilisateurOpt.get());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isRefreshTokenValid(String refreshToken) {
        return validateRefreshToken(refreshToken).isPresent();
    }

    @Override
    @Transactional
    public void cleanupExpiredTokens() {
        refreshTokenRepository.deleteExpiredTokens(LocalDateTime.now());
    }
}
