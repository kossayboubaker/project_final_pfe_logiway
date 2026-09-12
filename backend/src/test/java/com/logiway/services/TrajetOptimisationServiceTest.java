package com.logiway.services;

import com.logiway.dto.trajet.TrajetRequest;
import com.logiway.entities.Vehicule;
import com.logiway.entities.enums.PrioriteTrajet;
import com.logiway.entities.enums.StatutVehicule;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("Service TrajetOptimisation — Tests Unitaires")
class TrajetOptimisationServiceTest {

    @Mock
    private OsrmService osrmService;

    private TrajetOptimisationService service;

    @BeforeEach
    void setUp() {
        service = new TrajetOptimisationService(osrmService);
    }

    private Vehicule vehicule(Long id, StatutVehicule statut) {
        return Vehicule.builder().id(id).matricule("V-" + id).statut(statut).build();
    }

    private TrajetRequest trajet(double lat, double lon, PrioriteTrajet priorite, String typeOpt) {
        return new TrajetRequest(
            "Paris", "Lyon",
            lat, lon,
            50.0, 4.0,
            null, null, null, priorite, null,
            null, null, null, null, typeOpt
        );
    }

    private OsrmService.RouteEstimation route(double distance) {
        return new OsrmService.RouteEstimation(distance, 60, "{}");
    }

    @Test
    @DisplayName("optimiser() → Liste nulle → résultat vide")
    void optimiser_nullTrajets_returnsEmpty() {
        assertThat(service.optimiser(null, List.of(vehicule(1L, StatutVehicule.EN_SERVICE)))).isEmpty();
        verify(osrmService, never()).calculerItineraire(any(), any(), any(), any(), anyString());
    }

    @Test
    @DisplayName("optimiser() → Aucun trajet → résultat vide")
    void optimiser_emptyTrajets_returnsEmpty() {
        assertThat(service.optimiser(List.of(), List.of(vehicule(1L, StatutVehicule.EN_SERVICE)))).isEmpty();
        verify(osrmService, never()).calculerItineraire(any(), any(), any(), any(), anyString());
    }

    @Test
    @DisplayName("optimiser() → Flotte vide → résultat vide")
    void optimiser_emptyFleet_returnsEmpty() {
        assertThat(service.optimiser(List.of(trajet(48.0, 2.0, PrioriteTrajet.NORMALE, "fastest")), List.of())).isEmpty();
        verify(osrmService, never()).calculerItineraire(any(), any(), any(), any(), anyString());
    }

    @Test
    @DisplayName("optimiser() → Uniquement des véhicules hors service → résultat vide")
    void optimiser_noInServiceVehicles_returnsEmpty() {
        List<Vehicule> fleet = List.of(
            vehicule(1L, StatutVehicule.EN_MAINTENANCE),
            vehicule(2L, StatutVehicule.HORS_SERVICE)
        );
        assertThat(service.optimiser(List.of(trajet(48.0, 2.0, PrioriteTrajet.NORMALE, "fastest")), fleet)).isEmpty();
        verify(osrmService, never()).calculerItineraire(any(), any(), any(), any(), anyString());
    }

    @Test
    @DisplayName("optimiser() → Assignations ordonnées par priorité décroissante")
    void optimiser_sortsByPriorityDescending() {
        TrajetRequest critique = trajet(48.0, 2.0, PrioriteTrajet.CRITIQUE, null);
        TrajetRequest normale = trajet(49.0, 3.0, PrioriteTrajet.NORMALE, null);
        TrajetRequest urgente = trajet(50.0, 4.0, PrioriteTrajet.URGENTE, null);

        when(osrmService.calculerItineraire(any(), any(), any(), any(), anyString()))
            .thenReturn(route(100.0));

        List<TrajetOptimisationService.OptimizationAssignment> result =
            service.optimiser(List.of(normale, critique, urgente),
                List.of(vehicule(1L, StatutVehicule.EN_SERVICE), vehicule(2L, StatutVehicule.EN_SERVICE)));

        assertThat(result).hasSize(3);
        assertThat(result.get(0).trajet().priorite()).isEqualTo(PrioriteTrajet.CRITIQUE);
        assertThat(result.get(1).trajet().priorite()).isEqualTo(PrioriteTrajet.URGENTE);
        assertThat(result.get(2).trajet().priorite()).isEqualTo(PrioriteTrajet.NORMALE);
    }

    @Test
    @DisplayName("optimiser() → Équilibre la charge : le véhicule le moins chargé est réutilisé")
    void optimiser_balancesLoadAcrossVehicles() {
        TrajetRequest t1 = trajet(48.0, 2.0, PrioriteTrajet.NORMALE, null);
        TrajetRequest t2 = trajet(49.0, 3.0, PrioriteTrajet.NORMALE, null);
        TrajetRequest t3 = trajet(50.0, 4.0, PrioriteTrajet.NORMALE, null);

        when(osrmService.calculerItineraire(any(), any(), any(), any(), anyString()))
            .thenReturn(route(200.0));

        List<TrajetOptimisationService.OptimizationAssignment> result =
            service.optimiser(List.of(t1, t2, t3),
                List.of(vehicule(1L, StatutVehicule.EN_SERVICE), vehicule(2L, StatutVehicule.EN_SERVICE)));

        assertThat(result).hasSize(3);
        // V1 (t1=200), V2 (t2=200), puis le moins chargé (V1) pour t3
        assertThat(result.get(0).vehicule().getId()).isEqualTo(1L);
        assertThat(result.get(1).vehicule().getId()).isEqualTo(2L);
        assertThat(result.get(2).vehicule().getId()).isEqualTo(1L);
    }

    @Test
    @DisplayName("optimiser() → Route nulle → charge forfaitaire de 1 km, route nulle dans l'assignation")
    void optimiser_nullRoute_assignsDefaultLoad() {
        TrajetRequest t1 = trajet(48.0, 2.0, PrioriteTrajet.NORMALE, null);
        TrajetRequest t2 = trajet(49.0, 3.0, PrioriteTrajet.NORMALE, null);

        when(osrmService.calculerItineraire(any(), any(), any(), any(), anyString()))
            .thenReturn(null);

        List<TrajetOptimisationService.OptimizationAssignment> result =
            service.optimiser(List.of(t1, t2), List.of(vehicule(1L, StatutVehicule.EN_SERVICE)));

        assertThat(result).hasSize(2);
        assertThat(result.get(0).route()).isNull();
        assertThat(result.get(1).route()).isNull();
    }

    @Test
    @DisplayName("optimiser() → typeOptimisation null → 'shortest' transmis à OSRM")
    void optimiser_nullTypeOptimisation_passesShortest() {
        TrajetRequest t = trajet(48.0, 2.0, PrioriteTrajet.NORMALE, null);
        when(osrmService.calculerItineraire(eq(48.0), eq(2.0), eq(50.0), eq(4.0), eq("shortest")))
            .thenReturn(route(50.0));

        List<TrajetOptimisationService.OptimizationAssignment> result =
            service.optimiser(List.of(t), List.of(vehicule(1L, StatutVehicule.EN_SERVICE)));

        assertThat(result).hasSize(1);
        assertThat(result.get(0).route().distanceKm()).isEqualTo(50.0);
    }

    @Test
    @DisplayName("optimiser() → typeOptimisation fourni → transmis tel quel")
    void optimiser_customTypeOptimisation_passedThrough() {
        TrajetRequest t = trajet(48.0, 2.0, PrioriteTrajet.NORMALE, "fastest");
        when(osrmService.calculerItineraire(eq(48.0), eq(2.0), eq(50.0), eq(4.0), eq("fastest")))
            .thenReturn(route(50.0));

        List<TrajetOptimisationService.OptimizationAssignment> result =
            service.optimiser(List.of(t), List.of(vehicule(1L, StatutVehicule.EN_SERVICE)));

        assertThat(result).hasSize(1);
        assertThat(result.get(0).vehicule().getId()).isEqualTo(1L);
    }

    @Test
    @DisplayName("optimiser() → flotte null → résultat vide")
    void optimiser_nullFleet_returnsEmpty() {
        assertThat(service.optimiser(List.of(trajet(48.0, 2.0, PrioriteTrajet.NORMALE, "fastest")), null)).isEmpty();
    }
}
