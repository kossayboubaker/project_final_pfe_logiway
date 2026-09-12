package com.logiway.entities;

import jakarta.persistence.*;
import lombok.*;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "secteurs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Secteur {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String nom;

    @Column(length = 500)
    private String description;

    @Column(name = "zone_geographique", nullable = false, length = 100)
    private String zoneGeographique;

    @Column(name = "codes_postaux", length = 500)
    private String codesPostaux;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "entreprise_id", nullable = false)
    private Entreprise entreprise;

    @OneToMany(mappedBy = "secteur")
    @Builder.Default
    private Set<Manager> managers = new HashSet<>();

    @OneToMany(mappedBy = "secteur")
    @Builder.Default
    private Set<Chauffeur> chauffeurs = new HashSet<>();
}