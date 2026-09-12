package com.logiway.dto.response;

public record TokenRefreshResponse(
    String accessToken,
    String refreshToken,
    long expiresIn,
    long refreshExpiresIn,
    String tokenType
) {}
