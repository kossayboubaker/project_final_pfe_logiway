package com.logiway.repositories;

import com.logiway.entities.Conge;
import com.logiway.entities.enums.StatutConge;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CongeRepository extends JpaRepository<Conge, Long> {

    List<Conge> findByManager_IdOrderByDateDebutDesc(Long managerId);

    List<Conge> findByChauffeur_IdOrderByDateDebutDesc(Long chauffeurId);

    List<Conge> findByChauffeur_Manager_IdOrderByDateDebutDesc(Long managerId);

    boolean existsByManager_IdAndStatut(Long managerId, StatutConge statut);

    boolean existsByChauffeur_IdAndStatut(Long chauffeurId, StatutConge statut);

    Optional<Conge> findByIdAndManager_Id(Long id, Long managerId);

    Optional<Conge> findByIdAndChauffeur_Id(Long id, Long chauffeurId);
}
