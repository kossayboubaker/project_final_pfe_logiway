package com.logiway.services.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.logiway.dto.pause.PauseReglementaireResponse;
import com.logiway.entities.PauseReglementaire;
import com.logiway.entities.Trajet;
import com.logiway.entities.Utilisateur;
import com.logiway.entities.enums.Role;
import com.logiway.entities.enums.StatutPause;
import com.logiway.entities.enums.TypePause;
import com.logiway.exceptions.ResourceNotFoundException;
import com.logiway.repositories.PauseReglementaireRepository;
import com.logiway.repositories.TrajetRepository;
import com.logiway.repositories.UtilisateurRepository;
import com.logiway.security.AuthenticatedUserService;
import com.logiway.services.NotificationRealtimeService;
import com.logiway.services.PauseReglementaireService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class PauseReglementaireServiceImpl implements PauseReglementaireService {

    private final PauseReglementaireRepository pauseRepository;
    private final TrajetRepository trajetRepository;
    private final AuthenticatedUserService authenticatedUserService;
    private final ObjectMapper objectMapper;
    private final NotificationRealtimeService notificationRealtimeService;
    private final UtilisateurRepository utilisateurRepository;
    private final RestTemplate restTemplate;

    @Value("${pause-ai.url:http://localhost:5000}")
    private String pauseAiUrl;

    @Value("${app.debug-pauses:false}")
    private boolean appDebugPauses;

    private boolean isDebugEnabled() {
        return appDebugPauses || "true".equalsIgnoreCase(System.getenv("APP_DEBUG_PAUSES"));
    }

    @Override
    public List<PauseReglementaireResponse> genererPauses(Long trajetId) {
        log.info("[PAUSE-GEN] === DEBUT genererPauses pour trajet {} ===", trajetId);
        
        Trajet trajet = trajetRepository.findById(trajetId)
            .orElseThrow(() -> new ResourceNotFoundException("Trajet introuvable"));

        // Check if trip duration is available
        Integer dureeMinutes = trajet.getDureeEstimeeMinutes();
        log.info("[PAUSE-GEN] Trajet {} - Durée estimée: {} minutes", trajetId, dureeMinutes);
        
        if (dureeMinutes == null || dureeMinutes <= 0) {
            log.warn("[PAUSE-GEN] Trajet {} has no valid duration ({}min), skipping pause generation", trajetId, dureeMinutes);
            return new ArrayList<>();
        }

        if (dureeMinutes < 180) {
            log.info("[PAUSE-GEN] Trajet {} duration is {}min (< 3h threshold), simulator will return empty pauses", trajetId, dureeMinutes);
        } else {
            log.info("[PAUSE-GEN] Trajet {} duration is {}min (>= 3h), pauses will be generated", trajetId, dureeMinutes);
        }

        // 1. deleteByTrajetId(trajetId)
        log.info("[PAUSE-GEN] Deleting all existing pauses for trajet {}", trajetId);
        pauseRepository.deleteByTrajetId(trajetId);

        try {
            // 2. Construire JSON stdin avec startLat, startLon, endLat, endLon, trip_id, trip_duration_minutes, departure_time
            Map<String, Object> input = new HashMap<>();
            input.put("trip_id", trajetId);
            input.put("trip_duration_minutes", dureeMinutes);
            input.put("startLat", trajet.getLatitudeDepart());
            input.put("startLon", trajet.getLongitudeDepart());
            input.put("endLat", trajet.getLatitudeArrivee());
            input.put("endLon", trajet.getLongitudeArrivee());
            
            if (trajet.getDateDepart() != null) {
                input.put("departure_time", trajet.getDateDepart().toString());
            }

            Map<String, Object> tripMap = new HashMap<>();
            tripMap.put("id", trajet.getId());
            tripMap.put("pointDepart", trajet.getPointDepart());
            tripMap.put("destination", trajet.getDestination());
            tripMap.put("latitudeDepart", trajet.getLatitudeDepart());
            tripMap.put("longitudeDepart", trajet.getLongitudeDepart());
            tripMap.put("latitudeArrivee", trajet.getLatitudeArrivee());
            tripMap.put("longitudeArrivee", trajet.getLongitudeArrivee());
            tripMap.put("distanceKm", trajet.getDistanceKm());
            tripMap.put("dureeEstimeeMinutes", trajet.getDureeEstimeeMinutes());
            tripMap.put("geometrieItineraire", trajet.getGeometrieItineraire());
            if (trajet.getVehicule() != null) {
                tripMap.put("vehiculeId", trajet.getVehicule().getId());
            }
            if (trajet.getChauffeur() != null) {
                tripMap.put("chauffeurId", trajet.getChauffeur().getId());
            }
            input.put("trip", tripMap);

            String inputJson = objectMapper.writeValueAsString(input);

            // 3. Appel au service Flask IA
            log.info("[PAUSE-GEN] Appel Flask AI à {}/api/predict: {}", pauseAiUrl, inputJson);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<String> requestEntity = new HttpEntity<>(inputJson, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(
                pauseAiUrl + "/api/predict", requestEntity, String.class);

            String responseBody = response.getBody();
            log.info("[PAUSE-GEN] Réponse Flask AI: {}", responseBody);

            if (responseBody == null || responseBody.isBlank()) {
                log.error("[PAUSE-GEN] Réponse vide du service Flask AI pour trajet {}", trajetId);
                return new ArrayList<>();
            }

            // Parse service response
            Map<String, Object> result = objectMapper.readValue(responseBody, new TypeReference<>() {});
            
            @SuppressWarnings("unchecked")
            Map<String, Object> meta = (Map<String, Object>) result.get("meta");
            if (meta != null && Boolean.FALSE.equals(meta.get("break_alert_applicable"))) {
                log.info("[PAUSE-GEN] Trajet {} - breaks not applicable: {}", trajetId, meta.get("reason"));
                return new ArrayList<>();
            }

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> stops = (List<Map<String, Object>>) result.get("stops");
            if (stops == null || stops.isEmpty()) {
                log.info("[PAUSE-GEN] No stops generated for trajet {}", trajetId);
                return new ArrayList<>();
            }

            log.info("[PAUSE-GEN] Received {} pauses from simulator for trajet {}", stops.size(), trajetId);
            for (Map<String, Object> stop : stops) {
                log.info("[PAUSE-GEN] - Pause type: {}, distance: {} m", stop.get("type"), stop.get("distanceAlongRouteM"));
            }

            // Save pauses to database
            List<PauseReglementaire> pauses = new ArrayList<>();
            for (Map<String, Object> stop : stops) {
                PauseReglementaire pause = new PauseReglementaire();
                pause.setTrajet(trajet);
                pause.setType(parseTypePause((String) stop.get("type")));
                
                // Parse coordinates - support both lonlat array and lat/lon fields
                Double longitude = null;
                Double latitude = null;
                
                // Try lonlat array first
                @SuppressWarnings("unchecked")
                List<Number> lonlat = (List<Number>) stop.get("lonlat");
                if (lonlat != null && lonlat.size() >= 2) {
                    longitude = lonlat.get(0).doubleValue();
                    latitude = lonlat.get(1).doubleValue();
                } else {
                    // Try lat/lon fields
                    Object latObj = stop.get("lat");
                    Object lonObj = stop.get("lon");
                    if (latObj != null && lonObj != null) {
                        latitude = getDoubleValue(latObj);
                        longitude = getDoubleValue(lonObj);
                    }
                }
                
                // Fallback to trip start if no coordinates
                if (longitude == null || latitude == null) {
                    longitude = trajet.getLongitudeDepart() != null ? trajet.getLongitudeDepart() : 0.0;
                    latitude = trajet.getLatitudeDepart() != null ? trajet.getLatitudeDepart() : 0.0;
                }
                
                pause.setLongitude(longitude);
                pause.setLatitude(latitude);
                
                // Parse other fields with support for both camelCase and snake_case
                pause.setDistanceAlongRouteM(getDoubleValue(stop.containsKey("distanceAlongRouteM") ? stop.get("distanceAlongRouteM") : stop.get("distance_along_route_m")));
                pause.setHeureArriveePlanifiee(parseDateTime((String) (stop.containsKey("arrivalTime") ? stop.get("arrivalTime") : stop.get("arrival_time"))));
                pause.setDurationSeconds(getIntegerValue(stop.containsKey("durationSec") ? stop.get("durationSec") : stop.get("duration_sec")));
                pause.setHeureRepriseEstimee(parseDateTime((String) (stop.containsKey("resumeTime") ? stop.get("resumeTime") : stop.get("resume_time"))));
                pause.setStatut(StatutPause.PLANIFIEE);
                
                // 4. Parser aiScore, fatigueScore, accessibilityScore, contextScore, reasoning, confidence
                pause.setAiScore(getIntegerValue(stop.containsKey("aiScore") ? stop.get("aiScore") : stop.get("ai_score")));
                pause.setFatigueScore(getIntegerValue(stop.containsKey("fatigueScore") ? stop.get("fatigueScore") : stop.get("fatigue_score")));
                pause.setAccessibilityScore(getIntegerValue(stop.containsKey("accessibilityScore") ? stop.get("accessibilityScore") : stop.get("accessibility_score")));
                pause.setContextScore(getIntegerValue(stop.containsKey("contextScore") ? stop.get("contextScore") : stop.get("context_score")));
                pause.setConfidence(getDoubleValue(stop.get("confidence")));
                
                // Parse reasoning array to string
                @SuppressWarnings("unchecked")
                List<String> reasoningList = (List<String>) stop.get("reasoning");
                if (reasoningList != null && !reasoningList.isEmpty()) {
                    pause.setReasoning(String.join("; ", reasoningList));
                }
                
                // WARNING_ALERT rules enforcement
                if (pause.getType() == TypePause.WARNING_ALERT) {
                    pause.setDurationSeconds(0);
                    pause.setHeureRepriseEstimee(pause.getHeureArriveePlanifiee());
                }
                
                // Generate or use provided nomLieu
                String nomLieu = (String) stop.get("nomLieu");
                if (nomLieu == null || nomLieu.isBlank()) {
                    nomLieu = generateNomLieu(pause.getType(), pause.getDistanceAlongRouteM());
                }
                pause.setNomLieu(nomLieu);
                
                pauses.add(pause);
            }

            // 5. saveAll() → OBLIGATOIRE (and flush to force DB write before SSE)
            List<PauseReglementaire> savedPauses = pauseRepository.saveAll(pauses);
            pauseRepository.flush();
            
            // 3. Logger TOUT : nb pauses saveAll()
            log.info("[PAUSE-GEN] nb pauses saveAll(): {}", savedPauses.size());
            log.info("[PAUSE-GEN] Successfully saved {} PauseReglementaire entities to database for trajet {}", savedPauses.size(), trajetId);
            log.info("[PAUSE-GEN] === FIN genererPauses pour trajet {} ===", trajetId);
            
            // 6. envoyerSSE("PAUSES_GENEREES", trajetId) → APRÈS save()
            List<Long> audience = new ArrayList<>();
            if (trajet.getChauffeur() != null && trajet.getChauffeur().getId() != null) {
                audience.add(trajet.getChauffeur().getId());
            }
            if (trajet.getManager() != null && trajet.getManager().getId() != null) {
                audience.add(trajet.getManager().getId());
            }
            utilisateurRepository.findByRole(Role.SUPERADMIN).stream()
                .map(Utilisateur::getId)
                .forEach(audience::add);
            List<Long> distinctAudience = audience.stream().distinct().toList();
            
            if (!distinctAudience.isEmpty()) {
                log.info("[PAUSE-GEN] envoyerSSE(\"PAUSES_GENEREES\", {}) to audience {}", trajetId, distinctAudience);
                notificationRealtimeService.publishNamedEventToUsers(distinctAudience, "PAUSES_GENEREES", trajetId);
            }

            return savedPauses.stream().map(this::toResponse).toList();

        } catch (Exception e) {
            log.error("[PAUSE-GEN] Failed to generate pauses via Python for trajet {}: {}", trajetId, e.getMessage(), e);
            log.info("[PAUSE-GEN] Attempting fallback generation for trajet {}...", trajetId);
            try {
                List<PauseReglementaire> fallbackPauses = genererPausesFallback(trajet, trajet.getDureeEstimeeMinutes());
                if (fallbackPauses != null && !fallbackPauses.isEmpty()) {
                    List<PauseReglementaire> savedFallback = pauseRepository.saveAll(fallbackPauses);
                    pauseRepository.flush();
                    log.info("[PAUSE-GEN] Fallback: generated {} pauses for trajet {}", savedFallback.size(), trajetId);
                    return savedFallback.stream().map(this::toResponse).toList();
                }
            } catch (Exception fallbackEx) {
                log.warn("[PAUSE-GEN] Fallback generation also failed for trajet {}: {}", trajetId, fallbackEx.getMessage());
            }
            log.info("[PAUSE-GEN] === FIN genererPauses (avec erreur) pour trajet {} ===", trajetId);
            return new ArrayList<>();
        }
    }

    @Override
    public List<PauseReglementaireResponse> getPausesForTrajet(Long trajetId) {
        // Verify trajet exists
        Trajet trajet = trajetRepository.findById(trajetId)
            .orElseThrow(() -> new ResourceNotFoundException("Trajet introuvable"));

        try {
            Utilisateur currentUser = authenticatedUserService.getCurrentUser();
            Role userRole = currentUser.getRole();
            Long userId = currentUser.getId();

            log.info("[PAUSE-GET] GET /api/trajets/{}/pauses called by user {} (role: {})", trajetId, userId, userRole);

            List<PauseReglementaire> pauses;

            if (userRole == Role.SUPERADMIN) {
                pauses = pauseRepository.findByTrajetId(trajetId);
                log.info("[PAUSE-GET] SuperAdmin access granted for trajet {}", trajetId);
            } else if (userRole == Role.MANAGER) {
                // Manager: sees breaks of their drivers and of their company (entreprise)
                boolean isManagerOfChauffeur = trajet.getChauffeur() != null 
                    && trajet.getChauffeur().getManager() != null 
                    && trajet.getChauffeur().getManager().getId().equals(userId);
                
                boolean isSameCompany = false;
                if (currentUser.getEntreprise() != null) {
                    if (trajet.getChauffeur() != null && trajet.getChauffeur().getEntreprise() != null) {
                        isSameCompany = trajet.getChauffeur().getEntreprise().getId().equals(currentUser.getEntreprise().getId());
                    } else if (trajet.getManager() != null && trajet.getManager().getEntreprise() != null) {
                        isSameCompany = trajet.getManager().getEntreprise().getId().equals(currentUser.getEntreprise().getId());
                    }
                }
                
                boolean isAssignedManager = trajet.getManager() != null && trajet.getManager().getId().equals(userId);

                if (!isAssignedManager && !isManagerOfChauffeur && !isSameCompany) {
                    log.warn("[PAUSE-GET] Manager {} denied access to trajet {}", userId, trajetId);
                    throw new ResourceNotFoundException("Accès refusé à ce trajet");
                }
                pauses = pauseRepository.findByTrajetId(trajetId);
                log.info("[PAUSE-GET] Manager access granted for trajet {}", trajetId);
            } else if (userRole == Role.CHAUFFEUR) {
                if (trajet.getChauffeur() == null || !trajet.getChauffeur().getId().equals(userId)) {
                    log.warn("[PAUSE-GET] Chauffeur {} denied access to trajet {}", userId, trajetId);
                    throw new ResourceNotFoundException("Accès refusé à ce trajet");
                }
                pauses = pauseRepository.findByTrajetId(trajetId);
                log.info("[PAUSE-GET] Chauffeur access granted for trajet {}", trajetId);
            } else {
                log.warn("[PAUSE-GET] User {} denied access (role: {})", userId, userRole);
                throw new ResourceNotFoundException("Rôle non autorisé");
            }

            log.info("[PAUSE-GET] Returning {} pauses for trajet {}", pauses.size(), trajetId);

            return pauses.stream().map(this::toResponse).toList();

        } catch (ResourceNotFoundException | SecurityException ex) {
            throw ex;
        } catch (Exception ex) {
            log.warn("[PAUSE-GET] getPausesForTrajet called without authentication for trajet {}, returning empty list: {}", trajetId, ex.getMessage());
            return new ArrayList<>();
        }
    }

    @Override
    public PauseReglementaireResponse mettreAJourStatutPause(Long trajetId, Long pauseId, StatutPause statut) {
        if (statut == null) {
            throw new IllegalArgumentException("Le statut de pause est obligatoire");
        }

        Trajet trajet = trajetRepository.findById(trajetId)
            .orElseThrow(() -> new ResourceNotFoundException("Trajet introuvable"));

        PauseReglementaire pause = pauseRepository.findById(pauseId)
            .orElseThrow(() -> new ResourceNotFoundException("Pause introuvable"));

        if (pause.getTrajet() == null || !pause.getTrajet().getId().equals(trajetId)) {
            throw new ResourceNotFoundException("Pause introuvable pour ce trajet");
        }

        verifierAccesPause(trajet);

        pause.setStatut(statut);
        if (statut == StatutPause.ATTEINTE && pause.getHeureRepriseEstimee() == null) {
            pause.setHeureRepriseEstimee(LocalDateTime.now());
        }

        PauseReglementaire saved = pauseRepository.save(pause);

        String chauffeurNom = trajet.getChauffeur() != null
            ? (trajet.getChauffeur().getPrenom() + " " + trajet.getChauffeur().getNom()).trim()
            : "N/A";

        if (statut == StatutPause.ATTEINTE) {
            log.info("[PAUSE-AI] ✅ Pause effectuée — TrajetId={} | Chauffeur={} | Durée pause={}min | Remise à zéro du compteur hours_driving", trajetId, chauffeurNom, saved.getDurationSeconds() != null ? saved.getDurationSeconds() / 60 : 0);
        } else if (statut == StatutPause.IGNOREE) {
            log.info("[PAUSE-AI] Pause ignorée — TrajetId={} | Chauffeur={} | Score au moment de l'ignorance={} | Snooze 15min activé", trajetId, chauffeurNom, saved.getAiScore() != null ? saved.getAiScore() : 0);
        }

        broadcasterPauseStatus(trajet, saved);
        return toResponse(saved);
    }

    private PauseReglementaireResponse toResponse(PauseReglementaire pause) {
        return PauseReglementaireResponse.builder()
            .id(pause.getId())
            .trajetId(pause.getTrajet().getId())
            .type(pause.getType())
            .longitude(pause.getLongitude())
            .latitude(pause.getLatitude())
            .distanceAlongRouteM(pause.getDistanceAlongRouteM())
            .heureArriveePlanifiee(pause.getHeureArriveePlanifiee())
            .durationSeconds(pause.getDurationSeconds())
            .heureRepriseEstimee(pause.getHeureRepriseEstimee())
            .statut(pause.getStatut())
            .nomLieu(pause.getNomLieu())
            .aiScore(pause.getAiScore())
            .fatigueScore(pause.getFatigueScore())
            .accessibilityScore(pause.getAccessibilityScore())
            .contextScore(pause.getContextScore())
            .reasoning(pause.getReasoning())
            .confidence(pause.getConfidence())
            .build();
    }

    private void broadcasterPauseStatus(Trajet trajet, PauseReglementaire pause) {
        List<Long> audience = new ArrayList<>();
        if (trajet.getChauffeur() != null && trajet.getChauffeur().getId() != null) {
            audience.add(trajet.getChauffeur().getId());
        }
        if (trajet.getManager() != null && trajet.getManager().getId() != null) {
            audience.add(trajet.getManager().getId());
        }
        utilisateurRepository.findByRole(Role.SUPERADMIN).stream()
            .map(Utilisateur::getId)
            .forEach(audience::add);

        List<Long> distinctAudience = audience.stream().distinct().toList();
        if (distinctAudience.isEmpty()) {
            return;
        }

        Map<String, Object> payload = new HashMap<>();
        payload.put("trajetId", trajet.getId());
        payload.put("pauseId", pause.getId());
        payload.put("statut", pause.getStatut());
        payload.put("latitude", pause.getLatitude());
        payload.put("longitude", pause.getLongitude());
        payload.put("nomLieu", pause.getNomLieu());
        payload.put("type", pause.getType() != null ? pause.getType().name() : null);
        payload.put("score", pause.getAiScore());

        notificationRealtimeService.publishNamedEventToUsers(distinctAudience, "PAUSE_STATUS_UPDATED", payload);
    }

    private void verifierAccesPause(Trajet trajet) {
        try {
            Utilisateur currentUser = authenticatedUserService.getCurrentUser();
            Role userRole = currentUser.getRole();
            Long userId = currentUser.getId();

            if (userRole == Role.SUPERADMIN) {
                return;
            }

            if (userRole == Role.MANAGER) {
                boolean isManagerOfChauffeur = trajet.getChauffeur() != null
                    && trajet.getChauffeur().getManager() != null
                    && trajet.getChauffeur().getManager().getId().equals(userId);
                boolean isSameCompany = currentUser.getEntreprise() != null
                    && trajet.getChauffeur() != null
                    && trajet.getChauffeur().getEntreprise() != null
                    && trajet.getChauffeur().getEntreprise().getId().equals(currentUser.getEntreprise().getId());
                boolean isAssignedManager = trajet.getManager() != null && trajet.getManager().getId().equals(userId);

                if (!isAssignedManager && !isManagerOfChauffeur && !isSameCompany) {
                    throw new ResourceNotFoundException("Accès refusé à cette pause");
                }
                return;
            }

            if (userRole == Role.CHAUFFEUR) {
                if (trajet.getChauffeur() == null || !trajet.getChauffeur().getId().equals(userId)) {
                    throw new ResourceNotFoundException("Accès refusé à cette pause");
                }
                return;
            }

            throw new ResourceNotFoundException("Rôle non autorisé");
        } catch (Exception e) {
            throw new ResourceNotFoundException("Accès refusé");
        }
    }

    private TypePause parseTypePause(String type) {
        if (type == null) {
            return TypePause.POI;
        }
        return switch (type.toLowerCase()) {
            case "warning_alert" -> TypePause.WARNING_ALERT;
            case "mandatory_rest" -> TypePause.MANDATORY_REST;
            case "station_service", "planned_stop" -> TypePause.STATION_SERVICE;
            case "kiosk" -> TypePause.KIOSK;
            case "rest_area" -> TypePause.REST_AREA;
            case "cafe" -> TypePause.CAFE;
            case "parking" -> TypePause.PARKING;
            default -> TypePause.POI;
        };
    }

    private LocalDateTime parseDateTime(String dateTimeStr) {
        if (dateTimeStr == null || dateTimeStr.isBlank()) {
            return null;
        }
        try {
            return LocalDateTime.parse(dateTimeStr, DateTimeFormatter.ISO_DATE_TIME);
        } catch (Exception e) {
            try {
                return LocalDateTime.parse(dateTimeStr);
            } catch (Exception ex) {
                log.warn("Failed to parse datetime: {}", dateTimeStr);
                return null;
            }
        }
    }

    private Double getDoubleValue(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Number) {
            return ((Number) value).doubleValue();
        }
        try {
            return Double.parseDouble(value.toString());
        } catch (Exception e) {
            return null;
        }
    }

    private Integer getIntegerValue(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Number) {
            return ((Number) value).intValue();
        }
        try {
            return Integer.parseInt(value.toString());
        } catch (Exception e) {
            return null;
        }
    }

    private String generateNomLieu(TypePause type, Double distanceM) {
        String distanceKm = distanceM != null ? String.format("%.1f", distanceM / 1000.0) : "?";
        return switch (type) {
            case WARNING_ALERT -> "⏰ Alerte pause 3h - km " + distanceKm;
            case MANDATORY_REST -> "⛔ Pause obligatoire 4h30 - km " + distanceKm;
            case STATION_SERVICE -> "⛽ Station service - km " + distanceKm;
            case REST_AREA -> "🅿️ Aire de repos - km " + distanceKm;
            case KIOSK -> "🛒 Kiosque - km " + distanceKm;
            case CAFE -> "☕ Café - km " + distanceKm;
            case PARKING -> "🅿️ Parking - km " + distanceKm;
            case POI -> "📍 Point d'intérêt - km " + distanceKm;
        };
    }

    /**
     * Fallback: generate basic WARNING_ALERT and MANDATORY_REST stops
     * by interpolating on the OSRM route geometry, without calling the Python script.
     */
    private List<PauseReglementaire> genererPausesFallback(Trajet trajet, Integer dureeMinutes) {
        if (dureeMinutes == null || dureeMinutes < 180) {
            log.info("[PAUSE-FALLBACK] Trajet {} duration {} < 180 min, no fallback stops", trajet.getId(), dureeMinutes);
            return new ArrayList<>();
        }

        String geomJson = trajet.getGeometrieItineraire();
        if (geomJson == null || geomJson.isBlank()) {
            log.warn("[PAUSE-FALLBACK] No route geometry for trajet {}", trajet.getId());
            return new ArrayList<>();
        }

        try {
            // Parse GeoJSON polyline coordinates
            @SuppressWarnings("unchecked")
            List<List<Double>> coords = parseCoordinatesFromGeometry(geomJson);
            if (coords == null || coords.size() < 2) {
                log.warn("[PAUSE-FALLBACK] Invalid geometry coordinates for trajet {}", trajet.getId());
                return new ArrayList<>();
            }

            double totalDistM = trajet.getDistanceKm() != null ? trajet.getDistanceKm() * 1000.0 : 0.0;
            if (totalDistM <= 0) {
                // Calculate from coordinates
                totalDistM = 0;
                for (int i = 1; i < coords.size(); i++) {
                    totalDistM += haversineM(coords.get(i - 1).get(1), coords.get(i - 1).get(0),
                            coords.get(i).get(1), coords.get(i).get(0));
                }
            }
            // Calculate speed from duration
            double speedMS = dureeMinutes > 0 ? (totalDistM / (dureeMinutes * 60.0)) : 18.0;
            if (speedMS <= 0) speedMS = 18.0;

            LocalDateTime depDt = trajet.getDateDepart() != null ? trajet.getDateDepart() : LocalDateTime.now();

            List<PauseReglementaire> pauses = new ArrayList<>();
            List<PauseReglementaire> existingPauses = pauseRepository.findByTrajetId(trajet.getId());

            // WARNING_ALERT at 3h
            double warnDistM = Math.min(3.0 * 3600.0 * speedMS, totalDistM * 0.93);
            double[] warnPos = interpolateOnRoute(coords, warnDistM, totalDistM);
            if (warnPos != null) {
                boolean exists = existingPauses.stream().anyMatch(p -> p.getType() == TypePause.WARNING_ALERT);
                if (!exists) {
                    PauseReglementaire warn = new PauseReglementaire();
                    warn.setTrajet(trajet);
                    warn.setType(TypePause.WARNING_ALERT);
                    warn.setLatitude(warnPos[0]);
                    warn.setLongitude(warnPos[1]);
                    warn.setDistanceAlongRouteM(warnDistM);
                    LocalDateTime warnTime = depDt.plusSeconds((long) (warnDistM / speedMS));
                    warn.setHeureArriveePlanifiee(warnTime);
                    warn.setDurationSeconds(0);
                    warn.setHeureRepriseEstimee(warnTime);
                    warn.setStatut(StatutPause.PLANIFIEE);
                    warn.setNomLieu(generateNomLieu(TypePause.WARNING_ALERT, warnDistM));
                    warn.setAiScore(100);
                    warn.setFatigueScore(100);
                    warn.setAccessibilityScore(100);
                    warn.setContextScore(100);
                    warn.setReasoning("Seuil légal d'alerte anticipée de 3h de conduite atteint (fallback)");
                    warn.setConfidence(1.0);
                    pauses.add(warn);
                }
            }

            // MANDATORY_REST at 4.5h
            double mandDistM = Math.min(4.5 * 3600.0 * speedMS, totalDistM * 0.97);
            double[] mandPos = interpolateOnRoute(coords, mandDistM, totalDistM);
            if (mandPos != null) {
                boolean exists = existingPauses.stream().anyMatch(p -> p.getType() == TypePause.MANDATORY_REST);
                if (!exists) {
                    PauseReglementaire mand = new PauseReglementaire();
                    mand.setTrajet(trajet);
                    mand.setType(TypePause.MANDATORY_REST);
                    mand.setLatitude(mandPos[0]);
                    mand.setLongitude(mandPos[1]);
                    mand.setDistanceAlongRouteM(mandDistM);
                    LocalDateTime mandTime = depDt.plusSeconds((long) (mandDistM / speedMS));
                    mand.setHeureArriveePlanifiee(mandTime);
                    mand.setDurationSeconds(2700);
                    mand.setHeureRepriseEstimee(mandTime.plusSeconds(2700));
                    mand.setStatut(StatutPause.PLANIFIEE);
                    mand.setNomLieu(generateNomLieu(TypePause.MANDATORY_REST, mandDistM));
                    mand.setAiScore(100);
                    mand.setFatigueScore(100);
                    mand.setAccessibilityScore(100);
                    mand.setContextScore(100);
                    mand.setReasoning("Seuil légal de repos obligatoire de 4h30 de conduite atteint (fallback)");
                    mand.setConfidence(1.0);
                    pauses.add(mand);
                }
            }

            return pauses;

        } catch (Exception e) {
            log.warn("[PAUSE-FALLBACK] Error in fallback generation for trajet {}: {}", trajet.getId(), e.getMessage());
            return new ArrayList<>();
        }
    }

    /**
     * Parse [lon, lat] coordinates from GeoJSON geometry stored in geometrieItineraire
     */
    @SuppressWarnings("unchecked")
    private List<List<Double>> parseCoordinatesFromGeometry(String geomJson) {
        try {
            Map<String, Object> parsed = objectMapper.readValue(geomJson, new TypeReference<>() {});
            Object geomObj = parsed;
            if (parsed.containsKey("type") && "FeatureCollection".equals(parsed.get("type"))) {
                List<Map<String, Object>> features = (List<Map<String, Object>>) parsed.get("features");
                if (features != null && !features.isEmpty()) {
                    geomObj = features.get(0).get("geometry");
                }
            }
            if (geomObj instanceof Map) {
                Map<String, Object> geom = (Map<String, Object>) geomObj;
                Object coordsObj = geom.get("coordinates");
                if (coordsObj instanceof List) {
                    return (List<List<Double>>) coordsObj;
                }
            }
            Object coordsDirect = parsed.get("coordinates");
            if (coordsDirect instanceof List) {
                return (List<List<Double>>) coordsDirect;
            }
        } catch (Exception e) {
            log.warn("Failed to parse geometry JSON: {}", e.getMessage());
        }
        return null;
    }

    /**
     * Haversine distance in meters
     */
    private double haversineM(double lon1, double lat1, double lon2, double lat2) {
        double R = 6371000.0;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    /**
     * Interpolate a [lat, lon] position at targetDistanceM along the route
     */
    private double[] interpolateOnRoute(List<List<Double>> coords, double targetDistanceM, double totalDistanceM) {
        if (coords == null || coords.size() < 2) return null;
        if (targetDistanceM >= totalDistanceM || totalDistanceM <= 0) {
            List<Double> last = coords.get(coords.size() - 1);
            return new double[]{last.get(1), last.get(0)};
        }

        double cumDist = 0;
        for (int i = 1; i < coords.size(); i++) {
            List<Double> p1 = coords.get(i - 1);
            List<Double> p2 = coords.get(i);
            double segLen = haversineM(p1.get(0), p1.get(1), p2.get(0), p2.get(1));
            if (cumDist + segLen >= targetDistanceM) {
                double frac = segLen > 0 ? (targetDistanceM - cumDist) / segLen : 0;
                double lat = p1.get(1) + (p2.get(1) - p1.get(1)) * frac;
                double lon = p1.get(0) + (p2.get(0) - p1.get(0)) * frac;
                return new double[]{lat, lon};
            }
            cumDist += segLen;
        }
        List<Double> last = coords.get(coords.size() - 1);
        return new double[]{last.get(1), last.get(0)};
    }
}
