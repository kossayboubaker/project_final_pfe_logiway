package com.logiway.entities;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "managers")
@PrimaryKeyJoinColumn(name = "id")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class Manager extends Utilisateur {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "secteur_id")
    private Secteur secteur;

    @OneToMany(mappedBy = "manager")
    @Builder.Default
    private Set<Chauffeur> chauffeurs = new HashSet<>();

    @OneToMany(mappedBy = "manager")
    @Builder.Default
    private Set<Trajet> trajets = new HashSet<>();

    @OneToMany(mappedBy = "manager")
    @Builder.Default
    private Set<Conge> conges = new HashSet<>();
}
