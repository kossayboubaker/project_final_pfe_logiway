package com.logiway.services;

import com.logiway.dto.pause.PauseReglementaireResponse;
import com.logiway.entities.enums.StatutPause;

import java.util.List;

public interface PauseReglementaireService {

    /**
     * Generate pauses for a trajet by calling the Python simulator
     * Only called automatically when a trajet is started
     * 
     * @param trajetId The ID of the trajet
     * @return List of generated pauses
     */
    List<PauseReglementaireResponse> genererPauses(Long trajetId);

    /**
     * Get pauses for a specific trajet with role-based access control
     * 
     * SUPERADMIN → sees all pauses
     * MANAGER → sees pauses only for their drivers' trajets
     * CHAUFFEUR → sees only their own trajets' pauses
     * 
     * @param trajetId The ID of the trajet
     * @return List of pauses for the trajet
     */
    List<PauseReglementaireResponse> getPausesForTrajet(Long trajetId);

    /**
     * Met à jour le statut d'une pause réglementaire.
     *
     * @param trajetId ID du trajet parent
     * @param pauseId ID de la pause
     * @param statut nouveau statut
     * @return pause mise à jour
     */
    PauseReglementaireResponse mettreAJourStatutPause(Long trajetId, Long pauseId, StatutPause statut);
}
