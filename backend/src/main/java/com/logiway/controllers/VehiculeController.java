package com.logiway.controllers;

import com.logiway.dto.request.AssignVehiculeDriverRequest;
import com.logiway.dto.request.CreateVehiculeRequest;
import com.logiway.dto.request.UpdateVehiculeRequest;
import com.logiway.dto.request.UpdateVehiculeStatusRequest;
import com.logiway.dto.response.AvailableDriverResponse;
import com.logiway.dto.response.VehiculeResponse;
import com.logiway.services.VehiculeService;
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
@RequestMapping("/api/vehicules")
@RequiredArgsConstructor
public class VehiculeController {

    private final VehiculeService vehiculeService;

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_SUPERADMIN','ROLE_MANAGER','ROLE_CHAUFFEUR')")
    public ResponseEntity<List<VehiculeResponse>> getAccessibleVehicules() {
        return ResponseEntity.ok(vehiculeService.getAccessibleVehicules());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_SUPERADMIN','ROLE_MANAGER','ROLE_CHAUFFEUR')")
    public ResponseEntity<VehiculeResponse> getVehicule(@PathVariable Long id) {
        return ResponseEntity.ok(vehiculeService.getVehicule(id));
    }

    @GetMapping("/{id}/available-drivers")
    @PreAuthorize("hasAnyAuthority('ROLE_SUPERADMIN','ROLE_MANAGER')")
    public ResponseEntity<List<AvailableDriverResponse>> getAvailableDrivers(@PathVariable Long id) {
        return ResponseEntity.ok(vehiculeService.getAvailableDriversForVehicle(id));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_SUPERADMIN')")
    public ResponseEntity<VehiculeResponse> create(@Valid @RequestBody CreateVehiculeRequest request) {
        return ResponseEntity.ok(vehiculeService.createVehicule(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_SUPERADMIN')")
    public ResponseEntity<VehiculeResponse> update(@PathVariable Long id, @Valid @RequestBody UpdateVehiculeRequest request) {
        return ResponseEntity.ok(vehiculeService.updateVehicule(id, request));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyAuthority('ROLE_SUPERADMIN','ROLE_MANAGER','ROLE_CHAUFFEUR')")
    public ResponseEntity<VehiculeResponse> updateStatus(@PathVariable Long id, @Valid @RequestBody UpdateVehiculeStatusRequest request) {
        return ResponseEntity.ok(vehiculeService.updateVehiculeStatus(id, request));
    }

    @PutMapping("/{id}/driver")
    @PreAuthorize("hasAnyAuthority('ROLE_SUPERADMIN','ROLE_MANAGER')")
    public ResponseEntity<VehiculeResponse> assignDriver(@PathVariable Long id, @Valid @RequestBody AssignVehiculeDriverRequest request) {
        return ResponseEntity.ok(vehiculeService.assignDriver(id, request));
    }

    @PutMapping("/{id}/driver/clear")
    @PreAuthorize("hasAuthority('ROLE_SUPERADMIN')")
    public ResponseEntity<VehiculeResponse> clearDriver(@PathVariable Long id) {
        return ResponseEntity.ok(vehiculeService.clearDriver(id));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_SUPERADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        vehiculeService.deleteVehicule(id);
        return ResponseEntity.noContent().build();
    }
}
