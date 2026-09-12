package com.logiway.entities;

import com.logiway.entities.enums.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Tests unitaires complets — couverture Method/Branch/Line ~99-100%
 */
@DisplayName("Entités JPA — Tests Unitaires (couverture maximale)")
class EntitiesTest {

    // ══════════════════════════════════════════════════════════════════════
    // Conge
    // ══════════════════════════════════════════════════════════════════════
    @Nested @DisplayName("Conge")
    class CongeTests {

        @Test @DisplayName("computePeriode → 6 jours (1→6 août)")
        void sixDays() {
            Conge c = Conge.builder()
                .dateDebut(LocalDate.of(2026,8,1)).dateFin(LocalDate.of(2026,8,6))
                .type(TypeConge.VACANCES).statut(StatutConge.EN_ATTENTE).build();
            c.computePeriode();
            assertThat(c.getPeriode()).isEqualTo(6);
        }

        @Test @DisplayName("computePeriode → 1 jour (même date)")
        void oneDay() {
            Conge c = Conge.builder()
                .dateDebut(LocalDate.of(2026,8,10)).dateFin(LocalDate.of(2026,8,10))
                .type(TypeConge.MALADIE).statut(StatutConge.APPROUVE).build();
            c.computePeriode();
            assertThat(c.getPeriode()).isEqualTo(1);
        }

        @Test @DisplayName("computePeriode → dateFin < dateDebut → periode null")
        void dateFin_before_dateDebut() {
            Conge c = Conge.builder()
                .dateDebut(LocalDate.of(2026,8,10)).dateFin(LocalDate.of(2026,8,5))
                .type(TypeConge.VACANCES).statut(StatutConge.EN_ATTENTE).build();
            c.computePeriode();
            assertThat(c.getPeriode()).isNull();
        }

        @Test @DisplayName("computePeriode → dates null → rien calculé")
        void nullDates() {
            Conge c = Conge.builder().type(TypeConge.MARIAGE).statut(StatutConge.EN_ATTENTE).build();
            c.computePeriode();
            assertThat(c.getPeriode()).isNull();
        }

        @Test @DisplayName("computePeriode → dateCreation initialisée si null")
        void dateCreation_setWhenNull() {
            Conge c = Conge.builder()
                .dateDebut(LocalDate.of(2026,8,1)).dateFin(LocalDate.of(2026,8,5))
                .type(TypeConge.VACANCES).statut(StatutConge.EN_ATTENTE).build();
            c.computePeriode();
            assertThat(c.getDateCreation()).isNotNull();
            assertThat(c.getDateMiseAJour()).isNotNull();
        }

        @Test @DisplayName("computePeriode → dateCreation conservée (branche else)")
        void dateCreation_preserved() {
            LocalDateTime orig = LocalDateTime.of(2026,1,1,0,0);
            Conge c = Conge.builder()
                .dateDebut(LocalDate.of(2026,8,1)).dateFin(LocalDate.of(2026,8,3))
                .type(TypeConge.MALADIE).statut(StatutConge.EN_ATTENTE).dateCreation(orig).build();
            c.computePeriode();
            assertThat(c.getDateCreation()).isEqualTo(orig);
        }

        @Test @DisplayName("setters → motif, commentaire, calendarEventId, relations")
        void setters_allFields() {
            Conge c = new Conge();
            c.setId(10L);
            c.setMotif("Vacances été");
            c.setCommentaireValidation("Approuvé");
            c.setCalendarEventId("cal-123");
            c.setChauffeur(new Chauffeur());
            c.setManager(new Manager());
            assertThat(c.getId()).isEqualTo(10L);
            assertThat(c.getMotif()).isEqualTo("Vacances été");
            assertThat(c.getCommentaireValidation()).isEqualTo("Approuvé");
            assertThat(c.getCalendarEventId()).isEqualTo("cal-123");
            assertThat(c.getChauffeur()).isNotNull();
            assertThat(c.getManager()).isNotNull();
        }

        @Test @DisplayName("StatutConge → toutes les valeurs")
        void statutCongeValues() {
            assertThat(StatutConge.values()).containsExactlyInAnyOrder(
                StatutConge.EN_ATTENTE, StatutConge.APPROUVE, StatutConge.REJETE, StatutConge.ANNULE);
        }

        @Test @DisplayName("TypeConge → toutes les valeurs")
        void typeCongeValues() {
            assertThat(TypeConge.values()).containsExactlyInAnyOrder(
                TypeConge.MALADIE, TypeConge.MARIAGE, TypeConge.VACANCES);
        }

        @Test @DisplayName("computePeriode → dateDebut null mais dateFin non null → branche && court-circuit")
        void dateDebut_null_dateFin_present() {
            Conge c = Conge.builder()
                .dateFin(LocalDate.of(2026,8,5))
                .type(TypeConge.VACANCES).statut(StatutConge.EN_ATTENTE).build();
            c.computePeriode();
            // dateDebut null → condition court-circuitée → periode reste null
            assertThat(c.getPeriode()).isNull();
        }

        @Test @DisplayName("computePeriode → dateDebut non null mais dateFin null → 2e branche && court-circuit")
        void dateDebut_present_dateFin_null() {
            Conge c = Conge.builder()
                .dateDebut(LocalDate.of(2026,8,1))
                .type(TypeConge.VACANCES).statut(StatutConge.EN_ATTENTE).build();
            c.computePeriode();
            // dateFin null → 2ème && court-circuité → periode reste null
            assertThat(c.getPeriode()).isNull();
        }
    }

    // ══════════════════════════════════════════════════════════════════════
    // Utilisateur
    // ══════════════════════════════════════════════════════════════════════
    @Nested @DisplayName("Utilisateur")
    class UtilisateurTests {

        @Test @DisplayName("onCreate → dateCreation initialisée si null")
        void dateCreation_setWhenNull() {
            Utilisateur u = Utilisateur.builder().keycloakId("kc-1").email("a@b.fr")
                .passwordHash("h").role(Role.CHAUFFEUR).estActif(StatutCompte.ACTIF).build();
            u.onCreate();
            assertThat(u.getDateCreation()).isNotNull();
        }

        @Test @DisplayName("onCreate → dateCreation conservée (branche else)")
        void dateCreation_preserved() {
            LocalDateTime orig = LocalDateTime.of(2025,1,1,0,0);
            Utilisateur u = Utilisateur.builder().keycloakId("kc-2").email("b@c.fr")
                .passwordHash("h").role(Role.MANAGER).estActif(StatutCompte.ACTIF)
                .dateCreation(orig).build();
            u.onCreate();
            assertThat(u.getDateCreation()).isEqualTo(orig);
        }

        @Test @DisplayName("onCreate → emailVerifie initialisé à FALSE si null")
        void emailVerifie_setFalse() {
            Utilisateur u = Utilisateur.builder().keycloakId("kc-3").email("c@d.fr")
                .passwordHash("h").role(Role.CHAUFFEUR).estActif(StatutCompte.ACTIF).build();
            u.onCreate();
            assertThat(u.getEmailVerifie()).isFalse();
        }

        @Test @DisplayName("onCreate → emailVerifie conservé si TRUE (branche else)")
        void emailVerifie_preserved() {
            Utilisateur u = Utilisateur.builder().keycloakId("kc-4").email("d@e.fr")
                .passwordHash("h").role(Role.MANAGER).estActif(StatutCompte.ACTIF)
                .emailVerifie(Boolean.TRUE).build();
            u.onCreate();
            assertThat(u.getEmailVerifie()).isTrue();
        }

        @Test @DisplayName("collections → initialisées vides par défaut")
        void collectionsEmpty() {
            Utilisateur u = new Utilisateur();
            assertThat(u.getReclamations()).isNotNull().isEmpty();
            assertThat(u.getNotifications()).isNotNull().isEmpty();
        }

        @Test @DisplayName("setters → tous les champs texte")
        void setters_allTextFields() {
            Utilisateur u = new Utilisateur();
            u.setPrenom("Jean");
            u.setNom("Dupont");
            u.setTelephone("0600000000");
            u.setPays("France");
            u.setImage("base64img");
            u.setRejectionReason("Raison");
            u.setVerificationToken("tok-abc");
            u.setEntreprise(new Entreprise());
            u.setCreatedBy(new Utilisateur());
            assertThat(u.getPrenom()).isEqualTo("Jean");
            assertThat(u.getNom()).isEqualTo("Dupont");
            assertThat(u.getTelephone()).isEqualTo("0600000000");
            assertThat(u.getPays()).isEqualTo("France");
            assertThat(u.getImage()).isEqualTo("base64img");
            assertThat(u.getRejectionReason()).isEqualTo("Raison");
            assertThat(u.getVerificationToken()).isEqualTo("tok-abc");
            assertThat(u.getEntreprise()).isNotNull();
            assertThat(u.getCreatedBy()).isNotNull();
        }

        @Test @DisplayName("reclamations/notifications → ajout possible")
        void addToCollections() {
            Utilisateur u = new Utilisateur();
            u.getReclamations().add(new Reclamation());
            u.getNotifications().add(new Notification());
            assertThat(u.getReclamations()).hasSize(1);
            assertThat(u.getNotifications()).hasSize(1);
        }

        @Test @DisplayName("@Builder.Default branches — reclamations/notifications passées explicitement")
        void builderDefault_explicitCollections() {
            // Force la branche "$default$field != null" pour reclamations et notifications
            java.util.Set<Reclamation> recs = new java.util.HashSet<>();
            recs.add(new Reclamation());
            java.util.Set<Notification> notifs = new java.util.HashSet<>();
            notifs.add(new Notification());
            Utilisateur u = Utilisateur.builder()
                .keycloakId("kc-test").email("test@test.fr")
                .passwordHash("h").role(Role.CHAUFFEUR).estActif(StatutCompte.ACTIF)
                .reclamations(recs).notifications(notifs).build();
            assertThat(u.getReclamations()).hasSize(1);
            assertThat(u.getNotifications()).hasSize(1);
        }
    }

    // ══════════════════════════════════════════════════════════════════════
    // Vehicule
    // ══════════════════════════════════════════════════════════════════════
    @Nested @DisplayName("Vehicule")
    class VehiculeTests {

        @Test @DisplayName("onCreate → statut null → EN_SERVICE")
        void onCreate_nullStatut() {
            Vehicule v = new Vehicule();
            v.setStatut(null);
            v.onCreate();
            assertThat(v.getStatut()).isEqualTo(StatutVehicule.EN_SERVICE);
        }

        @Test @DisplayName("onCreate → statut non null → conservé (branche else)")
        void onCreate_nonNullStatut() {
            Vehicule v = Vehicule.builder().matricule("AB").statut(StatutVehicule.EN_MAINTENANCE).build();
            v.onCreate();
            assertThat(v.getStatut()).isEqualTo(StatutVehicule.EN_MAINTENANCE);
        }

        @Test @DisplayName("@Builder.Default → statut EN_SERVICE")
        void builderDefault() {
            assertThat(Vehicule.builder().matricule("XY").build().getStatut())
                .isEqualTo(StatutVehicule.EN_SERVICE);
        }

        @Test @DisplayName("trajets → collection vide par défaut")
        void trajetsEmpty() {
            assertThat(Vehicule.builder().matricule("ZZ").build().getTrajets()).isEmpty();
        }

        @Test @DisplayName("setters → tous les champs techniques")
        void setters_allFields() {
            Vehicule v = new Vehicule();
            v.setId(1L);
            v.setMarque("Renault");
            v.setModele("Master");
            v.setCapacite(3000.0);
            v.setLatitudeActuelle(48.85);
            v.setLongitudeActuelle(2.35);
            v.setVitesseActuelle(90.0);
            v.setNiveauCarburant(75.0);
            v.setCapaciteCharge(1500.0);
            v.setCouleur("Blanc");
            v.setKilometrage(50000);
            v.setDernierePositionMaj(LocalDateTime.now());
            v.setEntreprise(new Entreprise());
            v.setChauffeurActuel(new Chauffeur());
            assertThat(v.getMarque()).isEqualTo("Renault");
            assertThat(v.getModele()).isEqualTo("Master");
            assertThat(v.getCapacite()).isEqualTo(3000.0);
            assertThat(v.getLatitudeActuelle()).isEqualTo(48.85);
            assertThat(v.getNiveauCarburant()).isEqualTo(75.0);
            assertThat(v.getCouleur()).isEqualTo("Blanc");
            assertThat(v.getKilometrage()).isEqualTo(50000);
            assertThat(v.getEntreprise()).isNotNull();
            assertThat(v.getChauffeurActuel()).isNotNull();
        }

        @Test @DisplayName("trajets → ajout possible")
        void addTrajet() {
            Vehicule v = Vehicule.builder().matricule("V1").build();
            v.getTrajets().add(new Trajet());
            assertThat(v.getTrajets()).hasSize(1);
        }

        @Test @DisplayName("@Builder.Default branches — trajets passé explicitement via builder")
        void builderDefault_explicitCollections() {
            // Force la branche "$default$field != null" pour trajets
            java.util.Set<Trajet> trjts = new java.util.HashSet<>();
            trjts.add(new Trajet());
            Vehicule v = Vehicule.builder()
                .matricule("V2").trajets(trjts).build();
            assertThat(v.getTrajets()).hasSize(1);
        }
    }

    // ══════════════════════════════════════════════════════════════════════
    // Entreprise
    // ══════════════════════════════════════════════════════════════════════
    @Nested @DisplayName("Entreprise")
    class EntrepriseTests {

        @Test @DisplayName("onCreate → dateCreation initialisée si null")
        void dateCreation_setWhenNull() {
            Entreprise e = Entreprise.builder().nomEntreprise("Test SA").build();
            e.onCreate();
            assertThat(e.getDateCreation()).isNotNull();
        }

        @Test @DisplayName("onCreate → dateCreation conservée (branche else)")
        void dateCreation_preserved() {
            LocalDateTime orig = LocalDateTime.of(2024,6,1,0,0);
            Entreprise e = Entreprise.builder().nomEntreprise("SA").dateCreation(orig).build();
            e.onCreate();
            assertThat(e.getDateCreation()).isEqualTo(orig);
        }

        @Test @DisplayName("onCreate → statut null → ACTIF")
        void statut_setActif() {
            Entreprise e = new Entreprise();
            e.setStatut(null);
            e.onCreate();
            assertThat(e.getStatut()).isEqualTo(StatutEntreprise.ACTIF);
        }

        @Test @DisplayName("onCreate → statut conservé (branche else)")
        void statut_preserved() {
            Entreprise e = Entreprise.builder().nomEntreprise("SA").statut(StatutEntreprise.SUSPENDU).build();
            e.onCreate();
            assertThat(e.getStatut()).isEqualTo(StatutEntreprise.SUSPENDU);
        }

        @Test @DisplayName("collections → vides par défaut")
        void collectionsEmpty() {
            Entreprise e = Entreprise.builder().nomEntreprise("E1").build();
            assertThat(e.getUtilisateurs()).isEmpty();
            assertThat(e.getVehicules()).isEmpty();
        }

        @Test @DisplayName("setters → tous les champs texte")
        void setters_allFields() {
            Entreprise e = new Entreprise();
            e.setId(5L);
            e.setNomEntreprise("LogiSA");
            e.setEmailEntreprise("contact@logisa.fr");
            e.setAdresseEntreprise("1 rue test");
            e.setNumeroEntreprise("0600000000");
            e.setCodeTVA("FR12345678");
            e.setRepresentantLegal("M. Test");
            e.setDocumentJustificatif("docBase64");
            e.setImage("imgBase64");
            e.setSecteurActivite("Transport");
            e.setTailleFlotte(20);
            e.setProprietaire(new Manager());
            assertThat(e.getNomEntreprise()).isEqualTo("LogiSA");
            assertThat(e.getEmailEntreprise()).isEqualTo("contact@logisa.fr");
            assertThat(e.getCodeTVA()).isEqualTo("FR12345678");
            assertThat(e.getSecteurActivite()).isEqualTo("Transport");
            assertThat(e.getTailleFlotte()).isEqualTo(20);
            assertThat(e.getProprietaire()).isNotNull();
        }

        @Test @DisplayName("utilisateurs/vehicules → ajout possible")
        void addToCollections() {
            Entreprise e = Entreprise.builder().nomEntreprise("E2").build();
            e.getUtilisateurs().add(new Utilisateur());
            e.getVehicules().add(new Vehicule());
            assertThat(e.getUtilisateurs()).hasSize(1);
            assertThat(e.getVehicules()).hasSize(1);
        }

        @Test @DisplayName("@Builder.Default branches — collections passées explicitement via builder")
        void builderDefault_explicitCollections() {
            // Force la branche "$default$field != null" pour utilisateurs et vehicules
            java.util.Set<Utilisateur> users = new java.util.HashSet<>();
            users.add(new Utilisateur());
            java.util.Set<Vehicule> vehs = new java.util.HashSet<>();
            vehs.add(new Vehicule());
            Entreprise e = Entreprise.builder()
                .nomEntreprise("E3")
                .utilisateurs(users)
                .vehicules(vehs)
                .statut(StatutEntreprise.EN_ATTENTE)
                .build();
            assertThat(e.getUtilisateurs()).hasSize(1);
            assertThat(e.getVehicules()).hasSize(1);
            assertThat(e.getStatut()).isEqualTo(StatutEntreprise.EN_ATTENTE);
        }
    }

    // ══════════════════════════════════════════════════════════════════════
    // Secteur
    // ══════════════════════════════════════════════════════════════════════
    @Nested @DisplayName("Secteur")
    class SecteurTests {

        @Test @DisplayName("builder → champs assignés")
        void builder() {
            Secteur s = Secteur.builder().id(1L).nom("Nord").zoneGeographique("Paris").build();
            assertThat(s.getNom()).isEqualTo("Nord");
            assertThat(s.getId()).isEqualTo(1L);
        }

        @Test @DisplayName("managers/chauffeurs → vides par défaut")
        void collectionsEmpty() {
            Secteur s = Secteur.builder().nom("S1").zoneGeographique("Lyon").build();
            assertThat(s.getManagers()).isEmpty();
            assertThat(s.getChauffeurs()).isEmpty();
        }

        @Test @DisplayName("setters → tous les champs")
        void setters_allFields() {
            Secteur s = new Secteur();
            s.setId(2L);
            s.setNom("Sud");
            s.setDescription("Zone sud de France");
            s.setZoneGeographique("Marseille");
            s.setCodesPostaux("13000,13001");
            s.setEntreprise(new Entreprise());
            assertThat(s.getNom()).isEqualTo("Sud");
            assertThat(s.getDescription()).isEqualTo("Zone sud de France");
            assertThat(s.getCodesPostaux()).isEqualTo("13000,13001");
            assertThat(s.getEntreprise()).isNotNull();
        }

        @Test @DisplayName("managers → ajout possible")
        void addManager() {
            Secteur s = Secteur.builder().nom("S2").zoneGeographique("Lyon").build();
            s.getManagers().add(new Manager());
            assertThat(s.getManagers()).hasSize(1);
        }

        @Test @DisplayName("chauffeurs → ajout possible")
        void addChauffeur() {
            Secteur s = Secteur.builder().nom("S3").zoneGeographique("Toulouse").build();
            s.getChauffeurs().add(new Chauffeur());
            assertThat(s.getChauffeurs()).hasSize(1);
        }

        @Test @DisplayName("@Builder.Default branches — collections passées explicitement via builder")
        void builderDefault_explicitCollections() {
            // Force la branche "$default$field != null" pour managers et chauffeurs
            java.util.Set<Manager> mgrs = new java.util.HashSet<>();
            mgrs.add(new Manager());
            java.util.Set<Chauffeur> chfrs = new java.util.HashSet<>();
            chfrs.add(new Chauffeur());
            Secteur s = Secteur.builder()
                .nom("S4").zoneGeographique("Nice")
                .managers(mgrs).chauffeurs(chfrs).build();
            assertThat(s.getManagers()).hasSize(1);
            assertThat(s.getChauffeurs()).hasSize(1);
        }
    }

    // ══════════════════════════════════════════════════════════════════════
    // Manager
    // ══════════════════════════════════════════════════════════════════════
    @Nested @DisplayName("Manager")
    class ManagerTests {

        @Test @DisplayName("constructeur vide → collections initialisées")
        void emptyConstructor() {
            Manager m = new Manager();
            assertThat(m.getChauffeurs()).isEmpty();
            assertThat(m.getTrajets()).isEmpty();
            assertThat(m.getConges()).isEmpty();
        }

        @Test @DisplayName("SuperBuilder → héritage + secteur")
        void superBuilder() {
            Secteur s = Secteur.builder().nom("N").zoneGeographique("P").build();
            Manager m = Manager.builder().id(1L).prenom("Marc").keycloakId("kc")
                .email("m@t.fr").passwordHash("h").role(Role.MANAGER)
                .estActif(StatutCompte.ACTIF).secteur(s).build();
            assertThat(m.getRole()).isEqualTo(Role.MANAGER);
            assertThat(m.getSecteur().getNom()).isEqualTo("N");
        }

        @Test @DisplayName("onCreate hérité → dateCreation initialisée")
        void onCreate_inherited() {
            Manager m = Manager.builder().keycloakId("kc-m").email("mg@t.fr")
                .passwordHash("h").role(Role.MANAGER).estActif(StatutCompte.ACTIF).build();
            m.onCreate();
            assertThat(m.getDateCreation()).isNotNull();
            assertThat(m.getEmailVerifie()).isFalse();
        }

        @Test @DisplayName("chauffeurs → ajout (branche non-vide)")
        void addChauffeur() {
            Manager m = new Manager();
            m.getChauffeurs().add(new Chauffeur());
            assertThat(m.getChauffeurs()).hasSize(1);
        }

        @Test @DisplayName("conges → ajout")
        void addConge() {
            Manager m = new Manager();
            m.getConges().add(Conge.builder().type(TypeConge.VACANCES).statut(StatutConge.EN_ATTENTE).build());
            assertThat(m.getConges()).hasSize(1);
        }

        @Test @DisplayName("trajets → ajout")
        void addTrajet() {
            Manager m = new Manager();
            m.getTrajets().add(new Trajet());
            assertThat(m.getTrajets()).hasSize(1);
        }

        @Test @DisplayName("@Builder.Default branches — collections passées explicitement via builder")
        void builderDefault_explicitCollections() {
            // Force les branches "$default$field != null" pour chauffeurs, trajets, conges
            java.util.Set<Chauffeur> chfrs = new java.util.HashSet<>();
            chfrs.add(new Chauffeur());
            java.util.Set<Trajet> trjts = new java.util.HashSet<>();
            trjts.add(new Trajet());
            java.util.Set<Conge> congs = new java.util.HashSet<>();
            congs.add(new Conge());
            Manager m = Manager.builder()
                .keycloakId("kc-m2").email("m2@t.fr").passwordHash("h")
                .role(Role.MANAGER).estActif(StatutCompte.ACTIF)
                .chauffeurs(chfrs).trajets(trjts).conges(congs).build();
            assertThat(m.getChauffeurs()).hasSize(1);
            assertThat(m.getTrajets()).hasSize(1);
            assertThat(m.getConges()).hasSize(1);
        }

        @Test @DisplayName("AllArgsConstructor — setters pour couvrir la branche restante")
        void allArgs_viaSetters() {
            Manager m = new Manager();
            Secteur s = Secteur.builder().nom("N").zoneGeographique("P").build();
            m.setSecteur(s);
            assertThat(m.getSecteur().getNom()).isEqualTo("N");
        }
    }

    // ══════════════════════════════════════════════════════════════════════
    // Chauffeur
    // ══════════════════════════════════════════════════════════════════════
    @Nested @DisplayName("Chauffeur")
    class ChauffeurTests {

        @Test @DisplayName("constructeur vide → collections initialisées")
        void emptyConstructor() {
            Chauffeur c = new Chauffeur();
            assertThat(c.getTrajets()).isEmpty();
            assertThat(c.getConges()).isEmpty();
        }

        @Test @DisplayName("SuperBuilder → statut + manager + secteur")
        void superBuilder() {
            Manager mgr = new Manager();
            Secteur sec = Secteur.builder().nom("Nord").zoneGeographique("Paris").build();
            Chauffeur c = Chauffeur.builder()
                .id(1L).prenom("Jean").nom("Dupont")
                .keycloakId("kc-chauffeur").email("jean@test.fr")
                .passwordHash("hash").role(Role.CHAUFFEUR).estActif(StatutCompte.ACTIF)
                .statutConducteur(StatutChauffeur.LIBRE)
                .manager(mgr).secteur(sec).build();
            assertThat(c.getStatutConducteur()).isEqualTo(StatutChauffeur.LIBRE);
            assertThat(c.getRole()).isEqualTo(Role.CHAUFFEUR);
            assertThat(c.getSecteur().getNom()).isEqualTo("Nord");
        }

        @Test @DisplayName("onCreate hérité → dateCreation et emailVerifie initialisés")
        void onCreate_inherited() {
            Chauffeur c = Chauffeur.builder().keycloakId("kc-c").email("c@t.fr")
                .passwordHash("h").role(Role.CHAUFFEUR).estActif(StatutCompte.ACTIF)
                .statutConducteur(StatutChauffeur.LIBRE).build();
            c.onCreate();
            assertThat(c.getDateCreation()).isNotNull();
            assertThat(c.getEmailVerifie()).isFalse();
        }

        @Test @DisplayName("setters → statut conducteur")
        void setters() {
            Chauffeur c = new Chauffeur();
            c.setStatutConducteur(StatutChauffeur.EN_SERVICE);
            assertThat(c.getStatutConducteur()).isEqualTo(StatutChauffeur.EN_SERVICE);
        }

        @Test @DisplayName("trajets/conges → ajout possible")
        void addTrajetConge() {
            Chauffeur c = new Chauffeur();
            c.getTrajets().add(new Trajet());
            c.getConges().add(new Conge());
            assertThat(c.getTrajets()).hasSize(1);
            assertThat(c.getConges()).hasSize(1);
        }

        @Test @DisplayName("vehiculeActuel → assignable")
        void vehiculeActuel() {
            Chauffeur c = new Chauffeur();
            Vehicule v = Vehicule.builder().matricule("AB-1").build();
            c.setVehiculeActuel(v);
            assertThat(c.getVehiculeActuel().getMatricule()).isEqualTo("AB-1");
        }

        @Test @DisplayName("@Builder.Default branches — collections passées explicitement via builder")
        void builderDefault_explicitCollections() {
            // Force les branches "$default$field != null" pour trajets et conges
            java.util.Set<Trajet> trjts = new java.util.HashSet<>();
            trjts.add(new Trajet());
            java.util.Set<Conge> congs = new java.util.HashSet<>();
            congs.add(new Conge());
            Chauffeur c = Chauffeur.builder()
                .keycloakId("kc-c2").email("c2@t.fr").passwordHash("h")
                .role(Role.CHAUFFEUR).estActif(StatutCompte.ACTIF)
                .statutConducteur(StatutChauffeur.LIBRE)
                .trajets(trjts).conges(congs).build();
            assertThat(c.getTrajets()).hasSize(1);
            assertThat(c.getConges()).hasSize(1);
        }

        @Test @DisplayName("AllArgsConstructor — setters pour couvrir la branche restante")
        void allArgs_viaSetters() {
            Chauffeur c = new Chauffeur();
            c.setStatutConducteur(StatutChauffeur.LIBRE);
            c.setManager(new Manager());
            c.setSecteur(new Secteur());
            assertThat(c.getStatutConducteur()).isEqualTo(StatutChauffeur.LIBRE);
            assertThat(c.getManager()).isNotNull();
        }

        @Test @DisplayName("getManager → lecture après assignation")
        void getManager_afterSet() {
            Chauffeur c = new Chauffeur();
            Manager m = Manager.builder().keycloakId("km").email("m@t.fr")
                .passwordHash("h").role(Role.MANAGER).estActif(StatutCompte.ACTIF).build();
            c.setManager(m);
            assertThat(c.getManager().getEmail()).isEqualTo("m@t.fr");
        }
    }

    // ══════════════════════════════════════════════════════════════════════
    // Trajet
    // ══════════════════════════════════════════════════════════════════════
    @Nested @DisplayName("Trajet")
    class TrajetTests {

        @Test @DisplayName("builder → tous les champs assignés")
        void builder() {
            LocalDateTime now = LocalDateTime.now();
            Trajet t = Trajet.builder()
                .id(1L).pointDepart("Paris").destination("Lyon")
                .latitudeDepart(48.85).longitudeDepart(2.35)
                .latitudeArrivee(45.76).longitudeArrivee(4.83)
                .distanceKm(465.0).dureeEstimeeMinutes(300)
                .chargeKg(1500.0).priorite(PrioriteTrajet.NORMALE)
                .notes("Livraison urgente").dateDepart(now)
                .statut(StatutTrajet.ACTIF).typeOptimisation("shortest")
                .build();
            assertThat(t.getPointDepart()).isEqualTo("Paris");
            assertThat(t.getDestination()).isEqualTo("Lyon");
            assertThat(t.getPriorite()).isEqualTo(PrioriteTrajet.NORMALE);
            assertThat(t.getStatut()).isEqualTo(StatutTrajet.ACTIF);
        }

        @Test @DisplayName("constructeur vide → pas d'exception")
        void emptyConstructor() {
            Trajet t = new Trajet();
            assertThat(t.getId()).isNull();
        }

        @Test @DisplayName("setters → statut et distance")
        void setters_basic() {
            Trajet t = new Trajet();
            t.setStatut(StatutTrajet.EN_COURS);
            t.setDistanceKm(200.0);
            assertThat(t.getStatut()).isEqualTo(StatutTrajet.EN_COURS);
            assertThat(t.getDistanceKm()).isEqualTo(200.0);
        }

        @Test @DisplayName("setters → tous les champs restants")
        void setters_allFields() {
            LocalDateTime now = LocalDateTime.now();
            Trajet t = new Trajet();
            t.setDateArrivee(now);
            t.setDateArriveeReelle(now);
            t.setGeometrieItineraire("{\"type\":\"LineString\"}");
            t.setChargeKg(500.0);
            t.setNotes("Note test");
            t.setTypeOptimisation("fastest");
            t.setDureeEstimeeMinutes(120);
            t.setLatitudeDepart(48.0);
            t.setLongitudeDepart(2.0);
            t.setLatitudeArrivee(45.0);
            t.setLongitudeArrivee(4.0);
            assertThat(t.getDateArrivee()).isEqualTo(now);
            assertThat(t.getGeometrieItineraire()).contains("LineString");
            assertThat(t.getChargeKg()).isEqualTo(500.0);
            assertThat(t.getNotes()).isEqualTo("Note test");
            assertThat(t.getTypeOptimisation()).isEqualTo("fastest");
        }

        @Test @DisplayName("assignation chauffeur/vehicule/manager")
        void assignRelations() {
            Trajet t = new Trajet();
            t.setChauffeur(new Chauffeur());
            t.setVehicule(new Vehicule());
            t.setManager(new Manager());
            assertThat(t.getChauffeur()).isNotNull();
            assertThat(t.getVehicule()).isNotNull();
            assertThat(t.getManager()).isNotNull();
        }
    }

    // ══════════════════════════════════════════════════════════════════════
    // Reclamation
    // ══════════════════════════════════════════════════════════════════════
    @Nested @DisplayName("Reclamation")
    class ReclamationTests {

        @Test @DisplayName("onCreate → dateCreation initialisée si null")
        void dateCreation_setWhenNull() {
            Reclamation r = Reclamation.builder()
                .sujet("Problème").priorite(PrioriteReclamation.URGENT)
                .statut(StatutReclamation.EN_COURS).build();
            r.onCreate();
            assertThat(r.getDateCreation()).isNotNull();
        }

        @Test @DisplayName("onCreate → dateCreation conservée (branche else)")
        void dateCreation_preserved() {
            LocalDateTime orig = LocalDateTime.of(2026,1,1,9,0);
            Reclamation r = Reclamation.builder()
                .sujet("S").priorite(PrioriteReclamation.NORMAL)
                .statut(StatutReclamation.EN_COURS).dateCreation(orig).build();
            r.onCreate();
            assertThat(r.getDateCreation()).isEqualTo(orig);
        }

        @Test @DisplayName("onUpdate → dateMiseAJour renseignée")
        void onUpdate_setsDateMiseAJour() {
            Reclamation r = Reclamation.builder()
                .sujet("S").priorite(PrioriteReclamation.URGENT)
                .statut(StatutReclamation.EN_COURS).build();
            r.onUpdate();
            assertThat(r.getDateMiseAJour()).isNotNull();
        }

        @Test @DisplayName("builder → tous les champs assignés")
        void builder() {
            Reclamation r = Reclamation.builder()
                .id(1L).sujet("Camion en panne").description("Description")
                .priorite(PrioriteReclamation.URGENT).statut(StatutReclamation.EN_COURS)
                .commentaireResolution("Réparé").build();
            assertThat(r.getSujet()).isEqualTo("Camion en panne");
            assertThat(r.getPriorite()).isEqualTo(PrioriteReclamation.URGENT);
            assertThat(r.getCommentaireResolution()).isEqualTo("Réparé");
        }

        @Test @DisplayName("constructeur vide → pas d'exception")
        void emptyConstructor() {
            assertThat(new Reclamation().getId()).isNull();
        }

        @Test @DisplayName("setters → tous les champs")
        void setters_allFields() {
            Reclamation r = new Reclamation();
            LocalDateTime now = LocalDateTime.now();
            r.setId(2L);
            r.setSujet("Sujet test");
            r.setDescription("Description test");
            r.setStatut(StatutReclamation.RESOLU);
            r.setPriorite(PrioriteReclamation.NORMAL);
            r.setDateMiseAJour(now);
            r.setUtilisateur(new Utilisateur());
            r.setCommentaireResolution("Résolu");
            assertThat(r.getSujet()).isEqualTo("Sujet test");
            assertThat(r.getStatut()).isEqualTo(StatutReclamation.RESOLU);
            assertThat(r.getUtilisateur()).isNotNull();
        }
    }

    // ══════════════════════════════════════════════════════════════════════
    // Notification
    // ══════════════════════════════════════════════════════════════════════
    @Nested @DisplayName("Notification")
    class NotificationTests {

        @Test @DisplayName("onCreate → dateCreation et estLu initialisés si null")
        void onCreate_setsDefaults() {
            Notification n = Notification.builder().type(TypeNotif.NOTIF_TRAJET).build();
            n.onCreate();
            assertThat(n.getDateCreation()).isNotNull();
            assertThat(n.getEstLu()).isFalse();
        }

        @Test @DisplayName("onCreate → dateCreation conservée (branche else)")
        void dateCreation_preserved() {
            LocalDateTime orig = LocalDateTime.of(2026,1,1,0,0);
            Notification n = Notification.builder()
                .type(TypeNotif.NOTIF_CONGE).dateCreation(orig).build();
            n.onCreate();
            assertThat(n.getDateCreation()).isEqualTo(orig);
        }

        @Test @DisplayName("onCreate → estLu conservé si TRUE (branche else)")
        void estLu_preserved() {
            Notification n = Notification.builder()
                .type(TypeNotif.NOTIF_MESSAGE).estLu(Boolean.TRUE).build();
            n.onCreate();
            assertThat(n.getEstLu()).isTrue();
        }

        @Test @DisplayName("builder → message et type assignés")
        void builder() {
            Notification n = Notification.builder()
                .id(1L).type(TypeNotif.NOTIF_VEHICULE).message("Véhicule assigné").estLu(false).build();
            assertThat(n.getMessage()).isEqualTo("Véhicule assigné");
            assertThat(n.getType()).isEqualTo(TypeNotif.NOTIF_VEHICULE);
        }

        @Test @DisplayName("constructeur vide + setters")
        void emptyConstructorAndSetters() {
            Notification n = new Notification();
            n.setType(TypeNotif.SECTEUR);
            n.setEstLu(true);
            n.setId(5L);
            n.setMessage("Test notif");
            n.setUtilisateur(new Utilisateur());
            n.setDateCreation(LocalDateTime.now());
            assertThat(n.getType()).isEqualTo(TypeNotif.SECTEUR);
            assertThat(n.getEstLu()).isTrue();
            assertThat(n.getMessage()).isEqualTo("Test notif");
            assertThat(n.getUtilisateur()).isNotNull();
        }
    }

    // ══════════════════════════════════════════════════════════════════════
    // MessengerMessage
    // ══════════════════════════════════════════════════════════════════════
    @Nested @DisplayName("MessengerMessage")
    class MessengerMessageTests {

        @Test @DisplayName("onCreate → tous les champs par défaut si null")
        void onCreate_allDefaults() {
            MessengerMessage m = MessengerMessage.builder()
                .expediteurId(1L).destinataireId(2L)
                .type(MessengerMessageType.TEXTE).build();
            m.onCreate();
            assertThat(m.getDateEnvoi()).isNotNull();
            assertThat(m.getStatut()).isEqualTo(MessengerMessageStatus.NON_LU);
            assertThat(m.getConnecte()).isTrue();
            assertThat(m.getDerniereActivite()).isNotNull();
            assertThat(m.getModifie()).isFalse();
            assertThat(m.getSupprime()).isFalse();
        }

        @Test @DisplayName("onCreate → dateEnvoi conservée (branche else)")
        void dateEnvoi_preserved() {
            LocalDateTime orig = LocalDateTime.of(2026,8,1,10,0);
            MessengerMessage m = MessengerMessage.builder()
                .expediteurId(1L).destinataireId(2L)
                .type(MessengerMessageType.TEXTE).dateEnvoi(orig).build();
            m.onCreate();
            assertThat(m.getDateEnvoi()).isEqualTo(orig);
        }

        @Test @DisplayName("onCreate → statut conservé (branche else)")
        void statut_preserved() {
            MessengerMessage m = MessengerMessage.builder()
                .expediteurId(1L).destinataireId(2L)
                .type(MessengerMessageType.TEXTE).statut(MessengerMessageStatus.LU).build();
            m.onCreate();
            assertThat(m.getStatut()).isEqualTo(MessengerMessageStatus.LU);
        }

        @Test @DisplayName("onCreate → connecte conservé si FALSE (branche else)")
        void connecte_preserved() {
            MessengerMessage m = MessengerMessage.builder()
                .expediteurId(1L).destinataireId(2L)
                .type(MessengerMessageType.TEXTE).connecte(Boolean.FALSE).build();
            m.onCreate();
            assertThat(m.getConnecte()).isFalse();
        }

        @Test @DisplayName("onCreate → derniereActivite conservée (branche else)")
        void derniereActivite_preserved() {
            LocalDateTime orig = LocalDateTime.of(2026,8,1,9,0);
            MessengerMessage m = MessengerMessage.builder()
                .expediteurId(1L).destinataireId(2L)
                .type(MessengerMessageType.TEXTE).derniereActivite(orig).build();
            m.onCreate();
            assertThat(m.getDerniereActivite()).isEqualTo(orig);
        }

        @Test @DisplayName("onCreate → modifie conservé si TRUE (branche else)")
        void modifie_preserved() {
            MessengerMessage m = MessengerMessage.builder()
                .expediteurId(1L).destinataireId(2L)
                .type(MessengerMessageType.TEXTE).modifie(Boolean.TRUE).build();
            m.onCreate();
            assertThat(m.getModifie()).isTrue();
        }

        @Test @DisplayName("onCreate → supprime conservé si TRUE (branche else)")
        void supprime_preserved() {
            MessengerMessage m = MessengerMessage.builder()
                .expediteurId(1L).destinataireId(2L)
                .type(MessengerMessageType.TEXTE).supprime(Boolean.TRUE).build();
            m.onCreate();
            assertThat(m.getSupprime()).isTrue();
        }

        @Test @DisplayName("builder → champs fichier/vocal")
        void builderFichierVocal() {
            MessengerMessage m = MessengerMessage.builder()
                .id(1L).expediteurId(1L).destinataireId(2L)
                .type(MessengerMessageType.VOCAL)
                .contenu("audio").cheminFichier("/uploads/audio.ogg")
                .nomFichierOriginal("note.ogg").tailleFichier(5000L).dureeVocale(15)
                .statut(MessengerMessageStatus.NON_LU).build();
            assertThat(m.getDureeVocale()).isEqualTo(15);
            assertThat(m.getTailleFichier()).isEqualTo(5000L);
            assertThat(m.getType()).isEqualTo(MessengerMessageType.VOCAL);
        }

        @Test @DisplayName("setters → champs lecture/modification/suppression")
        void setters_allFields() {
            LocalDateTime now = LocalDateTime.now();
            MessengerMessage m = new MessengerMessage();
            m.setId(1L);
            m.setExpediteurId(10L);
            m.setDestinataireId(20L);
            m.setContenu("Hello");
            m.setType(MessengerMessageType.IMAGE);
            m.setCheminFichier("/img/photo.jpg");
            m.setNomFichierOriginal("photo.jpg");
            m.setTailleFichier(2048L);
            m.setDureeVocale(0);
            m.setStatut(MessengerMessageStatus.LU);
            m.setDateEnvoi(now);
            m.setDateLecture(now);
            m.setModifie(true);
            m.setDateModification(now);
            m.setContenuOriginal("Hello original");
            m.setSupprime(true);
            m.setDateSuppression(now);
            m.setConnecte(false);
            m.setDerniereActivite(now);
            m.setExpediteur(new Utilisateur());
            m.setDestinataire(new Utilisateur());
            assertThat(m.getContenu()).isEqualTo("Hello");
            assertThat(m.getType()).isEqualTo(MessengerMessageType.IMAGE);
            assertThat(m.getStatut()).isEqualTo(MessengerMessageStatus.LU);
            assertThat(m.getModifie()).isTrue();
            assertThat(m.getSupprime()).isTrue();
            assertThat(m.getContenuOriginal()).isEqualTo("Hello original");
            assertThat(m.getExpediteur()).isNotNull();
            assertThat(m.getDestinataire()).isNotNull();
        }
    }

    // ══════════════════════════════════════════════════════════════════════
    // SuperAdministrateur
    // ══════════════════════════════════════════════════════════════════════
    @Nested @DisplayName("SuperAdministrateur")
    class SuperAdministrateurTests {

        @Test @DisplayName("constructeur vide → pas d'exception")
        void emptyConstructor() {
            SuperAdministrateur sa = new SuperAdministrateur();
            assertThat(sa.getId()).isNull();
        }

        @Test @DisplayName("SuperBuilder → héritage Utilisateur")
        void superBuilder() {
            SuperAdministrateur sa = SuperAdministrateur.builder()
                .id(1L).prenom("Admin").nom("Global")
                .keycloakId("kc-admin").email("admin@logiway.fr")
                .passwordHash("hash").role(Role.SUPERADMIN)
                .estActif(StatutCompte.ACTIF).build();
            assertThat(sa.getRole()).isEqualTo(Role.SUPERADMIN);
            assertThat(sa.getPrenom()).isEqualTo("Admin");
        }

        @Test @DisplayName("setters hérités → fonctionnent")
        void setters() {
            SuperAdministrateur sa = new SuperAdministrateur();
            sa.setEmail("super@logiway.fr");
            sa.setRole(Role.SUPERADMIN);
            assertThat(sa.getEmail()).isEqualTo("super@logiway.fr");
            assertThat(sa.getRole()).isEqualTo(Role.SUPERADMIN);
        }

        @Test @DisplayName("onCreate hérité → dateCreation et emailVerifie initialisés")
        void onCreate_inherited() {
            SuperAdministrateur sa = SuperAdministrateur.builder()
                .keycloakId("kc-sa").email("sa@logiway.fr")
                .passwordHash("h").role(Role.SUPERADMIN).estActif(StatutCompte.ACTIF).build();
            sa.onCreate();
            assertThat(sa.getDateCreation()).isNotNull();
            assertThat(sa.getEmailVerifie()).isFalse();
        }
    }

    // ══════════════════════════════════════════════════════════════════════
    // PauseReglementaire
    // ══════════════════════════════════════════════════════════════════════
    @Nested @DisplayName("PauseReglementaire")
    class PauseReglementaireTests {

        @Test @DisplayName("builder → tous les champs assignés")
        void builder() {
            PauseReglementaire p = PauseReglementaire.builder()
                .id(1L).type(TypePause.REST_AREA).statut(StatutPause.PLANIFIEE)
                .latitude(48.85).longitude(2.35)
                .distanceAlongRouteM(1000.0).durationSeconds(1800)
                .nomLieu("Aire de repos").aiScore(75)
                .fatigueScore(60).accessibilityScore(80).contextScore(70)
                .reasoning("Raison IA").confidence(0.85).build();
            assertThat(p.getType()).isEqualTo(TypePause.REST_AREA);
            assertThat(p.getStatut()).isEqualTo(StatutPause.PLANIFIEE);
            assertThat(p.getNomLieu()).isEqualTo("Aire de repos");
            assertThat(p.getAiScore()).isEqualTo(75);
            assertThat(p.getConfidence()).isEqualTo(0.85);
        }

        @Test @DisplayName("constructeur vide → pas d'exception")
        void emptyConstructor() {
            assertThat(new PauseReglementaire().getId()).isNull();
        }

        @Test @DisplayName("setters → tous les champs")
        void setters_allFields() {
            LocalDateTime now = LocalDateTime.now();
            PauseReglementaire p = new PauseReglementaire();
            p.setId(5L);
            p.setType(TypePause.CAFE);
            p.setStatut(StatutPause.ATTEINTE);
            p.setLatitude(43.0);
            p.setLongitude(5.0);
            p.setDistanceAlongRouteM(500.0);
            p.setHeureArriveePlanifiee(now);
            p.setDurationSeconds(900);
            p.setHeureRepriseEstimee(now.plusMinutes(15));
            p.setNomLieu("Café du coin");
            p.setAiScore(90);
            p.setFatigueScore(70);
            p.setAccessibilityScore(85);
            p.setContextScore(80);
            p.setReasoning("Bonne raison");
            p.setConfidence(0.95);
            p.setTrajet(new Trajet());
            assertThat(p.getStatut()).isEqualTo(StatutPause.ATTEINTE);
            assertThat(p.getNomLieu()).isEqualTo("Café du coin");
            assertThat(p.getFatigueScore()).isEqualTo(70);
            assertThat(p.getAccessibilityScore()).isEqualTo(85);
            assertThat(p.getContextScore()).isEqualTo(80);
            assertThat(p.getReasoning()).isEqualTo("Bonne raison");
            assertThat(p.getTrajet()).isNotNull();
        }

        @Test @DisplayName("TypePause → toutes les valeurs")
        void typePauseValues() {
            assertThat(TypePause.values()).containsExactlyInAnyOrder(
                TypePause.WARNING_ALERT, TypePause.MANDATORY_REST, TypePause.STATION_SERVICE,
                TypePause.KIOSK, TypePause.REST_AREA, TypePause.CAFE, TypePause.PARKING, TypePause.POI);
        }

        @Test @DisplayName("StatutPause → PLANIFIEE, ATTEINTE, IGNOREE")
        void statutPauseValues() {
            assertThat(StatutPause.values()).containsExactlyInAnyOrder(
                StatutPause.PLANIFIEE, StatutPause.ATTEINTE, StatutPause.IGNOREE);
        }
    }

    // ══════════════════════════════════════════════════════════════════════
    // PauseAIPrediction
    // ══════════════════════════════════════════════════════════════════════
    @Nested @DisplayName("PauseAIPrediction")
    class PauseAIPredictionTests {

        @Test @DisplayName("builder → tous les champs assignés")
        void builder() {
            PauseAIPrediction p = PauseAIPrediction.builder()
                .id(1L).timestamp(LocalDateTime.of(2026,8,10,10,0))
                .hoursDriving(4.5).distAlongRatio(0.5).score(80)
                .poiType("REST_AREA").alerteDeclenchee(true)
                .typeAlerte(TypeAlerteIA.URGENTE)
                .latitudePoi(48.85).longitudePoi(2.35)
                .nomPoi("Aire").distancePoiM(120.0).build();
            assertThat(p.getScore()).isEqualTo(80);
            assertThat(p.getTypeAlerte()).isEqualTo(TypeAlerteIA.URGENTE);
            assertThat(p.getAlerteDeclenchee()).isTrue();
        }

        @Test @DisplayName("constructeur vide → pas d'exception")
        void emptyConstructor() {
            PauseAIPrediction p = new PauseAIPrediction();
            assertThat(p.getId()).isNull();
        }

        @Test @DisplayName("setters → tous les champs")
        void setters_allFields() {
            LocalDateTime now = LocalDateTime.now();
            PauseAIPrediction p = new PauseAIPrediction();
            p.setId(3L);
            p.setTimestamp(now);
            p.setHoursDriving(2.5);
            p.setDistAlongRatio(0.3);
            p.setScore(65);
            p.setPoiType("PARKING");
            p.setAlerteDeclenchee(false);
            p.setTypeAlerte(TypeAlerteIA.RECOMMANDEE);
            p.setLatitudePoi(43.0);
            p.setLongitudePoi(5.0);
            p.setNomPoi("Parking auto");
            p.setDistancePoiM(250.0);
            p.setTrajet(new Trajet());
            assertThat(p.getId()).isEqualTo(3L);
            assertThat(p.getHoursDriving()).isEqualTo(2.5);
            assertThat(p.getScore()).isEqualTo(65);
            assertThat(p.getPoiType()).isEqualTo("PARKING");
            assertThat(p.getAlerteDeclenchee()).isFalse();
            assertThat(p.getTypeAlerte()).isEqualTo(TypeAlerteIA.RECOMMANDEE);
            assertThat(p.getNomPoi()).isEqualTo("Parking auto");
            assertThat(p.getTrajet()).isNotNull();
        }

        @Test @DisplayName("TypeAlerteIA → AUCUNE, RECOMMANDEE, URGENTE")
        void typeAlerteIAValues() {
            assertThat(TypeAlerteIA.values()).containsExactlyInAnyOrder(
                TypeAlerteIA.AUCUNE, TypeAlerteIA.RECOMMANDEE, TypeAlerteIA.URGENTE);
        }

        @Test @DisplayName("typeAlerte AUCUNE → alerteDeclenchee false")
        void typeAlerteAucune() {
            PauseAIPrediction p = PauseAIPrediction.builder()
                .id(2L).timestamp(LocalDateTime.now())
                .hoursDriving(1.0).distAlongRatio(0.1).score(20)
                .alerteDeclenchee(false).typeAlerte(TypeAlerteIA.AUCUNE).build();
            assertThat(p.getTypeAlerte()).isEqualTo(TypeAlerteIA.AUCUNE);
            assertThat(p.getAlerteDeclenchee()).isFalse();
        }
    }

    // ══════════════════════════════════════════════════════════════════════
    // RefreshToken
    // ══════════════════════════════════════════════════════════════════════
    @Nested @DisplayName("RefreshToken")
    class RefreshTokenTests {

        @Test @DisplayName("isExpired → false si futur")
        void isExpired_false() {
            assertThat(new RefreshToken("t", null, LocalDateTime.now().plusHours(1)).isExpired()).isFalse();
        }

        @Test @DisplayName("isExpired → true si passé")
        void isExpired_true() {
            assertThat(new RefreshToken("t", null, LocalDateTime.now().minusSeconds(1)).isExpired()).isTrue();
        }

        @Test @DisplayName("isValid → true si non révoqué et non expiré")
        void isValid_true() {
            RefreshToken rt = new RefreshToken("t", null, LocalDateTime.now().plusHours(1));
            rt.setRevoked(false);
            assertThat(rt.isValid()).isTrue();
        }

        @Test @DisplayName("isValid → false si révoqué")
        void isValid_false_revoked() {
            RefreshToken rt = new RefreshToken("t", null, LocalDateTime.now().plusHours(1));
            rt.setRevoked(true);
            assertThat(rt.isValid()).isFalse();
        }

        @Test @DisplayName("isValid → false si expiré")
        void isValid_false_expired() {
            RefreshToken rt = new RefreshToken("t", null, LocalDateTime.now().minusMinutes(5));
            rt.setRevoked(false);
            assertThat(rt.isValid()).isFalse();
        }

        @Test @DisplayName("constructeur → revoked = false par défaut")
        void defaultRevoked() {
            assertThat(new RefreshToken("tok", null, LocalDateTime.now().plusHours(1)).getRevoked()).isFalse();
        }

        @Test @DisplayName("constructeur vide → valeurs null/false")
        void emptyConstructor() {
            RefreshToken rt = new RefreshToken();
            assertThat(rt.getToken()).isNull();
            assertThat(rt.getRevoked()).isFalse();
        }

        @Test @DisplayName("onCreate → createdAt initialisé")
        void onCreate_setsCreatedAt() {
            RefreshToken rt = new RefreshToken();
            rt.onCreate();
            assertThat(rt.getCreatedAt()).isNotNull();
        }

        @Test @DisplayName("setters → tous les champs")
        void setters_allFields() {
            LocalDateTime now = LocalDateTime.now();
            RefreshToken rt = new RefreshToken();
            rt.setId(1L);
            rt.setToken("my-token-value");
            rt.setUtilisateur(new Utilisateur());
            rt.setExpiryDate(now.plusHours(2));
            rt.setRevoked(true);
            rt.setCreatedAt(now);
            assertThat(rt.getId()).isEqualTo(1L);
            assertThat(rt.getToken()).isEqualTo("my-token-value");
            assertThat(rt.getUtilisateur()).isNotNull();
            assertThat(rt.getRevoked()).isTrue();
            assertThat(rt.getCreatedAt()).isEqualTo(now);
        }
    }

    // ══════════════════════════════════════════════════════════════════════
    // ResetToken
    // ══════════════════════════════════════════════════════════════════════
    @Nested @DisplayName("ResetToken")
    class ResetTokenTests {

        @Test @DisplayName("builder → champs assignés")
        void builder() {
            LocalDateTime exp = LocalDateTime.now().plusMinutes(15);
            ResetToken rt = ResetToken.builder().code("ABC123").expiresAt(exp).used(false).build();
            assertThat(rt.getCode()).isEqualTo("ABC123");
            assertThat(rt.isUsed()).isFalse();
        }

        @Test @DisplayName("used → true après utilisation")
        void markUsed() {
            ResetToken rt = ResetToken.builder().code("X").used(false)
                .expiresAt(LocalDateTime.now().plusMinutes(10)).build();
            rt.setUsed(true);
            assertThat(rt.isUsed()).isTrue();
        }

        @Test @DisplayName("onCreate → branche used=false (branche if)")
        void onCreate_usedFalse() {
            ResetToken rt = ResetToken.builder().code("Y").used(false)
                .expiresAt(LocalDateTime.now().plusMinutes(5)).build();
            rt.onCreate();
            assertThat(rt.isUsed()).isFalse();
        }

        @Test @DisplayName("onCreate → branche used=true (branche else — !used est false)")
        void onCreate_usedTrue() {
            ResetToken rt = ResetToken.builder().code("Z").used(true)
                .expiresAt(LocalDateTime.now().plusMinutes(5)).build();
            rt.onCreate();
            // used reste true car la branche if(!used) n'est pas prise
            assertThat(rt.isUsed()).isTrue();
        }

        @Test @DisplayName("constructeur vide → pas d'exception")
        void emptyConstructor() {
            ResetToken rt = new ResetToken();
            assertThat(rt.getCode()).isNull();
        }

        @Test @DisplayName("setters → tous les champs")
        void setters_allFields() {
            LocalDateTime exp = LocalDateTime.now().plusMinutes(30);
            ResetToken rt = new ResetToken();
            rt.setId(1L);
            rt.setCode("CODE999");
            rt.setExpiresAt(exp);
            rt.setUsed(false);
            rt.setUtilisateur(new Utilisateur());
            assertThat(rt.getId()).isEqualTo(1L);
            assertThat(rt.getCode()).isEqualTo("CODE999");
            assertThat(rt.getExpiresAt()).isEqualTo(exp);
            assertThat(rt.getUtilisateur()).isNotNull();
        }
    }

    // ══════════════════════════════════════════════════════════════════════
    // Enums complets
    // ══════════════════════════════════════════════════════════════════════
    @Nested @DisplayName("Enums")
    class EnumsTests {

        @Test @DisplayName("Role → SUPERADMIN, MANAGER, CHAUFFEUR")
        void role() {
            assertThat(Role.values()).containsExactlyInAnyOrder(
                Role.SUPERADMIN, Role.MANAGER, Role.CHAUFFEUR);
        }

        @Test @DisplayName("StatutChauffeur → EN_SERVICE, LIBRE")
        void statutChauffeur() {
            assertThat(StatutChauffeur.values()).containsExactlyInAnyOrder(
                StatutChauffeur.EN_SERVICE, StatutChauffeur.LIBRE);
        }

        @Test @DisplayName("StatutTrajet → EN_COURS, ACTIF, COMPLETE")
        void statutTrajet() {
            assertThat(StatutTrajet.values()).containsExactlyInAnyOrder(
                StatutTrajet.EN_COURS, StatutTrajet.ACTIF, StatutTrajet.COMPLETE);
        }

        @Test @DisplayName("StatutCompte → ACTIF, INACTIF, REJETE")
        void statutCompte() {
            assertThat(StatutCompte.values()).containsExactlyInAnyOrder(
                StatutCompte.ACTIF, StatutCompte.INACTIF, StatutCompte.REJETE);
        }

        @Test @DisplayName("PrioriteTrajet → NORMALE, URGENTE, CRITIQUE")
        void prioriteTrajet() {
            assertThat(PrioriteTrajet.values()).containsExactlyInAnyOrder(
                PrioriteTrajet.NORMALE, PrioriteTrajet.URGENTE, PrioriteTrajet.CRITIQUE);
        }

        @Test @DisplayName("PrioriteReclamation → URGENT, NORMAL")
        void prioriteReclamation() {
            assertThat(PrioriteReclamation.values()).containsExactlyInAnyOrder(
                PrioriteReclamation.URGENT, PrioriteReclamation.NORMAL);
        }

        @Test @DisplayName("StatutReclamation → EN_COURS, RESOLU, REJETE")
        void statutReclamation() {
            assertThat(StatutReclamation.values()).containsExactlyInAnyOrder(
                StatutReclamation.EN_COURS, StatutReclamation.RESOLU, StatutReclamation.REJETE);
        }

        @Test @DisplayName("StatutEntreprise → ACTIF, INACTIF, EN_ATTENTE, SUSPENDU")
        void statutEntreprise() {
            assertThat(StatutEntreprise.values()).containsExactlyInAnyOrder(
                StatutEntreprise.ACTIF, StatutEntreprise.INACTIF,
                StatutEntreprise.EN_ATTENTE, StatutEntreprise.SUSPENDU);
        }

        @Test @DisplayName("StatutVehicule → EN_SERVICE, EN_MAINTENANCE, HORS_SERVICE")
        void statutVehicule() {
            assertThat(StatutVehicule.values()).containsExactlyInAnyOrder(
                StatutVehicule.EN_SERVICE, StatutVehicule.EN_MAINTENANCE, StatutVehicule.HORS_SERVICE);
        }

        @Test @DisplayName("TypeNotif → toutes les 9 valeurs")
        void typeNotif() {
            assertThat(TypeNotif.values()).containsExactlyInAnyOrder(
                TypeNotif.SECTEUR, TypeNotif.NOTIF_COMPTE, TypeNotif.NOTIF_TRAJET,
                TypeNotif.NOTIF_CONGE, TypeNotif.NOTIF_RECLAMATION, TypeNotif.NOTIF_MESSAGE,
                TypeNotif.NOTIF_ENTREPRISE, TypeNotif.NOTIF_AFFECTATION, TypeNotif.NOTIF_VEHICULE);
        }

        @Test @DisplayName("MessengerMessageStatus → NON_LU, LU")
        void messengerStatus() {
            assertThat(MessengerMessageStatus.values()).containsExactlyInAnyOrder(
                MessengerMessageStatus.NON_LU, MessengerMessageStatus.LU);
        }

        @Test @DisplayName("MessengerMessageType → TEXTE, IMAGE, PDF, VOCAL, APPEL")
        void messengerType() {
            assertThat(MessengerMessageType.values()).containsExactlyInAnyOrder(
                MessengerMessageType.TEXTE, MessengerMessageType.IMAGE,
                MessengerMessageType.PDF, MessengerMessageType.VOCAL, MessengerMessageType.APPEL);
        }
    }
}
