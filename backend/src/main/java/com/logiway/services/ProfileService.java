package com.logiway.services;

import com.logiway.dto.request.ChangePasswordRequest;
import com.logiway.dto.request.UpdateProfileRequest;
import com.logiway.dto.response.ApiMessageResponse;
import com.logiway.dto.response.UserResponse;
import com.logiway.dto.chauffeur.ChauffeurAvailabilityResponse;
import com.logiway.dto.chauffeur.ChauffeurDashboardResponse;
import com.logiway.entities.enums.StatutTrajet;
import com.logiway.dto.trajet.TrajetResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ProfileService {

    UserResponse getCurrentProfile();

    UserResponse updateCurrentProfile(UpdateProfileRequest request);

    ApiMessageResponse changeCurrentPassword(ChangePasswordRequest request);

    ChauffeurDashboardResponse getCurrentDriverDashboard();

    Page<TrajetResponse> getCurrentDriverTrips(Pageable pageable, StatutTrajet statut);

    ChauffeurAvailabilityResponse getCurrentDriverAvailability();
}
