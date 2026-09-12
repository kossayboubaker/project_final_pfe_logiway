package com.logiway.services;

import com.logiway.dto.trajet.TourneeOptimiseeResponse;
import com.logiway.dto.trajet.TrajetCarteResponse;
import com.logiway.dto.trajet.TrajetOptimisationRequest;
import com.logiway.dto.trajet.TrajetPositionRequest;
import com.logiway.dto.trajet.TrajetRequest;
import com.logiway.dto.trajet.TrajetResponse;
import com.logiway.entities.enums.StatutTrajet;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface TrajetService {

    Page<TrajetResponse> getTrajets(String search, StatutTrajet statut, Pageable pageable);

    List<TrajetCarteResponse> getTrajetsCarte();

    TrajetResponse getTrajet(Long id);

    TrajetResponse createTrajet(TrajetRequest request);

    TrajetResponse updateTrajet(Long id, TrajetRequest request);

    void deleteTrajet(Long id);

    TrajetResponse demarrerTrajet(Long id);

    TrajetResponse terminerTrajet(Long id);

    TrajetResponse updatePosition(Long id, TrajetPositionRequest request);

    List<TourneeOptimiseeResponse> optimiserTrajets(TrajetOptimisationRequest request);
}