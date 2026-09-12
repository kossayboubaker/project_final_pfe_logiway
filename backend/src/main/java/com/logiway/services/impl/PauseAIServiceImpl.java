package com.logiway.services.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.logiway.dto.pause.PauseAIDashboardResponse;
import com.logiway.dto.pause.PauseAIPredictionResponse;
import com.logiway.entities.*;
import com.logiway.entities.enums.Role;
import com.logiway.entities.enums.StatutPause;
import com.logiway.entities.enums.StatutTrajet;
import com.logiway.entities.enums.TypeAlerteIA;
import com.logiway.exceptions.ResourceNotFoundException;
import com.logiway.repositories.PauseAIPredictionRepository;
import com.logiway.repositories.PauseReglementaireRepository;
import com.logiway.repositories.TrajetRepository;
import com.logiway.repositories.UtilisateurRepository;
import com.logiway.security.AuthenticatedUserService;
import com.logiway.services.NotificationRealtimeService;
import com.logiway.services.PauseAIService;
import jakarta.transaction.Transactional;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;
import java.util.Locale;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class PauseAIServiceImpl implements PauseAIService {

    private final PauseAIPredictionRepository predictionRepository;
    private final PauseReglementaireRepository pauseRepository;
    private final TrajetRepository trajetRepository;
    private final AuthenticatedUserService authenticatedUserService;
    private final NotificationRealtimeService notificationRealtimeService;
    private final UtilisateurRepository utilisateurRepository;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${pause.ai.url:http://localhost:5000}")
    private String pauseAiUrl;

    private static final double SEUIL_SCORE_RECOMMANDE = 70.0;
    private static final double SEUIL_SCORE_URGENT = 85.0;
    private static final double SEUIL_HEURES_MIN = 3.0;
    private static final double SEUIL_HEURES_CRITIQUE = 4.5;
    private static final int INTERVALLE_EVALUATION_MINUTES = 2;

    @PostConstruct
    public void verifierAPIFlaskAuDemarrage() {
        List<String> healthChecks = List.of("/api/health", "/health", "/api/status");
        for (String path : healthChecks) {
            try {
                ResponseEntity<String> response = restTemplate.getForEntity(pauseAiUrl + path, String.class);
                if (response.getStatusCode().is2xxSuccessful()) {
                    log.info("[PAUSE-AI] API Flask Pause AI accessible — modèle prêt ({}{})", pauseAiUrl, path);
                    return;
                }
            } catch (Exception ex) {
                log.debug("[PAUSE-AI] Health check échoué sur {}{}: {}", pauseAiUrl, path, ex.getMessage());
            }
        }

        log.warn("[PAUSE-AI] ⚠️ AVERTISSEMENT : API Flask Pause AI inaccessible sur port 5000 — mode fallback activé");
    }

    @Override
    public PauseAIPredictionResponse evaluerPause(Long trajetId, Double currentLatitude, 
                                                   Double currentLongitude, Double distanceParcourueKm) {
        Trajet trajet = trajetRepository.findById(trajetId)
            .orElseThrow(() -> new ResourceNotFoundException("Trajet introuvable"));

        if (trajet.getStatut() != StatutTrajet.EN_COURS) {
            log.warn("[PAUSE-AI] Trajet {} n'est pas EN_COURS, statut: {}", trajetId, trajet.getStatut());
            throw new IllegalStateException("Le trajet n'est pas en cours");
        }

        // Calculer hours_driving
        LocalDateTime now = LocalDateTime.now();
        Duration dureeCond = Duration.between(trajet.getDateDepart(), now);
        
        // Soustraire le temps des pauses déjà effectuées
        List<PauseReglementaire> pausesEffectuees = pauseRepository.findByTrajetId(trajetId).stream()
            .filter(p -> p.getStatut() == StatutPause.ATTEINTE && p.getDurationSeconds() != null)
            .toList();
        
        long tempsPausesSecondes = pausesEffectuees.stream()
            .mapToLong(p -> p.getDurationSeconds())
            .sum();
        
        double hoursDriving = (dureeCond.getSeconds() - tempsPausesSecondes) / 3600.0;
        double totalDistanceKm = trajet.getDistanceKm() != null ? trajet.getDistanceKm() : 0.0;
        double distAlongRatio = totalDistanceKm > 0 ? distanceParcourueKm / totalDistanceKm : 0.0;

        log.info(
            "[PAUSE-AI] Évaluation déclenchée — TrajetId={} | hours_driving={}h | dist_along_ratio={} | position=({}, {})",
            trajetId,
            formatDouble(hoursDriving),
            formatDouble(distAlongRatio),
            formatDouble(currentLatitude),
            formatDouble(currentLongitude)
        );

        // Règle des 3 heures - ne pas évaluer si < 3h
        if (hoursDriving < SEUIL_HEURES_MIN) {
            log.info("[PAUSE-AI] hours_driving={}h < 3h, évaluation ignorée", formatDouble(hoursDriving));
            return null;
        }

        // Vérifier la dernière évaluation pour respecter l'intervalle de 2 minutes
        Optional<PauseAIPrediction> dernierePrediction = predictionRepository.findLastPredictionForTrajet(trajetId);
        if (dernierePrediction.isPresent()) {
            Duration depuisDerniereEval = Duration.between(dernierePrediction.get().getTimestamp(), now);
            if (depuisDerniereEval.toMinutes() < INTERVALLE_EVALUATION_MINUTES) {
                log.info("[PAUSE-AI] Dernière évaluation il y a {} min, skip (intervalle: {} min)", 
                         depuisDerniereEval.toMinutes(), INTERVALLE_EVALUATION_MINUTES);
                return toResponse(dernierePrediction.get());
            }
        }

        // Rechercher POI candidat via Overpass
        Map<String, Object> poiCandidat = rechercherMeilleurPOI(currentLatitude, currentLongitude);
        log.info(
            "[PAUSE-AI] POI trouvé — type={} | nom={} | distance={}m | hgv={} | toilets={} | score_potentiel estimé",
            poiCandidat.get("type"),
            poiCandidat.get("name"),
            formatDouble((Double) poiCandidat.get("distance")),
            isTagYes(poiCandidat, "hgv"),
            isTagYes(poiCandidat, "toilets")
        );
        
        // Construire les features pour le modèle
        Map<String, Object> features = construireFeaturesIA(
            trajet, hoursDriving, distAlongRatio, currentLatitude, currentLongitude, poiCandidat
        );
        log.debug(
            "[PAUSE-AI] Features → total_dist={}km | ratio={} | perp={}m | poi_type={} | hgv={} | shower={} | toilets={} | 24h={}",
            formatDouble((Double) features.get("total_distance_km")),
            formatDouble((Double) features.get("dist_along_ratio")),
            formatDouble((Double) features.get("perp_distance_m")),
            features.get("poi_type_encoded"),
            features.get("has_hgv"),
            features.get("has_shower"),
            features.get("has_toilets"),
            features.get("is_24h")
        );

        // Appeler le modèle Python
        Integer score = null;
        boolean flaskDisponible = true;
        try {
            score = appellerModeleIA(features);
            log.info("[PAUSE-AI] Score IA reçu = {}/100", score);
        } catch (Exception e) {
            flaskDisponible = false;
            log.warn("[PAUSE-AI] ⚠️ API Flask indisponible — fallback activé | TrajetId={} | hours_driving={}h → alerte si >= 4.5h", trajetId, formatDouble(hoursDriving));
            log.debug("[PAUSE-AI] Détail erreur Flask: {}", e.getMessage(), e);

            if (hoursDriving >= SEUIL_HEURES_CRITIQUE) {
                score = 100;
            } else {
                score = 0;
            }
        }

        // Déterminer le type d'alerte
        TypeAlerteIA typeAlerte = TypeAlerteIA.AUCUNE;
        boolean alerteDeclenchee = false;

        if (score >= SEUIL_SCORE_URGENT || hoursDriving >= SEUIL_HEURES_CRITIQUE) {
            typeAlerte = TypeAlerteIA.URGENTE;
            alerteDeclenchee = true;
            log.warn(
                "[PAUSE-AI] ⚠️ ALERTE URGENTE — TrajetId={} | Chauffeur={} | Score={}/100 | hours_driving={}h | POI recommandé={}",
                trajetId,
                trajet.getChauffeur() != null ? (trajet.getChauffeur().getPrenom() + " " + trajet.getChauffeur().getNom()).trim() : "N/A",
                score,
                formatDouble(hoursDriving),
                poiCandidat.get("name")
            );
        } else if (score >= SEUIL_SCORE_RECOMMANDE) {
            typeAlerte = TypeAlerteIA.RECOMMANDEE;
            alerteDeclenchee = true;
            log.info("[PAUSE-AI] Score reçu = {}/100 | seuil_alerte=70 | seuil_urgence=85 | décision=RECOMMANDEE", score);
        } else {
            log.info("[PAUSE-AI] Score reçu = {}/100 | seuil_alerte=70 | seuil_urgence=85 | décision=AUCUNE", score);
        }

        if (!flaskDisponible && hoursDriving >= SEUIL_HEURES_CRITIQUE) {
            log.warn("[PAUSE-AI] Fallback critique maintenu pour trajet {} malgré l'absence du modèle Flask", trajetId);
        }

        // Persister la prédiction
        PauseAIPrediction prediction = PauseAIPrediction.builder()
            .trajet(trajet)
            .timestamp(now)
            .hoursDriving(hoursDriving)
            .distAlongRatio(distAlongRatio)
            .score(score)
            .poiType((String) poiCandidat.get("type"))
            .alerteDeclenchee(alerteDeclenchee)
            .typeAlerte(typeAlerte)
            .latitudePoi((Double) poiCandidat.get("lat"))
            .longitudePoi((Double) poiCandidat.get("lon"))
            .nomPoi((String) poiCandidat.get("name"))
            .distancePoiM((Double) poiCandidat.get("distance"))
            .build();

        PauseAIPrediction saved = predictionRepository.save(prediction);
        log.info("[PAUSE-AI] Prédiction persistée avec ID: {}", saved.getId());

        // Déclencher SSE si alerte
        if (alerteDeclenchee) {
            declencherAlerteSSE(trajet, saved, poiCandidat);
        }

        return toResponse(saved);
    }

    @Override
    public List<PauseAIPredictionResponse> getHistoriquePredictions(Long trajetId) {
        // Vérifier l'accès
        Trajet trajet = trajetRepository.findById(trajetId)
            .orElseThrow(() -> new ResourceNotFoundException("Trajet introuvable"));
        
        verifierAccesTrajet(trajet);

        List<PauseAIPrediction> predictions = predictionRepository.findByTrajetIdOrderByTimestampAsc(trajetId);
        return predictions.stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public PauseAIDashboardResponse getDashboardStats(LocalDateTime startDate, LocalDateTime endDate, Long chauffeurId) {
        List<PauseAIPrediction> predictions = resolveAccessiblePredictions(startDate, endDate, chauffeurId);

        List<Long> trajetIds = predictions.stream()
            .map(p -> p.getTrajet().getId())
            .distinct()
            .collect(Collectors.toList());

        Map<Long, List<PauseReglementaire>> pausesByTrajet = new HashMap<>();
        for (Long tid : trajetIds) {
            pausesByTrajet.put(tid, pauseRepository.findByTrajetId(tid));
        }

        // Global stats
        int totalRecommandees = (int) predictions.stream()
            .filter(PauseAIPrediction::getAlerteDeclenchee)
            .count();

        int pausesEffectuees = (int) predictions.stream()
            .filter(PauseAIPrediction::getAlerteDeclenchee)
            .filter(pred -> {
                List<PauseReglementaire> tp = pausesByTrajet.get(pred.getTrajet().getId());
                if (tp == null) return false;
                return tp.stream().anyMatch(p -> p.getStatut() == StatutPause.ATTEINTE);
            })
            .count();

        int pausesIgnorees = totalRecommandees - pausesEffectuees;
        double tauxConformite = totalRecommandees > 0 ? (pausesEffectuees * 100.0 / totalRecommandees) : 100.0;
        double scoreMoyenFatigue = predictions.stream()
            .mapToInt(PauseAIPrediction::getScore)
            .average()
            .orElse(0.0);

        // Chauffeur stats
        Map<Long, List<PauseAIPrediction>> predictionsByChauffeur = predictions.stream()
            .collect(Collectors.groupingBy(p -> p.getTrajet().getChauffeur().getId()));

        List<PauseAIDashboardResponse.ChauffeurStats> chauffeurStats = predictionsByChauffeur.entrySet().stream()
            .map(entry -> {
                Long cId = entry.getKey();
                List<PauseAIPrediction> cp = entry.getValue();
                Chauffeur chauffeur = cp.get(0).getTrajet().getChauffeur();

                int nbMissions = (int) cp.stream().map(p -> p.getTrajet().getId()).distinct().count();
                double scoreMoyen = cp.stream().mapToInt(PauseAIPrediction::getScore).average().orElse(0.0);
                int alertesUrgentes = (int) cp.stream().filter(p -> p.getTypeAlerte() == TypeAlerteIA.URGENTE).count();
                int totalAlertesChauf = (int) cp.stream().filter(PauseAIPrediction::getAlerteDeclenchee).count();

                int pausesEffChauf = (int) cp.stream()
                    .filter(PauseAIPrediction::getAlerteDeclenchee)
                    .filter(pred -> {
                        List<PauseReglementaire> tp = pausesByTrajet.get(pred.getTrajet().getId());
                        if (tp == null) return false;
                        return tp.stream().anyMatch(p -> p.getStatut() == StatutPause.ATTEINTE);
                    })
                    .count();
                int pausesIgnChauf = totalAlertesChauf - pausesEffChauf;
                double tauxConf = totalAlertesChauf > 0 ? (pausesEffChauf * 100.0 / totalAlertesChauf) : 100.0;

                // Compute driver-level metrics from prediction data (ML-derived, not hardcoded)
                double heuresMoyennes = cp.stream()
                    .mapToDouble(PauseAIPrediction::getHoursDriving)
                    .average().orElse(0.0);

                Set<Long> distinctTrajetIds = cp.stream().map(p -> p.getTrajet().getId()).collect(Collectors.toSet());
                double distanceTotale = distinctTrajetIds.stream()
                    .mapToDouble(tid -> {
                        Trajet t = cp.stream().filter(p -> p.getTrajet().getId().equals(tid))
                            .findFirst().map(PauseAIPrediction::getTrajet).orElse(null);
                        return t != null && t.getDistanceKm() != null ? t.getDistanceKm() : 0.0;
                    })
                    .sum();

                long daysSpan = Duration.between(startDate, endDate).toDays();
                double distanceMoyenneParJour = daysSpan > 0 ? distanceTotale / daysSpan : distanceTotale;

                // POI accessibility score from prediction poiType
                double scoreAccessibilite = cp.stream()
                    .filter(p -> p.getPoiType() != null)
                    .mapToInt(p -> {
                        String pt = p.getPoiType().toLowerCase();
                        if (pt.contains("services") || pt.contains("rest_area")) return 90;
                        if (pt.contains("fuel") || pt.contains("station")) return 75;
                        if (pt.contains("restaurant") || pt.contains("cafe") || pt.contains("fast_food")) return 60;
                        return 40;
                    })
                    .average().orElse(50.0);

                // NiveauRisque derived from ML model thresholds
                String niveauRisque;
                if (scoreMoyen > SEUIL_SCORE_URGENT && tauxConf < 40 && alertesUrgentes > 8) {
                    niveauRisque = "CRITICAL";
                } else if (scoreMoyen > SEUIL_SCORE_RECOMMANDE || tauxConf < 60 || alertesUrgentes > 5) {
                    niveauRisque = "HIGH";
                } else if (scoreMoyen > 50 || tauxConf < 80 || alertesUrgentes > 2) {
                    niveauRisque = "MODERATE";
                } else {
                    niveauRisque = "LOW";
                }

                // Sentiment classification derived from ML conditions
                String sentiment;
                boolean isVeryDissatisfied = scoreMoyen > SEUIL_SCORE_URGENT
                    || (scoreMoyen > SEUIL_SCORE_RECOMMANDE && tauxConf < 50 && alertesUrgentes > 5);
                boolean isDissatisfied = scoreMoyen > SEUIL_SCORE_RECOMMANDE
                    || tauxConf < 70 || alertesUrgentes > 3 || heuresMoyennes > SEUIL_HEURES_CRITIQUE;
                boolean isSatisfied = scoreMoyen < 50 && tauxConf > 85 && alertesUrgentes < 2 && heuresMoyennes < SEUIL_HEURES_MIN + 0.5;

                if (isVeryDissatisfied) {
                    sentiment = "VERY_DISSATISFIED";
                } else if (isDissatisfied) {
                    sentiment = "DISSATISFIED";
                } else if (isSatisfied) {
                    sentiment = "SATISFIED";
                } else {
                    sentiment = "NEUTRAL";
                }

                // Arrivée estimée & distance réelle depuis le trajet le plus récent
                LocalDateTime arriveeEstimee = null;
                Double distanceReelle = null;
                String pointDepart = null;
                String pointArrivee = null;
                String statutTrajet = null;
                String immatriculationVehicule = null;

                Trajet latestTrip = cp.stream()
                    .map(PauseAIPrediction::getTrajet)
                    .filter(t -> t.getStatut() == StatutTrajet.EN_COURS || t.getStatut() == StatutTrajet.ACTIF)
                    .findFirst()
                    .orElseGet(() -> cp.stream()
                        .map(PauseAIPrediction::getTrajet)
                        .filter(t -> t.getStatut() == StatutTrajet.COMPLETE)
                        .findFirst().orElse(null));

                if (latestTrip != null) {
                    if (latestTrip.getStatut() == StatutTrajet.COMPLETE) {
                        arriveeEstimee = latestTrip.getDateArriveeReelle();
                        distanceReelle = latestTrip.getDistanceKm();
                    } else {
                        // In-progress: estimate arrival from departure + duration
                        if (latestTrip.getDateDepart() != null && latestTrip.getDureeEstimeeMinutes() != null) {
                            arriveeEstimee = latestTrip.getDateDepart()
                                .plusMinutes(latestTrip.getDureeEstimeeMinutes());
                        }
                        // Real distance = Haversine from departure to latest prediction POI
                        PauseAIPrediction latestPred = cp.stream()
                            .filter(p -> p.getTrajet().getId().equals(latestTrip.getId()))
                            .max(Comparator.comparing(PauseAIPrediction::getTimestamp))
                            .orElse(null);
                        if (latestPred != null && latestPred.getLatitudePoi() != null
                            && latestTrip.getLatitudeDepart() != null) {
                            distanceReelle = haversineKm(
                                latestTrip.getLatitudeDepart(), latestTrip.getLongitudeDepart(),
                                latestPred.getLatitudePoi(), latestPred.getLongitudePoi());
                        } else {
                            distanceReelle = latestTrip.getDistanceKm();
                        }
                    }
                    pointDepart = latestTrip.getPointDepart();
                    pointArrivee = latestTrip.getDestination();
                    statutTrajet = latestTrip.getStatut().name();
                    if (latestTrip.getVehicule() != null) {
                        immatriculationVehicule = latestTrip.getVehicule().getMatricule();
                    }
                }

                return PauseAIDashboardResponse.ChauffeurStats.builder()
                    .chauffeurId(cId)
                    .nomChauffeur(chauffeur.getPrenom() + " " + chauffeur.getNom())
                    .nombreMissions(nbMissions)
                    .scoreFatigueMoyen(Math.round(scoreMoyen * 100.0) / 100.0)
                    .alertesUrgentes(alertesUrgentes)
                    .pausesIgnorees(pausesIgnChauf)
                    .tauxConformite(Math.round(tauxConf * 100.0) / 100.0)
                    .niveauRisque(niveauRisque)
                    .distanceMoyenneParJour(Math.round(distanceMoyenneParJour * 100.0) / 100.0)
                    .heuresMoyennesConduite(Math.round(heuresMoyennes * 100.0) / 100.0)
                    .pausesRecommandees(totalAlertesChauf)
                    .pausesEffectuees(pausesEffChauf)
                    .scoreMoyenAccessibilite(Math.round(scoreAccessibilite * 100.0) / 100.0)
                    .sentiment(sentiment)
                    .arriveeEstimee(arriveeEstimee)
                    .distanceReelle(distanceReelle != null ? Math.round(distanceReelle * 100.0) / 100.0 : null)
                    .pointDepart(pointDepart)
                    .pointArrivee(pointArrivee)
                    .statutTrajet(statutTrajet)
                    .immatriculationVehicule(immatriculationVehicule)
                    .build();
            })
            .collect(Collectors.toList());

        // ML Insights computed from actual prediction data
        PauseAIDashboardResponse.MLInsights mlInsights = computeMLInsights(
            predictions, pausesByTrajet, chauffeurStats, startDate, endDate);

        // Heatmap points with enhanced data
        List<PauseAIDashboardResponse.HeatmapPoint> heatmapPoints = predictions.stream()
            .filter(PauseAIPrediction::getAlerteDeclenchee)
            .filter(p -> p.getLatitudePoi() != null && p.getLongitudePoi() != null)
            .map(pred -> {
                String type = "RECOMMANDEE_EFFECTUEE";
                List<PauseReglementaire> tp = pausesByTrajet.get(pred.getTrajet().getId());
                boolean effectuee = tp != null && tp.stream().anyMatch(p -> p.getStatut() == StatutPause.ATTEINTE);

                if (pred.getTypeAlerte() == TypeAlerteIA.URGENTE && !effectuee) {
                    type = "URGENTE_IGNOREE";
                } else if (!effectuee) {
                    type = "RECOMMANDEE_IGNOREE";
                }
                String chauffeurNom = pred.getTrajet().getChauffeur() != null
                    ? pred.getTrajet().getChauffeur().getPrenom() + " " + pred.getTrajet().getChauffeur().getNom()
                    : "N/A";

                return PauseAIDashboardResponse.HeatmapPoint.builder()
                    .latitude(pred.getLatitudePoi())
                    .longitude(pred.getLongitudePoi())
                    .type(type)
                    .score(pred.getScore())
                    .nomLieu(pred.getNomPoi())
                    .fatigueScore(pred.getScore())
                    .accessibilityScore(computePoiAccessibilityScore(pred.getPoiType()))
                    .timestamp(pred.getTimestamp())
                    .chauffeurNom(chauffeurNom)
                    .build();
            })
            .collect(Collectors.toList());

        return PauseAIDashboardResponse.builder()
            .totalPausesRecommandees(totalRecommandees)
            .pausesEffectuees(pausesEffectuees)
            .pausesIgnorees(pausesIgnorees)
            .tauxConformite(Math.round(tauxConformite * 100.0) / 100.0)
            .scoreMoyenFatigue(Math.round(scoreMoyenFatigue * 100.0) / 100.0)
            .mlInsights(mlInsights)
            .chauffeurStats(chauffeurStats)
            .heatmapPoints(heatmapPoints)
            .build();
    }

    private PauseAIDashboardResponse.MLInsights computeMLInsights(
            List<PauseAIPrediction> predictions,
            Map<Long, List<PauseReglementaire>> pausesByTrajet,
            List<PauseAIDashboardResponse.ChauffeurStats> chauffeurStats,
            LocalDateTime startDate,
            LocalDateTime endDate) {

        // Split predictions into first and second half for trend analysis
        int midPoint = predictions.size() / 2;
        List<PauseAIPrediction> firstHalf = predictions.subList(0, midPoint);
        List<PauseAIPrediction> secondHalf = predictions.subList(midPoint, predictions.size());

        double firstHalfCompliance = computeComplianceFor(firstHalf, pausesByTrajet);
        double secondHalfCompliance = computeComplianceFor(secondHalf, pausesByTrajet);
        double tendanceConformite = firstHalfCompliance > 0
            ? ((secondHalfCompliance - firstHalfCompliance) / firstHalfCompliance) * 100.0
            : 0.0;

        double firstHalfFatigue = firstHalf.stream().mapToInt(PauseAIPrediction::getScore).average().orElse(0.0);
        double secondHalfFatigue = secondHalf.stream().mapToInt(PauseAIPrediction::getScore).average().orElse(0.0);
        double tendanceFatigue = firstHalfFatigue > 0
            ? ((secondHalfFatigue - firstHalfFatigue) / firstHalfFatigue) * 100.0
            : 0.0;

        // Max fatigue score and highest risk driver
        double scoreFatigueMax = chauffeurStats.stream()
            .mapToDouble(PauseAIDashboardResponse.ChauffeurStats::getScoreFatigueMoyen)
            .max().orElse(0.0);

        String chauffeurPlusRisque = chauffeurStats.stream()
            .max(Comparator.comparingDouble(PauseAIDashboardResponse.ChauffeurStats::getScoreFatigueMoyen))
            .map(PauseAIDashboardResponse.ChauffeurStats::getNomChauffeur)
            .orElse("N/A");

        // Count drivers by fatigue level
        int chauffeursCritiques = (int) chauffeurStats.stream()
            .filter(s -> s.getScoreFatigueMoyen() > SEUIL_SCORE_URGENT)
            .count();
        int chauffeursModeres = (int) chauffeurStats.stream()
            .filter(s -> s.getScoreFatigueMoyen() > SEUIL_SCORE_RECOMMANDE
                      && s.getScoreFatigueMoyen() <= SEUIL_SCORE_URGENT)
            .count();

        // Pause pattern analysis
        int pausesHeuresRepas = (int) predictions.stream()
            .filter(p -> p.getTimestamp() != null)
            .filter(p -> {
                int h = p.getTimestamp().getHour();
                return (h >= 11 && h <= 14) || (h >= 18 && h <= 21);
            })
            .count();

        int pausesNuit = (int) predictions.stream()
            .filter(p -> p.getTimestamp() != null)
            .filter(p -> {
                int h = p.getTimestamp().getHour();
                return h >= 22 || h <= 6;
            })
            .count();

        // Mid-route pauses (40-60% along route)
        long midRoutePauses = predictions.stream()
            .filter(PauseAIPrediction::getAlerteDeclenchee)
            .filter(p -> p.getDistAlongRatio() >= 0.40 && p.getDistAlongRatio() <= 0.60)
            .count();
        long totalAlerted = predictions.stream().filter(PauseAIPrediction::getAlerteDeclenchee).count();
        double tauxPausesMiParcours = totalAlerted > 0 ? (midRoutePauses * 100.0 / totalAlerted) : 0.0;

        // AI acceptance rate
        long followed = predictions.stream()
            .filter(PauseAIPrediction::getAlerteDeclenchee)
            .filter(pred -> {
                List<PauseReglementaire> tp = pausesByTrajet.get(pred.getTrajet().getId());
                if (tp == null) return false;
                return tp.stream().anyMatch(p -> p.getStatut() == StatutPause.ATTEINTE);
            })
            .count();
        double tauxAcceptationAI = totalAlerted > 0 ? (followed * 100.0 / totalAlerted) : 100.0;

        // Voluntary pauses (pauses taken without any AI alert)
        int pausesVolontaires = (int) pausesByTrajet.values().stream()
            .flatMap(Collection::stream)
            .filter(p -> p.getStatut() == StatutPause.ATTEINTE)
            .filter(p -> predictions.stream()
                .filter(PauseAIPrediction::getAlerteDeclenchee)
                .noneMatch(pred -> pred.getTrajet().getId().equals(p.getTrajet().getId())))
            .count();

        // Average AI score of completed pauses
        double scoreMoyenPausesEff = predictions.stream()
            .filter(PauseAIPrediction::getAlerteDeclenchee)
            .filter(pred -> {
                List<PauseReglementaire> tp = pausesByTrajet.get(pred.getTrajet().getId());
                if (tp == null) return false;
                return tp.stream().anyMatch(p -> p.getStatut() == StatutPause.ATTEINTE);
            })
            .mapToInt(PauseAIPrediction::getScore)
            .average().orElse(0.0);

        return PauseAIDashboardResponse.MLInsights.builder()
            .chauffeursCritiquesFatigue(chauffeursCritiques)
            .chauffeursModereesFatigue(chauffeursModeres)
            .scoreFatigueMax(Math.round(scoreFatigueMax * 100.0) / 100.0)
            .chauffeurPlusRisque(chauffeurPlusRisque)
            .tendanceConformite(Math.round(tendanceConformite * 100.0) / 100.0)
            .tendanceScoreFatigue(Math.round(tendanceFatigue * 100.0) / 100.0)
            .pausesHeuresRepas(pausesHeuresRepas)
            .pausesNuit(pausesNuit)
            .tauxPausesMiParcours(Math.round(tauxPausesMiParcours * 100.0) / 100.0)
            .tauxAcceptationAI(Math.round(tauxAcceptationAI * 100.0) / 100.0)
            .pausesVolontaires(pausesVolontaires)
            .scoreMoyenPausesEffectuees(Math.round(scoreMoyenPausesEff * 100.0) / 100.0)
            .build();
    }

    private double computeComplianceFor(List<PauseAIPrediction> preds,
                                         Map<Long, List<PauseReglementaire>> pausesByTrajet) {
        if (preds.isEmpty()) return 100.0;
        long alerted = preds.stream().filter(PauseAIPrediction::getAlerteDeclenchee).count();
        if (alerted == 0) return 100.0;
        long completed = preds.stream()
            .filter(PauseAIPrediction::getAlerteDeclenchee)
            .filter(pred -> {
                List<PauseReglementaire> tp = pausesByTrajet.get(pred.getTrajet().getId());
                if (tp == null) return false;
                return tp.stream().anyMatch(p -> p.getStatut() == StatutPause.ATTEINTE);
            })
            .count();
        return completed * 100.0 / alerted;
    }

    private int computePoiAccessibilityScore(String poiType) {
        if (poiType == null) return 50;
        String pt = poiType.toLowerCase();
        if (pt.contains("services") || pt.contains("rest_area")) return 90;
        if (pt.contains("fuel") || pt.contains("station")) return 75;
        if (pt.contains("restaurant") || pt.contains("cafe") || pt.contains("fast_food")) return 60;
        if (pt.contains("parking")) return 55;
        return 40;
    }

    @Override
    public String exportDashboardCsv(LocalDateTime startDate, LocalDateTime endDate, Long chauffeurId) {
        List<PauseAIPrediction> predictions = resolveAccessiblePredictions(startDate, endDate, chauffeurId);
        if (predictions.isEmpty()) {
            return "chauffeur,date trajet,trajet,score moyen,alertes urgentes,pauses effectuees,pauses ignorees,taux conformite\n";
        }

        Map<Long, List<PauseAIPrediction>> predictionsByTrajet = predictions.stream()
            .collect(Collectors.groupingBy(pred -> pred.getTrajet().getId()));

        StringBuilder csv = new StringBuilder();
        csv.append("chauffeur,date trajet,trajet,score moyen,alertes urgentes,pauses effectuees,pauses ignorees,taux conformite\n");

        for (Map.Entry<Long, List<PauseAIPrediction>> entry : predictionsByTrajet.entrySet()) {
            List<PauseAIPrediction> trajPredictions = entry.getValue();
            if (trajPredictions.isEmpty()) {
                continue;
            }

            Trajet trajet = trajPredictions.get(0).getTrajet();
            List<PauseReglementaire> trajPauses = pauseRepository.findByTrajetId(trajet.getId());
            int alertesUrgentes = (int) trajPredictions.stream().filter(pred -> pred.getTypeAlerte() == TypeAlerteIA.URGENTE).count();
            int alertesTotales = (int) trajPredictions.stream().filter(PauseAIPrediction::getAlerteDeclenchee).count();
            int pausesEffectueesTrajet = (int) trajPredictions.stream()
                .filter(PauseAIPrediction::getAlerteDeclenchee)
                .filter(pred -> trajPauses.stream().anyMatch(p -> p.getStatut() == StatutPause.ATTEINTE))
                .count();
            int pausesIgnoreesTrajet = Math.max(0, alertesTotales - pausesEffectueesTrajet);
            double tauxConformiteTrajet = alertesTotales > 0 ? (pausesEffectueesTrajet * 100.0 / alertesTotales) : 100.0;
            double scoreMoyen = trajPredictions.stream().mapToInt(PauseAIPrediction::getScore).average().orElse(0.0);

            csv.append(csvEscape(trajet.getChauffeur() != null ? (trajet.getChauffeur().getPrenom() + " " + trajet.getChauffeur().getNom()).trim() : "N/A")).append(',')
                .append(csvEscape(trajet.getDateDepart() != null ? trajet.getDateDepart().toString() : trajPredictions.get(0).getTimestamp().toString())).append(',')
                .append(csvEscape((trajet.getPointDepart() != null ? trajet.getPointDepart() : "Départ") + " - " + (trajet.getDestination() != null ? trajet.getDestination() : "Arrivée"))).append(',')
                .append(formatCsvNumber(scoreMoyen)).append(',')
                .append(alertesUrgentes).append(',')
                .append(pausesEffectueesTrajet).append(',')
                .append(pausesIgnoreesTrajet).append(',')
                .append(formatCsvNumber(tauxConformiteTrajet))
                .append('\n');
        }

        return csv.toString();
    }

    @Override
    public Map<String, Object> getPausesCompletes(Long trajetId) {
        Trajet trajet = trajetRepository.findById(trajetId)
            .orElseThrow(() -> new ResourceNotFoundException("Trajet introuvable"));
        
        verifierAccesTrajet(trajet);
        
        log.info("[PAUSE-AI] Récupération pauses complètes pour trajet {} (lat_depart={}, lon_depart={}, lat_arrivee={}, lon_arrivee={})",
                 trajetId, trajet.getLatitudeDepart(), trajet.getLongitudeDepart(), 
                 trajet.getLatitudeArrivee(), trajet.getLongitudeArrivee());
        
        // Construire la requête pour l'API Flask /api/predict
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("startLat", trajet.getLatitudeDepart());
        requestBody.put("startLon", trajet.getLongitudeDepart());
        requestBody.put("endLat", trajet.getLatitudeArrivee());
        requestBody.put("endLon", trajet.getLongitudeArrivee());
        requestBody.put("trip_id", trajetId);
        
        if (trajet.getDureeEstimeeMinutes() != null) {
            requestBody.put("trip_duration_minutes", trajet.getDureeEstimeeMinutes());
        }
        
        if (trajet.getDateDepart() != null) {
            requestBody.put("departure_time", trajet.getDateDepart().toString());
        }
        
        String url = pauseAiUrl + "/api/predict";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
        
        try {
            log.info("[PAUSE-AI] Appel Flask POST {}", url);
            @SuppressWarnings("rawtypes")
            ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);
            @SuppressWarnings("unchecked")
            Map<String, Object> result = (Map<String, Object>) response.getBody();
            
            if (result == null) {
                log.warn("[PAUSE-AI] Réponse Flask vide pour trajet {}", trajetId);
                return Map.of("stops", List.of(), "meta", Map.of());
            }
            
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> stops = (List<Map<String, Object>>) result.getOrDefault("stops", List.of());
            
            // Mapper les champs lat/lon vers latitude/longitude pour compatibilité frontend
            List<Map<String, Object>> mappedStops = stops.stream()
                .map(stop -> {
                    Map<String, Object> mapped = new HashMap<>(stop);
                    if (stop.containsKey("lat")) {
                        mapped.put("latitude", stop.get("lat"));
                    }
                    if (stop.containsKey("lon")) {
                        mapped.put("longitude", stop.get("lon"));
                    }
                    return mapped;
                })
                .collect(Collectors.toList());
            
            log.info("[PAUSE-AI] ✅ {} points de pause retournés pour trajet {} (types: {})",
                     mappedStops.size(), trajetId,
                     mappedStops.stream()
                         .map(s -> String.valueOf(s.get("type")))
                         .distinct()
                         .collect(Collectors.joining(", ")));
            
            Map<String, Object> finalResult = new HashMap<>(result);
            finalResult.put("stops", mappedStops);
            return finalResult;
            
        } catch (Exception e) {
            log.error("[PAUSE-AI] ❌ Erreur lors de l'appel Flask pour trajet {}: {}", trajetId, e.getMessage(), e);
            throw new RuntimeException("Impossible de récupérer les pauses complètes depuis l'API Flask", e);
        }
    }

    // ========== Méthodes privées ==========

    private Map<String, Object> rechercherMeilleurPOI(Double lat, Double lon) {
        // Appel Overpass pour trouver les POIs dans un rayon de 500m
        // Pour simplifier, on retourne un POI fictif si aucun n'est trouvé
        
        Map<String, Object> poiFictif = new HashMap<>();
        poiFictif.put("type", "BAS_COTE");
        poiFictif.put("lat", lat);
        poiFictif.put("lon", lon);
        poiFictif.put("name", "Arrêt bas-côté");
        poiFictif.put("distance", 800.0);
        poiFictif.put("tags", new HashMap<String, String>());
        
        // TODO: Implémenter la vraie recherche Overpass avec priorisation :
        // 1. highway=services
        // 2. highway=rest_area
        // 3. amenity=fuel
        // 4. amenity=restaurant
        // 5. autres
        
        return poiFictif;
    }

    private List<PauseAIPrediction> resolveAccessiblePredictions(LocalDateTime startDate, LocalDateTime endDate, Long chauffeurId) {
        Utilisateur currentUser = authenticatedUserService.getCurrentUser();
        Role userRole = currentUser.getRole();

        if (userRole == Role.SUPERADMIN) {
            if (chauffeurId != null) {
                return predictionRepository.findByChauffeurIdAndDateRange(chauffeurId, startDate, endDate);
            }
            return predictionRepository.findByDateRange(startDate, endDate);
        }

        if (userRole == Role.MANAGER) {
            Long entrepriseId = currentUser.getEntreprise() != null ? currentUser.getEntreprise().getId() : null;
            if (entrepriseId == null) {
                throw new IllegalStateException("Manager sans entreprise associée");
            }

            if (chauffeurId != null) {
                List<PauseAIPrediction> predictions = predictionRepository.findByChauffeurIdAndDateRange(chauffeurId, startDate, endDate);
                if (!predictions.isEmpty()
                    && predictions.get(0).getTrajet().getChauffeur() != null
                    && predictions.get(0).getTrajet().getChauffeur().getEntreprise() != null
                    && !predictions.get(0).getTrajet().getChauffeur().getEntreprise().getId().equals(entrepriseId)) {
                    throw new ResourceNotFoundException("Chauffeur non accessible");
                }
                return predictions;
            }

            return predictionRepository.findByEntrepriseIdAndDateRange(entrepriseId, startDate, endDate);
        }

        throw new IllegalStateException("Rôle non autorisé pour accéder au dashboard");
    }

    private String csvEscape(String value) {
        if (value == null) {
            return "";
        }
        return '"' + value.replace("\"", "\"\"") + '"';
    }

    private String formatCsvNumber(double value) {
        return String.format(Locale.ROOT, "%.2f", value);
    }

    private String formatDouble(Double value) {
        if (value == null) {
            return "0.00";
        }
        return String.format(Locale.ROOT, "%.2f", value);
    }

    private String isTagYes(Map<String, Object> poi, String key) {
        @SuppressWarnings("unchecked")
        Map<String, String> tags = (Map<String, String>) poi.getOrDefault("tags", new HashMap<>());
        return "yes".equalsIgnoreCase(tags.get(key)) ? "oui" : "non";
    }

    private Map<String, Object> construireFeaturesIA(Trajet trajet, double hoursDriving, 
                                                      double distAlongRatio, Double currentLat, 
                                                      Double currentLon, Map<String, Object> poi) {
        Map<String, Object> features = new HashMap<>();
        
        double totalDistanceKm = trajet.getDistanceKm() != null ? trajet.getDistanceKm() : 0.0;
        double totalDistanceM = totalDistanceKm * 1000.0;
        double distAlongM = Math.max(0.0, Math.min(1.0, distAlongRatio)) * totalDistanceM;
        features.put("total_distance_m", totalDistanceM);
        features.put("dist_along_m", distAlongM);
        
        Double perpDistanceM = (Double) poi.getOrDefault("distance", 500.0);
        features.put("perp_dist_m", perpDistanceM);
        features.put("hours_driving", hoursDriving);
        
        int arrivalHour = LocalDateTime.now().getHour();
        features.put("arrival_hour", arrivalHour);
        
        // Encoder le type de POI
        String poiType = (String) poi.getOrDefault("type", "");
        int poiTypeEncoded = switch (poiType) {
            case "fuel" -> 1;
            case "restaurant", "fast_food" -> 2;
            case "cafe" -> 3;
            case "rest_area" -> 4;
            case "services" -> 5;
            default -> 0;
        };
        features.put("poi_type_encoded", poiTypeEncoded);
        
        // Features booléennes
        boolean isMealPoi = poiType.equals("restaurant") || poiType.equals("fast_food") || 
                            poiType.equals("cafe") || poiType.equals("services");
        features.put("is_meal_poi", isMealPoi ? 1 : 0);
        
        boolean isMealHour = (arrivalHour >= 6 && arrivalHour <= 9) || 
                             (arrivalHour >= 11 && arrivalHour <= 14) || 
                             (arrivalHour >= 18 && arrivalHour <= 21);
        features.put("is_meal_hour", isMealHour ? 1 : 0);
        
        boolean isMidRangeFuel = poiType.equals("fuel") && distAlongRatio >= 0.40 && distAlongRatio <= 0.85;
        features.put("is_mid_range_fuel", isMidRangeFuel ? 1 : 0);
        
        features.put("is_too_close", distAlongRatio < 0.06 ? 1 : 0);
        
        boolean isHighwayService = poiType.equals("services") || poiType.equals("rest_area");
        features.put("is_highway_service", isHighwayService ? 1 : 0);
        
        // Tags du POI
        @SuppressWarnings("unchecked")
        Map<String, String> tags = (Map<String, String>) poi.getOrDefault("tags", new HashMap<>());
        features.put("has_hgv", tags.getOrDefault("hgv", "").equals("yes") ? 1 : 0);
        features.put("has_shower", tags.getOrDefault("shower", "").equals("yes") ? 1 : 0);
        features.put("has_toilets", tags.getOrDefault("toilets", "").equals("yes") ? 1 : 0);
        features.put("is_24h", tags.getOrDefault("opening_hours", "").equals("24/7") ? 1 : 0);
        features.put("poi_tags", new HashMap<>(tags));
        
        return features;
    }

    private Integer appellerModeleIA(Map<String, Object> features) throws Exception {
        String url = pauseAiUrl + "/api/predict/batch";
        
        Map<String, Object> requestBody = new HashMap<>();
        List<Map<String, Object>> candidates = new ArrayList<>();
        Map<String, Object> candidate = new HashMap<>();
        candidate.put("poi", Map.of("tags", features.getOrDefault("poi_tags", Map.of())));
        candidate.put("dist_along_m", features.get("dist_along_m"));
        candidate.put("total_distance_m", features.get("total_distance_m"));
        candidate.put("perp_dist_m", features.get("perp_dist_m"));
        candidate.put("arrival_hour", features.get("arrival_hour"));
        candidate.put("hours_driving", features.get("hours_driving"));
        candidates.add(candidate);
        requestBody.put("candidates", candidates);
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        String jsonBody = objectMapper.writeValueAsString(requestBody);
        HttpEntity<String> request = new HttpEntity<>(jsonBody, headers);
        
        log.info("[PAUSE-AI] Appel au modèle IA: POST {}", url);
        log.debug("[PAUSE-AI] Request body: {}", jsonBody);
        
        ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);
        String responseBody = response.getBody();
        
        log.debug("[PAUSE-AI] Response: {}", responseBody);
        
        Map<String, Object> result = objectMapper.readValue(responseBody, new TypeReference<>() {});
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> scores = (List<Map<String, Object>>) result.get("scores");
        
        if (scores == null || scores.isEmpty()) {
            throw new RuntimeException("Aucun score retourné par le modèle IA");
        }
        
        Object aiScoreObj = scores.get(0).get("ai_score");
        if (aiScoreObj instanceof Number) {
            return ((Number) aiScoreObj).intValue();
        }
        
        throw new RuntimeException("Format de réponse invalide");
    }

    private void declencherAlerteSSE(Trajet trajet, PauseAIPrediction prediction, Map<String, Object> poi) {
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
            Map<String, Object> eventData = new HashMap<>();
            eventData.put("trajetId", trajet.getId());
            eventData.put("predictionId", prediction.getId());
            eventData.put("score", prediction.getScore());
            eventData.put("typeAlerte", prediction.getTypeAlerte());
            eventData.put("hoursDriving", prediction.getHoursDriving());
            eventData.put("poi", poi);
            
            log.info("[PAUSE-AI] Envoi SSE PAUSE_AI_ALERT pour trajet {} à {} utilisateurs", 
                     trajet.getId(), distinctAudience.size());
            
            notificationRealtimeService.publishNamedEventToUsers(
                distinctAudience, "PAUSE_AI_ALERT", eventData);
        }
    }

    private void verifierAccesTrajet(Trajet trajet) {
        try {
            Utilisateur currentUser = authenticatedUserService.getCurrentUser();
            Role userRole = currentUser.getRole();
            Long userId = currentUser.getId();

            if (userRole == Role.SUPERADMIN) {
                return; // Accès total
            }

            if (userRole == Role.MANAGER) {
                boolean isManagerOfChauffeur = trajet.getChauffeur() != null 
                    && trajet.getChauffeur().getManager() != null 
                    && trajet.getChauffeur().getManager().getId().equals(userId);
                
                boolean isSameCompany = false;
                if (currentUser.getEntreprise() != null && trajet.getChauffeur() != null 
                    && trajet.getChauffeur().getEntreprise() != null) {
                    isSameCompany = trajet.getChauffeur().getEntreprise().getId()
                        .equals(currentUser.getEntreprise().getId());
                }
                
                if (!isManagerOfChauffeur && !isSameCompany) {
                    throw new ResourceNotFoundException("Accès refusé à ce trajet");
                }
                return;
            }

            if (userRole == Role.CHAUFFEUR) {
                if (trajet.getChauffeur() == null || !trajet.getChauffeur().getId().equals(userId)) {
                    throw new ResourceNotFoundException("Accès refusé à ce trajet");
                }
                return;
            }

            throw new ResourceNotFoundException("Rôle non autorisé");
        } catch (Exception e) {
            throw new ResourceNotFoundException("Accès refusé");
        }
    }

    private PauseAIPredictionResponse toResponse(PauseAIPrediction prediction) {
        return PauseAIPredictionResponse.builder()
            .id(prediction.getId())
            .trajetId(prediction.getTrajet().getId())
            .timestamp(prediction.getTimestamp())
            .hoursDriving(prediction.getHoursDriving())
            .distAlongRatio(prediction.getDistAlongRatio())
            .score(prediction.getScore())
            .poiType(prediction.getPoiType())
            .alerteDeclenchee(prediction.getAlerteDeclenchee())
            .typeAlerte(prediction.getTypeAlerte())
            .latitudePoi(prediction.getLatitudePoi())
            .longitudePoi(prediction.getLongitudePoi())
            .nomPoi(prediction.getNomPoi())
            .distancePoiM(prediction.getDistancePoiM())
            .build();
    }

    private double haversineKm(Double lat1, Double lon1, Double lat2, Double lon2) {
        if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return 0.0;
        final int R = 6371;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                 + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                 * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
}
