package com.logiway.entities;

import com.logiway.entities.enums.StatutChauffeur;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "chauffeurs")
@PrimaryKeyJoinColumn(name = "id")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class Chauffeur extends Utilisateur {

    @Enumerated(EnumType.STRING)
    @Column(name = "statut_conducteur", nullable = false, length = 30)
    private StatutChauffeur statutConducteur;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manager_id")
    private Manager manager;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "secteur_id")
    private Secteur secteur;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicule_actuel_id")
    private Vehicule vehiculeActuel;

    @OneToMany(mappedBy = "chauffeur")
    @Builder.Default
    private Set<Trajet> trajets = new HashSet<>();

    @OneToMany(mappedBy = "chauffeur")
    @Builder.Default
    private Set<Conge> conges = new HashSet<>();
}
