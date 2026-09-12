package com.logiway.repositories;

import com.logiway.entities.Notification;
import com.logiway.entities.Utilisateur;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    @EntityGraph(attributePaths = "utilisateur")
    List<Notification> findByUtilisateurOrderByDateCreationDesc(Utilisateur utilisateur);

    @EntityGraph(attributePaths = "utilisateur")
    List<Notification> findByUtilisateurAndEstLuFalseOrderByDateCreationDesc(Utilisateur utilisateur);

    @EntityGraph(attributePaths = "utilisateur")
    List<Notification> findAllByOrderByDateCreationDesc();

    @EntityGraph(attributePaths = "utilisateur")
    List<Notification> findByUtilisateurInOrderByDateCreationDesc(Collection<Utilisateur> utilisateurs);

    @EntityGraph(attributePaths = "utilisateur")
    List<Notification> findByUtilisateurInAndEstLuFalseOrderByDateCreationDesc(Collection<Utilisateur> utilisateurs);

    void deleteByUtilisateur(Utilisateur utilisateur);

}
