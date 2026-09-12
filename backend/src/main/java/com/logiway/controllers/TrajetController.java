package com.logiway.controllers;

import com.logiway.dto.trajet.TourneeOptimiseeResponse;
import com.logiway.dto.trajet.TrajetCarteResponse;
import com.logiway.dto.trajet.TrajetOptimisationRequest;
import com.logiway.dto.trajet.TrajetPositionRequest;
import com.logiway.dto.trajet.TrajetRequest;
import com.logiway.dto.trajet.TrajetResponse;
import com.logiway.entities.enums.StatutTrajet;
import com.logiway.services.TrajetService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/trajets")
@RequiredArgsConstructor
public class TrajetController {

    private final TrajetService trajetService;

    @GetMapping
    public ResponseEntity<Page<TrajetResponse>> getTrajets(
        @RequestParam(required = false) String search,
        @RequestParam(required = false) StatutTrajet statut,
        Pageable pageable
    ) {
        return ResponseEntity.ok(trajetService.getTrajets(search, statut, pageable));
    }

    @GetMapping("/carte")
    public ResponseEntity<List<TrajetCarteResponse>> getCarte() {
        return ResponseEntity.ok(trajetService.getTrajetsCarte());
    }

    @GetMapping("/{id}")
    public ResponseEntity<TrajetResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(trajetService.getTrajet(id));
    }

    @PostMapping
    public ResponseEntity<TrajetResponse> create(@RequestBody TrajetRequest request) {
        return ResponseEntity.ok(trajetService.createTrajet(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TrajetResponse> update(@PathVariable Long id, @RequestBody TrajetRequest request) {
        return ResponseEntity.ok(trajetService.updateTrajet(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        trajetService.deleteTrajet(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/demarrer")
    public ResponseEntity<TrajetResponse> demarrer(@PathVariable Long id) {
        return ResponseEntity.ok(trajetService.demarrerTrajet(id));
    }

    @PostMapping("/{id}/terminer")
    public ResponseEntity<TrajetResponse> terminer(@PathVariable Long id) {
        return ResponseEntity.ok(trajetService.terminerTrajet(id));
    }

    @PostMapping("/{id}/position")
    public ResponseEntity<TrajetResponse> position(@PathVariable Long id, @RequestBody TrajetPositionRequest request) {
        return ResponseEntity.ok(trajetService.updatePosition(id, request));
    }

    @PostMapping("/optimiser")
    public ResponseEntity<List<TourneeOptimiseeResponse>> optimiser(@RequestBody TrajetOptimisationRequest request) {
        return ResponseEntity.ok(trajetService.optimiserTrajets(request));
    }
}