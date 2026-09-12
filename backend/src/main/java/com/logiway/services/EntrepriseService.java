package com.logiway.services;

import com.logiway.dto.request.CreateEntrepriseRequest;
import com.logiway.dto.request.UpdateEntrepriseRequest;
import com.logiway.dto.response.EntrepriseResponse;

import java.util.List;

public interface EntrepriseService {

    List<EntrepriseResponse> getAccessibleEntreprises();

    EntrepriseResponse getMyEntreprise();

    EntrepriseResponse createEntreprise(CreateEntrepriseRequest request);

    EntrepriseResponse updateEntreprise(Long id, UpdateEntrepriseRequest request);

    EntrepriseResponse clearEntrepriseOwner(Long id);

    void deleteEntreprise(Long id);
}
