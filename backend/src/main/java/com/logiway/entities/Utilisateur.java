package com.logiway.entities;

import com.logiway.entities.enums.Role;
import com.logiway.entities.enums.StatutCompte;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "utilisateurs")
@Inheritance(strategy = InheritanceType.JOINED)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class Utilisateur {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "keycloak_id", length = 36, nullable = false, unique = true)
    private String keycloakId;

    @Column(length = 100)
    private String prenom;

    @Column(length = 100)
    private String nom;

    @Column(length = 150, nullable = false, unique = true)
    private String email;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Column(length = 20)
    private String telephone;

    @Column(length = 100)
    private String pays;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String image;

    @Column(name = "date_creation", nullable = false)
    private LocalDateTime dateCreation;

    @Enumerated(EnumType.STRING)
    @Column(name = "est_actif", nullable = false, length = 20)
    private StatutCompte estActif;

    @Column(name = "rejection_reason", length = 500)
    private String rejectionReason;

    @Column(name = "email_verifie", nullable = false)
    private Boolean emailVerifie;

    @Column(name = "verification_token", length = 120)
    private String verificationToken;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private Role role;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "entreprise_id")
    private Entreprise entreprise;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_id")
    private Utilisateur createdBy;

    @OneToMany(mappedBy = "utilisateur", cascade = CascadeType.ALL, orphanRemoval = false)
    @Builder.Default
    private Set<Reclamation> reclamations = new HashSet<>();

    @OneToMany(mappedBy = "utilisateur", cascade = CascadeType.ALL, orphanRemoval = false)
    @Builder.Default
    private Set<Notification> notifications = new HashSet<>();

    @PrePersist
    void onCreate() {
        if (dateCreation == null) {
            dateCreation = LocalDateTime.now();
        }
        if (emailVerifie == null) {
            emailVerifie = Boolean.FALSE;
        }
    }
}
