package com.logiway.entities;

import com.logiway.entities.enums.StatutTrajet;
import com.logiway.entities.enums.PrioriteTrajet;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "trajets")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Trajet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "date_depart")
    private LocalDateTime dateDepart;

    @Column(name = "date_arrivee")
    private LocalDateTime dateArrivee;

    @Column(name = "point_depart", length = 255)
    private String pointDepart;

    @Column(length = 255)
    private String destination;

    @Column(name = "latitude_depart")
    private Double latitudeDepart;

    @Column(name = "longitude_depart")
    private Double longitudeDepart;

    @Column(name = "latitude_arrivee")
    private Double latitudeArrivee;

    @Column(name = "longitude_arrivee")
    private Double longitudeArrivee;

    @Column(name = "distance_km")
    private Double distanceKm;

    @Column(name = "duree_estimee_minutes")
    private Integer dureeEstimeeMinutes;

    @Lob
    @Column(name = "geometrie_itineraire", columnDefinition = "LONGTEXT")
    private String geometrieItineraire;

    @Column(name = "charge_kg")
    private Double chargeKg;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private PrioriteTrajet priorite;

    @Column(length = 500)
    private String notes;

    @Column(name = "date_arrivee_reelle")
    private LocalDateTime dateArriveeReelle;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private StatutTrajet statut;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chauffeur_id")
    private Chauffeur chauffeur;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicule_id")
    private Vehicule vehicule;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manager_id")
    private Manager manager;

    @Column(name = "type_optimisation", length = 30)
    private String typeOptimisation;
}
