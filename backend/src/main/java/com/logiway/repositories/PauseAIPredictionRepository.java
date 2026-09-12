package com.logiway.repositories;

import com.logiway.entities.PauseAIPrediction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PauseAIPredictionRepository extends JpaRepository<PauseAIPrediction, Long> {

    List<PauseAIPrediction> findByTrajetIdOrderByTimestampAsc(Long trajetId);

    @Query("SELECT p FROM PauseAIPrediction p WHERE p.trajet.id = :trajetId ORDER BY p.timestamp DESC LIMIT 1")
    Optional<PauseAIPrediction> findLastPredictionForTrajet(@Param("trajetId") Long trajetId);

    @Query("SELECT p FROM PauseAIPrediction p WHERE p.trajet.chauffeur.id = :chauffeurId " +
           "AND p.timestamp >= :startDate AND p.timestamp <= :endDate ORDER BY p.timestamp ASC")
    List<PauseAIPrediction> findByChauffeurIdAndDateRange(
        @Param("chauffeurId") Long chauffeurId,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );

    @Query("SELECT p FROM PauseAIPrediction p WHERE p.trajet.chauffeur.entreprise.id = :entrepriseId " +
           "AND p.timestamp >= :startDate AND p.timestamp <= :endDate ORDER BY p.timestamp ASC")
    List<PauseAIPrediction> findByEntrepriseIdAndDateRange(
        @Param("entrepriseId") Long entrepriseId,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );

    @Query("SELECT p FROM PauseAIPrediction p WHERE p.timestamp >= :startDate AND p.timestamp <= :endDate " +
           "ORDER BY p.timestamp ASC")
    List<PauseAIPrediction> findByDateRange(
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );
}
