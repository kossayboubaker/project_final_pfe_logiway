package com.logiway.repositories;

import com.logiway.entities.Secteur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface SecteurRepository extends JpaRepository<Secteur, Long> {

    List<Secteur> findByEntreprise_Id(Long entrepriseId);

    boolean existsByEntreprise_Id(Long entrepriseId);

    boolean existsByNomIgnoreCaseAndEntreprise_Id(String nom, Long entrepriseId);

    boolean existsByNomIgnoreCaseAndEntreprise_IdAndIdNot(String nom, Long entrepriseId, Long id);

        @Query("select s from Secteur s left join fetch s.entreprise left join fetch s.managers left join fetch s.chauffeurs where s.id = :id")
    Optional<Secteur> findByIdWithRelations(@Param("id") Long id);

    /**
     * Récupère tous les secteurs avec toutes leurs relations chargées (FETCH JOIN)
     * Utilisé pour SUPERADMIN - évite N+1 queries
     */
    @Query("SELECT DISTINCT s FROM Secteur s " +
           "LEFT JOIN FETCH s.entreprise " +
           "LEFT JOIN FETCH s.managers " +
           "LEFT JOIN FETCH s.chauffeurs " +
           "ORDER BY s.id DESC")
    List<Secteur> findAllWithRelations();

    /**
     * Récupère les secteurs d'une entreprise avec toutes leurs relations chargées
     * Utilisé pour MANAGER - résout le problème d'affichage avec LAZY loading
     */
    @Query("SELECT DISTINCT s FROM Secteur s " +
           "LEFT JOIN FETCH s.entreprise " +
           "LEFT JOIN FETCH s.managers " +
           "LEFT JOIN FETCH s.chauffeurs " +
           "WHERE s.entreprise.id = :entrepriseId " +
           "ORDER BY s.id DESC")
    List<Secteur> findByEntrepriseIdWithRelations(@Param("entrepriseId") Long entrepriseId);

    /**
     * Récupère un secteur avec toutes ses relations chargées
     * Utilisé pour CHAUFFEUR - résout le problème d'affichage avec LAZY loading
     */
    @Query("SELECT DISTINCT s FROM Secteur s " +
           "LEFT JOIN FETCH s.entreprise " +
           "LEFT JOIN FETCH s.managers " +
           "LEFT JOIN FETCH s.chauffeurs " +
           "WHERE s.id = :secteurId")
    Optional<Secteur> findByIdWithAllRelations(@Param("secteurId") Long secteurId);
}