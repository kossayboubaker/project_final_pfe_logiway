package com.logiway.entities;

import com.logiway.entities.enums.TypeAlerteIA;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "pause_ai_predictions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PauseAIPrediction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trajet_id", nullable = false)
    private Trajet trajet;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    @Column(name = "hours_driving", nullable = false)
    private Double hoursDriving;

    @Column(name = "dist_along_ratio", nullable = false)
    private Double distAlongRatio;

    @Column(nullable = false)
    private Integer score;

    @Column(name = "poi_type", length = 50)
    private String poiType;

    @Column(name = "alerte_declenchee", nullable = false)
    private Boolean alerteDeclenchee;

    @Enumerated(EnumType.STRING)
    @Column(name = "type_alerte", length = 30)
    private TypeAlerteIA typeAlerte;

    @Column(name = "latitude_poi")
    private Double latitudePoi;

    @Column(name = "longitude_poi")
    private Double longitudePoi;

    @Column(name = "nom_poi", length = 255)
    private String nomPoi;

    @Column(name = "distance_poi_m")
    private Double distancePoiM;
}
