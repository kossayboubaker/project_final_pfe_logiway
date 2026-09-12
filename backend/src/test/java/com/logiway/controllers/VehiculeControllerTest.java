package com.logiway.controllers;

import com.logiway.dto.request.AssignVehiculeDriverRequest;
import com.logiway.dto.request.CreateVehiculeRequest;
import com.logiway.dto.request.UpdateVehiculeRequest;
import com.logiway.dto.request.UpdateVehiculeStatusRequest;
import com.logiway.dto.response.AvailableDriverResponse;
import com.logiway.dto.response.VehiculeResponse;
import com.logiway.entities.enums.StatutVehicule;
import com.logiway.services.VehiculeService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Controller Véhicule — Tests Unitaires")
class VehiculeControllerTest {

    @Mock
    private VehiculeService vehiculeService;

    @InjectMocks
    private VehiculeController vehiculeController;

    @Test
    @DisplayName("GET /api/vehicules → Retourne liste des véhicules accessibles")
    void getAccessibleVehicules_returnsOk() {
        VehiculeResponse vehicule1 = new VehiculeResponse(
            1L, "AB-123-CD", "Renault", "Master", 1500.0, 0,
            StatutVehicule.EN_SERVICE, 1L, "Transport Express", null, null, null, null, null
        );
        when(vehiculeService.getAccessibleVehicules()).thenReturn(List.of(vehicule1));

        ResponseEntity<List<VehiculeResponse>> response = vehiculeController.getAccessibleVehicules();

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).hasSize(1);
        verify(vehiculeService, times(1)).getAccessibleVehicules();
    }

    @Test
    @DisplayName("GET /api/vehicules/{id} → Retourne véhicule par ID")
    void getVehicule_returnsOk() {
        VehiculeResponse vehicule = new VehiculeResponse(
            1L, "AB-123-CD", "Renault", "Master", 1500.0, 0,
            StatutVehicule.EN_SERVICE, 1L, "Transport Express", null, null, null, null, null
        );
        when(vehiculeService.getVehicule(1L)).thenReturn(vehicule);

        ResponseEntity<VehiculeResponse> response = vehiculeController.getVehicule(1L);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().matricule()).isEqualTo("AB-123-CD");
        verify(vehiculeService, times(1)).getVehicule(1L);
    }

    @Test
    @DisplayName("GET /api/vehicules/{id}/available-drivers → Retourne chauffeurs disponibles")
    void getAvailableDrivers_returnsOk() {
        AvailableDriverResponse driver1 = new AvailableDriverResponse(
            1L, "Jean", "Dupont", "jean@test.com"
        );
        when(vehiculeService.getAvailableDriversForVehicle(1L)).thenReturn(List.of(driver1));

        ResponseEntity<List<AvailableDriverResponse>> response = vehiculeController.getAvailableDrivers(1L);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).hasSize(1);
        verify(vehiculeService, times(1)).getAvailableDriversForVehicle(1L);
    }

    @Test
    @DisplayName("POST /api/vehicules → Crée nouveau véhicule")
    void create_returnsOk() {
        CreateVehiculeRequest request = new CreateVehiculeRequest(
            "AB-123-CD", "Renault", "Master", 1500.0, 0,
            StatutVehicule.EN_SERVICE, 1L, null
        );
        VehiculeResponse vehicule = new VehiculeResponse(
            1L, "AB-123-CD", "Renault", "Master", 1500.0, 0,
            StatutVehicule.EN_SERVICE, 1L, "Transport Express", null, null, null, null, null
        );
        when(vehiculeService.createVehicule(any(CreateVehiculeRequest.class))).thenReturn(vehicule);

        ResponseEntity<VehiculeResponse> response = vehiculeController.create(request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().matricule()).isEqualTo("AB-123-CD");
        verify(vehiculeService, times(1)).createVehicule(any(CreateVehiculeRequest.class));
    }

    @Test
    @DisplayName("PUT /api/vehicules/{id} → Met à jour véhicule")
    void update_returnsOk() {
        UpdateVehiculeRequest request = new UpdateVehiculeRequest(
            "AB-123-CD", "Renault", "Master L3H3", 1800.0, 0,
            StatutVehicule.EN_SERVICE, null, null
        );
        VehiculeResponse vehicule = new VehiculeResponse(
            1L, "AB-123-CD", "Renault", "Master L3H3", 1800.0, 0,
            StatutVehicule.EN_SERVICE, 1L, "Transport Express", null, null, null, null, null
        );
        when(vehiculeService.updateVehicule(eq(1L), any(UpdateVehiculeRequest.class))).thenReturn(vehicule);

        ResponseEntity<VehiculeResponse> response = vehiculeController.update(1L, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().modele()).isEqualTo("Master L3H3");
        verify(vehiculeService, times(1)).updateVehicule(eq(1L), any(UpdateVehiculeRequest.class));
    }

    @Test
    @DisplayName("PUT /api/vehicules/{id}/status → Change statut véhicule")
    void updateStatus_returnsOk() {
        UpdateVehiculeStatusRequest request = new UpdateVehiculeStatusRequest(StatutVehicule.EN_MAINTENANCE);
        VehiculeResponse vehicule = new VehiculeResponse(
            1L, "AB-123-CD", "Renault", "Master", 1500.0, 0,
            StatutVehicule.EN_MAINTENANCE, 1L, "Transport Express", null, null, null, null, null
        );
        when(vehiculeService.updateVehiculeStatus(eq(1L), any(UpdateVehiculeStatusRequest.class))).thenReturn(vehicule);

        ResponseEntity<VehiculeResponse> response = vehiculeController.updateStatus(1L, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().statut()).isEqualTo(StatutVehicule.EN_MAINTENANCE);
        verify(vehiculeService, times(1)).updateVehiculeStatus(eq(1L), any(UpdateVehiculeStatusRequest.class));
    }

    @Test
    @DisplayName("PUT /api/vehicules/{id}/driver → Assigne chauffeur")
    void assignDriver_returnsOk() {
        AssignVehiculeDriverRequest request = new AssignVehiculeDriverRequest(1L);
        VehiculeResponse vehicule = new VehiculeResponse(
            1L, "AB-123-CD", "Renault", "Master", 1500.0, 0,
            StatutVehicule.EN_SERVICE, 1L, "Transport Express", 1L, "Jean Dupont", null, null, null
        );
        when(vehiculeService.assignDriver(eq(1L), any(AssignVehiculeDriverRequest.class))).thenReturn(vehicule);

        ResponseEntity<VehiculeResponse> response = vehiculeController.assignDriver(1L, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().chauffeurNom()).isEqualTo("Jean Dupont");
        verify(vehiculeService, times(1)).assignDriver(eq(1L), any(AssignVehiculeDriverRequest.class));
    }

    @Test
    @DisplayName("PUT /api/vehicules/{id}/driver/clear → Libère chauffeur")
    void clearDriver_returnsOk() {
        VehiculeResponse vehicule = new VehiculeResponse(
            1L, "AB-123-CD", "Renault", "Master", 1500.0, 0,
            StatutVehicule.EN_SERVICE, 1L, "Transport Express", null, null, null, null, null
        );
        when(vehiculeService.clearDriver(1L)).thenReturn(vehicule);

        ResponseEntity<VehiculeResponse> response = vehiculeController.clearDriver(1L);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().chauffeurNom()).isNull();
        verify(vehiculeService, times(1)).clearDriver(1L);
    }

    @Test
    @DisplayName("DELETE /api/vehicules/{id} → Supprime véhicule")
    void delete_returnsNoContent() {
        doNothing().when(vehiculeService).deleteVehicule(1L);

        ResponseEntity<Void> response = vehiculeController.delete(1L);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        verify(vehiculeService, times(1)).deleteVehicule(1L);
    }
}
