package com.logiway.entities;

import com.logiway.entities.enums.StatutPause;
import com.logiway.entities.enums.TypePause;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "pauses_reglementaires")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PauseReglementaire {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trajet_id", nullable = false)
    private Trajet trajet;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private TypePause type;

    @Column(nullable = false)
    private Double longitude;

    @Column(nullable = false)
    private Double latitude;

    @Column(name = "distance_along_route_m")
    private Double distanceAlongRouteM;

    @Column(name = "heure_arrivee_planifiee")
    private LocalDateTime heureArriveePlanifiee;

    @Column(name = "duration_seconds")
    private Integer durationSeconds;

    @Column(name = "heure_reprise_estimee")
    private LocalDateTime heureRepriseEstimee;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private StatutPause statut;

    @Column(name = "nom_lieu", length = 255)
    private String nomLieu;

    // AI Scoring fields (v2.0-intelligent)
    @Column(name = "ai_score")
    private Integer aiScore;

    @Column(name = "fatigue_score")
    private Integer fatigueScore;

    @Column(name = "accessibility_score")
    private Integer accessibilityScore;

    @Column(name = "context_score")
    private Integer contextScore;

    @Column(name = "reasoning", columnDefinition = "TEXT")
    private String reasoning;

    @Column(name = "confidence")
    private Double confidence;
}
