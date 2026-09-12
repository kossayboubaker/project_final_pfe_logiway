package com.logiway.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.logiway.entities.Chauffeur;
import com.logiway.entities.Conge;
import com.logiway.entities.Manager;
import com.logiway.entities.enums.Role;
import com.logiway.entities.enums.StatutConge;
import com.logiway.entities.enums.TypeConge;
import com.logiway.services.impl.GoogleCalendarLeaveSyncService;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.io.IOException;
import java.lang.reflect.Method;
import java.security.KeyPairGenerator;
import java.security.PrivateKey;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.Flow;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Service Google Calendar Leave Sync — Tests Unitaires")
class GoogleCalendarLeaveSyncServiceTest {

    private static final String CALENDAR_ID = "logiway@test.calendar.com";
    private static final String SERVICE_EMAIL = "svc-account@test.iam.gserviceaccount.com";
    private static final String DELEGATED_USER = "boss@logiway.com";
    private static final String TEST_PRIVATE_KEY = generateTestPrivateKey();

    private static String generateTestPrivateKey() {
        try {
            KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
            generator.initialize(2048);
            return Base64.getEncoder().encodeToString(generator.generateKeyPair().getPrivate().getEncoded());
        } catch (Exception ex) {
            throw new IllegalStateException(ex);
        }
    }

    @Mock private HttpClient httpClient;

    private GoogleCalendarLeaveSyncService syncService;
    private final List<HttpRequest> sentRequests = new ArrayList<>();

    @BeforeEach
    void setUp() {
        syncService = new GoogleCalendarLeaveSyncService(new ObjectMapper());
        ReflectionTestUtils.setField(syncService, "httpClient", httpClient);
        ReflectionTestUtils.setField(syncService, "enabled", true);
        ReflectionTestUtils.setField(syncService, "calendarId", CALENDAR_ID);
        ReflectionTestUtils.setField(syncService, "serviceAccountEmail", SERVICE_EMAIL);
        ReflectionTestUtils.setField(syncService, "serviceAccountPrivateKey", TEST_PRIVATE_KEY);
        ReflectionTestUtils.setField(syncService, "serviceAccountCredentialsJson", "");
        ReflectionTestUtils.setField(syncService, "delegatedUser", DELEGATED_USER);
        ReflectionTestUtils.setField(syncService, "accessToken", "");
        ReflectionTestUtils.setField(syncService, "timeZone", "Africa/Tunis");
        sentRequests.clear();
    }

    private Conge buildConge(boolean withChauffeur, boolean withManager) {
        Conge conge = new Conge();
        conge.setId(1L);
        conge.setType(TypeConge.VACANCES);
        conge.setStatut(StatutConge.APPROUVE);
        conge.setDateDebut(LocalDate.of(2026, 8, 10));
        conge.setDateFin(LocalDate.of(2026, 8, 12));
        conge.setPeriode(3);
        conge.setMotif("Vacances d'ete");
        if (withManager) {
            Manager manager = new Manager();
            manager.setId(12L);
            manager.setPrenom("Marie");
            manager.setNom("Curie");
            manager.setRole(Role.MANAGER);
            conge.setManager(manager);
        }
        if (withChauffeur) {
            Chauffeur chauffeur = new Chauffeur();
            chauffeur.setId(11L);
            chauffeur.setPrenom("Jean");
            chauffeur.setNom("Dupont");
            chauffeur.setRole(Role.CHAUFFEUR);
            conge.setChauffeur(chauffeur);
        }
        return conge;
    }

    private HttpResponse<String> httpResponse(int status, String body) {
        HttpResponse<String> response = mock(HttpResponse.class);
        lenient().when(response.statusCode()).thenReturn(status);
        lenient().when(response.body()).thenReturn(body);
        return response;
    }

    private void stubTransport() throws Exception {
        when(httpClient.send(any(HttpRequest.class), any())).thenAnswer(inv -> {
            HttpRequest request = inv.getArgument(0);
            sentRequests.add(request);
            if (request.uri().toString().contains("/token")) {
                return httpResponse(200, "{\"access_token\":\"tok123\",\"expires_in\":3600}");
            }
            if ("DELETE".equals(request.method())) {
                return httpResponse(204, "");
            }
            return httpResponse(200, "{\"id\":\"evt-1\"}");
        });
    }

    private String requestBody(HttpRequest request) {
        return request.bodyPublisher().map(publisher -> {
            StringBuilder builder = new StringBuilder();
            Flow.Subscriber<ByteBuffer> subscriber = new Flow.Subscriber<>() {
                @Override
                public void onSubscribe(Flow.Subscription subscription) {
                    subscription.request(Long.MAX_VALUE);
                }

                @Override
                public void onNext(ByteBuffer item) {
                    byte[] bytes = new byte[item.remaining()];
                    item.get(bytes);
                    builder.append(new String(bytes, StandardCharsets.UTF_8));
                }

                @Override
                public void onError(Throwable throwable) {
                }

                @Override
                public void onComplete() {
                }
            };
            publisher.subscribe(subscriber);
            return builder.toString();
        }).orElse("");
    }

    @Test
    @DisplayName("syncApprovedLeave() → Fonctionnalite desactivee retourne empty")
    void syncApprovedLeave_whenDisabled_returnsEmpty() {
        ReflectionTestUtils.setField(syncService, "enabled", false);

        assertThat(syncService.syncApprovedLeave(buildConge(true, true))).isEmpty();
        verifyNoInteractions(httpClient);
    }

    @Test
    @DisplayName("syncApprovedLeave() → Calendar id vide retourne empty")
    void syncApprovedLeave_whenCalendarIdBlank_returnsEmpty() {
        ReflectionTestUtils.setField(syncService, "calendarId", " ");

        assertThat(syncService.syncApprovedLeave(buildConge(true, true))).isEmpty();
        verifyNoInteractions(httpClient);
    }

    @Test
    @DisplayName("syncApprovedLeave() → Conge null retourne empty")
    void syncApprovedLeave_whenCongeNull_returnsEmpty() {
        assertThat(syncService.syncApprovedLeave(null)).isEmpty();
        verifyNoInteractions(httpClient);
    }

    @Test
    @DisplayName("syncApprovedLeave() → Dates manquantes retourne empty")
    void syncApprovedLeave_whenDatesMissing_returnsEmpty() {
        Conge conge = buildConge(true, true);
        conge.setDateDebut(null);
        assertThat(syncService.syncApprovedLeave(conge)).isEmpty();

        Conge congeSansFin = buildConge(true, true);
        congeSansFin.setDateFin(null);
        assertThat(syncService.syncApprovedLeave(congeSansFin)).isEmpty();
        verifyNoInteractions(httpClient);
    }

    @Test
    @DisplayName("syncApprovedLeave() → Access token preconfigure utilise le token")
    void syncApprovedLeave_withAccessToken_createsEvent() throws Exception {
        ReflectionTestUtils.setField(syncService, "accessToken", "pre-shared-token");
        stubTransport();

        Optional<String> result = syncService.syncApprovedLeave(buildConge(true, true));

        assertThat(result).contains("evt-1");
        assertThat(sentRequests).hasSize(1);
        assertThat(sentRequests.get(0).headers().firstValue("Authorization"))
            .hasValue("Bearer pre-shared-token");
    }

    @Test
    @DisplayName("syncApprovedLeave() → Evenement existant supprime puis recree")
    void syncApprovedLeave_withExistingEvent_deletesThenCreates() throws Exception {
        ReflectionTestUtils.setField(syncService, "accessToken", "pre-shared-token");
        Conge conge = buildConge(true, true);
        conge.setCalendarEventId("old-evt");
        stubTransport();

        Optional<String> result = syncService.syncApprovedLeave(conge);

        assertThat(result).contains("evt-1");
        assertThat(sentRequests).hasSize(2);
        assertThat(sentRequests.get(0).method()).isEqualTo("DELETE");
        assertThat(sentRequests.get(0).uri().toString()).endsWith("/events/old-evt");
        assertThat(sentRequests.get(1).method()).isEqualTo("POST");
    }

    @Test
    @DisplayName("syncApprovedLeave() → Reponse sans id retourne empty")
    void syncApprovedLeave_whenCreateEventIdMissing_returnsEmpty() throws Exception {
        ReflectionTestUtils.setField(syncService, "accessToken", "pre-shared-token");
        when(httpClient.send(any(HttpRequest.class), any()))
            .thenAnswer(inv -> httpResponse(200, "{}"));

        assertThat(syncService.syncApprovedLeave(buildConge(true, true))).isEmpty();
    }

    @Test
    @DisplayName("syncApprovedLeave() → Erreur HTTP creation retourne empty")
    void syncApprovedLeave_whenCreateEventFails_returnsEmpty() throws Exception {
        ReflectionTestUtils.setField(syncService, "accessToken", "pre-shared-token");
        when(httpClient.send(any(HttpRequest.class), any()))
            .thenAnswer(inv -> httpResponse(500, "boom"));

        assertThat(syncService.syncApprovedLeave(buildConge(true, true))).isEmpty();
    }

    @Test
    @DisplayName("syncApprovedLeave() → Interruption transport retourne empty")
    void syncApprovedLeave_whenInterrupted_returnsEmpty() throws Exception {
        when(httpClient.send(any(HttpRequest.class), any()))
            .thenThrow(new InterruptedException("boom"));

        assertThat(syncService.syncApprovedLeave(buildConge(true, true))).isEmpty();
    }

    @Test
    @DisplayName("syncApprovedLeave() → Flux token service account puis cache")
    void syncApprovedLeave_serviceAccountTokenFlow_succeedsAndCachesToken() throws Exception {
        stubTransport();

        Optional<String> first = syncService.syncApprovedLeave(buildConge(true, true));
        Optional<String> second = syncService.syncApprovedLeave(buildConge(true, true));

        assertThat(first).contains("evt-1");
        assertThat(second).contains("evt-1");
        long tokenCalls = sentRequests.stream()
            .filter(r -> r.uri().toString().contains("/token"))
            .count();
        assertThat(sentRequests).hasSize(3);
        assertThat(tokenCalls).isEqualTo(1);
    }

    @Test
    @DisplayName("syncApprovedLeave() → Erreur endpoint token retourne empty")
    void syncApprovedLeave_tokenEndpointError_returnsEmpty() throws Exception {
        when(httpClient.send(any(HttpRequest.class), any()))
            .thenAnswer(inv -> httpResponse(500, "err"));

        assertThat(syncService.syncApprovedLeave(buildConge(true, true))).isEmpty();
    }

    @Test
    @DisplayName("syncApprovedLeave() → Token manquant dans la reponse retourne empty")
    void syncApprovedLeave_whenTokenMissing_returnsEmpty() throws Exception {
        when(httpClient.send(any(HttpRequest.class), any()))
            .thenAnswer(inv -> httpResponse(200, "{\"expires_in\":3600}"));

        assertThat(syncService.syncApprovedLeave(buildConge(true, true))).isEmpty();
    }

    @Test
    @DisplayName("syncApprovedLeave() → RuntimeException du transport token retourne empty")
    void syncApprovedLeave_tokenTransportRuntimeException_returnsEmpty() throws Exception {
        when(httpClient.send(any(HttpRequest.class), any()))
            .thenThrow(new RuntimeException("boom"));

        assertThat(syncService.syncApprovedLeave(buildConge(true, true))).isEmpty();
    }

    @Test
    @DisplayName("syncApprovedLeave() → Token vide dans la reponse retourne empty")
    void syncApprovedLeave_whenTokenBlank_returnsEmpty() throws Exception {
        when(httpClient.send(any(HttpRequest.class), any()))
            .thenAnswer(inv -> httpResponse(200, "{\"access_token\":\"  \",\"expires_in\":3600}"));

        assertThat(syncService.syncApprovedLeave(buildConge(true, true))).isEmpty();
    }

    @Test
    @DisplayName("syncApprovedLeave() → Credentials JSON en chaine sont lus")
    void syncApprovedLeave_credentialsFromJsonString_succeeds() throws Exception {
        ReflectionTestUtils.setField(syncService, "serviceAccountEmail", "");
        ReflectionTestUtils.setField(syncService, "serviceAccountPrivateKey", "");
        ReflectionTestUtils.setField(syncService, "serviceAccountCredentialsJson",
            "{\"client_email\":\"json@svc.example.com\",\"private_key\":\"" + TEST_PRIVATE_KEY + "\"}");
        stubTransport();

        assertThat(syncService.syncApprovedLeave(buildConge(true, true))).contains("evt-1");
        assertThat(sentRequests).hasSize(2);
        assertThat(sentRequests.stream().anyMatch(r -> r.uri().toString().contains("/token"))).isTrue();
    }

    @Test
    @DisplayName("syncApprovedLeave() → Credentials JSON depuis un fichier sont lus")
    void syncApprovedLeave_credentialsFromJsonFile_succeeds() throws Exception {
        Path credentialsFile = Files.createTempFile("svc-account", ".json");
        Files.writeString(credentialsFile,
            "{\"client_email\":\"file@svc.example.com\",\"private_key\":\"" + TEST_PRIVATE_KEY + "\"}");
        ReflectionTestUtils.setField(syncService, "serviceAccountEmail", "");
        ReflectionTestUtils.setField(syncService, "serviceAccountPrivateKey", "");
        ReflectionTestUtils.setField(syncService, "serviceAccountCredentialsJson", credentialsFile.toString());
        stubTransport();

        assertThat(syncService.syncApprovedLeave(buildConge(true, true))).contains("evt-1");
        Files.deleteIfExists(credentialsFile);
    }

    @Test
    @DisplayName("syncApprovedLeave() → JSON incomplet retombe sur les champs")
    void syncApprovedLeave_credentialsJsonFallsBackToFields_succeeds() throws Exception {
        ReflectionTestUtils.setField(syncService, "serviceAccountCredentialsJson",
            "{\"client_email\":\"\",\"private_key\":\"\"}");
        stubTransport();

        assertThat(syncService.syncApprovedLeave(buildConge(true, true))).contains("evt-1");
    }

    @Test
    @DisplayName("syncApprovedLeave() → Credentials manquants retourne empty")
    void syncApprovedLeave_whenCredentialsMissing_returnsEmpty() {
        ReflectionTestUtils.setField(syncService, "serviceAccountEmail", "");
        ReflectionTestUtils.setField(syncService, "serviceAccountPrivateKey", "");
        ReflectionTestUtils.setField(syncService, "serviceAccountCredentialsJson",
            "{\"client_email\":\"\",\"private_key\":\"\"}");

        assertThat(syncService.syncApprovedLeave(buildConge(true, true))).isEmpty();
        verifyNoInteractions(httpClient);
    }

    @Test
    @DisplayName("syncApprovedLeave() → Cle privee invalide retourne empty")
    void syncApprovedLeave_whenPrivateKeyInvalid_returnsEmpty() {
        ReflectionTestUtils.setField(syncService, "serviceAccountEmail", "");
        ReflectionTestUtils.setField(syncService, "serviceAccountPrivateKey", "");
        ReflectionTestUtils.setField(syncService, "serviceAccountCredentialsJson",
            "{\"client_email\":\"json@svc.example.com\",\"private_key\":\"!!!not-a-key!!!\"}");

        assertThat(syncService.syncApprovedLeave(buildConge(true, true))).isEmpty();
    }

    @Test
    @DisplayName("syncApprovedLeave() → Resume construit avec le chauffeur")
    void syncApprovedLeave_buildsSummaryWithChauffeur() throws Exception {
        ReflectionTestUtils.setField(syncService, "accessToken", "pre-shared-token");
        stubTransport();

        syncService.syncApprovedLeave(buildConge(true, false));

        assertThat(requestBody(sentRequests.get(0))).contains("Absence Jean Dupont - VACANCES");
    }

    @Test
    @DisplayName("syncApprovedLeave() → Resume construit avec le manager")
    void syncApprovedLeave_buildsSummaryWithManager() throws Exception {
        ReflectionTestUtils.setField(syncService, "accessToken", "pre-shared-token");
        stubTransport();

        syncService.syncApprovedLeave(buildConge(false, true));

        assertThat(requestBody(sentRequests.get(0))).contains("Absence Marie Curie - VACANCES");
    }

    @Test
    @DisplayName("syncApprovedLeave() → Sans proprietaire resume Utilisateur")
    void syncApprovedLeave_buildsSummaryWithNoOwner() throws Exception {
        ReflectionTestUtils.setField(syncService, "accessToken", "pre-shared-token");
        stubTransport();

        syncService.syncApprovedLeave(buildConge(false, false));

        String body = requestBody(sentRequests.get(0));
        assertThat(body).contains("Absence Utilisateur - VACANCES");
        assertThat(body).contains("(INCONNU)");
        assertThat(body).contains("- Manager: N/A");
        assertThat(body).contains("- Chauffeur: N/A");
    }

    @Test
    @DisplayName("syncApprovedLeave() → Metadonnees privees construites")
    void syncApprovedLeave_buildsPrivateMetadata() throws Exception {
        ReflectionTestUtils.setField(syncService, "accessToken", "pre-shared-token");
        stubTransport();

        syncService.syncApprovedLeave(buildConge(true, true));

        String body = requestBody(sentRequests.get(0));
        assertThat(body).contains("\"leaveId\":\"1\"");
        assertThat(body).contains("\"leaveType\":\"VACANCES\"");
        assertThat(body).contains("\"leaveStatus\":\"APPROUVE\"");
        assertThat(body).contains("\"managerId\":\"12\"");
        assertThat(body).contains("\"driverId\":\"11\"");
        assertThat(body).contains("\"start\"");
        assertThat(body).contains("\"end\"");
        assertThat(body).contains("\"date\":\"2026-08-10\"");
        assertThat(body).contains("\"date\":\"2026-08-13\"");
        assertThat(body).contains("\"timeZone\":\"Africa/Tunis\"");
        assertThat(body).contains("\"transparency\":\"transparent\"");
    }

    @Test
    @DisplayName("syncApprovedLeave() → Sans utilisateur delegue le flux fonctionne")
    void syncApprovedLeave_withoutDelegatedUser_succeeds() throws Exception {
        ReflectionTestUtils.setField(syncService, "delegatedUser", " ");
        stubTransport();

        assertThat(syncService.syncApprovedLeave(buildConge(true, true))).contains("evt-1");
    }

    @Test
    @DisplayName("deleteLeaveEvent() → Fonctionnalite desactivee ne fait rien")
    void deleteLeaveEvent_whenDisabled_noop() {
        ReflectionTestUtils.setField(syncService, "enabled", false);
        Conge conge = buildConge(true, true);
        conge.setCalendarEventId("evt-x");

        syncService.deleteLeaveEvent(conge);

        verifyNoInteractions(httpClient);
    }

    @Test
    @DisplayName("deleteLeaveEvent() → Conge null ne fait rien")
    void deleteLeaveEvent_whenCongeNull_noop() {
        syncService.deleteLeaveEvent(null);
        verifyNoInteractions(httpClient);
    }

    @Test
    @DisplayName("deleteLeaveEvent() → Event id absent ne fait rien")
    void deleteLeaveEvent_whenEventIdBlank_noop() {
        syncService.deleteLeaveEvent(buildConge(true, true));
        Conge conge = buildConge(true, true);
        conge.setCalendarEventId("   ");
        syncService.deleteLeaveEvent(conge);
        verifyNoInteractions(httpClient);
    }

    @Test
    @DisplayName("deleteLeaveEvent() → Supprime l'evenement distant")
    void deleteLeaveEvent_success_deletesEvent() throws Exception {
        ReflectionTestUtils.setField(syncService, "accessToken", "pre-shared-token");
        Conge conge = buildConge(true, true);
        conge.setCalendarEventId("evt-42");
        stubTransport();

        syncService.deleteLeaveEvent(conge);

        assertThat(sentRequests).hasSize(1);
        assertThat(sentRequests.get(0).method()).isEqualTo("DELETE");
        assertThat(sentRequests.get(0).uri().toString()).endsWith("/events/evt-42");
    }

    @Test
    @DisplayName("deleteLeaveEvent() → Reponse 404 ignoree")
    void deleteLeaveEvent_when404_ignored() throws Exception {
        ReflectionTestUtils.setField(syncService, "accessToken", "pre-shared-token");
        Conge conge = buildConge(true, true);
        conge.setCalendarEventId("evt-42");
        when(httpClient.send(any(HttpRequest.class), any()))
            .thenAnswer(inv -> httpResponse(404, "not found"));

        assertThatNoException().isThrownBy(() -> syncService.deleteLeaveEvent(conge));
    }

    @Test
    @DisplayName("deleteLeaveEvent() → Erreur HTTP ignoree")
    void deleteLeaveEvent_whenErrorStatus_ignored() throws Exception {
        ReflectionTestUtils.setField(syncService, "accessToken", "pre-shared-token");
        Conge conge = buildConge(true, true);
        conge.setCalendarEventId("evt-42");
        when(httpClient.send(any(HttpRequest.class), any()))
            .thenAnswer(inv -> httpResponse(500, "boom"));

        assertThatNoException().isThrownBy(() -> syncService.deleteLeaveEvent(conge));
    }

    @Test
    @DisplayName("deleteLeaveEvent() → Interruption transport ignoree")
    void deleteLeaveEvent_whenInterrupted_ignored() throws Exception {
        when(httpClient.send(any(HttpRequest.class), any()))
            .thenThrow(new InterruptedException("boom"));

        Conge conge = buildConge(true, true);
        conge.setCalendarEventId("evt-42");
        assertThatNoException().isThrownBy(() -> syncService.deleteLeaveEvent(conge));
    }

    @Test
    @DisplayName("deleteLeaveEvent() → Reutilise le token en cache")
    void deleteLeaveEvent_usesCachedToken_noNewTokenRequest() throws Exception {
        stubTransport();

        syncService.syncApprovedLeave(buildConge(true, true));
        Conge conge = buildConge(true, true);
        conge.setCalendarEventId("evt-42");
        syncService.deleteLeaveEvent(conge);

        long tokenCalls = sentRequests.stream()
            .filter(r -> r.uri().toString().contains("/token"))
            .count();
        assertThat(sentRequests).hasSize(3);
        assertThat(tokenCalls).isEqualTo(1);
    }

    @Test
    @DisplayName("syncApprovedLeave() → Aucune configuration de credentials retourne empty")
    void syncApprovedLeave_whenNoCredentialsConfigured_returnsEmpty() {
        ReflectionTestUtils.setField(syncService, "accessToken", "");
        ReflectionTestUtils.setField(syncService, "serviceAccountCredentialsJson", "");
        ReflectionTestUtils.setField(syncService, "serviceAccountEmail", "");
        ReflectionTestUtils.setField(syncService, "serviceAccountPrivateKey", "");

        assertThat(syncService.syncApprovedLeave(buildConge(true, true))).isEmpty();
        verifyNoInteractions(httpClient);
    }

    @Test
    @DisplayName("syncApprovedLeave() → Type et statut nuls geres dans les metadonnees")
    void syncApprovedLeave_whenTypeAndStatusNull_buildsEmptyMetadata() throws Exception {
        ReflectionTestUtils.setField(syncService, "accessToken", "pre-shared-token");
        Conge conge = buildConge(false, false);
        conge.setType(null);
        conge.setStatut(null);
        stubTransport();

        assertThat(syncService.syncApprovedLeave(conge)).contains("evt-1");

        String body = requestBody(sentRequests.get(0));
        assertThat(body).contains("\"leaveType\":\"\"");
        assertThat(body).contains("\"leaveStatus\":\"\"");
        assertThat(body).contains("\"managerId\":\"\"");
        assertThat(body).contains("\"driverId\":\"\"");
    }

    @Test
    @DisplayName("syncApprovedLeave() → Periode nulle affiche N/A dans la description")
    void syncApprovedLeave_whenPeriodeNull_descriptionShowsNA() throws Exception {
        ReflectionTestUtils.setField(syncService, "accessToken", "pre-shared-token");
        Conge conge = buildConge(true, true);
        conge.setPeriode(null);
        stubTransport();

        syncService.syncApprovedLeave(conge);

        String body = requestBody(sentRequests.get(0));
        assertThat(body).contains("- Durée: N/A");
    }

    @Test
    @DisplayName("syncApprovedLeave() → Motif nul safe retourne chaine vide")
    void syncApprovedLeave_whenMotifNull_safeReturnsEmpty() throws Exception {
        ReflectionTestUtils.setField(syncService, "accessToken", "pre-shared-token");
        Conge conge = buildConge(true, true);
        conge.setMotif(null);
        stubTransport();

        syncService.syncApprovedLeave(conge);

        String body = requestBody(sentRequests.get(0));
        assertThat(body).contains("- Motif: ");
    }

    @Test
    @DisplayName("sign() → Cle privee RSA invalide lance IOException")
    void sign_withInvalidKey_throwsIOException() throws Exception {
        Method method = GoogleCalendarLeaveSyncService.class.getDeclaredMethod("sign", byte[].class, PrivateKey.class);
        method.setAccessible(true);

        assertThatThrownBy(() -> method.invoke(syncService, "data".getBytes(StandardCharsets.UTF_8), mock(PrivateKey.class)))
            .hasCauseInstanceOf(IOException.class);
    }

    @Test
    @DisplayName("syncApprovedLeave() → CalendarEventId vide ne supprime pas l'ancien evenement")
    void syncApprovedLeave_calendarEventIdBlank_noDeleteBeforeCreate() throws Exception {
        ReflectionTestUtils.setField(syncService, "accessToken", "pre-shared-token");
        Conge conge = buildConge(true, true);
        conge.setCalendarEventId("   ");
        stubTransport();

        Optional<String> result = syncService.syncApprovedLeave(conge);

        assertThat(result).contains("evt-1");
        assertThat(sentRequests).hasSize(1);
        assertThat(sentRequests.get(0).method()).isEqualTo("POST");
    }

    @Test
    @DisplayName("syncApprovedLeave() → CalendarId null retourne empty")
    void syncApprovedLeave_calendarIdNull_returnsEmpty() {
        ReflectionTestUtils.setField(syncService, "calendarId", null);

        assertThat(syncService.syncApprovedLeave(buildConge(true, true))).isEmpty();
        verifyNoInteractions(httpClient);
    }

    @Test
    @DisplayName("syncApprovedLeave() → AccessToken null utilise le flux service account")
    void syncApprovedLeave_accessTokenNull_usesServiceAccountFlow() throws Exception {
        ReflectionTestUtils.setField(syncService, "accessToken", null);
        stubTransport();

        Optional<String> result = syncService.syncApprovedLeave(buildConge(true, true));

        assertThat(result).contains("evt-1");
        assertThat(sentRequests.stream().anyMatch(r -> r.uri().toString().contains("/token"))).isTrue();
    }

    @Test
    @DisplayName("syncApprovedLeave() → Credentials JSON null utilise les champs")
    void syncApprovedLeave_credentialsJsonNull_usesFieldCredentials() throws Exception {
        ReflectionTestUtils.setField(syncService, "serviceAccountCredentialsJson", null);
        stubTransport();

        assertThat(syncService.syncApprovedLeave(buildConge(true, true))).contains("evt-1");
    }

    @Test
    @DisplayName("syncApprovedLeave() → Cle privee manquante retourne empty")
    void syncApprovedLeave_serviceAccountPrivateKeyNull_returnsEmpty() {
        ReflectionTestUtils.setField(syncService, "serviceAccountCredentialsJson", "");
        ReflectionTestUtils.setField(syncService, "serviceAccountPrivateKey", null);

        assertThat(syncService.syncApprovedLeave(buildConge(true, true))).isEmpty();
    }

    @Test
    @DisplayName("syncApprovedLeave() → Email manquant retourne empty")
    void syncApprovedLeave_serviceAccountEmailNull_returnsEmpty() {
        ReflectionTestUtils.setField(syncService, "serviceAccountCredentialsJson", "");
        ReflectionTestUtils.setField(syncService, "serviceAccountEmail", null);

        assertThat(syncService.syncApprovedLeave(buildConge(true, true))).isEmpty();
    }

    @Test
    @DisplayName("syncApprovedLeave() → Cle privee vide retourne empty")
    void syncApprovedLeave_serviceAccountPrivateKeyBlank_returnsEmpty() {
        ReflectionTestUtils.setField(syncService, "serviceAccountCredentialsJson", "");
        ReflectionTestUtils.setField(syncService, "serviceAccountPrivateKey", "  ");

        assertThat(syncService.syncApprovedLeave(buildConge(true, true))).isEmpty();
    }

    @Test
    @DisplayName("deleteLeaveEvent() → Statut HTTP inferieur a 200 est ignore")
    void deleteLeaveEvent_statusBelow200_ignored() throws Exception {
        ReflectionTestUtils.setField(syncService, "accessToken", "pre-shared-token");
        Conge conge = buildConge(true, true);
        conge.setCalendarEventId("evt-42");
        when(httpClient.send(any(HttpRequest.class), any()))
            .thenAnswer(inv -> httpResponse(100, ""));

        assertThatNoException().isThrownBy(() -> syncService.deleteLeaveEvent(conge));
    }

    @Test
    @DisplayName("syncApprovedLeave() → Manager avec id null construit metadonnees vides")
    void syncApprovedLeave_managerWithNullId_buildsEmptyMetadata() throws Exception {
        ReflectionTestUtils.setField(syncService, "accessToken", "pre-shared-token");
        Conge conge = buildConge(true, true);
        conge.getManager().setId(null);
        stubTransport();

        syncService.syncApprovedLeave(conge);

        String body = requestBody(sentRequests.get(0));
        assertThat(body).contains("\"managerId\":\"\"");
    }

    @Test
    @DisplayName("syncApprovedLeave() → Chauffeur avec id null construit metadonnees vides")
    void syncApprovedLeave_chauffeurWithNullId_buildsEmptyMetadata() throws Exception {
        ReflectionTestUtils.setField(syncService, "accessToken", "pre-shared-token");
        Conge conge = buildConge(true, true);
        conge.getChauffeur().setId(null);
        stubTransport();

        syncService.syncApprovedLeave(conge);

        String body = requestBody(sentRequests.get(0));
        assertThat(body).contains("\"driverId\":\"\"");
    }

    @Test
    @DisplayName("syncApprovedLeave() → Token en cache expire demande un nouveau token")
    void syncApprovedLeave_cachedTokenExpired_requestsNewToken() throws Exception {
        stubTransport();

        syncService.syncApprovedLeave(buildConge(true, true));

        Class<?> cachedTokenClass = Class.forName("com.logiway.services.impl.GoogleCalendarLeaveSyncService$CachedToken");
        var constructor = cachedTokenClass.getDeclaredConstructor(String.class, long.class);
        constructor.setAccessible(true);
        Object expiredToken = constructor.newInstance("old-token", 1L);

        AtomicReference<Object> cachedRef = (AtomicReference<Object>) ReflectionTestUtils.getField(syncService, "cachedTokenRef");
        cachedRef.set(expiredToken);

        when(httpClient.send(any(HttpRequest.class), any())).thenAnswer(inv -> {
            HttpRequest request = inv.getArgument(0);
            sentRequests.add(request);
            if (request.uri().toString().contains("/token")) {
                return httpResponse(200, "{\"access_token\":\"new-tok\",\"expires_in\":3600}");
            }
            if ("DELETE".equals(request.method())) {
                return httpResponse(204, "");
            }
            return httpResponse(200, "{\"id\":\"evt-2\"}");
        });

        Optional<String> result = syncService.syncApprovedLeave(buildConge(true, true));

        assertThat(result).contains("evt-2");
    }

    @Test
    @DisplayName("syncApprovedLeave() → Statut HTTP inferieur a 200 pour token retourne empty")
    void syncApprovedLeave_tokenEndpointStatusBelow200_returnsEmpty() throws Exception {
        when(httpClient.send(any(HttpRequest.class), any()))
            .thenAnswer(inv -> httpResponse(100, ""));

        assertThat(syncService.syncApprovedLeave(buildConge(true, true))).isEmpty();
    }

    @Test
    @DisplayName("syncApprovedLeave() → DelegatedUser null genere JWT sans claim sub")
    void syncApprovedLeave_delegatedUserNull_jwtWithoutSub() throws Exception {
        ReflectionTestUtils.setField(syncService, "delegatedUser", null);
        stubTransport();

        Optional<String> result = syncService.syncApprovedLeave(buildConge(true, true));

        assertThat(result).contains("evt-1");
    }

    @Test
    @DisplayName("syncApprovedLeave() → JSON credentials avec email vide retombe sur les champs")
    void syncApprovedLeave_credentialsJsonBlankEmail_fallsBackToFields() throws Exception {
        ReflectionTestUtils.setField(syncService, "serviceAccountCredentialsJson",
            "{\"client_email\":\"\",\"private_key\":\"" + TEST_PRIVATE_KEY + "\"}");
        stubTransport();

        assertThat(syncService.syncApprovedLeave(buildConge(true, true))).contains("evt-1");
    }

    @Test
    @DisplayName("syncApprovedLeave() → Statut HTTP 201 pour creation est accepte")
    void syncApprovedLeave_createEventStatus201_accepted() throws Exception {
        ReflectionTestUtils.setField(syncService, "accessToken", "pre-shared-token");
        when(httpClient.send(any(HttpRequest.class), any()))
            .thenAnswer(inv -> {
                HttpRequest request = inv.getArgument(0);
                if (request.uri().toString().contains("/events") && "POST".equals(request.method())) {
                    return httpResponse(201, "{\"id\":\"evt-201\"}");
                }
                return httpResponse(204, "");
            });

        Optional<String> result = syncService.syncApprovedLeave(buildConge(true, true));

        assertThat(result).contains("evt-201");
    }

    @Test
    @DisplayName("syncApprovedLeave() → Statut HTTP inferieur a 200 pour creation retourne empty")
    void syncApprovedLeave_createEventStatusBelow200_returnsEmpty() throws Exception {
        ReflectionTestUtils.setField(syncService, "accessToken", "pre-shared-token");
        when(httpClient.send(any(HttpRequest.class), any()))
            .thenAnswer(inv -> httpResponse(100, ""));

        assertThat(syncService.syncApprovedLeave(buildConge(true, true))).isEmpty();
    }

    @Test
    @DisplayName("syncApprovedLeave() → Credentials JSON avec cle vide retombe sur les champs")
    void syncApprovedLeave_credentialsJsonBlankKey_fallsBackToFields() throws Exception {
        ReflectionTestUtils.setField(syncService, "serviceAccountCredentialsJson",
            "{\"client_email\":\"test@example.com\",\"private_key\":\"\"}");
        stubTransport();

        assertThat(syncService.syncApprovedLeave(buildConge(true, true))).contains("evt-1");
    }

    @Test
    @DisplayName("syncApprovedLeave() → Email non vide mais cle vide dans les champs retourne empty")
    void syncApprovedLeave_emailPresentButKeyBlank_returnsEmpty() {
        ReflectionTestUtils.setField(syncService, "serviceAccountCredentialsJson",
            "{\"client_email\":\"\",\"private_key\":\"\"}");
        ReflectionTestUtils.setField(syncService, "serviceAccountPrivateKey", "");

        assertThat(syncService.syncApprovedLeave(buildConge(true, true))).isEmpty();
    }
}
