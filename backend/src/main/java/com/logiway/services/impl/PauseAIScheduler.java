package com.logiway.services.impl;

import com.logiway.entities.Trajet;
import com.logiway.entities.enums.StatutTrajet;
import com.logiway.repositories.TrajetRepository;
import com.logiway.services.PauseAIService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class PauseAIScheduler {

    private final TrajetRepository trajetRepository;
    private final PauseAIService pauseAIService;

    /**
     * Évalue automatiquement tous les trajets EN_COURS toutes les 2 minutes
     * Pour chaque trajet actif, appelle le service d'évaluation IA
     */
    @Scheduled(fixedRate = 120000) // 2 minutes = 120000 ms
    public void evaluerTrajetsActifs() {
        log.debug("[SCHEDULER] === DEBUT évaluation automatique des trajets actifs ===");

        try {
            List<Trajet> trajetsEnCours = trajetRepository.findByStatut(StatutTrajet.EN_COURS);
            
            if (trajetsEnCours.isEmpty()) {
                log.debug("[SCHEDULER] Aucun trajet EN_COURS à évaluer");
                return;
            }

            log.info("[SCHEDULER] {} trajet(s) EN_COURS à évaluer", trajetsEnCours.size());

            for (Trajet trajet : trajetsEnCours) {
                try {
                    // Calculer la position actuelle estimée du véhicule
                    // TODO: Récupérer la vraie position GPS depuis le simulateur ou la table positions
                    // Pour l'instant, on utilise la position de départ comme approximation
                    Double currentLat = trajet.getLatitudeDepart();
                    Double currentLon = trajet.getLongitudeDepart();
                    
                    // Estimer la distance parcourue basée sur le temps écoulé
                    // TODO: Calculer la vraie distance parcourue depuis la géométrie OSRM
                    Double distanceParcourue = 0.0; // Placeholder
                    
                    if (currentLat != null && currentLon != null) {
                        log.debug("[SCHEDULER] Évaluation du trajet {} - chauffeur: {}", 
                                 trajet.getId(), 
                                 trajet.getChauffeur() != null ? trajet.getChauffeur().getId() : "N/A");
                        
                        pauseAIService.evaluerPause(trajet.getId(), currentLat, currentLon, distanceParcourue);
                    } else {
                        log.warn("[SCHEDULER] Trajet {} sans coordonnées GPS, skip évaluation", trajet.getId());
                    }
                    
                } catch (Exception e) {
                    log.error("[SCHEDULER] Erreur lors de l'évaluation du trajet {}: {}", 
                             trajet.getId(), e.getMessage());
                    // Continue avec les autres trajets
                }
            }

            log.debug("[SCHEDULER] === FIN évaluation automatique ===");

        } catch (Exception e) {
            log.error("[SCHEDULER] Erreur globale dans le scheduler: {}", e.getMessage(), e);
        }
    }
}
