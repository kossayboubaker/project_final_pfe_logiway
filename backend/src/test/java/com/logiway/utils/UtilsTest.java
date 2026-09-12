package com.logiway.utils;

import com.logiway.entities.Notification;
import com.logiway.entities.Utilisateur;
import com.logiway.entities.enums.TypeNotif;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("Utils — Tests unitaires")
class UtilsTest {

    // ══════════════════════════════════════════════════════════════════
    // PasswordGenerator
    // ══════════════════════════════════════════════════════════════════
    @Nested @DisplayName("PasswordGenerator")
    class PasswordGeneratorTests {

        @Test @DisplayName("generate(12) → longueur 12")
        void generate_length() {
            assertThat(PasswordGenerator.generate(12)).hasSize(12);
        }

        @Test @DisplayName("generate(1) → longueur 1")
        void generate_one() {
            assertThat(PasswordGenerator.generate(1)).hasSize(1);
        }

        @Test @DisplayName("generate(20) → ne contient que les chars autorisés")
        void generate_validChars() {
            String result = PasswordGenerator.generate(20);
            assertThat(result).matches("[A-Za-z0-9!@#$%]+");
        }

        @Test @DisplayName("generate deux fois → résultats différents (aléatoire)")
        void generate_random() {
            // Probabilité de collision quasi-nulle avec 16 chars
            String p1 = PasswordGenerator.generate(16);
            String p2 = PasswordGenerator.generate(16);
            // On ne peut pas garantir l'inégalité mais on peut vérifier la longueur
            assertThat(p1).hasSize(16);
            assertThat(p2).hasSize(16);
        }
    }

    // ══════════════════════════════════════════════════════════════════
    // NotificationToneResolver
    // ══════════════════════════════════════════════════════════════════
    @Nested @DisplayName("NotificationToneResolver")
    class NotificationToneResolverTests {

        @Test @DisplayName("message null → null")
        void nullMessage() {
            assertThat(NotificationToneResolver.resolve(TypeNotif.NOTIF_COMPTE, null)).isNull();
        }

        // NOTIF_ENTREPRISE
        @Test @DisplayName("ENTREPRISE → statut: actif → SUCCESS")
        void entreprise_actif() {
            assertThat(NotificationToneResolver.resolve(TypeNotif.NOTIF_ENTREPRISE, "statut: actif confirmé")).isEqualTo("SUCCESS");
        }

        @Test @DisplayName("ENTREPRISE → a ete validee → SUCCESS")
        void entreprise_validee() {
            assertThat(NotificationToneResolver.resolve(TypeNotif.NOTIF_ENTREPRISE, "L'entreprise a ete validee")).isEqualTo("SUCCESS");
        }

        @Test @DisplayName("ENTREPRISE → en attente → WARNING")
        void entreprise_enAttente() {
            assertThat(NotificationToneResolver.resolve(TypeNotif.NOTIF_ENTREPRISE, "Votre entreprise est en attente de validation")).isEqualTo("WARNING");
        }

        @Test @DisplayName("ENTREPRISE → inactif → DANGER")
        void entreprise_inactif() {
            assertThat(NotificationToneResolver.resolve(TypeNotif.NOTIF_ENTREPRISE, "Compte inactif")).isEqualTo("DANGER");
        }

        @Test @DisplayName("ENTREPRISE → suspendu → DANGER")
        void entreprise_suspendu() {
            assertThat(NotificationToneResolver.resolve(TypeNotif.NOTIF_ENTREPRISE, "Compte suspendu")).isEqualTo("DANGER");
        }

        @Test @DisplayName("ENTREPRISE → supprimé → DANGER")
        void entreprise_supprime() {
            assertThat(NotificationToneResolver.resolve(TypeNotif.NOTIF_ENTREPRISE, "Entreprise supprimée")).isEqualTo("DANGER");
        }

        @Test @DisplayName("ENTREPRISE → affecté → SUCCESS")
        void entreprise_affecte() {
            assertThat(NotificationToneResolver.resolve(TypeNotif.NOTIF_ENTREPRISE, "Manager affecté à l'entreprise")).isEqualTo("SUCCESS");
        }

        @Test @DisplayName("ENTREPRISE → autre → INFO")
        void entreprise_info() {
            assertThat(NotificationToneResolver.resolve(TypeNotif.NOTIF_ENTREPRISE, "Autre message")).isEqualTo("INFO");
        }

        // NOTIF_AFFECTATION
        @Test @DisplayName("AFFECTATION → supprimé → DANGER")
        void affectation_supprime() {
            assertThat(NotificationToneResolver.resolve(TypeNotif.NOTIF_AFFECTATION, "Chauffeur supprimé")).isEqualTo("DANGER");
        }

        @Test @DisplayName("AFFECTATION → réassigné → INFO")
        void affectation_reassigne() {
            assertThat(NotificationToneResolver.resolve(TypeNotif.NOTIF_AFFECTATION, "Chauffeur réassigné à un nouveau secteur")).isEqualTo("INFO");
        }

        @Test @DisplayName("AFFECTATION → assigné → SUCCESS")
        void affectation_assigne() {
            assertThat(NotificationToneResolver.resolve(TypeNotif.NOTIF_AFFECTATION, "Chauffeur assigné")).isEqualTo("SUCCESS");
        }

        @Test @DisplayName("AFFECTATION → autre → INFO")
        void affectation_info() {
            assertThat(NotificationToneResolver.resolve(TypeNotif.NOTIF_AFFECTATION, "Autre")).isEqualTo("INFO");
        }

        // NOTIF_VEHICULE
        @Test @DisplayName("VEHICULE → supprimé → DANGER")
        void vehicule_supprime() {
            assertThat(NotificationToneResolver.resolve(TypeNotif.NOTIF_VEHICULE, "Véhicule supprimé")).isEqualTo("DANGER");
        }

        @Test @DisplayName("VEHICULE → maintenance → WARNING")
        void vehicule_maintenance() {
            assertThat(NotificationToneResolver.resolve(TypeNotif.NOTIF_VEHICULE, "En maintenance")).isEqualTo("WARNING");
        }

        @Test @DisplayName("VEHICULE → affecté → SUCCESS")
        void vehicule_affecte() {
            assertThat(NotificationToneResolver.resolve(TypeNotif.NOTIF_VEHICULE, "Véhicule affecté")).isEqualTo("SUCCESS");
        }

        @Test @DisplayName("VEHICULE → autre → INFO")
        void vehicule_info() {
            assertThat(NotificationToneResolver.resolve(TypeNotif.NOTIF_VEHICULE, "Info véhicule")).isEqualTo("INFO");
        }

        // NOTIF_CONGE
        @Test @DisplayName("CONGE → rejeté → DANGER")
        void conge_rejete() {
            assertThat(NotificationToneResolver.resolve(TypeNotif.NOTIF_CONGE, "Demande rejetée")).isEqualTo("DANGER");
        }

        @Test @DisplayName("CONGE → approuvé → SUCCESS")
        void conge_approuve() {
            assertThat(NotificationToneResolver.resolve(TypeNotif.NOTIF_CONGE, "Congé approuvé")).isEqualTo("SUCCESS");
        }

        @Test @DisplayName("CONGE → nouvelle demande → WARNING")
        void conge_nouvelleDemande() {
            assertThat(NotificationToneResolver.resolve(TypeNotif.NOTIF_CONGE, "nouvelle demande de congé soumise")).isEqualTo("WARNING");
        }

        @Test @DisplayName("CONGE → autre → INFO")
        void conge_info() {
            assertThat(NotificationToneResolver.resolve(TypeNotif.NOTIF_CONGE, "Info congé")).isEqualTo("INFO");
        }

        // NOTIF_COMPTE
        @Test @DisplayName("COMPTE → rejet → DANGER")
        void compte_rejet() {
            assertThat(NotificationToneResolver.resolve(TypeNotif.NOTIF_COMPTE, "Votre compte a été rejeté")).isEqualTo("DANGER");
        }

        @Test @DisplayName("COMPTE → inactif → WARNING")
        void compte_inactif() {
            assertThat(NotificationToneResolver.resolve(TypeNotif.NOTIF_COMPTE, "Compte inactif")).isEqualTo("WARNING");
        }

        @Test @DisplayName("COMPTE → en attente → WARNING")
        void compte_enAttente() {
            assertThat(NotificationToneResolver.resolve(TypeNotif.NOTIF_COMPTE, "Compte en attente")).isEqualTo("WARNING");
        }

        @Test @DisplayName("COMPTE → réactivé → INFO")
        void compte_reactiv() {
            assertThat(NotificationToneResolver.resolve(TypeNotif.NOTIF_COMPTE, "Compte réactivé")).isEqualTo("INFO");
        }

        @Test @DisplayName("COMPTE → activé → SUCCESS")
        void compte_activ() {
            assertThat(NotificationToneResolver.resolve(TypeNotif.NOTIF_COMPTE, "Compte activé")).isEqualTo("SUCCESS");
        }

        @Test @DisplayName("COMPTE → autre → INFO")
        void compte_info() {
            assertThat(NotificationToneResolver.resolve(TypeNotif.NOTIF_COMPTE, "Autre")).isEqualTo("INFO");
        }

        // Autres types → null
        @Test @DisplayName("NOTIF_TRAJET → null (pas de règle définie)")
        void trajet_null() {
            assertThat(NotificationToneResolver.resolve(TypeNotif.NOTIF_TRAJET, "trajet créé")).isNull();
        }

        @Test @DisplayName("SECTEUR → null")
        void secteur_null() {
            assertThat(NotificationToneResolver.resolve(TypeNotif.SECTEUR, "secteur modifié")).isNull();
        }
    }

    // ══════════════════════════════════════════════════════════════════
    // NotificationMessageResolver
    // ══════════════════════════════════════════════════════════════════
    @Nested @DisplayName("NotificationMessageResolver")
    class NotificationMessageResolverTests {

        private Utilisateur user(Long id, String prenom, String nom, String email) {
            Utilisateur u = new Utilisateur();
            u.setId(id);
            u.setPrenom(prenom);
            u.setNom(nom);
            u.setEmail(email);
            return u;
        }

        private Notification notif(TypeNotif type, String msg, Utilisateur target) {
            Notification n = new Notification();
            n.setType(type);
            n.setMessage(msg);
            n.setUtilisateur(target);
            return n;
        }

        @Test @DisplayName("notification null → vide")
        void notif_null() {
            assertThat(NotificationMessageResolver.resolveForRecipient(user(1L,"A","B","a@t.fr"), null)).isEmpty();
        }

        @Test @DisplayName("notification.message null → vide")
        void notif_message_null() {
            Utilisateur target = user(2L,"X","Y","x@t.fr");
            Notification n = notif(TypeNotif.NOTIF_TRAJET, null, target);
            assertThat(NotificationMessageResolver.resolveForRecipient(user(1L,"A","B","a@t.fr"), n)).isEmpty();
        }

        @Test @DisplayName("recipient null → message original")
        void recipient_null() {
            Utilisateur target = user(2L,"X","Y","x@t.fr");
            Notification n = notif(TypeNotif.NOTIF_TRAJET, "Trajet créé", target);
            assertThat(NotificationMessageResolver.resolveForRecipient(null, n)).isEqualTo("Trajet créé");
        }

        @Test @DisplayName("targetUser null → message original")
        void targetUser_null() {
            Notification n = notif(TypeNotif.NOTIF_TRAJET, "Trajet créé", null);
            assertThat(NotificationMessageResolver.resolveForRecipient(user(1L,"A","B","a@t.fr"), n)).isEqualTo("Trajet créé");
        }

        @Test @DisplayName("recipient == target → message original")
        void recipient_isTarget() {
            Utilisateur u = user(1L,"Jean","Dupont","j@t.fr");
            Notification n = notif(TypeNotif.NOTIF_TRAJET, "Votre trajet", u);
            assertThat(NotificationMessageResolver.resolveForRecipient(u, n)).isEqualTo("Votre trajet");
        }

        @Test @DisplayName("NOTIF_CONGE — 'Votre demande de congé...' → reformulé")
        void conge_votreDemandeConge() {
            Utilisateur target = user(2L,"Marie","Curie","m@t.fr");
            Notification n = notif(TypeNotif.NOTIF_CONGE, "Votre demande de congé a été approuvée", target);
            String result = NotificationMessageResolver.resolveForRecipient(user(1L,"Admin","A","a@t.fr"), n);
            assertThat(result).contains("Marie Curie");
        }

        @Test @DisplayName("NOTIF_CONGE — 'Votre demande...' → reformulé")
        void conge_votreDemande() {
            Utilisateur target = user(2L,"Paul","Martin","p@t.fr");
            Notification n = notif(TypeNotif.NOTIF_CONGE, "Votre demande a été rejetée", target);
            String result = NotificationMessageResolver.resolveForRecipient(user(1L,"Admin","A","a@t.fr"), n);
            assertThat(result).contains("Paul Martin");
        }

        @Test @DisplayName("NOTIF_CONGE — 'Votre congé...' → reformulé")
        void conge_votreCong() {
            Utilisateur target = user(2L,"Luc","Pierre","l@t.fr");
            Notification n = notif(TypeNotif.NOTIF_CONGE, "Votre congé a été validé", target);
            String result = NotificationMessageResolver.resolveForRecipient(user(1L,"Admin","A","a@t.fr"), n);
            assertThat(result).contains("Luc Pierre");
        }

        @Test @DisplayName("NOTIF_CONGE — 'Demande de congé...' → retourné tel quel")
        void conge_demandeConge_direct() {
            Utilisateur target = user(2L,"Alice","B","al@t.fr");
            Notification n = notif(TypeNotif.NOTIF_CONGE, "Demande de congé reçue", target);
            String result = NotificationMessageResolver.resolveForRecipient(user(1L,"Admin","A","a@t.fr"), n);
            assertThat(result).isEqualTo("Demande de congé reçue");
        }

        @Test @DisplayName("NOTIF_CONGE — 'Congé...' → retourné tel quel")
        void conge_conge_direct() {
            Utilisateur target = user(2L,"Bob","C","b@t.fr");
            Notification n = notif(TypeNotif.NOTIF_CONGE, "Congé validé", target);
            String result = NotificationMessageResolver.resolveForRecipient(user(1L,"Admin","A","a@t.fr"), n);
            assertThat(result).isEqualTo("Congé validé");
        }

        @Test @DisplayName("NOTIF_CONGE — message vide → 'Congé de ...'")
        void conge_messageBlank() {
            Utilisateur target = user(2L,"Jean","Valjean","jv@t.fr");
            Notification n = notif(TypeNotif.NOTIF_CONGE, "   ", target);
            String result = NotificationMessageResolver.resolveForRecipient(user(1L,"Admin","A","a@t.fr"), n);
            assertThat(result).contains("Congé de").contains("Jean Valjean");
        }

        @Test @DisplayName("NOTIF_CONGE — autre message → préfixé avec nom")
        void conge_autreMessage() {
            Utilisateur target = user(2L,"Henri","Blanc","h@t.fr");
            Notification n = notif(TypeNotif.NOTIF_CONGE, "Mise à jour du congé", target);
            String result = NotificationMessageResolver.resolveForRecipient(user(1L,"Admin","A","a@t.fr"), n);
            assertThat(result).contains("Henri Blanc").contains("Mise à jour du congé");
        }

        @Test @DisplayName("NOTIF_COMPTE — 'Votre compte...' → remplacé")
        void compte_votreCompte() {
            Utilisateur target = user(2L,"Claire","D","c@t.fr");
            Notification n = notif(TypeNotif.NOTIF_COMPTE, "Votre compte a été activé", target);
            String result = NotificationMessageResolver.resolveForRecipient(user(1L,"Admin","A","a@t.fr"), n);
            assertThat(result).contains("Le compte").contains("Claire D");
        }

        @Test @DisplayName("NOTIF_COMPTE — message sans 'Votre compte' → préfixé")
        void compte_autreMessage() {
            Utilisateur target = user(2L,"Eve","F","e@t.fr");
            Notification n = notif(TypeNotif.NOTIF_COMPTE, "Compte en attente de validation", target);
            String result = NotificationMessageResolver.resolveForRecipient(user(1L,"Admin","A","a@t.fr"), n);
            assertThat(result).contains("Le compte").contains("Eve F");
        }

        @Test @DisplayName("Autre type — préfixé par 'Utilisateur ...'")
        void autreType() {
            Utilisateur target = user(2L,"Frank","G","f@t.fr");
            Notification n = notif(TypeNotif.NOTIF_TRAJET, "Trajet démarré", target);
            String result = NotificationMessageResolver.resolveForRecipient(user(1L,"Admin","A","a@t.fr"), n);
            assertThat(result).contains("Utilisateur").contains("Frank G").contains("Trajet démarré");
        }

        @Test @DisplayName("User sans prenom/nom → email utilisé comme label")
        void userWithEmailOnly() {
            Utilisateur target = user(2L,null,null,"only@email.fr");
            Notification n = notif(TypeNotif.NOTIF_TRAJET, "Trajet", target);
            String result = NotificationMessageResolver.resolveForRecipient(user(1L,"Admin","A","a@t.fr"), n);
            assertThat(result).contains("only@email.fr");
        }

        @Test @DisplayName("User sans prenom/nom/email → id utilisé comme label")
        void userWithIdOnly() {
            Utilisateur target = user(42L,null,null,null);
            Notification n = notif(TypeNotif.NOTIF_TRAJET, "Trajet", target);
            String result = NotificationMessageResolver.resolveForRecipient(user(1L,"Admin","A","a@t.fr"), n);
            assertThat(result).contains("#42");
        }
    }
}
