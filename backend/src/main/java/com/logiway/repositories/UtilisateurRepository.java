package com.logiway.repositories;

import com.logiway.entities.Utilisateur;
import com.logiway.entities.enums.Role;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UtilisateurRepository extends JpaRepository<Utilisateur, Long> {

    Optional<Utilisateur> findByEmailIgnoreCase(String email);

    Optional<Utilisateur> findByVerificationToken(String verificationToken);

    boolean existsByEmailIgnoreCase(String email);

    List<Utilisateur> findByRole(Role role);

    List<Utilisateur> findByCreatedBy_Id(Long createdById);

    List<Utilisateur> findByEntreprise_Id(Long entrepriseId);
}
