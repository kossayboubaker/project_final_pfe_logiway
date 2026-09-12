package com.logiway.repositories;

import com.logiway.entities.Entreprise;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EntrepriseRepository extends JpaRepository<Entreprise, Long> {

    List<Entreprise> findAllByOrderByDateCreationDesc();

    Optional<Entreprise> findByProprietaire_Id(Long proprietaireId);
}
