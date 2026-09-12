package com.logiway.repositories;

import com.logiway.entities.Reclamation;
import com.logiway.entities.Utilisateur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ReclamationRepository extends JpaRepository<Reclamation, Long> {

    @Query("SELECT r FROM Reclamation r LEFT JOIN FETCH r.utilisateur ORDER BY r.dateCreation DESC")
    List<Reclamation> findAllWithUtilisateur();

    @Query("SELECT r FROM Reclamation r LEFT JOIN FETCH r.utilisateur WHERE r.utilisateur = :utilisateur ORDER BY r.dateCreation DESC")
    List<Reclamation> findByUtilisateurWithJoin(@Param("utilisateur") Utilisateur utilisateur);

    @Query("SELECT r FROM Reclamation r LEFT JOIN FETCH r.utilisateur WHERE r.utilisateur IN :utilisateurs ORDER BY r.dateCreation DESC")
    List<Reclamation> findByUtilisateursWithJoin(@Param("utilisateurs") List<Utilisateur> utilisateurs);

    // Anciennes méthodes conservées pour compatibilité
    List<Reclamation> findByUtilisateurOrderByDateCreationDesc(Utilisateur utilisateur);

    List<Reclamation> findByUtilisateurInOrderByDateCreationDesc(List<Utilisateur> utilisateurs);

}
