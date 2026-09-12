package com.logiway.exceptions;

import com.logiway.dto.response.ApiMessageResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@DisplayName("GlobalExceptionHandler — Tests unitaires")
class GlobalExceptionHandlerTest {

    private GlobalExceptionHandler handler;

    @BeforeEach
    void setUp() {
        handler = new GlobalExceptionHandler();
    }

    @Test @DisplayName("handleNotFound → 404")
    void handleNotFound() {
        ResponseEntity<ApiMessageResponse> r = handler.handleNotFound(new ResourceNotFoundException("Not found"));
        assertThat(r.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(r.getBody().message()).isEqualTo("Not found");
    }

    @Test @DisplayName("handleBadRequest → 400")
    void handleBadRequest() {
        ResponseEntity<ApiMessageResponse> r = handler.handleBadRequest(new BadRequestException("Bad data"));
        assertThat(r.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(r.getBody().message()).isEqualTo("Bad data");
    }

    @Test @DisplayName("handleConflict → 409")
    void handleConflict() {
        ResponseEntity<ApiMessageResponse> r = handler.handleConflict(new ConflictException("Conflict"));
        assertThat(r.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
    }

    @Test @DisplayName("handleUnauthorized → 401")
    void handleUnauthorized() {
        ResponseEntity<ApiMessageResponse> r = handler.handleUnauthorized(new UnauthorizedException("Unauthorized"));
        assertThat(r.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test @DisplayName("handleAccountRejected → 403")
    void handleAccountRejected() {
        ResponseEntity<ApiMessageResponse> r = handler.handleAccountRejected(new AccountRejectedException("Rejected"));
        assertThat(r.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test @DisplayName("handleForbiddenMessage → 403")
    void handleForbiddenMessage() {
        ResponseEntity<ApiMessageResponse> r = handler.handleForbiddenMessage(new ForbiddenException("Forbidden"));
        assertThat(r.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(r.getBody().message()).isEqualTo("Forbidden");
    }

    @Test @DisplayName("handleAuthProviderUnavailable → 503")
    void handleAuthProviderUnavailable() {
        ResponseEntity<ApiMessageResponse> r = handler.handleAuthProviderUnavailable(
            new AuthProviderUnavailableException("Service unavailable"));
        assertThat(r.getStatusCode()).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE);
    }

    @Test @DisplayName("handleForbidden (AccessDeniedException) → 403")
    void handleForbidden_accessDenied() {
        ResponseEntity<ApiMessageResponse> r = handler.handleForbidden(new AccessDeniedException("Denied"));
        assertThat(r.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(r.getBody().message()).isEqualTo("Access denied");
    }

    @Test @DisplayName("handleValidation → 400 avec map des erreurs")
    void handleValidation() {
        MethodArgumentNotValidException ex = mock(MethodArgumentNotValidException.class);
        BindingResult bindingResult = mock(BindingResult.class);
        FieldError fieldError = new FieldError("obj", "email", "must not be blank");
        when(ex.getBindingResult()).thenReturn(bindingResult);
        when(bindingResult.getFieldErrors()).thenReturn(List.of(fieldError));

        ResponseEntity<Map<String, String>> r = handler.handleValidation(ex);
        assertThat(r.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(r.getBody()).containsEntry("email", "must not be blank");
    }

    @Test @DisplayName("handleIllegalArgument → 400")
    void handleIllegalArgument() {
        ResponseEntity<ApiMessageResponse> r = handler.handleIllegalArgument(
            new IllegalArgumentException("invalid format"));
        assertThat(r.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(r.getBody().message()).contains("invalid format");
    }

    @Test @DisplayName("handleAny (Exception générique) → 500")
    void handleAny() {
        ResponseEntity<ApiMessageResponse> r = handler.handleAny(new RuntimeException("unexpected"));
        assertThat(r.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(r.getBody().message()).contains("unexpected");
    }

    @Test @DisplayName("handleMediaTypeNotAcceptable → 500 avec message media type")
    void handleMediaTypeNotAcceptable() throws Exception {
        org.springframework.web.HttpMediaTypeNotAcceptableException ex =
            new org.springframework.web.HttpMediaTypeNotAcceptableException("not acceptable");
        ResponseEntity<ApiMessageResponse> r = handler.handleMediaTypeNotAcceptable(ex);
        assertThat(r.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(r.getBody().message()).contains("Media type");
    }

    // Test des constructeurs d'exceptions
    @Test @DisplayName("Exceptions — constructeurs avec message")
    void exceptionConstructors() {
        assertThat(new ResourceNotFoundException("r").getMessage()).isEqualTo("r");
        assertThat(new BadRequestException("b").getMessage()).isEqualTo("b");
        assertThat(new ConflictException("c").getMessage()).isEqualTo("c");
        assertThat(new UnauthorizedException("u").getMessage()).isEqualTo("u");
        assertThat(new ForbiddenException("f").getMessage()).isEqualTo("f");
        assertThat(new AccountRejectedException("a").getMessage()).isEqualTo("a");
        assertThat(new AuthProviderUnavailableException("p").getMessage()).isEqualTo("p");
    }
}
