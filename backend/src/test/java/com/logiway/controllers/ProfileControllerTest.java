package com.logiway.controllers;

import com.logiway.dto.chauffeur.ChauffeurAvailabilityResponse;
import com.logiway.dto.chauffeur.ChauffeurDashboardResponse;
import com.logiway.dto.chauffeur.ChauffeurDashboardStatsResponse;
import com.logiway.dto.chauffeur.ChauffeurVehicleResponse;
import com.logiway.dto.request.ChangePasswordRequest;
import com.logiway.dto.request.UpdateProfileRequest;
import com.logiway.dto.response.ApiMessageResponse;
import com.logiway.dto.response.UserResponse;
import com.logiway.dto.trajet.TrajetResponse;
import com.logiway.entities.enums.PrioriteTrajet;
import com.logiway.entities.enums.Role;
import com.logiway.entities.enums.StatutChauffeur;
import com.logiway.entities.enums.StatutCompte;
import com.logiway.entities.enums.StatutTrajet;
import com.logiway.entities.enums.StatutVehicule;
import com.logiway.services.ProfileService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Controller Profile — Tests Unitaires")
class ProfileControllerTest {

    @Mock
    private ProfileService profileService;

    @InjectMocks
    private ProfileController profileController;

    private UserResponse user() {
        return new UserResponse(
            1L, "kc-1", "Jean", "Dupont", "jean@test.com", "0601020304",
            "France", "avatar.png", StatutCompte.ACTIF, true, true, null,
            Role.CHAUFFEUR, StatutChauffeur.LIBRE, null, null, null,
            1L, "Transport Express", 2L, "Secteur Nord",
            LocalDateTime.of(2025, 1, 15, 9, 30)
        );
    }

    private UserResponse manager() {
        return new UserResponse(
            3L, "kc-3", "Marc", "Bernard", "marc@test.com", "0607080910",
            "France", null, StatutCompte.ACTIF, true, true, null,
            Role.MANAGER, null, null, null, null,
            1L, "Transport Express", 2L, "Secteur Nord",
            LocalDateTime.of(2025, 1, 15, 9, 30)
        );
    }

    private TrajetResponse trajet() {
        return new TrajetResponse(
            10L, "Paris", "Lyon", 48.8566, 2.3522, 45.7640, 4.8357,
            465.0, 300, "geometrie", 1000.0, PrioriteTrajet.NORMALE,
            "Livraison urgente", LocalDateTime.of(2025, 2, 10, 8, 0),
            LocalDateTime.of(2025, 2, 10, 13, 0), null, null, null,
            "Bon", StatutTrajet.COMPLETE, 1L, "Jean Dupont",
            5L, "AB-123-CD", "Blanc", 48.85, 2.35, 80.0,
            3L, "Marc Bernard"
        );
    }

    @Test
    @DisplayName("GET /api/profile/me → Retourne le profil de l'utilisateur connecté")
    void getProfile_returnsOk() {
        when(profileService.getCurrentProfile()).thenReturn(user());

        ResponseEntity<UserResponse> response = profileController.getProfile();

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().email()).isEqualTo("jean@test.com");
        verify(profileService, times(1)).getCurrentProfile();
    }

    @Test
    @DisplayName("PUT /api/profile/me → Met à jour le profil de l'utilisateur connecté")
    void updateProfile_returnsOk() {
        UpdateProfileRequest request = new UpdateProfileRequest(
            "Jean", "Dupont", "0601020304", "nouveau-avatar.png"
        );
        when(profileService.updateCurrentProfile(any(UpdateProfileRequest.class))).thenReturn(user());

        ResponseEntity<UserResponse> response = profileController.updateProfile(request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().image()).isEqualTo("avatar.png");
        verify(profileService, times(1)).updateCurrentProfile(any(UpdateProfileRequest.class));
    }

    @Test
    @DisplayName("PUT /api/profile/me/password → Change le mot de passe")
    void changePassword_returnsOk() {
        ChangePasswordRequest request = new ChangePasswordRequest("ancienMotDePasse", "nouveauMotDePasse123");
        ApiMessageResponse apiMessage = new ApiMessageResponse("Mot de passe modifié avec succès");
        when(profileService.changeCurrentPassword(any(ChangePasswordRequest.class))).thenReturn(apiMessage);

        ResponseEntity<ApiMessageResponse> response = profileController.changePassword(request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().message()).isEqualTo("Mot de passe modifié avec succès");
        verify(profileService, times(1)).changeCurrentPassword(any(ChangePasswordRequest.class));
    }

    @Test
    @DisplayName("GET /api/profile/me/dashboard → Retourne le tableau de bord chauffeur")
    void getDriverDashboard_returnsOk() {
        ChauffeurDashboardResponse dashboard = new ChauffeurDashboardResponse(
            user(),
            new ChauffeurVehicleResponse(5L, "AB-123-CD", "Renault", "Master", "Fourgon",
                StatutVehicule.EN_SERVICE, 45000, 62.5, 1500.0, 1L, "Transport Express"),
            manager(),
            trajet(),
            List.of(trajet()),
            new ChauffeurDashboardStatsResponse(1234.5, 42L, 3L, 87.5, 62.3, 9.8,
                96.5, 0L, 1L, 2L, 0L, 78.4),
            new ChauffeurAvailabilityResponse(LocalDateTime.of(2025, 2, 11, 8, 0), 120L, true)
        );
        when(profileService.getCurrentDriverDashboard()).thenReturn(dashboard);

        ResponseEntity<ChauffeurDashboardResponse> response = profileController.getDriverDashboard();

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().chauffeur().prenom()).isEqualTo("Jean");
        assertThat(response.getBody().missionsDuJour()).hasSize(1);
        verify(profileService, times(1)).getCurrentDriverDashboard();
    }

    @Test
    @DisplayName("GET /api/profile/me/availability → Retourne la disponibilité du chauffeur")
    void getDriverAvailability_returnsOk() {
        ChauffeurAvailabilityResponse availability = new ChauffeurAvailabilityResponse(
            LocalDateTime.of(2025, 2, 11, 8, 0), 120L, true
        );
        when(profileService.getCurrentDriverAvailability()).thenReturn(availability);

        ResponseEntity<ChauffeurAvailabilityResponse> response = profileController.getDriverAvailability();

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().disponible()).isTrue();
        assertThat(response.getBody().minutesRestantes()).isEqualTo(120L);
        verify(profileService, times(1)).getCurrentDriverAvailability();
    }

    @Test
    @DisplayName("GET /api/profile/me/trajets → Retourne les trajets du chauffeur paginés")
    void getDriverTrips_returnsOk() {
        when(profileService.getCurrentDriverTrips(any(Pageable.class), eq(StatutTrajet.EN_COURS)))
            .thenReturn(new PageImpl<>(List.of(trajet())));

        ResponseEntity<Page<TrajetResponse>> response = profileController.getDriverTrips(
            StatutTrajet.EN_COURS, PageRequest.of(0, 10)
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().getContent()).hasSize(1);
        assertThat(response.getBody().getContent().get(0).destination()).isEqualTo("Lyon");
        verify(profileService, times(1)).getCurrentDriverTrips(any(Pageable.class), eq(StatutTrajet.EN_COURS));
    }
}
