package com.logiway.services;

import com.logiway.exceptions.AuthProviderUnavailableException;
import com.logiway.exceptions.BadRequestException;
import com.logiway.exceptions.UnauthorizedException;
import com.logiway.services.impl.KeycloakServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.net.URI;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class KeycloakServiceImplTest {

    @Mock
    private RestTemplate restTemplate;

    private KeycloakServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new KeycloakServiceImpl(restTemplate);
        ReflectionTestUtils.setField(service, "serverUrl", "http://keycloak:8080");
        ReflectionTestUtils.setField(service, "realm", "logiway");
        ReflectionTestUtils.setField(service, "clientId", "logiway-client");
        ReflectionTestUtils.setField(service, "clientSecret", "secret");
        ReflectionTestUtils.setField(service, "adminClientId", "admin-client");
        ReflectionTestUtils.setField(service, "adminClientSecret", "admin-secret");
        ReflectionTestUtils.setField(service, "keycloakAdminUsername", "admin");
        ReflectionTestUtils.setField(service, "keycloakAdminPassword", "admin");
        ReflectionTestUtils.setField(service, "keycloakAdminRealm", "master");
    }

    @Test
    void checkKeycloakConnectivity_reachable() {
        when(restTemplate.getForEntity(anyString(), eq(String.class)))
            .thenReturn(ResponseEntity.ok("{}"));

        service.checkKeycloakConnectivity();

        verify(restTemplate).getForEntity(
            "http://keycloak:8080/realms/logiway/.well-known/openid-configuration", String.class);
    }

    @Test
    void checkKeycloakConnectivity_unreachable() {
        when(restTemplate.getForEntity(anyString(), eq(String.class)))
            .thenThrow(new ResourceAccessException("connection refused"));

        service.checkKeycloakConnectivity();

        verify(restTemplate).getForEntity(anyString(), eq(String.class));
    }

    @Test
    void fetchTokenByPassword_success() {
        when(restTemplate.postForEntity(anyString(), any(), eq(Map.class)))
            .thenReturn(ResponseEntity.ok(Map.of("access_token", "abc")));

        Map<String, Object> result = service.fetchTokenByPassword("user@test.fr", "password123");

        assertThat(result).containsEntry("access_token", "abc");
    }

    @Test
    void fetchTokenByPassword_401_throwsUnauthorized() {
        when(restTemplate.postForEntity(anyString(), any(), eq(Map.class)))
            .thenThrow(new HttpClientErrorException(HttpStatus.UNAUTHORIZED, "Unauthorized"));

        assertThatThrownBy(() -> service.fetchTokenByPassword("user@test.fr", "wrong"))
            .isInstanceOf(UnauthorizedException.class)
            .hasMessage("Invalid credentials");
    }

    @Test
    void fetchTokenByPassword_400_throwsAuthUnavailable() {
        when(restTemplate.postForEntity(anyString(), any(), eq(Map.class)))
            .thenThrow(new HttpClientErrorException(HttpStatus.BAD_REQUEST, "Bad Request"));

        assertThatThrownBy(() -> service.fetchTokenByPassword("user@test.fr", "password"))
            .isInstanceOf(AuthProviderUnavailableException.class);
    }

    @Test
    void fetchTokenByPassword_500_throwsAuthUnavailable() {
        when(restTemplate.postForEntity(anyString(), any(), eq(Map.class)))
            .thenThrow(new HttpServerErrorException(HttpStatus.INTERNAL_SERVER_ERROR, "Server Error"));

        assertThatThrownBy(() -> service.fetchTokenByPassword("user@test.fr", "password"))
            .isInstanceOf(AuthProviderUnavailableException.class)
            .hasMessage("Authentication service is temporarily unavailable");
    }

    @Test
    void fetchTokenByPassword_resourceAccess_throwsAuthUnavailable() {
        when(restTemplate.postForEntity(anyString(), any(), eq(Map.class)))
            .thenThrow(new ResourceAccessException("unreachable"));

        assertThatThrownBy(() -> service.fetchTokenByPassword("user@test.fr", "password"))
            .isInstanceOf(AuthProviderUnavailableException.class)
            .hasMessage("Authentication service is unreachable");
    }

    @Test
    void fetchTokenByPassword_unexpectedError_throwsAuthUnavailable() {
        when(restTemplate.postForEntity(anyString(), any(), eq(Map.class)))
            .thenThrow(new IllegalStateException("boom"));

        assertThatThrownBy(() -> service.fetchTokenByPassword("user@test.fr", "password"))
            .isInstanceOf(AuthProviderUnavailableException.class)
            .hasMessage("Authentication service is temporarily unavailable");
    }

    @Test
    void fetchTokenByPassword_withoutClientSecret_omitsSecretFromBody() {
        ReflectionTestUtils.setField(service, "clientSecret", "");
        when(restTemplate.postForEntity(anyString(), any(), eq(Map.class)))
            .thenReturn(ResponseEntity.ok(Map.of("access_token", "abc")));

        service.fetchTokenByPassword("user@test.fr", "password123");

        verify(restTemplate).postForEntity(anyString(), any(HttpEntity.class), eq(Map.class));
    }

    @Test
    void refreshAccessToken_success() {
        when(restTemplate.postForEntity(anyString(), any(), eq(Map.class)))
            .thenReturn(ResponseEntity.ok(Map.of("access_token", "new-token")));

        Map<String, Object> result = service.refreshAccessToken("refresh-token");

        assertThat(result).containsEntry("access_token", "new-token");
    }

    @Test
    void refreshAccessToken_blank_throwsBadRequest() {
        assertThatThrownBy(() -> service.refreshAccessToken("  "))
            .isInstanceOf(BadRequestException.class)
            .hasMessage("Refresh token is required");
        verify(restTemplate, never()).postForEntity(anyString(), any(), any());
    }

    @Test
    void refreshAccessToken_httpStatus_throwsBadRequest() {
        when(restTemplate.postForEntity(anyString(), any(), eq(Map.class)))
            .thenThrow(new HttpClientErrorException(HttpStatus.BAD_REQUEST, "Bad Request"));

        assertThatThrownBy(() -> service.refreshAccessToken("expired"))
            .isInstanceOf(BadRequestException.class)
            .hasMessage("Token refresh failed: Invalid or expired refresh token");
    }

    @Test
    void refreshAccessToken_resourceAccess_throwsAuthUnavailable() {
        when(restTemplate.postForEntity(anyString(), any(), eq(Map.class)))
            .thenThrow(new ResourceAccessException("unreachable"));

        assertThatThrownBy(() -> service.refreshAccessToken("expired"))
            .isInstanceOf(AuthProviderUnavailableException.class);
    }

    @Test
    void refreshAccessToken_unexpected_throwsAuthUnavailable() {
        when(restTemplate.postForEntity(anyString(), any(), eq(Map.class)))
            .thenThrow(new IllegalStateException("boom"));

        assertThatThrownBy(() -> service.refreshAccessToken("expired"))
            .isInstanceOf(AuthProviderUnavailableException.class);
    }

    @Test
    void createUserAccount_success_createsRoleAndAssigns() {
        when(restTemplate.postForEntity(anyString(), any(), eq(Map.class)))
            .thenReturn(ResponseEntity.ok(Map.of("access_token", "admin-token")));
        ResponseEntity<Void> created = ResponseEntity.created(
            URI.create("http://keycloak:8080/admin/realms/logiway/users/uuid-123")).build();
        lenient().when(restTemplate.postForEntity(anyString(), any(), eq(Void.class))).thenReturn(created);
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(), eq(Map.class)))
            .thenThrow(new HttpClientErrorException(HttpStatus.NOT_FOUND, "Not Found"))
            .thenReturn(ResponseEntity.ok(Map.of("name", "CHAUFFEUR", "id", "role-1")));

        String userId = service.createUserAccount("user@test.fr", "password123", "Jean", "Dupont", "CHAUFFEUR", true);

        assertThat(userId).isEqualTo("uuid-123");
        verify(restTemplate, org.mockito.Mockito.times(3)).postForEntity(anyString(), any(), eq(Void.class));
    }

    @Test
    void createUserAccount_noLocationHeader_usesFindByEmail() {
        when(restTemplate.postForEntity(anyString(), any(), eq(Map.class)))
            .thenReturn(ResponseEntity.ok(Map.of("access_token", "admin-token")));
        when(restTemplate.postForEntity(anyString(), any(), eq(Void.class)))
            .thenReturn(ResponseEntity.ok().build());
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(), eq(List.class)))
            .thenReturn(ResponseEntity.ok(List.of(Map.of("id", "uuid-fallback"))));
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(), eq(Map.class)))
            .thenReturn(ResponseEntity.ok(Map.of("name", "CHAUFFEUR", "id", "role-1")));

        String userId = service.createUserAccount("user@test.fr", "password123", null, null, "CHAUFFEUR", false);

        assertThat(userId).isEqualTo("uuid-fallback");
    }

    @Test
    void createUserAccount_noUserIdFound_throwsBadRequest() {
        when(restTemplate.postForEntity(anyString(), any(), eq(Map.class)))
            .thenReturn(ResponseEntity.ok(Map.of("access_token", "admin-token")));
        when(restTemplate.postForEntity(anyString(), any(), eq(Void.class)))
            .thenReturn(ResponseEntity.ok().build());
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(), eq(List.class)))
            .thenReturn(ResponseEntity.ok(List.of()));

        assertThatThrownBy(() -> service.createUserAccount("user@test.fr", "password123", "Jean", "Dupont", "CHAUFFEUR", true))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("Unable to create Keycloak user");
    }

    @Test
    void createUserAccount_409_existingUser_enablesAndResetsPassword() {
        when(restTemplate.postForEntity(anyString(), any(), eq(Map.class)))
            .thenReturn(ResponseEntity.ok(Map.of("access_token", "admin-token")));
        when(restTemplate.postForEntity(anyString(), any(), eq(Void.class)))
            .thenThrow(new HttpClientErrorException(HttpStatus.CONFLICT, "Conflict"));
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(), eq(List.class)))
            .thenReturn(ResponseEntity.ok(List.of(Map.of("id", "uuid-existing"))));
        when(restTemplate.exchange(anyString(), eq(HttpMethod.PUT), any(), eq(Void.class)))
            .thenReturn(ResponseEntity.ok().build());
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(), eq(Map.class)))
            .thenReturn(ResponseEntity.ok(Map.of("name", "CHAUFFEUR", "id", "role-1")));

        String userId = service.createUserAccount("user@test.fr", "password123", "Jean", "Dupont", "CHAUFFEUR", true);

        assertThat(userId).isEqualTo("uuid-existing");
        verify(restTemplate, org.mockito.Mockito.times(2)).exchange(anyString(), eq(HttpMethod.PUT), any(), eq(Void.class));
    }

    @Test
    void createUserAccount_409_existingUserNotFound_throwsBadRequest() {
        when(restTemplate.postForEntity(anyString(), any(), eq(Map.class)))
            .thenReturn(ResponseEntity.ok(Map.of("access_token", "admin-token")));
        when(restTemplate.postForEntity(anyString(), any(), eq(Void.class)))
            .thenThrow(new HttpClientErrorException(HttpStatus.CONFLICT, "Conflict"));
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(), eq(List.class)))
            .thenReturn(ResponseEntity.ok(List.of()));

        assertThatThrownBy(() -> service.createUserAccount("user@test.fr", "password123", "Jean", "Dupont", "CHAUFFEUR", true))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("duplicate email");
    }

    @Test
    void createUserAccount_otherHttpStatus_throwsBadRequest() {
        when(restTemplate.postForEntity(anyString(), any(), eq(Map.class)))
            .thenReturn(ResponseEntity.ok(Map.of("access_token", "admin-token")));
        when(restTemplate.postForEntity(anyString(), any(), eq(Void.class)))
            .thenThrow(new HttpServerErrorException(HttpStatus.INTERNAL_SERVER_ERROR, "Server Error"));

        assertThatThrownBy(() -> service.createUserAccount("user@test.fr", "password123", "Jean", "Dupont", "CHAUFFEUR", true))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("Unexpected Keycloak user creation error");
    }

    @Test
    void createUserAccount_unexpectedError_throwsBadRequest() {
        when(restTemplate.postForEntity(anyString(), any(), eq(Map.class)))
            .thenReturn(ResponseEntity.ok(Map.of("access_token", "admin-token")));
        when(restTemplate.postForEntity(anyString(), any(), eq(Void.class)))
            .thenThrow(new IllegalStateException("boom"));

        assertThatThrownBy(() -> service.createUserAccount("user@test.fr", "password123", "Jean", "Dupont", "CHAUFFEUR", true))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("boom");
    }

    @Test
    void createUserAccount_roleMappingAlreadyExists_returnsSilently() {
        when(restTemplate.postForEntity(anyString(), any(), eq(Map.class)))
            .thenReturn(ResponseEntity.ok(Map.of("access_token", "admin-token")));
        when(restTemplate.postForEntity(anyString(), any(), eq(Void.class)))
            .thenReturn(ResponseEntity.ok().build());
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(), eq(List.class)))
            .thenReturn(ResponseEntity.ok(List.of(Map.of("id", "uuid-123"))));
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(), eq(Map.class)))
            .thenReturn(ResponseEntity.ok(Map.of("name", "CHAUFFEUR", "id", "role-1")));
        when(restTemplate.postForEntity(eq("http://keycloak:8080/admin/realms/logiway/users/uuid-123/role-mappings/realm"),
            any(), eq(Void.class)))
            .thenThrow(new HttpClientErrorException(HttpStatus.CONFLICT, "Conflict"));

        String userId = service.createUserAccount("user@test.fr", "password123", "Jean", "Dupont", "CHAUFFEUR", true);

        assertThat(userId).isEqualTo("uuid-123");
    }

    @Test
    void createUserAccount_rolePayloadEmpty_throwsBadRequest() {
        when(restTemplate.postForEntity(anyString(), any(), eq(Map.class)))
            .thenReturn(ResponseEntity.ok(Map.of("access_token", "admin-token")));
        when(restTemplate.postForEntity(anyString(), any(), eq(Void.class)))
            .thenReturn(ResponseEntity.created(
                URI.create("http://keycloak:8080/admin/realms/logiway/users/uuid-123")).build());
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(), eq(Map.class)))
            .thenReturn(ResponseEntity.ok(null));

        assertThatThrownBy(() -> service.createUserAccount("user@test.fr", "password123", "Jean", "Dupont", "CHAUFFEUR", true))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("Keycloak role payload is empty");
    }

    @Test
    void updatePasswordByEmail_success() {
        when(restTemplate.postForEntity(anyString(), any(), eq(Map.class)))
            .thenReturn(ResponseEntity.ok(Map.of("access_token", "admin-token")));
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(), eq(List.class)))
            .thenReturn(ResponseEntity.ok(List.of(Map.of("id", "uuid-1"))));
        when(restTemplate.exchange(anyString(), eq(HttpMethod.PUT), any(), eq(Void.class)))
            .thenReturn(ResponseEntity.ok().build());

        service.updatePasswordByEmail("user@test.fr", "newpassword123");

        verify(restTemplate).exchange(anyString(), eq(HttpMethod.PUT), any(), eq(Void.class));
    }

    @Test
    void updatePasswordByEmail_userNotFound_throwsBadRequest() {
        when(restTemplate.postForEntity(anyString(), any(), eq(Map.class)))
            .thenReturn(ResponseEntity.ok(Map.of("access_token", "admin-token")));
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(), eq(List.class)))
            .thenReturn(ResponseEntity.ok(List.of()));

        assertThatThrownBy(() -> service.updatePasswordByEmail("missing@test.fr", "newpassword123"))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("Keycloak user not found");
    }

    @Test
    void updatePasswordByEmail_resetPasswordFails_throwsBadRequest() {
        when(restTemplate.postForEntity(anyString(), any(), eq(Map.class)))
            .thenReturn(ResponseEntity.ok(Map.of("access_token", "admin-token")));
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(), eq(List.class)))
            .thenReturn(ResponseEntity.ok(List.of(Map.of("id", "uuid-1"))));
        when(restTemplate.exchange(anyString(), eq(HttpMethod.PUT), any(), eq(Void.class)))
            .thenThrow(new HttpClientErrorException(HttpStatus.BAD_REQUEST, "Bad Request"));

        assertThatThrownBy(() -> service.updatePasswordByEmail("user@test.fr", "newpassword123"))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("Unable to update password in Keycloak");
    }

    @Test
    void updatePasswordByEmail_resetPasswordUnreachable_throwsBadRequest() {
        when(restTemplate.postForEntity(anyString(), any(), eq(Map.class)))
            .thenReturn(ResponseEntity.ok(Map.of("access_token", "admin-token")));
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(), eq(List.class)))
            .thenReturn(ResponseEntity.ok(List.of(Map.of("id", "uuid-1"))));
        when(restTemplate.exchange(anyString(), eq(HttpMethod.PUT), any(), eq(Void.class)))
            .thenThrow(new ResourceAccessException("unreachable"));

        assertThatThrownBy(() -> service.updatePasswordByEmail("user@test.fr", "newpassword123"))
            .isInstanceOf(BadRequestException.class)
            .hasMessage("Keycloak is unreachable while updating password.");
    }

    @Test
    void logoutByRefreshToken_blank_returnsQuietly() {
        service.logoutByRefreshToken(null);
        service.logoutByRefreshToken("   ");
        verify(restTemplate, never()).postForEntity(anyString(), any(), any());
    }

    @Test
    void logoutByRefreshToken_success() {
        when(restTemplate.postForEntity(anyString(), any(), eq(Void.class)))
            .thenReturn(ResponseEntity.ok().build());

        service.logoutByRefreshToken("refresh-token");

        verify(restTemplate).postForEntity(anyString(), any(), eq(Void.class));
    }

    @Test
    void logoutByRefreshToken_httpStatus_throwsBadRequest() {
        when(restTemplate.postForEntity(anyString(), any(), eq(Void.class)))
            .thenThrow(new HttpClientErrorException(HttpStatus.BAD_REQUEST, "Bad Request"));

        assertThatThrownBy(() -> service.logoutByRefreshToken("refresh-token"))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("Unable to logout from Keycloak");
    }

    @Test
    void logoutByRefreshToken_resourceAccess_throwsBadRequest() {
        when(restTemplate.postForEntity(anyString(), any(), eq(Void.class)))
            .thenThrow(new ResourceAccessException("unreachable"));

        assertThatThrownBy(() -> service.logoutByRefreshToken("refresh-token"))
            .isInstanceOf(BadRequestException.class)
            .hasMessage("Keycloak is unreachable during logout.");
    }

    @Test
    void fetchAdminToken_success() {
        when(restTemplate.postForEntity(anyString(), any(), eq(Map.class)))
            .thenReturn(ResponseEntity.ok(Map.of("access_token", "admin-token")));

        String result = fetchAdminTokenUsedForUserSearch();

        assertThat(result).isEqualTo("admin-token");
    }

    @Test
    void fetchAdminToken_missingAccessToken_throwsBadRequest() {
        when(restTemplate.postForEntity(anyString(), any(), eq(Map.class)))
            .thenReturn(ResponseEntity.ok(Map.of()));

        assertThatThrownBy(() -> invokeUpdatePassword())
            .isInstanceOf(BadRequestException.class)
            .hasMessage("Unable to get Keycloak admin token");
    }

    @Test
    void fetchAdminToken_clientCredentialsFail_fallsBackToAdminCli() {
        when(restTemplate.postForEntity(anyString(), any(), eq(Map.class)))
            .thenThrow(new HttpClientErrorException(HttpStatus.UNAUTHORIZED, "Unauthorized"))
            .thenReturn(ResponseEntity.ok(Map.of("access_token", "admin-cli-token")));

        String result = fetchAdminTokenUsedForUserSearch();

        assertThat(result).isEqualTo("admin-cli-token");
    }

    @Test
    void fetchAdminToken_adminCliMissingToken_throwsBadRequest() {
        when(restTemplate.postForEntity(anyString(), any(), eq(Map.class)))
            .thenThrow(new HttpClientErrorException(HttpStatus.UNAUTHORIZED, "Unauthorized"))
            .thenReturn(ResponseEntity.ok(Map.of()));

        assertThatThrownBy(() -> invokeUpdatePassword())
            .isInstanceOf(BadRequestException.class)
            .hasMessage("Unable to get Keycloak admin token via admin-cli.");
    }

    @Test
    void fetchAdminToken_adminCliHttpError_throwsBadRequest() {
        when(restTemplate.postForEntity(anyString(), any(), eq(Map.class)))
            .thenThrow(new HttpClientErrorException(HttpStatus.UNAUTHORIZED, "Unauthorized"))
            .thenThrow(new HttpClientErrorException(HttpStatus.FORBIDDEN, "Forbidden"));

        assertThatThrownBy(() -> invokeUpdatePassword())
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("admin-cli error");
    }

    @Test
    void fetchAdminToken_adminCliUnreachable_throwsBadRequest() {
        when(restTemplate.postForEntity(anyString(), any(), eq(Map.class)))
            .thenThrow(new HttpClientErrorException(HttpStatus.UNAUTHORIZED, "Unauthorized"))
            .thenThrow(new ResourceAccessException("unreachable"));

        assertThatThrownBy(() -> invokeUpdatePassword())
            .isInstanceOf(BadRequestException.class)
            .hasMessage("Keycloak is unreachable. Check KEYCLOAK_SERVER_URL and availability.");
    }

    @Test
    void fetchAdminToken_resourceAccess_throwsBadRequest() {
        when(restTemplate.postForEntity(anyString(), any(), eq(Map.class)))
            .thenThrow(new ResourceAccessException("unreachable"));

        assertThatThrownBy(() -> invokeUpdatePassword())
            .isInstanceOf(BadRequestException.class)
            .hasMessage("Keycloak is unreachable. Check KEYCLOAK_SERVER_URL and availability.");
    }

    @Test
    void fetchAdminToken_withoutAdminClientSecret_omitsSecret() {
        ReflectionTestUtils.setField(service, "adminClientSecret", "");
        when(restTemplate.postForEntity(anyString(), any(), eq(Map.class)))
            .thenReturn(ResponseEntity.ok(Map.of("access_token", "admin-token")));

        String result = fetchAdminTokenUsedForUserSearch();

        assertThat(result).isEqualTo("admin-token");
    }

    private String fetchAdminTokenUsedForUserSearch() {
        lenient().when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(), eq(List.class)))
            .thenReturn(ResponseEntity.ok(List.of(Map.of("id", "uuid-1"))));
        lenient().when(restTemplate.exchange(anyString(), eq(HttpMethod.PUT), any(), eq(Void.class)))
            .thenReturn(ResponseEntity.ok().build());
        return invokeUpdatePasswordAndCaptureToken();
    }

    private void invokeUpdatePassword() {
        lenient().when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(), eq(List.class)))
            .thenReturn(ResponseEntity.ok(List.of(Map.of("id", "uuid-1"))));
        lenient().when(restTemplate.exchange(anyString(), eq(HttpMethod.PUT), any(), eq(Void.class)))
            .thenReturn(ResponseEntity.ok().build());
        service.updatePasswordByEmail("user@test.fr", "newpassword123");
    }

    private String invokeUpdatePasswordAndCaptureToken() {
        service.updatePasswordByEmail("user@test.fr", "newpassword123");
        org.mockito.ArgumentCaptor<HttpEntity<?>> entityCaptor = org.mockito.ArgumentCaptor.forClass(HttpEntity.class);
        verify(restTemplate).exchange(anyString(), eq(HttpMethod.GET),
            entityCaptor.capture(), eq(List.class));
        String auth = entityCaptor.getValue().getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
        assertThat(auth).startsWith("Bearer ");
        return auth.substring("Bearer ".length());
    }

    @Test
    void updatePasswordByEmail_resetPasswordUnexpectedError_throwsBadRequest() {
        when(restTemplate.postForEntity(anyString(), any(), eq(Map.class)))
            .thenReturn(ResponseEntity.ok(Map.of("access_token", "admin-token")));
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(), eq(List.class)))
            .thenReturn(ResponseEntity.ok(List.of(Map.of("id", "uuid-1"))));
        when(restTemplate.exchange(anyString(), eq(HttpMethod.PUT), any(), eq(Void.class)))
            .thenThrow(new IllegalStateException("boom"));

        assertThatThrownBy(() -> service.updatePasswordByEmail("user@test.fr", "newpassword123"))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("Unexpected Keycloak password update error")
            .hasMessageContaining("boom");
    }

    @Test
    void updatePasswordByEmail_userNotAMap_throwsBadRequest() {
        when(restTemplate.postForEntity(anyString(), any(), eq(Map.class)))
            .thenReturn(ResponseEntity.ok(Map.of("access_token", "admin-token")));
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(), eq(List.class)))
            .thenReturn(ResponseEntity.ok(List.of("not-a-map")));

        assertThatThrownBy(() -> service.updatePasswordByEmail("user@test.fr", "newpassword123"))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("Keycloak user not found");
    }

    @Test
    void updatePasswordByEmail_findUserHttpError_throwsBadRequest() {
        when(restTemplate.postForEntity(anyString(), any(), eq(Map.class)))
            .thenReturn(ResponseEntity.ok(Map.of("access_token", "admin-token")));
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(), eq(List.class)))
            .thenThrow(new HttpClientErrorException(HttpStatus.INTERNAL_SERVER_ERROR, "Server Error"));

        assertThatThrownBy(() -> service.updatePasswordByEmail("user@test.fr", "newpassword123"))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("Unable to find Keycloak user");
    }

    @Test
    void updatePasswordByEmail_findUserUnreachable_throwsBadRequest() {
        when(restTemplate.postForEntity(anyString(), any(), eq(Map.class)))
            .thenReturn(ResponseEntity.ok(Map.of("access_token", "admin-token")));
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(), eq(List.class)))
            .thenThrow(new ResourceAccessException("unreachable"));

        assertThatThrownBy(() -> service.updatePasswordByEmail("user@test.fr", "newpassword123"))
            .isInstanceOf(BadRequestException.class)
            .hasMessage("Keycloak is unreachable while searching user.");
    }

    @Test
    void createUserAccount_opaqueLocation_fallsBackToFindByEmail() {
        when(restTemplate.postForEntity(anyString(), any(), eq(Map.class)))
            .thenReturn(ResponseEntity.ok(Map.of("access_token", "admin-token")));
        when(restTemplate.postForEntity(anyString(), any(), eq(Void.class)))
            .thenReturn(ResponseEntity.created(URI.create("mailto:user@test.fr")).build());
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(), eq(List.class)))
            .thenReturn(ResponseEntity.ok(List.of(Map.of("id", "uuid-fallback"))));
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(), eq(Map.class)))
            .thenReturn(ResponseEntity.ok(Map.of("name", "CHAUFFEUR", "id", "role-1")));

        String userId = service.createUserAccount("user@test.fr", "password123", "Jean", "Dupont", "CHAUFFEUR", true);

        assertThat(userId).isEqualTo("uuid-fallback");
    }

    @Test
    void createUserAccount_409_enableUserHttpError_throwsBadRequest() {
        when(restTemplate.postForEntity(anyString(), any(), eq(Map.class)))
            .thenReturn(ResponseEntity.ok(Map.of("access_token", "admin-token")));
        when(restTemplate.postForEntity(anyString(), any(), eq(Void.class)))
            .thenThrow(new HttpClientErrorException(HttpStatus.CONFLICT, "Conflict"));
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(), eq(List.class)))
            .thenReturn(ResponseEntity.ok(List.of(Map.of("id", "uuid-existing"))));
        when(restTemplate.exchange(anyString(), eq(HttpMethod.PUT), any(), eq(Void.class)))
            .thenThrow(new HttpClientErrorException(HttpStatus.INTERNAL_SERVER_ERROR, "Server Error"));

        assertThatThrownBy(() -> service.createUserAccount("user@test.fr", "password123", "Jean", "Dupont", "CHAUFFEUR", true))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("Unable to enable existing Keycloak user");
    }

    @Test
    void createUserAccount_409_enableUserUnreachable_throwsBadRequest() {
        when(restTemplate.postForEntity(anyString(), any(), eq(Map.class)))
            .thenReturn(ResponseEntity.ok(Map.of("access_token", "admin-token")));
        when(restTemplate.postForEntity(anyString(), any(), eq(Void.class)))
            .thenThrow(new HttpClientErrorException(HttpStatus.CONFLICT, "Conflict"));
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(), eq(List.class)))
            .thenReturn(ResponseEntity.ok(List.of(Map.of("id", "uuid-existing"))));
        when(restTemplate.exchange(anyString(), eq(HttpMethod.PUT), any(), eq(Void.class)))
            .thenThrow(new ResourceAccessException("unreachable"));

        assertThatThrownBy(() -> service.createUserAccount("user@test.fr", "password123", "Jean", "Dupont", "CHAUFFEUR", true))
            .isInstanceOf(BadRequestException.class)
            .hasMessage("Keycloak is unreachable while enabling existing user.");
    }

    @Test
    void createUserAccount_assignRoleHttpError_throwsBadRequest() {
        ResponseEntity<Void> created = ResponseEntity.created(
            URI.create("http://keycloak:8080/admin/realms/logiway/users/uuid-123")).build();
        when(restTemplate.postForEntity(anyString(), any(), eq(Map.class)))
            .thenReturn(ResponseEntity.ok(Map.of("access_token", "admin-token")));
        when(restTemplate.postForEntity(anyString(), any(), eq(Void.class)))
            .thenReturn(created)
            .thenThrow(new HttpClientErrorException(HttpStatus.BAD_REQUEST, "Bad Request"));
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(), eq(Map.class)))
            .thenReturn(ResponseEntity.ok(Map.of("name", "CHAUFFEUR", "id", "role-1")));

        assertThatThrownBy(() -> service.createUserAccount("user@test.fr", "password123", "Jean", "Dupont", "CHAUFFEUR", true))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("Unable to assign Keycloak role");
    }

    @Test
    void createUserAccount_assignRoleUnreachable_throwsBadRequest() {
        ResponseEntity<Void> created = ResponseEntity.created(
            URI.create("http://keycloak:8080/admin/realms/logiway/users/uuid-123")).build();
        when(restTemplate.postForEntity(anyString(), any(), eq(Map.class)))
            .thenReturn(ResponseEntity.ok(Map.of("access_token", "admin-token")));
        when(restTemplate.postForEntity(anyString(), any(), eq(Void.class)))
            .thenReturn(created)
            .thenThrow(new ResourceAccessException("unreachable"));
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(), eq(Map.class)))
            .thenReturn(ResponseEntity.ok(Map.of("name", "CHAUFFEUR", "id", "role-1")));

        assertThatThrownBy(() -> service.createUserAccount("user@test.fr", "password123", "Jean", "Dupont", "CHAUFFEUR", true))
            .isInstanceOf(BadRequestException.class)
            .hasMessage("Keycloak is unreachable while assigning role.");
    }

    @Test
    void createUserAccount_readRoleHttpError_throwsBadRequest() {
        ResponseEntity<Void> created = ResponseEntity.created(
            URI.create("http://keycloak:8080/admin/realms/logiway/users/uuid-123")).build();
        when(restTemplate.postForEntity(anyString(), any(), eq(Map.class)))
            .thenReturn(ResponseEntity.ok(Map.of("access_token", "admin-token")));
        when(restTemplate.postForEntity(anyString(), any(), eq(Void.class)))
            .thenReturn(created);
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(), eq(Map.class)))
            .thenThrow(new HttpClientErrorException(HttpStatus.INTERNAL_SERVER_ERROR, "Server Error"));

        assertThatThrownBy(() -> service.createUserAccount("user@test.fr", "password123", "Jean", "Dupont", "CHAUFFEUR", true))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("Unable to read Keycloak role");
    }

    @Test
    void createUserAccount_roleCreatedEmptyBody_throwsBadRequest() {
        ResponseEntity<Void> created = ResponseEntity.created(
            URI.create("http://keycloak:8080/admin/realms/logiway/users/uuid-123")).build();
        when(restTemplate.postForEntity(anyString(), any(), eq(Map.class)))
            .thenReturn(ResponseEntity.ok(Map.of("access_token", "admin-token")));
        when(restTemplate.postForEntity(anyString(), any(), eq(Void.class)))
            .thenReturn(created)
            .thenReturn(ResponseEntity.ok().build());
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(), eq(Map.class)))
            .thenThrow(new HttpClientErrorException(HttpStatus.NOT_FOUND, "Not Found"))
            .thenReturn(ResponseEntity.ok(null));

        assertThatThrownBy(() -> service.createUserAccount("user@test.fr", "password123", "Jean", "Dupont", "CHAUFFEUR", true))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("Unable to create Keycloak role");
    }

    @Test
    void createUserAccount_roleCreationHttpError_throwsBadRequest() {
        ResponseEntity<Void> created = ResponseEntity.created(
            URI.create("http://keycloak:8080/admin/realms/logiway/users/uuid-123")).build();
        when(restTemplate.postForEntity(anyString(), any(), eq(Map.class)))
            .thenReturn(ResponseEntity.ok(Map.of("access_token", "admin-token")));
        when(restTemplate.postForEntity(anyString(), any(), eq(Void.class)))
            .thenReturn(created)
            .thenThrow(new HttpClientErrorException(HttpStatus.BAD_REQUEST, "Bad Request"));
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(), eq(Map.class)))
            .thenThrow(new HttpClientErrorException(HttpStatus.NOT_FOUND, "Not Found"));

        assertThatThrownBy(() -> service.createUserAccount("user@test.fr", "password123", "Jean", "Dupont", "CHAUFFEUR", true))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("Unable to create Keycloak role");
    }

    @Test
    void fetchTokenByPassword_nullResponseBody_returnsNull() {
        when(restTemplate.postForEntity(anyString(), any(), eq(Map.class)))
            .thenReturn(ResponseEntity.ok(null));

        Map<String, Object> result = service.fetchTokenByPassword("user@test.fr", "password");

        assertThat(result).isNull();
    }

    @Test
    void refreshAccessToken_nullResponseBody_returnsNull() {
        when(restTemplate.postForEntity(anyString(), any(), eq(Map.class)))
            .thenReturn(ResponseEntity.ok(null));

        Map<String, Object> result = service.refreshAccessToken("refresh-token");

        assertThat(result).isNull();
    }

    @Test
    void refreshAccessToken_withoutClientSecret_omitsSecretFromBody() {
        ReflectionTestUtils.setField(service, "clientSecret", null);
        when(restTemplate.postForEntity(anyString(), any(), eq(Map.class)))
            .thenReturn(ResponseEntity.ok(Map.of("access_token", "new-token")));

        service.refreshAccessToken("refresh-token");

        verify(restTemplate).postForEntity(anyString(), any(HttpEntity.class), eq(Map.class));
    }

    @Test
    void refreshAccessToken_blankClientSecret_omitsSecretFromBody() {
        ReflectionTestUtils.setField(service, "clientSecret", "  ");
        when(restTemplate.postForEntity(anyString(), any(), eq(Map.class)))
            .thenReturn(ResponseEntity.ok(Map.of("access_token", "new-token")));

        service.refreshAccessToken("refresh-token");

        verify(restTemplate).postForEntity(anyString(), any(HttpEntity.class), eq(Map.class));
    }

    @Test
    void logoutByRefreshToken_withoutClientSecret_omitsSecretFromBody() {
        ReflectionTestUtils.setField(service, "clientSecret", null);
        when(restTemplate.postForEntity(anyString(), any(), eq(Void.class)))
            .thenReturn(ResponseEntity.ok().build());

        service.logoutByRefreshToken("refresh-token");

        verify(restTemplate).postForEntity(anyString(), any(HttpEntity.class), eq(Void.class));
    }

    @Test
    void fetchAdminToken_nullResponseBody_throwsBadRequest() {
        when(restTemplate.postForEntity(anyString(), any(), eq(Map.class)))
            .thenReturn(ResponseEntity.ok(null));

        assertThatThrownBy(() -> invokeUpdatePassword())
            .isInstanceOf(BadRequestException.class)
            .hasMessage("Unable to get Keycloak admin token");
    }

    @Test
    void fetchAdminTokenWithAdminCli_nullResponseBody_throwsBadRequest() {
        when(restTemplate.postForEntity(anyString(), any(), eq(Map.class)))
            .thenThrow(new HttpClientErrorException(HttpStatus.UNAUTHORIZED, "Unauthorized"))
            .thenReturn(ResponseEntity.ok(null));

        assertThatThrownBy(() -> invokeUpdatePassword())
            .isInstanceOf(BadRequestException.class)
            .hasMessage("Unable to get Keycloak admin token via admin-cli.");
    }

    @Test
    void findUserIdByEmail_nullResponseBody_returnsNull() {
        when(restTemplate.postForEntity(anyString(), any(), eq(Map.class)))
            .thenReturn(ResponseEntity.ok(Map.of("access_token", "admin-token")));
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(), eq(List.class)))
            .thenReturn(ResponseEntity.ok(null));

        assertThatThrownBy(() -> service.updatePasswordByEmail("user@test.fr", "newpassword123"))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("Keycloak user not found");
    }

    @Test
    void findUserIdByEmail_userMapWithNullId_returnsNull() {
        when(restTemplate.postForEntity(anyString(), any(), eq(Map.class)))
            .thenReturn(ResponseEntity.ok(Map.of("access_token", "admin-token")));
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(), eq(List.class)))
            .thenReturn(ResponseEntity.ok(List.of(Map.of("email", "user@test.fr"))));

        assertThatThrownBy(() -> service.updatePasswordByEmail("user@test.fr", "newpassword123"))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("Keycloak user not found");
    }

    @Test
    void ensureUserEnabled_httpClientError_throwsBadRequest() {
        when(restTemplate.postForEntity(anyString(), any(), eq(Map.class)))
            .thenReturn(ResponseEntity.ok(Map.of("access_token", "admin-token")));
        when(restTemplate.postForEntity(anyString(), any(), eq(Void.class)))
            .thenThrow(new HttpClientErrorException(HttpStatus.CONFLICT, "Conflict"));
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(), eq(List.class)))
            .thenReturn(ResponseEntity.ok(List.of(Map.of("id", "uuid-existing"))));
        when(restTemplate.exchange(anyString(), eq(HttpMethod.PUT), any(), eq(Void.class)))
            .thenThrow(new HttpClientErrorException(HttpStatus.FORBIDDEN, "Forbidden"));

        assertThatThrownBy(() -> service.createUserAccount("user@test.fr", "password123", "Jean", "Dupont", "CHAUFFEUR", true))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("Unable to enable existing Keycloak user");
    }

    @Test
    void ensureUserEnabled_resourceAccessException_throwsBadRequest() {
        when(restTemplate.postForEntity(anyString(), any(), eq(Map.class)))
            .thenReturn(ResponseEntity.ok(Map.of("access_token", "admin-token")));
        when(restTemplate.postForEntity(anyString(), any(), eq(Void.class)))
            .thenThrow(new HttpClientErrorException(HttpStatus.CONFLICT, "Conflict"));
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(), eq(List.class)))
            .thenReturn(ResponseEntity.ok(List.of(Map.of("id", "uuid-existing"))));
        when(restTemplate.exchange(anyString(), eq(HttpMethod.PUT), any(), eq(Void.class)))
            .thenThrow(new ResourceAccessException("unreachable"));

        assertThatThrownBy(() -> service.createUserAccount("user@test.fr", "password123", "Jean", "Dupont", "CHAUFFEUR", true))
            .isInstanceOf(BadRequestException.class)
            .hasMessage("Keycloak is unreachable while enabling existing user.");
    }

    @Test
    void assignRealmRole_resourceAccessException_throwsBadRequest() {
        when(restTemplate.postForEntity(anyString(), any(), eq(Map.class)))
            .thenReturn(ResponseEntity.ok(Map.of("access_token", "admin-token")));
        ResponseEntity<Void> created = ResponseEntity.created(
            URI.create("http://keycloak:8080/admin/realms/logiway/users/uuid-123")).build();
        when(restTemplate.postForEntity(anyString(), any(), eq(Void.class)))
            .thenReturn(created)
            .thenThrow(new ResourceAccessException("unreachable"));
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(), eq(Map.class)))
            .thenReturn(ResponseEntity.ok(Map.of("name", "CHAUFFEUR", "id", "role-1")));

        assertThatThrownBy(() -> service.createUserAccount("user@test.fr", "password123", "Jean", "Dupont", "CHAUFFEUR", true))
            .isInstanceOf(BadRequestException.class)
            .hasMessage("Keycloak is unreachable while assigning role.");
    }

    @Test
    void assignRealmRole_httpStatusOtherThan409_throwsBadRequest() {
        when(restTemplate.postForEntity(anyString(), any(), eq(Map.class)))
            .thenReturn(ResponseEntity.ok(Map.of("access_token", "admin-token")));
        ResponseEntity<Void> created = ResponseEntity.created(
            URI.create("http://keycloak:8080/admin/realms/logiway/users/uuid-123")).build();
        when(restTemplate.postForEntity(anyString(), any(), eq(Void.class)))
            .thenReturn(created)
            .thenThrow(new HttpClientErrorException(HttpStatus.FORBIDDEN, "Forbidden"));
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(), eq(Map.class)))
            .thenReturn(ResponseEntity.ok(Map.of("name", "CHAUFFEUR", "id", "role-1")));

        assertThatThrownBy(() -> service.createUserAccount("user@test.fr", "password123", "Jean", "Dupont", "CHAUFFEUR", true))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("Unable to assign Keycloak role");
    }

    @Test
    void getOrCreateRealmRole_createRoleHttpError_throwsBadRequest() {
        when(restTemplate.postForEntity(anyString(), any(), eq(Map.class)))
            .thenReturn(ResponseEntity.ok(Map.of("access_token", "admin-token")));
        ResponseEntity<Void> created = ResponseEntity.created(
            URI.create("http://keycloak:8080/admin/realms/logiway/users/uuid-123")).build();
        when(restTemplate.postForEntity(anyString(), any(), eq(Void.class)))
            .thenReturn(created);
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(), eq(Map.class)))
            .thenThrow(new HttpClientErrorException(HttpStatus.NOT_FOUND, "Not Found"));
        when(restTemplate.postForEntity(eq("http://keycloak:8080/admin/realms/logiway/roles"), any(), eq(Void.class)))
            .thenThrow(new HttpClientErrorException(HttpStatus.INTERNAL_SERVER_ERROR, "Server Error"));

        assertThatThrownBy(() -> service.createUserAccount("user@test.fr", "password123", "Jean", "Dupont", "CHAUFFEUR", true))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("Unable to create Keycloak role");
    }

    @Test
    void getOrCreateRealmRole_createdRoleNullBody_throwsBadRequest() {
        when(restTemplate.postForEntity(anyString(), any(), eq(Map.class)))
            .thenReturn(ResponseEntity.ok(Map.of("access_token", "admin-token")));
        ResponseEntity<Void> created = ResponseEntity.created(
            URI.create("http://keycloak:8080/admin/realms/logiway/users/uuid-123")).build();
        when(restTemplate.postForEntity(anyString(), any(), eq(Void.class)))
            .thenReturn(created);
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(), eq(Map.class)))
            .thenThrow(new HttpClientErrorException(HttpStatus.NOT_FOUND, "Not Found"))
            .thenReturn(ResponseEntity.ok(null));
        when(restTemplate.postForEntity(eq("http://keycloak:8080/admin/realms/logiway/roles"), any(), eq(Void.class)))
            .thenReturn(ResponseEntity.ok().build());

        assertThatThrownBy(() -> service.createUserAccount("user@test.fr", "password123", "Jean", "Dupont", "CHAUFFEUR", true))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("Unable to create Keycloak role");
    }

    @Test
    void getOrCreateRealmRole_getRoleHttpErrorOtherThan404_throwsBadRequest() {
        when(restTemplate.postForEntity(anyString(), any(), eq(Map.class)))
            .thenReturn(ResponseEntity.ok(Map.of("access_token", "admin-token")));
        ResponseEntity<Void> created = ResponseEntity.created(
            URI.create("http://keycloak:8080/admin/realms/logiway/users/uuid-123")).build();
        when(restTemplate.postForEntity(anyString(), any(), eq(Void.class)))
            .thenReturn(created);
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(), eq(Map.class)))
            .thenThrow(new HttpClientErrorException(HttpStatus.FORBIDDEN, "Forbidden"));

        assertThatThrownBy(() -> service.createUserAccount("user@test.fr", "password123", "Jean", "Dupont", "CHAUFFEUR", true))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("Unable to read Keycloak role");
    }

    @Test
    void refreshAccessToken_nullToken_throwsBadRequest() {
        assertThatThrownBy(() -> service.refreshAccessToken(null))
            .isInstanceOf(BadRequestException.class)
            .hasMessage("Refresh token is required");
        verify(restTemplate, never()).postForEntity(anyString(), any(), any());
    }

    @Test
    void fetchTokenByPassword_nullClientSecret_omitsSecretFromBody() {
        ReflectionTestUtils.setField(service, "clientSecret", null);
        when(restTemplate.postForEntity(anyString(), any(), eq(Map.class)))
            .thenReturn(ResponseEntity.ok(Map.of("access_token", "abc")));

        service.fetchTokenByPassword("user@test.fr", "password123");

        verify(restTemplate).postForEntity(anyString(), any(HttpEntity.class), eq(Map.class));
    }

    @Test
    void createUserAccount_blankUserIdFromFindEmail_throwsBadRequest() {
        when(restTemplate.postForEntity(anyString(), any(), eq(Map.class)))
            .thenReturn(ResponseEntity.ok(Map.of("access_token", "admin-token")));
        when(restTemplate.postForEntity(anyString(), any(), eq(Void.class)))
            .thenReturn(ResponseEntity.ok().build());
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(), eq(List.class)))
            .thenReturn(ResponseEntity.ok(List.of(Map.of("id", "  "))));

        assertThatThrownBy(() -> service.createUserAccount("user@test.fr", "password123", "Jean", "Dupont", "CHAUFFEUR", true))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("Unable to create Keycloak user");
    }

    @Test
    void updatePasswordByEmail_blankUserId_throwsBadRequest() {
        when(restTemplate.postForEntity(anyString(), any(), eq(Map.class)))
            .thenReturn(ResponseEntity.ok(Map.of("access_token", "admin-token")));
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(), eq(List.class)))
            .thenReturn(ResponseEntity.ok(List.of(Map.of("id", "  "))));

        assertThatThrownBy(() -> service.updatePasswordByEmail("user@test.fr", "newpassword123"))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("Keycloak user not found");
    }

    @Test
    void logoutByRefreshToken_blankClientSecret_omitsSecretFromBody() {
        ReflectionTestUtils.setField(service, "clientSecret", "  ");
        when(restTemplate.postForEntity(anyString(), any(), eq(Void.class)))
            .thenReturn(ResponseEntity.ok().build());

        service.logoutByRefreshToken("refresh-token");

        verify(restTemplate).postForEntity(anyString(), any(HttpEntity.class), eq(Void.class));
    }

    @Test
    void fetchAdminToken_nullAdminClientSecret_omitsSecret() {
        ReflectionTestUtils.setField(service, "adminClientSecret", null);
        when(restTemplate.postForEntity(anyString(), any(), eq(Map.class)))
            .thenReturn(ResponseEntity.ok(Map.of("access_token", "admin-token")));
        lenient().when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(), eq(List.class)))
            .thenReturn(ResponseEntity.ok(List.of(Map.of("id", "uuid-1"))));
        lenient().when(restTemplate.exchange(anyString(), eq(HttpMethod.PUT), any(), eq(Void.class)))
            .thenReturn(ResponseEntity.ok().build());

        service.updatePasswordByEmail("user@test.fr", "newpassword123");

        verify(restTemplate).postForEntity(anyString(), any(HttpEntity.class), eq(Map.class));
    }

    @Test
    void createUserAccount_409_existingUser_nullNames_ensureUserEnabled() {
        when(restTemplate.postForEntity(anyString(), any(), eq(Map.class)))
            .thenReturn(ResponseEntity.ok(Map.of("access_token", "admin-token")));
        when(restTemplate.postForEntity(anyString(), any(), eq(Void.class)))
            .thenThrow(new HttpClientErrorException(HttpStatus.CONFLICT, "Conflict"));
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(), eq(List.class)))
            .thenReturn(ResponseEntity.ok(List.of(Map.of("id", "uuid-existing"))));
        when(restTemplate.exchange(anyString(), eq(HttpMethod.PUT), any(), eq(Void.class)))
            .thenReturn(ResponseEntity.ok().build());
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(), eq(Map.class)))
            .thenReturn(ResponseEntity.ok(Map.of("name", "CHAUFFEUR", "id", "role-1")));

        String userId = service.createUserAccount("user@test.fr", "password123", null, null, "CHAUFFEUR", true);

        assertThat(userId).isEqualTo("uuid-existing");
    }
}

