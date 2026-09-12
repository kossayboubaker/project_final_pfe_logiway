package com.logiway.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.logiway.dto.meteo.MeteoResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class MeteoService {

    private static final double CACHE_DISTANCE_KM = 10.0;
    private static final Duration CACHE_TTL = Duration.ofMinutes(5);

    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate = new RestTemplate();
    private final Map<String, CacheEntry> cache = new ConcurrentHashMap<>();

    @Value("${openweather.api-key:}")
    private String apiKey;

    @Value("${openweather.base-url:https://api.openweathermap.org/data/2.5/weather}")
    private String baseUrl;

    public MeteoResponse getMeteo(double lat, double lon) {
        CacheEntry reusable = findReusableEntry(lat, lon);
        if (reusable != null) {
            return reusable.response();
        }

        MeteoResponse weather = fetchWeather(lat, lon);
        cache.put(cacheKey(lat, lon), new CacheEntry(lat, lon, weather, Instant.now().plus(CACHE_TTL)));
        return weather;
    }

    private MeteoResponse fetchWeather(double lat, double lon) {
        try {
            String url = UriComponentsBuilder.fromHttpUrl(baseUrl)
                .queryParam("lat", lat)
                .queryParam("lon", lon)
                .queryParam("appid", apiKey)
                .queryParam("units", "metric")
                .queryParam("lang", "fr")
                .toUriString();

            String payload = restTemplate.getForObject(url, String.class);
            if (payload == null || payload.isBlank()) {
                return fallbackWeather();
            }

            JsonNode root = objectMapper.readTree(payload);
            JsonNode weatherNode = root.path("weather").isArray() && root.path("weather").size() > 0 ? root.path("weather").get(0) : null;
            String weatherMain = weatherNode != null ? weatherNode.path("main").asText("") : "";
            String weatherDescription = weatherNode != null ? weatherNode.path("description").asText("") : "";
            String iconCode = weatherNode != null ? weatherNode.path("icon").asText("01d") : "01d";

            double temperature = root.path("main").path("temp").asDouble(Double.NaN);
            double windKmH = root.path("wind").path("speed").asDouble(0.0) * 3.6;
            int humidity = root.path("main").path("humidity").asInt(0);
            double visibilityKm = root.path("visibility").asDouble(0.0) / 1000.0;

            String etatGeneral = resolveState(weatherMain, weatherDescription, visibilityKm);
            String risk = resolveRisk(etatGeneral, visibilityKm, windKmH);
            boolean dangerous = "ROUGE".equals(risk);

            return new MeteoResponse(
                Double.isNaN(temperature) ? null : round1(temperature),
                normalizeDescription(weatherDescription, weatherMain),
                iconCode,
                round1(windKmH),
                humidity > 0 ? humidity : null,
                visibilityKm > 0 ? round1(visibilityKm) : null,
                etatGeneral,
                risk,
                dangerous
            );
        } catch (Exception ex) {
            log.warn("OpenWeather fetch failed for {}, {}: {}", lat, lon, ex.getMessage());
            CacheEntry recent = findAnyCachedEntry(lat, lon).orElse(null);
            return recent != null ? recent.response() : fallbackWeather();
        }
    }

    private CacheEntry findReusableEntry(double lat, double lon) {
        Instant now = Instant.now();
        return cache.values().stream()
            .filter(entry -> entry.expiresAt().isAfter(now))
            .filter(entry -> distanceKm(entry.lat(), entry.lon(), lat, lon) <= CACHE_DISTANCE_KM)
            .findFirst()
            .orElse(null);
    }

    private Optional<CacheEntry> findAnyCachedEntry(double lat, double lon) {
        return cache.values().stream()
            .min((left, right) -> Double.compare(distanceKm(left.lat(), left.lon(), lat, lon), distanceKm(right.lat(), right.lon(), lat, lon)));
    }

    private String cacheKey(double lat, double lon) {
        return String.format("%.5f:%.5f", lat, lon);
    }

    private double distanceKm(double lat1, double lon1, double lat2, double lon2) {
        double radius = 6371.0;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
            + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
            * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return 2 * radius * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    private String resolveState(String weatherMain, String description, double visibilityKm) {
        String normalizedMain = weatherMain == null ? "" : weatherMain.trim().toUpperCase();
        if (visibilityKm > 0 && visibilityKm < 0.2) {
            return "BROUILLARD";
        }

        return switch (normalizedMain) {
            case "CLEAR" -> "CLAIR";
            case "CLOUDS" -> "NUAGEUX";
            case "RAIN", "DRIZZLE" -> "PLUIE";
            case "THUNDERSTORM" -> "ORAGE";
            case "SNOW" -> "NEIGE";
            case "MIST", "FOG", "HAZE", "SMOKE", "DUST", "SAND", "ASH", "SQUALL", "TORNADO" -> "BROUILLARD";
            default -> {
                String normalizedDescription = description == null ? "" : description.toLowerCase();
                if (normalizedDescription.contains("orage")) {
                    yield "ORAGE";
                }
                if (normalizedDescription.contains("neige")) {
                    yield "NEIGE";
                }
                if (normalizedDescription.contains("brouillard") || normalizedDescription.contains("brume") || normalizedDescription.contains("fog")) {
                    yield "BROUILLARD";
                }
                if (normalizedDescription.contains("pluie") || normalizedDescription.contains("rain")) {
                    yield "PLUIE";
                }
                yield "NUAGEUX";
            }
        };
    }

    private String resolveRisk(String etatGeneral, double visibilityKm, double windKmH) {
        return switch (etatGeneral) {
            case "ORAGE", "NEIGE", "BROUILLARD" -> "ROUGE";
            case "PLUIE" -> "ORANGE";
            case "CLAIR", "NUAGEUX" -> (visibilityKm > 0 && visibilityKm < 2.0) || windKmH > 35.0 ? "ORANGE" : "VERT";
            default -> "ORANGE";
        };
    }

    private String normalizeDescription(String description, String weatherMain) {
        if (description != null && !description.isBlank()) {
            return description;
        }

        return switch ((weatherMain == null ? "" : weatherMain).trim().toUpperCase()) {
            case "CLEAR" -> "Ciel dégagé";
            case "CLOUDS" -> "Nuageux";
            case "RAIN" -> "Pluie";
            case "DRIZZLE" -> "Bruine";
            case "THUNDERSTORM" -> "Orage";
            case "SNOW" -> "Neige";
            default -> "Conditions météo";
        };
    }

    private MeteoResponse fallbackWeather() {
        return new MeteoResponse(null, "Données météo indisponibles", "01d", null, null, null, "NUAGEUX", "ORANGE", false);
    }

    private double round1(double value) {
        return Math.round(value * 10.0) / 10.0;
    }

    private record CacheEntry(double lat, double lon, MeteoResponse response, Instant expiresAt) {
    }
}