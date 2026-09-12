package com.logiway.services.impl;

import com.logiway.dto.admin.KpiOverviewResponse;
import com.logiway.dto.admin.KpiOverviewResponse.*;
import com.logiway.entities.*;
import com.logiway.entities.enums.*;
import com.logiway.repositories.*;
import com.logiway.services.AdminKpiService;
import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.TextStyle;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminKpiServiceImpl implements AdminKpiService {

    private final VehiculeRepository vehiculeRepository;
    private final ChauffeurRepository chauffeurRepository;
    private final ReclamationRepository reclamationRepository;
    private final CongeRepository congeRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final EntityManager em;

    @Override
    @Transactional(readOnly = true)
    public KpiOverviewResponse getOverview(Long entrepriseId, String period, Long chauffeurId) {
        KpiOverviewResponse resp = new KpiOverviewResponse();

        LocalDateTime start;
        LocalDateTime end = LocalDateTime.now();
        if (period == null) {
            period = "Mois";
        }
        switch (period) {
            case "Jour" -> start = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0).withNano(0);
            case "Semaine" -> start = LocalDateTime.now().minusDays(7);
            case "Trimestre" -> start = LocalDateTime.now().minusMonths(3);
            case "Année" -> start = LocalDateTime.now().withDayOfYear(1).withHour(0).withMinute(0).withSecond(0).withNano(0);
            case "Mois" -> start = LocalDateTime.now().withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0).withNano(0);
            default -> start = LocalDateTime.now().withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0).withNano(0);
        }

        List<Vehicule> allVehicules = vehiculeRepository.findAll();
        List<Chauffeur> allChauffeurs = chauffeurRepository.findAll();
        List<Utilisateur> allUsers = utilisateurRepository.findAll();
        List<Reclamation> allReclamations = reclamationRepository.findAll();
        List<Conge> allConges = congeRepository.findAll();

        if (chauffeurId != null) {
            final Long finalChauffeurId = chauffeurId;
            allVehicules = allVehicules.stream()
                    .filter(v -> v.getChauffeurActuel() != null && v.getChauffeurActuel().getId().equals(finalChauffeurId))
                    .collect(Collectors.toList());
            allChauffeurs = allChauffeurs.stream()
                    .filter(c -> c.getId().equals(finalChauffeurId))
                    .collect(Collectors.toList());
            allUsers = allUsers.stream()
                    .filter(u -> u.getId().equals(finalChauffeurId))
                    .collect(Collectors.toList());
            allReclamations = allReclamations.stream()
                    .filter(r -> r.getUtilisateur() != null && r.getUtilisateur().getId().equals(finalChauffeurId))
                    .collect(Collectors.toList());
            allConges = allConges.stream()
                    .filter(c -> c.getChauffeur() != null && c.getChauffeur().getId().equals(finalChauffeurId))
                    .collect(Collectors.toList());
        } else if (entrepriseId != null) {
            final Long finalEntrepriseId = entrepriseId;
            allVehicules = allVehicules.stream()
                    .filter(v -> v.getEntreprise() != null && v.getEntreprise().getId().equals(finalEntrepriseId))
                    .collect(Collectors.toList());
            allChauffeurs = allChauffeurs.stream()
                    .filter(c -> c.getEntreprise() != null && c.getEntreprise().getId().equals(finalEntrepriseId))
                    .collect(Collectors.toList());
            allUsers = allUsers.stream()
                    .filter(u -> u.getEntreprise() != null && u.getEntreprise().getId().equals(finalEntrepriseId))
                    .collect(Collectors.toList());
            allReclamations = allReclamations.stream()
                    .filter(r -> r.getUtilisateur() != null && r.getUtilisateur().getEntreprise() != null && r.getUtilisateur().getEntreprise().getId().equals(finalEntrepriseId))
                    .collect(Collectors.toList());
            allConges = allConges.stream()
                    .filter(c -> c.getChauffeur() != null && c.getChauffeur().getEntreprise() != null && c.getChauffeur().getEntreprise().getId().equals(finalEntrepriseId))
                    .collect(Collectors.toList());
        }

        final LocalDateTime finalStart = start;
        List<Reclamation> periodReclamations = allReclamations.stream()
                .filter(r -> r.getDateCreation() != null && !r.getDateCreation().isBefore(finalStart))
                .collect(Collectors.toList());
        List<Conge> periodConges = allConges.stream()
                .filter(c -> c.getDateCreation() != null && !c.getDateCreation().isBefore(finalStart))
                .collect(Collectors.toList());

        // ── Cards ────────────────────────────────────────────────
        long totalChauffeurs = allChauffeurs.size();
        // Compter les chauffeurs avec estActif = ACTIF (champ hérité de Utilisateur)
        long chauffeursActifs = allChauffeurs.stream()
                .filter(c -> c.getEstActif() == StatutCompte.ACTIF)
                .count();

        long totalVehicules = allVehicules.size();
        long vehEnService = allVehicules.stream().filter(v -> v.getStatut() == StatutVehicule.EN_SERVICE).count();
        long vehMaintenance = allVehicules.stream().filter(v -> v.getStatut() == StatutVehicule.EN_MAINTENANCE).count();
        long vehHorsService = allVehicules.stream().filter(v -> v.getStatut() == StatutVehicule.HORS_SERVICE).count();

        long missionsEnCours = countTrajetsByStatut(StatutTrajet.EN_COURS, entrepriseId, chauffeurId);
        long missionsTerminees = countTrajetsByStatut(StatutTrajet.COMPLETE, entrepriseId, chauffeurId);
        long missionsALheure = countMissionsEnCoursOnTime(entrepriseId, chauffeurId);
        long missionsEnRetard = missionsEnCours - missionsALheure;

        long congesEnAttente = periodConges.stream().filter(c -> c.getStatut() == StatutConge.EN_ATTENTE).count();
        long congesApprouves = periodConges.stream().filter(c -> c.getStatut() == StatutConge.APPROUVE).count();
        long congesRefuses = periodConges.stream().filter(c -> c.getStatut() == StatutConge.REJETE).count();

        long reclamationsOuvertes = periodReclamations.stream().filter(r -> r.getStatut() == StatutReclamation.EN_COURS).count();
        long reclamationsResolues = periodReclamations.stream().filter(r -> r.getStatut() == StatutReclamation.RESOLU).count();

        long admins = allUsers.stream().filter(u -> u.getRole() != null && u.getRole() == Role.SUPERADMIN).count();
        long managers = allUsers.stream().filter(u -> u.getRole() != null && u.getRole() == Role.MANAGER).count();
        long chauffeursCount = allUsers.stream().filter(u -> u.getRole() != null && u.getRole() == Role.CHAUFFEUR).count();

        resp.cards.chauffeursActifs = chauffeursActifs;
        resp.cards.chauffeursTotal = totalChauffeurs;
        resp.cards.vehiculesTotal = totalVehicules;
        resp.cards.vehiculesEnService = vehEnService;
        resp.cards.vehiculesEnMaintenance = vehMaintenance;
        resp.cards.vehiculesHorsService = vehHorsService;
        resp.cards.vehiculesStatusSummary = String.format("%d EN_SERVICE | %d EN_MAINTENANCE | %d HORS_SERVICE", vehEnService, vehMaintenance, vehHorsService);
        resp.cards.missionsEnCours = missionsEnCours;
        resp.cards.missionsALheure = missionsALheure;
        resp.cards.missionsEnRetard = missionsEnRetard;
        resp.cards.missionsTerminees = missionsTerminees;
        resp.cards.congesEnAttente = congesEnAttente;
        resp.cards.congesApprouves = congesApprouves;
        resp.cards.congesRefuses = congesRefuses;
        resp.cards.reclamationsOuvertes = reclamationsOuvertes;
        resp.cards.reclamationsResolues = reclamationsResolues;
        resp.cards.reclamationsTotal = periodReclamations.size();
        resp.cards.administrateurs = admins;
        resp.cards.managers = managers;
        resp.cards.chauffeurs = chauffeursCount;

        // ── Punctuality last 12 months ────────────────────────────
        resp.punctualityLast12Months = buildPunctuality(entrepriseId, chauffeurId);

        // ── Incidents this month ──────────────────────────────────
        resp.incidentsThisMonth = buildIncidents(entrepriseId, start, end, chauffeurId);

        // ── Fuel overview ────────────────────────────────────────
        FuelOverview fuel = new FuelOverview();
        long vehiclesTracked = allVehicules.stream().filter(v -> v.getNiveauCarburant() != null).count();
        long lowFuel = allVehicules.stream().filter(v -> v.getNiveauCarburant() != null && v.getNiveauCarburant() < 20.0).count();
        fuel.vehiclesTracked = vehiclesTracked;
        fuel.lowFuelAlerts = lowFuel;
        fuel.targetLPer100km = 22.0;
        // Estimate average consumption from vehicle data + trips
        Double estimatedAvg = estimateFuelConsumption(allVehicules);
        fuel.averageLPer100km = estimatedAvg;
        fuel.deltaToTarget = (estimatedAvg != null && !estimatedAvg.isNaN()) ? estimatedAvg - fuel.targetLPer100km : Double.NaN;
        resp.fuelOverview = fuel;

        // ── Capacity distribution ─────────────────────────────────
        List<CapacityDistributionEntry> caps = new ArrayList<>();
        Map<String, List<Vehicule>> groupedVehicules = new LinkedHashMap<>();
        for (Vehicule v : allVehicules) {
            double cap = v.getCapaciteCharge() != null ? v.getCapaciteCharge() : 0.0;
            String type = "Petit véhicule";
            if (cap >= 7.5) {
                type = "Poids lourd";
            } else if (cap >= 3.5) {
                type = "Van";
            }
            String model = (v.getMarque() != null ? v.getMarque() : "") + " " + (v.getModele() != null ? v.getModele() : "");
            model = model.trim();
            if (model.isEmpty()) {
                model = "Modèle inconnu";
            }
            String key = type + " - " + model;
            groupedVehicules.computeIfAbsent(key, k -> new ArrayList<>()).add(v);
        }

        for (Map.Entry<String, List<Vehicule>> entry : groupedVehicules.entrySet()) {
            String key = entry.getKey();
            List<Vehicule> vehs = entry.getValue();
            
            double totalCap = 0.0;
            double usedCap = 0.0;
            double availableCap = 0.0;
            double maintenanceCap = 0.0;
            
            for (Vehicule v : vehs) {
                double vCap = v.getCapaciteCharge() != null ? v.getCapaciteCharge() : 0.0;
                totalCap += vCap;
                
                if (v.getStatut() == com.logiway.entities.enums.StatutVehicule.EN_SERVICE) {
                    Trajet activeTrip = em.createQuery(
                                    "SELECT t FROM Trajet t WHERE t.vehicule.id = :vid AND t.statut = :status",
                                    Trajet.class)
                            .setParameter("vid", v.getId())
                            .setParameter("status", StatutTrajet.EN_COURS)
                            .getResultStream().findFirst().orElse(null);
                    
                    double vUsed = 0.0;
                    if (activeTrip != null && activeTrip.getChargeKg() != null) {
                        vUsed = activeTrip.getChargeKg() / 1000.0;
                    } else {
                        Trajet lastTrip = em.createQuery(
                                        "SELECT t FROM Trajet t WHERE t.vehicule.id = :vid ORDER BY t.dateDepart DESC",
                                        Trajet.class)
                                .setParameter("vid", v.getId()).setMaxResults(1)
                                .getResultStream().findFirst().orElse(null);
                        if (lastTrip != null && lastTrip.getChargeKg() != null) {
                            vUsed = lastTrip.getChargeKg() / 1000.0;
                        }
                    }
                    if (vUsed > vCap) {
                        vUsed = vCap;
                    }
                    usedCap += vUsed;
                    availableCap += (vCap - vUsed);
                } else {
                    maintenanceCap += vCap;
                }
            }
            
            if (totalCap > 0) {
                CapacityDistributionEntry cde = new CapacityDistributionEntry();
                cde.vehicleType = key;
                cde.avgPercent = Math.round((usedCap / totalCap) * 100.0 * 10.0) / 10.0;
                cde.minPercent = Math.round((availableCap / totalCap) * 100.0 * 10.0) / 10.0;
                cde.maxPercent = Math.round((maintenanceCap / totalCap) * 100.0 * 10.0) / 10.0;
                cde.minTons = Math.round(availableCap * 10.0) / 10.0;
                cde.avgTons = Math.round(usedCap * 10.0) / 10.0;
                cde.maxTons = Math.round(totalCap * 10.0) / 10.0;
                caps.add(cde);
            }
        }
        
        if (caps.isEmpty()) {
            caps.add(buildCapacityForType("Poids lourd", 7.5, Double.MAX_VALUE, entrepriseId));
            caps.add(buildCapacityForType("Van", 3.5, 7.5, entrepriseId));
            caps.add(buildCapacityForType("Petit véhicule", 0.0, 3.5, entrepriseId));
        }
        resp.capacityDistribution = caps;

        // ── Top drivers ───────────────────────────────────────────
        resp.topDrivers = buildTopDrivers(start, end, allReclamations, entrepriseId, chauffeurId);

        // ── Users breakdown ──────────────────────────────────────
        resp.usersBreakdown = buildUsersBreakdown(allUsers);

        // ── Reclamations stats ────────────────────────────────────
        resp.reclamationsStats = buildReclamationsStats(periodReclamations);

        // ── Conges stats ─────────────────────────────────────────
        resp.congesStats = buildCongesStats(periodConges);

        return resp;
    }

    // ═══════════════════════════════════════════════════════════════
    //  PUNCTUALITY
    // ═══════════════════════════════════════════════════════════════
    private List<PunctualityEntry> buildPunctuality(Long entrepriseId, Long chauffeurId) {
        List<PunctualityEntry> punctuality = new ArrayList<>();
        YearMonth ym = YearMonth.now();
        for (int i = 11; i >= 0; i--) {
            YearMonth cur = ym.minusMonths(i);
            PunctualityEntry e = new PunctualityEntry();
            e.month = cur.getMonth().getDisplayName(TextStyle.SHORT, Locale.FRENCH);
            LocalDateTime start = cur.atDay(1).atStartOfDay();
            LocalDateTime end = cur.atEndOfMonth().atTime(23, 59, 59);
            long onTime = countCompletedTripsOnTimeBetween(start, end, entrepriseId, chauffeurId);
            long lateLess30 = countCompletedTripsLateBetween(start, end, 30, false, entrepriseId, chauffeurId);
            long lateMore30 = countCompletedTripsLateBetween(start, end, 30, true, entrepriseId, chauffeurId);
            long total = onTime + lateLess30 + lateMore30;
            e.onTime = onTime;
            e.lateLess30 = lateLess30;
            e.lateMore30 = lateMore30;
            e.totalMissions = total;
            e.punctualityPercent = total == 0 ? 0.0 : (100.0 * e.onTime) / total;
            punctuality.add(e);
        }
        return punctuality;
    }

    // ═══════════════════════════════════════════════════════════════
    //  INCIDENTS
    // ═══════════════════════════════════════════════════════════════
    private List<IncidentEntry> buildIncidents(Long entrepriseId, LocalDateTime start, LocalDateTime end, Long chauffeurId) {
        List<Reclamation> recs = reclamationRepository.findAll().stream()
                .filter(r -> r.getDateCreation() != null
                        && !r.getDateCreation().isBefore(start)
                        && !r.getDateCreation().isAfter(end))
                .filter(r -> chauffeurId != null
                        ? (r.getUtilisateur() != null && r.getUtilisateur().getId().equals(chauffeurId))
                        : (entrepriseId == null || (r.getUtilisateur() != null && r.getUtilisateur().getEntreprise() != null && r.getUtilisateur().getEntreprise().getId().equals(entrepriseId))))
                .toList();
        long totalInc = recs.size();
        List<IncidentEntry> incidents = new ArrayList<>();
        String[] cats = new String[]{"Accidents", "Pannes", "Embouteillages", "Contrôles", "Autres"};
        for (String cat : cats) {
            long count = recs.stream().filter(r -> classifyReclamation(r, cat)).count();
            IncidentEntry ie = new IncidentEntry();
            ie.category = cat;
            ie.count = count;
            ie.percent = totalInc == 0 ? 0.0 : (100.0 * count) / totalInc;
            incidents.add(ie);
        }
        return incidents;
    }

    // ═══════════════════════════════════════════════════════════════
    //  FUEL CONSUMPTION ESTIMATION
    // ═══════════════════════════════════════════════════════════════
    private Double estimateFuelConsumption(List<Vehicule> allVehicules) {
        // Estimate average L/100km using: (total km for vehicles with fuel data)
        // If a vehicle has niveauCarburant (%), we assume a 100L tank and
        // compute consumption from distance driven.
        List<Double> estimates = new ArrayList<>();
        for (Vehicule v : allVehicules) {
            if (v.getNiveauCarburant() == null || v.getKilometrage() == null) continue;
            // Get last 2 trips to estimate km driven and fuel used
            List<Trajet> trips = em.createQuery(
                            "SELECT t FROM Trajet t WHERE t.vehicule.id = :vid AND t.distanceKm IS NOT NULL ORDER BY t.dateDepart DESC",
                            Trajet.class)
                    .setParameter("vid", v.getId())
                    .setMaxResults(5)
                    .getResultList();
            if (trips.size() < 2) continue;
            double totalKm = 0;
            for (Trajet t : trips) {
                if (t.getDistanceKm() != null) totalKm += t.getDistanceKm();
            }
            // Estimate fuel used: assume 100L tank, niveauCarburant is %
            // Consumption (L/100km) = (tankCapacity * fuelUsedPct) / (totalKm/100)
            double tankLiters = 100.0; // assume 100L tank
            double fuelUsedPct = (100.0 - v.getNiveauCarburant()) / 100.0;
            if (fuelUsedPct <= 0 || totalKm <= 0) continue;
            double lPer100km = (tankLiters * fuelUsedPct) / (totalKm / 100.0);
            if (lPer100km > 5 && lPer100km < 60) { // sanity check
                estimates.add(lPer100km);
            }
        }
        if (estimates.isEmpty()) return null;
        return Math.round(estimates.stream().mapToDouble(d -> d).average().orElse(22.0) * 10.0) / 10.0;
    }

    // ═══════════════════════════════════════════════════════════════
    //  TOP DRIVERS (enhanced scoring)
    // ═══════════════════════════════════════════════════════════════
    private List<TopDriverEntry> buildTopDrivers(LocalDateTime start, LocalDateTime end,
                                                 List<Reclamation> allReclamations, Long entrepriseId, Long chauffeurId) {
        List<Object[]> rows;
        if (chauffeurId != null) {
            rows = em.createQuery(
                            "SELECT t.chauffeur.id, COUNT(t.id) as cnt FROM Trajet t " +
                                    "WHERE t.dateArriveeReelle BETWEEN :s AND :e AND t.chauffeur.id = :c " +
                                    "GROUP BY t.chauffeur.id ORDER BY cnt DESC")
                    .setParameter("s", start).setParameter("e", end).setParameter("c", chauffeurId)
                    .setMaxResults(20)
                    .getResultList();
        } else if (entrepriseId != null) {
            rows = em.createQuery(
                            "SELECT t.chauffeur.id, COUNT(t.id) as cnt FROM Trajet t " +
                                    "WHERE t.dateArriveeReelle BETWEEN :s AND :e AND t.chauffeur.entreprise.id = :emp " +
                                    "GROUP BY t.chauffeur.id ORDER BY cnt DESC")
                    .setParameter("s", start).setParameter("e", end).setParameter("emp", entrepriseId)
                    .setMaxResults(20)
                    .getResultList();
        } else {
            rows = em.createQuery(
                            "SELECT t.chauffeur.id, COUNT(t.id) as cnt FROM Trajet t " +
                                    "WHERE t.dateArriveeReelle BETWEEN :s AND :e " +
                                    "GROUP BY t.chauffeur.id ORDER BY cnt DESC")
                    .setParameter("s", start).setParameter("e", end)
                    .setMaxResults(20)
                    .getResultList();
        }

        List<TopDriverEntry> res = new ArrayList<>();
        int rank = 1;
        double maxDrivingHours = 1;

        // First pass: collect raw data
        List<TopDriverRaw> rawList = new ArrayList<>();
        for (Object[] r : rows) {
            TopDriverRaw raw = new TopDriverRaw();
            raw.chauffeurId = r[0] == null ? null : ((Number) r[0]).longValue();
            raw.missionsCompleted = r[1] == null ? 0 : ((Number) r[1]).longValue();
            Long cid = raw.chauffeurId;

            Chauffeur ch = cid == null ? null : chauffeurRepository.findById(cid).orElse(null);
            raw.chauffeurName = ch == null ? "(inconnu)"
                    : (ch.getPrenom() == null ? "" : ch.getPrenom()) + " " + (ch.getNom() == null ? "" : ch.getNom());

            // Punctuality: completed trips where arriveeReelle <= arrivee
            long ontime = em.createQuery(
                            "SELECT COUNT(t) FROM Trajet t WHERE t.chauffeur.id = :cid " +
                                    "AND t.dateArriveeReelle IS NOT NULL AND t.dateArrivee IS NOT NULL " +
                                    "AND t.dateArriveeReelle <= t.dateArrivee",
                            Long.class)
                    .setParameter("cid", cid)
                    .getSingleResult();
            raw.ontime = ontime;

            // Total trips for this driver (not just in period)
            long totalTrips = em.createQuery(
                            "SELECT COUNT(t) FROM Trajet t WHERE t.chauffeur.id = :cid",
                            Long.class)
                    .setParameter("cid", cid)
                    .getSingleResult();
            raw.totalTrips = totalTrips;

            // Driving hours: sum of actual durations computed in Java
            List<Trajet> completedTrips = em.createQuery(
                            "SELECT t FROM Trajet t WHERE t.chauffeur.id = :cid " +
                                    "AND t.dateDepart IS NOT NULL AND t.dateArriveeReelle IS NOT NULL",
                            Trajet.class)
                    .setParameter("cid", cid)
                    .getResultList();
            double totalMinutes = completedTrips.stream()
                    .mapToLong(t -> java.time.Duration.between(t.getDateDepart(), t.getDateArriveeReelle()).toMinutes())
                    .sum();
            raw.drivingMinutes = totalMinutes;

            // Average delay (computed in Java for Hibernate 6 compatibility)
            List<Trajet> lateTrips = em.createQuery(
                            "SELECT t FROM Trajet t WHERE t.chauffeur.id = :cid " +
                                    "AND t.dateArrivee IS NOT NULL AND t.dateArriveeReelle IS NOT NULL " +
                                    "AND t.dateArriveeReelle > t.dateArrivee",
                            Trajet.class)
                    .setParameter("cid", cid)
                    .getResultList();
            double avgDelay = lateTrips.stream()
                    .mapToLong(t -> java.time.Duration.between(t.getDateArrivee(), t.getDateArriveeReelle()).toMinutes())
                    .average().orElse(0);
            raw.avgDelayMinutes = avgDelay;

            // Incidents linked to this driver
            raw.incidents = allReclamations.stream()
                    .filter(rc -> rc.getUtilisateur() != null
                            && rc.getUtilisateur().getId() != null
                            && rc.getUtilisateur().getId().equals(raw.chauffeurId))
                    .count();

            // Availability: is the driver currently active?
            raw.isActive = ch != null && ch.getStatutConducteur() == StatutChauffeur.EN_SERVICE;
            raw.dateCreation = ch != null ? ch.getDateCreation() : null;

            rawList.add(raw);
            if (raw.drivingMinutes > maxDrivingHours) maxDrivingHours = raw.drivingMinutes;
        }

        // Second pass: compute weighted score
        for (TopDriverRaw raw : rawList) {
            TopDriverEntry e = new TopDriverEntry();
            e.rank = rank++;
            e.chauffeurId = raw.chauffeurId;
            e.chauffeurName = raw.chauffeurName;
            e.missionsCompleted = raw.missionsCompleted;
            e.incidents = raw.incidents;
            e.totalTrips = raw.totalTrips;
            e.drivingHours = Math.round(raw.drivingMinutes / 6.0) / 10.0; // convert to hours
            e.avgDelayMinutes = Math.round(raw.avgDelayMinutes * 10.0) / 10.0;

            // Punctuality % = on-time / missionsCompleted in period
            e.punctualityPercent = raw.missionsCompleted == 0 ? 0
                    : Math.round((100.0 * raw.ontime) / raw.missionsCompleted * 10.0) / 10.0;

            // Availability score: based on statut + recent activity
            double availability = raw.isActive ? 80 : 40;
            if (raw.totalTrips > 50) availability += 10;
            else if (raw.totalTrips > 20) availability += 5;
            if (raw.dateCreation != null) {
                long monthsActive = java.time.temporal.ChronoUnit.MONTHS.between(raw.dateCreation, LocalDateTime.now());
                if (monthsActive > 12) availability += 10;
                else if (monthsActive > 6) availability += 5;
            }
            e.availabilityScore = Math.min(100, Math.round(availability));

            // Weighted performance score:
            // 35% punctuality, 20% missions completed (vs max), 15% driving hours, 15% availability, 15% experience
            double maxMissions = rawList.stream().mapToLong(r -> r.missionsCompleted).max().orElse(1);
            double missionRatio = maxMissions > 0 ? raw.missionsCompleted / maxMissions : 0;
            double hoursRatio = maxDrivingHours > 0 ? raw.drivingMinutes / maxDrivingHours : 0;

            double score = (e.punctualityPercent / 100.0) * 35
                    + missionRatio * 20
                    + hoursRatio * 15
                    + (e.availabilityScore / 100.0) * 15
                    + 15; // default experience base

            // Malus for incidents
            score -= e.incidents * 3;

            e.performanceScore = Math.max(0, Math.min(100, Math.round(score)));
            e.badge = computeBadge(e.performanceScore);
            res.add(e);
        }

        // Sort by performanceScore descending and rerank
        res.sort((a, b) -> Double.compare(b.performanceScore, a.performanceScore));
        for (int i = 0; i < res.size(); i++) {
            res.get(i).rank = i + 1;
        }

        return res.size() > 10 ? res.subList(0, 10) : res;
    }

    private static class TopDriverRaw {
        Long chauffeurId;
        String chauffeurName;
        long missionsCompleted;
        long ontime;
        long totalTrips;
        double drivingMinutes;
        double avgDelayMinutes;
        long incidents;
        boolean isActive;
        LocalDateTime dateCreation;
    }

    // ═══════════════════════════════════════════════════════════════
    //  USERS BREAKDOWN
    // ═══════════════════════════════════════════════════════════════
    private List<UserBreakdownEntry> buildUsersBreakdown(List<Utilisateur> allUsers) {
        Map<Role, List<Utilisateur>> byRole = allUsers.stream()
                .filter(u -> u.getRole() != null)
                .collect(Collectors.groupingBy(Utilisateur::getRole));
        List<UserBreakdownEntry> res = new ArrayList<>();
        for (Map.Entry<Role, List<Utilisateur>> entry : byRole.entrySet()) {
            UserBreakdownEntry u = new UserBreakdownEntry();
            u.role = entry.getKey().name();
            u.count = entry.getValue().size();
            u.actifs = entry.getValue().stream()
                    .filter(usr -> usr.getEstActif() == StatutCompte.ACTIF).count();
            res.add(u);
        }
        return res;
    }

    // ═══════════════════════════════════════════════════════════════
    //  RECLAMATIONS STATS
    // ═══════════════════════════════════════════════════════════════
    private List<ReclamationStatEntry> buildReclamationsStats(List<Reclamation> allReclamations) {
        Map<String, Long> byStatus = allReclamations.stream()
                .filter(r -> r.getStatut() != null)
                .collect(Collectors.groupingBy(r -> r.getStatut().name(), Collectors.counting()));
        List<ReclamationStatEntry> res = new ArrayList<>();
        byStatus.forEach((key, value) -> {
            ReclamationStatEntry e = new ReclamationStatEntry();
            e.statut = key;
            e.count = value;
            res.add(e);
        });
        return res;
    }

    // ═══════════════════════════════════════════════════════════════
    //  CONGES STATS
    // ═══════════════════════════════════════════════════════════════
    private List<CongeStatEntry> buildCongesStats(List<Conge> allConges) {
        Map<String, Long> byStatus = allConges.stream()
                .filter(c -> c.getStatut() != null)
                .collect(Collectors.groupingBy(c -> c.getStatut().name(), Collectors.counting()));
        List<CongeStatEntry> res = new ArrayList<>();
        byStatus.forEach((key, value) -> {
            CongeStatEntry e = new CongeStatEntry();
            e.statut = key;
            e.count = value;
            res.add(e);
        });
        return res;
    }

    // ═══════════════════════════════════════════════════════════════
    //  HELPERS
    // ═══════════════════════════════════════════════════════════════

    private long countDistinctChauffeursByStatut(StatutTrajet statut) {
        TypedQuery<Long> q = em.createQuery(
                "SELECT COUNT(DISTINCT t.chauffeur.id) FROM Trajet t WHERE t.statut = :s", Long.class);
        q.setParameter("s", statut);
        return q.getSingleResult();
    }

    private long countTrajetsByStatut(StatutTrajet statut, Long entrepriseId, Long chauffeurId) {
        if (chauffeurId != null) {
            TypedQuery<Long> q = em.createQuery(
                    "SELECT COUNT(t) FROM Trajet t WHERE t.statut = :s AND t.chauffeur.id = :c", Long.class);
            q.setParameter("s", statut).setParameter("c", chauffeurId);
            return q.getSingleResult();
        }
        if (entrepriseId != null) {
            TypedQuery<Long> q = em.createQuery(
                    "SELECT COUNT(t) FROM Trajet t WHERE t.statut = :s AND t.chauffeur.entreprise.id = :emp", Long.class);
            q.setParameter("s", statut).setParameter("emp", entrepriseId);
            return q.getSingleResult();
        }
        TypedQuery<Long> q = em.createQuery("SELECT COUNT(t) FROM Trajet t WHERE t.statut = :s", Long.class);
        q.setParameter("s", statut);
        return q.getSingleResult();
    }

    private long countMissionsEnCoursOnTime(Long entrepriseId, Long chauffeurId) {
        long count = 0;
        List<Trajet> inProg;
        if (chauffeurId != null) {
            inProg = em.createQuery(
                    "SELECT t FROM Trajet t WHERE t.statut = :s AND t.chauffeur.id = :c", Trajet.class)
                    .setParameter("s", StatutTrajet.EN_COURS)
                    .setParameter("c", chauffeurId)
                    .getResultList();
        } else if (entrepriseId != null) {
            inProg = em.createQuery(
                    "SELECT t FROM Trajet t WHERE t.statut = :s AND t.chauffeur.entreprise.id = :emp", Trajet.class)
                    .setParameter("s", StatutTrajet.EN_COURS)
                    .setParameter("emp", entrepriseId)
                    .getResultList();
        } else {
            inProg = em.createQuery("SELECT t FROM Trajet t WHERE t.statut = :s", Trajet.class)
                    .setParameter("s", StatutTrajet.EN_COURS)
                    .getResultList();
        }
        for (Trajet t : inProg) {
            if (t.getDateDepart() != null && t.getDureeEstimeeMinutes() != null) {
                LocalDateTime expected = t.getDateDepart().plusMinutes(t.getDureeEstimeeMinutes());
                if (!LocalDateTime.now().isAfter(expected)) count++;
            }
        }
        return count;
    }

    private long countCompletedTripsOnTimeBetween(LocalDateTime start, LocalDateTime end, Long entrepriseId, Long chauffeurId) {
        List<Trajet> list;
        if (chauffeurId != null) {
            list = em.createQuery(
                            "SELECT t FROM Trajet t WHERE t.dateArriveeReelle IS NOT NULL " +
                                    "AND t.dateArriveeReelle BETWEEN :s AND :e AND t.chauffeur.id = :c", Trajet.class)
                    .setParameter("s", start).setParameter("e", end).setParameter("c", chauffeurId).getResultList();
        } else if (entrepriseId != null) {
            list = em.createQuery(
                            "SELECT t FROM Trajet t WHERE t.dateArriveeReelle IS NOT NULL " +
                                    "AND t.dateArriveeReelle BETWEEN :s AND :e AND t.chauffeur.entreprise.id = :emp", Trajet.class)
                    .setParameter("s", start).setParameter("e", end).setParameter("emp", entrepriseId).getResultList();
        } else {
            list = em.createQuery(
                            "SELECT t FROM Trajet t WHERE t.dateArriveeReelle IS NOT NULL " +
                                    "AND t.dateArriveeReelle BETWEEN :s AND :e", Trajet.class)
                    .setParameter("s", start).setParameter("e", end).getResultList();
        }
        long ok = 0;
        for (Trajet t : list) {
            if (t.getDateArriveeReelle() != null && t.getDateArrivee() != null) {
                long diff = Duration.between(t.getDateArrivee(), t.getDateArriveeReelle()).toMinutes();
                if (diff <= 0) ok++;
            }
        }
        return ok;
    }

    private long countCompletedTripsLateBetween(LocalDateTime start, LocalDateTime end, int minutes, boolean moreThan, Long entrepriseId, Long chauffeurId) {
        List<Trajet> list;
        if (chauffeurId != null) {
            list = em.createQuery(
                            "SELECT t FROM Trajet t WHERE t.dateArriveeReelle IS NOT NULL " +
                                    "AND t.dateArriveeReelle BETWEEN :s AND :e AND t.chauffeur.id = :c", Trajet.class)
                    .setParameter("s", start).setParameter("e", end).setParameter("c", chauffeurId).getResultList();
        } else if (entrepriseId != null) {
            list = em.createQuery(
                            "SELECT t FROM Trajet t WHERE t.dateArriveeReelle IS NOT NULL " +
                                    "AND t.dateArriveeReelle BETWEEN :s AND :e AND t.chauffeur.entreprise.id = :emp", Trajet.class)
                    .setParameter("s", start).setParameter("e", end).setParameter("emp", entrepriseId).getResultList();
        } else {
            list = em.createQuery(
                            "SELECT t FROM Trajet t WHERE t.dateArriveeReelle IS NOT NULL " +
                                    "AND t.dateArriveeReelle BETWEEN :s AND :e", Trajet.class)
                    .setParameter("s", start).setParameter("e", end).getResultList();
        }
        long count = 0;
        for (Trajet t : list) {
            if (t.getDateArriveeReelle() != null && t.getDateArrivee() != null) {
                long diff = Duration.between(t.getDateArrivee(), t.getDateArriveeReelle()).toMinutes();
                if (moreThan) {
                    if (diff > minutes) count++;
                } else {
                    if (diff > 0 && diff <= minutes) count++;
                }
            }
        }
        return count;
    }

    private boolean classifyReclamation(Reclamation r, String category) {
        if (r.getSujet() != null && r.getSujet().toLowerCase().contains(category.toLowerCase())) return true;
        if (r.getDescription() != null && r.getDescription().toLowerCase().contains(category.toLowerCase())) return true;
        return switch (category) {
            case "Accidents" -> containsAny(r, new String[]{"accident"});
            case "Pannes" -> containsAny(r, new String[]{"panne", "dépannage", "depannage"});
            case "Embouteillages" -> containsAny(r, new String[]{"embouteillage", "traffic", "trafic"});
            case "Contrôles" -> containsAny(r, new String[]{"contrôle", "controle", "contrôles", "controle"});
            default -> false;
        };
    }

    private boolean containsAny(Reclamation r, String[] kws) {
        String text = ((r.getSujet() == null ? "" : r.getSujet()) + " "
                + (r.getDescription() == null ? "" : r.getDescription())).toLowerCase();
        for (String k : kws) {
            if (text.contains(k)) return true;
        }
        return false;
    }

    private CapacityDistributionEntry buildCapacityForType(String label, double minTons, double maxTons, Long entrepriseId) {
        CapacityDistributionEntry e = new CapacityDistributionEntry();
        e.vehicleType = label;
        List<Vehicule> vehs = vehiculeRepository.findAll().stream().filter(v -> {
            if (entrepriseId != null && (v.getEntreprise() == null || !v.getEntreprise().getId().equals(entrepriseId))) {
                return false;
            }
            Double cap = v.getCapaciteCharge();
            if (cap == null) return false;
            double t = cap;
            return t >= minTons && (maxTons == Double.MAX_VALUE || t <= maxTons);
        }).toList();
        double minP = 0, maxP = 0, avgP = 0, minT = 0, avgT = 0, maxT = 0;
        if (!vehs.isEmpty()) {
            List<Double> percents = new ArrayList<>();
            for (Vehicule v : vehs) {
                Trajet t = em.createQuery(
                                "SELECT t FROM Trajet t WHERE t.vehicule.id = :vid ORDER BY t.dateDepart DESC",
                                Trajet.class)
                        .setParameter("vid", v.getId()).setMaxResults(1)
                        .getResultStream().findFirst().orElse(null);
                if (t != null && t.getChargeKg() != null && v.getCapaciteCharge() != null && v.getCapaciteCharge() > 0) {
                    double tons = t.getChargeKg() / 1000.0;
                    double pct = (tons / v.getCapaciteCharge()) * 100.0;
                    percents.add(pct);
                    minT = Math.min(minT == 0 ? tons : minT, tons);
                    maxT = Math.max(maxT, tons);
                    avgT += tons;
                }
            }
            if (!percents.isEmpty()) {
                minP = percents.stream().mapToDouble(Double::doubleValue).min().orElse(0);
                maxP = percents.stream().mapToDouble(Double::doubleValue).max().orElse(0);
                avgP = percents.stream().mapToDouble(Double::doubleValue).average().orElse(0);
                avgT = avgT / percents.size();
            }
        }
        e.minPercent = round(minP);
        e.avgPercent = round(avgP);
        e.maxPercent = round(maxP);
        e.minTons = round(minT);
        e.avgTons = round(avgT);
        e.maxTons = round(maxT);
        return e;
    }

    private String computeBadge(double score) {
        if (score > 85) return "Excellent";
        if (score > 70) return "Bon";
        if (score > 50) return "Normal";
        return "À améliorer";
    }

    private double round(double v) {
        return Math.round(v * 10.0) / 10.0;
    }
}