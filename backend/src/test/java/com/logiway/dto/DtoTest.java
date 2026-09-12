package com.logiway.dto;

import com.logiway.dto.pause.*;
import com.logiway.dto.request.*;
import com.logiway.dto.response.*;
import com.logiway.entities.enums.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("DTO — Tests unitaires (records, builders, méthodes)")
class DtoTest {

    // ══════════════════════════════════════════════════════════════════
    // NotificationResponse — méthodes avec logique
    // ══════════════════════════════════════════════════════════════════
    @Nested @DisplayName("NotificationResponse")
    class NotificationResponseTests {

        @Test @DisplayName("getFormattedTime → null dateCreation → 'À l\\'instant'")
        void formattedTime_null() {
            NotificationResponse n = new NotificationResponse(1L, TypeNotif.NOTIF_TRAJET, "msg", null, false, "INFO");
            assertThat(n.getFormattedTime()).isEqualTo("À l'instant");
        }

        @Test @DisplayName("getFormattedTime → < 60 sec → 'À l\\'instant'")
        void formattedTime_recent() {
            NotificationResponse n = new NotificationResponse(1L, TypeNotif.NOTIF_TRAJET, "msg",
                LocalDateTime.now().minusSeconds(30), false, "INFO");
            assertThat(n.getFormattedTime()).isEqualTo("À l'instant");
        }

        @Test @DisplayName("getFormattedTime → 2 minutes → 'Il y a X min'")
        void formattedTime_minutes() {
            NotificationResponse n = new NotificationResponse(1L, TypeNotif.NOTIF_TRAJET, "msg",
                LocalDateTime.now().minusMinutes(2), false, "INFO");
            assertThat(n.getFormattedTime()).contains("min");
        }

        @Test @DisplayName("getFormattedTime → 3 heures → 'Il y a Xh'")
        void formattedTime_hours() {
            NotificationResponse n = new NotificationResponse(1L, TypeNotif.NOTIF_TRAJET, "msg",
                LocalDateTime.now().minusHours(3), false, "INFO");
            assertThat(n.getFormattedTime()).contains("h");
        }

        @Test @DisplayName("getFormattedTime → 1 jour → 'Hier'")
        void formattedTime_yesterday() {
            NotificationResponse n = new NotificationResponse(1L, TypeNotif.NOTIF_TRAJET, "msg",
                LocalDateTime.now().minusDays(1), false, "INFO");
            assertThat(n.getFormattedTime()).isEqualTo("Hier");
        }

        @Test @DisplayName("getFormattedTime → 3 jours → 'Il y a X jours'")
        void formattedTime_days() {
            NotificationResponse n = new NotificationResponse(1L, TypeNotif.NOTIF_TRAJET, "msg",
                LocalDateTime.now().minusDays(3), false, "INFO");
            assertThat(n.getFormattedTime()).contains("jours");
        }

        @Test @DisplayName("getFormattedTime → 10 jours → date brute")
        void formattedTime_old() {
            LocalDateTime old = LocalDateTime.now().minusDays(10);
            NotificationResponse n = new NotificationResponse(1L, TypeNotif.NOTIF_TRAJET, "msg",
                old, false, "INFO");
            assertThat(n.getFormattedTime()).isEqualTo(old.toString());
        }

        @Test @DisplayName("getNotificationTitle → null type → 'Notification'")
        void title_nullType() {
            NotificationResponse n = new NotificationResponse(1L, null, "msg", null, false, null);
            assertThat(n.getNotificationTitle()).isEqualTo("Notification");
        }

        @Test @DisplayName("getNotificationTitle → tous les types")
        void title_allTypes() {
            assertThat(new NotificationResponse(1L, TypeNotif.NOTIF_COMPTE, "m", null, false, null).getNotificationTitle()).isEqualTo("Compte");
            assertThat(new NotificationResponse(1L, TypeNotif.NOTIF_TRAJET, "m", null, false, null).getNotificationTitle()).isEqualTo("Trajet");
            assertThat(new NotificationResponse(1L, TypeNotif.NOTIF_CONGE, "m", null, false, null).getNotificationTitle()).isEqualTo("Congé");
            assertThat(new NotificationResponse(1L, TypeNotif.NOTIF_RECLAMATION, "m", null, false, null).getNotificationTitle()).isEqualTo("Réclamation");
            assertThat(new NotificationResponse(1L, TypeNotif.NOTIF_MESSAGE, "m", null, false, null).getNotificationTitle()).isEqualTo("Message");
            assertThat(new NotificationResponse(1L, TypeNotif.NOTIF_ENTREPRISE, "m", null, false, null).getNotificationTitle()).isEqualTo("Entreprise");
            assertThat(new NotificationResponse(1L, TypeNotif.NOTIF_AFFECTATION, "m", null, false, null).getNotificationTitle()).isEqualTo("Affectation");
            assertThat(new NotificationResponse(1L, TypeNotif.NOTIF_VEHICULE, "m", null, false, null).getNotificationTitle()).isEqualTo("Camion");
            assertThat(new NotificationResponse(1L, TypeNotif.SECTEUR, "m", null, false, null).getNotificationTitle()).isEqualTo("Secteur");
        }
    }

    // ══════════════════════════════════════════════════════════════════
    // AvailableDriverResponse — fullName()
    // ══════════════════════════════════════════════════════════════════
    @Nested @DisplayName("AvailableDriverResponse")
    class AvailableDriverResponseTests {

        @Test @DisplayName("fullName → prenom + nom")
        void fullName_withNames() {
            assertThat(new AvailableDriverResponse(1L, "Jean", "Dupont", "j@t.fr").fullName())
                .isEqualTo("Jean Dupont");
        }

        @Test @DisplayName("fullName → prenom seulement")
        void fullName_prenomOnly() {
            assertThat(new AvailableDriverResponse(1L, "Jean", null, "j@t.fr").fullName())
                .isEqualTo("Jean");
        }

        @Test @DisplayName("fullName → null + null → email")
        void fullName_noNames_email() {
            assertThat(new AvailableDriverResponse(1L, null, null, "j@t.fr").fullName())
                .isEqualTo("j@t.fr");
        }

        @Test @DisplayName("fullName → tout null → '#id'")
        void fullName_allNull() {
            assertThat(new AvailableDriverResponse(42L, null, null, null).fullName())
                .isEqualTo("#42");
        }
    }

    // ══════════════════════════════════════════════════════════════════
    // dto/pause — builders et constructeurs
    // ══════════════════════════════════════════════════════════════════
    @Nested @DisplayName("dto/pause")
    class PauseDtoTests {

        @Test @DisplayName("PauseAIPredictionResponse builder → champs + equals/hashCode")
        void predictionResponse_builder() {
            LocalDateTime now = LocalDateTime.now();
            PauseAIPredictionResponse r = PauseAIPredictionResponse.builder()
                .id(1L).trajetId(10L).timestamp(now)
                .hoursDriving(3.5).distAlongRatio(0.4).score(70)
                .poiType("CAFE").alerteDeclenchee(true)
                .typeAlerte(TypeAlerteIA.RECOMMANDEE)
                .latitudePoi(48.0).longitudePoi(2.0)
                .nomPoi("Café du coin").distancePoiM(50.0).build();
            assertThat(r.getId()).isEqualTo(1L);
            assertThat(r.getScore()).isEqualTo(70);
            assertThat(r.getAlerteDeclenchee()).isTrue();
            assertThat(r.getTypeAlerte()).isEqualTo(TypeAlerteIA.RECOMMANDEE);
            PauseAIPredictionResponse r2 = PauseAIPredictionResponse.builder()
                .id(1L).trajetId(10L).timestamp(now)
                .hoursDriving(3.5).distAlongRatio(0.4).score(70)
                .poiType("CAFE").alerteDeclenchee(true).typeAlerte(TypeAlerteIA.RECOMMANDEE)
                .latitudePoi(48.0).longitudePoi(2.0).nomPoi("Café du coin").distancePoiM(50.0).build();
            assertThat(r).isEqualTo(r2);
            assertThat(r.hashCode()).isEqualTo(r2.hashCode());
            assertThat(r.toString()).contains("CAFE");
            assertThat(r.equals(new Object())).isFalse();
        }

        @Test @DisplayName("PauseAIPredictionResponse constructeur vide → pas d'exception")
        void predictionResponse_empty() {
            PauseAIPredictionResponse r = new PauseAIPredictionResponse();
            assertThat(r.getId()).isNull();
        }

        @Test @DisplayName("PauseReglementaireResponse builder → champs + equals/hashCode")
        void pauseReglResponse_builder() {
            PauseReglementaireResponse r = PauseReglementaireResponse.builder()
                .id(5L).trajetId(20L).type(TypePause.REST_AREA)
                .latitude(48.85).longitude(2.35)
                .statut(StatutPause.PLANIFIEE).nomLieu("Aire A1")
                .aiScore(80).fatigueScore(65).accessibilityScore(75)
                .contextScore(70).reasoning("Bonne raison").confidence(0.9).build();
            assertThat(r.getId()).isEqualTo(5L);
            assertThat(r.getType()).isEqualTo(TypePause.REST_AREA);
            assertThat(r.getNomLieu()).isEqualTo("Aire A1");
            PauseReglementaireResponse r2 = PauseReglementaireResponse.builder()
                .id(5L).trajetId(20L).type(TypePause.REST_AREA)
                .latitude(48.85).longitude(2.35)
                .statut(StatutPause.PLANIFIEE).nomLieu("Aire A1")
                .aiScore(80).fatigueScore(65).accessibilityScore(75)
                .contextScore(70).reasoning("Bonne raison").confidence(0.9).build();
            assertThat(r).isEqualTo(r2);
            assertThat(r.hashCode()).isEqualTo(r2.hashCode());
            assertThat(r.toString()).contains("Aire A1");
            assertThat(r.equals(new Object())).isFalse();
        }

        @Test @DisplayName("PauseAIEvaluationRequest builder → champs assignés")
        void evalRequest_builder() {
            PauseAIEvaluationRequest r = PauseAIEvaluationRequest.builder()
                .currentLatitude(48.85).currentLongitude(2.35)
                .distanceParcourueKm(120.5).build();
            assertThat(r.getCurrentLatitude()).isEqualTo(48.85);
            assertThat(r.getDistanceParcourueKm()).isEqualTo(120.5);
        }

        @Test @DisplayName("PauseAIDashboardResponse builder avec nested classes + equals/hashCode")
        void dashboard_builder() {
            PauseAIDashboardResponse.MLInsights insights = PauseAIDashboardResponse.MLInsights.builder()
                .chauffeursCritiquesFatigue(2).scoreFatigueMax(92.0)
                .tauxAcceptationAI(0.85).build();

            PauseAIDashboardResponse.ChauffeurStats stat = PauseAIDashboardResponse.ChauffeurStats.builder()
                .chauffeurId(1L).nomChauffeur("Jean Dupont")
                .scoreFatigueMoyen(75.0).niveauRisque("HIGH").build();

            PauseAIDashboardResponse.HeatmapPoint point = PauseAIDashboardResponse.HeatmapPoint.builder()
                .latitude(48.85).longitude(2.35).type("URGENTE_IGNOREE").score(90).build();

            PauseAIDashboardResponse dash = PauseAIDashboardResponse.builder()
                .totalPausesRecommandees(10).pausesEffectuees(8).tauxConformite(0.8)
                .mlInsights(insights).chauffeurStats(List.of(stat))
                .heatmapPoints(List.of(point)).build();

            assertThat(dash.getTotalPausesRecommandees()).isEqualTo(10);
            assertThat(dash.getMlInsights().getChauffeursCritiquesFatigue()).isEqualTo(2);
            assertThat(dash.getChauffeurStats()).hasSize(1);
            assertThat(dash.getHeatmapPoints().get(0).getType()).isEqualTo("URGENTE_IGNOREE");

            // equals / hashCode / toString pour les classes imbriquées (@Data)
            PauseAIDashboardResponse.MLInsights insights2 = PauseAIDashboardResponse.MLInsights.builder()
                .chauffeursCritiquesFatigue(2).scoreFatigueMax(92.0).tauxAcceptationAI(0.85).build();
            assertThat(insights).isEqualTo(insights2);
            assertThat(insights.hashCode()).isEqualTo(insights2.hashCode());
            assertThat(insights.toString()).isNotNull();
            assertThat(insights.equals(new Object())).isFalse();

            PauseAIDashboardResponse.ChauffeurStats stat2 = PauseAIDashboardResponse.ChauffeurStats.builder()
                .chauffeurId(1L).nomChauffeur("Jean Dupont").scoreFatigueMoyen(75.0).niveauRisque("HIGH").build();
            assertThat(stat).isEqualTo(stat2);
            assertThat(stat.hashCode()).isEqualTo(stat2.hashCode());
            assertThat(stat.toString()).contains("Jean Dupont");
            assertThat(stat.equals(new Object())).isFalse();

            PauseAIDashboardResponse.HeatmapPoint point2 = PauseAIDashboardResponse.HeatmapPoint.builder()
                .latitude(48.85).longitude(2.35).type("URGENTE_IGNOREE").score(90).build();
            assertThat(point).isEqualTo(point2);
            assertThat(point.hashCode()).isEqualTo(point2.hashCode());
            assertThat(point.toString()).contains("URGENTE_IGNOREE");
            assertThat(point.equals(new Object())).isFalse();

            // equals / hashCode / toString de PauseAIDashboardResponse lui-même
            PauseAIDashboardResponse dash2 = PauseAIDashboardResponse.builder()
                .totalPausesRecommandees(10).pausesEffectuees(8).tauxConformite(0.8)
                .mlInsights(insights).chauffeurStats(List.of(stat))
                .heatmapPoints(List.of(point)).build();
            assertThat(dash).isEqualTo(dash2);
            assertThat(dash.hashCode()).isEqualTo(dash2.hashCode());
            assertThat(dash.toString()).isNotNull();
            assertThat(dash.equals(new Object())).isFalse();
        }
    }

    // ══════════════════════════════════════════════════════════════════
    // dto/request — records (construction simple)
    // ══════════════════════════════════════════════════════════════════
    @Nested @DisplayName("dto/request records")
    class RequestDtoTests {

        @Test @DisplayName("LoginRequest → champs")
        void loginRequest() {
            LoginRequest r = new LoginRequest("user@t.fr", "pass123");
            assertThat(r.email()).isEqualTo("user@t.fr");
            assertThat(r.password()).isEqualTo("pass123");
        }

        @Test @DisplayName("CreateUserRequest → champs")
        void createUserRequest() {
            CreateUserRequest r = new CreateUserRequest("Jean", "Dupont", "j@t.fr", "0600", "France", null, Role.CHAUFFEUR, true, 5L);
            assertThat(r.prenom()).isEqualTo("Jean");
            assertThat(r.role()).isEqualTo(Role.CHAUFFEUR);
        }

        @Test @DisplayName("UpdateUserRequest → champs")
        void updateUserRequest() {
            UpdateUserRequest r = new UpdateUserRequest("Marie", "Curie", "m@t.fr", "0700", "France", null, true, null, Role.MANAGER, 2L);
            assertThat(r.prenom()).isEqualTo("Marie");
            assertThat(r.role()).isEqualTo(Role.MANAGER);
        }

        @Test @DisplayName("CreateEntrepriseRequest → champs")
        void createEntreprise() {
            CreateEntrepriseRequest r = new CreateEntrepriseRequest("LogiSA","e@t.fr","addr","0600","TVA","Rep","doc","Transport",10,"img",1L,"ACTIF");
            assertThat(r.nomEntreprise()).isEqualTo("LogiSA");
            assertThat(r.tailleFlotte()).isEqualTo(10);
        }

        @Test @DisplayName("CreateSectorRequest → champs")
        void createSector() {
            CreateSectorRequest r = new CreateSectorRequest("Nord", "Zone nord", "Paris", "75000,75001", 1L, 2L);
            assertThat(r.nom()).isEqualTo("Nord");
            assertThat(r.managerId()).isEqualTo(2L);
        }

        @Test @DisplayName("CreateCongeRequest → champs")
        void createConge() {
            CreateCongeRequest r = new CreateCongeRequest(TypeConge.VACANCES, LocalDate.now(), LocalDate.now().plusDays(5), "Vacances été");
            assertThat(r.type()).isEqualTo(TypeConge.VACANCES);
            assertThat(r.motif()).isEqualTo("Vacances été");
        }

        @Test @DisplayName("UpdateCongeRequest → champs")
        void updateConge() {
            UpdateCongeRequest r = new UpdateCongeRequest(TypeConge.MALADIE, LocalDate.now(), LocalDate.now().plusDays(3), "Maladie");
            assertThat(r.type()).isEqualTo(TypeConge.MALADIE);
        }

        @Test @DisplayName("CreateVehiculeRequest → champs")
        void createVehicule() {
            CreateVehiculeRequest r = new CreateVehiculeRequest("AB-001", "Renault", "Master", 3000.0, 50000, StatutVehicule.EN_SERVICE, 1L, 2L);
            assertThat(r.matricule()).isEqualTo("AB-001");
            assertThat(r.statut()).isEqualTo(StatutVehicule.EN_SERVICE);
        }

        @Test @DisplayName("UpdateVehiculeStatusRequest → statut")
        void updateVehiculeStatus() {
            UpdateVehiculeStatusRequest r = new UpdateVehiculeStatusRequest(StatutVehicule.EN_MAINTENANCE);
            assertThat(r.statut()).isEqualTo(StatutVehicule.EN_MAINTENANCE);
        }

        @Test @DisplayName("AssignVehiculeDriverRequest → chauffeurId")
        void assignVehiculeDriver() {
            AssignVehiculeDriverRequest r = new AssignVehiculeDriverRequest(5L);
            assertThat(r.chauffeurId()).isEqualTo(5L);
        }

        @Test @DisplayName("TokenRefreshRequest → refreshToken")
        void tokenRefresh() {
            TokenRefreshRequest r = new TokenRefreshRequest("my-token");
            assertThat(r.refreshToken()).isEqualTo("my-token");
        }

        @Test @DisplayName("ForgotPasswordRequest → email")
        void forgotPassword() {
            ForgotPasswordRequest r = new ForgotPasswordRequest("user@t.fr");
            assertThat(r.email()).isEqualTo("user@t.fr");
        }

        @Test @DisplayName("ResetPasswordRequest → code + newPassword")
        void resetPassword() {
            ResetPasswordRequest r = new ResetPasswordRequest("ABC123", "newPass@1");
            assertThat(r.code()).isEqualTo("ABC123");
        }

        @Test @DisplayName("ChangePasswordRequest → old + new")
        void changePassword() {
            ChangePasswordRequest r = new ChangePasswordRequest("oldPass", "newPass123");
            assertThat(r.oldPassword()).isEqualTo("oldPass");
            assertThat(r.newPassword()).isEqualTo("newPass123");
        }

        @Test @DisplayName("MessengerTextRequest → destinataireId + contenu")
        void messengerText() {
            MessengerTextRequest r = new MessengerTextRequest(2L, "Bonjour");
            assertThat(r.destinataireId()).isEqualTo(2L);
            assertThat(r.contenu()).isEqualTo("Bonjour");
        }

        @Test @DisplayName("MessengerMessageUpdateRequest → contenu")
        void messengerUpdate() {
            MessengerMessageUpdateRequest r = new MessengerMessageUpdateRequest("Modifié");
            assertThat(r.contenu()).isEqualTo("Modifié");
        }

        @Test @DisplayName("CreateReclamationRequest Lombok → getters/setters/equals/hashCode/toString")
        void createReclamation() {
            CreateReclamationRequest r = new CreateReclamationRequest("Sujet", "Desc", PrioriteReclamation.URGENT);
            assertThat(r.getSujet()).isEqualTo("Sujet");
            assertThat(r.getPriorite()).isEqualTo(PrioriteReclamation.URGENT);
            r.setSujet("Updated");
            assertThat(r.getSujet()).isEqualTo("Updated");
            // equals / hashCode / toString (Lombok @Data)
            CreateReclamationRequest r2 = new CreateReclamationRequest("Updated", "Desc", PrioriteReclamation.URGENT);
            assertThat(r).isEqualTo(r2);
            assertThat(r.hashCode()).isEqualTo(r2.hashCode());
            assertThat(r.toString()).contains("Updated");
        }

        @Test @DisplayName("UpdateReclamationRequest Lombok → getters/setters/equals/hashCode/toString")
        void updateReclamation() {
            UpdateReclamationRequest r = new UpdateReclamationRequest("S", "D", PrioriteReclamation.NORMAL);
            assertThat(r.getDescription()).isEqualTo("D");
            UpdateReclamationRequest r2 = new UpdateReclamationRequest("S", "D", PrioriteReclamation.NORMAL);
            assertThat(r).isEqualTo(r2);
            assertThat(r.hashCode()).isEqualTo(r2.hashCode());
            assertThat(r.toString()).contains("NORMAL");
        }

        @Test @DisplayName("ReclamationDecisionRequest Lombok → getters/setters/equals/hashCode/toString")
        void reclamationDecision() {
            ReclamationDecisionRequest r = new ReclamationDecisionRequest("Commentaire");
            assertThat(r.getCommentaire()).isEqualTo("Commentaire");
            ReclamationDecisionRequest r2 = new ReclamationDecisionRequest("Commentaire");
            assertThat(r).isEqualTo(r2);
            assertThat(r.hashCode()).isEqualTo(r2.hashCode());
            assertThat(r.toString()).contains("Commentaire");
        }

        @Test @DisplayName("ValidateReclamationRequest Lombok → getters/setters/equals/hashCode/toString")
        void validateReclamation() {
            ValidateReclamationRequest r = new ValidateReclamationRequest("Sujet val", "Desc val");
            assertThat(r.getSujet()).isEqualTo("Sujet val");
            assertThat(r.getDescription()).isEqualTo("Desc val");
            ValidateReclamationRequest r2 = new ValidateReclamationRequest("Sujet val", "Desc val");
            assertThat(r).isEqualTo(r2);
            assertThat(r.hashCode()).isEqualTo(r2.hashCode());
            assertThat(r.toString()).contains("Sujet val");
        }

        @Test @DisplayName("ChatbotMessageRequest Lombok → equals/hashCode/toString")
        void chatbotMessage() {
            ChatbotMessageRequest r = new ChatbotMessageRequest("Quelle est la météo ?");
            assertThat(r.getQuestion()).isEqualTo("Quelle est la météo ?");
            r.setQuestion("Autre question");
            assertThat(r.getQuestion()).isEqualTo("Autre question");
            ChatbotMessageRequest r2 = new ChatbotMessageRequest("Autre question");
            assertThat(r).isEqualTo(r2);
            assertThat(r.hashCode()).isEqualTo(r2.hashCode());
            assertThat(r.toString()).contains("Autre question");
        }

        @Test @DisplayName("GenerateReportRequest Lombok → equals/hashCode/toString/canEqual")
        void generateReport() {
            GenerateReportRequest r = new GenerateReportRequest("Analyse des trajets", "PDF");
            assertThat(r.getRequeteNaturelle()).isEqualTo("Analyse des trajets");
            assertThat(r.getFormatPrefere()).isEqualTo("PDF");
            GenerateReportRequest r2 = new GenerateReportRequest("Analyse des trajets", "PDF");
            assertThat(r).isEqualTo(r2);
            assertThat(r.hashCode()).isEqualTo(r2.hashCode());
            assertThat(r.toString()).contains("PDF");
            // canEqual — utilisé par equals de Lombok
            assertThat(r.equals(new Object())).isFalse();
        }

        @Test @DisplayName("CongeDecisionRequest → commentaire + notificationId")
        void congeDecision() {
            CongeDecisionRequest r = new CongeDecisionRequest("Approuvé", 10L);
            assertThat(r.commentaire()).isEqualTo("Approuvé");
            assertThat(r.notificationId()).isEqualTo(10L);
        }

        @Test @DisplayName("UpdateEntrepriseRequest → champs")
        void updateEntreprise() {
            UpdateEntrepriseRequest r = new UpdateEntrepriseRequest("NewName","e@t.fr","addr","0600","TVA","Rep","doc","Transport",15,"img",3L,"ACTIF");
            assertThat(r.nomEntreprise()).isEqualTo("NewName");
        }

        @Test @DisplayName("UpdateSectorRequest → champs")
        void updateSector() {
            UpdateSectorRequest r = new UpdateSectorRequest("Sud","Zone sud","Lyon","69000",2L,3L);
            assertThat(r.nom()).isEqualTo("Sud");
        }

        @Test @DisplayName("UpdateProfileRequest → champs")
        void updateProfile() {
            UpdateProfileRequest r = new UpdateProfileRequest("Jean", "Dupont", "0600", null);
            assertThat(r.prenom()).isEqualTo("Jean");
        }

        @Test @DisplayName("UpdateVehiculeRequest → champs")
        void updateVehicule() {
            UpdateVehiculeRequest r = new UpdateVehiculeRequest("XY-001","Peugeot","Boxer",2500.0,60000,StatutVehicule.HORS_SERVICE,1L,2L);
            assertThat(r.matricule()).isEqualTo("XY-001");
        }
    }

    // ══════════════════════════════════════════════════════════════════
    // dto/chauffeur — records
    // ══════════════════════════════════════════════════════════════════
    @Nested @DisplayName("dto/chauffeur records")
    class ChauffeurDtoTests {

        @Test @DisplayName("ChauffeurAvailabilityResponse → champs")
        void availability() {
            java.time.LocalDateTime now = java.time.LocalDateTime.now();
            com.logiway.dto.chauffeur.ChauffeurAvailabilityResponse r =
                new com.logiway.dto.chauffeur.ChauffeurAvailabilityResponse(now, 30L, true);
            assertThat(r.disponible()).isTrue();
            assertThat(r.minutesRestantes()).isEqualTo(30L);
            assertThat(r.dateDisponibilite()).isEqualTo(now);
        }

        @Test @DisplayName("ChauffeurDashboardStatsResponse → champs")
        void dashboardStats() {
            com.logiway.dto.chauffeur.ChauffeurDashboardStatsResponse r =
                new com.logiway.dto.chauffeur.ChauffeurDashboardStatsResponse(
                    250.5, 12L, 2L, 8.5, 85.0, 7.5, 0.95, 1L, 0L, 0L, 0L, 88.0);
            assertThat(r.distanceTotaleKm()).isEqualTo(250.5);
            assertThat(r.missionsCompletees()).isEqualTo(12L);
            assertThat(r.ecoScoreMoyen()).isEqualTo(88.0);
        }

        @Test @DisplayName("ChauffeurVehicleResponse → champs")
        void vehicleResponse() {
            com.logiway.dto.chauffeur.ChauffeurVehicleResponse r =
                new com.logiway.dto.chauffeur.ChauffeurVehicleResponse(
                    1L, "AB-001", "Renault", "Master", "Fourgon",
                    com.logiway.entities.enums.StatutVehicule.EN_SERVICE,
                    50000, 75.0, 1500.0, 2L, "LogiSA");
            assertThat(r.matricule()).isEqualTo("AB-001");
            assertThat(r.statut()).isEqualTo(com.logiway.entities.enums.StatutVehicule.EN_SERVICE);
            assertThat(r.niveauCarburant()).isEqualTo(75.0);
        }

        @Test @DisplayName("ChauffeurHistoryTripResponse → champs")
        void historyTrip() {
            java.time.LocalDateTime now = java.time.LocalDateTime.now();
            com.logiway.dto.chauffeur.ChauffeurHistoryTripResponse r =
                new com.logiway.dto.chauffeur.ChauffeurHistoryTripResponse(
                    1L, "Paris", "Lyon", now, now.plusHours(3), now.plusHours(3).plusMinutes(10),
                    465.0, 180, 190,
                    com.logiway.entities.enums.StatutTrajet.COMPLETE,
                    "AB-001", "Renault", "Master",
                    com.logiway.entities.enums.StatutVehicule.EN_SERVICE,
                    "Marc Martin", "m@t.fr", null, null, null,
                    com.logiway.entities.enums.PrioriteTrajet.NORMALE, "Note test");
            assertThat(r.pointDepart()).isEqualTo("Paris");
            assertThat(r.destination()).isEqualTo("Lyon");
            assertThat(r.statut()).isEqualTo(com.logiway.entities.enums.StatutTrajet.COMPLETE);
        }

        @Test @DisplayName("ChauffeurDashboardResponse → champs")
        void dashboard() {
            com.logiway.dto.chauffeur.ChauffeurDashboardResponse r =
                new com.logiway.dto.chauffeur.ChauffeurDashboardResponse(
                    null, null, null, null, List.of(), null, null);
            assertThat(r.missionsDuJour()).isEmpty();
            assertThat(r.chauffeur()).isNull();
        }
    }
    @Nested @DisplayName("dto/response records")
    class ResponseDtoTests {

        @Test @DisplayName("ApiMessageResponse → message")
        void apiMessage() {
            assertThat(new ApiMessageResponse("OK").message()).isEqualTo("OK");
        }

        @Test @DisplayName("TokenRefreshResponse → champs")
        void tokenRefresh() {
            TokenRefreshResponse r = new TokenRefreshResponse("access","refresh",3600L,7200L,"Bearer");
            assertThat(r.accessToken()).isEqualTo("access");
            assertThat(r.tokenType()).isEqualTo("Bearer");
        }

        @Test @DisplayName("AuthResponse → champs")
        void authResponse() {
            AuthResponse r = new AuthResponse("token","Bearer",3600L,null);
            assertThat(r.tokenType()).isEqualTo("Bearer");
        }

        @Test @DisplayName("AuthSessionResponse → champs")
        void authSession() {
            AuthSessionResponse r = new AuthSessionResponse("MANAGER","Jean","Dupont",false,true);
            assertThat(r.role()).isEqualTo("MANAGER");
            assertThat(r.hasCompany()).isTrue();
        }

        @Test @DisplayName("LoginResult → champs")
        void loginResult() {
            LoginResult r = new LoginResult("acc","ref",3600L,7200L,null,true,false);
            assertThat(r.accessToken()).isEqualTo("acc");
            assertThat(r.firstLogin()).isTrue();
        }

        @Test @DisplayName("MessengerReadResponse → champs")
        void messengerRead() {
            LocalDateTime now = LocalDateTime.now();
            MessengerReadResponse r = new MessengerReadResponse(2L, 5L, now);
            assertThat(r.destinataireId()).isEqualTo(2L);
            assertThat(r.messagesMarquesLus()).isEqualTo(5L);
        }

        @Test @DisplayName("MessengerPresenceResponse → champs")
        void messengerPresence() {
            MessengerPresenceResponse r = new MessengerPresenceResponse(1L, true, LocalDateTime.now());
            assertThat(r.utilisateurId()).isEqualTo(1L);
            assertThat(r.connecte()).isTrue();
        }

        @Test @DisplayName("MessengerMessagePageResponse → champs")
        void messengerPage() {
            MessengerMessagePageResponse r = new MessengerMessagePageResponse(List.of(), 0, 20, 0L, false);
            assertThat(r.hasMore()).isFalse();
            assertThat(r.totalElements()).isEqualTo(0L);
        }

        @Test @DisplayName("ValidateReclamationFieldResponse builder → champs + equals/hashCode")
        void validateField() {
            ValidateReclamationFieldResponse r = ValidateReclamationFieldResponse.builder()
                .valide(true).typeErreur(null).message("OK").build();
            assertThat(r.isValide()).isTrue();
            assertThat(r.getMessage()).isEqualTo("OK");
            ValidateReclamationFieldResponse r2 = ValidateReclamationFieldResponse.builder()
                .valide(true).typeErreur(null).message("OK").build();
            assertThat(r).isEqualTo(r2);
            assertThat(r.hashCode()).isEqualTo(r2.hashCode());
            assertThat(r.toString()).contains("OK");
            assertThat(r.equals(new Object())).isFalse();
        }

        @Test @DisplayName("ValidateReclamationResponse builder → sujet + description + equals/hashCode")
        void validateReclamation() {
            ValidateReclamationFieldResponse f = ValidateReclamationFieldResponse.builder().valide(false).typeErreur("TROP_COURT").message("Sujet trop court").build();
            ValidateReclamationResponse r = ValidateReclamationResponse.builder().sujet(f).description(null).build();
            assertThat(r.getSujet().isValide()).isFalse();
            ValidateReclamationResponse r2 = ValidateReclamationResponse.builder().sujet(f).description(null).build();
            assertThat(r).isEqualTo(r2);
            assertThat(r.hashCode()).isEqualTo(r2.hashCode());
            assertThat(r.toString()).isNotNull();
            assertThat(r.equals(new Object())).isFalse();
        }

        @Test @DisplayName("GenerateReportResponse builder → champs + equals/hashCode")
        void generateReport() {
            GenerateReportResponse r = GenerateReportResponse.builder()
                .success(true).reportId("R001").message("OK")
                .urlDownload("/dl/R001").build();
            assertThat(r.getSuccess()).isTrue();
            assertThat(r.getReportId()).isEqualTo("R001");
            GenerateReportResponse r2 = GenerateReportResponse.builder()
                .success(true).reportId("R001").message("OK")
                .urlDownload("/dl/R001").build();
            assertThat(r).isEqualTo(r2);
            assertThat(r.hashCode()).isEqualTo(r2.hashCode());
            assertThat(r.toString()).contains("R001");
            assertThat(r.equals(new Object())).isFalse();
        }

        @Test @DisplayName("ReportMetadataResponse builder → champs + equals/hashCode")
        void reportMetadata() {
            ReportMetadataResponse r = ReportMetadataResponse.builder()
                .reportId("R1").titre("Rapport").format("PDF")
                .domaine("trajets").statut("DONE").nbLignes(100).build();
            assertThat(r.getReportId()).isEqualTo("R1");
            assertThat(r.getNbLignes()).isEqualTo(100);
            ReportMetadataResponse r2 = ReportMetadataResponse.builder()
                .reportId("R1").titre("Rapport").format("PDF")
                .domaine("trajets").statut("DONE").nbLignes(100).build();
            assertThat(r).isEqualTo(r2);
            assertThat(r.hashCode()).isEqualTo(r2.hashCode());
            assertThat(r.toString()).contains("R1");
            assertThat(r.equals(new Object())).isFalse();
        }

        @Test @DisplayName("ReportListResponse builder → total + list + equals/hashCode")
        void reportList() {
            ReportListResponse r = ReportListResponse.builder()
                .total(3).rapports(List.of()).build();
            assertThat(r.getTotal()).isEqualTo(3);
            assertThat(r.getRapports()).isEmpty();
            ReportListResponse r2 = ReportListResponse.builder().total(3).rapports(List.of()).build();
            assertThat(r).isEqualTo(r2);
            assertThat(r.hashCode()).isEqualTo(r2.hashCode());
            assertThat(r.toString()).contains("3");
            assertThat(r.equals(new Object())).isFalse();
        }

        @Test @DisplayName("RapportResponse builder avec sections imbriquées + equals/hashCode")
        void rapportResponse() {
            RapportResponse.RapportSection section = RapportResponse.RapportSection.builder()
                .titre("Section 1").contenu("Contenu").build();
            RapportResponse r = RapportResponse.builder()
                .titre("Rapport mensuel").resumeIA("Résumé IA")
                .sections(List.of(section)).build();
            assertThat(r.getTitre()).isEqualTo("Rapport mensuel");
            assertThat(r.getSections()).hasSize(1);
            assertThat(r.getSections().get(0).getTitre()).isEqualTo("Section 1");
            // RapportSection equals/hashCode/toString
            RapportResponse.RapportSection section2 = RapportResponse.RapportSection.builder()
                .titre("Section 1").contenu("Contenu").build();
            assertThat(section).isEqualTo(section2);
            assertThat(section.hashCode()).isEqualTo(section2.hashCode());
            assertThat(section.toString()).contains("Section 1");
            assertThat(section.equals(new Object())).isFalse();
            // RapportResponse equals/hashCode/toString
            RapportResponse r2 = RapportResponse.builder()
                .titre("Rapport mensuel").resumeIA("Résumé IA")
                .sections(List.of(section)).build();
            assertThat(r).isEqualTo(r2);
            assertThat(r.hashCode()).isEqualTo(r2.hashCode());
            assertThat(r.toString()).contains("Rapport mensuel");
            assertThat(r.equals(new Object())).isFalse();
        }

        @Test @DisplayName("SectorResponse avec inner records")
        void sectorResponse() {
            SectorResponse.SectorManagerInfo mgr = new SectorResponse.SectorManagerInfo(1L,"Marc","Martin","m@t.fr",Role.MANAGER);
            SectorResponse.SectorDriverInfo drv = new SectorResponse.SectorDriverInfo(2L,"Jean","Dupont",1L);
            SectorResponse r = new SectorResponse(10L,"Nord","Zone","Paris","75001",1L, List.of(mgr), List.of(drv));
            assertThat(r.nom()).isEqualTo("Nord");
            assertThat(r.managers()).hasSize(1);
            assertThat(r.managers().get(0).prenom()).isEqualTo("Marc");
            assertThat(r.chauffeurs().get(0).managerId()).isEqualTo(1L);
        }

        @Test @DisplayName("VehiculeResponse → champs")
        void vehiculeResponse() {
            VehiculeResponse r = new VehiculeResponse(1L,"AB-001","Renault","Master",3000.0,50000,StatutVehicule.EN_SERVICE,1L,"LogiSA",2L,"Jean Dupont",3L,"Marc","Martin");
            assertThat(r.matricule()).isEqualTo("AB-001");
            assertThat(r.statut()).isEqualTo(StatutVehicule.EN_SERVICE);
        }

        @Test @DisplayName("EntrepriseResponse → champs")
        void entrepriseResponse() {
            EntrepriseResponse r = new EntrepriseResponse(1L,"LogiSA","e@t.fr","addr","0600","TVA","Rep","doc","Transport","img",20,StatutEntreprise.ACTIF,2L,"Marc Martin",LocalDateTime.now(),5);
            assertThat(r.nomEntreprise()).isEqualTo("LogiSA");
            assertThat(r.statut()).isEqualTo(StatutEntreprise.ACTIF);
        }

        @Test @DisplayName("ReclamationResponse (@Value) → equals/hashCode/toString + tous les getters")
        void reclamationResponse_equalsHashCodeToString() {
            LocalDateTime now = LocalDateTime.of(2026, 8, 1, 10, 0);
            ReclamationResponse r1 = new ReclamationResponse(1L,"Sujet","Desc",
                PrioriteReclamation.URGENT, StatutReclamation.EN_COURS,
                "OK", 2L, "Jean", "j@t.fr", now);
            ReclamationResponse r2 = new ReclamationResponse(1L,"Sujet","Desc",
                PrioriteReclamation.URGENT, StatutReclamation.EN_COURS,
                "OK", 2L, "Jean", "j@t.fr", now);
            ReclamationResponse r3 = new ReclamationResponse(99L,"Autre","D",
                PrioriteReclamation.NORMAL, StatutReclamation.RESOLU,
                null, 3L, "Marie", "m@t.fr", now);

            // equals — branche true
            assertThat(r1).isEqualTo(r2);
            assertThat(r1.equals(r1)).isTrue();
            // equals — branche false (null et objet différent)
            assertThat(r1.equals(null)).isFalse();
            assertThat(r1.equals(new Object())).isFalse();
            assertThat(r1.equals(r3)).isFalse();

            // hashCode
            assertThat(r1.hashCode()).isEqualTo(r2.hashCode());
            assertThat(r1.hashCode()).isNotEqualTo(r3.hashCode());

            // toString
            assertThat(r1.toString()).contains("Sujet");
            assertThat(r1.toString()).contains("URGENT");

            // tous les getters (couvre les 10 méthodes)
            assertThat(r1.getId()).isEqualTo(1L);
            assertThat(r1.getDescription()).isEqualTo("Desc");
            assertThat(r1.getStatut()).isEqualTo(StatutReclamation.EN_COURS);
            assertThat(r1.getCommentaireResolution()).isEqualTo("OK");
            assertThat(r1.getUtilisateurId()).isEqualTo(2L);
            assertThat(r1.getUtilisateurNom()).isEqualTo("Jean");
            assertThat(r1.getUtilisateurEmail()).isEqualTo("j@t.fr");
            assertThat(r1.getDateCreation()).isEqualTo(now);
        }

        @Test @DisplayName("ReportMetadataResponse → tous les setters")
        void reportMetadata_allSetters() {
            ReportMetadataResponse r = new ReportMetadataResponse();
            LocalDateTime now = LocalDateTime.of(2026, 8, 1, 10, 0);
            r.setReportId("R1"); r.setTitre("T"); r.setFormat("PDF"); r.setDomaine("d");
            r.setStatut("DONE"); r.setUserId("u1"); r.setEntrepriseId("e1");
            r.setDateCreation(now); r.setDateDebutDonnees(now); r.setDateFinDonnees(now);
            r.setTailleFichierKo(500); r.setUrlTelechargement("/dl/R1");
            r.setNbLignes(200); r.setTempsGenerationMs(1500); r.setErreur("none");

            assertThat(r.getFormat()).isEqualTo("PDF");
            assertThat(r.getUserId()).isEqualTo("u1");
            assertThat(r.getEntrepriseId()).isEqualTo("e1");
            assertThat(r.getDateDebutDonnees()).isEqualTo(now);
            assertThat(r.getDateFinDonnees()).isEqualTo(now);
            assertThat(r.getTailleFichierKo()).isEqualTo(500);
            assertThat(r.getUrlTelechargement()).isEqualTo("/dl/R1");
            assertThat(r.getTempsGenerationMs()).isEqualTo(1500);
            assertThat(r.getErreur()).isEqualTo("none");

            // equals/hashCode avec objet différent (branche false)
            ReportMetadataResponse other = new ReportMetadataResponse();
            assertThat(r.equals(null)).isFalse();
            assertThat(r.equals(new Object())).isFalse();
            assertThat(r.equals(other)).isFalse();
        }

        @Test @DisplayName("GenerateReportResponse → metadata setter + equals branche false")
        void generateReportResponse_setterAndEqualsFalse() {
            ReportMetadataResponse meta = ReportMetadataResponse.builder()
                .reportId("R1").format("CSV").build();
            GenerateReportResponse r = new GenerateReportResponse();
            r.setSuccess(false); r.setReportId("R1");
            r.setMessage("Erreur"); r.setMetadata(meta); r.setUrlDownload(null);

            assertThat(r.getMetadata().getFormat()).isEqualTo("CSV");
            assertThat(r.getSuccess()).isFalse();
            assertThat(r.getUrlDownload()).isNull();

            // equals branche false
            assertThat(r.equals(null)).isFalse();
            assertThat(r.equals(new Object())).isFalse();
        }

        @Test @DisplayName("ReportListResponse → setters + equals branche false")
        void reportListResponse_settersAndEqualsFalse() {
            ReportListResponse r = new ReportListResponse();
            r.setTotal(5);
            r.setRapports(List.of(ReportMetadataResponse.builder().reportId("R1").build()));
            assertThat(r.getTotal()).isEqualTo(5);
            assertThat(r.getRapports()).hasSize(1);

            assertThat(r.equals(null)).isFalse();
            assertThat(r.equals(new Object())).isFalse();
        }

        @Test @DisplayName("ValidateReclamationFieldResponse → setters + equals branche false")
        void validateField_settersAndEqualsFalse() {
            ValidateReclamationFieldResponse r = new ValidateReclamationFieldResponse();
            r.setValide(true); r.setTypeErreur("ERR"); r.setMessage("Detail");
            assertThat(r.isValide()).isTrue();
            assertThat(r.getTypeErreur()).isEqualTo("ERR");

            assertThat(r.equals(null)).isFalse();
            assertThat(r.equals(new Object())).isFalse();
        }

        @Test @DisplayName("ValidateReclamationResponse → setters + equals branche false")
        void validateReclamationResponse_settersAndEqualsFalse() {
            ValidateReclamationResponse r = new ValidateReclamationResponse();
            ValidateReclamationFieldResponse f = ValidateReclamationFieldResponse.builder()
                .valide(false).typeErreur("TROP_COURT").message("Trop court").build();
            r.setSujet(f); r.setDescription(f);
            assertThat(r.getSujet().getTypeErreur()).isEqualTo("TROP_COURT");

            assertThat(r.equals(null)).isFalse();
            assertThat(r.equals(new Object())).isFalse();
        }

        @Test @DisplayName("RapportResponse → setters + section setters + equals branche false")
        void rapportResponse_settersAndEqualsFalse() {
            RapportResponse r = new RapportResponse();
            r.setTitre("T"); r.setResumeIA("IA"); r.setSections(List.of());
            r.setDateGeneration(LocalDateTime.of(2026, 8, 1, 0, 0));
            assertThat(r.getTitre()).isEqualTo("T");
            assertThat(r.getResumeIA()).isEqualTo("IA");

            assertThat(r.equals(null)).isFalse();
            assertThat(r.equals(new Object())).isFalse();

            // RapportSection setters + equals branche false
            RapportResponse.RapportSection s = new RapportResponse.RapportSection();
            s.setTitre("S"); s.setContenu("C");
            assertThat(s.getTitre()).isEqualTo("S");

            assertThat(s.equals(null)).isFalse();
            assertThat(s.equals(new Object())).isFalse();
        }
    }
}
