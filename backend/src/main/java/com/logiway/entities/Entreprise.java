package com.logiway.entities;

import com.logiway.entities.enums.StatutEntreprise;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "entreprises")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Entreprise {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nom_entreprise", nullable = false, length = 200)
    private String nomEntreprise;

    @Column(name = "email_entreprise", length = 150)
    private String emailEntreprise;

    @Column(name = "adresse_entreprise", length = 255)
    private String adresseEntreprise;

    @Column(name = "numero_entreprise", length = 50)
    private String numeroEntreprise;

    @Column(name = "code_tva", length = 30)
    private String codeTVA;

    @Column(name = "representant_legal", length = 200)
    private String representantLegal;

    @Lob
    @Column(name = "document_justificatif", columnDefinition = "LONGTEXT")
    private String documentJustificatif;

    @Lob
    @Column(name = "image", columnDefinition = "LONGTEXT")
    private String image;

    @Column(name = "secteur_activite", length = 120)
    private String secteurActivite;

    @Column(name = "taille_flotte")
    private Integer tailleFlotte;

    @Enumerated(EnumType.STRING)
    @Column(name = "statut", nullable = false, length = 20)
    @Builder.Default
    private StatutEntreprise statut = StatutEntreprise.ACTIF;

    @Column(name = "date_creation", nullable = false)
    private LocalDateTime dateCreation;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manager_owner_id", unique = true)
    private Manager proprietaire;

    @OneToMany(mappedBy = "entreprise")
    @Builder.Default
    private Set<Utilisateur> utilisateurs = new HashSet<>();

    @OneToMany(mappedBy = "entreprise")
    @Builder.Default
    private Set<Vehicule> vehicules = new HashSet<>();

    @PrePersist
    void onCreate() {
        if (dateCreation == null) {
            dateCreation = LocalDateTime.now();
        }

        if (statut == null) {
            statut = StatutEntreprise.ACTIF;
        }
    }
}
