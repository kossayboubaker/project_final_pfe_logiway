# Guide Complet des Tests — Projet LogiWay

## Module Testing : Spring Boot · Angular · Flask · MySQL · Keycloak

> **À qui s'adresse ce guide :** Développeur Full Stack qui a déjà livré les fonctionnalités et veut maintenant tester son application de façon professionnelle, dans l'ordre des priorités, sans connaissances préalables en testing.

---

## Sommaire

1. [Pourquoi tester et quels types existent ?](#1-pourquoi-et-quels-types)  
2. [Cartographie des tests pour LogiWay](#2-cartographie)  
3. [Priorité 1 — Tests Unitaires Backend (Spring Boot \+ JUnit)](#3-unitaires-backend)  
4. [Priorité 2 — Tests Unitaires Python (Flask \+ pytest)](#4-unitaires-python)  
5. [Priorité 3 — Tests Unitaires Frontend (Angular \+ Jest)](#5-unitaires-angular)  
6. [Priorité 4 — Tests d'Intégration Backend](#6-integration-backend)  
7. [Priorité 5 — Tests de Performance (Gatling \+ k6)](#7-performance)  
8. [Priorité 6 — Tests End-to-End (Playwright)](#8-e2e)  
9. [Résultats et rapports attendus](#9-resultats)  
10. [Ordre d'exécution recommandé](#10-ordre)

---

## 1\. Pourquoi tester et quels types existent ?

### La pyramide des tests

Imagine une pyramide : la base est large et rapide, le sommet est étroit et lent.

              /\\

             /E2E\\          ← 5% des tests | lents | coûteux

            /──────\\

           /Intégrat.\\      ← 20% des tests | moyens | réalistes

          /────────────\\

         / Tests Unitaires\\ ← 75% des tests | rapides | isolés

        /──────────────────\\

**Règle d'or :** Plus tu montes dans la pyramide, plus c'est lent et fragile. Commence par la base.

### Les 6 types que tu vas implémenter dans LogiWay

| \# | Type | Ce que ça teste | Vitesse | Outil |
| :---- | :---- | :---- | :---- | :---- |
| 1 | **Unitaire Backend** | Une méthode Java isolée | \< 1ms | JUnit 5 \+ Mockito |
| 2 | **Unitaire Python** | Une fonction Flask isolée | \< 5ms | pytest |
| 3 | **Unitaire Frontend** | Un composant Angular isolé | \< 50ms | Jest \+ Angular Testing |
| 4 | **Intégration** | Service \+ BDD \+ Keycloak ensemble | \< 2s | Spring Test \+ Testcontainers |
| 5 | **Performance** | Charge simulée (100 utilisateurs) | minutes | Gatling / k6 |
| 6 | **E2E** | Scénario complet navigateur | minutes | Playwright |

---

## 2\. Cartographie des tests pour LogiWay

### Ce qu'on va tester et pourquoi

LogiWay

├── Backend Spring Boot (Port 8080\)

│   ├── Auth Keycloak           → Test: login, refresh token, rôles RBAC

│   ├── Gestion Entreprises     → Test: workflow EN\_ATTENTE → ACTIF

│   ├── Gestion Véhicules       → Test: isolation entreprise, affectation

│   ├── Gestion Trajets \+ GPS   → Test: OSRM, positions GPS, ETA

│   ├── Pauses réglementaires   → Test: règle 3h/4h30, CE 561/2006

│   ├── Congés \+ Réclamations   → Test: workflows, notifications SSE

│   └── Notifications SSE       → Test: persistance MySQL → diffusion

│

├── Services Python

│   ├── Flask Réclamations (5001) → Test: toxicité, sémantique

│   ├── Flask ML Pauses (5000)    → Test: prédiction RandomForest

│   └── FastAPI RAG (8000)        → Test: chatbot, génération rapports

│

├── Frontend Angular (Port 4200\)

│   ├── Auth Guards \+ Interceptors → Test: redirection, JWT

│   ├── Composants Dashboard      → Test: rendu, données mockées

│   └── Services HTTP             → Test: appels API, gestion erreurs

│

└── Base de données MySQL (3306)

    └── Requêtes JPA complexes    → Test: isolation par entreprise

---

## 3\. Priorité 1 — Tests Unitaires Backend (Spring Boot \+ JUnit 5\)

### 3.1 Installation — Dépendances Maven

Ouvre ton `pom.xml` et vérifie que ces dépendances sont présentes dans `<dependencies>` :

\<\!-- Test Framework Principal \--\>

\<dependency\>

    \<groupId\>org.springframework.boot\</groupId\>

    \<artifactId\>spring-boot-starter-test\</artifactId\>

    \<scope\>test\</scope\>

    \<\!-- Inclut automatiquement : JUnit 5, Mockito, AssertJ, Hamcrest \--\>

\</dependency\>

\<\!-- Mockito (pour simuler les dépendances) \--\>

\<dependency\>

    \<groupId\>org.mockito\</groupId\>

    \<artifactId\>mockito-core\</artifactId\>

    \<scope\>test\</scope\>

\</dependency\>

\<\!-- Tests de sécurité Spring \--\>

\<dependency\>

    \<groupId\>org.springframework.security\</groupId\>

    \<artifactId\>spring-security-test\</artifactId\>

    \<scope\>test\</scope\>

\</dependency\>

**Rien d'autre à installer.** Spring Boot inclut tout via `spring-boot-starter-test`.

### 3.2 Structure des fichiers de test

src/

├── main/java/com/logiway/

│   ├── services/impl/PauseReglementaireServiceImpl.java

│   └── services/impl/ReclamationServiceImpl.java

│

└── test/java/com/logiway/          ← Crée ce dossier s'il n'existe pas

    ├── services/

    │   ├── PauseServiceTest.java

    │   ├── ReclamationServiceTest.java

    │   ├── TrajetServiceTest.java

    │   └── EntrepriseServiceTest.java

    └── controllers/

        └── ReclamationControllerTest.java

### 3.3 Exemple 1 — Test du service Réclamation

**Fichier :** `src/test/java/com/logiway/services/ReclamationServiceTest.java`

package com.logiway.services;

import com.logiway.entities.Reclamation;

import com.logiway.entities.Utilisateur;

import com.logiway.entities.enums.StatutReclamation;

import com.logiway.entities.enums.PrioriteReclamation;

import com.logiway.repositories.ReclamationRepository;

import com.logiway.services.impl.ReclamationServiceImpl;

import com.logiway.security.AuthenticatedUserService;

import org.junit.jupiter.api.\*;

import org.junit.jupiter.api.extension.ExtendWith;

import org.mockito.InjectMocks;

import org.mockito.Mock;

import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.\*;

import static org.mockito.ArgumentMatchers.\*;

import static org.mockito.Mockito.\*;

/\*\*

 \* Tests unitaires du service Réclamation.

 \* On NE touche PAS à la base de données — tout est simulé (mocké).

 \*/

@ExtendWith(MockitoExtension.class)          // Active Mockito

@DisplayName("Service Réclamation — Tests Unitaires")

class ReclamationServiceTest {

    // ─── Dépendances simulées (Mockito les "invente") ────────────

    @Mock

    private ReclamationRepository reclamationRepository;

    @Mock

    private AuthenticatedUserService authenticatedUserService;

    // ─── La vraie classe testée ───────────────────────────────────

    @InjectMocks

    private ReclamationServiceImpl reclamationService;

    // ─── Données de test réutilisables ───────────────────────────

    private Utilisateur chauffeur;

    private Reclamation reclamation;

    @BeforeEach

    void setUp() {

        chauffeur \= new Utilisateur();

        chauffeur.setId(1L);

        chauffeur.setEmail("chauffeur@test.com");

        reclamation \= new Reclamation();

        reclamation.setId(1L);

        reclamation.setSujet("Panne de frein sur camion 42");

        reclamation.setDescription("Le camion numéro 42 a un problème de frein");

        reclamation.setStatut(StatutReclamation.EN\_COURS);

        reclamation.setPriorite(PrioriteReclamation.HAUTE);

        reclamation.setUtilisateur(chauffeur);

    }

    // ─── TEST 1 : Récupération d'une réclamation par ID ──────────

    @Test

    @DisplayName("getReclamation() → Retourne la réclamation si elle existe")

    void getReclamation\_whenExists\_returnsReclamation() {

        // GIVEN : La BDD (simulée) retourne notre réclamation

        when(reclamationRepository.findById(1L))

            .thenReturn(Optional.of(reclamation));

        // WHEN : On appelle le service

        var result \= reclamationService.getReclamation(1L);

        // THEN : Le résultat est correct

        assertThat(result).isNotNull();

        assertThat(result.getSujet()).isEqualTo("Panne de frein sur camion 42");

        assertThat(result.getStatut()).isEqualTo(StatutReclamation.EN\_COURS);

        // Vérifier que la BDD a bien été consultée une seule fois

        verify(reclamationRepository, times(1)).findById(1L);

    }

    // ─── TEST 2 : Réclamation inexistante ─────────────────────────

    @Test

    @DisplayName("getReclamation() → Lance une exception si ID inconnu")

    void getReclamation\_whenNotFound\_throwsException() {

        // GIVEN : La BDD ne retourne rien

        when(reclamationRepository.findById(99L))

            .thenReturn(Optional.empty());

        // THEN : On attend une exception

        assertThatThrownBy(() \-\> reclamationService.getReclamation(99L))

            .isInstanceOf(RuntimeException.class);

    }

    // ─── TEST 3 : Résolution d'une réclamation ────────────────────

    @Test

    @DisplayName("resolveReclamation() → Passe le statut à RESOLU")

    void resolveReclamation\_changesStatusToResolved() {

        // GIVEN

        when(reclamationRepository.findById(1L))

            .thenReturn(Optional.of(reclamation));

        when(reclamationRepository.save(any(Reclamation.class)))

            .thenAnswer(inv \-\> inv.getArgument(0));

        // WHEN

        var result \= reclamationService.resolveReclamation(1L);

        // THEN

        assertThat(result.getStatut()).isEqualTo(StatutReclamation.RESOLU);

        verify(reclamationRepository).save(any(Reclamation.class));

    }

    // ─── TEST 4 : Réclamation URGENT → notification SuperAdmin ────

    @Test

    @DisplayName("createReclamation() → Notifie les SuperAdmins si priorité URGENT")

    void createReclamation\_whenUrgent\_notifiesSuperAdmins() {

        reclamation.setPriorite(PrioriteReclamation.URGENT);

        when(authenticatedUserService.getCurrentUser()).thenReturn(chauffeur);

        when(reclamationRepository.save(any())).thenReturn(reclamation);

        reclamationService.createReclamation(reclamation);

        // Vérifier que la notification a été envoyée (méthode du service)

        // Cette assertion dépend de ton implémentation exacte

        verify(reclamationRepository, atLeastOnce()).save(any());

    }

}

### 3.4 Exemple 2 — Test du service Pauses réglementaires

package com.logiway.services;

import com.logiway.entities.Trajet;

import com.logiway.entities.PauseReglementaire;

import com.logiway.entities.enums.TypePause;

import com.logiway.repositories.TrajetRepository;

import com.logiway.repositories.PauseReglementaireRepository;

import com.logiway.services.impl.PauseReglementaireServiceImpl;

import org.junit.jupiter.api.\*;

import org.junit.jupiter.api.extension.ExtendWith;

import org.junit.jupiter.params.ParameterizedTest;

import org.junit.jupiter.params.provider.ValueSource;

import org.mockito.\*;

import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import java.util.Optional;

import static org.assertj.core.api.Assertions.\*;

import static org.mockito.Mockito.\*;

@ExtendWith(MockitoExtension.class)

@DisplayName("Service Pauses Réglementaires — Tests Unitaires")

class PauseServiceTest {

    @Mock private TrajetRepository trajetRepository;

    @Mock private PauseReglementaireRepository pauseRepository;

    @InjectMocks

    private PauseReglementaireServiceImpl pauseService;

    private Trajet trajetLong;   // \> 3h → doit générer des pauses

    private Trajet trajetCourt;  // \< 3h → ne doit PAS générer de pauses

    @BeforeEach

    void setUp() {

        trajetLong \= new Trajet();

        trajetLong.setId(1L);

        trajetLong.setDureeEstimeeMinutes(300);  // 5h → éligible

        trajetLong.setLatitudeDepart(36.8);

        trajetLong.setLongitudeDepart(10.18);

        trajetLong.setLatitudeArrivee(34.74);

        trajetLong.setLongitudeArrivee(10.76);

        trajetCourt \= new Trajet();

        trajetCourt.setId(2L);

        trajetCourt.setDureeEstimeeMinutes(120); // 2h → non éligible

    }

    // ─── Règle CE 561/2006 : trajet \< 3h → aucune pause ──────────

    @Test

    @DisplayName("Trajet \< 3h → getPausesForTrajet() retourne liste vide")

    void getPauses\_whenTripUnder3h\_returnsEmpty() {

        when(trajetRepository.findById(2L))

            .thenReturn(Optional.of(trajetCourt));

        when(pauseRepository.findByTrajetId(2L))

            .thenReturn(List.of());  // BDD vide pour ce trajet

        var result \= pauseService.getPausesForTrajet(2L);

        assertThat(result).isEmpty();

    }

    // ─── Trajet \> 3h → au moins une pause WARNING\_ALERT ──────────

    @Test

    @DisplayName("Trajet \> 3h → doit contenir un WARNING\_ALERT à 3h")

    void getPauses\_whenTripOver3h\_hasWarningAlert() {

        PauseReglementaire warning \= new PauseReglementaire();

        warning.setType(TypePause.WARNING\_ALERT);

        warning.setDurationSeconds(0);

        PauseReglementaire mandatory \= new PauseReglementaire();

        mandatory.setType(TypePause.MANDATORY\_REST);

        mandatory.setDurationSeconds(2700); // 45 min

        when(trajetRepository.findById(1L))

            .thenReturn(Optional.of(trajetLong));

        when(pauseRepository.findByTrajetId(1L))

            .thenReturn(List.of(warning, mandatory));

        var result \= pauseService.getPausesForTrajet(1L);

        assertThat(result).hasSize(2);

        assertThat(result)

            .anyMatch(p \-\> p.getType() \== TypePause.WARNING\_ALERT);

        assertThat(result)

            .anyMatch(p \-\> p.getType() \== TypePause.MANDATORY\_REST);

    }

    // ─── Test paramétré : différentes durées ──────────────────────

    @ParameterizedTest(name \= "Durée {0} min → éligible aux pauses")

    @ValueSource(ints \= {180, 240, 270, 360, 480})

    @DisplayName("Trajets ≥ 3h → éligibles CE 561/2006")

    void trajectsOver3h\_areEligibleForBreaks(int minutes) {

        assertThat(minutes).isGreaterThanOrEqualTo(180);

    }

}

### 3.5 Commande pour exécuter les tests

\# Depuis la racine du projet backend

cd backend/

\# Exécuter TOUS les tests unitaires

mvn test

\# Exécuter un fichier de test spécifique

mvn test \-Dtest=ReclamationServiceTest

\# Exécuter avec rapport HTML (dans target/surefire-reports/)

mvn test \-Dsurefire.reportFormat=html

\# Rapport de couverture de code (génère target/site/jacoco/index.html)

mvn test jacoco:report

### 3.6 Résultats que tu vas voir

\[INFO\] \-------------------------------------------------------

\[INFO\]  T E S T S

\[INFO\] \-------------------------------------------------------

\[INFO\] Running com.logiway.services.ReclamationServiceTest

\[INFO\] Tests run: 4, Failures: 0, Errors: 0, Skipped: 0

\[INFO\]

\[INFO\] Running com.logiway.services.PauseServiceTest

\[INFO\] Tests run: 6, Failures: 0, Errors: 0, Skipped: 0

\[INFO\]

\[INFO\] BUILD SUCCESS

\[INFO\] Total tests: 10, Failures: 0

Et dans `target/site/jacoco/index.html` :

- **Couverture par classe** (ex. : `ReclamationServiceImpl` : 87% couvert)  
- **Lignes non testées** en rouge dans le code source

---

## 4\. Priorité 2 — Tests Unitaires Python (Flask \+ pytest)

### 4.1 Installation

\# Dans le dossier du service réclamation IA

cd reclamation-ai-service/

\# Installer pytest et les outils de test

pip install pytest pytest-cov pytest-flask httpx

\# Vérifier l'installation

pytest \--version

### 4.2 Structure des fichiers

reclamation-ai-service/

├── app\_simple.py

├── requirements\_simple.txt

└── tests/                        ← Créer ce dossier

    ├── \_\_init\_\_.py               ← Fichier vide obligatoire

    ├── test\_toxicite.py

    ├── test\_semantique.py

    └── test\_api\_endpoints.py

### 4.3 Exemple de tests

**Fichier :** `tests/test_toxicite.py`

"""

Tests unitaires de la détection de toxicité.

Vérifient que le moteur de règles fonctionne correctement.

"""

import pytest

import sys

sys.path.insert(0, '..')

from app\_simple import evaluate\_toxicity\_simple, evaluate\_semantic\_simple

\# ──────────────────────────────────────────────────────────────

\# TESTS TOXICITÉ

\# ──────────────────────────────────────────────────────────────

class TestToxicite:

    """Tests de la couche 1 : détection de toxicité."""

    def test\_texte\_professionnel\_non\_toxique(self):

        """Un texte professionnel ne doit PAS être toxique."""

        texte \= "Le véhicule 42 présente une panne de frein urgente"

        score \= evaluate\_toxicity\_simple(texte)

        assert score \== 0.0, f"Score toxicité inattendu : {score}"

    def test\_mot\_grossier\_detect(self):

        """Un mot grossier doit être détecté."""

        texte \= "Ce connard ne répond pas aux livraisons"

        score \= evaluate\_toxicity\_simple(texte)

        assert score \>= 0.55, "Le mot 'connard' devrait être détecté"

    def test\_sous\_chaine\_ignoree(self):

        """

        IMPORTANT : 'reconnaître' ne doit PAS déclencher la détection

        de 'con' car ce n'est pas un mot entier (word boundary).

        """

        texte \= "Reconnaître le problème de maintenance"

        score \= evaluate\_toxicity\_simple(texte)

        assert score \== 0.0, "Sous-chaîne 'con' dans 'reconnaître' ne doit pas matcher"

    def test\_cas\_insensible(self):

        """La détection doit fonctionner en majuscules aussi."""

        texte \= "MERDE ce trajet est raté"

        score \= evaluate\_toxicity\_simple(texte.lower())

        assert score \>= 0.55

    @pytest.mark.parametrize("texte\_propre", \[

        "Retard de livraison client secteur nord",

        "Maintenance urgente pour le véhicule VL-15",

        "Problème d'itinéraire sur la route nationale 3",

        "Chargement incomplet à l'entrepôt principal",

    \])

    def test\_textes\_metier\_valides(self, texte\_propre):

        """Tous les textes métier doivent avoir un score toxicité \= 0."""

        score \= evaluate\_toxicity\_simple(texte\_propre)

        assert score \== 0.0, f"Faux positif toxicité pour : '{texte\_propre}'"

\# ──────────────────────────────────────────────────────────────

\# TESTS SÉMANTIQUE

\# ──────────────────────────────────────────────────────────────

class TestSemantique:

    """Tests de la couche 2 : validation sémantique métier."""

    def test\_texte\_hors\_sujet\_score\_zero(self):

        """Un texte sans rapport avec la logistique doit échouer."""

        texte \= "J'ai mal à la tête aujourd'hui"

        score \= evaluate\_semantic\_simple(texte)

        assert score \< 0.25, f"Score sémantique trop élevé pour texte hors-sujet : {score}"

    def test\_texte\_vehicule\_valide(self):

        """Un texte avec 'véhicule' \+ 'panne' doit passer."""

        texte \= "Le camion présente une panne moteur"

        score \= evaluate\_semantic\_simple(texte)

        assert score \>= 0.25, "Texte avec mots-clés véhicule doit avoir score ≥ 0.25"

    def test\_texte\_trajet\_valide(self):

        """Un texte avec mots-clés trajet/livraison doit passer."""

        texte \= "Retard livraison client secteur itinéraire"

        score \= evaluate\_semantic\_simple(texte)

        assert score \>= 0.25

    def test\_score\_normalise\_max\_1(self):

        """Le score ne peut pas dépasser 1.0."""

        texte \= "véhicule camion trajet livraison chauffeur secteur route maintenance panne frein moteur"

        score \= evaluate\_semantic\_simple(texte)

        assert score \<= 1.0, "Le score sémantique ne peut pas dépasser 1.0"

    def test\_score\_minimum\_2\_mots\_cles(self):

        """Minimum 2 mots-clés pour un score ≥ 0.25 (seuil \= matches/2)."""

        texte\_1\_mot \= "livraison c'était vraiment difficile hier"

        texte\_2\_mots \= "livraison du chauffeur était en retard"

        score\_1 \= evaluate\_semantic\_simple(texte\_1\_mot)

        score\_2 \= evaluate\_semantic\_simple(texte\_2\_mots)

        \# 1 mot-clé → score \= 0.5 \>= 0.25 selon l'algo actuel

        \# 0 mot-clé → score \= 0.0 \< 0.25

        assert score\_2 \>= score\_1

\# ──────────────────────────────────────────────────────────────

\# TESTS ENDPOINT HTTP

\# ──────────────────────────────────────────────────────────────

class TestAPIEndpoints:

    """Tests des endpoints Flask."""

    @pytest.fixture

    def client(self):

        """Crée un client de test Flask."""

        from app\_simple import app

        app.config\['TESTING'\] \= True

        with app.test\_client() as client:

            yield client

    def test\_health\_endpoint\_retourne\_200(self, client):

        resp \= client.get('/health')

        assert resp.status\_code \== 200

        data \= resp.get\_json()

        assert data\['status'\] \== 'healthy'

    def test\_validate\_texte\_valide(self, client):

        payload \= {

            "text": "Le véhicule 15 a une panne de frein",

            "field": "description"

        }

        resp \= client.post('/validate',

                           json=payload,

                           content\_type='application/json')

        assert resp.status\_code \== 200

        data \= resp.get\_json()

        assert data\['valide'\] is True

        assert data\['typeErreur'\] is None

    def test\_validate\_texte\_toxique(self, client):

        payload \= {"text": "ce connard ne répond jamais", "field": "sujet"}

        resp \= client.post('/validate', json=payload,

                           content\_type='application/json')

        data \= resp.get\_json()

        assert data\['valide'\] is False

        assert data\['typeErreur'\] \== 'toxicite'

    def test\_validate\_champ\_text\_manquant(self, client):

        resp \= client.post('/validate', json={},

                           content\_type='application/json')

        assert resp.status\_code \== 400

### 4.4 Commandes d'exécution Python

\# Depuis reclamation-ai-service/

pytest                            \# Lance tous les tests

pytest \-v                         \# Mode verbose (détail de chaque test)

pytest tests/test\_toxicite.py \-v  \# Un seul fichier

pytest \--cov=app\_simple \\

       \--cov-report=html \\

       tests/                     \# Rapport de couverture HTML

\# Résultat dans htmlcov/index.html

### 4.5 Résultats attendus

\======================== test session starts \========================

collected 15 items

tests/test\_toxicite.py::TestToxicite::test\_texte\_professionnel\_non\_toxique PASSED

tests/test\_toxicite.py::TestToxicite::test\_mot\_grossier\_detect PASSED

tests/test\_toxicite.py::TestToxicite::test\_sous\_chaine\_ignoree PASSED

tests/test\_toxicite.py::TestSemantique::test\_texte\_hors\_sujet\_score\_zero PASSED

tests/test\_api\_endpoints.py::TestAPIEndpoints::test\_health\_endpoint\_retourne\_200 PASSED

...

\========= 15 passed in 0.84s \=========

\---------- coverage: app\_simple.py \----------

TOTAL: 91%

---

## 5\. Priorité 3 — Tests Unitaires Frontend (Angular \+ Jest)

### 5.1 Installation

\# Depuis le répertoire frontend/

cd frontend/

\# Angular vient avec Karma par défaut, mais Jest est plus rapide

\# Option A : Utiliser le Karma intégré (rien à installer)

ng test

\# Option B : Migrer vers Jest (recommandé pour LogiWay)

npm install \--save-dev jest jest-preset-angular @types/jest

\# Configurer jest.config.js

**Fichier : `jest.config.js`** (à créer à la racine du frontend)

module.exports \= {

  preset: 'jest-preset-angular',

  setupFilesAfterFramework: \['\<rootDir\>/setup-jest.ts'\],

  testPathPattern: 'src/.\*\\\\.spec\\\\.ts$',

  collectCoverageFrom: \['src/\*\*/\*.ts', '\!src/\*\*/\*.module.ts'\],

};

### 5.2 Exemples de tests Angular

**Fichier :** `src/app/features/reclamation/reclamation.component.spec.ts`

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReactiveFormsModule } from '@angular/forms';

import { HttpClientTestingModule, HttpTestingController } from

        '@angular/common/http/testing';

import { ReclamationComponent } from './reclamation.component';

import { FleetService } from 'src/app/core/services/fleet.service';

import { of, throwError } from 'rxjs';

describe('ReclamationComponent', () \=\> {

  let component: ReclamationComponent;

  let fixture: ComponentFixture\<ReclamationComponent\>;

  let fleetServiceMock: jasmine.SpyObj\<FleetService\>;

  beforeEach(async () \=\> {

    // Créer un mock du service

    fleetServiceMock \= jasmine.createSpyObj('FleetService', \[

      'createReclamation',

      'getReclamations'

    \]);

    await TestBed.configureTestingModule({

      declarations: \[ReclamationComponent\],

      imports: \[ReactiveFormsModule, HttpClientTestingModule\],

      providers: \[

        { provide: FleetService, useValue: fleetServiceMock }

      \]

    }).compileComponents();

    fixture \= TestBed.createComponent(ReclamationComponent);

    component \= fixture.componentInstance;

    fixture.detectChanges();

  });

  // ─── TEST 1 : Le composant se crée ──────────────────────────

  it('should create', () \=\> {

    expect(component).toBeTruthy();

  });

  // ─── TEST 2 : Formulaire invalide si champs vides ───────────

  it('should be invalid when form is empty', () \=\> {

    expect(component.reclamationForm.valid).toBeFalse();

  });

  // ─── TEST 3 : Formulaire valide avec données correctes ──────

  it('should be valid with sujet and description', () \=\> {

    component.reclamationForm.setValue({

      sujet: 'Panne de frein camion 42',

      description: 'Le véhicule présente une panne de frein urgente',

      priorite: 'HAUTE'

    });

    expect(component.reclamationForm.valid).toBeTrue();

  });

  // ─── TEST 4 : Appel API au submit ───────────────────────────

  it('should call createReclamation on submit', () \=\> {

    fleetServiceMock.createReclamation.and.returnValue(of({ id: 1 }));

    component.reclamationForm.setValue({

      sujet: 'Problème véhicule',

      description: 'Panne du moteur sur trajet principal',

      priorite: 'MOYENNE'

    });

    component.onSubmit();

    expect(fleetServiceMock.createReclamation).toHaveBeenCalledOnceWith(

      jasmine.objectContaining({ sujet: 'Problème véhicule' })

    );

  });

  // ─── TEST 5 : Gestion des erreurs API ────────────────────────

  it('should display error message when API fails', () \=\> {

    fleetServiceMock.createReclamation.and.returnValue(

      throwError(() \=\> ({ status: 400, error: { message: 'Contenu toxique' } }))

    );

    component.reclamationForm.setValue({

      sujet: 'texte invalide',

      description: 'contenu inapproprié',

      priorite: 'BASSE'

    });

    component.onSubmit();

    fixture.detectChanges();

    const errorEl \= fixture.nativeElement.querySelector('.error-message');

    expect(errorEl).not.toBeNull();

  });

});

### 5.3 Test du Guard d'authentification

// src/app/core/guards/auth.guard.spec.ts

import { TestBed } from '@angular/core/testing';

import { Router } from '@angular/router';

import { AuthGuard } from './auth.guard';

import { AuthService } from '../services/auth.service';

describe('AuthGuard', () \=\> {

  let guard: AuthGuard;

  let authServiceMock: jasmine.SpyObj\<AuthService\>;

  let routerMock: jasmine.SpyObj\<Router\>;

  beforeEach(() \=\> {

    authServiceMock \= jasmine.createSpyObj('AuthService', \['isAuthenticated', 'getRole'\]);

    routerMock \= jasmine.createSpyObj('Router', \['navigate'\]);

    TestBed.configureTestingModule({

      providers: \[

        AuthGuard,

        { provide: AuthService, useValue: authServiceMock },

        { provide: Router, useValue: routerMock }

      \]

    });

    guard \= TestBed.inject(AuthGuard);

  });

  it('should allow authenticated users', () \=\> {

    authServiceMock.isAuthenticated.and.returnValue(true);

    expect(guard.canActivate()).toBeTrue();

  });

  it('should redirect unauthenticated users to /login', () \=\> {

    authServiceMock.isAuthenticated.and.returnValue(false);

    guard.canActivate();

    expect(routerMock.navigate).toHaveBeenCalledWith(\['/login'\]);

  });

  it('should block CHAUFFEUR from accessing admin routes', () \=\> {

    authServiceMock.isAuthenticated.and.returnValue(true);

    authServiceMock.getRole.and.returnValue('CHAUFFEUR');

    const result \= guard.canActivateAdmin();

    expect(result).toBeFalse();

  });

});

### 5.4 Commandes Angular

ng test                           \# Lance Karma en watch mode

ng test \--watch=false             \# Une seule exécution

ng test \--code-coverage           \# Avec rapport de couverture

\# → Rapport dans coverage/logiway/index.html

---

## 6\. Priorité 4 — Tests d'Intégration Backend

### 6.1 Ce que ça teste différemment

Les tests d'intégration démarrent **une vraie base de données** (via Docker en mémoire) et testent les couches ensemble : Controller \+ Service \+ Repository \+ MySQL.

### 6.2 Installation — Testcontainers

\<\!-- pom.xml — ajouter dans \<dependencies\> \--\>

\<dependency\>

    \<groupId\>org.testcontainers\</groupId\>

    \<artifactId\>mysql\</artifactId\>

    \<scope\>test\</scope\>

\</dependency\>

\<dependency\>

    \<groupId\>org.testcontainers\</groupId\>

    \<artifactId\>junit-jupiter\</artifactId\>

    \<scope\>test\</scope\>

\</dependency\>

### 6.3 Exemple de test d'intégration

package com.logiway.integration;

import com.logiway.entities.Trajet;

import com.logiway.repositories.TrajetRepository;

import org.junit.jupiter.api.\*;

import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.boot.test.context.SpringBootTest;

import org.springframework.test.context.DynamicPropertyRegistry;

import org.springframework.test.context.DynamicPropertySource;

import org.testcontainers.containers.MySQLContainer;

import org.testcontainers.junit.jupiter.Container;

import org.testcontainers.junit.jupiter.Testcontainers;

import static org.assertj.core.api.Assertions.\*;

/\*\*

 \* Test d'intégration : démarre une vraie base MySQL dans Docker.

 \* Teste la persistance réelle des entités.

 \* Prérequis : Docker installé et démarré sur la machine.

 \*/

@SpringBootTest

@Testcontainers

@DisplayName("Intégration — Persistance MySQL")

class TrajetIntegrationTest {

    // Docker démarre automatiquement un conteneur MySQL de test

    @Container

    static MySQLContainer\<?\> mysql \= new MySQLContainer\<\>("mysql:8.0")

        .withDatabaseName("logiway\_test")

        .withUsername("test")

        .withPassword("test");

    // Pointer Spring Boot vers ce MySQL de test

    @DynamicPropertySource

    static void configureProperties(DynamicPropertyRegistry registry) {

        registry.add("spring.datasource.url",      mysql::getJdbcUrl);

        registry.add("spring.datasource.username", mysql::getUsername);

        registry.add("spring.datasource.password", mysql::getPassword);

    }

    @Autowired

    private TrajetRepository trajetRepository;

    @Test

    @DisplayName("Sauvegarder et récupérer un trajet depuis MySQL")

    void saveAndFindTrajet() {

        Trajet trajet \= new Trajet();

        trajet.setPointDepart("Tunis");

        trajet.setDestination("Sfax");

        trajet.setDureeEstimeeMinutes(300);

        Trajet saved \= trajetRepository.save(trajet);

        assertThat(saved.getId()).isNotNull();

        Trajet found \= trajetRepository.findById(saved.getId()).orElseThrow();

        assertThat(found.getPointDepart()).isEqualTo("Tunis");

        assertThat(found.getDureeEstimeeMinutes()).isEqualTo(300);

    }

    @Test

    @DisplayName("Isolation par entreprise : Manager ne voit que ses trajets")

    void findByManagerId\_returnsOnlyManagerTrajets() {

        // Crée 2 trajets de managers différents

        // Vérifie que findByManagerId retourne uniquement les bons

        // → Ce test prouve l'isolation des données

    }

}

### 6.4 Commandes tests d'intégration

\# Nécessite Docker démarré

mvn verify \-Dspring.profiles.active=test

\# Séparer tests unitaires et d'intégration

mvn test \-Dgroups="unit"

mvn verify \-Dgroups="integration"

---

## 7\. Priorité 5 — Tests de Performance (k6)

### 7.1 Pourquoi et quand

Les tests de performance répondent à : **"Mon API tient-elle si 100 chauffeurs se connectent en même temps ?"**

### 7.2 Installation k6

\# macOS

brew install k6

\# Ubuntu/Debian

sudo apt-key adv \--keyserver hkp://keyserver.ubuntu.com:80 \--recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69

echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list

sudo apt-get update && sudo apt-get install k6

\# Vérification

k6 version

### 7.3 Script de test de charge LogiWay

**Fichier : `tests-perf/logiway_load_test.js`**

/\*\*

 \* logiway\_load\_test.js — Test de performance LogiWay

 \*

 \* Simule 50 utilisateurs concurrents pendant 2 minutes.

 \* Teste les endpoints les plus sollicités.

 \*

 \* Usage : k6 run logiway\_load\_test.js

 \*/

import http from 'k6/http';

import { sleep, check } from 'k6';

import { Rate, Trend } from 'k6/metrics';

// ─── Métriques personnalisées ─────────────────────────────────

const errorRate      \= new Rate('errors');

const trajetDuration \= new Trend('trajet\_list\_duration', true);

const pauseDuration  \= new Trend('pause\_generation\_duration', true);

// ─── Scénario de charge ───────────────────────────────────────

export const options \= {

  stages: \[

    { duration: '30s', target: 10 },   // Montée progressive à 10 users

    { duration: '1m',  target: 50 },   // Plateau à 50 users

    { duration: '30s', target: 0  },   // Descente

  \],

  thresholds: {

    // Critères de réussite/échec

    'http\_req\_duration':          \['p(95)\<2000'\],  // 95% des requêtes \< 2s

    'http\_req\_failed':            \['rate\<0.05'\],   // Moins de 5% d'erreurs

    'trajet\_list\_duration':       \['p(90)\<1500'\],  // Liste trajets \< 1.5s

    'pause\_generation\_duration':  \['p(90)\<5000'\],  // Pauses \< 5s

    'errors':                     \['rate\<0.05'\],

  },

};

const BASE\_URL \= 'http://localhost:8080';

// Token JWT de test (à remplacer par un token valide)

const JWT\_TOKEN \= \_\_ENV.JWT\_TOKEN || 'eyJhbGciOiJSUzI1NiJ9...';

const HEADERS \= {

  'Content-Type': 'application/json',

  'Authorization': \`Bearer ${JWT\_TOKEN}\`,

};

// ─── Scénario principal ───────────────────────────────────────

export default function () {

  // 1\. Récupérer la liste des trajets

  const t1 \= Date.now();

  const trajetResp \= http.get(\`${BASE\_URL}/api/trajets?page=0\&size=10\`, { headers: HEADERS });

  trajetDuration.add(Date.now() \- t1);

  check(trajetResp, {

    'trajets status 200': (r) \=\> r.status \=== 200,

    'trajets non vide':   (r) \=\> {

      const body \= JSON.parse(r.body);

      return body.content && body.content.length \>= 0;

    },

  }) || errorRate.add(1);

  sleep(1);  // Pause réaliste entre requêtes

  // 2\. Récupérer les pauses d'un trajet

  const t2 \= Date.now();

  const pauseResp \= http.get(

    \`${BASE\_URL}/api/trajets/1/pauses\`,

    { headers: HEADERS }

  );

  pauseDuration.add(Date.now() \- t2);

  check(pauseResp, {

    'pauses status 200 ou 404': (r) \=\> \[200, 404\].includes(r.status),

  }) || errorRate.add(1);

  sleep(1);

  // 3\. Récupérer les notifications

  const notifResp \= http.get(

    \`${BASE\_URL}/api/notifications?page=0\&size=5\`,

    { headers: HEADERS }

  );

  check(notifResp, {

    'notifications status 200': (r) \=\> r.status \=== 200,

  }) || errorRate.add(1);

  sleep(2);

}

### 7.4 Commandes k6

\# Test simple

k6 run tests-perf/logiway\_load\_test.js

\# Avec token JWT en variable d'environnement

k6 run \-e JWT\_TOKEN="ton\_token\_jwt" tests-perf/logiway\_load\_test.js

\# Rapport HTML

k6 run \--out json=results.json tests-perf/logiway\_load\_test.js

k6 report results.json  \# Génère un HTML

\# Dashboard temps réel (ouvre navigateur sur localhost:5665)

k6 run \--out web-dashboard tests-perf/logiway\_load\_test.js

### 7.5 Résultats attendus

          /\\      |‾‾| /‾‾/   /‾‾/

     /\\  /  \\     |  |/  /   /  /

    /  \\/    \\    |     (   /   ‾‾\\

   /          \\   |  |\\  \\ |  (‾)  |

  / \_\_\_\_\_\_\_\_\_\_ \\  |\_\_| \\\_\_\\ \\\_\_\_\_\_/ .io

  execution: local

     script: logiway\_load\_test.js

     output: \-

  scenarios: (100.00%) 1 scenario, 50 max VUs, 2m30s max duration

           : default: Up to 50 looping VUs for 2m0s

✓ trajets status 200

✓ pauses status 200 ou 404

✓ notifications status 200

checks.........................: 98.50% ✓ 1970  ✗ 30

data\_received..................: 2.1 MB 15 kB/s

http\_req\_duration..............: avg=354ms min=12ms med=289ms

                                 max=1.9s  p(90)=789ms p(95)=1.2s

✓ http\_req\_duration.........: p(95) \< 2000ms ← PASSÉ

✓ http\_req\_failed...........: rate \< 5%      ← PASSÉ

✗ trajet\_list\_duration......: p(90) \> 1500ms ← RATÉ → optimiser la requête

---

## 8\. Priorité 6 — Tests End-to-End (Playwright)

### 8.1 Installation

\# Depuis le dossier frontend/

npm install \--save-dev @playwright/test

\# Télécharger les navigateurs (Chrome, Firefox, Safari)

npx playwright install

\# Fichier de configuration

npx playwright init  \# → crée playwright.config.ts

### 8.2 Exemple de test E2E LogiWay

**Fichier : `e2e/auth.spec.ts`**

import { test, expect } from '@playwright/test';

/\*\*

 \* Tests E2E — Scénarios complets navigateur

 \* Simulent un vrai utilisateur sur l'interface LogiWay

 \*/

test.describe('Authentification LogiWay', () \=\> {

  test.beforeEach(async ({ page }) \=\> {

    await page.goto('http://localhost:4200/login');

  });

  test('Login SuperAdmin → accès dashboard global', async ({ page }) \=\> {

    // Remplir le formulaire de login

    await page.fill('\[data-testid="email-input"\]', 'admin@logiway.com');

    await page.fill('\[data-testid="password-input"\]', 'Admin@2025');

    await page.click('\[data-testid="login-button"\]');

    // Attendre la redirection

    await page.waitForURL('\*\*/dashboard');

    // Vérifier que le dashboard SuperAdmin est affiché

    await expect(page.locator('\[data-testid="superadmin-dashboard"\]'))

      .toBeVisible();

    // Vérifier la présence des KPIs

    await expect(page.locator('\[data-testid="kpi-trajets-actifs"\]'))

      .toBeVisible();

  });

  test('Login Chauffeur → accès espace cockpit uniquement', async ({ page }) \=\> {

    await page.fill('\[data-testid="email-input"\]', 'chauffeur@test.com');

    await page.fill('\[data-testid="password-input"\]', 'Chauffeur@2025');

    await page.click('\[data-testid="login-button"\]');

    await page.waitForURL('\*\*/chauffeur/cockpit');

    // Le chauffeur ne doit PAS voir le menu admin

    await expect(page.locator('\[data-testid="admin-menu"\]'))

      .not.toBeVisible();

  });

  test('Mauvais identifiants → message d\\'erreur', async ({ page }) \=\> {

    await page.fill('\[data-testid="email-input"\]', 'faux@email.com');

    await page.fill('\[data-testid="password-input"\]', 'mauvais');

    await page.click('\[data-testid="login-button"\]');

    await expect(page.locator('.error-message'))

      .toContainText('Identifiants invalides');

  });

});

test.describe('Scénario complet — Créer une réclamation', () \=\> {

  test.beforeEach(async ({ page }) \=\> {

    // Se connecter en tant que chauffeur

    await page.goto('http://localhost:4200/login');

    await page.fill('\[data-testid="email-input"\]', 'chauffeur@test.com');

    await page.fill('\[data-testid="password-input"\]', 'Chauffeur@2025');

    await page.click('\[data-testid="login-button"\]');

    await page.waitForURL('\*\*/cockpit');

  });

  test('Créer réclamation valide → confirmation', async ({ page }) \=\> {

    await page.click('\[data-testid="nav-reclamations"\]');

    await page.click('\[data-testid="btn-nouvelle-reclamation"\]');

    await page.fill('\[data-testid="sujet-input"\]',

      'Panne de frein véhicule VL-42');

    await page.fill('\[data-testid="description-input"\]',

      'Le camion 42 présente une panne de frein urgente sur la route nationale');

    await page.selectOption('\[data-testid="priorite-select"\]', 'HAUTE');

    await page.click('\[data-testid="submit-reclamation"\]');

    // Vérifier le message de succès

    await expect(page.locator('.success-toast'))

      .toContainText('Réclamation envoyée avec succès');

  });

  test('Réclamation hors-sujet → message d\\'erreur IA', async ({ page }) \=\> {

    await page.click('\[data-testid="nav-reclamations"\]');

    await page.click('\[data-testid="btn-nouvelle-reclamation"\]');

    await page.fill('\[data-testid="description-input"\]',

      'J\\'ai mal à la tête aujourd\\'hui');

    await expect(page.locator('.ai-validation-error'))

      .toContainText('ne correspond pas au domaine');

  });

});

### 8.3 Commandes Playwright

\# Lancer tous les tests E2E (navigateur headless)

npx playwright test

\# Mode debug avec navigateur visible

npx playwright test \--headed

\# Rapport HTML interactif

npx playwright test \--reporter=html

\# → Ouvre automatiquement le rapport dans le navigateur

\# Tester un seul fichier

npx playwright test e2e/auth.spec.ts

\# Générer des tests automatiquement par enregistrement

npx playwright codegen http://localhost:4200

---

## 9\. Résultats et rapports attendus

### 9.1 Tableau de bord de la couverture de code

Après avoir exécuté les tests, tu obtiens :

Backend Spring Boot (JaCoCo) :

┌──────────────────────────────┬──────────┬──────────┬──────────┐

│ Package                      │ Classes  │ Méthodes │  Lignes  │

├──────────────────────────────┼──────────┼──────────┼──────────┤

│ services.impl                │   92%    │   87%    │   85%    │

│ controllers                  │   78%    │   72%    │   70%    │

│ repositories                 │   95%    │   91%    │   93%    │

│ entities                     │   100%   │   100%   │   100%   │

└──────────────────────────────┴──────────┴──────────┴──────────┘

Python Flask (pytest-cov) :

app\_simple.py .............. 91% covered

├── evaluate\_toxicity\_simple: 100%

├── evaluate\_semantic\_simple: 100%

└── Endpoints HTTP: 78%

Angular (Istanbul) :

src/app .................... 76% covered

├── Guards: 95%

├── Services: 82%

└── Components: 68%

### 9.2 Seuils recommandés pour LogiWay

| Couche | Couverture minimale | Raison |
| :---- | :---- | :---- |
| Services Spring Boot | **80%** | Logique métier critique |
| Règles IA Python | **90%** | Sécurité de la validation |
| Guards Angular | **90%** | Sécurité accès par rôle |
| Composants Angular | **60%** | Acceptable pour UI |
| Performance (p95) | **\< 2s** | Expérience utilisateur |

---

## 10\. Ordre d'exécution recommandé

### Phase 1 — Semaine 1 (fondations)

\# Jour 1-2 : Tests unitaires backend

cd backend && mvn test

\# Jour 3 : Tests unitaires Python

cd reclamation-ai-service && pytest \-v \--cov

\# Jour 4-5 : Tests unitaires Angular

cd frontend && ng test \--watch=false \--code-coverage

### Phase 2 — Semaine 2 (intégration)

\# Nécessite Docker

cd backend && mvn verify \-P integration-tests

\# Vérifier les rapports

open target/site/jacoco/index.html  \# Couverture Java

open htmlcov/index.html             \# Couverture Python

open coverage/logiway/index.html    \# Couverture Angular

### Phase 3 — Semaine 3 (qualité)

\# Performance (backend démarré obligatoire)

k6 run \-e JWT\_TOKEN="..." tests-perf/logiway\_load\_test.js

\# E2E (frontend \+ backend démarrés)

npx playwright test \--reporter=html

### Script d'automatisation globale

**Fichier : `run-tests.sh`**

\#\!/bin/bash

\# Lance tous les tests LogiWay dans l'ordre

echo "═══ LogiWay — Pipeline de Tests ═══"

FAILED=0

echo "▶ \[1/4\] Tests unitaires Backend..."

cd backend && mvn test \-q && echo "✓ Backend OK" || { echo "✗ Backend FAILED"; FAILED=1; }

echo "▶ \[2/4\] Tests Python IA..."

cd ../reclamation-ai-service && pytest \-q && echo "✓ Python OK" || { echo "✗ Python FAILED"; FAILED=1; }

echo "▶ \[3/4\] Tests Angular..."

cd ../frontend && ng test \--watch=false \--browsers=ChromeHeadless \-q && echo "✓ Angular OK" || { echo "✗ Angular FAILED"; FAILED=1; }

echo "▶ \[4/4\] Tests Performance (optionnel)..."

cd .. && k6 run \-q tests-perf/logiway\_load\_test.js && echo "✓ Performance OK" || echo "⚠ Performance non exécuté"

echo ""

if \[ $FAILED \-eq 0 \]; then

  echo "✅ Tous les tests ont réussi — LogiWay prêt pour la phase DevOps"

else

  echo "❌ Des tests ont échoué — corriger avant de passer à DevOps"

  exit 1

fi

chmod \+x run-tests.sh

./run-tests.sh

---

## Annexe — Résumé des dépendances à installer

| Outil | Commande | Pour qui |
| :---- | :---- | :---- |
| JUnit 5 \+ Mockito | Déjà dans Spring Boot Starter Test | Backend Java |
| Testcontainers | Ajouter dans pom.xml | Tests Intégration |
| pytest \+ pytest-cov | `pip install pytest pytest-cov pytest-flask` | Python Flask |
| Angular Testing | Déjà dans Angular CLI | Frontend |
| k6 | `brew install k6` ou `apt install k6` | Performance |
| Playwright | `npm install @playwright/test` | E2E |

---

*Guide rédigé pour LogiWay — Kossay Boubaker — ExypnoTech Engineering Services* *Prochaine étape après les tests : Phase DevOps (CI/CD, Docker, déploiement automatisé)*  
