package com.logiway.services;

import com.logiway.dto.admin.KpiOverviewResponse;

public interface AdminKpiService {
    KpiOverviewResponse getOverview(Long entrepriseId, String period, Long chauffeurId);
}
