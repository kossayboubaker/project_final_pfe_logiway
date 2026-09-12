package com.logiway.repositories;

import com.logiway.entities.Chauffeur;
import com.logiway.entities.enums.StatutChauffeur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.List;

public interface ChauffeurRepository extends JpaRepository<Chauffeur, Long> {

    List<Chauffeur> findByManagerId(Long managerId);

    List<Chauffeur> findByManagerIdIn(List<Long> managerIds);

    List<Chauffeur> findByEntreprise_Id(Long entrepriseId);

    @Query("""
        SELECT DISTINCT c FROM Chauffeur c
        LEFT JOIN FETCH c.manager m
        LEFT JOIN FETCH m.secteur
        LEFT JOIN FETCH c.secteur
        LEFT JOIN FETCH c.vehiculeActuel v
        LEFT JOIN FETCH v.entreprise
        WHERE c.id = :id
        """)
    Optional<Chauffeur> findByIdWithDashboardFetch(@Param("id") Long id);

    /**
     * Récupère les chauffeurs disponibles (LIBRE) pour une entreprise donnée
     * (exclut les chauffeurs déjà assignés à un véhicule)
     */
    @Query("SELECT c FROM Chauffeur c WHERE COALESCE(c.entreprise.id, c.manager.entreprise.id) = :entrepriseId AND c.statutConducteur = :statut AND c.vehiculeActuel IS NULL")
    List<Chauffeur> findAvailableDriversByEntreprise(
        @Param("entrepriseId") Long entrepriseId,
        @Param("statut") StatutChauffeur statut
    );
}

