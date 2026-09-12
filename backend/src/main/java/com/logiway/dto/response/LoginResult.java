package com.logiway.dto.response;

public record LoginResult(
    String accessToken,
    String refreshToken,
    long accessTokenExpiresIn,
    long refreshTokenExpiresIn,
    UserResponse user,
    boolean firstLogin,
    boolean hasCompany
) {
}