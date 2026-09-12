package com.logiway.controllers;

import com.logiway.dto.request.CongeDecisionRequest;
import com.logiway.dto.request.CreateCongeRequest;
import com.logiway.dto.request.UpdateCongeRequest;
import com.logiway.dto.response.ApiMessageResponse;
import com.logiway.dto.response.CongeResponse;
import com.logiway.services.CongeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/conges")
@RequiredArgsConstructor
public class CongeController {

    private final CongeService congeService;

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_SUPERADMIN','ROLE_MANAGER','ROLE_CHAUFFEUR')")
    public ResponseEntity<List<CongeResponse>> list() {
        return ResponseEntity.ok(congeService.getAccessibleConges());
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_MANAGER','ROLE_CHAUFFEUR')")
    public ResponseEntity<CongeResponse> create(@Valid @RequestBody CreateCongeRequest request) {
        return ResponseEntity.ok(congeService.createConge(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_MANAGER','ROLE_CHAUFFEUR')")
    public ResponseEntity<CongeResponse> update(@PathVariable Long id, @RequestBody UpdateCongeRequest request) {
        return ResponseEntity.ok(congeService.updateConge(id, request));
    }

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasAnyAuthority('ROLE_SUPERADMIN','ROLE_MANAGER')")
    public ResponseEntity<CongeResponse> approve(@PathVariable Long id, @RequestBody CongeDecisionRequest request) {
        return ResponseEntity.ok(congeService.approveConge(id, request));
    }

    @PutMapping("/{id}/reject")
    @PreAuthorize("hasAnyAuthority('ROLE_SUPERADMIN','ROLE_MANAGER')")
    public ResponseEntity<CongeResponse> reject(@PathVariable Long id, @RequestBody CongeDecisionRequest request) {
        return ResponseEntity.ok(congeService.rejectConge(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_MANAGER','ROLE_CHAUFFEUR')")
    public ResponseEntity<ApiMessageResponse> delete(@PathVariable Long id) {
        return ResponseEntity.ok(congeService.deleteConge(id));
    }
}