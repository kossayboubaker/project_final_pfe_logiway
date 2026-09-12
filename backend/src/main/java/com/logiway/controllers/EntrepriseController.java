package com.logiway.controllers;

import com.logiway.dto.request.CreateEntrepriseRequest;
import com.logiway.dto.request.UpdateEntrepriseRequest;
import com.logiway.dto.response.EntrepriseResponse;
import com.logiway.services.EntrepriseService;
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
@RequestMapping("/api/entreprises")
@RequiredArgsConstructor
@PreAuthorize("hasAnyAuthority('ROLE_SUPERADMIN','ROLE_MANAGER')")
public class EntrepriseController {

    private final EntrepriseService entrepriseService;

    @GetMapping
    public ResponseEntity<List<EntrepriseResponse>> getCompanies() {
        return ResponseEntity.ok(entrepriseService.getAccessibleEntreprises());
    }

    @GetMapping("/me")
    public ResponseEntity<EntrepriseResponse> getMyCompany() {
        return ResponseEntity.ok(entrepriseService.getMyEntreprise());
    }

    @PostMapping
    public ResponseEntity<EntrepriseResponse> create(@Valid @RequestBody CreateEntrepriseRequest request) {
        return ResponseEntity.ok(entrepriseService.createEntreprise(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<EntrepriseResponse> update(@PathVariable Long id, @RequestBody UpdateEntrepriseRequest request) {
        return ResponseEntity.ok(entrepriseService.updateEntreprise(id, request));
    }

    @PutMapping("/{id}/clear-owner")
    public ResponseEntity<EntrepriseResponse> clearOwner(@PathVariable Long id) {
        return ResponseEntity.ok(entrepriseService.clearEntrepriseOwner(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        entrepriseService.deleteEntreprise(id);
        return ResponseEntity.noContent().build();
    }
}
