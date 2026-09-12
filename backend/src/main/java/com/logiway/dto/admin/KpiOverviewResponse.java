package com.logiway.dto.admin;

import java.util.List;

public class KpiOverviewResponse {

    public static class Cards {
        public long chauffeursActifs;
        public long chauffeursTotal;
        public long vehiculesEnService;
        public long vehiculesEnMaintenance;
        public long vehiculesHorsService;
        public long vehiculesTotal;
        public String vehiculesStatusSummary;
        public long missionsEnCours;
        public long missionsALheure;
        public long missionsEnRetard;
        public long missionsTerminees;
        public long congesEnAttente;
        public long congesApprouves;
        public long congesRefuses;
        public long reclamationsOuvertes;
        public long reclamationsResolues;
        public long reclamationsTotal;
        public long administrateurs;
        public long managers;
        public long chauffeurs;
    }

    public static class PunctualityEntry {
        public String month;
        public long onTime;
        public long lateLess30;
        public long lateMore30;
        public long totalMissions;
        public double punctualityPercent;
    }

    public static class IncidentEntry {
        public String category;
        public long count;
        public double percent;
    }

    public static class FuelOverview {
        public Double averageLPer100km;
        public long vehiclesTracked;
        public long lowFuelAlerts;
        public double targetLPer100km;
        public double deltaToTarget;
    }

    public static class CapacityDistributionEntry {
        public String vehicleType;
        public double minPercent;
        public double avgPercent;
        public double maxPercent;
        public double minTons;
        public double avgTons;
        public double maxTons;
    }

    public static class TopDriverEntry {
        public int rank;
        public Long chauffeurId;
        public String chauffeurName;
        public long missionsCompleted;
        public double performanceScore;
        public double punctualityPercent;
        public long incidents;
        public String badge;
        public double drivingHours;
        public double availabilityScore;
        public long totalTrips;
        public double avgDelayMinutes;
    }

    public static class UserBreakdownEntry {
        public String role;
        public long count;
        public long actifs;
    }

    public static class ReclamationStatEntry {
        public String statut;
        public long count;
    }

    public static class CongeStatEntry {
        public String statut;
        public long count;
    }

    public Cards cards = new Cards();
    public List<PunctualityEntry> punctualityLast12Months;
    public List<IncidentEntry> incidentsThisMonth;
    public FuelOverview fuelOverview;
    public List<CapacityDistributionEntry> capacityDistribution;
    public List<TopDriverEntry> topDrivers;
    public List<UserBreakdownEntry> usersBreakdown;
    public List<ReclamationStatEntry> reclamationsStats;
    public List<CongeStatEntry> congesStats;
}
