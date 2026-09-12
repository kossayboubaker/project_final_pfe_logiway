package com.logiway.dto.pause;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PauseAIEvaluationRequest {
    private Double currentLatitude;
    private Double currentLongitude;
    private Double distanceParcourueKm;
}
