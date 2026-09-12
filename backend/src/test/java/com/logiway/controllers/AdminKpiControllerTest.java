package com.logiway.controllers;

import com.logiway.dto.admin.KpiOverviewResponse;
import com.logiway.services.AdminKpiService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Controller Admin KPI — Tests Unitaires")
class AdminKpiControllerTest {

    @Mock
    private AdminKpiService adminKpiService;

    @InjectMocks
    private AdminKpiController adminKpiController;

    @Test
    @DisplayName("GET /api/admin/kpi/overview → Retourne la vue d'ensemble des KPI")
    void overview_returnsOk() {
        KpiOverviewResponse overview = new KpiOverviewResponse();
        overview.cards.chauffeursActifs = 12;
        overview.cards.vehiculesTotal = 20;
        when(adminKpiService.getOverview(1L, "SEMAINE", 2L)).thenReturn(overview);

        ResponseEntity<KpiOverviewResponse> response = adminKpiController.overview(1L, "SEMAINE", 2L);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().cards.chauffeursActifs).isEqualTo(12);
        verify(adminKpiService, times(1)).getOverview(1L, "SEMAINE", 2L);
    }

    @Test
    @DisplayName("GET /api/admin/kpi/overview → Sans filtre d'entreprise/période/chauffeur")
    void overview_withoutFilters_returnsOk() {
        KpiOverviewResponse overview = new KpiOverviewResponse();
        when(adminKpiService.getOverview(null, null, null)).thenReturn(overview);

        ResponseEntity<KpiOverviewResponse> response = adminKpiController.overview(null, null, null);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().cards).isNotNull();
        verify(adminKpiService, times(1)).getOverview(null, null, null);
    }
}
