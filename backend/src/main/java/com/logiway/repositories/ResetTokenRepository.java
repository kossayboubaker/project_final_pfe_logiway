package com.logiway.repositories;

import com.logiway.entities.ResetToken;
import com.logiway.entities.Utilisateur;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.Optional;

public interface ResetTokenRepository extends JpaRepository<ResetToken, Long> {

    Optional<ResetToken> findByCodeAndUsedFalse(String code);

    void deleteByUtilisateur(Utilisateur utilisateur);

    void deleteByExpiresAtBefore(LocalDateTime threshold);
}
