package com.logiway.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;

@Service
@RequiredArgsConstructor
public class OsrmService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${osrm.base-url:http://router.project-osrm.org/route/v1/driving/}")
    private String osrmBaseUrl;

    @Value("${osrm.geocode-url:https://nominatim.openstreetmap.org/search}")
    private String geocodeUrl;

    public RouteEstimation calculerItineraire(Double latitudeDepart, Double longitudeDepart, Double latitudeArrivee, Double longitudeArrivee, String typeOptimisation) {
        if (latitudeDepart == null || longitudeDepart == null || latitudeArrivee == null || longitudeArrivee == null) {
            return null;
        }

        // Configuration du profil selon le choix du Manager
        // OSRM standard (driving) priorise le plus rapide (fastest) basé sur la durée. 
        // L'annotation "shortest" est passée via les annotations OSRM si supporté par le serveur cible
        String profileUrl = osrmBaseUrl;
        
        UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(profileUrl)
            .pathSegment(longitudeDepart.toString() + "," + latitudeDepart.toString() + ";" + longitudeArrivee.toString() + "," + latitudeArrivee.toString())
            .queryParam("overview", "full")
            .queryParam("geometries", "geojson")
            .queryParam("steps", "true");
            
        if ("shortest".equalsIgnoreCase(typeOptimisation)) {
            // OSRM Public Node supporte les annotations. Distance / Duration annotations.
            builder.queryParam("annotations", "true");
        }

        URI uri = builder.build(true).toUri();

        try {
            String body = restTemplate.getForObject(uri, String.class);
            if (body == null || body.isBlank()) {
                return null;
            }

            JsonNode root = objectMapper.readTree(body);
            JsonNode route = root.path("routes").isArray() && root.path("routes").size() > 0 ? root.path("routes").get(0) : null;
            if (route == null) {
                return null;
            }

            double distanceKm = route.path("distance").asDouble(0d) / 1000d;
            int durationMinutes = (int) Math.round(route.path("duration").asDouble(0d) / 60d);
            String geometry = route.path("geometry").toString();
            return new RouteEstimation(distanceKm, durationMinutes, geometry);
        } catch (Exception ex) {
            return null;
        }
    }

    public GeoPoint geocoder(String query) {
        if (query == null || query.isBlank()) {
            return null;
        }

        URI uri = UriComponentsBuilder.fromHttpUrl(geocodeUrl)
            .queryParam("q", query)
            .queryParam("format", "jsonv2")
            .queryParam("limit", 1)
            .build(true)
            .toUri();

        try {
            String body = restTemplate.getForObject(uri, String.class);
            if (body == null || body.isBlank()) {
                return null;
            }

            JsonNode root = objectMapper.readTree(body);
            if (!root.isArray() || root.isEmpty()) {
                return null;
            }

            JsonNode first = root.get(0);
            Double lat = first.path("lat").asDouble();
            Double lon = first.path("lon").asDouble();
            String label = first.path("display_name").asText(query);
            return new GeoPoint(lat, lon, label);
        } catch (Exception ex) {
            return null;
        }
    }

    public record RouteEstimation(Double distanceKm, Integer durationMinutes, String geometryJson) {
    }

    public record GeoPoint(Double latitude, Double longitude, String label) {
    }
}