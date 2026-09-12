package com.logiway.entities;

import com.logiway.entities.enums.StatutConge;
import com.logiway.entities.enums.TypeConge;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

@Entity
@Table(name = "conges")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Conge {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "date_debut")
    private LocalDate dateDebut;

    @Column(name = "date_fin")
    private LocalDate dateFin;

    private Integer periode;

    @Column(length = 500)
    private String motif;

    @Column(length = 1000)
    private String commentaireValidation;

    @Column(name = "calendar_event_id", length = 255)
    private String calendarEventId;

    @Column(name = "date_creation")
    private LocalDateTime dateCreation;

    @Column(name = "date_mise_a_jour")
    private LocalDateTime dateMiseAJour;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private TypeConge type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private StatutConge statut;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chauffeur_id")
    private Chauffeur chauffeur;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manager_id")
    private Manager manager;

    @PrePersist
    @PreUpdate
    void computePeriode() {
        dateMiseAJour = LocalDateTime.now();

        if (dateCreation == null) {
            dateCreation = dateMiseAJour;
        }

        if (dateDebut != null && dateFin != null && !dateFin.isBefore(dateDebut)) {
            this.periode = (int) ChronoUnit.DAYS.between(dateDebut, dateFin) + 1;
        }
    }
}
