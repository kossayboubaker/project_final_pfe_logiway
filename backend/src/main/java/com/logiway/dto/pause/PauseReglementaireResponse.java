package com.logiway.dto.pause;

import com.logiway.entities.enums.StatutPause;
import com.logiway.entities.enums.TypePause;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PauseReglementaireResponse {
    private Long id;
    private Long trajetId;
    private TypePause type;
    private Double longitude;
    private Double latitude;
    private Double distanceAlongRouteM;
    private LocalDateTime heureArriveePlanifiee;
    private Integer durationSeconds;
    private LocalDateTime heureRepriseEstimee;
    private StatutPause statut;
    private String nomLieu;
    
    // AI Scoring fields
    private Integer aiScore;
    private Integer fatigueScore;
    private Integer accessibilityScore;
    private Integer contextScore;
    private String reasoning;
    private Double confidence;
}
