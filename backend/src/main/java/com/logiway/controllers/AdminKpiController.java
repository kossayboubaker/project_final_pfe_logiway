package com.logiway.controllers;

import com.logiway.dto.admin.KpiOverviewResponse;
import com.logiway.services.AdminKpiService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/kpi")
@RequiredArgsConstructor
public class AdminKpiController {

    private final AdminKpiService adminKpiService;

    @GetMapping("/overview")
    public ResponseEntity<KpiOverviewResponse> overview(
            @org.springframework.web.bind.annotation.RequestParam(required = false) Long entrepriseId,
            @org.springframework.web.bind.annotation.RequestParam(required = false) String period,
            @org.springframework.web.bind.annotation.RequestParam(required = false) Long chauffeurId) {
        KpiOverviewResponse resp = adminKpiService.getOverview(entrepriseId, period, chauffeurId);
        return ResponseEntity.ok(resp);
    }
}
