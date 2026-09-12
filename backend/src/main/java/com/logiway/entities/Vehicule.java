package com.logiway.entities;

import com.logiway.entities.enums.StatutVehicule;
import jakarta.persistence.*;
import lombok.*;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "vehicules")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Vehicule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 30, unique = true)
    private String matricule;

    @Column(length = 100)
    private String marque;

    @Column(length = 100)
    private String modele;

    private Double capacite;

    @Column(name = "latitude_actuelle")
    private Double latitudeActuelle;

    @Column(name = "longitude_actuelle")
    private Double longitudeActuelle;

    @Column(name = "derniere_position_maj")
    private java.time.LocalDateTime dernierePositionMaj;

    @Column(name = "vitesse_actuelle")
    private Double vitesseActuelle;

    @Column(name = "niveau_carburant")
    private Double niveauCarburant;

    @Column(name = "capacite_charge")
    private Double capaciteCharge;

    @Column(length = 40)
    private String couleur;

    private Integer kilometrage;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private StatutVehicule statut = StatutVehicule.EN_SERVICE;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "entreprise_id")
    private Entreprise entreprise;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chauffeur_actuel_id")
    private Chauffeur chauffeurActuel;

    @OneToMany(mappedBy = "vehicule")
    @Builder.Default
    private Set<Trajet> trajets = new HashSet<>();

    @PrePersist
    void onCreate() {
        if (statut == null) {
            statut = StatutVehicule.EN_SERVICE;
        }
    }
}
