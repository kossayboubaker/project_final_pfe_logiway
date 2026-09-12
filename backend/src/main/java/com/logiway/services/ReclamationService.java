package com.logiway.services;

import com.logiway.dto.request.CreateReclamationRequest;
import com.logiway.dto.request.ReclamationDecisionRequest;
import com.logiway.dto.request.UpdateReclamationRequest;
import com.logiway.dto.request.ValidateReclamationRequest;
import com.logiway.dto.response.ReclamationResponse;
import com.logiway.dto.response.ValidateReclamationResponse;

import java.util.List;

public interface ReclamationService {

    ReclamationResponse createReclamation(CreateReclamationRequest request);

    ReclamationResponse updateReclamation(Long id, UpdateReclamationRequest request);

    void deleteReclamation(Long id);

    List<ReclamationResponse> getAccessibleReclamations();

    ReclamationResponse resolveReclamation(Long id, ReclamationDecisionRequest request);

    ReclamationResponse rejectReclamation(Long id, ReclamationDecisionRequest request);

    ValidateReclamationResponse validateText(ValidateReclamationRequest request);

}
