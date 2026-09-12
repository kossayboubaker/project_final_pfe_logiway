package com.logiway.services;

import com.logiway.dto.request.AssignVehiculeDriverRequest;
import com.logiway.dto.request.CreateVehiculeRequest;
import com.logiway.dto.request.UpdateVehiculeRequest;
import com.logiway.dto.request.UpdateVehiculeStatusRequest;
import com.logiway.dto.response.AvailableDriverResponse;
import com.logiway.dto.response.VehiculeResponse;

import java.util.List;

public interface VehiculeService {

    List<VehiculeResponse> getAccessibleVehicules();

    VehiculeResponse getVehicule(Long id);

    VehiculeResponse createVehicule(CreateVehiculeRequest request);

    VehiculeResponse updateVehicule(Long id, UpdateVehiculeRequest request);

    VehiculeResponse updateVehiculeStatus(Long id, UpdateVehiculeStatusRequest request);

    VehiculeResponse assignDriver(Long id, AssignVehiculeDriverRequest request);

    VehiculeResponse clearDriver(Long id);

    void deleteVehicule(Long id);

    /**
     * Récupère les chauffeurs disponibles (LIBRE) pour un véhicule donné
     * Filtre par entreprise du véhicule pour éviter les affectations inter-entreprises
     */
    List<AvailableDriverResponse> getAvailableDriversForVehicle(Long vehiculeId);
}
