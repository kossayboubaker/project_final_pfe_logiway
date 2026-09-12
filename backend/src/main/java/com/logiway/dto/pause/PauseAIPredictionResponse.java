package com.logiway.dto.pause;

import com.logiway.entities.enums.TypeAlerteIA;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PauseAIPredictionResponse {
    private Long id;
    private Long trajetId;
    private LocalDateTime timestamp;
    private Double hoursDriving;
    private Double distAlongRatio;
    private Integer score;
    private String poiType;
    private Boolean alerteDeclenchee;
    private TypeAlerteIA typeAlerte;
    private Double latitudePoi;
    private Double longitudePoi;
    private String nomPoi;
    private Double distancePoiM;
}
