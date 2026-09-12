package com.logiway.entities;

import com.logiway.entities.enums.MessengerMessageStatus;
import com.logiway.entities.enums.MessengerMessageType;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "messenger_messages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MessengerMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "expediteur_id", nullable = false)
    private Long expediteurId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "expediteur_id", insertable = false, updatable = false)
    private Utilisateur expediteur;

    @Column(name = "destinataire_id", nullable = false)
    private Long destinataireId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "destinataire_id", insertable = false, updatable = false)
    private Utilisateur destinataire;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String contenu;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private MessengerMessageType type;

    @Column(name = "chemin_fichier", length = 500)
    private String cheminFichier;

    @Column(name = "nom_fichier_original", length = 255)
    private String nomFichierOriginal;

    @Column(name = "taille_fichier")
    private Long tailleFichier;

    @Column(name = "duree_vocale")
    private Integer dureeVocale;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private MessengerMessageStatus statut;

    @Column(name = "date_envoi", nullable = false)
    private LocalDateTime dateEnvoi;

    @Column(name = "date_lecture")
    private LocalDateTime dateLecture;

    @Column(name = "modifie", nullable = true)
    private Boolean modifie;

    @Column(name = "date_modification")
    private LocalDateTime dateModification;

    @Lob
    @Column(name = "contenu_original", columnDefinition = "LONGTEXT")
    private String contenuOriginal;

    @Column(name = "supprime", nullable = true)
    private Boolean supprime;

    @Column(name = "date_suppression")
    private LocalDateTime dateSuppression;

    @Column(name = "connecte")
    private Boolean connecte;

    @Column(name = "derniere_activite")
    private LocalDateTime derniereActivite;

    @PrePersist
    void onCreate() {
        if (dateEnvoi == null) {
            dateEnvoi = LocalDateTime.now();
        }
        if (statut == null) {
            statut = MessengerMessageStatus.NON_LU;
        }
        if (connecte == null) {
            connecte = Boolean.TRUE;
        }
        if (derniereActivite == null) {
            derniereActivite = LocalDateTime.now();
        }
        if (modifie == null) {
            modifie = Boolean.FALSE;
        }
        if (supprime == null) {
            supprime = Boolean.FALSE;
        }
    }
}