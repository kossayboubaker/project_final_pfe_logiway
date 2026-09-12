package com.logiway.mappers;

import com.logiway.dto.response.UserResponse;
import com.logiway.entities.*;
import com.logiway.entities.enums.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("UserMapper — Tests unitaires")
class UserMapperTest {

    private UserMapper mapper;

    @BeforeEach
    void setUp() {
        mapper = new UserMapper();
    }

    @Test @DisplayName("toResponse(Chauffeur) avec manager et secteur → tous les champs mappés")
    void toResponse_chauffeur_withManagerAndSecteur() {
        Secteur secteur = new Secteur();
        secteur.setId(10L);
        secteur.setNom("Nord");

        Manager manager = new Manager();
        manager.setId(5L);
        manager.setPrenom("Marc");
        manager.setNom("Martin");

        Chauffeur c = new Chauffeur();
        c.setId(1L);
        c.setKeycloakId("kc-1");
        c.setPrenom("Jean");
        c.setNom("Dupont");
        c.setEmail("jean@test.fr");
        c.setRole(Role.CHAUFFEUR);
        c.setEstActif(StatutCompte.ACTIF);
        c.setEmailVerifie(true);
        c.setStatutConducteur(StatutChauffeur.LIBRE);
        c.setManager(manager);
        c.setSecteur(secteur);
        c.setDateCreation(LocalDateTime.now());

        UserResponse r = mapper.toResponse(c);

        assertThat(r.id()).isEqualTo(1L);
        assertThat(r.role()).isEqualTo(Role.CHAUFFEUR);
        assertThat(r.statutConducteur()).isEqualTo(StatutChauffeur.LIBRE);
        assertThat(r.managerId()).isEqualTo(5L);
        assertThat(r.managerPrenom()).isEqualTo("Marc");
        assertThat(r.managerNom()).isEqualTo("Martin");
        assertThat(r.secteurId()).isEqualTo(10L);
        assertThat(r.secteurNom()).isEqualTo("Nord");
        assertThat(r.actif()).isTrue();
    }

    @Test @DisplayName("toResponse(Chauffeur) sans manager ni secteur → nulls")
    void toResponse_chauffeur_noManagerNoSecteur() {
        Chauffeur c = new Chauffeur();
        c.setId(2L);
        c.setKeycloakId("kc-2");
        c.setEmail("c2@t.fr");
        c.setRole(Role.CHAUFFEUR);
        c.setEstActif(StatutCompte.INACTIF);
        c.setEmailVerifie(false);
        c.setStatutConducteur(StatutChauffeur.EN_SERVICE);

        UserResponse r = mapper.toResponse(c);

        assertThat(r.managerId()).isNull();
        assertThat(r.secteurId()).isNull();
        assertThat(r.actif()).isFalse();
        assertThat(r.statutConducteur()).isEqualTo(StatutChauffeur.EN_SERVICE);
    }

    @Test @DisplayName("toResponse(Manager) avec secteur → secteur mappé")
    void toResponse_manager_withSecteur() {
        Secteur secteur = new Secteur();
        secteur.setId(20L);
        secteur.setNom("Sud");

        Manager m = new Manager();
        m.setId(3L);
        m.setKeycloakId("kc-3");
        m.setEmail("m@t.fr");
        m.setRole(Role.MANAGER);
        m.setEstActif(StatutCompte.ACTIF);
        m.setEmailVerifie(true);
        m.setSecteur(secteur);

        UserResponse r = mapper.toResponse(m);

        assertThat(r.role()).isEqualTo(Role.MANAGER);
        assertThat(r.secteurId()).isEqualTo(20L);
        assertThat(r.secteurNom()).isEqualTo("Sud");
        assertThat(r.statutConducteur()).isNull();
        assertThat(r.managerId()).isNull();
    }

    @Test @DisplayName("toResponse(Manager) sans secteur → secteur null")
    void toResponse_manager_noSecteur() {
        Manager m = new Manager();
        m.setId(4L);
        m.setKeycloakId("kc-4");
        m.setEmail("m2@t.fr");
        m.setRole(Role.MANAGER);
        m.setEstActif(StatutCompte.ACTIF);
        m.setEmailVerifie(false);

        UserResponse r = mapper.toResponse(m);

        assertThat(r.secteurId()).isNull();
        assertThat(r.secteurNom()).isNull();
    }

    @Test @DisplayName("toResponse(Utilisateur simple) → pas de statutConducteur/manager/secteur")
    void toResponse_utilisateurSimple() {
        Utilisateur u = new Utilisateur();
        u.setId(5L);
        u.setKeycloakId("kc-5");
        u.setEmail("u@t.fr");
        u.setRole(Role.CHAUFFEUR);
        u.setEstActif(StatutCompte.REJETE);
        u.setEmailVerifie(false);

        Entreprise e = new Entreprise();
        e.setId(100L);
        e.setNomEntreprise("LogiSA");
        u.setEntreprise(e);

        UserResponse r = mapper.toResponse(u);

        assertThat(r.statutConducteur()).isNull();
        assertThat(r.managerId()).isNull();
        assertThat(r.secteurId()).isNull();
        assertThat(r.entrepriseId()).isEqualTo(100L);
        assertThat(r.entrepriseNom()).isEqualTo("LogiSA");
        assertThat(r.actif()).isFalse();
    }

    @Test @DisplayName("toResponse(Utilisateur) sans entreprise → entrepriseId null")
    void toResponse_noEntreprise() {
        Utilisateur u = new Utilisateur();
        u.setId(6L);
        u.setKeycloakId("kc-6");
        u.setEmail("u2@t.fr");
        u.setRole(Role.CHAUFFEUR);
        u.setEstActif(StatutCompte.ACTIF);
        u.setEmailVerifie(true);

        UserResponse r = mapper.toResponse(u);

        assertThat(r.entrepriseId()).isNull();
        assertThat(r.entrepriseNom()).isNull();
    }
}
