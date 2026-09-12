package com.logiway.services.impl;

import com.logiway.exceptions.BadRequestException;
import com.logiway.exceptions.AuthProviderUnavailableException;
import com.logiway.exceptions.UnauthorizedException;
import com.logiway.services.KeycloakService;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.util.UriComponentsBuilder;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class KeycloakServiceImpl implements KeycloakService {

    private final RestTemplate restTemplate;

    @Value("${app.keycloak.server-url}")
    private String serverUrl;

    @Value("${app.keycloak.realm}")
    private String realm;

    @Value("${app.keycloak.client-id}")
    private String clientId;

    @Value("${app.keycloak.client-secret:}")
    private String clientSecret;

    @Value("${app.keycloak.admin-client-id:${app.keycloak.client-id}}")
    private String adminClientId;

    @Value("${app.keycloak.admin-client-secret:${app.keycloak.client-secret:}}")
    private String adminClientSecret;

    @Value("${KEYCLOAK_ADMIN_USERNAME:admin}")
    private String keycloakAdminUsername;

    @Value("${KEYCLOAK_ADMIN_PASSWORD:admin}")
    private String keycloakAdminPassword;

    @Value("${KEYCLOAK_ADMIN_REALM:master}")
    private String keycloakAdminRealm;

    @PostConstruct
    public void checkKeycloakConnectivity() {
        String configUrl = String.format("%s/realms/%s/.well-known/openid-configuration", serverUrl, realm);
        try {
            restTemplate.getForEntity(configUrl, String.class);
            log.info("Keycloak is reachable — realm [{}] is configured correctly", realm);
        } catch (Exception e) {
            log.warn("Keycloak is NOT reachable at startup — all authentication requests will fail until Keycloak is available at [{}]", configUrl);
        }
    }

    @Override
    @SuppressWarnings("unchecked")
    public Map<String, Object> fetchTokenByPassword(String username, String password) {
        String tokenUrl = String.format("%s/realms/%s/protocol/openid-connect/token", serverUrl, realm);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("grant_type", "password");
        body.add("client_id", clientId);
        if (clientSecret != null && !clientSecret.isBlank()) {
            body.add("client_secret", clientSecret);
        }
        body.add("username", username);
        body.add("password", password);

        try {
            @SuppressWarnings("rawtypes")
            ResponseEntity<Map> response = restTemplate.postForEntity(tokenUrl, new HttpEntity<>(body, headers), Map.class);
            return response.getBody();
        } catch (RestClientResponseException ex) {
            String responseBody = ex.getResponseBodyAsString();
            if (ex.getStatusCode().value() == 401) {
                throw new UnauthorizedException("Invalid credentials");
            } else if (ex.getStatusCode().value() == 400) {
                log.error("Keycloak rejected selection (400 Bad Request). Body: {}", responseBody);
                throw new AuthProviderUnavailableException("Authentication service configuration error: " + responseBody);
            }
            log.error("Keycloak error ({}): {}", ex.getStatusCode(), responseBody);
            throw new AuthProviderUnavailableException("Authentication service is temporarily unavailable");
        } catch (ResourceAccessException ex) {
            log.error("Keycloak unreachable at [{}]: {}", tokenUrl, ex.getMessage());
            throw new AuthProviderUnavailableException("Authentication service is unreachable");
        } catch (Exception ex) {
            log.error("Unexpected authentication error: {}", ex.getMessage());
            throw new AuthProviderUnavailableException("Authentication service is temporarily unavailable");
        }
    }

    @Override
    @SuppressWarnings("unchecked")
    public Map<String, Object> refreshAccessToken(String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new BadRequestException("Refresh token is required");
        }

        String tokenUrl = String.format("%s/realms/%s/protocol/openid-connect/token", serverUrl, realm);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("grant_type", "refresh_token");
        body.add("client_id", clientId);
        if (clientSecret != null && !clientSecret.isBlank()) {
            body.add("client_secret", clientSecret);
        }
        body.add("refresh_token", refreshToken);

        try {
            @SuppressWarnings("rawtypes")
            ResponseEntity<Map> response = restTemplate.postForEntity(tokenUrl, new HttpEntity<>(body, headers), Map.class);
            return response.getBody();
        } catch (HttpStatusCodeException ex) {
            throw new BadRequestException("Token refresh failed: Invalid or expired refresh token");
        } catch (ResourceAccessException ex) {
            throw new AuthProviderUnavailableException("Authentication service is temporarily unavailable");
        } catch (Exception ex) {
            throw new AuthProviderUnavailableException("Authentication service is temporarily unavailable");
        }
    }

    @Override
    public String createUserAccount(String email, String password, String firstName, String lastName, String roleName,
            boolean enabled) {
        String adminToken = fetchAdminToken();
        String createUserUrl = String.format("%s/admin/realms/%s/users", serverUrl, realm);

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(adminToken);
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> payload = Map.of(
                "username", email,
                "email", email,
                "firstName", firstName == null ? "" : firstName,
                "lastName", lastName == null ? "" : lastName,
                "enabled", enabled,
                "emailVerified", Boolean.TRUE,
                "credentials", List.of(Map.of(
                        "type", "password",
                        "value", password,
                        "temporary", Boolean.FALSE)));

        try {
            ResponseEntity<Void> response = restTemplate.postForEntity(createUserUrl,
                    new HttpEntity<>(payload, headers), Void.class);
            String userId = extractUserId(response, adminToken, email);
            if (userId == null || userId.isBlank()) {
                throw new BadRequestException("Unable to create Keycloak user for email: " + email);
            }

            assignRealmRole(adminToken, userId, roleName);
            return userId;
        } catch (HttpStatusCodeException ex) {
            if (ex.getStatusCode().value() == 409) {
                String existingUserId = findUserIdByEmail(adminToken, email);
                if (existingUserId == null || existingUserId.isBlank()) {
                    throw new BadRequestException("Keycloak reports duplicate email but user was not found: " + email);
                }

                ensureUserEnabled(adminToken, existingUserId, email, firstName, lastName);
                resetPasswordByUserId(adminToken, existingUserId, password);
                assignRealmRole(adminToken, existingUserId, roleName);
                return existingUserId;
            }
            throw new BadRequestException("Unexpected Keycloak user creation error: " + ex.getResponseBodyAsString());
        } catch (BadRequestException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new BadRequestException("Unexpected Keycloak user creation error: " + ex.getMessage());
        }
    }

    @Override
    public void updatePasswordByEmail(String email, String newPassword) {
        String adminToken = fetchAdminToken();
        String userId = findUserIdByEmail(adminToken, email);
        if (userId == null || userId.isBlank()) {
            throw new BadRequestException("Keycloak user not found for email: " + email);
        }

        resetPasswordByUserId(adminToken, userId, newPassword);
    }

    @Override
    public void logoutByRefreshToken(String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) {
            return;
        }

        String logoutUrl = String.format("%s/realms/%s/protocol/openid-connect/logout", serverUrl, realm);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("client_id", clientId);
        if (clientSecret != null && !clientSecret.isBlank()) {
            body.add("client_secret", clientSecret);
        }
        body.add("refresh_token", refreshToken);

        try {
            restTemplate.postForEntity(logoutUrl, new HttpEntity<>(body, headers), Void.class);
        } catch (HttpStatusCodeException ex) {
            throw new BadRequestException("Unable to logout from Keycloak: " + ex.getResponseBodyAsString());
        } catch (ResourceAccessException ex) {
            throw new BadRequestException("Keycloak is unreachable during logout.");
        }
    }

    private void resetPasswordByUserId(String adminToken, String userId, String newPassword) {

        String resetPasswordUrl = String.format("%s/admin/realms/%s/users/%s/reset-password", serverUrl, realm, userId);

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(adminToken);
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> payload = Map.of(
                "type", "password",
                "temporary", Boolean.FALSE,
                "value", newPassword);

        try {
            restTemplate.exchange(resetPasswordUrl, HttpMethod.PUT, new HttpEntity<>(payload, headers), Void.class);
        } catch (HttpStatusCodeException ex) {
            throw new BadRequestException("Unable to update password in Keycloak: " + ex.getResponseBodyAsString());
        } catch (ResourceAccessException ex) {
            throw new BadRequestException("Keycloak is unreachable while updating password.");
        } catch (Exception ex) {
            throw new BadRequestException("Unexpected Keycloak password update error: " + ex.getMessage());
        }
    }

    private String fetchAdminToken() {
        String tokenUrl = String.format("%s/realms/%s/protocol/openid-connect/token", serverUrl, realm);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("grant_type", "client_credentials");
        body.add("client_id", adminClientId);
        if (adminClientSecret != null && !adminClientSecret.isBlank()) {
            body.add("client_secret", adminClientSecret);
        }

        try {
            @SuppressWarnings("rawtypes")
            ResponseEntity<Map> response = restTemplate.postForEntity(tokenUrl, new HttpEntity<>(body, headers), Map.class);
            Object accessToken = response.getBody() != null ? response.getBody().get("access_token") : null;
            if (accessToken == null) {
                throw new BadRequestException("Unable to get Keycloak admin token");
            }
            return accessToken.toString();
        } catch (HttpStatusCodeException ex) {
            return fetchAdminTokenWithAdminCli(ex.getResponseBodyAsString());
        } catch (ResourceAccessException ex) {
            throw new BadRequestException("Keycloak is unreachable. Check KEYCLOAK_SERVER_URL and availability.");
        }
    }

    private String fetchAdminTokenWithAdminCli(String firstError) {
        String adminTokenUrl = String.format("%s/realms/%s/protocol/openid-connect/token", serverUrl,
                keycloakAdminRealm);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("grant_type", "password");
        body.add("client_id", "admin-cli");
        body.add("username", keycloakAdminUsername);
        body.add("password", keycloakAdminPassword);

        try {
            @SuppressWarnings("rawtypes")
            ResponseEntity<Map> response = restTemplate.postForEntity(adminTokenUrl, new HttpEntity<>(body, headers), Map.class);
            Object accessToken = response.getBody() != null ? response.getBody().get("access_token") : null;
            if (accessToken == null) {
                throw new BadRequestException("Unable to get Keycloak admin token via admin-cli.");
            }
            return accessToken.toString();
        } catch (HttpStatusCodeException ex) {
            throw new BadRequestException("Unable to get Keycloak admin token. client_credentials error: " + firstError
                    + " | admin-cli error: " + ex.getResponseBodyAsString());
        } catch (ResourceAccessException ex) {
            throw new BadRequestException("Keycloak is unreachable. Check KEYCLOAK_SERVER_URL and availability.");
        }
    }

    private String findUserIdByEmail(String adminToken, String email) {
        String usersUrl = UriComponentsBuilder
                .fromHttpUrl(String.format("%s/admin/realms/%s/users", serverUrl, realm))
                .queryParam("email", email)
                .queryParam("exact", true)
                .toUriString();

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(adminToken);

        try {
            @SuppressWarnings("rawtypes")
            ResponseEntity<List> response = restTemplate.exchange(usersUrl, HttpMethod.GET, new HttpEntity<>(headers), List.class);
            if (response.getBody() == null || response.getBody().isEmpty()) {
                return null;
            }

            Object first = response.getBody().get(0);
            if (first instanceof Map<?, ?> userMap) {
                Object id = userMap.get("id");
                return id != null ? id.toString() : null;
            }
            return null;
        } catch (HttpStatusCodeException ex) {
            throw new BadRequestException("Unable to find Keycloak user: " + ex.getResponseBodyAsString());
        } catch (ResourceAccessException ex) {
            throw new BadRequestException("Keycloak is unreachable while searching user.");
        }
    }

    private String extractUserId(ResponseEntity<Void> response, String adminToken, String email) {
        if (response.getHeaders().getLocation() != null) {
            String path = response.getHeaders().getLocation().getPath();
            if (path != null) {
                String[] segments = path.split("/");
                if (segments.length > 0) {
                    String uuid = segments[segments.length - 1];
                    log.info("Extracted Keycloak UUID [{}] from Location header", uuid);
                    return uuid;
                }
            }
            log.error("Failed to extract UUID from Location header path: {}", path);
        } else {
            log.warn("Keycloak creation response missing Location header for user: {}", email);
        }
        return findUserIdByEmail(adminToken, email);
    }

    private void ensureUserEnabled(String adminToken, String userId, String email, String firstName, String lastName) {
        String updateUserUrl = String.format("%s/admin/realms/%s/users/%s", serverUrl, realm, userId);

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(adminToken);
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> payload = Map.of(
                "username", email,
                "email", email,
                "firstName", firstName == null ? "" : firstName,
                "lastName", lastName == null ? "" : lastName,
                "enabled", Boolean.TRUE,
                "emailVerified", Boolean.TRUE);

        try {
            restTemplate.exchange(updateUserUrl, HttpMethod.PUT, new HttpEntity<>(payload, headers), Void.class);
        } catch (HttpStatusCodeException putEx) {
            throw new BadRequestException(
                    "Unable to enable existing Keycloak user: " + putEx.getResponseBodyAsString());
        } catch (ResourceAccessException ex) {
            throw new BadRequestException("Keycloak is unreachable while enabling existing user.");
        }
    }

    private void assignRealmRole(String adminToken, String userId, String roleName) {
        String mappingUrl = String.format("%s/admin/realms/%s/users/%s/role-mappings/realm", serverUrl, realm, userId);

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(adminToken);
        headers.setContentType(MediaType.APPLICATION_JSON);

        try {
            Map<String, Object> roleRepresentation = getOrCreateRealmRole(adminToken, roleName);
            restTemplate.postForEntity(mappingUrl, new HttpEntity<>(List.of(roleRepresentation), headers), Void.class);
        } catch (BadRequestException ex) {
            throw ex;
        } catch (HttpStatusCodeException ex) {
            if (ex.getStatusCode().value() == 409) {
                // Role already mapped.
                return;
            }
            throw new BadRequestException("Unable to assign Keycloak role: " + ex.getResponseBodyAsString());
        } catch (ResourceAccessException ex) {
            throw new BadRequestException("Keycloak is unreachable while assigning role.");
        }
    }

    private Map<String, Object> getOrCreateRealmRole(String adminToken, String roleName) {
        String roleUrl = String.format("%s/admin/realms/%s/roles/%s", serverUrl, realm, roleName);
        String rolesUrl = String.format("%s/admin/realms/%s/roles", serverUrl, realm);

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(adminToken);
        headers.setContentType(MediaType.APPLICATION_JSON);

        try {
            @SuppressWarnings("unchecked")
            ResponseEntity<Map<String, Object>> roleResponse = restTemplate.exchange(roleUrl, HttpMethod.GET, new HttpEntity<>(headers), (Class<Map<String, Object>>) (Class<?>) Map.class);
            if (roleResponse.getBody() == null) {
                throw new BadRequestException("Keycloak role payload is empty: " + roleName);
            }
            return roleResponse.getBody();
        } catch (HttpStatusCodeException ex) {
            if (ex.getStatusCode().value() != 404) {
                throw new BadRequestException("Unable to read Keycloak role: " + ex.getResponseBodyAsString());
            }

            try {
                restTemplate.postForEntity(rolesUrl, new HttpEntity<>(Map.of("name", roleName), headers), Void.class);
                @SuppressWarnings("unchecked")
                ResponseEntity<Map<String, Object>> createdRoleResponse = restTemplate.exchange(roleUrl, HttpMethod.GET,
                        new HttpEntity<>(headers), (Class<Map<String, Object>>) (Class<?>) Map.class);
                if (createdRoleResponse.getBody() == null) {
                    throw new BadRequestException("Unable to create Keycloak role: " + roleName);
                }
                return createdRoleResponse.getBody();
            } catch (HttpStatusCodeException createEx) {
                throw new BadRequestException("Unable to create Keycloak role: " + createEx.getResponseBodyAsString());
            }
        }
    }
}