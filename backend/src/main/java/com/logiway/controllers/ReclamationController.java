package com.logiway.controllers;

import com.logiway.dto.request.CreateReclamationRequest;
import com.logiway.dto.request.ReclamationDecisionRequest;
import com.logiway.dto.request.UpdateReclamationRequest;
import com.logiway.dto.request.ValidateReclamationRequest;
import com.logiway.dto.response.ReclamationResponse;
import com.logiway.dto.response.ValidateReclamationResponse;
import com.logiway.services.ReclamationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reclamations")
@RequiredArgsConstructor
public class ReclamationController {

    private final ReclamationService reclamationService;

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_SUPERADMIN','ROLE_MANAGER','ROLE_CHAUFFEUR')")
    public ResponseEntity<List<ReclamationResponse>> list() {
        return ResponseEntity.ok(reclamationService.getAccessibleReclamations());
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_MANAGER','ROLE_CHAUFFEUR')")
    public ResponseEntity<ReclamationResponse> create(@Valid @RequestBody CreateReclamationRequest request) {
        return ResponseEntity.ok(reclamationService.createReclamation(request));
    }

    @PostMapping("/validate")
    @PreAuthorize("hasAnyAuthority('ROLE_MANAGER','ROLE_CHAUFFEUR')")
    public ResponseEntity<ValidateReclamationResponse> validate(@RequestBody ValidateReclamationRequest request) {
        return ResponseEntity.ok(reclamationService.validateText(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_MANAGER','ROLE_CHAUFFEUR')")
    public ResponseEntity<ReclamationResponse> update(@PathVariable Long id, @Valid @RequestBody UpdateReclamationRequest request) {
        return ResponseEntity.ok(reclamationService.updateReclamation(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_SUPERADMIN','ROLE_MANAGER','ROLE_CHAUFFEUR')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        reclamationService.deleteReclamation(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/resolve")
    @PreAuthorize("hasAuthority('ROLE_SUPERADMIN')")
    public ResponseEntity<ReclamationResponse> resolve(@PathVariable Long id, @Valid @RequestBody ReclamationDecisionRequest request) {
        return ResponseEntity.ok(reclamationService.resolveReclamation(id, request));
    }

    @PutMapping("/{id}/reject")
    @PreAuthorize("hasAuthority('ROLE_SUPERADMIN')")
    public ResponseEntity<ReclamationResponse> reject(@PathVariable Long id, @Valid @RequestBody ReclamationDecisionRequest request) {
        return ResponseEntity.ok(reclamationService.rejectReclamation(id, request));
    }

}
