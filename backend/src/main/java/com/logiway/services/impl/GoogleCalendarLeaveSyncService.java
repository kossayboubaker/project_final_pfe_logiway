package com.logiway.services.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.logiway.entities.Conge;
import com.logiway.entities.Utilisateur;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.KeyFactory;
import java.security.PrivateKey;
import java.security.Signature;
import java.security.spec.PKCS8EncodedKeySpec;
import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;

@Service
@RequiredArgsConstructor
@Slf4j
public class GoogleCalendarLeaveSyncService {

    private static final DateTimeFormatter ISO_DATE = DateTimeFormatter.ISO_LOCAL_DATE;
    private static final String CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar";
    private static final String GOOGLE_TOKEN_URI = "https://oauth2.googleapis.com/token";

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient = HttpClient.newHttpClient();
    private final AtomicReference<CachedToken> cachedTokenRef = new AtomicReference<>();

    @Value("${app.google-calendar.enabled:false}")
    private boolean enabled;

    @Value("${app.google-calendar.calendar-id:}")
    private String calendarId;

    @Value("${app.google-calendar.service-account.client-email:}")
    private String serviceAccountEmail;

    @Value("${app.google-calendar.service-account.private-key:}")
    private String serviceAccountPrivateKey;

    @Value("${app.google-calendar.service-account.credentials-json:}")
    private String serviceAccountCredentialsJson;

    @Value("${app.google-calendar.service-account.delegated-user:}")
    private String delegatedUser;

    @Value("${app.google-calendar.access-token:}")
    private String accessToken;

    @Value("${app.google-calendar.time-zone:Africa/Tunis}")
    private String timeZone;

    public Optional<String> syncApprovedLeave(Conge conge) {
        if (!isConfigured() || conge == null || conge.getDateDebut() == null || conge.getDateFin() == null) {
            return Optional.empty();
        }

        try {
            if (conge.getCalendarEventId() != null && !conge.getCalendarEventId().isBlank()) {
                deleteEvent(conge.getCalendarEventId());
            }

            String eventId = createEvent(conge);
            return Optional.ofNullable(eventId);
        } catch (Exception ex) {
            log.warn("Google Calendar sync failed for leave {}", conge.getId(), ex);
            return Optional.empty();
        }
    }

    public void deleteLeaveEvent(Conge conge) {
        if (!isConfigured() || conge == null || conge.getCalendarEventId() == null || conge.getCalendarEventId().isBlank()) {
            return;
        }

        try {
            deleteEvent(conge.getCalendarEventId());
        } catch (Exception ex) {
            log.warn("Google Calendar event deletion failed for leave {}", conge.getId(), ex);
        }
    }

    private boolean isConfigured() {
        if (!enabled || calendarId == null || calendarId.isBlank()) {
            return false;
        }

        if (accessToken != null && !accessToken.isBlank()) {
            return true;
        }

        if (serviceAccountCredentialsJson != null && !serviceAccountCredentialsJson.isBlank()) {
            return true;
        }

        return serviceAccountEmail != null && !serviceAccountEmail.isBlank()
            && serviceAccountPrivateKey != null && !serviceAccountPrivateKey.isBlank();
    }

    private String createEvent(Conge conge) throws IOException, InterruptedException {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("summary", buildSummary(conge));
        payload.put("description", buildDescription(conge));
        payload.put("start", Map.of("date", ISO_DATE.format(conge.getDateDebut()), "timeZone", timeZone));
        payload.put("end", Map.of("date", ISO_DATE.format(conge.getDateFin().plusDays(1)), "timeZone", timeZone));
        payload.put("transparency", "transparent");
        payload.put("extendedProperties", Map.of("private", buildPrivateMetadata(conge)));

        String body = objectMapper.writeValueAsString(payload);
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create("https://www.googleapis.com/calendar/v3/calendars/" + encodeCalendarId(calendarId) + "/events"))
            .header("Authorization", "Bearer " + resolveAccessToken())
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(body))
            .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() >= 200 && response.statusCode() < 300) {
            JsonNode node = objectMapper.readTree(response.body());
            return node.path("id").asText(null);
        }

        throw new IOException("Unexpected calendar response: " + response.statusCode());
    }

    private void deleteEvent(String eventId) throws IOException, InterruptedException {
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create("https://www.googleapis.com/calendar/v3/calendars/" + encodeCalendarId(calendarId) + "/events/" + eventId))
            .header("Authorization", "Bearer " + resolveAccessToken())
            .DELETE()
            .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() == 404) {
            return;
        }

        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new IOException("Unexpected delete response: " + response.statusCode());
        }
    }

    private String buildSummary(Conge conge) {
        String owner = conge.getChauffeur() != null
            ? conge.getChauffeur().getPrenom() + " " + conge.getChauffeur().getNom()
            : conge.getManager() != null
                ? conge.getManager().getPrenom() + " " + conge.getManager().getNom()
                : "Utilisateur";

        return "Absence " + owner.trim() + " - " + conge.getType();
    }

    private String buildDescription(Conge conge) {
        Utilisateur owner = conge.getChauffeur() != null ? conge.getChauffeur() : conge.getManager();
        String ownerName = owner != null ? (safe(owner.getPrenom()) + " " + safe(owner.getNom())).trim() : "Utilisateur";
        String ownerRole = owner != null ? owner.getRole().name() : "INCONNU";
        String managerName = conge.getManager() != null ? (safe(conge.getManager().getPrenom()) + " " + safe(conge.getManager().getNom())).trim() : "N/A";
        String driverName = conge.getChauffeur() != null ? (safe(conge.getChauffeur().getPrenom()) + " " + safe(conge.getChauffeur().getNom())).trim() : "N/A";

        return "Absence LogiWay\n"
            + "- ID congé: " + safe(conge.getId()) + "\n"
            + "- Utilisateur: " + ownerName + " (" + ownerRole + ")\n"
            + "- Type: " + conge.getType() + "\n"
            + "- Début: " + conge.getDateDebut() + "\n"
            + "- Fin: " + conge.getDateFin() + "\n"
            + "- Durée: " + (conge.getPeriode() != null ? conge.getPeriode() + " jour(s)" : "N/A") + "\n"
            + "- Motif: " + safe(conge.getMotif()) + "\n"
            + "- Manager: " + managerName + "\n"
            + "- Chauffeur: " + driverName + "\n"
            + "- Statut: " + conge.getStatut();
    }

    private Map<String, String> buildPrivateMetadata(Conge conge) {
        Map<String, String> metadata = new LinkedHashMap<>();
        metadata.put("leaveId", safe(conge.getId()));
        metadata.put("leaveType", conge.getType() != null ? conge.getType().name() : "");
        metadata.put("leaveStatus", conge.getStatut() != null ? conge.getStatut().name() : "");
        metadata.put("managerId", conge.getManager() != null && conge.getManager().getId() != null ? String.valueOf(conge.getManager().getId()) : "");
        metadata.put("driverId", conge.getChauffeur() != null && conge.getChauffeur().getId() != null ? String.valueOf(conge.getChauffeur().getId()) : "");
        return metadata;
    }

    private String resolveAccessToken() throws IOException, InterruptedException {
        if (accessToken != null && !accessToken.isBlank()) {
            return accessToken;
        }

        CachedToken cached = cachedTokenRef.get();
        long now = Instant.now().getEpochSecond();
        if (cached != null && cached.expiresAtEpochSeconds - 60 > now) {
            return cached.value;
        }

        String freshToken = requestServiceAccountToken();
        return freshToken;
    }

    private String requestServiceAccountToken() throws IOException, InterruptedException {
        try {
            long now = Instant.now().getEpochSecond();
            long expiresAt = now + 3600;
            ServiceAccountCredentials credentials = resolveServiceAccountCredentials();
            String assertion = buildJwtAssertion(credentials, now, expiresAt);

            String payload = "grant_type=" + urlEncode("urn:ietf:params:oauth:grant-type:jwt-bearer")
                + "&assertion=" + urlEncode(assertion);

            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(GOOGLE_TOKEN_URI))
                .header("Content-Type", "application/x-www-form-urlencoded")
                .POST(HttpRequest.BodyPublishers.ofString(payload))
                .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new IOException("Token endpoint returned " + response.statusCode());
            }

            JsonNode node = objectMapper.readTree(response.body());
            String token = node.path("access_token").asText(null);
            long ttl = node.path("expires_in").asLong(3600);
            if (token == null || token.isBlank()) {
                throw new IOException("Google access_token is missing");
            }

            cachedTokenRef.set(new CachedToken(token, Instant.now().getEpochSecond() + ttl));
            return token;
        } catch (RuntimeException ex) {
            throw new IOException("Failed to create Google service-account token", ex);
        }
    }

    private String buildJwtAssertion(ServiceAccountCredentials credentials, long issuedAt, long expiresAt) throws IOException {
        Map<String, Object> header = Map.of(
            "alg", "RS256",
            "typ", "JWT"
        );

        Map<String, Object> claims = new LinkedHashMap<>();
        claims.put("iss", credentials.clientEmail());
        claims.put("scope", CALENDAR_SCOPE);
        claims.put("aud", GOOGLE_TOKEN_URI);
        claims.put("iat", issuedAt);
        claims.put("exp", expiresAt);
        claims.put("jti", UUID.randomUUID().toString());
        if (delegatedUser != null && !delegatedUser.isBlank()) {
            claims.put("sub", delegatedUser.trim());
        }

        String encodedHeader = base64Url(objectMapper.writeValueAsBytes(header));
        String encodedClaims = base64Url(objectMapper.writeValueAsBytes(claims));
        String signingInput = encodedHeader + "." + encodedClaims;

        byte[] signature = sign(signingInput.getBytes(StandardCharsets.UTF_8), parsePrivateKey(credentials.privateKey()));
        return signingInput + "." + base64Url(signature);
    }

    private ServiceAccountCredentials resolveServiceAccountCredentials() throws IOException {
        if (serviceAccountCredentialsJson != null && !serviceAccountCredentialsJson.isBlank()) {
            String jsonContent = readCredentialsJson(serviceAccountCredentialsJson.trim());
            JsonNode node = objectMapper.readTree(jsonContent);
            String email = node.path("client_email").asText("").trim();
            String privateKey = node.path("private_key").asText("").trim();

            if (!email.isBlank() && !privateKey.isBlank()) {
                return new ServiceAccountCredentials(email, privateKey);
            }
        }

        String email = safe(serviceAccountEmail).trim();
        String privateKey = safe(serviceAccountPrivateKey).trim();
        if (email.isBlank() || privateKey.isBlank()) {
            throw new IOException("Google service account credentials are missing");
        }

        return new ServiceAccountCredentials(email, privateKey);
    }

    private String readCredentialsJson(String value) throws IOException {
        String trimmed = value.trim();
        if (trimmed.startsWith("{")) {
            return trimmed;
        }

        return Files.readString(Path.of(trimmed), StandardCharsets.UTF_8);
    }

    private byte[] sign(byte[] data, PrivateKey privateKey) throws IOException {
        try {
            Signature signature = Signature.getInstance("SHA256withRSA");
            signature.initSign(privateKey);
            signature.update(data);
            return signature.sign();
        } catch (Exception ex) {
            throw new IOException("Unable to sign JWT with service account key", ex);
        }
    }

    private PrivateKey parsePrivateKey(String rawKey) throws IOException {
        try {
            String normalized = rawKey
                .replace("\\n", "\n")
                .replace("-----BEGIN PRIVATE KEY-----", "")
                .replace("-----END PRIVATE KEY-----", "")
                .replaceAll("\\s+", "");
            byte[] decoded = Base64.getDecoder().decode(normalized);
            PKCS8EncodedKeySpec keySpec = new PKCS8EncodedKeySpec(decoded);
            return KeyFactory.getInstance("RSA").generatePrivate(keySpec);
        } catch (Exception ex) {
            throw new IOException("Unable to parse service account private key", ex);
        }
    }

    private String base64Url(byte[] value) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(value);
    }

    private String urlEncode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    private String encodeCalendarId(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    private String safe(Object value) {
        return value == null ? "" : String.valueOf(value);
    }

    private record CachedToken(String value, long expiresAtEpochSeconds) {
    }

    private record ServiceAccountCredentials(String clientEmail, String privateKey) {
    }
}