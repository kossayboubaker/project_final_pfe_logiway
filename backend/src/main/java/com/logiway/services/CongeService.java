package com.logiway.services;

import com.logiway.dto.request.CongeDecisionRequest;
import com.logiway.dto.request.CreateCongeRequest;
import com.logiway.dto.request.UpdateCongeRequest;
import com.logiway.dto.response.ApiMessageResponse;
import com.logiway.dto.response.CongeResponse;

import java.util.List;

public interface CongeService {

    List<CongeResponse> getAccessibleConges();

    CongeResponse createConge(CreateCongeRequest request);

    CongeResponse updateConge(Long id, UpdateCongeRequest request);

    CongeResponse approveConge(Long id, CongeDecisionRequest request);

    CongeResponse rejectConge(Long id, CongeDecisionRequest request);

    ApiMessageResponse deleteConge(Long id);
}