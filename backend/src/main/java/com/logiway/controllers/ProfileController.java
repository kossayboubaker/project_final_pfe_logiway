package com.logiway.controllers;

import com.logiway.dto.request.ChangePasswordRequest;
import com.logiway.dto.request.UpdateProfileRequest;
import com.logiway.dto.chauffeur.ChauffeurAvailabilityResponse;
import com.logiway.dto.chauffeur.ChauffeurDashboardResponse;
import com.logiway.dto.response.ApiMessageResponse;
import com.logiway.dto.response.UserResponse;
import com.logiway.dto.trajet.TrajetResponse;
import com.logiway.entities.enums.StatutTrajet;
import com.logiway.services.ProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({"/api/profile/me", "/api/profile/user_connecte"})
@RequiredArgsConstructor
@PreAuthorize("hasAnyAuthority('ROLE_SUPERADMIN','ROLE_MANAGER','ROLE_CHAUFFEUR')")
public class ProfileController {

    private final ProfileService profileService;

    @GetMapping
    public ResponseEntity<UserResponse> getProfile() {
        return ResponseEntity.ok(profileService.getCurrentProfile());
    }

    @PutMapping
    public ResponseEntity<UserResponse> updateProfile(@Valid @RequestBody UpdateProfileRequest request) {
        return ResponseEntity.ok(profileService.updateCurrentProfile(request));
    }

    @PutMapping("/password")
    public ResponseEntity<ApiMessageResponse> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        return ResponseEntity.ok(profileService.changeCurrentPassword(request));
    }

    @GetMapping("/dashboard")
    public ResponseEntity<ChauffeurDashboardResponse> getDriverDashboard() {
        return ResponseEntity.ok(profileService.getCurrentDriverDashboard());
    }

    @GetMapping("/availability")
    public ResponseEntity<ChauffeurAvailabilityResponse> getDriverAvailability() {
        return ResponseEntity.ok(profileService.getCurrentDriverAvailability());
    }

    @GetMapping("/trajets")
    public ResponseEntity<Page<TrajetResponse>> getDriverTrips(
        @RequestParam(required = false) StatutTrajet statut,
        Pageable pageable
    ) {
        return ResponseEntity.ok(profileService.getCurrentDriverTrips(pageable, statut));
    }
}
