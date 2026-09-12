package com.logiway.services;

import java.util.Map;

public interface KeycloakService {

    Map<String, Object> fetchTokenByPassword(String username, String password);

    Map<String, Object> refreshAccessToken(String refreshToken);

    String createUserAccount(String email, String password, String firstName, String lastName, String roleName, boolean enabled);

    void updatePasswordByEmail(String email, String newPassword);

    void logoutByRefreshToken(String refreshToken);
}
