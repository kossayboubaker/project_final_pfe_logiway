package com.logiway.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.logiway.dto.pause.PauseAIDashboardResponse;
import com.logiway.dto.pause.PauseAIPredictionResponse;
import com.logiway.entities.Chauffeur;
import com.logiway.entities.Entreprise;
import com.logiway.entities.Manager;
import com.logiway.entities.PauseAIPrediction;
import com.logiway.entities.PauseReglementaire;
import com.logiway.entities.Trajet;
import com.logiway.entities.Utilisateur;
import com.logiway.entities.Vehicule;
import com.logiway.entities.enums.Role;
import com.logiway.entities.enums.StatutPause;
import com.logiway.entities.enums.StatutTrajet;
import com.logiway.entities.enums.TypeAlerteIA;
import com.logiway.entities.enums.TypePause;
import com.logiway.exceptions.ResourceNotFoundException;
import com.logiway.repositories.PauseAIPredictionRepository;
import com.logiway.repositories.PauseReglementaireRepository;
import com.logiway.repositories.TrajetRepository;
import com.logiway.repositories.UtilisateurRepository;
import com.logiway.security.AuthenticatedUserService;
import com.logiway.services.NotificationRealtimeService;
import com.logiway.services.impl.PauseAIServiceImpl;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import java.lang.reflect.Method;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PauseAIServiceImplTest {

    private static final String URL = "http://pause-ai.test";

    @Mock
    private PauseAIPredictionRepository predictionRepository;
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

    private PauseAIServiceImpl service() {
        PauseAIServiceImpl s = new PauseAIServiceImpl(
            predictionRepository, pauseRepository, trajetRepository, authenticatedUserService,
            notificationRealtimeService, utilisateurRepository, restTemplate, realObjectMapper);
        ReflectionTestUtils.setField(s, "pauseAiUrl", URL);
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

    private Vehicule vehicule(Long id, String matricule) {
        return Vehicule.builder().id(id).matricule(matricule).build();
    }

    private Chauffeur chauffeur(Long id, String prenom, String nom, Manager mgr, Entreprise ent) {
        return Chauffeur.builder().id(id).prenom(prenom).nom(nom).email("c" + id + "@test.fr")
            .role(Role.CHAUFFEUR).manager(mgr).entreprise(ent).build();
    }

    private Trajet trajet(Long id, StatutTrajet statut, Chauffeur ch, Manager mgr, Vehicule veh,
                          Double distanceKm, LocalDateTime dateDepart, String pointDepart, String destination) {
        return Trajet.builder()
            .id(id).statut(statut).chauffeur(ch).manager(mgr).vehicule(veh)
            .distanceKm(distanceKm).dateDepart(dateDepart)
            .pointDepart(pointDepart).destination(destination)
            .build();
    }

    private PauseAIPrediction prediction(Long id, Trajet t, LocalDateTime ts, Double hours, Double ratio,
                                         Integer score, String poiType, boolean alerte, TypeAlerteIA type,
                                         Double lat, Double lon, String nom) {
        return PauseAIPrediction.builder()
            .id(id).trajet(t).timestamp(ts).hoursDriving(hours).distAlongRatio(ratio)
            .score(score).poiType(poiType).alerteDeclenchee(alerte).typeAlerte(type)
            .latitudePoi(lat).longitudePoi(lon).nomPoi(nom).distancePoiM(800.0)
            .build();
    }

    private PauseReglementaire pause(Long id, Trajet t, StatutPause statut, Integer durationSeconds) {
        return PauseReglementaire.builder()
            .id(id).trajet(t).type(TypePause.MANDATORY_REST).statut(statut)
            .latitude(46.0).longitude(4.0).durationSeconds(durationSeconds)
            .build();
    }

    private PauseAIDashboardResponse.ChauffeurStats statsFor(PauseAIDashboardResponse response, long id) {
        return response.getChauffeurStats().stream()
            .filter(s -> s.getChauffeurId().equals(id))
            .findFirst().orElseThrow();
    }

    // ========== verifierAPIFlaskAuDemarrage ==========

    @Test
    void verifierAPIFlask_healthCheckOk_returnsEarly() {
        when(restTemplate.getForEntity(anyString(), eq(String.class)))
            .thenReturn(ResponseEntity.ok("ok"));

        service().verifierAPIFlaskAuDemarrage();

        verify(restTemplate, times(1)).getForEntity(anyString(), eq(String.class));
    }

    @Test
    void verifierAPIFlask_allHealthChecksFail_triesAll() {
        when(restTemplate.getForEntity(anyString(), eq(String.class)))
            .thenThrow(new RuntimeException("connection refused"));

        service().verifierAPIFlaskAuDemarrage();

        verify(restTemplate, times(3)).getForEntity(anyString(), eq(String.class));
    }

    @Test
    void verifierAPIFlask_firstFails_secondSucceeds() {
        when(restTemplate.getForEntity(anyString(), eq(String.class)))
            .thenThrow(new RuntimeException("down"))
            .thenReturn(ResponseEntity.ok("ok"));

        service().verifierAPIFlaskAuDemarrage();

        verify(restTemplate, times(2)).getForEntity(anyString(), eq(String.class));
    }

    // ========== evaluerPause ==========

    @Test
    void evaluerPause_trajetNotFound_throwsResourceNotFound() {
        when(trajetRepository.findById(1L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service().evaluerPause(1L, 46.5, 4.5, 50.0));
    }

    @Test
    void evaluerPause_trajetNotEnCours_throwsIllegalState() {
        Trajet t = trajet(1L, StatutTrajet.COMPLETE, chauffeur(10L, "A", "A", null, null), null, null,
            100.0, LocalDateTime.now().minusHours(5), "Paris", "Lyon");
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));

        assertThrows(IllegalStateException.class, () -> service().evaluerPause(1L, 46.5, 4.5, 50.0));
    }

    @Test
    void evaluerPause_below3Hours_returnsNull() {
        Trajet t = trajet(1L, StatutTrajet.EN_COURS, chauffeur(10L, "A", "A", null, null), null, null,
            100.0, LocalDateTime.now().minusHours(2), "Paris", "Lyon");
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));
        when(pauseRepository.findByTrajetId(1L)).thenReturn(List.of());

        assertNull(service().evaluerPause(1L, 46.5, 4.5, 10.0));
    }

    @Test
    void evaluerPause_lastPredictionWithinInterval_returnsCachedPrediction() {
        Trajet t = trajet(1L, StatutTrajet.EN_COURS, chauffeur(10L, "A", "A", null, null), null, null,
            100.0, LocalDateTime.now().minusHours(5), "Paris", "Lyon");
        PauseAIPrediction last = prediction(50L, t, LocalDateTime.now().minusMinutes(1), 5.0, 0.5, 90,
            "services", true, TypeAlerteIA.URGENTE, 46.5, 4.5, "Aire");
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));
        when(pauseRepository.findByTrajetId(1L)).thenReturn(List.of());
        when(predictionRepository.findLastPredictionForTrajet(1L)).thenReturn(Optional.of(last));

        PauseAIPredictionResponse response = service().evaluerPause(1L, 46.5, 4.5, 50.0);

        assertEquals(50L, response.getId());
        assertEquals(90, response.getScore());
        assertEquals(TypeAlerteIA.URGENTE, response.getTypeAlerte());
        verify(restTemplate, never()).postForEntity(anyString(), any(), eq(String.class));
    }

    @Test
    void evaluerPause_happyPath_urgentAlert_ssesSent() {
        Chauffeur ch = chauffeur(10L, "Alice", "A", manager(20L), null);
        Trajet t = trajet(1L, StatutTrajet.EN_COURS, ch, manager(20L), vehicule(1L, "AB-123-CD"),
            100.0, LocalDateTime.now().minusHours(5), "Paris", "Lyon");
        Utilisateur superAdmin = user(Role.SUPERADMIN, 99L);
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));
        when(pauseRepository.findByTrajetId(1L)).thenReturn(List.of());
        when(predictionRepository.findLastPredictionForTrajet(1L)).thenReturn(Optional.empty());
        when(restTemplate.postForEntity(anyString(), any(), eq(String.class)))
            .thenReturn(ResponseEntity.ok("{\"scores\":[{\"ai_score\":90}]}"));
        when(predictionRepository.save(any(PauseAIPrediction.class))).thenAnswer(inv -> {
            PauseAIPrediction p = inv.getArgument(0);
            p.setId(5L);
            return p;
        });
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of(superAdmin));

        PauseAIPredictionResponse response = service().evaluerPause(1L, 46.5, 4.5, 50.0);

        assertEquals(5L, response.getId());
        assertEquals(1L, response.getTrajetId());
        assertEquals(90, response.getScore());
        assertEquals(TypeAlerteIA.URGENTE, response.getTypeAlerte());
        assertEquals(true, response.getAlerteDeclenchee());
        assertEquals("BAS_COTE", response.getPoiType());
        assertEquals("Arrêt bas-côté", response.getNomPoi());
        assertEquals(800.0, response.getDistancePoiM());
        assertEquals(46.5, response.getLatitudePoi());
        assertEquals(4.5, response.getLongitudePoi());
        assertEquals(5.0, response.getHoursDriving(), 0.1);
        assertEquals(0.5, response.getDistAlongRatio(), 0.01);
        verify(predictionRepository, times(1)).save(any(PauseAIPrediction.class));
        verify(notificationRealtimeService).publishNamedEventToUsers(
            argThat(col -> col.size() == 3
                && col.containsAll(Arrays.asList(10L, 20L, 99L))),
            eq("PAUSE_AI_ALERT"),
            argThat(payload -> payload instanceof Map
                && ((Map<?, ?>) payload).get("predictionId").equals(5L)));
    }

    @Test
    void evaluerPause_scoreRecommended_alertSent() {
        Chauffeur ch = chauffeur(10L, "Alice", "A", manager(20L), null);
        Trajet t = trajet(1L, StatutTrajet.EN_COURS, ch, manager(20L), null,
            100.0, LocalDateTime.now().minusHours(4), "Paris", "Lyon");
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));
        when(pauseRepository.findByTrajetId(1L)).thenReturn(List.of());
        when(predictionRepository.findLastPredictionForTrajet(1L)).thenReturn(Optional.empty());
        when(restTemplate.postForEntity(anyString(), any(), eq(String.class)))
            .thenReturn(ResponseEntity.ok("{\"scores\":[{\"ai_score\":75}]}"));
        when(predictionRepository.save(any(PauseAIPrediction.class))).thenAnswer(inv -> {
            PauseAIPrediction p = inv.getArgument(0);
            p.setId(6L);
            return p;
        });
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of());

        PauseAIPredictionResponse response = service().evaluerPause(1L, 46.5, 4.5, 50.0);

        assertEquals(TypeAlerteIA.RECOMMANDEE, response.getTypeAlerte());
        assertEquals(true, response.getAlerteDeclenchee());
        verify(notificationRealtimeService, times(1))
            .publishNamedEventToUsers(anyCollection(), eq("PAUSE_AI_ALERT"), any());
    }

    @Test
    void evaluerPause_scoreBelowThreshold_noAlert() {
        Trajet t = trajet(1L, StatutTrajet.EN_COURS, chauffeur(10L, "A", "A", null, null), null, null,
            100.0, LocalDateTime.now().minusHours(4), "Paris", "Lyon");
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));
        when(pauseRepository.findByTrajetId(1L)).thenReturn(List.of());
        when(predictionRepository.findLastPredictionForTrajet(1L)).thenReturn(Optional.empty());
        when(restTemplate.postForEntity(anyString(), any(), eq(String.class)))
            .thenReturn(ResponseEntity.ok("{\"scores\":[{\"ai_score\":50}]}"));
        when(predictionRepository.save(any(PauseAIPrediction.class))).thenAnswer(inv -> {
            PauseAIPrediction p = inv.getArgument(0);
            p.setId(7L);
            return p;
        });

        PauseAIPredictionResponse response = service().evaluerPause(1L, 46.5, 4.5, 50.0);

        assertEquals(TypeAlerteIA.AUCUNE, response.getTypeAlerte());
        assertEquals(false, response.getAlerteDeclenchee());
        verify(notificationRealtimeService, never())
            .publishNamedEventToUsers(anyCollection(), anyString(), any());
    }

    @Test
    void evaluerPause_flaskDown_aboveCriticalHours_urgentFallback() {
        Trajet t = trajet(1L, StatutTrajet.EN_COURS, chauffeur(10L, "A", "A", null, null), null, null,
            100.0, LocalDateTime.now().minusHours(6), "Paris", "Lyon");
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));
        when(pauseRepository.findByTrajetId(1L)).thenReturn(List.of());
        when(predictionRepository.findLastPredictionForTrajet(1L)).thenReturn(Optional.empty());
        when(restTemplate.postForEntity(anyString(), any(), eq(String.class)))
            .thenThrow(new RuntimeException("flask down"));
        when(predictionRepository.save(any(PauseAIPrediction.class))).thenAnswer(inv -> {
            PauseAIPrediction p = inv.getArgument(0);
            p.setId(8L);
            return p;
        });
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of());

        PauseAIPredictionResponse response = service().evaluerPause(1L, 46.5, 4.5, 50.0);

        assertEquals(100, response.getScore());
        assertEquals(TypeAlerteIA.URGENTE, response.getTypeAlerte());
        assertEquals(true, response.getAlerteDeclenchee());
    }

    @Test
    void evaluerPause_flaskDown_belowCriticalHours_noAlertFallback() {
        Trajet t = trajet(1L, StatutTrajet.EN_COURS, chauffeur(10L, "A", "A", null, null), null, null,
            100.0, LocalDateTime.now().minusHours(4), "Paris", "Lyon");
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));
        when(pauseRepository.findByTrajetId(1L)).thenReturn(List.of());
        when(predictionRepository.findLastPredictionForTrajet(1L)).thenReturn(Optional.empty());
        when(restTemplate.postForEntity(anyString(), any(), eq(String.class)))
            .thenThrow(new RuntimeException("flask down"));
        when(predictionRepository.save(any(PauseAIPrediction.class))).thenAnswer(inv -> {
            PauseAIPrediction p = inv.getArgument(0);
            p.setId(9L);
            return p;
        });

        PauseAIPredictionResponse response = service().evaluerPause(1L, 46.5, 4.5, 40.0);

        assertEquals(0, response.getScore());
        assertEquals(TypeAlerteIA.AUCUNE, response.getTypeAlerte());
        assertEquals(false, response.getAlerteDeclenchee());
        verify(notificationRealtimeService, never())
            .publishNamedEventToUsers(anyCollection(), anyString(), any());
    }

    @Test
    void evaluerPause_flaskEmptyScores_fallbackApplied() {
        Trajet t = trajet(1L, StatutTrajet.EN_COURS, chauffeur(10L, "A", "A", null, null), null, null,
            100.0, LocalDateTime.now().minusHours(4), "Paris", "Lyon");
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));
        when(pauseRepository.findByTrajetId(1L)).thenReturn(List.of());
        when(predictionRepository.findLastPredictionForTrajet(1L)).thenReturn(Optional.empty());
        when(restTemplate.postForEntity(anyString(), any(), eq(String.class)))
            .thenReturn(ResponseEntity.ok("{}"));
        when(predictionRepository.save(any(PauseAIPrediction.class))).thenAnswer(inv -> {
            PauseAIPrediction p = inv.getArgument(0);
            p.setId(10L);
            return p;
        });

        PauseAIPredictionResponse response = service().evaluerPause(1L, 46.5, 4.5, 40.0);

        assertEquals(0, response.getScore());
        assertEquals(TypeAlerteIA.AUCUNE, response.getTypeAlerte());
    }

    @Test
    void evaluerPause_flaskInvalidScoreFormat_fallbackApplied() {
        Trajet t = trajet(1L, StatutTrajet.EN_COURS, chauffeur(10L, "A", "A", null, null), null, null,
            100.0, LocalDateTime.now().minusHours(4), "Paris", "Lyon");
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));
        when(pauseRepository.findByTrajetId(1L)).thenReturn(List.of());
        when(predictionRepository.findLastPredictionForTrajet(1L)).thenReturn(Optional.empty());
        when(restTemplate.postForEntity(anyString(), any(), eq(String.class)))
            .thenReturn(ResponseEntity.ok("{\"scores\":[{\"ai_score\":\"high\"}]}"));
        when(predictionRepository.save(any(PauseAIPrediction.class))).thenAnswer(inv -> {
            PauseAIPrediction p = inv.getArgument(0);
            p.setId(11L);
            return p;
        });

        PauseAIPredictionResponse response = service().evaluerPause(1L, 46.5, 4.5, 40.0);

        assertEquals(0, response.getScore());
        assertEquals(TypeAlerteIA.AUCUNE, response.getTypeAlerte());
    }

    // ========== getHistoriquePredictions ==========

    @Test
    void getHistoriquePredictions_trajetNotFound_throwsResourceNotFound() {
        when(trajetRepository.findById(1L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service().getHistoriquePredictions(1L));
    }

    @Test
    void getHistoriquePredictions_superadmin_success() {
        Chauffeur ch = chauffeur(10L, "Alice", "A", null, null);
        Trajet t = trajet(1L, StatutTrajet.EN_COURS, ch, null, null, 100.0, LocalDateTime.now(), "Paris", "Lyon");
        when(authenticatedUserService.getCurrentUser()).thenReturn(user(Role.SUPERADMIN, 99L));
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));
        when(predictionRepository.findByTrajetIdOrderByTimestampAsc(1L))
            .thenReturn(List.of(prediction(1L, t, LocalDateTime.now(), 5.0, 0.5, 90, "services",
                true, TypeAlerteIA.URGENTE, 46.5, 4.5, "Aire")));

        List<PauseAIPredictionResponse> result = service().getHistoriquePredictions(1L);

        assertEquals(1, result.size());
        assertEquals(1L, result.get(0).getId());
    }

    @Test
    void getHistoriquePredictions_chauffeurOwner_success() {
        Chauffeur ch = chauffeur(10L, "Alice", "A", null, null);
        Trajet t = trajet(1L, StatutTrajet.EN_COURS, ch, null, null, 100.0, LocalDateTime.now(), "Paris", "Lyon");
        when(authenticatedUserService.getCurrentUser()).thenReturn(user(Role.CHAUFFEUR, 10L));
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));
        when(predictionRepository.findByTrajetIdOrderByTimestampAsc(1L)).thenReturn(List.of());

        assertEquals(0, service().getHistoriquePredictions(1L).size());
    }

    @Test
    void getHistoriquePredictions_chauffeurOther_denied() {
        Chauffeur ch = chauffeur(10L, "Alice", "A", null, null);
        Trajet t = trajet(1L, StatutTrajet.EN_COURS, ch, null, null, 100.0, LocalDateTime.now(), "Paris", "Lyon");
        when(authenticatedUserService.getCurrentUser()).thenReturn(user(Role.CHAUFFEUR, 11L));
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));

        ResourceNotFoundException ex = assertThrows(ResourceNotFoundException.class,
            () -> service().getHistoriquePredictions(1L));
        assertEquals("Accès refusé", ex.getMessage());
    }

    @Test
    void getHistoriquePredictions_managerOfChauffeur_success() {
        Chauffeur ch = chauffeur(10L, "Alice", "A", manager(20L), null);
        Trajet t = trajet(1L, StatutTrajet.EN_COURS, ch, null, null, 100.0, LocalDateTime.now(), "Paris", "Lyon");
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager(20L));
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));
        when(predictionRepository.findByTrajetIdOrderByTimestampAsc(1L)).thenReturn(List.of());

        assertEquals(0, service().getHistoriquePredictions(1L).size());
    }

    @Test
    void getHistoriquePredictions_managerSameCompany_success() {
        Chauffeur ch = chauffeur(10L, "Alice", "A", null, entreprise(1L));
        Trajet t = trajet(1L, StatutTrajet.EN_COURS, ch, null, null, 100.0, LocalDateTime.now(), "Paris", "Lyon");
        Manager mgr = manager(20L);
        mgr.setEntreprise(entreprise(1L));
        when(authenticatedUserService.getCurrentUser()).thenReturn(mgr);
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));
        when(predictionRepository.findByTrajetIdOrderByTimestampAsc(1L)).thenReturn(List.of());

        assertEquals(0, service().getHistoriquePredictions(1L).size());
    }

    @Test
    void getHistoriquePredictions_managerOther_denied() {
        Chauffeur ch = chauffeur(10L, "Alice", "A", manager(999L), entreprise(2L));
        Trajet t = trajet(1L, StatutTrajet.EN_COURS, ch, null, null, 100.0, LocalDateTime.now(), "Paris", "Lyon");
        Manager mgr = manager(20L);
        mgr.setEntreprise(entreprise(1L));
        when(authenticatedUserService.getCurrentUser()).thenReturn(mgr);
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));

        ResourceNotFoundException ex = assertThrows(ResourceNotFoundException.class,
            () -> service().getHistoriquePredictions(1L));
        assertEquals("Accès refusé", ex.getMessage());
    }

    @Test
    void getHistoriquePredictions_unknownRole_denied() {
        Chauffeur ch = chauffeur(10L, "Alice", "A", null, null);
        Trajet t = trajet(1L, StatutTrajet.EN_COURS, ch, null, null, 100.0, LocalDateTime.now(), "Paris", "Lyon");
        Utilisateur noRole = Utilisateur.builder().id(50L).prenom("X").nom("Y").email("x@test.fr").build();
        when(authenticatedUserService.getCurrentUser()).thenReturn(noRole);
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));

        ResourceNotFoundException ex = assertThrows(ResourceNotFoundException.class,
            () -> service().getHistoriquePredictions(1L));
        assertEquals("Accès refusé", ex.getMessage());
    }

    // ========== getPausesCompletes ==========

    @Test
    void getPausesCompletes_trajetNotFound_throwsResourceNotFound() {
        when(trajetRepository.findById(1L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service().getPausesCompletes(1L));
    }

    @Test
    void getPausesCompletes_unauthorized_denied() {
        Chauffeur ch = chauffeur(10L, "Alice", "A", null, null);
        Trajet t = trajet(1L, StatutTrajet.EN_COURS, ch, null, null, 100.0, LocalDateTime.now(), "Paris", "Lyon");
        when(authenticatedUserService.getCurrentUser()).thenReturn(user(Role.CHAUFFEUR, 11L));
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));

        ResourceNotFoundException ex = assertThrows(ResourceNotFoundException.class,
            () -> service().getPausesCompletes(1L));
        assertEquals("Accès refusé", ex.getMessage());
    }

    @Test
    void getPausesCompletes_success_mapsLatLon() {
        Trajet t = Trajet.builder()
            .id(1L).statut(StatutTrajet.EN_COURS).chauffeur(chauffeur(10L, "A", "A", null, null))
            .latitudeDepart(48.85).longitudeDepart(2.35).latitudeArrivee(45.75).longitudeArrivee(4.85)
            .dureeEstimeeMinutes(300).dateDepart(LocalDateTime.now())
            .build();
        when(authenticatedUserService.getCurrentUser()).thenReturn(user(Role.SUPERADMIN, 99L));
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));
        Map<String, Object> body = Map.of(
            "stops", List.of(Map.of("lat", 48.0, "lon", 2.3, "type", "services")),
            "meta", Map.of());
        when(restTemplate.postForEntity(anyString(), any(), eq(Map.class)))
            .thenReturn(ResponseEntity.ok(body));

        Map<String, Object> result = service().getPausesCompletes(1L);

        List<Map<String, Object>> stops = (List<Map<String, Object>>) result.get("stops");
        assertEquals(1, stops.size());
        assertEquals(48.0, stops.get(0).get("latitude"));
        assertEquals(2.3, stops.get(0).get("longitude"));
        assertEquals("services", stops.get(0).get("type"));
    }

    @Test
    void getPausesCompletes_nullBody_returnsEmpty() {
        Trajet t = Trajet.builder()
            .id(1L).statut(StatutTrajet.EN_COURS).chauffeur(chauffeur(10L, "A", "A", null, null))
            .latitudeDepart(48.85).longitudeDepart(2.35).latitudeArrivee(45.75).longitudeArrivee(4.85)
            .build();
        when(authenticatedUserService.getCurrentUser()).thenReturn(user(Role.SUPERADMIN, 99L));
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));
        when(restTemplate.postForEntity(anyString(), any(), eq(Map.class)))
            .thenReturn(ResponseEntity.ok((Map<String, Object>) null));

        Map<String, Object> result = service().getPausesCompletes(1L);

        assertEquals(List.of(), result.get("stops"));
    }

    @Test
    void getPausesCompletes_flaskError_throwsRuntime() {
        Trajet t = Trajet.builder()
            .id(1L).statut(StatutTrajet.EN_COURS).chauffeur(chauffeur(10L, "A", "A", null, null))
            .latitudeDepart(48.85).longitudeDepart(2.35).latitudeArrivee(45.75).longitudeArrivee(4.85)
            .build();
        when(authenticatedUserService.getCurrentUser()).thenReturn(user(Role.SUPERADMIN, 99L));
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));
        when(restTemplate.postForEntity(anyString(), any(), eq(Map.class)))
            .thenThrow(new RuntimeException("flask error"));

        RuntimeException ex = assertThrows(RuntimeException.class, () -> service().getPausesCompletes(1L));
        assertEquals("Impossible de récupérer les pauses complètes depuis l'API Flask", ex.getMessage());
    }

    // ========== getDashboardStats ==========

    @Test
    void getDashboardStats_superadmin_withChauffeurId() {
        Chauffeur ch = chauffeur(10L, "Alice", "A", null, null);
        Trajet t = trajet(1L, StatutTrajet.EN_COURS, ch, null, null, 100.0, LocalDateTime.now(), "Paris", "Lyon");
        PauseAIPrediction p1 = prediction(1L, t, LocalDateTime.now(), 6.0, 0.5, 90, "services",
            true, TypeAlerteIA.URGENTE, 46.0, 4.0, "Aire");
        when(authenticatedUserService.getCurrentUser()).thenReturn(user(Role.SUPERADMIN, 99L));
        when(predictionRepository.findByChauffeurIdAndDateRange(eq(10L), any(), any())).thenReturn(List.of(p1));
        when(pauseRepository.findByTrajetId(1L)).thenReturn(List.of());

        PauseAIDashboardResponse response = service().getDashboardStats(
            LocalDateTime.now().minusDays(7), LocalDateTime.now(), 10L);

        assertEquals(1, response.getTotalPausesRecommandees());
        assertEquals(1, response.getChauffeurStats().size());
        assertEquals(10L, response.getChauffeurStats().get(0).getChauffeurId());
    }

    @Test
    void getDashboardStats_superadmin_all() {
        Chauffeur ch = chauffeur(10L, "Alice", "A", null, null);
        Trajet t = trajet(1L, StatutTrajet.EN_COURS, ch, null, null, 100.0, LocalDateTime.now(), "Paris", "Lyon");
        PauseAIPrediction p1 = prediction(1L, t, LocalDateTime.now(), 6.0, 0.5, 90, "services",
            true, TypeAlerteIA.URGENTE, 46.0, 4.0, "Aire");
        when(authenticatedUserService.getCurrentUser()).thenReturn(user(Role.SUPERADMIN, 99L));
        when(predictionRepository.findByDateRange(any(), any())).thenReturn(List.of(p1));
        when(pauseRepository.findByTrajetId(1L)).thenReturn(List.of());

        PauseAIDashboardResponse response = service().getDashboardStats(
            LocalDateTime.now().minusDays(7), LocalDateTime.now(), null);

        assertEquals(1, response.getTotalPausesRecommandees());
    }

    @Test
    void getDashboardStats_emptyPredictions() {
        when(authenticatedUserService.getCurrentUser()).thenReturn(user(Role.SUPERADMIN, 99L));
        when(predictionRepository.findByDateRange(any(), any())).thenReturn(List.of());

        PauseAIDashboardResponse response = service().getDashboardStats(
            LocalDateTime.now().minusDays(7), LocalDateTime.now(), null);

        assertEquals(0, response.getTotalPausesRecommandees());
        assertEquals(0, response.getChauffeurStats().size());
        assertEquals(0.0, response.getMlInsights().getScoreFatigueMax(), 0.01);
        assertEquals("N/A", response.getMlInsights().getChauffeurPlusRisque());
    }

    @Test
    void getDashboardStats_manager_noEntreprise_throwsIllegalState() {
        when(authenticatedUserService.getCurrentUser()).thenReturn(manager(20L));

        assertThrows(IllegalStateException.class, () -> service().getDashboardStats(
            LocalDateTime.now().minusDays(7), LocalDateTime.now(), null));
    }

    @Test
    void getDashboardStats_manager_chauffeurOtherCompany_throwsNotFound() {
        Chauffeur ch = chauffeur(10L, "Alice", "A", null, entreprise(2L));
        Trajet t = trajet(1L, StatutTrajet.EN_COURS, ch, null, null, 100.0, LocalDateTime.now(), "Paris", "Lyon");
        PauseAIPrediction p1 = prediction(1L, t, LocalDateTime.now(), 6.0, 0.5, 90, "services",
            true, TypeAlerteIA.URGENTE, 46.0, 4.0, "Aire");
        Manager mgr = manager(20L);
        mgr.setEntreprise(entreprise(1L));
        when(authenticatedUserService.getCurrentUser()).thenReturn(mgr);
        when(predictionRepository.findByChauffeurIdAndDateRange(eq(10L), any(), any())).thenReturn(List.of(p1));

        ResourceNotFoundException ex = assertThrows(ResourceNotFoundException.class, () -> service()
            .getDashboardStats(LocalDateTime.now().minusDays(7), LocalDateTime.now(), 10L));
        assertEquals("Chauffeur non accessible", ex.getMessage());
    }

    @Test
    void getDashboardStats_manager_chauffeurSameCompany_success() {
        Chauffeur ch = chauffeur(10L, "Alice", "A", null, entreprise(1L));
        Trajet t = trajet(1L, StatutTrajet.EN_COURS, ch, null, null, 100.0, LocalDateTime.now(), "Paris", "Lyon");
        PauseAIPrediction p1 = prediction(1L, t, LocalDateTime.now(), 6.0, 0.5, 90, "services",
            true, TypeAlerteIA.URGENTE, 46.0, 4.0, "Aire");
        Manager mgr = manager(20L);
        mgr.setEntreprise(entreprise(1L));
        when(authenticatedUserService.getCurrentUser()).thenReturn(mgr);
        when(predictionRepository.findByChauffeurIdAndDateRange(eq(10L), any(), any())).thenReturn(List.of(p1));
        when(pauseRepository.findByTrajetId(1L)).thenReturn(List.of());

        PauseAIDashboardResponse response = service().getDashboardStats(
            LocalDateTime.now().minusDays(7), LocalDateTime.now(), 10L);

        assertEquals(1, response.getTotalPausesRecommandees());
    }

    @Test
    void getDashboardStats_manager_entrepriseWide() {
        Chauffeur ch = chauffeur(10L, "Alice", "A", null, entreprise(1L));
        Trajet t = trajet(1L, StatutTrajet.EN_COURS, ch, null, null, 100.0, LocalDateTime.now(), "Paris", "Lyon");
        PauseAIPrediction p1 = prediction(1L, t, LocalDateTime.now(), 6.0, 0.5, 90, "services",
            true, TypeAlerteIA.URGENTE, 46.0, 4.0, "Aire");
        Manager mgr = manager(20L);
        mgr.setEntreprise(entreprise(1L));
        when(authenticatedUserService.getCurrentUser()).thenReturn(mgr);
        when(predictionRepository.findByEntrepriseIdAndDateRange(eq(1L), any(), any())).thenReturn(List.of(p1));
        when(pauseRepository.findByTrajetId(1L)).thenReturn(List.of());

        PauseAIDashboardResponse response = service().getDashboardStats(
            LocalDateTime.now().minusDays(7), LocalDateTime.now(), null);

        assertEquals(1, response.getTotalPausesRecommandees());
    }

    @Test
    void getDashboardStats_roleNotAuthorized_throwsIllegalState() {
        when(authenticatedUserService.getCurrentUser()).thenReturn(user(Role.CHAUFFEUR, 10L));

        assertThrows(IllegalStateException.class, () -> service().getDashboardStats(
            LocalDateTime.now().minusDays(7), LocalDateTime.now(), null));
    }

    @Test
    void getDashboardStats_fullStats_computesEverything() {
        LocalDateTime start = LocalDateTime.now().minusDays(7);
        LocalDateTime end = LocalDateTime.now();

        Chauffeur a = chauffeur(10L, "Alice", "A", manager(20L), null);
        Chauffeur b = chauffeur(11L, "Bob", "B", manager(21L), null);
        Chauffeur c = chauffeur(12L, "Charlie", "C", null, null);
        Chauffeur d = chauffeur(13L, "Dana", "D", null, null);

        Trajet t1 = Trajet.builder().id(100L).statut(StatutTrajet.COMPLETE).chauffeur(a)
            .vehicule(vehicule(1L, "AB-123-CD")).distanceKm(500.0)
            .dateDepart(LocalDateTime.now().minusDays(3))
            .dateArriveeReelle(LocalDateTime.now().minusDays(3).plusHours(5))
            .pointDepart("Paris").destination("Lyon").build();
        Trajet t2 = Trajet.builder().id(101L).statut(StatutTrajet.EN_COURS).chauffeur(b)
            .vehicule(vehicule(2L, "XY-456-Z")).distanceKm(800.0)
            .dateDepart(LocalDateTime.now().minusHours(6)).dureeEstimeeMinutes(300)
            .latitudeDepart(48.85).longitudeDepart(2.35)
            .pointDepart("Paris").destination("Marseille").build();
        Trajet t3 = Trajet.builder().id(102L).statut(StatutTrajet.EN_COURS).chauffeur(c)
            .distanceKm(300.0).dateDepart(LocalDateTime.now().minusHours(4)).dureeEstimeeMinutes(240)
            .pointDepart("Lyon").destination("Nice").build();
        Trajet t4 = Trajet.builder().id(103L).statut(StatutTrajet.EN_COURS).chauffeur(d)
            .distanceKm(400.0).dateDepart(LocalDateTime.now().minusHours(4))
            .pointDepart("Nice").destination("Lyon").build();

        List<PauseAIPrediction> predictions = new ArrayList<>();
        for (long i = 1; i <= 9; i++) {
            LocalDateTime ts = i == 1 ? LocalDateTime.now().minusDays(2).withHour(12)
                : i == 2 ? LocalDateTime.now().minusDays(2).withHour(23)
                : LocalDateTime.now().minusDays(2).withHour(10);
            predictions.add(prediction(i, t1, ts, 6.0, 0.5, 90, "services",
                true, TypeAlerteIA.URGENTE, 46.0, 4.0, "Aire A"));
        }
        predictions.add(prediction(10L, t2, LocalDateTime.now().minusDays(1).withHour(10), 5.5, 0.3, 80, "fuel",
            true, TypeAlerteIA.URGENTE, 46.0, 4.0, "Station B"));
        predictions.add(prediction(11L, t2, LocalDateTime.now().minusDays(1).withHour(19), 6.0, 0.7, 80, "restaurant",
            true, TypeAlerteIA.RECOMMANDEE, 46.2, 4.1, "Resto B"));
        predictions.add(prediction(12L, t3, LocalDateTime.now().withHour(12), 3.2, 0.2, 30, null,
            false, TypeAlerteIA.AUCUNE, null, null, null));
        predictions.add(prediction(13L, t4, LocalDateTime.now().withHour(12), 4.0, 0.5, 60, null,
            false, TypeAlerteIA.AUCUNE, null, null, null));

        when(authenticatedUserService.getCurrentUser()).thenReturn(user(Role.SUPERADMIN, 99L));
        when(predictionRepository.findByDateRange(any(), any())).thenReturn(predictions);
        when(pauseRepository.findByTrajetId(100L)).thenReturn(List.of());
        when(pauseRepository.findByTrajetId(101L)).thenReturn(List.of(pause(30L, t2, StatutPause.ATTEINTE, 900)));
        when(pauseRepository.findByTrajetId(102L)).thenReturn(List.of(pause(31L, t3, StatutPause.ATTEINTE, 600)));
        when(pauseRepository.findByTrajetId(103L)).thenReturn(List.of());

        PauseAIDashboardResponse response = service().getDashboardStats(start, end, null);

        assertEquals(11, response.getTotalPausesRecommandees());
        assertEquals(2, response.getPausesEffectuees());
        assertEquals(9, response.getPausesIgnorees());
        assertEquals(18.18, response.getTauxConformite(), 0.01);
        assertEquals(81.54, response.getScoreMoyenFatigue(), 0.01);
        assertEquals(4, response.getChauffeurStats().size());

        PauseAIDashboardResponse.ChauffeurStats sa = statsFor(response, 10L);
        assertEquals("CRITICAL", sa.getNiveauRisque());
        assertEquals("VERY_DISSATISFIED", sa.getSentiment());
        assertEquals(90.0, sa.getScoreFatigueMoyen(), 0.01);
        assertEquals(9, sa.getAlertesUrgentes());
        assertEquals(0.0, sa.getTauxConformite(), 0.01);
        assertEquals("COMPLETE", sa.getStatutTrajet());
        assertEquals("AB-123-CD", sa.getImmatriculationVehicule());
        assertEquals(t1.getDateArriveeReelle(), sa.getArriveeEstimee());
        assertEquals(500.0, sa.getDistanceReelle(), 0.01);
        assertEquals("Paris", sa.getPointDepart());
        assertEquals("Lyon", sa.getPointArrivee());

        PauseAIDashboardResponse.ChauffeurStats sb = statsFor(response, 11L);
        assertEquals("HIGH", sb.getNiveauRisque());
        assertEquals("DISSATISFIED", sb.getSentiment());
        assertEquals(100.0, sb.getTauxConformite(), 0.01);
        assertEquals("EN_COURS", sb.getStatutTrajet());
        assertEquals(t2.getDateDepart().plusMinutes(300), sb.getArriveeEstimee());
        assertEquals("XY-456-Z", sb.getImmatriculationVehicule());
        assertTrue(sb.getDistanceReelle() > 0);

        PauseAIDashboardResponse.ChauffeurStats sc = statsFor(response, 12L);
        assertEquals("LOW", sc.getNiveauRisque());
        assertEquals("SATISFIED", sc.getSentiment());

        PauseAIDashboardResponse.ChauffeurStats sd = statsFor(response, 13L);
        assertEquals("MODERATE", sd.getNiveauRisque());
        assertEquals("NEUTRAL", sd.getSentiment());

        PauseAIDashboardResponse.MLInsights ml = response.getMlInsights();
        assertEquals(1, ml.getChauffeursCritiquesFatigue());
        assertEquals(1, ml.getChauffeursModereesFatigue());
        assertEquals(90.0, ml.getScoreFatigueMax(), 0.01);
        assertEquals("Alice A", ml.getChauffeurPlusRisque());
        assertEquals(0.0, ml.getTendanceConformite(), 0.01);
        assertEquals(-17.46, ml.getTendanceScoreFatigue(), 0.01);
        assertEquals(4, ml.getPausesHeuresRepas());
        assertEquals(1, ml.getPausesNuit());
        assertEquals(81.82, ml.getTauxPausesMiParcours(), 0.01);
        assertEquals(18.18, ml.getTauxAcceptationAI(), 0.01);
        assertEquals(1, ml.getPausesVolontaires());
        assertEquals(80.0, ml.getScoreMoyenPausesEffectuees(), 0.01);

        assertEquals(11, response.getHeatmapPoints().size());
        assertTrue(response.getHeatmapPoints().stream().anyMatch(p -> "URGENTE_IGNOREE".equals(p.getType())));
        assertTrue(response.getHeatmapPoints().stream().anyMatch(p -> "RECOMMANDEE_EFFECTUEE".equals(p.getType())));
    }

    @Test
    void getDashboardStats_recommandeeIgnoree_parkingAndUnknownPoiType() {
        Chauffeur ch = chauffeur(10L, "Alice", "A", null, null);
        Trajet t1 = trajet(1L, StatutTrajet.EN_COURS, ch, null, null, 100.0,
            LocalDateTime.now().minusHours(5), "Paris", "Lyon");
        Trajet t2 = trajet(2L, StatutTrajet.EN_COURS, ch, null, null, 200.0,
            LocalDateTime.now().minusHours(5), "Paris", "Nice");
        PauseAIPrediction parking = prediction(1L, t1, LocalDateTime.now(), 5.0, 0.5, 75, "parking",
            true, TypeAlerteIA.RECOMMANDEE, 46.0, 4.0, "Parking A");
        PauseAIPrediction unknown = prediction(2L, t2, LocalDateTime.now(), 5.5, 0.6, 75, "unknown",
            true, TypeAlerteIA.RECOMMANDEE, 46.1, 4.1, "Zone X");
        when(authenticatedUserService.getCurrentUser()).thenReturn(user(Role.SUPERADMIN, 99L));
        when(predictionRepository.findByDateRange(any(), any())).thenReturn(List.of(parking, unknown));
        when(pauseRepository.findByTrajetId(1L)).thenReturn(List.of());
        when(pauseRepository.findByTrajetId(2L)).thenReturn(List.of());

        PauseAIDashboardResponse response = service().getDashboardStats(
            LocalDateTime.now().minusDays(7), LocalDateTime.now(), null);

        assertEquals(2, response.getHeatmapPoints().size());
        assertTrue(response.getHeatmapPoints().stream()
            .allMatch(p -> "RECOMMANDEE_IGNOREE".equals(p.getType())));
        assertTrue(response.getHeatmapPoints().stream().anyMatch(p -> p.getAccessibilityScore() == 55));
        assertTrue(response.getHeatmapPoints().stream().anyMatch(p -> p.getAccessibilityScore() == 40));
        assertEquals(40.0, response.getChauffeurStats().get(0).getScoreMoyenAccessibilite(), 0.01);
    }

    // ========== exportDashboardCsv ==========

    @Test
    void exportDashboardCsv_empty_returnsHeaderOnly() {
        when(authenticatedUserService.getCurrentUser()).thenReturn(user(Role.SUPERADMIN, 99L));
        when(predictionRepository.findByDateRange(any(), any())).thenReturn(List.of());

        String csv = service().exportDashboardCsv(LocalDateTime.now().minusDays(7), LocalDateTime.now(), null);

        assertEquals("chauffeur,date trajet,trajet,score moyen,alertes urgentes,pauses effectuees,pauses ignorees,taux conformite\n", csv);
    }

    @Test
    void exportDashboardCsv_withPredictions_buildsRows() {
        Chauffeur ch = chauffeur(10L, "Alice", "A", null, null);
        Trajet t1 = trajet(1L, StatutTrajet.EN_COURS, ch, null, null, 100.0,
            LocalDateTime.of(2026, 8, 1, 8, 0), "Paris", "Lyon");
        List<PauseAIPrediction> predictions = List.of(
            prediction(1L, t1, LocalDateTime.now(), 6.0, 0.5, 90, "services",
                true, TypeAlerteIA.URGENTE, 46.0, 4.0, "Aire"),
            prediction(2L, t1, LocalDateTime.now(), 6.5, 0.6, 80, "fuel",
                true, TypeAlerteIA.RECOMMANDEE, 46.0, 4.0, "Station"));
        when(authenticatedUserService.getCurrentUser()).thenReturn(user(Role.SUPERADMIN, 99L));
        when(predictionRepository.findByDateRange(any(), any())).thenReturn(predictions);
        when(pauseRepository.findByTrajetId(1L)).thenReturn(List.of(pause(30L, t1, StatutPause.ATTEINTE, 900)));

        String csv = service().exportDashboardCsv(LocalDateTime.now().minusDays(7), LocalDateTime.now(), null);

        String[] lines = csv.split("\n");
        assertEquals(2, lines.length);
        assertTrue(lines[1].contains("\"Alice A\""));
        assertTrue(lines[1].contains("\"Paris - Lyon\""));
        assertTrue(lines[1].contains("85.00"));
        assertTrue(lines[1].contains("1,2,0,100.00"));
    }

    @Test
    void exportDashboardCsv_noChauffeurNoDate_fallbackValues() {
        Trajet t5 = trajet(5L, StatutTrajet.EN_COURS, null, null, null, 100.0, null, null, null);
        PauseAIPrediction p = prediction(1L, t5, LocalDateTime.of(2026, 8, 1, 8, 0), 6.0, 0.5, 70,
            "services", true, TypeAlerteIA.URGENTE, 46.0, 4.0, "Aire");
        when(authenticatedUserService.getCurrentUser()).thenReturn(user(Role.SUPERADMIN, 99L));
        when(predictionRepository.findByDateRange(any(), any())).thenReturn(List.of(p));
        when(pauseRepository.findByTrajetId(5L)).thenReturn(List.of());

        String csv = service().exportDashboardCsv(LocalDateTime.now().minusDays(7), LocalDateTime.now(), null);

        String[] lines = csv.split("\n");
        assertEquals(2, lines.length);
        assertTrue(lines[1].contains("\"N/A\""));
        assertTrue(lines[1].contains("\"Départ - Arrivée\""));
        assertTrue(lines[1].contains("70.00,1,0,1,0.00"));
    }

    // ========== Méthodes privées via réflexion ==========

    @Test
    void csvEscape_null_returnsEmpty() throws Exception {
        PauseAIServiceImpl s = service();
        Method m = PauseAIServiceImpl.class.getDeclaredMethod("csvEscape", String.class);
        m.setAccessible(true);

        assertEquals("", m.invoke(s, new Object[]{null}));
    }

    @Test
    void construireFeaturesIA_encodesPoiTypes() throws Exception {
        PauseAIServiceImpl s = service();
        Method m = PauseAIServiceImpl.class.getDeclaredMethod(
            "construireFeaturesIA", Trajet.class, double.class, double.class,
            Double.class, Double.class, Map.class);
        m.setAccessible(true);
        Trajet t = trajet(1L, StatutTrajet.EN_COURS, null, null, null, 100.0, null, null, null);

        @SuppressWarnings("unchecked")
        Map<String, Object> fuel = (Map<String, Object>) m.invoke(s, t, 5.0, 0.5, 46.5, 4.5, Map.of("type", "fuel"));
        assertEquals(1, fuel.get("poi_type_encoded"));
        @SuppressWarnings("unchecked")
        Map<String, Object> restaurant = (Map<String, Object>) m.invoke(s, t, 5.0, 0.5, 46.5, 4.5, Map.of("type", "restaurant"));
        assertEquals(2, restaurant.get("poi_type_encoded"));
        @SuppressWarnings("unchecked")
        Map<String, Object> fastFood = (Map<String, Object>) m.invoke(s, t, 5.0, 0.5, 46.5, 4.5, Map.of("type", "fast_food"));
        assertEquals(2, fastFood.get("poi_type_encoded"));
        @SuppressWarnings("unchecked")
        Map<String, Object> cafe = (Map<String, Object>) m.invoke(s, t, 5.0, 0.5, 46.5, 4.5, Map.of("type", "cafe"));
        assertEquals(3, cafe.get("poi_type_encoded"));
        @SuppressWarnings("unchecked")
        Map<String, Object> restArea = (Map<String, Object>) m.invoke(s, t, 5.0, 0.5, 46.5, 4.5, Map.of("type", "rest_area"));
        assertEquals(4, restArea.get("poi_type_encoded"));
        @SuppressWarnings("unchecked")
        Map<String, Object> services = (Map<String, Object>) m.invoke(s, t, 5.0, 0.5, 46.5, 4.5, Map.of("type", "services"));
        assertEquals(5, services.get("poi_type_encoded"));
    }

    // ========== Branch coverage: verifierAPIFlaskAuDemarrage ==========

    @Test
    void verifierAPIFlask_non2xxResponse_triesAll() {
        when(restTemplate.getForEntity(anyString(), eq(String.class)))
            .thenReturn(ResponseEntity.status(503).body("down"));

        service().verifierAPIFlaskAuDemarrage();

        verify(restTemplate, times(3)).getForEntity(anyString(), eq(String.class));
    }

    // ========== Branch coverage: evaluerPause ==========

    @Test
    void evaluerPause_nullDistanceKm_usesZero() {
        Trajet t = trajet(1L, StatutTrajet.EN_COURS, chauffeur(10L, "A", "A", null, null), null, null,
            null, LocalDateTime.now().minusHours(5), "Paris", "Lyon");
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));
        when(pauseRepository.findByTrajetId(1L)).thenReturn(List.of());
        when(predictionRepository.findLastPredictionForTrajet(1L)).thenReturn(Optional.empty());
        when(restTemplate.postForEntity(anyString(), any(), eq(String.class)))
            .thenReturn(ResponseEntity.ok("{\"scores\":[{\"ai_score\":50}]}"));
        when(predictionRepository.save(any(PauseAIPrediction.class))).thenAnswer(inv -> {
            PauseAIPrediction p = inv.getArgument(0);
            p.setId(20L);
            return p;
        });

        PauseAIPredictionResponse response = service().evaluerPause(1L, 46.5, 4.5, 50.0);

        assertEquals(20L, response.getId());
        assertEquals(0.0, response.getDistAlongRatio(), 0.01);
    }

    @Test
    void evaluerPause_zeroDistanceKm_distAlongRatioZero() {
        Trajet t = trajet(1L, StatutTrajet.EN_COURS, chauffeur(10L, "A", "A", null, null),
            null, null, 0.0, LocalDateTime.now().minusHours(5), "Paris", "Lyon");
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));
        when(pauseRepository.findByTrajetId(1L)).thenReturn(List.of());
        when(predictionRepository.findLastPredictionForTrajet(1L)).thenReturn(Optional.empty());
        when(restTemplate.postForEntity(anyString(), any(), eq(String.class)))
            .thenReturn(ResponseEntity.ok("{\"scores\":[{\"ai_score\":50}]}"));
        when(predictionRepository.save(any(PauseAIPrediction.class))).thenAnswer(inv -> {
            PauseAIPrediction p = inv.getArgument(0);
            p.setId(21L);
            return p;
        });

        PauseAIPredictionResponse response = service().evaluerPause(1L, 46.5, 4.5, 50.0);

        assertEquals(0.0, response.getDistAlongRatio(), 0.01);
    }

    @Test
    void evaluerPause_hoursAboveCritical_lowScore_urgentByHours() {
        Chauffeur ch = chauffeur(10L, "A", "A", null, null);
        Trajet t = trajet(1L, StatutTrajet.EN_COURS, ch, null, null,
            100.0, LocalDateTime.now().minusHours(6), "Paris", "Lyon");
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));
        when(pauseRepository.findByTrajetId(1L)).thenReturn(List.of());
        when(predictionRepository.findLastPredictionForTrajet(1L)).thenReturn(Optional.empty());
        when(restTemplate.postForEntity(anyString(), any(), eq(String.class)))
            .thenReturn(ResponseEntity.ok("{\"scores\":[{\"ai_score\":50}]}"));
        when(predictionRepository.save(any(PauseAIPrediction.class))).thenAnswer(inv -> {
            PauseAIPrediction p = inv.getArgument(0);
            p.setId(22L);
            return p;
        });
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of());

        PauseAIPredictionResponse response = service().evaluerPause(1L, 46.5, 4.5, 50.0);

        assertEquals(TypeAlerteIA.URGENTE, response.getTypeAlerte());
        assertTrue(response.getAlerteDeclenchee());
    }

    @Test
    void evaluerPause_completedPauses_subtractDuration() {
        Chauffeur ch = chauffeur(10L, "A", "A", null, null);
        Trajet t = trajet(1L, StatutTrajet.EN_COURS, ch, null, null,
            100.0, LocalDateTime.now().minusHours(5), "Paris", "Lyon");
        PauseReglementaire completedPause = pause(1L, t, StatutPause.ATTEINTE, 3600);
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));
        when(pauseRepository.findByTrajetId(1L)).thenReturn(Arrays.asList(completedPause));
        when(predictionRepository.findLastPredictionForTrajet(1L)).thenReturn(Optional.empty());
        when(restTemplate.postForEntity(anyString(), any(), eq(String.class)))
            .thenReturn(ResponseEntity.ok("{\"scores\":[{\"ai_score\":50}]}"));
        when(predictionRepository.save(any(PauseAIPrediction.class))).thenAnswer(inv -> {
            PauseAIPrediction p = inv.getArgument(0);
            p.setId(23L);
            return p;
        });

        PauseAIPredictionResponse response = service().evaluerPause(1L, 46.5, 4.5, 50.0);

        assertEquals(4.0, response.getHoursDriving(), 0.1);
    }

    @Test
    void evaluerPause_pauseWithNullDuration_filtered() {
        Chauffeur ch = chauffeur(10L, "A", "A", null, null);
        Trajet t = trajet(1L, StatutTrajet.EN_COURS, ch, null, null,
            100.0, LocalDateTime.now().minusHours(5), "Paris", "Lyon");
        PauseReglementaire pauseWithNullDuration = PauseReglementaire.builder()
            .id(1L).trajet(t).type(TypePause.MANDATORY_REST).statut(StatutPause.ATTEINTE)
            .latitude(46.0).longitude(4.0).durationSeconds(null).build();
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));
        when(pauseRepository.findByTrajetId(1L)).thenReturn(Arrays.asList(pauseWithNullDuration));
        when(predictionRepository.findLastPredictionForTrajet(1L)).thenReturn(Optional.empty());
        when(restTemplate.postForEntity(anyString(), any(), eq(String.class)))
            .thenReturn(ResponseEntity.ok("{\"scores\":[{\"ai_score\":50}]}"));
        when(predictionRepository.save(any(PauseAIPrediction.class))).thenAnswer(inv -> {
            PauseAIPrediction p = inv.getArgument(0);
            p.setId(24L);
            return p;
        });

        PauseAIPredictionResponse response = service().evaluerPause(1L, 46.5, 4.5, 50.0);

        assertEquals(5.0, response.getHoursDriving(), 0.1);
    }

    @Test
    void evaluerPause_nonAtteintePause_notSubtracted() {
        Chauffeur ch = chauffeur(10L, "A", "A", null, null);
        Trajet t = trajet(1L, StatutTrajet.EN_COURS, ch, null, null,
            100.0, LocalDateTime.now().minusHours(5), "Paris", "Lyon");
        PauseReglementaire nonAtteinte = pause(1L, t, StatutPause.IGNOREE, 3600);
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));
        when(pauseRepository.findByTrajetId(1L)).thenReturn(Arrays.asList(nonAtteinte));
        when(predictionRepository.findLastPredictionForTrajet(1L)).thenReturn(Optional.empty());
        when(restTemplate.postForEntity(anyString(), any(), eq(String.class)))
            .thenReturn(ResponseEntity.ok("{\"scores\":[{\"ai_score\":50}]}"));
        when(predictionRepository.save(any(PauseAIPrediction.class))).thenAnswer(inv -> {
            PauseAIPrediction p = inv.getArgument(0);
            p.setId(25L);
            return p;
        });

        PauseAIPredictionResponse response = service().evaluerPause(1L, 46.5, 4.5, 50.0);

        assertEquals(5.0, response.getHoursDriving(), 0.1);
    }

    @Test
    void evaluerPause_flaskEmptyScoresList_fallbackApplied() {
        Trajet t = trajet(1L, StatutTrajet.EN_COURS, chauffeur(10L, "A", "A", null, null), null, null,
            100.0, LocalDateTime.now().minusHours(4), "Paris", "Lyon");
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));
        when(pauseRepository.findByTrajetId(1L)).thenReturn(List.of());
        when(predictionRepository.findLastPredictionForTrajet(1L)).thenReturn(Optional.empty());
        when(restTemplate.postForEntity(anyString(), any(), eq(String.class)))
            .thenReturn(ResponseEntity.ok("{\"scores\":[]}"));
        when(predictionRepository.save(any(PauseAIPrediction.class))).thenAnswer(inv -> {
            PauseAIPrediction p = inv.getArgument(0);
            p.setId(30L);
            return p;
        });

        PauseAIPredictionResponse response = service().evaluerPause(1L, 46.5, 4.5, 40.0);

        assertEquals(0, response.getScore());
        assertEquals(TypeAlerteIA.AUCUNE, response.getTypeAlerte());
    }

    // ========== Branch coverage: construireFeaturesIA ==========

    @Test
    void construireFeaturesIA_nullDistanceKm_usesZero() throws Exception {
        PauseAIServiceImpl s = service();
        Method m = PauseAIServiceImpl.class.getDeclaredMethod(
            "construireFeaturesIA", Trajet.class, double.class, double.class,
            Double.class, Double.class, Map.class);
        m.setAccessible(true);
        Trajet t = trajet(1L, StatutTrajet.EN_COURS, null, null, null, null, null, null, null);

        @SuppressWarnings("unchecked")
        Map<String, Object> features = (Map<String, Object>) m.invoke(s, t, 5.0, 0.5, 46.5, 4.5,
            Map.of("type", "fuel"));
        assertEquals(0.0, features.get("total_distance_m"));
    }

    @Test
    void construireFeaturesIA_negativeRatioClamped() throws Exception {
        PauseAIServiceImpl s = service();
        Method m = PauseAIServiceImpl.class.getDeclaredMethod(
            "construireFeaturesIA", Trajet.class, double.class, double.class,
            Double.class, Double.class, Map.class);
        m.setAccessible(true);
        Trajet t = trajet(1L, StatutTrajet.EN_COURS, null, null, null, 100.0, null, null, null);

        @SuppressWarnings("unchecked")
        Map<String, Object> features = (Map<String, Object>) m.invoke(s, t, 5.0, -0.5, 46.5, 4.5,
            Map.of("type", "fuel"));
        assertEquals(0.0, features.get("dist_along_m"));
    }

    @Test
    void construireFeaturesIA_ratioAboveOneClamped() throws Exception {
        PauseAIServiceImpl s = service();
        Method m = PauseAIServiceImpl.class.getDeclaredMethod(
            "construireFeaturesIA", Trajet.class, double.class, double.class,
            Double.class, Double.class, Map.class);
        m.setAccessible(true);
        Trajet t = trajet(1L, StatutTrajet.EN_COURS, null, null, null, 100.0, null, null, null);

        @SuppressWarnings("unchecked")
        Map<String, Object> features = (Map<String, Object>) m.invoke(s, t, 5.0, 1.5, 46.5, 4.5,
            Map.of("type", "fuel"));
        assertEquals(100000.0, features.get("dist_along_m"));
    }

    @Test
    void construireFeaturesIA_tooCloseRatio() throws Exception {
        PauseAIServiceImpl s = service();
        Method m = PauseAIServiceImpl.class.getDeclaredMethod(
            "construireFeaturesIA", Trajet.class, double.class, double.class,
            Double.class, Double.class, Map.class);
        m.setAccessible(true);
        Trajet t = trajet(1L, StatutTrajet.EN_COURS, null, null, null, 100.0, null, null, null);

        @SuppressWarnings("unchecked")
        Map<String, Object> features = (Map<String, Object>) m.invoke(s, t, 5.0, 0.03, 46.5, 4.5,
            Map.of("type", "fuel"));
        assertEquals(1, features.get("is_too_close"));
        assertEquals(0, features.get("is_mid_range_fuel"));
    }

    @Test
    void construireFeaturesIA_fuelMidRange() throws Exception {
        PauseAIServiceImpl s = service();
        Method m = PauseAIServiceImpl.class.getDeclaredMethod(
            "construireFeaturesIA", Trajet.class, double.class, double.class,
            Double.class, Double.class, Map.class);
        m.setAccessible(true);
        Trajet t = trajet(1L, StatutTrajet.EN_COURS, null, null, null, 100.0, null, null, null);

        @SuppressWarnings("unchecked")
        Map<String, Object> features = (Map<String, Object>) m.invoke(s, t, 5.0, 0.6, 46.5, 4.5,
            Map.of("type", "fuel"));
        assertEquals(1, features.get("is_mid_range_fuel"));
    }

    @Test
    void construireFeaturesIA_highwayServiceType() throws Exception {
        PauseAIServiceImpl s = service();
        Method m = PauseAIServiceImpl.class.getDeclaredMethod(
            "construireFeaturesIA", Trajet.class, double.class, double.class,
            Double.class, Double.class, Map.class);
        m.setAccessible(true);
        Trajet t = trajet(1L, StatutTrajet.EN_COURS, null, null, null, 100.0, null, null, null);

        @SuppressWarnings("unchecked")
        Map<String, Object> svc = (Map<String, Object>) m.invoke(s, t, 5.0, 0.5, 46.5, 4.5,
            Map.of("type", "services"));
        assertEquals(1, svc.get("is_highway_service"));

        @SuppressWarnings("unchecked")
        Map<String, Object> ra = (Map<String, Object>) m.invoke(s, t, 5.0, 0.5, 46.5, 4.5,
            Map.of("type", "rest_area"));
        assertEquals(1, ra.get("is_highway_service"));
    }

    @SuppressWarnings("unchecked")
    @Test
    void construireFeaturesIA_withAllTags() throws Exception {
        PauseAIServiceImpl s = service();
        Method m = PauseAIServiceImpl.class.getDeclaredMethod(
            "construireFeaturesIA", Trajet.class, double.class, double.class,
            Double.class, Double.class, Map.class);
        m.setAccessible(true);
        Trajet t = trajet(1L, StatutTrajet.EN_COURS, null, null, null, 100.0, null, null, null);
        Map<String, Object> poi = Map.of(
            "type", "fuel",
            "tags", Map.of("hgv", "yes", "shower", "yes", "toilets", "yes", "opening_hours", "24/7")
        );

        Map<String, Object> features = (Map<String, Object>) m.invoke(s, t, 5.0, 0.5, 46.5, 4.5, poi);
        assertEquals(1, features.get("has_hgv"));
        assertEquals(1, features.get("has_shower"));
        assertEquals(1, features.get("has_toilets"));
        assertEquals(1, features.get("is_24h"));
    }

    @Test
    void construireFeaturesIA_nonHighwayNonMeal() throws Exception {
        PauseAIServiceImpl s = service();
        Method m = PauseAIServiceImpl.class.getDeclaredMethod(
            "construireFeaturesIA", Trajet.class, double.class, double.class,
            Double.class, Double.class, Map.class);
        m.setAccessible(true);
        Trajet t = trajet(1L, StatutTrajet.EN_COURS, null, null, null, 100.0, null, null, null);

        @SuppressWarnings("unchecked")
        Map<String, Object> features = (Map<String, Object>) m.invoke(s, t, 5.0, 0.5, 46.5, 4.5,
            Map.of("type", "unknown"));
        assertEquals(0, features.get("poi_type_encoded"));
        assertEquals(0, features.get("is_meal_poi"));
        assertEquals(0, features.get("is_highway_service"));
    }

    // ========== Branch coverage: computePoiAccessibilityScore ==========

    @Test
    void computePoiAccessibilityScore_null_returns50() throws Exception {
        PauseAIServiceImpl s = service();
        Method m = PauseAIServiceImpl.class.getDeclaredMethod("computePoiAccessibilityScore", String.class);
        m.setAccessible(true);

        assertEquals(50, m.invoke(s, (Object) null));
        assertEquals(90, m.invoke(s, "services"));
        assertEquals(90, m.invoke(s, "rest_area"));
        assertEquals(75, m.invoke(s, "fuel"));
        assertEquals(75, m.invoke(s, "station"));
        assertEquals(60, m.invoke(s, "restaurant"));
        assertEquals(60, m.invoke(s, "cafe"));
        assertEquals(60, m.invoke(s, "fast_food"));
        assertEquals(55, m.invoke(s, "parking"));
        assertEquals(40, m.invoke(s, "unknown"));
    }

    // ========== Branch coverage: isTagYes ==========

    @Test
    void isTagYes_withYesTag_returnsOui() throws Exception {
        PauseAIServiceImpl s = service();
        Method m = PauseAIServiceImpl.class.getDeclaredMethod("isTagYes", Map.class, String.class);
        m.setAccessible(true);

        Map<String, Object> poiWithHgv = new java.util.HashMap<>();
        poiWithHgv.put("tags", Map.of("hgv", "yes"));
        assertEquals("oui", m.invoke(s, poiWithHgv, "hgv"));
        assertEquals("non", m.invoke(s, poiWithHgv, "shower"));

        Map<String, Object> poiNoTags = new java.util.HashMap<>();
        assertEquals("non", m.invoke(s, poiNoTags, "hgv"));
    }

    // ========== Branch coverage: haversineKm ==========

    @Test
    void haversineKm_nullCoords_returnsZero() throws Exception {
        PauseAIServiceImpl s = service();
        Method m = PauseAIServiceImpl.class.getDeclaredMethod("haversineKm",
            Double.class, Double.class, Double.class, Double.class);
        m.setAccessible(true);

        assertEquals(0.0, m.invoke(s, null, 4.5, 46.5, 4.5));
        assertEquals(0.0, m.invoke(s, 46.5, null, 46.5, 4.5));
        assertEquals(0.0, m.invoke(s, 46.5, 4.5, null, 4.5));
        assertEquals(0.0, m.invoke(s, 46.5, 4.5, 46.5, null));
        double result = (double) m.invoke(s, 48.8566, 2.3522, 45.7640, 4.8357);
        assertTrue(result > 0);
    }

    // ========== Branch coverage: csvEscape / formatDouble ==========

    @Test
    void csvEscape_nonNull_returnsQuoted() throws Exception {
        PauseAIServiceImpl s = service();
        Method m = PauseAIServiceImpl.class.getDeclaredMethod("csvEscape", String.class);
        m.setAccessible(true);

        assertEquals("\"hello\"", m.invoke(s, "hello"));
        assertEquals("\"he\"\"llo\"", m.invoke(s, "he\"llo"));
    }

    @Test
    void formatDouble_null_returnsDefault() throws Exception {
        PauseAIServiceImpl s = service();
        Method m = PauseAIServiceImpl.class.getDeclaredMethod("formatDouble", Double.class);
        m.setAccessible(true);

        assertEquals("0.00", m.invoke(s, (Object) null));
        assertEquals("3.14", m.invoke(s, 3.14));
    }

    // ========== Branch coverage: exportDashboardCsv ==========

    @Test
    void exportDashboardCsv_noAlerts_correctTaux() {
        Chauffeur ch = chauffeur(10L, "Alice", "A", null, null);
        Trajet t1 = trajet(1L, StatutTrajet.EN_COURS, ch, null, null, 100.0,
            LocalDateTime.of(2026, 8, 1, 8, 0), "Paris", "Lyon");
        List<PauseAIPrediction> predictions = List.of(
            prediction(1L, t1, LocalDateTime.now(), 6.0, 0.5, 30, "services",
                false, TypeAlerteIA.AUCUNE, 46.0, 4.0, "Aire"));
        when(authenticatedUserService.getCurrentUser()).thenReturn(user(Role.SUPERADMIN, 99L));
        when(predictionRepository.findByDateRange(any(), any())).thenReturn(predictions);
        when(pauseRepository.findByTrajetId(1L)).thenReturn(List.of());

        String csv = service().exportDashboardCsv(LocalDateTime.now().minusDays(7), LocalDateTime.now(), null);

        String[] lines = csv.split("\n");
        assertEquals(2, lines.length);
        assertTrue(lines[1].contains("100.00"));
    }

    @Test
    void exportDashboardCsv_withMultipleTrajets() {
        Chauffeur ch = chauffeur(10L, "Alice", "A", null, null);
        Trajet t1 = trajet(1L, StatutTrajet.EN_COURS, ch, null, null, 100.0,
            LocalDateTime.of(2026, 8, 1, 8, 0), "Paris", "Lyon");
        Trajet t2 = trajet(2L, StatutTrajet.EN_COURS, ch, null, null, 200.0,
            LocalDateTime.of(2026, 8, 2, 8, 0), "Paris", "Marseille");
        List<PauseAIPrediction> predictions = List.of(
            prediction(1L, t1, LocalDateTime.now(), 6.0, 0.5, 30, "services",
                false, TypeAlerteIA.AUCUNE, 46.0, 4.0, "Aire"),
            prediction(2L, t2, LocalDateTime.now(), 7.0, 0.6, 90, "fuel",
                true, TypeAlerteIA.URGENTE, 46.0, 4.0, "Station"));
        when(authenticatedUserService.getCurrentUser()).thenReturn(user(Role.SUPERADMIN, 99L));
        when(predictionRepository.findByDateRange(any(), any())).thenReturn(predictions);
        when(pauseRepository.findByTrajetId(1L)).thenReturn(List.of());
        when(pauseRepository.findByTrajetId(2L)).thenReturn(List.of(pause(30L, t2, StatutPause.ATTEINTE, 900)));

        String csv = service().exportDashboardCsv(LocalDateTime.now().minusDays(7), LocalDateTime.now(), null);

        String[] lines = csv.split("\n");
        assertEquals(3, lines.length);
    }

    // ========== Branch coverage: declencherAlerteSSE ==========

    @Test
    void evaluerPause_nullChauffeur_alertStillSent() {
        Trajet t = trajet(1L, StatutTrajet.EN_COURS, null, null, null,
            100.0, LocalDateTime.now().minusHours(5), "Paris", "Lyon");
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));
        when(pauseRepository.findByTrajetId(1L)).thenReturn(List.of());
        when(predictionRepository.findLastPredictionForTrajet(1L)).thenReturn(Optional.empty());
        when(restTemplate.postForEntity(anyString(), any(), eq(String.class)))
            .thenReturn(ResponseEntity.ok("{\"scores\":[{\"ai_score\":90}]}"));
        when(predictionRepository.save(any(PauseAIPrediction.class))).thenAnswer(inv -> {
            PauseAIPrediction p = inv.getArgument(0);
            p.setId(40L);
            return p;
        });
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of(user(Role.SUPERADMIN, 99L)));

        PauseAIPredictionResponse response = service().evaluerPause(1L, 46.5, 4.5, 50.0);

        assertEquals(TypeAlerteIA.URGENTE, response.getTypeAlerte());
        verify(notificationRealtimeService).publishNamedEventToUsers(
            argThat(col -> col.size() == 1 && col.contains(99L)),
            eq("PAUSE_AI_ALERT"),
            any());
    }

    @Test
    void evaluerPause_emptyAudience_noSseSent() {
        Trajet t = trajet(1L, StatutTrajet.EN_COURS, null, null, null,
            100.0, LocalDateTime.now().minusHours(5), "Paris", "Lyon");
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));
        when(pauseRepository.findByTrajetId(1L)).thenReturn(List.of());
        when(predictionRepository.findLastPredictionForTrajet(1L)).thenReturn(Optional.empty());
        when(restTemplate.postForEntity(anyString(), any(), eq(String.class)))
            .thenReturn(ResponseEntity.ok("{\"scores\":[{\"ai_score\":90}]}"));
        when(predictionRepository.save(any(PauseAIPrediction.class))).thenAnswer(inv -> {
            PauseAIPrediction p = inv.getArgument(0);
            p.setId(41L);
            return p;
        });
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of());

        PauseAIPredictionResponse response = service().evaluerPause(1L, 46.5, 4.5, 50.0);

        assertEquals(TypeAlerteIA.URGENTE, response.getTypeAlerte());
        verify(notificationRealtimeService, never())
            .publishNamedEventToUsers(anyCollection(), anyString(), any());
    }

    // ========== Branch coverage: computeComplianceFor alerted=0 ==========

    @Test
    void getDashboardStats_halfWithNoAlerts() {
        LocalDateTime start = LocalDateTime.now().minusDays(7);
        LocalDateTime end = LocalDateTime.now();

        Chauffeur ch = chauffeur(10L, "Alice", "A", null, null);
        Trajet t1 = Trajet.builder().id(100L).statut(StatutTrajet.EN_COURS).chauffeur(ch)
            .distanceKm(500.0).dateDepart(LocalDateTime.now().minusHours(6))
            .pointDepart("Paris").destination("Lyon").build();

        List<PauseAIPrediction> predictions = new ArrayList<>();
        predictions.add(prediction(1L, t1, LocalDateTime.now().minusDays(2).withHour(10), 6.0, 0.5, 90,
            "services", true, TypeAlerteIA.URGENTE, 46.0, 4.0, "Aire"));
        predictions.add(prediction(2L, t1, LocalDateTime.now().minusDays(2).withHour(12), 6.5, 0.6, 85,
            "fuel", true, TypeAlerteIA.URGENTE, 46.0, 4.0, "Station"));
        predictions.add(prediction(3L, t1, LocalDateTime.now().minusDays(1).withHour(10), 5.0, 0.3, 40,
            null, false, TypeAlerteIA.AUCUNE, null, null, null));
        predictions.add(prediction(4L, t1, LocalDateTime.now().minusDays(1).withHour(12), 5.5, 0.4, 35,
            null, false, TypeAlerteIA.AUCUNE, null, null, null));

        when(authenticatedUserService.getCurrentUser()).thenReturn(user(Role.SUPERADMIN, 99L));
        when(predictionRepository.findByDateRange(any(), any())).thenReturn(predictions);
        when(pauseRepository.findByTrajetId(100L)).thenReturn(List.of());

        PauseAIDashboardResponse response = service().getDashboardStats(start, end, null);

        assertEquals(2, response.getTotalPausesRecommandees());
        assertEquals(0, response.getPausesEffectuees());
    }

    // ========== Branch coverage: appellerModeleIA ==========

    @Test
    void evaluerPause_flaskScoresNullFallback() {
        Trajet t = trajet(1L, StatutTrajet.EN_COURS, chauffeur(10L, "A", "A", null, null), null, null,
            100.0, LocalDateTime.now().minusHours(4), "Paris", "Lyon");
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));
        when(pauseRepository.findByTrajetId(1L)).thenReturn(List.of());
        when(predictionRepository.findLastPredictionForTrajet(1L)).thenReturn(Optional.empty());
        when(restTemplate.postForEntity(anyString(), any(), eq(String.class)))
            .thenReturn(ResponseEntity.ok("{\"scores\":[{\"ai_score\":null}]}"));
        when(predictionRepository.save(any(PauseAIPrediction.class))).thenAnswer(inv -> {
            PauseAIPrediction p = inv.getArgument(0);
            p.setId(50L);
            return p;
        });

        PauseAIPredictionResponse response = service().evaluerPause(1L, 46.5, 4.5, 40.0);

        assertEquals(0, response.getScore());
        assertEquals(TypeAlerteIA.AUCUNE, response.getTypeAlerte());
    }

    // ========== Branch coverage: getPausesCompletes ==========

    @Test
    void getPausesCompletes_noDurationAndNoDepart() {
        Trajet t = Trajet.builder()
            .id(1L).statut(StatutTrajet.EN_COURS).chauffeur(chauffeur(10L, "A", "A", null, null))
            .build();
        when(authenticatedUserService.getCurrentUser()).thenReturn(user(Role.SUPERADMIN, 99L));
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));
        when(restTemplate.postForEntity(anyString(), any(), eq(Map.class)))
            .thenReturn(ResponseEntity.ok(new java.util.HashMap<>()));

        Map<String, Object> result = service().getPausesCompletes(1L);

        assertTrue(result.containsKey("stops"));
    }

    // ========== Branch coverage: getDashboardStats with null chauffeur in SSE ==========

    @Test
    void evaluerPause_nullManager_alertStillSent() {
        Chauffeur ch = chauffeur(10L, "A", "A", null, null);
        Trajet t = trajet(1L, StatutTrajet.EN_COURS, ch, null, null,
            100.0, LocalDateTime.now().minusHours(5), "Paris", "Lyon");
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(t));
        when(pauseRepository.findByTrajetId(1L)).thenReturn(List.of());
        when(predictionRepository.findLastPredictionForTrajet(1L)).thenReturn(Optional.empty());
        when(restTemplate.postForEntity(anyString(), any(), eq(String.class)))
            .thenReturn(ResponseEntity.ok("{\"scores\":[{\"ai_score\":90}]}"));
        when(predictionRepository.save(any(PauseAIPrediction.class))).thenAnswer(inv -> {
            PauseAIPrediction p = inv.getArgument(0);
            p.setId(42L);
            return p;
        });
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of());

        PauseAIPredictionResponse response = service().evaluerPause(1L, 46.5, 4.5, 50.0);

        assertEquals(TypeAlerteIA.URGENTE, response.getTypeAlerte());
        verify(notificationRealtimeService, times(1))
            .publishNamedEventToUsers(anyCollection(), eq("PAUSE_AI_ALERT"), any());
    }

    // ========== Branch coverage: construireFeaturesIA all meal POI + meal hour combos ==========

    @Test
    void construireFeaturesIA_mealPoiAndNonMealPoi() throws Exception {
        PauseAIServiceImpl s = service();
        Method m = PauseAIServiceImpl.class.getDeclaredMethod(
            "construireFeaturesIA", Trajet.class, double.class, double.class,
            Double.class, Double.class, Map.class);
        m.setAccessible(true);
        Trajet t = trajet(1L, StatutTrajet.EN_COURS, null, null, null, 100.0, null, null, null);

        @SuppressWarnings("unchecked")
        Map<String, Object> restaurant = (Map<String, Object>) m.invoke(s, t, 5.0, 0.5, 46.5, 4.5,
            Map.of("type", "restaurant"));
        assertEquals(1, restaurant.get("is_meal_poi"));

        @SuppressWarnings("unchecked")
        Map<String, Object> fuel = (Map<String, Object>) m.invoke(s, t, 5.0, 0.5, 46.5, 4.5,
            Map.of("type", "fuel"));
        assertEquals(0, fuel.get("is_meal_poi"));
    }

    // ========== Branch coverage: construireFeaturesIA with all tag defaults ==========

    @SuppressWarnings("unchecked")
    @Test
    void construireFeaturesIA_defaultTags() throws Exception {
        PauseAIServiceImpl s = service();
        Method m = PauseAIServiceImpl.class.getDeclaredMethod(
            "construireFeaturesIA", Trajet.class, double.class, double.class,
            Double.class, Double.class, Map.class);
        m.setAccessible(true);
        Trajet t = trajet(1L, StatutTrajet.EN_COURS, null, null, null, 100.0, null, null, null);

        Map<String, Object> poi = new java.util.HashMap<>();
        poi.put("type", "fuel");
        poi.put("tags", new java.util.HashMap<>());

        Map<String, Object> features = (Map<String, Object>) m.invoke(s, t, 5.0, 0.5, 46.5, 4.5, poi);
        assertEquals(0, features.get("has_hgv"));
        assertEquals(0, features.get("has_shower"));
        assertEquals(0, features.get("has_toilets"));
        assertEquals(0, features.get("is_24h"));
    }

    // ========== Branch coverage: construireFeaturesIA no tags key ==========

    @SuppressWarnings("unchecked")
    @Test
    void construireFeaturesIA_noTagsKey() throws Exception {
        PauseAIServiceImpl s = service();
        Method m = PauseAIServiceImpl.class.getDeclaredMethod(
            "construireFeaturesIA", Trajet.class, double.class, double.class,
            Double.class, Double.class, Map.class);
        m.setAccessible(true);
        Trajet t = trajet(1L, StatutTrajet.EN_COURS, null, null, null, 100.0, null, null, null);

        Map<String, Object> poi = new java.util.HashMap<>();
        poi.put("type", "fuel");

        Map<String, Object> features = (Map<String, Object>) m.invoke(s, t, 5.0, 0.5, 46.5, 4.5, poi);
        assertEquals(0, features.get("has_hgv"));
        assertEquals(0, features.get("has_shower"));
    }

    // ========== Branch coverage: getDashboardStats POI null in heatmap ==========

    @Test
    void getDashboardStats_nullPoiType_heatmapAccessibility() {
        Chauffeur ch = chauffeur(10L, "Alice", "A", null, null);
        Trajet t = trajet(1L, StatutTrajet.EN_COURS, ch, null, null, 100.0,
            LocalDateTime.now().minusHours(5), "Paris", "Lyon");
        PauseAIPrediction pred = prediction(1L, t, LocalDateTime.now(), 6.0, 0.5, 90,
            null, true, TypeAlerteIA.URGENTE, 46.0, 4.0, "Aire");
        when(authenticatedUserService.getCurrentUser()).thenReturn(user(Role.SUPERADMIN, 99L));
        when(predictionRepository.findByDateRange(any(), any())).thenReturn(List.of(pred));
        when(pauseRepository.findByTrajetId(1L)).thenReturn(List.of());

        PauseAIDashboardResponse response = service().getDashboardStats(
            LocalDateTime.now().minusDays(7), LocalDateTime.now(), null);

        assertEquals(1, response.getHeatmapPoints().size());
        assertEquals(50.0, response.getChauffeurStats().get(0).getScoreMoyenAccessibilite(), 0.01);
    }

    // ========== Branch coverage: construireFeaturesIA default POI type in switch ==========

    @Test
    void construireFeaturesIA_defaultSwitchCase() throws Exception {
        PauseAIServiceImpl s = service();
        Method m = PauseAIServiceImpl.class.getDeclaredMethod(
            "construireFeaturesIA", Trajet.class, double.class, double.class,
            Double.class, Double.class, Map.class);
        m.setAccessible(true);
        Trajet t = trajet(1L, StatutTrajet.EN_COURS, null, null, null, 100.0, null, null, null);

        @SuppressWarnings("unchecked")
        Map<String, Object> features = (Map<String, Object>) m.invoke(s, t, 5.0, 0.5, 46.5, 4.5,
            Map.of("type", "BAS_COTE"));
        assertEquals(0, features.get("poi_type_encoded"));
    }

    // ========== Branch coverage: exportDashboardCsv chauffeur null ==========

    @Test
    void exportDashboardCsv_nullChauffeurAndNullDates() {
        Trajet t5 = trajet(5L, StatutTrajet.EN_COURS, null, null, null, 100.0, null, null, null);
        PauseAIPrediction p = prediction(1L, t5, LocalDateTime.now(), 6.0, 0.5, 70,
            "services", false, TypeAlerteIA.AUCUNE, null, null, null);
        when(authenticatedUserService.getCurrentUser()).thenReturn(user(Role.SUPERADMIN, 99L));
        when(predictionRepository.findByDateRange(any(), any())).thenReturn(List.of(p));
        when(pauseRepository.findByTrajetId(5L)).thenReturn(List.of());

        String csv = service().exportDashboardCsv(LocalDateTime.now().minusDays(7), LocalDateTime.now(), null);

        String[] lines = csv.split("\n");
        assertEquals(2, lines.length);
        assertTrue(lines[1].contains("\"N/A\""));
    }

    // ========== Additional Branch Tests ==========

    @Test
    void verifierAPIFlaskAuDemarrage_non2xxResponse_logsWarning() {
        PauseAIServiceImpl s = service();
        when(restTemplate.getForEntity(anyString(), eq(String.class)))
            .thenReturn(ResponseEntity.status(500).build());

        s.verifierAPIFlaskAuDemarrage();
    }

    @Test
    void appellerModeleIA_emptyScoresOrInvalidFormat_throwsRuntime() throws Exception {
        PauseAIServiceImpl s = service();
        Method m = PauseAIServiceImpl.class.getDeclaredMethod("appellerModeleIA", Map.class);
        m.setAccessible(true);

        when(restTemplate.postForEntity(anyString(), any(), eq(String.class)))
            .thenReturn(ResponseEntity.ok("{\"scores\":[]}"));

        InvocationTargetException ex1 = assertThrows(InvocationTargetException.class, () -> m.invoke(s, Map.of()));
        assertTrue(ex1.getCause().getMessage().contains("Aucun score retourné"));

        when(restTemplate.postForEntity(anyString(), any(), eq(String.class)))
            .thenReturn(ResponseEntity.ok("{\"scores\":[{\"ai_score\":\"invalid_string\"}]}"));

        InvocationTargetException ex2 = assertThrows(InvocationTargetException.class, () -> m.invoke(s, Map.of()));
        assertTrue(ex2.getCause().getMessage().contains("Format de réponse invalide"));
    }

    @Test
    void resolveAccessiblePredictions_managerWithoutEntreprise_throwsIllegalState() {
        Manager mgr = manager(20L);
        mgr.setEntreprise(null);
        when(authenticatedUserService.getCurrentUser()).thenReturn(mgr);

        assertThrows(IllegalStateException.class, () ->
            service().getDashboardStats(LocalDateTime.now().minusDays(1), LocalDateTime.now(), 10L));
    }

    @Test
    void resolveAccessiblePredictions_managerAccessOtherCompanyDriver_throwsResourceNotFound() {
        Manager mgr = manager(20L);
        mgr.setEntreprise(entreprise(1L));

        Chauffeur chOther = chauffeur(10L, "O", "O", null, entreprise(2L));
        Trajet tOther = trajet(100L, StatutTrajet.EN_COURS, chOther, null, null, 100.0, LocalDateTime.now(), "A", "B");
        PauseAIPrediction pred = prediction(1L, tOther, LocalDateTime.now(), 4.0, 0.5, 80, "services", true, TypeAlerteIA.URGENTE, 40.0, 3.0, "Aire");

        when(authenticatedUserService.getCurrentUser()).thenReturn(mgr);
        when(predictionRepository.findByChauffeurIdAndDateRange(eq(10L), any(), any())).thenReturn(List.of(pred));

        assertThrows(ResourceNotFoundException.class, () ->
            service().getDashboardStats(LocalDateTime.now().minusDays(1), LocalDateTime.now(), 10L));
    }

    @Test
    void resolveAccessiblePredictions_unsupportedRole_throwsIllegalState() {
        Utilisateur driver = user(Role.CHAUFFEUR, 10L);
        when(authenticatedUserService.getCurrentUser()).thenReturn(driver);

        assertThrows(IllegalStateException.class, () ->
            service().exportDashboardCsv(LocalDateTime.now().minusDays(1), LocalDateTime.now(), null));
    }

    @Test
    void computePoiAccessibilityScore_branches() throws Exception {
        PauseAIServiceImpl s = service();
        Method m = PauseAIServiceImpl.class.getDeclaredMethod("computePoiAccessibilityScore", String.class);
        m.setAccessible(true);

        assertEquals(50, m.invoke(s, (Object) null));
        assertEquals(75, m.invoke(s, "gas_station"));
        assertEquals(60, m.invoke(s, "fast_food"));
        assertEquals(55, m.invoke(s, "parking_truck"));
        assertEquals(40, m.invoke(s, "unknown_poi"));
    }

    @Test
    void haversineKm_nullArgs_returnsZero() throws Exception {
        PauseAIServiceImpl s = service();
        Method m = PauseAIServiceImpl.class.getDeclaredMethod("haversineKm", Double.class, Double.class, Double.class, Double.class);
        m.setAccessible(true);

        assertEquals(0.0, (Double) m.invoke(s, null, 2.0, 3.0, 4.0), 0.001);
    }
}

