package com.logiway.services;

import com.logiway.dto.admin.KpiOverviewResponse;
import com.logiway.dto.admin.KpiOverviewResponse.CapacityDistributionEntry;
import com.logiway.dto.admin.KpiOverviewResponse.TopDriverEntry;
import com.logiway.entities.Chauffeur;
import com.logiway.entities.Conge;
import com.logiway.entities.Entreprise;
import com.logiway.entities.Reclamation;
import com.logiway.entities.Trajet;
import com.logiway.entities.Utilisateur;
import com.logiway.entities.Vehicule;
import com.logiway.entities.enums.Role;
import com.logiway.entities.enums.StatutChauffeur;
import com.logiway.entities.enums.StatutCompte;
import com.logiway.entities.enums.StatutConge;
import com.logiway.entities.enums.StatutReclamation;
import com.logiway.entities.enums.StatutTrajet;
import com.logiway.entities.enums.StatutVehicule;
import com.logiway.repositories.ChauffeurRepository;
import com.logiway.repositories.CongeRepository;
import com.logiway.repositories.ReclamationRepository;
import com.logiway.repositories.UtilisateurRepository;
import com.logiway.repositories.VehiculeRepository;
import com.logiway.services.impl.AdminKpiServiceImpl;
import java.lang.reflect.Method;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import jakarta.persistence.TypedQuery;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.IntStream;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminKpiServiceImplTest {

    @Mock
    private VehiculeRepository vehiculeRepository;
    @Mock
    private ChauffeurRepository chauffeurRepository;
    @Mock
    private ReclamationRepository reclamationRepository;
    @Mock
    private CongeRepository congeRepository;
    @Mock
    private UtilisateurRepository utilisateurRepository;
    @Mock
    private EntityManager em;
    @Mock
    private TypedQuery<Trajet> trajetQuery;
    @Mock
    private TypedQuery<Long> longQuery;
    @Mock
    private Query objectQuery;

    @BeforeEach
    void setUp() {
        lenient().when(em.createQuery(anyString(), eq(Trajet.class))).thenReturn(trajetQuery);
        lenient().when(em.createQuery(anyString(), eq(Long.class))).thenReturn(longQuery);
        lenient().when(em.createQuery(anyString())).thenReturn(objectQuery);
        lenient().when(trajetQuery.setParameter(anyString(), any())).thenReturn(trajetQuery);
        lenient().when(trajetQuery.setMaxResults(anyInt())).thenReturn(trajetQuery);
        lenient().when(longQuery.setParameter(anyString(), any())).thenReturn(longQuery);
        lenient().when(longQuery.setMaxResults(anyInt())).thenReturn(longQuery);
        lenient().when(objectQuery.setParameter(anyString(), any())).thenReturn(objectQuery);
        lenient().when(objectQuery.setMaxResults(anyInt())).thenReturn(objectQuery);
    }

    private AdminKpiServiceImpl service() {
        return new AdminKpiServiceImpl(vehiculeRepository, chauffeurRepository, reclamationRepository,
            congeRepository, utilisateurRepository, em);
    }

    // ========== Helpers ==========

    private Entreprise entreprise(Long id) {
        return Entreprise.builder().id(id).build();
    }

    private Chauffeur chauffeur(Long id, StatutChauffeur statut, LocalDateTime dateCreation) {
        return Chauffeur.builder().id(id).prenom("P" + id).nom("N" + id).email("c" + id + "@test.fr")
            .role(Role.CHAUFFEUR).statutConducteur(statut).dateCreation(dateCreation)
            .estActif(StatutCompte.ACTIF).build();
    }

    private Vehicule vehicule(Long id, StatutVehicule statut, Double cap, Double niveau, Integer km,
                              Entreprise ent, Chauffeur ch, String marque, String modele) {
        return Vehicule.builder().id(id).statut(statut).capaciteCharge(cap).niveauCarburant(niveau)
            .kilometrage(km).entreprise(ent).chauffeurActuel(ch).marque(marque).modele(modele).build();
    }

    private Trajet trip(Long id, LocalDateTime depart, LocalDateTime arrivee, LocalDateTime arriveeReelle,
                        Integer duree, Double distKm, Double chargeKg) {
        return Trajet.builder().id(id).statut(StatutTrajet.EN_COURS).dateDepart(depart).dateArrivee(arrivee)
            .dateArriveeReelle(arriveeReelle).dureeEstimeeMinutes(duree).distanceKm(distKm).chargeKg(chargeKg).build();
    }

    private Reclamation reclamation(Long id, String sujet, String desc, StatutReclamation statut,
                                    LocalDateTime date, Utilisateur user) {
        return Reclamation.builder().id(id).sujet(sujet).description(desc).statut(statut)
            .dateCreation(date).utilisateur(user).build();
    }

    private Conge conge(Long id, StatutConge statut, LocalDateTime date, Chauffeur ch) {
        return Conge.builder().id(id).statut(statut).dateCreation(date).chauffeur(ch).build();
    }

    private void stubTrajetList(List<Trajet> trips) {
        when(trajetQuery.getResultList()).thenReturn(trips);
        lenient().when(trajetQuery.getResultStream()).thenAnswer(inv -> trips.stream());
    }

    private void stubRows(List<Object[]> rows) {
        when(objectQuery.getResultList()).thenReturn(rows);
    }

    private void stubLongQueue(Long... values) {
        AtomicInteger idx = new AtomicInteger();
        when(longQuery.getSingleResult()).thenAnswer(inv -> {
            int i = Math.min(idx.getAndIncrement(), values.length - 1);
            return values[Math.max(0, i)];
        });
    }

    private void stubFindChauffeur(List<Chauffeur> all) {
        when(chauffeurRepository.findById(any())).thenAnswer(inv -> {
            Long id = inv.getArgument(0);
            return all.stream().filter(c -> c.getId().equals(id)).findFirst();
        });
    }

    // ========== Tests ==========

    @Test
    void getOverview_global_richData() {
        Trajet trip1 = trip(1L, LocalDateTime.now().minusHours(2), LocalDateTime.now().minusMinutes(70),
            LocalDateTime.now().minusMinutes(60), 180, 50.0, 5000.0);
        Trajet trip2 = trip(2L, LocalDateTime.now().minusHours(5), LocalDateTime.now().minusMinutes(120),
            LocalDateTime.now().minusMinutes(60), null, 50.0, 2000.0);
        Trajet trip3 = trip(3L, LocalDateTime.now().minusHours(3), LocalDateTime.now().minusMinutes(50),
            LocalDateTime.now().minusMinutes(30), 120, 50.0, 1000.0);
        stubTrajetList(List.of(trip1, trip2, trip3));

        Chauffeur ch10 = chauffeur(10L, StatutChauffeur.EN_SERVICE, LocalDateTime.now().minusMonths(24));
        Chauffeur ch20 = chauffeur(20L, StatutChauffeur.LIBRE, LocalDateTime.now().minusMonths(8));
        ch20.setEstActif(StatutCompte.INACTIF);
        when(chauffeurRepository.findAll()).thenReturn(List.of(ch10, ch20));
        stubFindChauffeur(List.of(ch10, ch20));

        Vehicule vPl = vehicule(1L, StatutVehicule.EN_SERVICE, 8.0, 50.0, 200, null, ch10, "Renault", "Camion");
        Vehicule vSmall = vehicule(2L, StatutVehicule.EN_SERVICE, 2.0, null, null, null, null, "Renault", "Kangoo");
        Vehicule vMaintenance = vehicule(3L, StatutVehicule.EN_MAINTENANCE, 5.0, 15.0, 300, null, null, "Iveco", "Daily");
        Vehicule vHors = vehicule(4L, StatutVehicule.HORS_SERVICE, 1.0, null, null, null, null, null, null);
        Vehicule vVan = vehicule(5L, StatutVehicule.EN_SERVICE, 4.0, 10.0, 100, null, null, "Ford", "Transit");
        when(vehiculeRepository.findAll()).thenReturn(List.of(vPl, vSmall, vMaintenance, vHors, vVan));

        when(utilisateurRepository.findAll()).thenReturn(List.of(
            Utilisateur.builder().id(1L).role(Role.SUPERADMIN).estActif(StatutCompte.ACTIF).build(),
            Utilisateur.builder().id(2L).role(Role.MANAGER).estActif(StatutCompte.INACTIF).build(),
            Utilisateur.builder().id(3L).role(Role.CHAUFFEUR).estActif(StatutCompte.ACTIF).build(),
            Utilisateur.builder().id(4L).role(null).estActif(StatutCompte.ACTIF).build()));

        when(reclamationRepository.findAll()).thenReturn(List.of(
            reclamation(1L, "Accident sur A6", "Tôle froissée", StatutReclamation.EN_COURS, LocalDateTime.now(), ch10),
            reclamation(2L, "Problème moteur", "panne diesel", StatutReclamation.RESOLU, LocalDateTime.now(), ch10),
            reclamation(3L, "Bouchon", "embouteillage à Lyon", StatutReclamation.REJETE, LocalDateTime.now(), ch10),
            reclamation(4L, "contrôle routier", "documents", StatutReclamation.EN_COURS, LocalDateTime.now(), ch10),
            reclamation(5L, "Retard", "livraison", StatutReclamation.EN_COURS, LocalDateTime.now(), ch10),
            reclamation(6L, "Ancien", "Ancien", StatutReclamation.EN_COURS, LocalDateTime.now().minusMonths(2), ch10),
            reclamation(7L, "sans date", "sans date", StatutReclamation.EN_COURS, null, ch10),
            reclamation(8L, "sans user", "sans user", StatutReclamation.EN_COURS, LocalDateTime.now(), null)));

        when(congeRepository.findAll()).thenReturn(List.of(
            conge(1L, StatutConge.EN_ATTENTE, LocalDateTime.now(), ch10),
            conge(2L, StatutConge.APPROUVE, LocalDateTime.now(), ch10),
            conge(3L, StatutConge.REJETE, LocalDateTime.now(), ch10),
            conge(4L, null, LocalDateTime.now(), ch10),
            conge(5L, StatutConge.APPROUVE, LocalDateTime.now().minusMonths(2), ch10)));

        stubRows(List.of(new Object[]{10L, 5L}, new Object[]{20L, 0L}, new Object[]{null, 3L}));
        stubLongQueue(3L, 2L, 3L, 25L, 3L, 60L, 3L, 3L);

        KpiOverviewResponse resp = service().getOverview(null, "Jour", null);

        assertNotNull(resp);
        assertEquals(2, resp.cards.chauffeursTotal);
        assertEquals(1, resp.cards.chauffeursActifs);
        assertEquals(5, resp.cards.vehiculesTotal);
        assertEquals(3, resp.cards.vehiculesEnService);
        assertEquals(1, resp.cards.vehiculesEnMaintenance);
        assertEquals(1, resp.cards.vehiculesHorsService);
        assertEquals(3, resp.cards.missionsEnCours);
        assertEquals(2, resp.cards.missionsTerminees);
        assertEquals(1, resp.cards.missionsALheure);
        assertEquals(2, resp.cards.missionsEnRetard);
        assertEquals(1, resp.cards.congesEnAttente);
        assertEquals(1, resp.cards.congesApprouves);
        assertEquals(1, resp.cards.congesRefuses);
        assertEquals(4, resp.cards.reclamationsOuvertes);
        assertEquals(1, resp.cards.reclamationsResolues);
        assertEquals(6, resp.cards.reclamationsTotal);
        assertEquals(1, resp.cards.administrateurs);
        assertEquals(1, resp.cards.managers);
        assertEquals(1, resp.cards.chauffeurs);

        assertNotNull(resp.punctualityLast12Months);
        assertEquals(12, resp.punctualityLast12Months.size());
        assertEquals(5, resp.incidentsThisMonth.size());
        assertEquals("Accidents", resp.incidentsThisMonth.get(0).category);
        assertEquals(1, resp.incidentsThisMonth.get(0).count);

        assertEquals(3, resp.fuelOverview.vehiclesTracked);
        assertEquals(2, resp.fuelOverview.lowFuelAlerts);
        assertEquals(45.0, resp.fuelOverview.averageLPer100km);
        assertEquals(23.0, resp.fuelOverview.deltaToTarget);

        assertEquals(5, resp.capacityDistribution.size());
        assertTrue(resp.capacityDistribution.stream()
            .anyMatch(e -> e.vehicleType.equals("Poids lourd - Renault Camion")));
        assertTrue(resp.capacityDistribution.stream()
            .anyMatch(e -> e.vehicleType.equals("Van - Ford Transit")));
        assertTrue(resp.capacityDistribution.stream()
            .anyMatch(e -> e.vehicleType.equals("Petit véhicule - Modèle inconnu")));

        assertEquals(3, resp.topDrivers.size());
        assertEquals(3, resp.usersBreakdown.size());
        assertEquals(3, resp.reclamationsStats.size());
        assertEquals(3, resp.congesStats.size());
    }

    @Test
    void getOverview_allPeriods_coversSwitchCases() {
        stubTrajetList(List.of());
        stubRows(List.of());
        stubLongQueue(3L);
        when(vehiculeRepository.findAll()).thenReturn(List.of());
        when(chauffeurRepository.findAll()).thenReturn(List.of());
        when(utilisateurRepository.findAll()).thenReturn(List.of());
        when(reclamationRepository.findAll()).thenReturn(List.of());
        when(congeRepository.findAll()).thenReturn(List.of());

        for (String period : new String[]{"Jour", "Semaine", "Trimestre", "Année", "Mois", "Autre", null}) {
            KpiOverviewResponse resp = service().getOverview(null, period, null);
            assertNotNull(resp);
            assertEquals(12, resp.punctualityLast12Months.size());
            assertEquals(5, resp.incidentsThisMonth.size());
            assertEquals(0, resp.incidentsThisMonth.get(0).count);
            assertEquals(0, resp.fuelOverview.vehiclesTracked);
            assertNull(resp.fuelOverview.averageLPer100km);
            assertEquals(3, resp.capacityDistribution.size());
            assertTrue(resp.topDrivers.isEmpty());
        }
    }

    @Test
    void getOverview_chauffeurFilter() {
        Chauffeur ch10 = chauffeur(10L, StatutChauffeur.EN_SERVICE, LocalDateTime.now().minusMonths(12));
        Chauffeur ch20 = chauffeur(20L, StatutChauffeur.LIBRE, null);
        Trajet tripOnTime = trip(1L, LocalDateTime.now().minusHours(1), LocalDateTime.now().minusMinutes(20),
            LocalDateTime.now().minusMinutes(15), 180, 40.0, 6000.0);
        stubTrajetList(List.of(tripOnTime));

        Vehicule vCh = vehicule(1L, StatutVehicule.EN_SERVICE, 8.0, null, null, null, ch10, "Mercedes", "Actros");
        Vehicule vOther = vehicule(2L, StatutVehicule.EN_SERVICE, 4.0, null, null, null, null, "M", "O");
        when(vehiculeRepository.findAll()).thenReturn(List.of(vCh, vOther));
        when(chauffeurRepository.findAll()).thenReturn(List.of(ch10, ch20));
        stubFindChauffeur(List.of(ch10, ch20));
        when(utilisateurRepository.findAll()).thenReturn(List.of(
            Utilisateur.builder().id(10L).role(Role.CHAUFFEUR).estActif(StatutCompte.ACTIF).build(),
            Utilisateur.builder().id(20L).role(Role.CHAUFFEUR).estActif(StatutCompte.ACTIF).build()));
        when(reclamationRepository.findAll()).thenReturn(List.of(
            reclamation(1L, "accident", "description", StatutReclamation.EN_COURS, LocalDateTime.now(), ch10),
            reclamation(2L, "autre", "autre", StatutReclamation.EN_COURS, LocalDateTime.now(), null)));
        when(congeRepository.findAll()).thenReturn(List.of(
            conge(1L, StatutConge.EN_ATTENTE, LocalDateTime.now(), ch10),
            conge(2L, StatutConge.APPROUVE, LocalDateTime.now(), null)));

        stubRows(java.util.Collections.singletonList(new Object[]{10L, 2L}));
        stubLongQueue(2L, 1L, 3L, 60L);

        KpiOverviewResponse resp = service().getOverview(null, "Semaine", 10L);

        assertEquals(1, resp.cards.chauffeursTotal);
        assertEquals(1, resp.cards.vehiculesTotal);
        assertEquals(2, resp.cards.missionsEnCours);
        assertEquals(1, resp.cards.missionsTerminees);
        assertEquals(1, resp.cards.reclamationsTotal);
        assertEquals(1, resp.cards.congesEnAttente);
        assertEquals(1, resp.topDrivers.size());
        assertEquals(10L, resp.topDrivers.get(0).chauffeurId);
        assertEquals(1, resp.capacityDistribution.size());
    }

    @Test
    void getOverview_entrepriseFilter_emptyVehicles() {
        Chauffeur ch10 = chauffeur(10L, StatutChauffeur.EN_SERVICE, null);
        ch10.setEntreprise(entreprise(1L));
        Trajet tripOk = trip(1L, LocalDateTime.now().minusHours(1), LocalDateTime.now().minusMinutes(20),
            LocalDateTime.now().minusMinutes(10), 180, 30.0, 3000.0);
        stubTrajetList(List.of(tripOk));

        when(vehiculeRepository.findAll()).thenReturn(List.of(
            vehicule(1L, StatutVehicule.EN_SERVICE, 8.0, null, null, entreprise(2L), null, "A", "B"),
            vehicule(2L, StatutVehicule.EN_SERVICE, 3.0, null, null, null, null, "C", "D")));
        when(chauffeurRepository.findAll()).thenReturn(List.of(ch10));
        stubFindChauffeur(List.of(ch10));
        when(utilisateurRepository.findAll()).thenReturn(List.of(
            Utilisateur.builder().id(1L).role(Role.MANAGER).estActif(StatutCompte.ACTIF).entreprise(entreprise(1L)).build(),
            Utilisateur.builder().id(2L).role(Role.MANAGER).estActif(StatutCompte.ACTIF).entreprise(entreprise(2L)).build()));
        when(reclamationRepository.findAll()).thenReturn(List.of(
            reclamation(1L, "panne", "description", StatutReclamation.EN_COURS, LocalDateTime.now(), ch10),
            reclamation(2L, "autre", "autre", StatutReclamation.EN_COURS, LocalDateTime.now(),
                Utilisateur.builder().id(9L).role(Role.CHAUFFEUR).entreprise(entreprise(2L)).build())));
        when(congeRepository.findAll()).thenReturn(List.of(
            conge(1L, StatutConge.APPROUVE, LocalDateTime.now(), ch10),
            conge(2L, StatutConge.REJETE, LocalDateTime.now(), chauffeur(99L, StatutChauffeur.EN_SERVICE, null))));

        stubRows(java.util.Collections.singletonList(new Object[]{10L, 1L}));
        stubLongQueue(2L, 1L, 3L, 25L);

        KpiOverviewResponse resp = service().getOverview(1L, "Trimestre", null);

        assertEquals(1, resp.cards.chauffeursTotal);
        assertEquals(0, resp.cards.vehiculesTotal);
        assertEquals(2, resp.cards.missionsEnCours);
        assertEquals(1, resp.cards.missionsTerminees);
        assertEquals(1, resp.cards.reclamationsTotal);
        assertEquals(1, resp.cards.congesApprouves);
        assertEquals(3, resp.capacityDistribution.size());
        assertEquals(1, resp.topDrivers.size());
    }

    @Test
    void getOverview_tripsWithNullDates_skipsLoops() {
        Trajet tripNulls = Trajet.builder().id(9L).statut(StatutTrajet.EN_COURS).build();
        stubTrajetList(List.of(tripNulls));
        stubRows(List.of());
        stubLongQueue(3L, 2L);

        when(vehiculeRepository.findAll()).thenReturn(List.of(
            vehicule(1L, StatutVehicule.EN_SERVICE, 5.0, null, null, null, null, "M", "N"),
            vehicule(2L, StatutVehicule.EN_MAINTENANCE, 4.0, null, null, null, null, "O", "P"),
            vehicule(3L, StatutVehicule.EN_SERVICE, null, 50.0, 200, null, null, "Q", "R")));
        when(chauffeurRepository.findAll()).thenReturn(List.of(chauffeur(10L, StatutChauffeur.EN_SERVICE, null)));
        when(utilisateurRepository.findAll()).thenReturn(List.of());
        when(reclamationRepository.findAll()).thenReturn(List.of());
        when(congeRepository.findAll()).thenReturn(List.of());

        KpiOverviewResponse resp = service().getOverview(null, "Jour", null);

        assertEquals(0, resp.cards.missionsALheure);
        assertNull(resp.fuelOverview.averageLPer100km);
        assertEquals(1, resp.fuelOverview.vehiclesTracked);
        assertEquals(2, resp.capacityDistribution.size());
        assertTrue(resp.topDrivers.isEmpty());
    }

    @Test
    void getOverview_fuelEstimate_variousVehicles() {
        stubTrajetList(List.of(
            trip(1L, LocalDateTime.now().minusHours(2), LocalDateTime.now().minusMinutes(60),
                LocalDateTime.now().minusMinutes(50), 120, 100.0, 1000.0),
            trip(2L, LocalDateTime.now().minusHours(4), LocalDateTime.now().minusMinutes(150),
                LocalDateTime.now().minusMinutes(120), 150, 100.0, 2000.0)));
        stubRows(List.of());
        stubLongQueue(3L, 2L);

        List<Vehicule> vehs = new ArrayList<>();
        vehs.add(vehicule(1L, StatutVehicule.HORS_SERVICE, null, 50.0, 200, null, null, "A", "1"));
        vehs.add(vehicule(2L, StatutVehicule.HORS_SERVICE, null, 100.0, 200, null, null, "A", "2"));
        vehs.add(vehicule(3L, StatutVehicule.HORS_SERVICE, null, 50.0, null, null, null, "A", "3"));
        vehs.add(vehicule(4L, StatutVehicule.HORS_SERVICE, null, null, null, null, null, "A", "4"));
        vehs.add(vehicule(5L, StatutVehicule.HORS_SERVICE, null, 30.0, 200, null, null, "A", "5"));
        vehs.add(vehicule(6L, StatutVehicule.HORS_SERVICE, null, 5.0, 200, null, null, "A", "6"));
        vehs.add(vehicule(7L, StatutVehicule.HORS_SERVICE, null, 10.0, 200, null, null, "A", "7"));
        vehs.add(vehicule(8L, StatutVehicule.HORS_SERVICE, null, 95.0, 200, null, null, "A", "8"));
        when(vehiculeRepository.findAll()).thenReturn(vehs);
        when(chauffeurRepository.findAll()).thenReturn(List.of());
        when(utilisateurRepository.findAll()).thenReturn(List.of());
        when(reclamationRepository.findAll()).thenReturn(List.of());
        when(congeRepository.findAll()).thenReturn(List.of());

        KpiOverviewResponse resp = service().getOverview(null, "Mois", null);

        assertEquals(7, resp.fuelOverview.vehiclesTracked);
        assertEquals(2, resp.fuelOverview.lowFuelAlerts);
        assertEquals(38.1, resp.fuelOverview.averageLPer100km);
        assertEquals(16.1, resp.fuelOverview.deltaToTarget);
        assertEquals(3, resp.capacityDistribution.size());
    }

    @Test
    void getOverview_topDrivers_badges() {
        stubTrajetList(List.of(
            trip(1L, LocalDateTime.now().minusHours(2), LocalDateTime.now().minusMinutes(60),
                LocalDateTime.now().minusMinutes(50), 120, 50.0, 1000.0)));
        stubRows(List.of(
            new Object[]{10L, 10L}, new Object[]{20L, 10L}, new Object[]{30L, 10L},
            new Object[]{40L, 0L}, new Object[]{50L, 10L}));
        stubLongQueue(3L, 2L, 10L, 60L, 6L, 25L, 3L, 3L, 3L, 3L, 10L, 60L);

        List<Chauffeur> chs = List.of(
            chauffeur(10L, StatutChauffeur.EN_SERVICE, LocalDateTime.now().minusMonths(24)),
            chauffeur(20L, StatutChauffeur.EN_SERVICE, LocalDateTime.now().minusMonths(7)),
            chauffeur(30L, StatutChauffeur.EN_SERVICE, LocalDateTime.now().minusMonths(2)),
            chauffeur(40L, StatutChauffeur.LIBRE, null),
            chauffeur(50L, StatutChauffeur.EN_SERVICE, LocalDateTime.now().minusMonths(24)));
        when(chauffeurRepository.findAll()).thenReturn(chs);
        stubFindChauffeur(chs);
        when(vehiculeRepository.findAll()).thenReturn(List.of());
        when(utilisateurRepository.findAll()).thenReturn(List.of());
        when(reclamationRepository.findAll()).thenReturn(List.of(
            reclamation(1L, "accident", "description", StatutReclamation.EN_COURS, LocalDateTime.now(),
                chauffeur(30L, StatutChauffeur.EN_SERVICE, null))));
        when(congeRepository.findAll()).thenReturn(List.of());

        KpiOverviewResponse resp = service().getOverview(null, "Mois", null);

        Map<Long, String> badges = new java.util.HashMap<>();
        for (TopDriverEntry e : resp.topDrivers) {
            badges.put(e.chauffeurId, e.badge);
        }
        assertEquals("Excellent", badges.get(10L));
        assertEquals("Bon", badges.get(20L));
        assertEquals("Normal", badges.get(30L));
        assertEquals("À améliorer", badges.get(40L));
        assertEquals("Excellent", badges.get(50L));
        assertEquals(5, resp.topDrivers.size());
    }

    @Test
    void getOverview_topDrivers_moreThanTen_truncates() {
        stubTrajetList(List.of(
            trip(1L, LocalDateTime.now().minusHours(2), LocalDateTime.now().minusMinutes(60),
                LocalDateTime.now().minusMinutes(50), 120, 50.0, 1000.0)));
        List<Object[]> rows = new ArrayList<>();
        List<Chauffeur> chs = new ArrayList<>();
        for (long i = 1; i <= 12; i++) {
            rows.add(new Object[]{i, 1L});
            chs.add(chauffeur(i, StatutChauffeur.EN_SERVICE, LocalDateTime.now().minusMonths(1)));
        }
        stubRows(rows);
        when(longQuery.getSingleResult()).thenReturn(1L);
        when(chauffeurRepository.findAll()).thenReturn(chs);
        stubFindChauffeur(chs);
        when(vehiculeRepository.findAll()).thenReturn(List.of());
        when(utilisateurRepository.findAll()).thenReturn(List.of());
        when(reclamationRepository.findAll()).thenReturn(List.of());
        when(congeRepository.findAll()).thenReturn(List.of());

        KpiOverviewResponse resp = service().getOverview(null, "Mois", null);

        assertEquals(10, resp.topDrivers.size());
        assertEquals(1, resp.topDrivers.get(0).rank);
        assertEquals(10, resp.topDrivers.get(9).rank);
    }

    @Test
    void getOverview_nullFilters_defaultMois() {
        stubTrajetList(List.of());
        stubRows(List.of());
        stubLongQueue(1L);
        when(vehiculeRepository.findAll()).thenReturn(List.of());
        when(chauffeurRepository.findAll()).thenReturn(List.of());
        when(utilisateurRepository.findAll()).thenReturn(List.of());
        when(reclamationRepository.findAll()).thenReturn(List.of());
        when(congeRepository.findAll()).thenReturn(List.of());

        KpiOverviewResponse resp = service().getOverview(null, null, null);

        assertNotNull(resp);
        assertEquals(1, resp.cards.missionsEnCours);
    }

    @Test
    void getOverview_chauffeurFilter_emptyVehicles_capacityDefaults() {
        Trajet tripCap = trip(1L, LocalDateTime.now().minusHours(2), LocalDateTime.now().minusMinutes(70),
            LocalDateTime.now().minusMinutes(60), 180, 50.0, 8000.0);
        stubTrajetList(List.of(tripCap));
        stubRows(List.of());
        stubLongQueue(1L, 1L);

        when(vehiculeRepository.findAll()).thenReturn(List.of(
            vehicule(1L, StatutVehicule.EN_SERVICE, 8.0, null, null, null, null, "M", "N")));
        when(chauffeurRepository.findAll()).thenReturn(List.of(chauffeur(10L, StatutChauffeur.EN_SERVICE,
            LocalDateTime.now().minusMonths(24))));
        when(utilisateurRepository.findAll()).thenReturn(List.of());
        when(reclamationRepository.findAll()).thenReturn(List.of());
        when(congeRepository.findAll()).thenReturn(List.of());

        KpiOverviewResponse resp = service().getOverview(null, "Mois", 10L);

        assertNotNull(resp);
        assertEquals(3, resp.capacityDistribution.size());
        CapacityDistributionEntry entry = resp.capacityDistribution.stream()
            .filter(e -> e.vehicleType.equals("Poids lourd"))
            .findFirst().orElseThrow();
        assertEquals(100.0, entry.avgPercent);
        assertEquals(8.0, entry.avgTons);
        assertEquals(8.0, entry.maxTons);
    }

    @Test
    void getOverview_capacity_activeTripNoCharge_lastTripWithCharge() {
        Trajet tripNoCharge = trip(1L, LocalDateTime.now().minusHours(2), LocalDateTime.now().minusMinutes(70),
            LocalDateTime.now().minusMinutes(60), 180, 50.0, null);
        Trajet tripCharge = trip(2L, LocalDateTime.now().minusHours(3), LocalDateTime.now().minusMinutes(100),
            LocalDateTime.now().minusMinutes(90), 150, 50.0, 8000.0);
        AtomicInteger streamCalls = new AtomicInteger();
        when(trajetQuery.getResultList()).thenReturn(List.of(tripNoCharge, tripCharge));
        when(trajetQuery.getResultStream()).thenAnswer(inv -> {
            if (streamCalls.getAndIncrement() == 0) {
                return Stream.of(tripNoCharge);
            }
            return Stream.of(tripCharge);
        });
        stubRows(List.of());
        stubLongQueue(2L, 1L);

        when(vehiculeRepository.findAll()).thenReturn(List.of(
            vehicule(1L, StatutVehicule.EN_SERVICE, 8.0, null, null, null, null, "M", "N")));
        when(chauffeurRepository.findAll()).thenReturn(List.of());
        when(utilisateurRepository.findAll()).thenReturn(List.of());
        when(reclamationRepository.findAll()).thenReturn(List.of());
        when(congeRepository.findAll()).thenReturn(List.of());

        KpiOverviewResponse resp = service().getOverview(null, "Mois", null);

        assertNotNull(resp);
        assertTrue(resp.capacityDistribution.stream().anyMatch(e ->
            e.vehicleType.equals("Poids lourd - M N") && e.avgTons == 8.0 && e.avgPercent == 100.0));
    }

    @Test
    void getOverview_chauffeurFilter_nullFields_filteredOut() {
        Chauffeur ch10 = chauffeur(10L, StatutChauffeur.EN_SERVICE, LocalDateTime.now().minusMonths(12));
        Vehicule vNullChauff = vehicule(1L, StatutVehicule.EN_SERVICE, 5.0, null, null, null, null, "A", "B");
        Vehicule vMatch = vehicule(2L, StatutVehicule.EN_SERVICE, 5.0, null, null, null, ch10, "C", "D");
        when(vehiculeRepository.findAll()).thenReturn(List.of(vNullChauff, vMatch));
        when(chauffeurRepository.findAll()).thenReturn(List.of(ch10));
        lenient().when(chauffeurRepository.findById(any())).thenAnswer(inv -> {
            Long id = inv.getArgument(0);
            return List.of(ch10).stream().filter(c -> c.getId().equals(id)).findFirst();
        });
        when(utilisateurRepository.findAll()).thenReturn(List.of(
            Utilisateur.builder().id(10L).role(Role.CHAUFFEUR).estActif(StatutCompte.ACTIF).build()));
        when(reclamationRepository.findAll()).thenReturn(List.of(
            reclamation(1L, "acc", "desc", StatutReclamation.EN_COURS, LocalDateTime.now(), null)));
        when(congeRepository.findAll()).thenReturn(List.of(
            conge(1L, StatutConge.APPROUVE, LocalDateTime.now(), null)));
        stubTrajetList(List.of());
        stubRows(List.of());
        stubLongQueue(0L);

        KpiOverviewResponse resp = service().getOverview(null, "Mois", 10L);

        assertEquals(1, resp.cards.vehiculesTotal);
        assertEquals(0, resp.cards.reclamationsTotal);
        assertEquals(0, resp.cards.congesApprouves);
    }

    @Test
    void getOverview_entrepriseFilter_nullFields_filteredOut() {
        Entreprise ent1 = entreprise(1L);
        Chauffeur ch10 = chauffeur(10L, StatutChauffeur.EN_SERVICE, LocalDateTime.now().minusMonths(12));
        ch10.setEntreprise(ent1);
        when(vehiculeRepository.findAll()).thenReturn(List.of(
            vehicule(1L, StatutVehicule.EN_SERVICE, 5.0, null, null, null, null, "A", "B")));
        when(chauffeurRepository.findAll()).thenReturn(List.of(ch10));
        lenient().when(chauffeurRepository.findById(any())).thenAnswer(inv -> {
            Long id = inv.getArgument(0);
            return List.of(ch10).stream().filter(c -> c.getId().equals(id)).findFirst();
        });
        when(utilisateurRepository.findAll()).thenReturn(List.of(
            Utilisateur.builder().id(10L).role(Role.CHAUFFEUR).estActif(StatutCompte.ACTIF).entreprise(null).build()));
        when(reclamationRepository.findAll()).thenReturn(List.of(
            reclamation(1L, "autre", "autre", StatutReclamation.EN_COURS, LocalDateTime.now(),
                Utilisateur.builder().id(50L).role(Role.CHAUFFEUR).entreprise(null).build()),
            reclamation(2L, "autre", "autre", StatutReclamation.EN_COURS, LocalDateTime.now(),
                Utilisateur.builder().id(51L).role(Role.CHAUFFEUR).entreprise(ent1).build())));
        when(congeRepository.findAll()).thenReturn(List.of(
            conge(1L, StatutConge.APPROUVE, LocalDateTime.now(), null)));
        stubTrajetList(List.of());
        stubRows(List.of());
        stubLongQueue(0L);

        KpiOverviewResponse resp = service().getOverview(1L, "Mois", null);

        assertEquals(0, resp.cards.vehiculesTotal);
        assertEquals(1, resp.cards.chauffeursTotal);
        assertEquals(1, resp.cards.reclamationsTotal);
        assertEquals(0, resp.cards.congesApprouves);
    }

    @Test
    void getOverview_entrepriseFilter_congesNullChauffeurAndNullEntreprise() {
        Entreprise ent1 = entreprise(1L);
        Chauffeur chWithEnt = chauffeur(10L, StatutChauffeur.EN_SERVICE, LocalDateTime.now().minusMonths(12));
        chWithEnt.setEntreprise(ent1);
        Chauffeur chNoEnt = chauffeur(11L, StatutChauffeur.EN_SERVICE, LocalDateTime.now().minusMonths(12));
        chNoEnt.setEntreprise(null);
        when(vehiculeRepository.findAll()).thenReturn(List.of(
            vehicule(1L, StatutVehicule.EN_SERVICE, 5.0, null, null, ent1, chWithEnt, "A", "B")));
        when(chauffeurRepository.findAll()).thenReturn(List.of(chWithEnt, chNoEnt));
        lenient().when(chauffeurRepository.findById(any())).thenAnswer(inv -> {
            Long id = inv.getArgument(0);
            return List.of(chWithEnt, chNoEnt).stream().filter(c -> c.getId().equals(id)).findFirst();
        });
        when(utilisateurRepository.findAll()).thenReturn(List.of(
            Utilisateur.builder().id(10L).role(Role.CHAUFFEUR).estActif(StatutCompte.ACTIF).entreprise(ent1).build()));
        when(reclamationRepository.findAll()).thenReturn(List.of());
        when(congeRepository.findAll()).thenReturn(List.of(
            conge(1L, StatutConge.APPROUVE, LocalDateTime.now(), null),
            conge(2L, StatutConge.APPROUVE, LocalDateTime.now(), chWithEnt)));
        stubTrajetList(List.of());
        stubRows(List.of());
        stubLongQueue(0L);

        KpiOverviewResponse resp = service().getOverview(1L, "Mois", null);

        assertEquals(1, resp.cards.congesApprouves);
    }

    @Test
    void getOverview_periodCongeNullDateCreation_filteredOut() {
        when(vehiculeRepository.findAll()).thenReturn(List.of());
        when(chauffeurRepository.findAll()).thenReturn(List.of());
        when(utilisateurRepository.findAll()).thenReturn(List.of());
        when(reclamationRepository.findAll()).thenReturn(List.of());
        when(congeRepository.findAll()).thenReturn(List.of(
            conge(1L, StatutConge.APPROUVE, null, null)));
        stubTrajetList(List.of());
        stubRows(List.of());
        stubLongQueue(0L);

        KpiOverviewResponse resp = service().getOverview(null, "Mois", null);

        assertEquals(0, resp.cards.congesApprouves);
    }

    @Test
    void getOverview_fuelEstimate_nanDelta() {
        when(vehiculeRepository.findAll()).thenReturn(List.of(
            vehicule(1L, StatutVehicule.EN_SERVICE, 5.0, 100.0, 200, null, null, "A", "B")));
        when(chauffeurRepository.findAll()).thenReturn(List.of());
        when(utilisateurRepository.findAll()).thenReturn(List.of());
        when(reclamationRepository.findAll()).thenReturn(List.of());
        when(congeRepository.findAll()).thenReturn(List.of());
        stubTrajetList(List.of());
        stubRows(List.of());
        stubLongQueue(0L);

        KpiOverviewResponse resp = service().getOverview(null, "Mois", null);

        assertNotNull(resp.fuelOverview);
        assertTrue(Double.isNaN(resp.fuelOverview.deltaToTarget));
    }

    @Test
    void getOverview_capacity_activeTripChargeAndLastTripBothNullCharge() {
        Trajet tripNoCharge = trip(1L, LocalDateTime.now().minusHours(2), LocalDateTime.now().minusMinutes(70),
            LocalDateTime.now().minusMinutes(60), 180, 50.0, null);
        AtomicInteger streamIdx = new AtomicInteger();
        when(trajetQuery.getResultList()).thenReturn(List.of(tripNoCharge));
        lenient().when(trajetQuery.getResultStream()).thenAnswer(inv -> {
            int idx = streamIdx.getAndIncrement();
            if (idx == 0) return Stream.of(tripNoCharge);
            return Stream.empty();
        });
        stubRows(List.of());
        stubLongQueue(0L);

        when(vehiculeRepository.findAll()).thenReturn(List.of(
            vehicule(1L, StatutVehicule.EN_SERVICE, 8.0, null, null, null, null, "M", "N")));
        when(chauffeurRepository.findAll()).thenReturn(List.of());
        when(utilisateurRepository.findAll()).thenReturn(List.of());
        when(reclamationRepository.findAll()).thenReturn(List.of());
        when(congeRepository.findAll()).thenReturn(List.of());

        KpiOverviewResponse resp = service().getOverview(null, "Mois", null);

        assertNotNull(resp);
    }

    @Test
    void getOverview_incidents_nullUtilisateurAndNullEntreprise() {
        Chauffeur ch10 = chauffeur(10L, StatutChauffeur.EN_SERVICE, LocalDateTime.now().minusMonths(12));
        when(vehiculeRepository.findAll()).thenReturn(List.of());
        when(chauffeurRepository.findAll()).thenReturn(List.of(ch10));
        when(utilisateurRepository.findAll()).thenReturn(List.of(
            Utilisateur.builder().id(10L).role(Role.CHAUFFEUR).estActif(StatutCompte.ACTIF).build()));
        when(reclamationRepository.findAll()).thenReturn(List.of(
            reclamation(1L, "accident", "desc", StatutReclamation.EN_COURS, LocalDateTime.now(), null)));
        when(congeRepository.findAll()).thenReturn(List.of());
        stubTrajetList(List.of());
        stubRows(List.of());
        stubLongQueue(0L);

        KpiOverviewResponse resp = service().getOverview(1L, "Mois", null);

        assertNotNull(resp.incidentsThisMonth);
    }

    @Test
    void getOverview_incidents_withEntrepriseFilter_nullUserAndNullUserEntreprise() {
        Entreprise ent1 = entreprise(1L);
        when(vehiculeRepository.findAll()).thenReturn(List.of());
        when(chauffeurRepository.findAll()).thenReturn(List.of());
        when(utilisateurRepository.findAll()).thenReturn(List.of());
        when(reclamationRepository.findAll()).thenReturn(List.of(
            reclamation(1L, "test", "test", StatutReclamation.EN_COURS, LocalDateTime.now(), null),
            reclamation(2L, "test", "test", StatutReclamation.EN_COURS, LocalDateTime.now(),
                Utilisateur.builder().id(50L).role(Role.CHAUFFEUR).entreprise(null).build())));
        when(congeRepository.findAll()).thenReturn(List.of());
        stubTrajetList(List.of());
        stubRows(List.of());
        stubLongQueue(0L);

        KpiOverviewResponse resp = service().getOverview(1L, "Mois", null);

        assertNotNull(resp.incidentsThisMonth);
    }

    @Test
    void getOverview_fuelEstimate_nullDistanceKmAndFuelUsedPctZero() {
        Trajet tripNoDist = trip(1L, LocalDateTime.now().minusHours(2), LocalDateTime.now().minusMinutes(60),
            LocalDateTime.now().minusMinutes(50), 120, null, 1000.0);
        when(trajetQuery.getResultList()).thenReturn(List.of(tripNoDist));
        lenient().when(trajetQuery.getResultStream()).thenReturn(Stream.of(tripNoDist));
        stubRows(List.of());
        stubLongQueue(0L);

        when(vehiculeRepository.findAll()).thenReturn(List.of(
            vehicule(1L, StatutVehicule.EN_SERVICE, 5.0, 100.0, 200, null, null, "A", "B")));
        when(chauffeurRepository.findAll()).thenReturn(List.of());
        when(utilisateurRepository.findAll()).thenReturn(List.of());
        when(reclamationRepository.findAll()).thenReturn(List.of());
        when(congeRepository.findAll()).thenReturn(List.of());

        KpiOverviewResponse resp = service().getOverview(null, "Mois", null);

        assertNotNull(resp.fuelOverview);
    }

    @Test
    void getOverview_topDrivers_nullChauffeurIdInRowAndChauffeurNotFound() {
        Chauffeur ch10 = chauffeur(10L, StatutChauffeur.EN_SERVICE, LocalDateTime.now().minusMonths(12));
        when(vehiculeRepository.findAll()).thenReturn(List.of());
        when(chauffeurRepository.findAll()).thenReturn(List.of(ch10));
        stubFindChauffeur(List.of(ch10));
        when(utilisateurRepository.findAll()).thenReturn(List.of());
        when(reclamationRepository.findAll()).thenReturn(List.of());
        when(congeRepository.findAll()).thenReturn(List.of());
        stubTrajetList(List.of());
        stubRows(new java.util.ArrayList<>(java.util.Arrays.asList(new Object[]{null, 3L}, new Object[]{99L, 2L})));
        stubLongQueue(3L, 3L, 3L, 60L, 3L, 60L);

        KpiOverviewResponse resp = service().getOverview(null, "Mois", null);

        assertNotNull(resp.topDrivers);
    }

    @Test
    void getOverview_topDrivers_totalTripsMoreThan50() {
        Chauffeur ch10 = chauffeur(10L, StatutChauffeur.EN_SERVICE, LocalDateTime.now().minusMonths(24));
        when(vehiculeRepository.findAll()).thenReturn(List.of());
        when(chauffeurRepository.findAll()).thenReturn(List.of(ch10));
        stubFindChauffeur(List.of(ch10));
        when(utilisateurRepository.findAll()).thenReturn(List.of());
        when(reclamationRepository.findAll()).thenReturn(List.of());
        when(congeRepository.findAll()).thenReturn(List.of());
        stubTrajetList(List.of());
        stubRows(java.util.Collections.singletonList(new Object[]{10L, 5L}));
        stubLongQueue(50L, 3L, 60L);

        KpiOverviewResponse resp = service().getOverview(null, "Mois", null);

        assertEquals(1, resp.topDrivers.size());
    }

    @Test
    void getOverview_topDrivers_zeroMissions() {
        when(vehiculeRepository.findAll()).thenReturn(List.of());
        when(chauffeurRepository.findAll()).thenReturn(List.of());
        when(utilisateurRepository.findAll()).thenReturn(List.of());
        when(reclamationRepository.findAll()).thenReturn(List.of());
        when(congeRepository.findAll()).thenReturn(List.of());
        stubTrajetList(List.of());
        stubRows(java.util.Collections.singletonList(new Object[]{10L, 0L}));
        stubLongQueue(0L, 0L, 0L, 0L);

        KpiOverviewResponse resp = service().getOverview(null, "Mois", null);

        assertEquals(1, resp.topDrivers.size());
        assertEquals(0, resp.topDrivers.get(0).missionsCompleted);
    }

    @Test
    void getOverview_reclamationsStats_nullStatut_filteredOut() {
        when(vehiculeRepository.findAll()).thenReturn(List.of());
        when(chauffeurRepository.findAll()).thenReturn(List.of());
        when(utilisateurRepository.findAll()).thenReturn(List.of());
        when(reclamationRepository.findAll()).thenReturn(List.of(
            reclamation(1L, "test", "test", null, LocalDateTime.now(), null),
            reclamation(2L, "test", "test", StatutReclamation.EN_COURS, LocalDateTime.now(), null)));
        when(congeRepository.findAll()).thenReturn(List.of());
        stubTrajetList(List.of());
        stubRows(List.of());
        stubLongQueue(0L);

        KpiOverviewResponse resp = service().getOverview(null, "Mois", null);

        assertEquals(1, resp.reclamationsStats.size());
    }

    @Test
    void getOverview_punctuality_completedTripsWithNullDatesAndOnTime() {
        Trajet tripOnTime = trip(1L, LocalDateTime.now().minusHours(2), LocalDateTime.now().minusMinutes(20),
            LocalDateTime.now().minusMinutes(15), 180, 50.0, 1000.0);
        Trajet tripNullArrivee = trip(2L, LocalDateTime.now().minusHours(2), null,
            LocalDateTime.now().minusMinutes(15), 180, 50.0, 1000.0);
        Trajet tripNullReelle = trip(3L, LocalDateTime.now().minusHours(2), LocalDateTime.now().minusMinutes(20),
            null, 180, 50.0, 1000.0);
        stubTrajetList(List.of(tripOnTime, tripNullArrivee, tripNullReelle));
        stubRows(List.of());
        stubLongQueue(0L, 0L);

        when(vehiculeRepository.findAll()).thenReturn(List.of());
        when(chauffeurRepository.findAll()).thenReturn(List.of());
        when(utilisateurRepository.findAll()).thenReturn(List.of());
        when(reclamationRepository.findAll()).thenReturn(List.of());
        when(congeRepository.findAll()).thenReturn(List.of());

        KpiOverviewResponse resp = service().getOverview(null, "Mois", null);

        assertNotNull(resp.punctualityLast12Months);
        assertEquals(12, resp.punctualityLast12Months.size());
    }

    @Test
    void getOverview_punctuality_lateTripsBothCategories() {
        Trajet tripLateLess30 = trip(1L, LocalDateTime.now().minusHours(2),
            LocalDateTime.now().minusMinutes(20).plusMinutes(10),
            LocalDateTime.now().minusMinutes(10), 180, 50.0, 1000.0);
        Trajet tripLateMore30 = trip(2L, LocalDateTime.now().minusHours(5),
            LocalDateTime.now().minusMinutes(120).plusMinutes(40),
            LocalDateTime.now().minusMinutes(80), 180, 50.0, 1000.0);
        stubTrajetList(List.of(tripLateLess30, tripLateMore30));
        stubRows(List.of());
        stubLongQueue(0L, 0L);

        when(vehiculeRepository.findAll()).thenReturn(List.of());
        when(chauffeurRepository.findAll()).thenReturn(List.of());
        when(utilisateurRepository.findAll()).thenReturn(List.of());
        when(reclamationRepository.findAll()).thenReturn(List.of());
        when(congeRepository.findAll()).thenReturn(List.of());

        KpiOverviewResponse resp = service().getOverview(null, "Mois", null);

        assertNotNull(resp.punctualityLast12Months);
    }

    @Test
    void getOverview_classifyReclamation_subjectAndDescriptionMatch() {
        Chauffeur ch10 = chauffeur(10L, StatutChauffeur.EN_SERVICE, LocalDateTime.now().minusMonths(12));
        when(vehiculeRepository.findAll()).thenReturn(List.of());
        when(chauffeurRepository.findAll()).thenReturn(List.of(ch10));
        when(utilisateurRepository.findAll()).thenReturn(List.of());
        when(reclamationRepository.findAll()).thenReturn(List.of(
            reclamation(1L, "Panne moteur", "Dépannage urgent", StatutReclamation.EN_COURS, LocalDateTime.now(), ch10),
            reclamation(2L, "Accident grave", "Accident sur l'autoroute", StatutReclamation.EN_COURS, LocalDateTime.now(), ch10),
            reclamation(3L, "Embouteillage total", "Traffic congestion", StatutReclamation.EN_COURS, LocalDateTime.now(), ch10),
            reclamation(4L, "Contrôle technique", "Controle routier", StatutReclamation.EN_COURS, LocalDateTime.now(), ch10)));
        when(congeRepository.findAll()).thenReturn(List.of());
        stubTrajetList(List.of());
        stubRows(List.of());
        stubLongQueue(0L);

        KpiOverviewResponse resp = service().getOverview(null, "Mois", null);

        assertEquals(4, resp.incidentsThisMonth.stream().mapToLong(e -> e.count).sum());
    }

    @Test
    void getOverview_buildCapacityForType_nullEntrepriseIdAndNullCap() {
        when(vehiculeRepository.findAll()).thenReturn(List.of(
            vehicule(1L, StatutVehicule.EN_SERVICE, null, null, null, null, null, "A", "B")));
        when(chauffeurRepository.findAll()).thenReturn(List.of());
        when(utilisateurRepository.findAll()).thenReturn(List.of());
        when(reclamationRepository.findAll()).thenReturn(List.of());
        when(congeRepository.findAll()).thenReturn(List.of());
        stubTrajetList(List.of());
        stubRows(List.of());
        stubLongQueue(0L);

        KpiOverviewResponse resp = service().getOverview(null, "Mois", null);

        assertEquals(3, resp.capacityDistribution.size());
    }

    @Test
    void getOverview_buildCapacityForType_vehicleWithNullChargeKgAndCapZero() {
        AtomicInteger streamIdx = new AtomicInteger();
        when(trajetQuery.getResultList()).thenReturn(List.of());
        lenient().when(trajetQuery.getResultStream()).thenAnswer(inv -> Stream.empty());
        stubRows(List.of());
        stubLongQueue(0L);

        when(vehiculeRepository.findAll()).thenReturn(List.of(
            vehicule(1L, StatutVehicule.EN_SERVICE, 8.0, null, null, null, null, "A", "B")));
        when(chauffeurRepository.findAll()).thenReturn(List.of());
        when(utilisateurRepository.findAll()).thenReturn(List.of());
        when(reclamationRepository.findAll()).thenReturn(List.of());
        when(congeRepository.findAll()).thenReturn(List.of());

        KpiOverviewResponse resp = service().getOverview(null, "Mois", null);

        assertNotNull(resp.capacityDistribution);
    }

    @Test
    void estimateFuelConsumption_branches() throws Exception {
        AdminKpiServiceImpl s = service();
        Method m = AdminKpiServiceImpl.class.getDeclaredMethod("estimateFuelConsumption", List.class);
        m.setAccessible(true);

        Vehicule v1 = vehicule(1L, StatutVehicule.EN_SERVICE, 8.0, 50.0, 1000, null, null, "A", "B");
        Trajet t1 = trip(1L, LocalDateTime.now().minusHours(2), LocalDateTime.now().minusMinutes(10), LocalDateTime.now(), 60, 100.0, 1000.0);
        Trajet t2 = trip(2L, LocalDateTime.now().minusHours(4), LocalDateTime.now().minusMinutes(20), LocalDateTime.now(), 60, 100.0, 1000.0);

        when(em.createQuery(anyString(), eq(Trajet.class))).thenReturn(trajetQuery);
        when(trajetQuery.setParameter(anyString(), any())).thenReturn(trajetQuery);
        when(trajetQuery.setMaxResults(anyInt())).thenReturn(trajetQuery);
        when(trajetQuery.getResultList()).thenReturn(List.of(t1, t2));

        Double avgFuel = (Double) m.invoke(s, List.of(v1));
        assertNotNull(avgFuel);
    }

    @Test
    void buildTopDrivers_entrepriseFilterAndChauffeurFilter() {
        Chauffeur ch = chauffeur(10L, StatutChauffeur.EN_SERVICE, LocalDateTime.now().minusMonths(20));
        ch.setPrenom(null);
        ch.setNom("Solo");
        when(chauffeurRepository.findById(10L)).thenReturn(Optional.of(ch));

        when(vehiculeRepository.findAll()).thenReturn(List.of());
        when(chauffeurRepository.findAll()).thenReturn(List.of(ch));
        when(utilisateurRepository.findAll()).thenReturn(List.of());
        when(reclamationRepository.findAll()).thenReturn(List.of());
        when(congeRepository.findAll()).thenReturn(List.of());

        stubTrajetList(List.of());
        stubRows(List.<Object[]>of(new Object[]{10L, 55L}));

        when(longQuery.getSingleResult()).thenReturn(10L, 60L);
        when(trajetQuery.getResultList()).thenReturn(List.of());

        KpiOverviewResponse respEnt = service().getOverview(1L, "Mois", null);
        assertNotNull(respEnt.topDrivers);

        KpiOverviewResponse respCh = service().getOverview(null, "Mois", 10L);
        assertNotNull(respCh.topDrivers);
    }
}


