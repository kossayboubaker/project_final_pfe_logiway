package com.logiway.services;

import com.logiway.entities.Trajet;
import com.logiway.entities.enums.StatutTrajet;
import com.logiway.repositories.TrajetRepository;
import com.logiway.services.impl.PauseAIScheduler;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Scheduler Pause IA — Tests Unitaires")
class PauseAISchedulerTest {

    @Mock
    private TrajetRepository trajetRepository;

    @Mock
    private PauseAIService pauseAIService;

    @InjectMocks
    private PauseAIScheduler scheduler;

    private Trajet trajet(Long id, Double lat, Double lon) {
        Trajet trajet = new Trajet();
        trajet.setId(id);
        trajet.setLatitudeDepart(lat);
        trajet.setLongitudeDepart(lon);
        return trajet;
    }

    @Test
    @DisplayName("evaluerTrajetsActifs() → Aucun trajet EN_COURS ne fait rien")
    void evaluerTrajetsActifs_whenNoTrajets_noop() {
        when(trajetRepository.findByStatut(StatutTrajet.EN_COURS)).thenReturn(List.of());

        scheduler.evaluerTrajetsActifs();

        verify(pauseAIService, never()).evaluerPause(anyLong(), anyDouble(), anyDouble(), anyDouble());
    }

    @Test
    @DisplayName("evaluerTrajetsActifs() → Evalue chaque trajet avec coordonnees GPS")
    void evaluerTrajetsActifs_withGpsCoordinates_evaluates() {
        Trajet trajet1 = trajet(1L, 36.8, 10.2);
        Trajet trajet2 = trajet(2L, 36.9, 10.3);
        when(trajetRepository.findByStatut(StatutTrajet.EN_COURS)).thenReturn(List.of(trajet1, trajet2));

        scheduler.evaluerTrajetsActifs();

        verify(pauseAIService).evaluerPause(1L, 36.8, 10.2, 0.0);
        verify(pauseAIService).evaluerPause(2L, 36.9, 10.3, 0.0);
    }

    @Test
    @DisplayName("evaluerTrajetsActifs() → Trajet sans coordonnees GPS est ignore")
    void evaluerTrajetsActifs_withoutGps_skips() {
        Trajet sansGps = trajet(1L, null, null);
        when(trajetRepository.findByStatut(StatutTrajet.EN_COURS)).thenReturn(List.of(sansGps));

        scheduler.evaluerTrajetsActifs();

        verify(pauseAIService, never()).evaluerPause(anyLong(), anyDouble(), anyDouble(), anyDouble());
    }

    @Test
    @DisplayName("evaluerTrajetsActifs() → Erreur sur un trajet ne bloque pas les autres")
    void evaluerTrajetsActifs_errorOnOneContinuesOthers() {
        Trajet trajet1 = trajet(1L, 36.8, 10.2);
        Trajet trajet2 = trajet(2L, 36.9, 10.3);
        when(trajetRepository.findByStatut(StatutTrajet.EN_COURS)).thenReturn(List.of(trajet1, trajet2));
        doThrow(new RuntimeException("IA down"))
            .when(pauseAIService).evaluerPause(eq(1L), anyDouble(), anyDouble(), anyDouble());

        scheduler.evaluerTrajetsActifs();

        verify(pauseAIService).evaluerPause(2L, 36.9, 10.3, 0.0);
    }

    @Test
    @DisplayName("evaluerTrajetsActifs() → Erreur globale du repository est absorbee")
    void evaluerTrajetsActifs_repositoryError_swallowed() {
        when(trajetRepository.findByStatut(StatutTrajet.EN_COURS))
            .thenThrow(new RuntimeException("DB down"));

        scheduler.evaluerTrajetsActifs();

        verify(pauseAIService, never()).evaluerPause(anyLong(), anyDouble(), anyDouble(), anyDouble());
    }

    @Test
    @DisplayName("evaluerTrajetsActifs() → Trajet avec lat null et lon non-null est ignore")
    void evaluerTrajetsActifs_latNullLonNotNull_skips() {
        Trajet trajet = trajet(1L, null, 10.2);
        when(trajetRepository.findByStatut(StatutTrajet.EN_COURS)).thenReturn(List.of(trajet));

        scheduler.evaluerTrajetsActifs();

        verify(pauseAIService, never()).evaluerPause(anyLong(), anyDouble(), anyDouble(), anyDouble());
    }

    @Test
    @DisplayName("evaluerTrajetsActifs() → Trajet sans chauffeur loggue N/A")
    void evaluerTrajetsActifs_noChauffeur_evaluatesWithNaA() {
        Trajet trajet = trajet(1L, 36.8, 10.2);
        trajet.setChauffeur(null);
        when(trajetRepository.findByStatut(StatutTrajet.EN_COURS)).thenReturn(List.of(trajet));

        scheduler.evaluerTrajetsActifs();

        verify(pauseAIService).evaluerPause(1L, 36.8, 10.2, 0.0);
    }

    @Test
    @DisplayName("evaluerTrajetsActifs() → Trajet avec lat non-null et lon null est ignore")
    void evaluerTrajetsActifs_latNotNullLonNull_skips() {
        Trajet trajet = trajet(1L, 36.8, null);
        when(trajetRepository.findByStatut(StatutTrajet.EN_COURS)).thenReturn(List.of(trajet));

        scheduler.evaluerTrajetsActifs();

        verify(pauseAIService, never()).evaluerPause(anyLong(), anyDouble(), anyDouble(), anyDouble());
    }

    @Test
    @DisplayName("evaluerTrajetsActifs() → Trajet avec chauffeur loggue son id")
    void evaluerTrajetsActifs_withChauffeur_loggsId() {
        Trajet trajet = trajet(1L, 36.8, 10.2);
        com.logiway.entities.Chauffeur chauffeur = new com.logiway.entities.Chauffeur();
        chauffeur.setId(42L);
        trajet.setChauffeur(chauffeur);
        when(trajetRepository.findByStatut(StatutTrajet.EN_COURS)).thenReturn(List.of(trajet));

        scheduler.evaluerTrajetsActifs();

        verify(pauseAIService).evaluerPause(1L, 36.8, 10.2, 0.0);
    }
}
