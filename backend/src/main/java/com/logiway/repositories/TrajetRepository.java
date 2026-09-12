package com.logiway.repositories;

import com.logiway.entities.Trajet;
import com.logiway.entities.enums.StatutTrajet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface TrajetRepository extends JpaRepository<Trajet, Long> {

    List<Trajet> findByManagerId(Long managerId);

    List<Trajet> findByChauffeurId(Long chauffeurId);

    /**
     * Récupère les trajets d'un manager filtrant par son entreprise
     * Utilise les jointures pour éviter les données croisées
     */
    @Query("""
        SELECT t FROM Trajet t
        JOIN t.manager m
        JOIN m.entreprise e
        WHERE m.id = :managerId
        AND e.id = :entrepriseId
        ORDER BY t.dateDepart DESC
        """)
    List<Trajet> findByManagerIdAndEntrepriseId(
        @Param("managerId") Long managerId,
        @Param("entrepriseId") Long entrepriseId
    );

    /**
     * Récupère les trajets avec détails du chauffeur et du manager
     * pour éviter les N+1 queries.
     * LEFT JOIN FETCH utilisé pour ne pas exclure les trajets
     * dont le chauffeur ou le véhicule seraient null.
     */
    @Query("""
        SELECT DISTINCT t FROM Trajet t
        LEFT JOIN FETCH t.chauffeur c
        LEFT JOIN FETCH t.manager m
        LEFT JOIN FETCH t.vehicule v
        WHERE m.id = :managerId
        AND m.entreprise.id = :entrepriseId
        ORDER BY t.dateDepart DESC
        """)
    List<Trajet> findByManagerIdAndEntrepriseIdWithFetch(
        @Param("managerId") Long managerId,
        @Param("entrepriseId") Long entrepriseId
    );

    /**
     * Récupère TOUS les trajets des chauffeurs supervisés par ce manager
     * (via chauffeur.manager_id = managerId), qu'ils aient ou non un manager_id
     * directement sur le trajet. C'est la requête principale pour le rôle MANAGER.
     */
    @Query("""
        SELECT DISTINCT t FROM Trajet t
        LEFT JOIN FETCH t.chauffeur c
        LEFT JOIN FETCH c.manager cm
        LEFT JOIN FETCH c.secteur cs
        LEFT JOIN FETCH t.manager m
        LEFT JOIN FETCH m.secteur ms
        LEFT JOIN FETCH t.vehicule v
        WHERE c.manager.id = :managerId
        ORDER BY t.dateDepart DESC
        """)
    List<Trajet> findByChauffeurManagerIdWithFetch(@Param("managerId") Long managerId);

    /**
     * Récupère les trajets d'un chauffeur avec les détails associés.
     * LEFT JOIN FETCH utilisé pour ne pas exclure les trajets
     * dont le manager ou le secteur seraient null.
     */
    @Query("""
        SELECT DISTINCT t FROM Trajet t
        LEFT JOIN FETCH t.chauffeur c
        LEFT JOIN FETCH c.manager cm
        LEFT JOIN FETCH c.secteur cs
        LEFT JOIN FETCH t.manager m
        LEFT JOIN FETCH m.secteur ms
        LEFT JOIN FETCH t.vehicule v
        WHERE c.id = :chauffeurId
        ORDER BY t.dateDepart DESC
        """)
    List<Trajet> findByChauffeurIdWithFetch(@Param("chauffeurId") Long chauffeurId);

    @Query("""
        SELECT DISTINCT t FROM Trajet t
        LEFT JOIN FETCH t.chauffeur c
        LEFT JOIN FETCH c.manager cm
        LEFT JOIN FETCH c.secteur cs
        LEFT JOIN FETCH t.manager m
        LEFT JOIN FETCH m.secteur ms
        JOIN FETCH t.vehicule v
        WHERE v.id = :vehiculeId
        ORDER BY t.dateDepart DESC
        """)
    List<Trajet> findByVehiculeIdWithFetch(@Param("vehiculeId") Long vehiculeId);

    @Query("""
        SELECT DISTINCT t FROM Trajet t
        LEFT JOIN FETCH t.chauffeur c
        LEFT JOIN FETCH c.manager cm
        LEFT JOIN FETCH c.secteur cs
        JOIN FETCH t.manager m
        LEFT JOIN FETCH m.secteur ms
        LEFT JOIN FETCH t.vehicule v
        WHERE m.id = :managerId
        ORDER BY t.dateDepart DESC
        """)
    List<Trajet> findByManagerIdWithFetch(@Param("managerId") Long managerId);

    boolean existsByVehiculeIdAndStatutIn(Long vehiculeId, Collection<StatutTrajet> statuts);

    boolean existsByChauffeurIdAndStatutIn(Long chauffeurId, Collection<StatutTrajet> statuts);

    /**
     * Récupère tous les trajets ayant un statut donné
     * Utilisé par le scheduler de pause IA pour évaluer les trajets EN_COURS
     */
    List<Trajet> findByStatut(StatutTrajet statut);
}
