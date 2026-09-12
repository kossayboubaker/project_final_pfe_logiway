package com.logiway.services;

import com.logiway.dto.trajet.TrajetRequest;
import com.logiway.entities.Vehicule;
import com.logiway.entities.enums.StatutVehicule;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class TrajetOptimisationService {

    private final OsrmService osrmService;

    public List<OptimizationAssignment> optimiser(List<TrajetRequest> trajets, List<Vehicule> vehiculesDisponibles) {
        List<TrajetRequest> orderedTrajets = new ArrayList<>(trajets == null ? List.of() : trajets);
        orderedTrajets.sort(Comparator.comparing(TrajetRequest::priorite, Comparator.nullsLast(Comparator.naturalOrder())).reversed());

        List<Vehicule> fleet = vehiculesDisponibles == null ? List.of() : vehiculesDisponibles.stream()
            .filter(v -> v.getStatut() == StatutVehicule.EN_SERVICE)
            .sorted(Comparator.comparing(Vehicule::getId))
            .toList();

        List<OptimizationAssignment> assignments = new ArrayList<>();
        if (orderedTrajets.isEmpty() || fleet.isEmpty()) {
            return assignments;
        }

        Map<Long, Double> loadByVehicle = new LinkedHashMap<>();
        for (Vehicule vehicule : fleet) {
            loadByVehicle.put(vehicule.getId(), 0d);
        }

        for (TrajetRequest trajet : orderedTrajets) {
            Vehicule selected = selectVehicle(fleet, loadByVehicle);
            String opt = trajet.typeOptimisation() != null ? trajet.typeOptimisation() : "shortest";
            OsrmService.RouteEstimation route = osrmService.calculerItineraire(
                trajet.latitudeDepart(), trajet.longitudeDepart(), trajet.latitudeArrivee(), trajet.longitudeArrivee(), opt);

            if (selected != null) {
                loadByVehicle.computeIfPresent(selected.getId(), (key, value) -> value + (route != null ? route.distanceKm() : 1d));
                assignments.add(new OptimizationAssignment(trajet, selected, route));
            }
        }

        return assignments;
    }

    private Vehicule selectVehicle(List<Vehicule> fleet, Map<Long, Double> loadByVehicle) {
        return fleet.stream()
            .min(Comparator.comparing(v -> loadByVehicle.getOrDefault(v.getId(), 0d)))
            .orElse(null);
    }

    public record OptimizationAssignment(TrajetRequest trajet, Vehicule vehicule, OsrmService.RouteEstimation route) {
    }
}