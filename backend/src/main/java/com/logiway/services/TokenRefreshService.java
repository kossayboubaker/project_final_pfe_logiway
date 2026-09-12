package com.logiway.services;

import java.util.Optional;

public interface TokenRefreshService {
    String generateRefreshToken(Long userId);

    Optional<Long> validateRefreshToken(String refreshToken);

    void revokeRefreshToken(String refreshToken);

    void revokeAllUserTokens(Long userId);

    boolean isRefreshTokenValid(String refreshToken);

    void cleanupExpiredTokens();
}
