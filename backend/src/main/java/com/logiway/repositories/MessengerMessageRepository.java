package com.logiway.repositories;

import com.logiway.entities.MessengerMessage;
import com.logiway.entities.enums.MessengerMessageStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface MessengerMessageRepository extends JpaRepository<MessengerMessage, Long> {

    List<MessengerMessage> findByExpediteurIdOrDestinataireIdOrderByDateEnvoiDesc(Long expediteurId, Long destinataireId);

    @Query("""
        select m from MessengerMessage m
        where (m.expediteurId = :currentUserId and m.destinataireId = :destinataireId)
           or (m.expediteurId = :destinataireId and m.destinataireId = :currentUserId)
        order by m.dateEnvoi desc
        """)
    Page<MessengerMessage> findConversationMessages(@Param("currentUserId") Long currentUserId,
                                                    @Param("destinataireId") Long destinataireId,
                                                    Pageable pageable);

    @Query("""
        select m from MessengerMessage m
        where (m.expediteurId = :currentUserId or m.destinataireId = :currentUserId)
        order by m.dateEnvoi desc
        """)
    List<MessengerMessage> findConversationSeed(@Param("currentUserId") Long currentUserId);

    @Query("""
        select m from MessengerMessage m
        where m.destinataireId = :currentUserId
          and m.expediteurId = :expediteurId
          and m.statut = :statut
        order by m.dateEnvoi desc
        """)
    List<MessengerMessage> findUnreadMessagesFromSender(@Param("currentUserId") Long currentUserId,
                                                        @Param("expediteurId") Long expediteurId,
                                                        @Param("statut") MessengerMessageStatus statut);

    Optional<MessengerMessage> findFirstByCheminFichierEndingWith(String filename);

    @Query("""
        update MessengerMessage m
        set m.connecte = :connecte,
            m.derniereActivite = :lastActivity
        where m.expediteurId = :userId
        """)
    @Modifying
    int updatePresenceForSender(@Param("userId") Long userId,
                                @Param("connecte") Boolean connecte,
                                @Param("lastActivity") LocalDateTime lastActivity);

    @Query("""
        update MessengerMessage m
        set m.statut = :statut,
            m.dateLecture = :dateLecture
        where m.expediteurId = :expediteurId
          and m.destinataireId = :destinataireId
          and m.statut = com.logiway.entities.enums.MessengerMessageStatus.NON_LU
        """)
    @Modifying
    int markConversationAsRead(@Param("expediteurId") Long expediteurId,
                               @Param("destinataireId") Long destinataireId,
                               @Param("statut") MessengerMessageStatus statut,
                               @Param("dateLecture") LocalDateTime dateLecture);
}