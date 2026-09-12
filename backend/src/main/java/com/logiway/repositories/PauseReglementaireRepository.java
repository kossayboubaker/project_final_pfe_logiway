package com.logiway.repositories;

import com.logiway.entities.PauseReglementaire;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Modifying;
import java.util.List;

@Repository
public interface PauseReglementaireRepository extends JpaRepository<PauseReglementaire, Long> {

    /**
     * Find all pauses for a given trajet ID
     */
    @Query("SELECT p FROM PauseReglementaire p WHERE p.trajet.id = :trajetId ORDER BY p.distanceAlongRouteM ASC")
    List<PauseReglementaire> findByTrajetId(@Param("trajetId") Long trajetId);

    /**
     * Find all pauses for trajets assigned to a specific manager
     * Used for Manager role to see only their drivers' breaks
     */
    @Query("SELECT p FROM PauseReglementaire p WHERE p.trajet.manager.id = :managerId ORDER BY p.distanceAlongRouteM ASC")
    List<PauseReglementaire> findByTrajetManagerId(@Param("managerId") Long managerId);

    /**
     * Find all pauses for trajets assigned to a specific chauffeur
     * Used for Chauffeur role to see only their own breaks
     */
    @Query("SELECT p FROM PauseReglementaire p WHERE p.trajet.chauffeur.id = :chauffeurId ORDER BY p.distanceAlongRouteM ASC")
    List<PauseReglementaire> findByTrajetChauffeurId(@Param("chauffeurId") Long chauffeurId);

    @Modifying
    @Query("DELETE FROM PauseReglementaire p WHERE p.trajet.id = :trajetId")
    void deleteByTrajetId(@Param("trajetId") Long trajetId);
}
