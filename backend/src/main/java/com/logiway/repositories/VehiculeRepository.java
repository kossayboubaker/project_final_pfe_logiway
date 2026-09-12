package com.logiway.repositories;

import com.logiway.entities.Vehicule;
import com.logiway.entities.enums.StatutVehicule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface VehiculeRepository extends JpaRepository<Vehicule, Long> {
    List<Vehicule> findByEntreprise_Id(Long entrepriseId);

    List<Vehicule> findByEntreprise_IdOrderByIdDesc(Long entrepriseId);

    List<Vehicule> findByEntreprise_Proprietaire_IdOrderByIdDesc(Long managerId);

    Optional<Vehicule> findByMatriculeIgnoreCase(String matricule);

    boolean existsByMatriculeIgnoreCase(String matricule);

    long countByEntreprise_Id(Long entrepriseId);

    Optional<Vehicule> findFirstByChauffeurActuel_Id(Long chauffeurId);

    List<Vehicule> findByEntreprise_IdAndStatut(Long entrepriseId, StatutVehicule statut);
}
