package com.logiway.controllers;

import com.logiway.dto.response.RapportResponse;
import com.logiway.security.AuthenticatedUserService;
import com.logiway.services.RapportService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/rapports")
@RequiredArgsConstructor
@CrossOrigin(origins = "${app.cors.allowed-origins:http://localhost:4200}")
public class RapportController {

    private final RapportService rapportService;
    private final AuthenticatedUserService authenticatedUserService;

    /**
     * Génère un rapport sur les congés de la semaine
     */
    @GetMapping("/conges/semaine")
    @PreAuthorize("hasAnyAuthority('ROLE_SUPERADMIN','ROLE_MANAGER','ROLE_CHAUFFEUR')")
    public ResponseEntity<RapportResponse> genererRapportCongesSemaine() {
        try {
            var utilisateur = authenticatedUserService.getCurrentUser();
            RapportResponse rapport = rapportService.genererRapportCongesSemaine(utilisateur.getId());
            return ResponseEntity.ok(rapport);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Génère un rapport sur les congés d'une période donnée
     */
    @GetMapping("/conges/periode")
    @PreAuthorize("hasAnyAuthority('ROLE_SUPERADMIN','ROLE_MANAGER','ROLE_CHAUFFEUR')")
    public ResponseEntity<RapportResponse> genererRapportCongesPeriode(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate debut,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fin) {
        try {
            var utilisateur = authenticatedUserService.getCurrentUser();
            RapportResponse rapport = rapportService.genererRapportCongesPeriode(debut, fin, utilisateur.getId());
            return ResponseEntity.ok(rapport);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Génère un rapport sur le taux d'absence des chauffeurs
     */
    @GetMapping("/absences")
    @PreAuthorize("hasAnyAuthority('ROLE_SUPERADMIN','ROLE_MANAGER')")
    public ResponseEntity<RapportResponse> genererRapportTauxAbsences(
        @RequestParam int mois,
        @RequestParam int annee) {
        try {
            var utilisateur = authenticatedUserService.getCurrentUser();
            RapportResponse rapport = rapportService.genererRapportTauxAbsences(mois, annee, utilisateur.getId());
            return ResponseEntity.ok(rapport);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Génère un rapport sur les réclamations
     */
    @GetMapping("/reclamations")
    @PreAuthorize("hasAnyAuthority('ROLE_SUPERADMIN','ROLE_MANAGER','ROLE_CHAUFFEUR')")
    public ResponseEntity<RapportResponse> genererRapportReclamations() {
        try {
            var utilisateur = authenticatedUserService.getCurrentUser();
            RapportResponse rapport = rapportService.genererRapportReclamations(utilisateur.getId());
            return ResponseEntity.ok(rapport);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Génère un rapport complet sur les véhicules
     */
    @GetMapping("/vehicules")
    @PreAuthorize("hasAnyAuthority('ROLE_SUPERADMIN','ROLE_MANAGER','ROLE_CHAUFFEUR')")
    public ResponseEntity<RapportResponse> genererRapportVehicules() {
        try {
            var utilisateur = authenticatedUserService.getCurrentUser();
            RapportResponse rapport = rapportService.genererRapportVehicules(utilisateur.getId());
            return ResponseEntity.ok(rapport);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Génère un rapport complet sur les trajets d'une période
     */
    @GetMapping("/trajets")
    @PreAuthorize("hasAnyAuthority('ROLE_SUPERADMIN','ROLE_MANAGER','ROLE_CHAUFFEUR')")
    public ResponseEntity<RapportResponse> genererRapportTrajets(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate debut,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fin) {
        try {
            var utilisateur = authenticatedUserService.getCurrentUser();
            RapportResponse rapport = rapportService.genererRapportTrajets(debut, fin, utilisateur.getId());
            return ResponseEntity.ok(rapport);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Génère un rapport global sur toutes les gestions
     */
    @GetMapping("/global")
    @PreAuthorize("hasAnyAuthority('ROLE_SUPERADMIN','ROLE_MANAGER','ROLE_CHAUFFEUR')")
    public ResponseEntity<RapportResponse> genererRapportGlobal() {
        try {
            var utilisateur = authenticatedUserService.getCurrentUser();
            RapportResponse rapport = rapportService.genererRapportGlobal(utilisateur.getId());
            return ResponseEntity.ok(rapport);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
