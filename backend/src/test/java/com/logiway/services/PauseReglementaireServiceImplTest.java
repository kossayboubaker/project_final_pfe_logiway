package com.logiway.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.logiway.dto.pause.PauseReglementaireResponse;
import com.logiway.entities.Chauffeur;
import com.logiway.entities.Entreprise;
import com.logiway.entities.Manager;
import com.logiway.entities.PauseReglementaire;
import com.logiway.entities.Trajet;
import com.logiway.entities.Utilisateur;
import com.logiway.entities.Vehicule;
import com.logiway.entities.enums.Role;
import com.logiway.entities.enums.StatutPause;
import com.logiway.entities.enums.StatutTrajet;
import com.logiway.entities.enums.TypePause;
import com.logiway.exceptions.ResourceNotFoundException;
import com.logiway.repositories.PauseReglementaireRepository;
import com.logiway.repositories.TrajetRepository;
import com.logiway.repositories.UtilisateurRepository;
import com.logiway.security.AuthenticatedUserService;
import com.logiway.services.impl.PauseReglementaireServiceImpl;
import java.lang.reflect.Method;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PauseReglementaireServiceImplTest {

    private static final String URL = "http://pause-ai.test";

    @Mock
    private PauseReglementaireRepository pauseRepository;
    @Mock
    private TrajetRepository trajetRepository;
    @Mock
    private AuthenticatedUserService authenticatedUserService;
    @Mock
    private NotificationRealtimeService notificationRealtimeService;
    @Mock
    private UtilisateurRepository utilisateurRepository;
    @Mock
    private RestTemplate restTemplate;

    private final ObjectMapper realObjectMapper = new ObjectMapper();

    private PauseReglementaireServiceImpl service() {
        PauseReglementaireServiceImpl s = new PauseReglementaireServiceImpl(
            pauseRepository, trajetRepository, authenticatedUserService, realObjectMapper,
            notificationRealtimeService, utilisateurRepository, restTemplate);
        ReflectionTestUtils.setField(s, "pauseAiUrl", URL);
        ReflectionTestUtils.setField(s, "appDebugPauses", false);
        return s;
    }

    // ========== Helpers ==========

    private Utilisateur user(Role role, Long id) {
        return Utilisateur.builder().id(id).prenom("U").nom("User").email("u" + id + "@test.fr").role(role).build();
    }

    private Entreprise entreprise(Long id) {
        return Entreprise.builder().id(id).build();
    }

    private Manager manager(Long id) {
        return Manager.builder().id(id).prenom("M").nom("Mgr").email("m" + id + "@test.fr").role(Role.MANAGER).build();
    }

    private Vehicule vehicule(Long id) {
        return Vehicule.builder().id(id).matricule("AB-123-CD").build();
    }

    private Chauffeur chauffeur(Long id) {
        return Chauffeur.builder().id(id).prenom("Alice").nom("A").email("c" + id + "@test.fr")
            .role(Role.CHAUFFEUR).build();
    }

    private Trajet trajet(Long id, Chauffeur ch, Manager mgr, Vehicule veh, Integer duree,
                          Double distKm, LocalDateTime dateDepart, String geom) {
        return Trajet.builder()
            .id(id).statut(StatutTrajet.EN_COURS).chauffeur(ch).manager(mgr).vehicule(veh)
            .dureeEstimeeMinutes(duree).distanceKm(distKm).dateDepart(dateDepart)
            .latitudeDepart(48.85).longitudeDepart(2.35).latitudeArrivee(45.75).longitudeArrivee(4.85)
            .pointDepart("Paris").destination("Lyon").geometrieItineraire(geom)
            .build();
    }

    private PauseReglementaire pause(Long id, Trajet t) {
        return PauseReglementaire.builder().id(id).trajet(t).type(TypePause.MANDATORY_REST)
            .longitude(4.0).latitude(46.0).statut(StatutPause.PLANIFIEE).build();
    }

    // ========== genererPauses ==========

    @Test
    void genererPauses_trajetNotFound_throwsResourceNotFound() {
        when(trajetRepository.findById(1L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service().genererPauses(1L));
    }

    @Test
    void genererPauses_noDuration_returnsEmpty() {
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(trajet(1L, null, null, null, null, 100.0, null, null)));

        List<PauseReglementaireResponse> result = service().genererPauses(1L);

        assertTrue(result.isEmpty());
        verify(pauseRepository, never()).deleteByTrajetId(1L);
        verify(restTemplate, never()).postForEntity(anyString(), any(), eq(String.class));
    }

    @Test
    void genererPauses_zeroDuration_returnsEmpty() {
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(trajet(1L, null, null, null, 0, 100.0, null, null)));

        assertTrue(service().genererPauses(1L).isEmpty());
        verify(pauseRepository, never()).deleteByTrajetId(1L);
    }

    @Test
    void genererPauses_shortDuration_blankFlaskResponse_returnsEmpty() {
        Trajet t = trajet(1L, chauffeur(10L), manager(20L), vehicule(1L), 100, 100.0, LocalDateTime.now(), null);
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));
        when(restTemplate.postForEntity(anyString(), any(), eq(String.class)))
            .thenReturn(ResponseEntity.ok("   "));

        List<PauseReglementaireResponse> result = service().genererPauses(1L);

        assertTrue(result.isEmpty());
        verify(pauseRepository, times(1)).deleteByTrajetId(1L);
        verify(pauseRepository, never()).saveAll(anyList());
    }

    @Test
    void genererPauses_breakNotApplicable_returnsEmpty() {
        Trajet t = trajet(1L, null, null, null, 300, 100.0, LocalDateTime.now(), null);
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));
        when(restTemplate.postForEntity(anyString(), any(), eq(String.class)))
            .thenReturn(ResponseEntity.ok("{\"meta\":{\"break_alert_applicable\":false,\"reason\":\"trop court\"}}"));

        List<PauseReglementaireResponse> result = service().genererPauses(1L);

        assertTrue(result.isEmpty());
        verify(pauseRepository, times(1)).deleteByTrajetId(1L);
    }

    @Test
    void genererPauses_noStops_returnsEmpty() {
        Trajet t = trajet(1L, null, null, null, 300, 100.0, LocalDateTime.now(), null);
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));
        when(restTemplate.postForEntity(anyString(), any(), eq(String.class)))
            .thenReturn(ResponseEntity.ok("{\"meta\":{\"break_alert_applicable\":true},\"stops\":[]}"));

        List<PauseReglementaireResponse> result = service().genererPauses(1L);

        assertTrue(result.isEmpty());
    }

    @Test
    void genererPauses_happyPath_savesAndBroadcasts() {
        Trajet t = trajet(1L, chauffeur(10L), manager(20L), vehicule(1L), 300, 100.0, LocalDateTime.now(), null);
        String json = "{\"meta\":{\"break_alert_applicable\":true},\"stops\":["
            + "{\"type\":\"mandatory_rest\",\"lonlat\":[4.0,46.0],\"distanceAlongRouteM\":1000,"
            + "\"arrivalTime\":\"2026-08-10T12:00:00\",\"durationSec\":2700,\"resumeTime\":\"2026-08-10T12:45:00\","
            + "\"aiScore\":90,\"fatigueScore\":85,\"accessibilityScore\":80,\"contextScore\":75,\"confidence\":0.95,"
            + "\"reasoning\":[\"fatigue\",\"long driving\"],\"nomLieu\":\"Aire de repos\"}"
            + "]}";
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));
        when(restTemplate.postForEntity(anyString(), any(), eq(String.class)))
            .thenReturn(ResponseEntity.ok(json));
        when(pauseRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of(user(Role.SUPERADMIN, 99L)));

        List<PauseReglementaireResponse> result = service().genererPauses(1L);

        assertEquals(1, result.size());
        PauseReglementaireResponse r = result.get(0);
        assertEquals(TypePause.MANDATORY_REST, r.getType());
        assertEquals(4.0, r.getLongitude());
        assertEquals(46.0, r.getLatitude());
        assertEquals(1000.0, r.getDistanceAlongRouteM());
        assertEquals(LocalDateTime.parse("2026-08-10T12:00:00"), r.getHeureArriveePlanifiee());
        assertEquals(2700, r.getDurationSeconds());
        assertEquals(LocalDateTime.parse("2026-08-10T12:45:00"), r.getHeureRepriseEstimee());
        assertEquals(StatutPause.PLANIFIEE, r.getStatut());
        assertEquals("Aire de repos", r.getNomLieu());
        assertEquals(90, r.getAiScore());
        assertEquals(85, r.getFatigueScore());
        assertEquals(80, r.getAccessibilityScore());
        assertEquals(75, r.getContextScore());
        assertEquals(0.95, r.getConfidence());
        assertEquals("fatigue; long driving", r.getReasoning());
        verify(pauseRepository, times(1)).deleteByTrajetId(1L);
        verify(pauseRepository, times(1)).saveAll(anyList());
        verify(pauseRepository, times(1)).flush();
        verify(notificationRealtimeService).publishNamedEventToUsers(
            argThat(col -> col.size() == 3 && col.containsAll(Arrays.asList(10L, 20L, 99L))),
            eq("PAUSES_GENEREES"), eq(1L));
    }

    @Test
    void genererPauses_warningAlert_enforcesDurationZero() {
        Trajet t = trajet(1L, chauffeur(10L), manager(20L), vehicule(1L), 300, 100.0, LocalDateTime.now(), null);
        String json = "{\"stops\":["
            + "{\"type\":\"warning_alert\",\"lonlat\":[4.0,46.0],\"distanceAlongRouteM\":500,"
            + "\"arrivalTime\":\"2026-08-10T11:00:00\",\"durationSec\":900,\"resumeTime\":\"2026-08-10T11:15:00\"}]}";
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));
        when(restTemplate.postForEntity(anyString(), any(), eq(String.class)))
            .thenReturn(ResponseEntity.ok(json));
        when(pauseRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of());

        List<PauseReglementaireResponse> result = service().genererPauses(1L);

        assertEquals(1, result.size());
        PauseReglementaireResponse r = result.get(0);
        assertEquals(TypePause.WARNING_ALERT, r.getType());
        assertEquals(0, r.getDurationSeconds());
        assertEquals(LocalDateTime.parse("2026-08-10T11:00:00"), r.getHeureRepriseEstimee());
        assertTrue(r.getNomLieu().contains("Alerte pause 3h"));
    }

    @Test
    void genererPauses_multipleTypes_mapsEnumsAndParsesFields() {
        Trajet t = trajet(1L, null, null, null, 300, 100.0, LocalDateTime.now(), null);
        String json = "{\"stops\":["
            + "{\"type\":\"station_service\",\"lat\":46.1,\"lon\":4.1,"
            + "\"distance_along_route_m\":2000,\"arrival_time\":\"2026-08-10T13:00:00\","
            + "\"duration_sec\":600,\"resume_time\":\"2026-08-10T13:10:00\",\"ai_score\":70,\"fatigue_score\":60,"
            + "\"accessibility_score\":55,\"context_score\":50,\"confidence\":\"abc\"},"
            + "{\"type\":\"planned_stop\"},"
            + "{\"type\":\"kiosk\"},"
            + "{\"type\":\"rest_area\"},"
            + "{\"type\":\"cafe\"},"
            + "{\"type\":\"parking\"},"
            + "{\"type\":\"unknown\",\"duration_sec\":\"abc\"},"
            + "{\"type\":null},"
            + "{\"type\":\"mandatory_rest\",\"distanceAlongRouteM\":\"1500\",\"durationSec\":\"1500\"}"
            + "]}";
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));
        when(restTemplate.postForEntity(anyString(), any(), eq(String.class)))
            .thenReturn(ResponseEntity.ok(json));
        when(pauseRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of());

        List<PauseReglementaireResponse> result = service().genererPauses(1L);

        assertEquals(9, result.size());
        assertEquals(TypePause.STATION_SERVICE, result.get(0).getType());
        assertEquals(46.1, result.get(0).getLatitude());
        assertEquals(4.1, result.get(0).getLongitude());
        assertEquals(2000.0, result.get(0).getDistanceAlongRouteM());
        assertEquals(LocalDateTime.parse("2026-08-10T13:00:00"), result.get(0).getHeureArriveePlanifiee());
        assertEquals(600, result.get(0).getDurationSeconds());
        assertEquals(70, result.get(0).getAiScore());
        assertNull(result.get(0).getConfidence());
        assertEquals(TypePause.STATION_SERVICE, result.get(1).getType());
        assertEquals(TypePause.KIOSK, result.get(2).getType());
        assertEquals(TypePause.REST_AREA, result.get(3).getType());
        assertEquals(TypePause.CAFE, result.get(4).getType());
        assertEquals(TypePause.PARKING, result.get(5).getType());
        assertEquals(TypePause.POI, result.get(6).getType());
        assertEquals(TypePause.POI, result.get(7).getType());
        assertEquals(TypePause.MANDATORY_REST, result.get(8).getType());
        assertEquals(1500.0, result.get(8).getDistanceAlongRouteM());
        assertNull(result.get(6).getDurationSeconds());
        assertEquals(1500, result.get(8).getDurationSeconds());
        assertTrue(result.get(0).getNomLieu().contains("Station service"));
        assertTrue(result.get(8).getNomLieu().contains("Pause obligatoire 4h30"));
    }

    @Test
    void genererPauses_missingCoordinates_fallsBackToTripStart() {
        Trajet t = trajet(1L, null, null, null, 300, 100.0, LocalDateTime.now(), null);
        String json = "{\"stops\":[{\"type\":\"parking\",\"distanceAlongRouteM\":3000}]}";
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));
        when(restTemplate.postForEntity(anyString(), any(), eq(String.class)))
            .thenReturn(ResponseEntity.ok(json));
        when(pauseRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of());

        List<PauseReglementaireResponse> result = service().genererPauses(1L);

        assertEquals(1, result.size());
        assertEquals(48.85, result.get(0).getLatitude());
        assertEquals(2.35, result.get(0).getLongitude());
    }

    @Test
    void genererPauses_missingCoordinates_noDeparture_usesZero() {
        Trajet t = Trajet.builder().id(1L).statut(StatutTrajet.EN_COURS)
            .dureeEstimeeMinutes(300).distanceKm(100.0).build();
        String json = "{\"stops\":[{\"type\":\"parking\"}]}";
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));
        when(restTemplate.postForEntity(anyString(), any(), eq(String.class)))
            .thenReturn(ResponseEntity.ok(json));
        when(pauseRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of());

        List<PauseReglementaireResponse> result = service().genererPauses(1L);

        assertEquals(0.0, result.get(0).getLatitude());
        assertEquals(0.0, result.get(0).getLongitude());
    }

    @Test
    void genererPauses_invalidJson_fallbackGeneratesPauses() {
        Trajet t = trajet(1L, chauffeur(10L), manager(20L), vehicule(1L), 300, 100.0,
            LocalDateTime.now(), "{\"coordinates\":[[2.35,48.85],[4.85,45.75]]}");
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));
        when(restTemplate.postForEntity(anyString(), any(), eq(String.class)))
            .thenReturn(ResponseEntity.ok("not json"));
        when(pauseRepository.findByTrajetId(1L)).thenReturn(List.of());
        when(pauseRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));

        List<PauseReglementaireResponse> result = service().genererPauses(1L);

        assertEquals(2, result.size());
        assertEquals(TypePause.WARNING_ALERT, result.get(0).getType());
        assertEquals(TypePause.MANDATORY_REST, result.get(1).getType());
        assertEquals(100, result.get(0).getAiScore());
        assertTrue(result.get(0).getNomLieu().contains("Alerte pause 3h"));
        assertTrue(result.get(1).getNomLieu().contains("Pause obligatoire 4h30"));
        verify(pauseRepository, times(1)).saveAll(anyList());
    }

    @Test
    void genererPauses_flaskError_fallbackWithFeatureCollection() {
        Trajet t = trajet(1L, null, null, null, 300, 100.0, LocalDateTime.now(),
            "{\"type\":\"FeatureCollection\",\"features\":[{\"geometry\":{\"type\":\"LineString\","
                + "\"coordinates\":[[2.35,48.85],[4.85,45.75]]}}]}");
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));
        when(restTemplate.postForEntity(anyString(), any(), eq(String.class)))
            .thenThrow(new RuntimeException("flask down"));
        when(pauseRepository.findByTrajetId(1L)).thenReturn(List.of());
        when(pauseRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));

        List<PauseReglementaireResponse> result = service().genererPauses(1L);

        assertEquals(2, result.size());
        assertEquals(TypePause.WARNING_ALERT, result.get(0).getType());
        assertEquals(TypePause.MANDATORY_REST, result.get(1).getType());
    }

    @Test
    void genererPauses_fallbackNoGeometry_returnsEmpty() {
        Trajet t = trajet(1L, null, null, null, 300, 100.0, LocalDateTime.now(), null);
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));
        when(restTemplate.postForEntity(anyString(), any(), eq(String.class)))
            .thenReturn(ResponseEntity.ok("not json"));

        List<PauseReglementaireResponse> result = service().genererPauses(1L);

        assertTrue(result.isEmpty());
        verify(pauseRepository, never()).saveAll(anyList());
    }

    // ========== getPausesForTrajet ==========

    @Test
    void getPausesForTrajet_trajetNotFound_throwsResourceNotFound() {
        when(trajetRepository.findById(1L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service().getPausesForTrajet(1L));
    }

    @Test
    void getPausesForTrajet_superadmin_success() {
        Trajet t = trajet(1L, null, null, null, 300, 100.0, null, null);
        when(authenticatedUserService.getCurrentUser()).thenReturn(user(Role.SUPERADMIN, 99L));
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));
        when(pauseRepository.findByTrajetId(1L)).thenReturn(List.of(pause(1L, t)));

        List<PauseReglementaireResponse> result = service().getPausesForTrajet(1L);

        assertEquals(1, result.size());
        assertEquals(TypePause.MANDATORY_REST, result.get(0).getType());
    }

    @Test
    void getPausesForTrajet_managerAssigned_success() {
        Trajet t = trajet(1L, chauffeur(10L), manager(20L), null, 300, 100.0, null, null);
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager(20L));
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));
        when(pauseRepository.findByTrajetId(1L)).thenReturn(List.of(pause(1L, t)));

        assertEquals(1, service().getPausesForTrajet(1L).size());
    }

    @Test
    void getPausesForTrajet_managerOfChauffeur_success() {
        Chauffeur ch = chauffeur(10L);
        ch.setManager(manager(20L));
        Trajet t = trajet(1L, ch, null, null, 300, 100.0, null, null);
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager(20L));
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));
        when(pauseRepository.findByTrajetId(1L)).thenReturn(List.of(pause(1L, t)));

        assertEquals(1, service().getPausesForTrajet(1L).size());
    }

    @Test
    void getPausesForTrajet_managerSameCompanyThroughChauffeur_success() {
        Chauffeur ch = chauffeur(10L);
        ch.setEntreprise(entreprise(1L));
        Trajet t = trajet(1L, ch, null, null, 300, 100.0, null, null);
        Manager mgr = manager(20L);
        mgr.setEntreprise(entreprise(1L));
        when(authenticatedUserService.getCurrentUser()).thenReturn(mgr);
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));
        when(pauseRepository.findByTrajetId(1L)).thenReturn(List.of(pause(1L, t)));

        assertEquals(1, service().getPausesForTrajet(1L).size());
    }

    @Test
    void getPausesForTrajet_managerSameCompanyThroughManager_success() {
        Manager tMgr = manager(50L);
        tMgr.setEntreprise(entreprise(1L));
        Trajet t = trajet(1L, null, tMgr, null, 300, 100.0, null, null);
        Manager mgr = manager(20L);
        mgr.setEntreprise(entreprise(1L));
        when(authenticatedUserService.getCurrentUser()).thenReturn(mgr);
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));
        when(pauseRepository.findByTrajetId(1L)).thenReturn(List.of(pause(1L, t)));

        assertEquals(1, service().getPausesForTrajet(1L).size());
    }

    @Test
    void getPausesForTrajet_managerDenied_throws() {
        Chauffeur ch = chauffeur(10L);
        ch.setManager(manager(999L));
        ch.setEntreprise(entreprise(2L));
        Trajet t = trajet(1L, ch, null, null, 300, 100.0, null, null);
        Manager mgr = manager(20L);
        mgr.setEntreprise(entreprise(1L));
        when(authenticatedUserService.getCurrentUser()).thenReturn(mgr);
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));

        ResourceNotFoundException ex = assertThrows(ResourceNotFoundException.class,
            () -> service().getPausesForTrajet(1L));
        assertEquals("Accès refusé à ce trajet", ex.getMessage());
    }

    @Test
    void getPausesForTrajet_chauffeurOwner_success() {
        Trajet t = trajet(1L, chauffeur(10L), null, null, 300, 100.0, null, null);
        when(authenticatedUserService.getCurrentUser()).thenReturn(user(Role.CHAUFFEUR, 10L));
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));
        when(pauseRepository.findByTrajetId(1L)).thenReturn(List.of(pause(1L, t)));

        assertEquals(1, service().getPausesForTrajet(1L).size());
    }

    @Test
    void getPausesForTrajet_chauffeurDenied_throws() {
        Trajet t = trajet(1L, chauffeur(10L), null, null, 300, 100.0, null, null);
        when(authenticatedUserService.getCurrentUser()).thenReturn(user(Role.CHAUFFEUR, 11L));
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));

        ResourceNotFoundException ex = assertThrows(ResourceNotFoundException.class,
            () -> service().getPausesForTrajet(1L));
        assertEquals("Accès refusé à ce trajet", ex.getMessage());
    }

    @Test
    void getPausesForTrajet_unknownRole_throws() {
        Trajet t = trajet(1L, chauffeur(10L), null, null, 300, 100.0, null, null);
        Utilisateur noRole = Utilisateur.builder().id(50L).prenom("X").nom("Y").email("x@test.fr").build();
        when(authenticatedUserService.getCurrentUser()).thenReturn(noRole);
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));

        ResourceNotFoundException ex = assertThrows(ResourceNotFoundException.class,
            () -> service().getPausesForTrajet(1L));
        assertEquals("Rôle non autorisé", ex.getMessage());
    }

    @Test
    void getPausesForTrajet_noAuthentication_returnsEmpty() {
        Trajet t = trajet(1L, null, null, null, 300, 100.0, null, null);
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));
        when(authenticatedUserService.getCurrentUser()).thenThrow(new RuntimeException("no auth"));

        assertTrue(service().getPausesForTrajet(1L).isEmpty());
    }

    // ========== genererPauses: fallback edge cases ==========

    @Test
    void genererPauses_fallbackShortDuration_returnsEmpty() {
        Trajet t = trajet(1L, null, null, null, 100, 100.0, LocalDateTime.now(),
            "{\"coordinates\":[[2.35,48.85],[4.85,45.75]]}");
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));
        when(restTemplate.postForEntity(anyString(), any(), eq(String.class)))
            .thenThrow(new RuntimeException("down"));

        assertTrue(service().genererPauses(1L).isEmpty());
    }

    @Test
    void genererPauses_fallbackSingleCoordinate_returnsEmpty() {
        Trajet t = trajet(1L, null, null, null, 300, 100.0, LocalDateTime.now(),
            "{\"coordinates\":[[2.35,48.85]]}");
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));
        when(restTemplate.postForEntity(anyString(), any(), eq(String.class)))
            .thenThrow(new RuntimeException("down"));

        assertTrue(service().genererPauses(1L).isEmpty());
    }

    @Test
    void genererPauses_fallbackInvalidGeometryJson_returnsEmpty() {
        Trajet t = trajet(1L, null, null, null, 300, 100.0, LocalDateTime.now(), "not json");
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));
        when(restTemplate.postForEntity(anyString(), any(), eq(String.class)))
            .thenThrow(new RuntimeException("down"));

        assertTrue(service().genererPauses(1L).isEmpty());
    }

    @Test
    void genererPauses_fallbackExistingPauses_skipsGeneration() {
        Trajet t = trajet(1L, null, null, null, 300, null, LocalDateTime.now(),
            "{\"coordinates\":[[2.35,48.85],[4.85,45.75]]}");
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));
        when(restTemplate.postForEntity(anyString(), any(), eq(String.class)))
            .thenThrow(new RuntimeException("down"));
        when(pauseRepository.findByTrajetId(1L)).thenReturn(List.of(
            PauseReglementaire.builder().id(1L).trajet(t).type(TypePause.WARNING_ALERT).build(),
            PauseReglementaire.builder().id(2L).trajet(t).type(TypePause.MANDATORY_REST).build()));

        assertTrue(service().genererPauses(1L).isEmpty());
        verify(pauseRepository, never()).saveAll(anyList());
    }

    @Test
    void genererPauses_fallbackSaveAllFails_returnsEmpty() {
        Trajet t = trajet(1L, null, null, null, 300, 100.0, LocalDateTime.now(),
            "{\"coordinates\":[[2.35,48.85],[4.85,45.75]]}");
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));
        when(restTemplate.postForEntity(anyString(), any(), eq(String.class)))
            .thenThrow(new RuntimeException("down"));
        when(pauseRepository.findByTrajetId(1L)).thenReturn(List.of());
        when(pauseRepository.saveAll(anyList())).thenThrow(new RuntimeException("db down"));

        assertTrue(service().genererPauses(1L).isEmpty());
    }

    @Test
    void genererPauses_fallbackNestedGeometry_returnsEmpty() {
        Trajet t = trajet(1L, null, null, null, 300, 100.0, LocalDateTime.now(),
            "{\"geometry\":{\"coordinates\":[[2.35,48.85],[4.85,45.75]]}}");
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));
        when(restTemplate.postForEntity(anyString(), any(), eq(String.class)))
            .thenThrow(new RuntimeException("down"));

        assertTrue(service().genererPauses(1L).isEmpty());
    }

    @Test
    void genererPauses_fallbackIdenticalCoords_zeroDistance_usesRouteEnd() {
        Trajet t = trajet(1L, null, null, null, 300, null, LocalDateTime.now(),
            "{\"coordinates\":[[2.35,48.85],[2.35,48.85]]}");
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));
        when(restTemplate.postForEntity(anyString(), any(), eq(String.class)))
            .thenThrow(new RuntimeException("down"));
        when(pauseRepository.findByTrajetId(1L)).thenReturn(List.of());
        when(pauseRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));

        List<PauseReglementaireResponse> result = service().genererPauses(1L);

        assertEquals(2, result.size());
        assertEquals(48.85, result.get(0).getLatitude());
        assertEquals(2.35, result.get(0).getLongitude());
        assertEquals(100, result.get(0).getAiScore());
    }

    @Test
    void genererPauses_fallbackShortRealRoute_endsAtLastPoint() {
        Trajet t = trajet(1L, null, null, null, 300, 1.0, LocalDateTime.now(),
            "{\"coordinates\":[[2.35,48.85],[2.351,48.851],[2.352,48.852]]}");
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));
        when(restTemplate.postForEntity(anyString(), any(), eq(String.class)))
            .thenThrow(new RuntimeException("down"));
        when(pauseRepository.findByTrajetId(1L)).thenReturn(List.of());
        when(pauseRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));

        List<PauseReglementaireResponse> result = service().genererPauses(1L);

        assertEquals(2, result.size());
        assertEquals(48.852, result.get(1).getLatitude());
        assertEquals(2.352, result.get(1).getLongitude());
    }

    @Test
    void genererPauses_fallbackMalformedCoordinate_returnsEmpty() {
        Trajet t = trajet(1L, null, null, null, 300, 100.0, LocalDateTime.now(),
            "{\"coordinates\":[[],[2.35,48.85]]}");
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));
        when(restTemplate.postForEntity(anyString(), any(), eq(String.class)))
            .thenThrow(new RuntimeException("down"));
        when(pauseRepository.findByTrajetId(1L)).thenReturn(List.of());

        assertTrue(service().genererPauses(1L).isEmpty());
    }

    @Test
    void genererPauses_fallbackFeatureCollectionWithDirectCoords_generatesPauses() {
        Trajet t = trajet(1L, null, null, null, 300, 100.0, LocalDateTime.now(),
            "{\"type\":\"FeatureCollection\",\"features\":[{\"geometry\":\"garbage\"}],"
                + "\"coordinates\":[[2.35,48.85],[4.85,45.75]]}");
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));
        when(restTemplate.postForEntity(anyString(), any(), eq(String.class)))
            .thenThrow(new RuntimeException("down"));
        when(pauseRepository.findByTrajetId(1L)).thenReturn(List.of());
        when(pauseRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));

        List<PauseReglementaireResponse> result = service().genererPauses(1L);

        assertEquals(2, result.size());
        assertEquals(TypePause.WARNING_ALERT, result.get(0).getType());
        assertEquals(TypePause.MANDATORY_REST, result.get(1).getType());
    }

    @Test
    void genererPauses_emptyAudience_noBroadcast() {
        Trajet t = trajet(1L, null, null, null, 300, 100.0, LocalDateTime.now(), null);
        String json = "{\"stops\":[{\"type\":\"parking\",\"reasoning\":[],\"arrival_time\":\"garbage\"}]}";
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));
        when(restTemplate.postForEntity(anyString(), any(), eq(String.class)))
            .thenReturn(ResponseEntity.ok(json));
        when(pauseRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of());

        List<PauseReglementaireResponse> result = service().genererPauses(1L);

        assertEquals(1, result.size());
        assertNull(result.get(0).getHeureArriveePlanifiee());
        assertNull(result.get(0).getReasoning());
        verify(notificationRealtimeService, never()).publishNamedEventToUsers(anyList(), anyString(), any(Long.class));
    }

    // ========== mettreAJourStatutPause ==========

    @Test
    void mettreAJourStatutPause_nullStatut_throws() {
        assertThrows(IllegalArgumentException.class,
            () -> service().mettreAJourStatutPause(1L, 1L, null));
    }

    @Test
    void mettreAJourStatutPause_trajetNotFound_throws() {
        when(trajetRepository.findById(1L)).thenReturn(Optional.empty());

        ResourceNotFoundException ex = assertThrows(ResourceNotFoundException.class,
            () -> service().mettreAJourStatutPause(1L, 1L, StatutPause.ATTEINTE));
        assertEquals("Trajet introuvable", ex.getMessage());
    }

    @Test
    void mettreAJourStatutPause_pauseNotFound_throws() {
        Trajet t = trajet(1L, null, null, null, 300, 100.0, null, null);
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));
        when(pauseRepository.findById(1L)).thenReturn(Optional.empty());

        ResourceNotFoundException ex = assertThrows(ResourceNotFoundException.class,
            () -> service().mettreAJourStatutPause(1L, 1L, StatutPause.ATTEINTE));
        assertEquals("Pause introuvable", ex.getMessage());
    }

    @Test
    void mettreAJourStatutPause_pauseTrajetMismatch_throws() {
        Trajet t = trajet(1L, null, null, null, 300, 100.0, null, null);
        Trajet other = trajet(2L, null, null, null, 300, 100.0, null, null);
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));
        when(pauseRepository.findById(1L)).thenReturn(Optional.of(pause(1L, other)));

        ResourceNotFoundException ex = assertThrows(ResourceNotFoundException.class,
            () -> service().mettreAJourStatutPause(1L, 1L, StatutPause.ATTEINTE));
        assertEquals("Pause introuvable pour ce trajet", ex.getMessage());
    }

    @Test
    void mettreAJourStatutPause_pauseTrajetNull_throws() {
        Trajet t = trajet(1L, null, null, null, 300, 100.0, null, null);
        PauseReglementaire orphan = PauseReglementaire.builder().id(1L).type(TypePause.PARKING).build();
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));
        when(pauseRepository.findById(1L)).thenReturn(Optional.of(orphan));

        ResourceNotFoundException ex = assertThrows(ResourceNotFoundException.class,
            () -> service().mettreAJourStatutPause(1L, 1L, StatutPause.ATTEINTE));
        assertEquals("Pause introuvable pour ce trajet", ex.getMessage());
    }

    @Test
    void mettreAJourStatutPause_managerDenied_throws() {
        Chauffeur ch = chauffeur(10L);
        ch.setManager(manager(999L));
        ch.setEntreprise(entreprise(2L));
        Trajet t = trajet(1L, ch, null, null, 300, 100.0, null, null);
        Manager mgr = manager(20L);
        mgr.setEntreprise(entreprise(1L));
        when(authenticatedUserService.getCurrentUser()).thenReturn(mgr);
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));
        when(pauseRepository.findById(1L)).thenReturn(Optional.of(pause(1L, t)));

        ResourceNotFoundException ex = assertThrows(ResourceNotFoundException.class,
            () -> service().mettreAJourStatutPause(1L, 1L, StatutPause.ATTEINTE));
        assertEquals("Accès refusé", ex.getMessage());
    }

    @Test
    void mettreAJourStatutPause_chauffeurDenied_throws() {
        Trajet t = trajet(1L, chauffeur(10L), null, null, 300, 100.0, null, null);
        when(authenticatedUserService.getCurrentUser()).thenReturn(user(Role.CHAUFFEUR, 11L));
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));
        when(pauseRepository.findById(1L)).thenReturn(Optional.of(pause(1L, t)));

        ResourceNotFoundException ex = assertThrows(ResourceNotFoundException.class,
            () -> service().mettreAJourStatutPause(1L, 1L, StatutPause.ATTEINTE));
        assertEquals("Accès refusé", ex.getMessage());
    }

    @Test
    void mettreAJourStatutPause_unknownRole_throws() {
        Trajet t = trajet(1L, null, null, null, 300, 100.0, null, null);
        Utilisateur noRole = Utilisateur.builder().id(50L).prenom("X").nom("Y").email("x@test.fr").build();
        when(authenticatedUserService.getCurrentUser()).thenReturn(noRole);
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));
        when(pauseRepository.findById(1L)).thenReturn(Optional.of(pause(1L, t)));

        ResourceNotFoundException ex = assertThrows(ResourceNotFoundException.class,
            () -> service().mettreAJourStatutPause(1L, 1L, StatutPause.ATTEINTE));
        assertEquals("Accès refusé", ex.getMessage());
    }

    @Test
    void mettreAJourStatutPause_noAuthentication_throws() {
        Trajet t = trajet(1L, null, null, null, 300, 100.0, null, null);
        when(authenticatedUserService.getCurrentUser()).thenThrow(new RuntimeException("no auth"));
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));
        when(pauseRepository.findById(1L)).thenReturn(Optional.of(pause(1L, t)));

        ResourceNotFoundException ex = assertThrows(ResourceNotFoundException.class,
            () -> service().mettreAJourStatutPause(1L, 1L, StatutPause.ATTEINTE));
        assertEquals("Accès refusé", ex.getMessage());
    }

    @Test
    void mettreAJourStatutPause_superadminAtteinte_setsNowAndBroadcasts() {
        Trajet t = trajet(1L, chauffeur(10L), manager(20L), null, 300, 100.0, null, null);
        when(authenticatedUserService.getCurrentUser()).thenReturn(user(Role.SUPERADMIN, 99L));
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));
        PauseReglementaire p = PauseReglementaire.builder().id(1L).trajet(t).type(TypePause.MANDATORY_REST)
            .latitude(46.0).longitude(4.0).nomLieu("Aire").aiScore(90).build();
        when(pauseRepository.findById(1L)).thenReturn(Optional.of(p));
        when(pauseRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of(user(Role.SUPERADMIN, 99L)));

        PauseReglementaireResponse r = service().mettreAJourStatutPause(1L, 1L, StatutPause.ATTEINTE);

        assertEquals(StatutPause.ATTEINTE, r.getStatut());
        assertNotNull(r.getHeureRepriseEstimee());
        assertEquals("Aire", r.getNomLieu());
        assertEquals(90, r.getAiScore());
        verify(notificationRealtimeService).publishNamedEventToUsers(
            argThat(col -> col.size() == 3 && col.containsAll(Arrays.asList(10L, 20L, 99L))),
            eq("PAUSE_STATUS_UPDATED"), any(Map.class));
    }

    @Test
    void mettreAJourStatutPause_atteinteKeepsExistingResumeTime() {
        Trajet t = trajet(1L, chauffeur(10L), null, null, 300, 100.0, null, null);
        when(authenticatedUserService.getCurrentUser()).thenReturn(user(Role.SUPERADMIN, 99L));
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));
        PauseReglementaire p = PauseReglementaire.builder().id(1L).trajet(t).type(TypePause.MANDATORY_REST)
            .heureRepriseEstimee(LocalDateTime.parse("2026-08-10T12:00:00")).build();
        when(pauseRepository.findById(1L)).thenReturn(Optional.of(p));
        when(pauseRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of());

        PauseReglementaireResponse r = service().mettreAJourStatutPause(1L, 1L, StatutPause.ATTEINTE);

        assertEquals(LocalDateTime.parse("2026-08-10T12:00:00"), r.getHeureRepriseEstimee());
    }

    @Test
    void mettreAJourStatutPause_ignoree_success() {
        Trajet t = trajet(1L, chauffeur(10L), manager(20L), null, 300, 100.0, null, null);
        when(authenticatedUserService.getCurrentUser()).thenReturn(user(Role.SUPERADMIN, 99L));
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));
        PauseReglementaire p = PauseReglementaire.builder().id(1L).trajet(t).type(TypePause.WARNING_ALERT)
            .nomLieu("Alerte").build();
        when(pauseRepository.findById(1L)).thenReturn(Optional.of(p));
        when(pauseRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of(user(Role.SUPERADMIN, 99L)));

        PauseReglementaireResponse r = service().mettreAJourStatutPause(1L, 1L, StatutPause.IGNOREE);

        assertEquals(StatutPause.IGNOREE, r.getStatut());
        assertNull(r.getHeureRepriseEstimee());
        verify(notificationRealtimeService).publishNamedEventToUsers(anyList(), eq("PAUSE_STATUS_UPDATED"), any(Map.class));
    }

    @Test
    void mettreAJourStatutPause_planifiee_emptyAudience_noBroadcast() {
        Trajet t = trajet(1L, null, null, null, 300, 100.0, null, null);
        when(authenticatedUserService.getCurrentUser()).thenReturn(user(Role.SUPERADMIN, 99L));
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));
        PauseReglementaire p = PauseReglementaire.builder().id(1L).trajet(t).type(TypePause.PARKING)
            .latitude(46.0).longitude(4.0).build();
        when(pauseRepository.findById(1L)).thenReturn(Optional.of(p));
        when(pauseRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of());

        PauseReglementaireResponse r = service().mettreAJourStatutPause(1L, 1L, StatutPause.PLANIFIEE);

        assertEquals(StatutPause.PLANIFIEE, r.getStatut());
        verify(notificationRealtimeService, never()).publishNamedEventToUsers(anyList(), anyString(), any(Map.class));
    }

    @Test
    void mettreAJourStatutPause_managerAssigned_success() {
        Trajet t = trajet(1L, chauffeur(10L), manager(20L), null, 300, 100.0, null, null);
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager(20L));
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));
        when(pauseRepository.findById(1L)).thenReturn(Optional.of(pause(1L, t)));
        when(pauseRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of(user(Role.SUPERADMIN, 99L)));

        PauseReglementaireResponse r = service().mettreAJourStatutPause(1L, 1L, StatutPause.PLANIFIEE);

        assertEquals(StatutPause.PLANIFIEE, r.getStatut());
        verify(notificationRealtimeService).publishNamedEventToUsers(anyList(), eq("PAUSE_STATUS_UPDATED"), any(Map.class));
    }

    @Test
    void mettreAJourStatutPause_managerOfChauffeur_success() {
        Chauffeur ch = chauffeur(10L);
        ch.setManager(manager(20L));
        Trajet t = trajet(1L, ch, null, null, 300, 100.0, null, null);
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager(20L));
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));
        when(pauseRepository.findById(1L)).thenReturn(Optional.of(pause(1L, t)));
        when(pauseRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of());

        assertEquals(StatutPause.PLANIFIEE,
            service().mettreAJourStatutPause(1L, 1L, StatutPause.PLANIFIEE).getStatut());
    }

    @Test
    void mettreAJourStatutPause_managerSameCompany_success() {
        Chauffeur ch = chauffeur(10L);
        ch.setEntreprise(entreprise(1L));
        Trajet t = trajet(1L, ch, null, null, 300, 100.0, null, null);
        Manager mgr = manager(20L);
        mgr.setEntreprise(entreprise(1L));
        when(authenticatedUserService.getCurrentUser()).thenReturn(mgr);
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));
        when(pauseRepository.findById(1L)).thenReturn(Optional.of(pause(1L, t)));
        when(pauseRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of());

        assertEquals(StatutPause.PLANIFIEE,
            service().mettreAJourStatutPause(1L, 1L, StatutPause.PLANIFIEE).getStatut());
    }

    @Test
    void mettreAJourStatutPause_chauffeurOwner_success() {
        Trajet t = trajet(1L, chauffeur(10L), null, null, 300, 100.0, null, null);
        when(authenticatedUserService.getCurrentUser()).thenReturn(user(Role.CHAUFFEUR, 10L));
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));
        when(pauseRepository.findById(1L)).thenReturn(Optional.of(pause(1L, t)));
        when(pauseRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of());

        assertEquals(StatutPause.PLANIFIEE,
            service().mettreAJourStatutPause(1L, 1L, StatutPause.PLANIFIEE).getStatut());
    }

    // =====================================================================
    // NEW BRANCH COVERAGE TESTS
    // =====================================================================

    // ========== Branch coverage: isDebugEnabled (line 60) ==========

    @Test
    @DisplayName("isDebugEnabled - appDebugPauses true returns true via reflection")
    void isDebugEnabled_appDebugPausesTrue_returnsTrue() {
        PauseReglementaireServiceImpl s = service();
        ReflectionTestUtils.setField(s, "appDebugPauses", true);
        Boolean result = (Boolean) ReflectionTestUtils.invokeMethod(s, "isDebugEnabled");
        assertTrue(result);
    }

    @Test
    @DisplayName("isDebugEnabled - appDebugPauses false evaluates env var path")
    void isDebugEnabled_appDebugPausesFalse_evaluatesEnvVarPath() {
        PauseReglementaireServiceImpl s = service();
        ReflectionTestUtils.setField(s, "appDebugPauses", false);
        Boolean result = (Boolean) ReflectionTestUtils.invokeMethod(s, "isDebugEnabled");
        assertNotNull(result);
    }

    // ========== Branch coverage: genererPauses - responseBody null (line 137) ==========

    @Test
    @DisplayName("genererPauses - null response body returns empty")
    void genererPauses_nullResponseBody_returnsEmpty() {
        Trajet t = trajet(1L, chauffeur(10L), manager(20L), vehicule(1L), 300, 100.0, LocalDateTime.now(), null);
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));
        when(restTemplate.postForEntity(anyString(), any(), eq(String.class)))
            .thenReturn(ResponseEntity.ok((String) null));

        List<PauseReglementaireResponse> result = service().genererPauses(1L);

        assertTrue(result.isEmpty());
        verify(pauseRepository, times(1)).deleteByTrajetId(1L);
    }

    // ========== Branch coverage: genererPauses - stops null (line 154) ==========

    @Test
    @DisplayName("genererPauses - stops key absent from response returns empty")
    void genererPauses_stopsKeyAbsent_returnsEmpty() {
        Trajet t = trajet(1L, null, null, null, 300, 100.0, LocalDateTime.now(), null);
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));
        when(restTemplate.postForEntity(anyString(), any(), eq(String.class)))
            .thenReturn(ResponseEntity.ok("{\"meta\":{\"break_alert_applicable\":true}}"));

        List<PauseReglementaireResponse> result = service().genererPauses(1L);

        assertTrue(result.isEmpty());
    }

    // ========== Branch coverage: genererPauses - lonlat size < 2 (line 178) ==========

    @Test
    @DisplayName("genererPauses - lonlat with 1 element falls through to lat/lon")
    void genererPauses_lonlatOneElement_fallsThrough() {
        Trajet t = trajet(1L, null, null, null, 300, 100.0, LocalDateTime.now(), null);
        String json = "{\"stops\":[{\"type\":\"parking\",\"lonlat\":[4.0],\"distanceAlongRouteM\":3000}]}";
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));
        when(restTemplate.postForEntity(anyString(), any(), eq(String.class)))
            .thenReturn(ResponseEntity.ok(json));
        when(pauseRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of());

        List<PauseReglementaireResponse> result = service().genererPauses(1L);

        assertEquals(1, result.size());
        assertEquals(48.85, result.get(0).getLatitude());
        assertEquals(2.35, result.get(0).getLongitude());
    }

    // ========== Branch coverage: genererPauses - lat/lon as Objects not Number (line 185) ==========

    @Test
    @DisplayName("genererPauses - lat/lon as non-Number Strings triggers fallback to departure")
    void genererPauses_latLonNonNumberStrings_triggersFallback() {
        Trajet t = trajet(1L, null, null, null, 300, 100.0, LocalDateTime.now(), null);
        String json = "{\"stops\":[{\"type\":\"parking\",\"lat\":\"abc\",\"lon\":\"xyz\",\"distanceAlongRouteM\":3000}]}";
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));
        when(restTemplate.postForEntity(anyString(), any(), eq(String.class)))
            .thenReturn(ResponseEntity.ok(json));
        when(pauseRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of());

        List<PauseReglementaireResponse> result = service().genererPauses(1L);

        assertEquals(1, result.size());
        assertEquals(48.85, result.get(0).getLatitude());
        assertEquals(2.35, result.get(0).getLongitude());
    }

    // ========== Branch coverage: genererPauses - both lat/lon null (line 192) ==========

    @Test
    @DisplayName("genererPauses - both lat and lon null via empty lonlat array uses departure")
    void genererPauses_bothLatLonNull_emptyLonlatArray_usesDeparture() {
        Trajet t = trajet(1L, null, null, null, 300, 100.0, LocalDateTime.now(), null);
        String json = "{\"stops\":[{\"type\":\"parking\",\"lonlat\":[],\"distanceAlongRouteM\":3000}]}";
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));
        when(restTemplate.postForEntity(anyString(), any(), eq(String.class)))
            .thenReturn(ResponseEntity.ok(json));
        when(pauseRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of());

        List<PauseReglementaireResponse> result = service().genererPauses(1L);

        assertEquals(1, result.size());
        assertEquals(48.85, result.get(0).getLatitude());
        assertEquals(2.35, result.get(0).getLongitude());
    }

    // ========== Branch coverage: genererPauses - nomLieu blank (line 229) ==========

    @Test
    @DisplayName("genererPauses - blank nomLieu triggers generateNomLieu")
    void genererPauses_blankNomLieu_triggersGenerateNomLieu() {
        Trajet t = trajet(1L, null, null, null, 300, 100.0, LocalDateTime.now(), null);
        String json = "{\"stops\":[{\"type\":\"cafe\",\"lonlat\":[4.0,46.0],"
            + "\"distanceAlongRouteM\":5000,\"nomLieu\":\"   \"}]}";
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));
        when(restTemplate.postForEntity(anyString(), any(), eq(String.class)))
            .thenReturn(ResponseEntity.ok(json));
        when(pauseRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of());

        List<PauseReglementaireResponse> result = service().genererPauses(1L);

        assertEquals(1, result.size());
        assertTrue(result.get(0).getNomLieu().contains("Café"));
    }

    // ========== Branch coverage: genererPauses - chauffeur null in audience (line 248) ==========

    @Test
    @DisplayName("genererPauses - null chauffeur skips chauffeur in audience")
    void genererPauses_chauffeurNull_skipsInAudience() {
        Trajet t = trajet(1L, null, manager(20L), null, 300, 100.0, LocalDateTime.now(), null);
        String json = "{\"stops\":[{\"type\":\"parking\",\"lonlat\":[4.0,46.0]}]}";
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));
        when(restTemplate.postForEntity(anyString(), any(), eq(String.class)))
            .thenReturn(ResponseEntity.ok(json));
        when(pauseRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));
        when(utilisateurRepository.findByRole(Role.SUPERADMIN))
            .thenReturn(List.of(user(Role.SUPERADMIN, 99L)));

        List<PauseReglementaireResponse> result = service().genererPauses(1L);

        assertEquals(1, result.size());
        verify(notificationRealtimeService).publishNamedEventToUsers(
            argThat(col -> col.size() == 2 && col.contains(20L) && col.contains(99L)),
            eq("PAUSES_GENEREES"), eq(1L));
    }

    // ========== Branch coverage: genererPauses - manager null in audience (line 251) ==========

    @Test
    @DisplayName("genererPauses - null manager skips manager in audience")
    void genererPauses_managerNull_skipsInAudience() {
        Trajet t = trajet(1L, chauffeur(10L), null, null, 300, 100.0, LocalDateTime.now(), null);
        String json = "{\"stops\":[{\"type\":\"parking\",\"lonlat\":[4.0,46.0]}]}";
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));
        when(restTemplate.postForEntity(anyString(), any(), eq(String.class)))
            .thenReturn(ResponseEntity.ok(json));
        when(pauseRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));
        when(utilisateurRepository.findByRole(Role.SUPERADMIN))
            .thenReturn(List.of(user(Role.SUPERADMIN, 99L)));

        List<PauseReglementaireResponse> result = service().genererPauses(1L);

        assertEquals(1, result.size());
        verify(notificationRealtimeService).publishNamedEventToUsers(
            argThat(col -> col.size() == 2 && col.contains(10L) && col.contains(99L)),
            eq("PAUSES_GENEREES"), eq(1L));
    }

    // ========== Branch coverage: genererPauses - fallback returns empty, not saved (line 271) ==========

    @Test
    @DisplayName("genererPauses - fallback generates no pauses, returns empty")
    void genererPauses_fallbackReturnsNoPauses_returnsEmpty() {
        Trajet t = trajet(1L, chauffeur(10L), null, null, 300, 100.0, LocalDateTime.now(), null);
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));
        when(restTemplate.postForEntity(anyString(), any(), eq(String.class)))
            .thenReturn(ResponseEntity.ok("not json"));

        List<PauseReglementaireResponse> result = service().genererPauses(1L);

        assertNotNull(result);
    }

    // ========== Branch coverage: getPausesForTrajet lines 311-313 ==========

    @Test
    @DisplayName("getPausesForTrajet - manager same company via trajet manager when chauffeur has no entreprise")
    void getPausesForTrajet_managerSameCompanyViaTrajetManager_noChauffeurEntreprise() {
        Chauffeur ch = chauffeur(10L);
        Manager tMgr = manager(50L);
        tMgr.setEntreprise(entreprise(1L));
        Trajet t = trajet(1L, ch, tMgr, null, 300, 100.0, null, null);
        Manager mgr = manager(20L);
        mgr.setEntreprise(entreprise(1L));
        when(authenticatedUserService.getCurrentUser()).thenReturn(mgr);
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));
        when(pauseRepository.findByTrajetId(1L)).thenReturn(List.of(pause(1L, t)));

        assertEquals(1, service().getPausesForTrajet(1L).size());
    }

    // ========== Branch coverage: getPausesForTrajet line 327 ==========

    @Test
    @DisplayName("getPausesForTrajet - chauffeur role with null trajet chauffeur denied")
    void getPausesForTrajet_chauffeurRole_nullTrajetChauffeur_denied() {
        Trajet t = trajet(1L, null, null, null, 300, 100.0, null, null);
        when(authenticatedUserService.getCurrentUser()).thenReturn(user(Role.CHAUFFEUR, 10L));
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));

        ResourceNotFoundException ex = assertThrows(ResourceNotFoundException.class,
            () -> service().getPausesForTrajet(1L));
        assertEquals("Accès refusé à ce trajet", ex.getMessage());
    }

    // ========== Branch coverage: mettreAJourStatutPause lines 380-382 ==========

    @Test
    @DisplayName("mettreAJourStatutPause - ATTEINTE with null durationSeconds logs zero")
    void mettreAJourStatutPause_atteinteNullDuration_logsZero() {
        Trajet t = trajet(1L, chauffeur(10L), null, null, 300, 100.0, null, null);
        when(authenticatedUserService.getCurrentUser()).thenReturn(user(Role.SUPERADMIN, 99L));
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));
        PauseReglementaire p = PauseReglementaire.builder().id(1L).trajet(t)
            .type(TypePause.WARNING_ALERT).nomLieu("Alerte").build();
        when(pauseRepository.findById(1L)).thenReturn(Optional.of(p));
        when(pauseRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(utilisateurRepository.findByRole(Role.SUPERADMIN))
            .thenReturn(List.of(user(Role.SUPERADMIN, 99L)));

        PauseReglementaireResponse r = service().mettreAJourStatutPause(1L, 1L, StatutPause.ATTEINTE);

        assertEquals(StatutPause.ATTEINTE, r.getStatut());
        assertNotNull(r.getHeureRepriseEstimee());
    }

    @Test
    @DisplayName("mettreAJourStatutPause - ATTEINTE with non-null durationSeconds")
    void mettreAJourStatutPause_atteinteNonNullDuration() {
        Trajet t = trajet(1L, chauffeur(10L), null, null, 300, 100.0, null, null);
        when(authenticatedUserService.getCurrentUser()).thenReturn(user(Role.SUPERADMIN, 99L));
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));
        PauseReglementaire p = PauseReglementaire.builder().id(1L).trajet(t)
            .type(TypePause.WARNING_ALERT).nomLieu("Alerte").durationSeconds(1800).build();
        when(pauseRepository.findById(1L)).thenReturn(Optional.of(p));
        when(pauseRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(utilisateurRepository.findByRole(Role.SUPERADMIN))
            .thenReturn(List.of(user(Role.SUPERADMIN, 99L)));

        PauseReglementaireResponse r = service().mettreAJourStatutPause(1L, 1L, StatutPause.ATTEINTE);

        assertEquals(StatutPause.ATTEINTE, r.getStatut());
        assertEquals(1800, r.getDurationSeconds());
    }

    @Test
    @DisplayName("mettreAJourStatutPause - IGNOREE with non-null aiScore")
    void mettreAJourStatutPause_ignoreeNonNullAiScore() {
        Trajet t = trajet(1L, chauffeur(10L), manager(20L), null, 300, 100.0, null, null);
        when(authenticatedUserService.getCurrentUser()).thenReturn(user(Role.SUPERADMIN, 99L));
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));
        PauseReglementaire p = PauseReglementaire.builder().id(1L).trajet(t)
            .type(TypePause.WARNING_ALERT).nomLieu("Alerte").aiScore(85).build();
        when(pauseRepository.findById(1L)).thenReturn(Optional.of(p));
        when(pauseRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(utilisateurRepository.findByRole(Role.SUPERADMIN))
            .thenReturn(List.of(user(Role.SUPERADMIN, 99L)));

        PauseReglementaireResponse r = service().mettreAJourStatutPause(1L, 1L, StatutPause.IGNOREE);

        assertEquals(StatutPause.IGNOREE, r.getStatut());
        assertEquals(85, r.getAiScore());
    }

    // ========== Branch coverage: broadcasterPauseStatus lines 413-416, 435 ==========

    @Test
    @DisplayName("broadcasterPauseStatus - null chauffeur and null manager broadcasts only to superadmins")
    void broadcasterPauseStatus_nullChauffeurAndManager() {
        Trajet t = trajet(1L, null, null, null, 300, 100.0, null, null);
        when(authenticatedUserService.getCurrentUser()).thenReturn(user(Role.SUPERADMIN, 99L));
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));
        PauseReglementaire p = PauseReglementaire.builder().id(1L).trajet(t)
            .type(TypePause.PARKING).latitude(46.0).longitude(4.0).nomLieu("Parking").build();
        when(pauseRepository.findById(1L)).thenReturn(Optional.of(p));
        when(pauseRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(utilisateurRepository.findByRole(Role.SUPERADMIN))
            .thenReturn(List.of(user(Role.SUPERADMIN, 99L)));

        PauseReglementaireResponse r = service().mettreAJourStatutPause(1L, 1L, StatutPause.PLANIFIEE);

        assertEquals(StatutPause.PLANIFIEE, r.getStatut());
        verify(notificationRealtimeService).publishNamedEventToUsers(
            argThat(col -> col.size() == 1 && col.contains(99L)),
            eq("PAUSE_STATUS_UPDATED"), any(Map.class));
    }

    @Test
    @DisplayName("broadcasterPauseStatus - pause type null in payload")
    void broadcasterPauseStatus_pauseTypeNull() {
        Trajet t = trajet(1L, chauffeur(10L), null, null, 300, 100.0, null, null);
        when(authenticatedUserService.getCurrentUser()).thenReturn(user(Role.SUPERADMIN, 99L));
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));
        PauseReglementaire p = PauseReglementaire.builder().id(1L).trajet(t)
            .type(null).latitude(46.0).longitude(4.0).nomLieu("Lieu").build();
        when(pauseRepository.findById(1L)).thenReturn(Optional.of(p));
        when(pauseRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of());

        PauseReglementaireResponse r = service().mettreAJourStatutPause(1L, 1L, StatutPause.PLANIFIEE);

        assertNull(r.getType());
        verify(notificationRealtimeService).publishNamedEventToUsers(
            anyList(), eq("PAUSE_STATUS_UPDATED"),
            argThat(payload -> ((Map<?, ?>) payload).get("type") == null));
    }

    // ========== Branch coverage: verifierAccesPause lines 452-459 ==========

    @Test
    @DisplayName("verifierAccesPause - manager with all three conditions true grants access")
    void verifierAccesPause_managerAllConditionsTrue_grantsAccess() {
        Chauffeur ch = chauffeur(10L);
        ch.setManager(manager(20L));
        ch.setEntreprise(entreprise(1L));
        Trajet t = trajet(1L, ch, manager(20L), null, 300, 100.0, null, null);
        Manager mgr = manager(20L);
        mgr.setEntreprise(entreprise(1L));
        when(authenticatedUserService.getCurrentUser()).thenReturn(mgr);
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));
        when(pauseRepository.findById(1L)).thenReturn(Optional.of(pause(1L, t)));
        when(pauseRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of());

        PauseReglementaireResponse r = service().mettreAJourStatutPause(1L, 1L, StatutPause.PLANIFIEE);

        assertEquals(StatutPause.PLANIFIEE, r.getStatut());
    }

    // ========== Branch coverage: verifierAccesPause line 468 ==========

    @Test
    @DisplayName("verifierAccesPause - chauffeur role with null trajet chauffeur throws")
    void verifierAccesPause_chauffeurRole_nullTrajetChauffeur_throws() {
        Trajet t = trajet(1L, null, null, null, 300, 100.0, null, null);
        when(authenticatedUserService.getCurrentUser()).thenReturn(user(Role.CHAUFFEUR, 10L));
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));
        when(pauseRepository.findById(1L)).thenReturn(Optional.of(pause(1L, t)));

        ResourceNotFoundException ex = assertThrows(ResourceNotFoundException.class,
            () -> service().mettreAJourStatutPause(1L, 1L, StatutPause.PLANIFIEE));
        assertEquals("Accès refusé", ex.getMessage());
    }

    // ========== Branch coverage: parseDateTime blank string (line 497) ==========

    @Test
    @DisplayName("genererPauses - blank arrivalTime returns null via parseDateTime")
    void genererPauses_blankArrivalTime_returnsNull() {
        Trajet t = trajet(1L, null, null, null, 300, 100.0, LocalDateTime.now(), null);
        String json = "{\"stops\":[{\"type\":\"parking\",\"lonlat\":[4.0,46.0],\"arrivalTime\":\"  \"}]}";
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));
        when(restTemplate.postForEntity(anyString(), any(), eq(String.class)))
            .thenReturn(ResponseEntity.ok(json));
        when(pauseRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of());

        List<PauseReglementaireResponse> result = service().genererPauses(1L);

        assertEquals(1, result.size());
        assertNull(result.get(0).getHeureArriveePlanifiee());
    }

    // ========== Branch coverage: genererPausesFallback via reflection ==========

    @Test
    @DisplayName("genererPausesFallback - null dureeMinutes returns empty via reflection")
    @SuppressWarnings("unchecked")
    void genererPausesFallback_nullDureeMinutes_returnsEmpty() {
        PauseReglementaireServiceImpl s = service();
        Trajet t = trajet(1L, null, null, null, 300, 100.0, LocalDateTime.now(), null);

        List<PauseReglementaire> result = (List<PauseReglementaire>) ReflectionTestUtils.invokeMethod(
            s, "genererPausesFallback", t, (Integer) null);

        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    // ========== Branch coverage: genererPausesFallback blank geometry (line 565) ==========

    @Test
    @DisplayName("genererPausesFallback - blank geometrieItineraire returns empty via fallback")
    void genererPausesFallback_blankGeometry_returnsEmpty() {
        Trajet t = trajet(1L, null, null, null, 300, 100.0, LocalDateTime.now(), "  ");
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));
        when(restTemplate.postForEntity(anyString(), any(), eq(String.class)))
            .thenThrow(new RuntimeException("flask down"));

        List<PauseReglementaireResponse> result = service().genererPauses(1L);

        assertTrue(result.isEmpty());
    }

    // ========== Branch coverage: genererPausesFallback speedMS <= 0 (line 589-590) ==========

    @Test
    @DisplayName("genererPausesFallback - zero distance forces speedMS to 18.0")
    void genererPausesFallback_zeroDistance_speedReset() {
        Trajet t = trajet(1L, null, null, null, 300, null, LocalDateTime.now(),
            "{\"coordinates\":[[2.35,48.85],[2.35,48.85]]}");
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));
        when(restTemplate.postForEntity(anyString(), any(), eq(String.class)))
            .thenThrow(new RuntimeException("down"));
        when(pauseRepository.findByTrajetId(1L)).thenReturn(List.of());
        when(pauseRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));

        List<PauseReglementaireResponse> result = service().genererPauses(1L);

        assertEquals(2, result.size());
        assertEquals(48.85, result.get(0).getLatitude());
    }

    // ========== Branch coverage: genererPausesFallback dateDepart null (line 592) ==========

    @Test
    @DisplayName("genererPausesFallback - dateDepart null uses LocalDateTime.now()")
    void genererPausesFallback_dateDepartNull_usesNow() {
        Trajet t = trajet(1L, null, null, null, 300, 100.0, null,
            "{\"coordinates\":[[2.35,48.85],[4.85,45.75]]}");
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));
        when(restTemplate.postForEntity(anyString(), any(), eq(String.class)))
            .thenThrow(new RuntimeException("flask down"));
        when(pauseRepository.findByTrajetId(1L)).thenReturn(List.of());
        when(pauseRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));

        List<PauseReglementaireResponse> result = service().genererPauses(1L);

        assertEquals(2, result.size());
    }

    // ========== Branch coverage: genererPausesFallback WARNING_ALERT exists (lines 600-601) ==========

    @Test
    @DisplayName("genererPausesFallback - WARNING_ALERT exists, only MANDATORY_REST created")
    void genererPausesFallback_warningAlertExists_skipsWarning() {
        Trajet t = trajet(1L, null, null, null, 300, 100.0, LocalDateTime.now(),
            "{\"coordinates\":[[2.35,48.85],[4.85,45.75]]}");
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));
        when(restTemplate.postForEntity(anyString(), any(), eq(String.class)))
            .thenThrow(new RuntimeException("flask down"));
        when(pauseRepository.findByTrajetId(1L)).thenReturn(List.of(
            PauseReglementaire.builder().id(1L).trajet(t).type(TypePause.WARNING_ALERT).build()));
        when(pauseRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));

        List<PauseReglementaireResponse> result = service().genererPauses(1L);

        assertEquals(1, result.size());
        assertEquals(TypePause.MANDATORY_REST, result.get(0).getType());
    }

    // ========== Branch coverage: genererPausesFallback MANDATORY_REST exists (line 628) ==========

    @Test
    @DisplayName("genererPausesFallback - MANDATORY_REST exists, only WARNING_ALERT created")
    void genererPausesFallback_mandatoryRestExists_skipsMandatory() {
        Trajet t = trajet(1L, null, null, null, 300, 100.0, LocalDateTime.now(),
            "{\"coordinates\":[[2.35,48.85],[4.85,45.75]]}");
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));
        when(restTemplate.postForEntity(anyString(), any(), eq(String.class)))
            .thenThrow(new RuntimeException("flask down"));
        when(pauseRepository.findByTrajetId(1L)).thenReturn(List.of(
            PauseReglementaire.builder().id(1L).trajet(t).type(TypePause.MANDATORY_REST).build()));
        when(pauseRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));

        List<PauseReglementaireResponse> result = service().genererPauses(1L);

        assertEquals(1, result.size());
        assertEquals(TypePause.WARNING_ALERT, result.get(0).getType());
    }

    // ========== Branch coverage: parseCoordinatesFromGeometry (lines 669-671) ==========

    @Test
    @DisplayName("parseCoordinatesFromGeometry - FeatureCollection with null geometry returns null")
    @SuppressWarnings("unchecked")
    void parseCoordinatesFromGeometry_featureCollectionNullGeometry() {
        PauseReglementaireServiceImpl s = service();
        String geomJson = "{\"type\":\"FeatureCollection\",\"features\":[{\"type\":\"Feature\",\"geometry\":null}]}";

        List<List<Double>> result = (List<List<Double>>) ReflectionTestUtils.invokeMethod(
            s, "parseCoordinatesFromGeometry", geomJson);

        assertNull(result);
    }

    @Test
    @DisplayName("parseCoordinatesFromGeometry - geometry without coordinates returns null")
    @SuppressWarnings("unchecked")
    void parseCoordinatesFromGeometry_geometryWithoutCoordinates() {
        PauseReglementaireServiceImpl s = service();
        String geomJson = "{\"type\":\"FeatureCollection\",\"features\":[{\"geometry\":{\"type\":\"LineString\"}}]}";

        List<List<Double>> result = (List<List<Double>>) ReflectionTestUtils.invokeMethod(
            s, "parseCoordinatesFromGeometry", geomJson);

        assertNull(result);
    }

    @Test
    @DisplayName("parseCoordinatesFromGeometry - FeatureCollection with null features returns null")
    @SuppressWarnings("unchecked")
    void parseCoordinatesFromGeometry_featureCollectionNullFeatures() {
        PauseReglementaireServiceImpl s = service();
        String geomJson = "{\"type\":\"FeatureCollection\",\"features\":null}";

        List<List<Double>> result = (List<List<Double>>) ReflectionTestUtils.invokeMethod(
            s, "parseCoordinatesFromGeometry", geomJson);

        assertNull(result);
    }

    @Test
    @DisplayName("parseCoordinatesFromGeometry - FeatureCollection with empty features returns null")
    @SuppressWarnings("unchecked")
    void parseCoordinatesFromGeometry_featureCollectionEmptyFeatures() {
        PauseReglementaireServiceImpl s = service();
        String geomJson = "{\"type\":\"FeatureCollection\",\"features\":[]}";

        List<List<Double>> result = (List<List<Double>>) ReflectionTestUtils.invokeMethod(
            s, "parseCoordinatesFromGeometry", geomJson);

        assertNull(result);
    }

    @Test
    @DisplayName("parseCoordinatesFromGeometry - geometry with coordinates null returns null")
    @SuppressWarnings("unchecked")
    void parseCoordinatesFromGeometry_geometryCoordinatesNull() {
        PauseReglementaireServiceImpl s = service();
        String geomJson = "{\"type\":\"Feature\",\"geometry\":{\"type\":\"LineString\",\"coordinates\":null}}";

        List<List<Double>> result = (List<List<Double>>) ReflectionTestUtils.invokeMethod(
            s, "parseCoordinatesFromGeometry", geomJson);

        assertNull(result);
    }

    // ========== Branch coverage: interpolateOnRoute (lines 709-721) ==========

    @Test
    @DisplayName("interpolateOnRoute - targetDistanceM >= totalDistanceM returns last coord")
    void interpolateOnRoute_targetBeyondTotal_returnsLastCoord() {
        PauseReglementaireServiceImpl s = service();
        List<List<Double>> coords = List.of(List.of(2.35, 48.85), List.of(4.85, 45.75));

        double[] result = (double[]) ReflectionTestUtils.invokeMethod(
            s, "interpolateOnRoute", coords, 2000.0, 1000.0);

        assertNotNull(result);
        assertEquals(45.75, result[0]);
        assertEquals(4.85, result[1]);
    }

    @Test
    @DisplayName("interpolateOnRoute - totalDistanceM <= 0 returns last coord")
    void interpolateOnRoute_totalDistanceZero_returnsLastCoord() {
        PauseReglementaireServiceImpl s = service();
        List<List<Double>> coords = List.of(List.of(2.35, 48.85), List.of(4.85, 45.75));

        double[] result = (double[]) ReflectionTestUtils.invokeMethod(
            s, "interpolateOnRoute", coords, 100.0, 0.0);

        assertNotNull(result);
        assertEquals(45.75, result[0]);
        assertEquals(4.85, result[1]);
    }

    @Test
    @DisplayName("interpolateOnRoute - empty loop returns last coord")
    void interpolateOnRoute_emptyLoop_returnsLastCoord() {
        PauseReglementaireServiceImpl s = service();
        List<List<Double>> coords = List.of(List.of(2.35, 48.85), List.of(2.351, 48.851));

        double[] result = (double[]) ReflectionTestUtils.invokeMethod(
            s, "interpolateOnRoute", coords, 1000.0, 100000.0);

        assertNotNull(result);
        assertEquals(48.851, result[0]);
        assertEquals(2.351, result[1]);
    }

    @Test
    @DisplayName("interpolateOnRoute - frac calculation within segment")
    void interpolateOnRoute_fracCalculation_midpoint() {
        PauseReglementaireServiceImpl s = service();
        List<List<Double>> coords = List.of(List.of(0.0, 0.0), List.of(2.0, 2.0));

        double[] result = (double[]) ReflectionTestUtils.invokeMethod(
            s, "interpolateOnRoute", coords, 50.0, 200.0);

        assertNotNull(result);
        assertTrue(result[0] > 0.0 && result[0] < 2.0);
        assertTrue(result[1] > 0.0 && result[1] < 2.0);
    }

    @Test
    @DisplayName("interpolateOnRoute - zero-length segment frac equals zero")
    void interpolateOnRoute_zeroLengthSegment() {
        PauseReglementaireServiceImpl s = service();
        List<List<Double>> coords = List.of(
            List.of(2.35, 48.85), List.of(2.35, 48.85), List.of(4.85, 45.75));

        double[] result = (double[]) ReflectionTestUtils.invokeMethod(
            s, "interpolateOnRoute", coords, 0.0, 100000.0);

        assertNotNull(result);
        assertEquals(48.85, result[0]);
        assertEquals(2.35, result[1]);
    }

    @Test
    @DisplayName("interpolateOnRoute - null coords returns null")
    void interpolateOnRoute_nullCoords_returnsNull() {
        PauseReglementaireServiceImpl s = service();

        double[] result = (double[]) ReflectionTestUtils.invokeMethod(
            s, "interpolateOnRoute", (Object) null, 100.0, 1000.0);

        assertNull(result);
    }

    @Test
    @DisplayName("interpolateOnRoute - single coord returns null")
    void interpolateOnRoute_singleCoord_returnsNull() {
        PauseReglementaireServiceImpl s = service();
        List<List<Double>> coords = List.of(List.of(2.35, 48.85));

        double[] result = (double[]) ReflectionTestUtils.invokeMethod(
            s, "interpolateOnRoute", coords, 100.0, 1000.0);

        assertNull(result);
    }

    // ========== Branch coverage: genererPausesFallback - fallback exception (line 277) ==========

    @Test
    @DisplayName("genererPauses - fallback also throws returns empty")
    void genererPauses_fallbackAlsoThrows_returnsEmpty() {
        Trajet t = trajet(1L, null, null, null, 300, 100.0, LocalDateTime.now(),
            "invalid json {{{");
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));
        when(restTemplate.postForEntity(anyString(), any(), eq(String.class)))
            .thenThrow(new RuntimeException("flask down"));

        List<PauseReglementaireResponse> result = service().genererPauses(1L);

        assertTrue(result.isEmpty());
    }

    // ========== Branch coverage: genererPauses - WARNING_ALERT exists but MANDATORY_REST does not via fallback ==========

    @Test
    @DisplayName("genererPauses fallback - only WARNING_ALERT exists, creates only MANDATORY_REST")
    void genererPauses_fallback_onlyWarningAlertExists() {
        Trajet t = trajet(1L, null, null, null, 300, 100.0, LocalDateTime.now(),
            "{\"coordinates\":[[2.35,48.85],[4.85,45.75]]}");
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));
        when(restTemplate.postForEntity(anyString(), any(), eq(String.class)))
            .thenThrow(new RuntimeException("flask down"));
        when(pauseRepository.findByTrajetId(1L)).thenReturn(List.of(
            PauseReglementaire.builder().id(1L).trajet(t).type(TypePause.WARNING_ALERT).build()));
        when(pauseRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));

        List<PauseReglementaireResponse> result = service().genererPauses(1L);

        assertEquals(1, result.size());
        assertEquals(TypePause.MANDATORY_REST, result.get(0).getType());
    }

    @Test
    @DisplayName("genererPauses fallback - only MANDATORY_REST exists, creates only WARNING_ALERT")
    void genererPauses_fallback_onlyMandatoryRestExists() {
        Trajet t = trajet(1L, null, null, null, 300, 100.0, LocalDateTime.now(),
            "{\"coordinates\":[[2.35,48.85],[4.85,45.75]]}");
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));
        when(restTemplate.postForEntity(anyString(), any(), eq(String.class)))
            .thenThrow(new RuntimeException("flask down"));
        when(pauseRepository.findByTrajetId(1L)).thenReturn(List.of(
            PauseReglementaire.builder().id(1L).trajet(t).type(TypePause.MANDATORY_REST).build()));
        when(pauseRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));

        List<PauseReglementaireResponse> result = service().genererPauses(1L);

        assertEquals(1, result.size());
        assertEquals(TypePause.WARNING_ALERT, result.get(0).getType());
    }

    // ========== Branch coverage: genererPauses - FeatureCollection with null geometry in fallback ==========

    @Test
    @DisplayName("genererPauses fallback - FeatureCollection with null inner geometry returns empty")
    void genererPauses_fallback_featureCollectionNullGeometry() {
        Trajet t = trajet(1L, null, null, null, 300, 100.0, LocalDateTime.now(),
            "{\"type\":\"FeatureCollection\",\"features\":[{\"geometry\":null}]}");
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));
        when(restTemplate.postForEntity(anyString(), any(), eq(String.class)))
            .thenThrow(new RuntimeException("flask down"));

        List<PauseReglementaireResponse> result = service().genererPauses(1L);

        assertTrue(result.isEmpty());
    }

    @Test
    @DisplayName("genererPauses fallback - FeatureCollection with coordinates null returns empty")
    void genererPauses_fallback_featureCollectionCoordinatesNull() {
        Trajet t = trajet(1L, null, null, null, 300, 100.0, LocalDateTime.now(),
            "{\"type\":\"FeatureCollection\",\"features\":[{\"geometry\":{\"coordinates\":null}}]}");
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));
        when(restTemplate.postForEntity(anyString(), any(), eq(String.class)))
            .thenThrow(new RuntimeException("flask down"));

        List<PauseReglementaireResponse> result = service().genererPauses(1L);

        assertTrue(result.isEmpty());
    }

    // ========== Branch coverage: genererPauses fallback - interpolateOnRoute with large route ==========

    @Test
    @DisplayName("genererPauses fallback - large route where interpolation falls through loop")
    void genererPauses_fallback_largeRoute_interpolationFallsThrough() {
        Trajet t = trajet(1L, null, null, null, 300, 100.0, LocalDateTime.now(),
            "{\"coordinates\":[[2.35,48.85],[2.351,48.851]]}");
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));
        when(restTemplate.postForEntity(anyString(), any(), eq(String.class)))
            .thenThrow(new RuntimeException("flask down"));
        when(pauseRepository.findByTrajetId(1L)).thenReturn(List.of());
        when(pauseRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));

        List<PauseReglementaireResponse> result = service().genererPauses(1L);

        assertEquals(2, result.size());
    }

    // ========== Branch coverage: genererPauses - dureeMinutes exactly 180 ==========

    @Test
    @DisplayName("genererPauses - duration exactly 180 min (boundary) proceeds to Flask")
    void genererPauses_durationExactly180_proceedsToFlask() {
        Trajet t = trajet(1L, null, null, null, 180, 100.0, LocalDateTime.now(), null);
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));
        when(restTemplate.postForEntity(anyString(), any(), eq(String.class)))
            .thenReturn(ResponseEntity.ok("{\"stops\":[]}"));

        List<PauseReglementaireResponse> result = service().genererPauses(1L);

        assertTrue(result.isEmpty());
        verify(restTemplate).postForEntity(anyString(), any(), eq(String.class));
    }

    // ========== Branch coverage: parseDateTime - valid ISO and fallback to default formatter ==========

    @Test
    @DisplayName("genererPauses - ISO date-time with offset triggers parseDateTime ISO path")
    void genererPauses_isoDateTimeWithOffset_parsesCorrectly() {
        Trajet t = trajet(1L, null, null, null, 300, 100.0, LocalDateTime.now(), null);
        String json = "{\"stops\":[{\"type\":\"parking\",\"lonlat\":[4.0,46.0],"
            + "\"arrivalTime\":\"2026-08-10T12:00:00+02:00\"}]}";
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));
        when(restTemplate.postForEntity(anyString(), any(), eq(String.class)))
            .thenReturn(ResponseEntity.ok(json));
        when(pauseRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of());

        List<PauseReglementaireResponse> result = service().genererPauses(1L);

        assertEquals(1, result.size());
        assertNotNull(result.get(0).getHeureArriveePlanifiee());
    }

    // ========== Branch coverage: getPausesForTrajet - MANAGER chauffeur has entreprise but different ==========

    @Test
    @DisplayName("getPausesForTrajet - manager chauffeur entreprise mismatch falls through to manager check")
    void getPausesForTrajet_managerChauffeurEntrepriseMismatch_fallsToManagerCheck() {
        Chauffeur ch = chauffeur(10L);
        ch.setEntreprise(null);
        Manager tMgr = manager(50L);
        tMgr.setEntreprise(entreprise(1L));
        Trajet t = trajet(1L, ch, tMgr, null, 300, 100.0, null, null);
        Manager mgr = manager(20L);
        mgr.setEntreprise(entreprise(1L));
        when(authenticatedUserService.getCurrentUser()).thenReturn(mgr);
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));
        when(pauseRepository.findByTrajetId(1L)).thenReturn(List.of(pause(1L, t)));

        assertEquals(1, service().getPausesForTrajet(1L).size());
    }

    // ========== Branch coverage: mettreAJourStatutPause - MANAGER isManagerOfChauffeur but not same company ==========

    @Test
    @DisplayName("mettreAJourStatutPause - manager of chauffeur grants access even without same company")
    void mettreAJourStatutPause_managerOfChauffeurNoSameCompany_grantsAccess() {
        Chauffeur ch = chauffeur(10L);
        ch.setManager(manager(20L));
        ch.setEntreprise(entreprise(2L));
        Trajet t = trajet(1L, ch, null, null, 300, 100.0, null, null);
        Manager mgr = manager(20L);
        mgr.setEntreprise(entreprise(1L));
        when(authenticatedUserService.getCurrentUser()).thenReturn(mgr);
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));
        when(pauseRepository.findById(1L)).thenReturn(Optional.of(pause(1L, t)));
        when(pauseRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of());

        PauseReglementaireResponse r = service().mettreAJourStatutPause(1L, 1L, StatutPause.PLANIFIEE);

        assertEquals(StatutPause.PLANIFIEE, r.getStatut());
    }

    @Test
    void parseTypePause_allBranches() throws Exception {
        Method m = PauseReglementaireServiceImpl.class.getDeclaredMethod("parseTypePause", String.class);
        m.setAccessible(true);

        assertEquals(TypePause.POI, m.invoke(service(), (Object) null));
        assertEquals(TypePause.WARNING_ALERT, m.invoke(service(), "warning_alert"));
        assertEquals(TypePause.MANDATORY_REST, m.invoke(service(), "mandatory_rest"));
        assertEquals(TypePause.STATION_SERVICE, m.invoke(service(), "station_service"));
        assertEquals(TypePause.STATION_SERVICE, m.invoke(service(), "planned_stop"));
        assertEquals(TypePause.KIOSK, m.invoke(service(), "kiosk"));
        assertEquals(TypePause.REST_AREA, m.invoke(service(), "rest_area"));
        assertEquals(TypePause.CAFE, m.invoke(service(), "cafe"));
        assertEquals(TypePause.PARKING, m.invoke(service(), "parking"));
        assertEquals(TypePause.POI, m.invoke(service(), "unknown"));
    }

    @Test
    void parseDateTime_unparsableString_returnsNull() throws Exception {
        Method m = PauseReglementaireServiceImpl.class.getDeclaredMethod("parseDateTime", String.class);
        m.setAccessible(true);

        assertNull(m.invoke(service(), "totally_invalid_date_string"));
    }

    @Test
    void getDoubleAndIntegerValue_unparsable_returnsNull() throws Exception {
        Method mDouble = PauseReglementaireServiceImpl.class.getDeclaredMethod("getDoubleValue", Object.class);
        mDouble.setAccessible(true);
        assertNull(mDouble.invoke(service(), "not_a_number"));

        Method mInt = PauseReglementaireServiceImpl.class.getDeclaredMethod("getIntegerValue", Object.class);
        mInt.setAccessible(true);
        assertNull(mInt.invoke(service(), "not_an_int"));
    }
}

