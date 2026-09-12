# LogiWay — Rapport de Projet : Système Intelligent de Gestion de Flotte et Optimisation Logistique

> **Projet PFE** — Dashboard de Livraisons & Trajets | Version Intelligence Logistique Avancée  
> **Encadrant** : [Nom de l'encadrant]  
> **Réalisé par** : [Votre nom]

---

## Table des Matières

1. [Problématique](#1-problématique)
2. [Étude de l'Existant](#2-étude-de-lexistant)
3. [Architecture Physique et Logique](#3-architecture-physique-et-logique)
4. [Migration MERN → Spring Boot + Angular](#4-migration-mern--spring-boot--angular)
5. [Besoins Fonctionnels](#5-besoins-fonctionnels)
6. [Besoins Non Fonctionnels](#6-besoins-non-fonctionnels)
7. [Tâches Réalisées](#7-tâches-réalisées)
8. [Tâches en Cours](#8-tâches-en-cours)
9. [Perspectives et Améliorations Futures](#9-perspectives-et-améliorations-futures)
10. [Stack Technologique](#10-stack-technologique)

---

## 1. Problématique

### 1.1 Contexte

Les entreprises de transport routier et de logistique font face à des défis majeurs :

- **Gestion de flotte inefficace** : suivi manuel des véhicules, absence de visibilité en temps réel.
- **Planification de tournées sous-optimale** : itinéraires choisis par habitude, sans considération des données de trafic, météo, ou consommation carburant.
- **Non-respect des pauses réglementaires** : les conducteurs oublient ou ignorent les obligations de pause, exposant l'entreprise à des amendes (jusqu'à 1 500 € par infraction) et des risques de sécurité.
- **Absence d'analyse prédictive** : impossible d'anticiper les retards, les pannes, ou la demande future.
- **Empreinte carbone non maîtrisée** : aucune mesure fiable des émissions CO₂ par trajet.

### 1.2 Problématique Centrale

**Comment concevoir et développer un système intelligent de gestion de flotte et d'optimisation logistique qui intègre le suivi GPS en temps réel, la génération automatique de pauses réglementaires, l'optimisation des tournées, la prédiction des retards, et un tableau de bord analytique avancé — le tout avec une architecture modulaire, évolutive et sécurisée ?**

### 1.3 Objectifs

1. Suivi en temps réel des véhicules via GPS et protocole SSE.
2. Génération automatique des pauses réglementaires (temps de conduite, repos).
3. Optimisation des tournées (rapidité, coût, écologie).
4. Tableau de bord analytique Power BI–style (KPIs, graphiques, carte interactive).
5. IA pour la prédiction des retards et l'optimisation des itinéraires.
6. Calcul et suivi de l'empreinte carbone.

---

## 2. Étude de l'Existant

### 2.1 Solutions du Marché

| Solution | Fonctionnalités | Limitations |
|---|---|---|
| **Wialon** | GPS tracking, reporting, géofencing | Pas d'IA prédictive, pas de gestion des pauses réglementaires françaises |
| **Samsara** | IoT, dashcams, suivi temps réel | Abonnement coûteux, dépendance cloud, pas d'optimisation de tournée intelligente |
| **FleetComplete** | Optimisation d'itinéraires, conformité | Interface complexe, API fermée |
| **OptimoRoute** | Planification intelligente | Pas de suivi GPS temps réel, pas de module pauses |
| **TachoTech** | Gestion des chronotachygraphes | Uniquement conformité, pas de dashboard analytique |

### 2.2 Lacunes Identifiées

- **Aucune solution open-source complète** ne couvre suivi GPS + pauses réglementaires + optimisation IA + dashboard analytique.
- **Pas d'intégration météo** dans les solutions existantes.
- **Absence de chatbot IA** contextuel pour les conducteurs et gestionnaires.
- **Données fragmentées** : aucune solution ne centralise trajets, véhicules, conducteurs, pauses, météo, et émissions CO₂.

### 2.3 Notre Approche

LogiWay se positionne comme une solution **intégrée, open-source, multi-couche** combinant backend Spring Boot, frontend Angular 19 avec dashboard Power BI–style, microservice IA Python pour les pauses, simulateur GPS OSRM, chatbot Ollama, et module CO₂.

---

## 3. Architecture Physique et Logique

### 3.1 Architecture Logique

> *[Diagramme d'architecture logique à insérer ici — couches : Présentation (Angular), Application (Spring Boot), Domaine (Services + Entités), Infrastructure (MySQL, Keycloak, OSRM, Ollama, Pause AI)]*

### 3.2 Architecture Physique (Déploiement)

> *[Diagramme de déploiement à insérer ici — Client Web → Serveur Angular → Backend Spring Boot → MySQL / Keycloak / Services externes : OSRM, Ollama, Pause AI, Météo]*

### 3.3 Flux de Données Principaux

| Flux | Parcours |
|---|---|
| **GPS Temps Réel** | Simulateur Python → OSRM → POST position → Backend SSE → Frontend carte |
| **Dashboard Analytique** | Frontend → GET /api/trajets → Backend → MySQL → JSON → Graphiques + KPIs |
| **Pauses Réglementaires** | Backend → Microservice Python → Prédictions → Stockage → Frontend |
| **Chatbot IA** | Question utilisateur → Ollama (qwen3:8b) → MCP Tools → Réponse contextuelle |

---

## 4. Migration MERN → Spring Boot + Angular

### 4.1 Contexte de la Migration

Le projet LogiWay a été initialement développé sur la stack **MERN** (MongoDB, Express.js, React, Node.js). Dans le cadre de ce PFE, une migration complète vers **Spring Boot + Angular** a été réalisée.

### 4.2 Justification

| Critère | MERN (Avant) | Spring Boot + Angular (Après) |
|---|---|---|
| **Performance** | Node.js monothread | Java 17 multithread, JVM optimisée |
| **Sécurité** | JWT artisanal | Keycloak OAuth2, RBAC, OIDC |
| **Maintenabilité** | Peu structuré | Architecture en couches, interfaces, injection de dépendances |
| **Type safety** | JavaScript dynamique | TypeScript + Java typé |
| **Documentation API** | Manuelle | Springdoc OpenAPI automatique |
| **Écosystème** | Packages NPM instables | Spring Boot mature, support longue durée |
| **Scalabilité** | Horizontale complexe | Scalabilité native, thread pool |

### 4.3 Impact

- **25 services métier** Spring Boot vs 8 fichiers Express.
- **16 entités JPA** avec schéma relationnel MySQL vs MongoDB sans schéma.
- **18 contrôleurs REST** avec validation, sécurité, documentation automatique.
- **Frontend Angular 19** avec modules core/features/shared, guards, interceptors.
- **Dashboard Power BI–style** avec Chart.js et Leaflet.

---

## 5. Besoins Fonctionnels

### 5.1 Gestion des Utilisateurs et Authentification

| ID | Besoin | Statut |
|---|---|---|
| F-01 | Authentification via Keycloak (OAuth2) | ✅ Réalisé |
| F-02 | Rôles : SUPERADMIN, MANAGER, CHAUFFEUR | ✅ Réalisé |
| F-03 | Inscription avec validation email | ✅ Réalisé |
| F-04 | Réinitialisation de mot de passe | ✅ Réalisé |
| F-05 | Profil utilisateur modifiable | ✅ Réalisé |

### 5.2 Gestion de Flotte

| ID | Besoin | Statut |
|---|---|---|
| F-06 | CRUD véhicules (immatriculation, modèle, marque, statut) | ✅ Réalisé |
| F-07 | Affectation chauffeur ↔ véhicule | ✅ Réalisé |
| F-08 | Suivi kilométrage et entretien | ✅ Réalisé |
| F-09 | Consommation carburant (L/100km) par véhicule | ✅ Réalisé |

### 5.3 Gestion des Trajets

| ID | Besoin | Statut |
|---|---|---|
| F-10 | Création de trajet (origine, destination, véhicule, chauffeur) | ✅ Réalisé |
| F-11 | Démarrage / fin de trajet | ✅ Réalisé |
| F-12 | Suivi position GPS temps réel (SSE) | ✅ Réalisé |
| F-13 | Calcul automatique de la distance via OSRM | ✅ Réalisé |
| F-14 | Durée estimée vs durée réelle | ✅ Réalisé |
| F-15 | Type d'optimisation (Rapide, Économique, Écologique) | ✅ Réalisé |
| F-16 | **Génération automatique des pauses réglementaires** | 🔄 Bug (tests écrits, voir §7) |
| F-17 | Carte interactive avec tracé d'itinéraire | ✅ Réalisé |
| F-18 | Conditions météo intégrées au trajet | ✅ Réalisé |

### 5.4 Dashboard Analytique — Power BI Intelligent

| ID | Besoin | Statut |
|---|---|---|
| F-19 | **KPIs intelligents** : 6 indicateurs data-driven (total, distance, durée, ponctualité, complétion, actifs) | ✅ Réalisé |
| F-20 | **Graphique d'évolution** temporelle avec toggle Jour/Semaine/Mois | ✅ Réalisé |
| F-21 | **Carte géographique interactive** Leaflet avec points départ/destination, lignes codées par retard, heatmap | ✅ Réalisé |
| F-22 | **Analyse des retards** : donut chart 4 catégories | ✅ Réalisé |
| F-23 | **Analyse des chauffeurs** : statistiques par conducteur, top performer | ✅ Réalisé |
| F-24 | **Analyse des véhicules** : modèle, plaque, kilomètres, durée moyenne | ✅ Réalisé |
| F-25 | **Analyse des optimisations** : tableau comparatif Rapide/Économique/Écologique | ✅ Réalisé |
| F-26 | **Indicateurs extrêmes** : trajet +long, +court, +rapide, +retardé | ✅ Réalisé |
| F-27 | **Alertes intelligentes** : ponctualité <80%, retards croissants, saturation | ✅ Réalisé |
| F-28 | **Prédictions** : moyenne mobile 30j (trajets, distance, destinations, risque retard) | ✅ Réalisé |
| F-29 | **Score de santé logistique** : jauge 0-100, 5 facteurs | ✅ Réalisé |
| F-30 | **Score performance / trajet** : 0-100 avec barre continue + badge | ✅ Réalisé |
| F-31 | **Synchronisation par clic** : clic graphique → filtrage dashboard complet | ✅ Réalisé |
| F-32 | **Consommation carburant** intégrée au score de performance | ✅ Réalisé |

### 5.5 Chatbot IA

| ID | Besoin | Statut |
|---|---|---|
| F-33 | Assistant IA contextuel (Ollama + MCP Tools) | 🔄 En cours |
| F-34 | Questions sur trajets, véhicules, conducteurs, congés | 🔄 En cours |
| F-35 | Requêtes SQL temps réel via EntityManager | 🔄 En cours |

### 5.6 Gestion des Congés

| ID | Besoin | Statut |
|---|---|---|
| F-36 | Demande de congé (chauffeur → manager) | ✅ Réalisé |
| F-37 | Validation / refus par le manager | ✅ Réalisé |
| F-38 | Synchronisation Google Calendar | ✅ Réalisé |

### 5.7 Messagerie et Notifications

| ID | Besoin | Statut |
|---|---|---|
| F-39 | Messagerie temps réel (WebSocket) | ✅ Réalisé |
| F-40 | Notifications SSE (position GPS, alertes) | ✅ Réalisé |
| F-41 | Centre de notifications | ✅ Réalisé |

### 5.8 Rapports et Export

| ID | Besoin | Statut |
|---|---|---|
| F-42 | Génération de rapports PDF | ✅ Réalisé |
| F-43 | Export des statistiques | ✅ Réalisé |

### 5.9 Simulation GPS

| ID | Besoin | Statut |
|---|---|---|
| F-44 | Simulation de déplacement sur itinéraire OSRM | ✅ Réalisé |
| F-45 | Envoi des positions au backend | ✅ Réalisé |
| F-46 | Calcul d'empreinte carbone (CO₂ par trajet) | ✅ Réalisé |
| F-47 | Simulation avec gestion des pauses | ✅ Réalisé |

---

## 6. Besoins Non Fonctionnels

| ID | Besoin | Priorité |
|---|---|---|
| NF-01 | **Sécurité** : Keycloak OAuth2, JWT, RBAC, HTTPS | Haute |
| NF-02 | **Performance** : API < 500ms, SSE temps réel | Haute |
| NF-03 | **Disponibilité** : Architecture Docker, modulaire | Haute |
| NF-04 | **Maintenabilité** : Interfaces + implémentations séparées | Haute |
| NF-05 | **UX/Design** : Dashboard Power BI–style, dark theme, animations | Haute |
| NF-06 | **Compatibilité** : Angular 19, responsive, navigateurs récents | Haute |
| NF-07 | **Tests** : JUnit backend, Pytest exploration bugs | Haute |
| NF-08 | **Documentation** : README, rapports, code commenté (français) | Moyenne |

---

## 7. Tâches Réalisées

### 7.1 Dashboard Power BI — 14 Modules Intelligents

> *[Capture d'écran du dashboard à insérer ici]*

Développement complet d'un dashboard analytics de type Power BI avec 14 fonctionnalités interconnectées :

| Module | Description |
|---|---|
| **KPIs** | 6 compteurs data-driven (trajets, distance, durée, ponctualité, complétion, actifs) avec tendances |
| **Évolution activité** | Graphique d'aire 3 couches (trajets, distance, ponctualité) avec granularité jour/semaine/mois |
| **Optimisation** | Donut chart + tableau comparatif (Rapide/Économique/Écologique) avec meilleur type détecté |
| **Carte intelligente** | Leaflet style Google Ads : points bleu/vert, lignes colorées, heatmap, épaisseur proportionnelle |
| **Retards** | Donut chart 4 niveaux (à l'heure, léger, moyen, critique) |
| **Analyse Temporelle** | Graphique area avec toggle Jour / Semaine / Mois |
| **Chauffeurs** | Tableau stats par conducteur avec nom/prénom, badge 🥇 meilleur du mois |
| **Véhicules** | Tableau stats par véhicule (modèle, plaque, km, durée), plus utilisé détecté |
| **Indicateurs extrêmes** | Trajet +long, +court, +rapide, +retardé ; destinations + et - utilisées |
| **Alertes** | Générées auto : ponctualité <80%, retards croissants, saturation destination, véhicule sous-utilisé |
| **Prédictions** | Moyenne mobile 30j : trajets à venir, distance, destinations probables, risque retard |
| **Score santé logistique** | Jauge 0-100 avec 5 facteurs détaillés |
| **Score performance** | 0-100 par trajet avec barre continue + badge (Excellent/Bon/Moyen/Faible) |
| **Synchronisation clic** | Tout clic sur graphique → filtre et recalcule complet du dashboard |

### 7.2 Intégration Carburant Intelligent

- Champ `fuelConsumption` (L/100km) ajouté aux véhicules.
- Score efficacité carburant par trajet : distance × consommation / 100.
- Pénalités : trajets courts (moteur froid), bouchons (ratio durée >1.5), vitesse inefficace.
- Poids de 20% dans le score de performance global.

### 7.3 Bug Pauses Réglementaires — Tests d'Exploration

**Bug** : `createTrajet()` n'appelle pas `genererPauses()` → pauses invisibles avant clic "Démarrer".

**4 tests Python implémentés** (Pytest) :

| Test | Objet | Comportement |
|---|---|---|
| `test_pauses_not_generated_on_trip_creation` | Prouve le bug | Échoue sur code non corrigé |
| `test_logs_missing_pause_generation` | Vérifie logs absents | Échoue sur code non corrigé |
| `test_short_trips_no_pauses_on_creation` | Vérifie seuil 180min | Passe (comportement correct) |
| `test_pauses_generated_only_on_trip_start` | Documente contournement | Documente l'état actuel |

### 7.4 Simulateur GPS

- Simulation sur itinéraire OSRM réel (public ou local Docker).
- Envoi positions → Backend SSE → Frontend temps réel.
- Gestion des pauses pendant simulation.
- Calcul émissions CO₂ (poids × distance × vitesse).
- Intégration météo (ajustement vitesse et consommation).
- Dockerfiles + scripts PowerShell.

### 7.5 Infrastructure

- **Docker Compose** : service pause-ai avec healthcheck.
- **Keycloak** : configuration automatisée (kc_setup.ps1).
- **OSRM** : données cartographiques et profils de routage.
- **Spring Boot 3.2** : 25 services, 16 entités, 18 contrôleurs, OpenAPI.

### 7.6 Migration MERN → Spring Boot + Angular

- Passage de MongoDB à MySQL (schéma relationnel 16 tables).
- React → Angular 19 avec architecture modulaire (core/features/shared).
- Express.js → Spring Boot (couches controller/service/repository/entity).
- Sécurité renforcée : Keycloak OAuth2 vs JWT artisanal.
- Dashboard React → Power BI–style avec Chart.js + Leaflet.

---

## 8. Tâches en Cours

| Tâche | Description | Priorité | Avancement |
|---|---|---|---|
| **Fix Bug Pauses** | Ajouter `genererPauses()` dans `createTrajet()` | Haute | Tests écrits, correctif à implémenter |
| **Pause AI Service** | Microservice Python ML prédiction pauses (scikit-learn) | Haute | 🟡 En cours de finalisation — API, Docker, modèle à entraîner |
| **Chatbot IA** | Assistant Ollama + MCP Tools (16 outils métier) | Moyenne | 🟡 Architecture terminée, raffinement en cours |
| **Optimisation Performance** | Temps réponse dashboard pour grands volumes | Moyenne | Analyse en cours |
| **Tests Dashboard** | Tests unitaires composants Angular | Basse | Non démarré |

### 8.1 Pause AI Service — Détails

Microservice Python de prédiction intelligente des pauses réglementaires :

1. **Entrée** : durée trajet, heure départ, météo, historique conducteur, type marchandise
2. **Modèle ML** : classifieur binaire (pause nécessaire ?) + régression (meilleur moment)
3. **Sortie** : pauses recommandées (type, durée, position géographique)
4. **API** : `POST /api/pauses/predict`
5. **État** : Dockerfile + structure prêts, entraînement du modèle en attente de données historiques

---

## 9. Perspectives et Améliorations Futures

| Idée | Description | Complexité |
|---|---|---|
| **Détection Anomalies Conduite** | Analyse GPS → freinages brusques, virages dangereux (accéléromètre) | Élevée |
| **Prédiction Pannes Véhicule** | ML sur historique entretien + kilométrage → maintenance préventive | Élevée |
| **Score Éco-Conduite Temps Réel** | Notation conducteur basée sur accélérations, vitesse, freinages (OBD-II) | Élevée |
| **Optimisation Carburant Dynamique** | Ajustement itinéraire temps réel selon trafic pour minimiser consommation | Moyenne |
| **Géofencing Intelligent** | Zones virtuelles avec alertes automatiques (entrée/sortie) | Faible |
| **Export PDF Avancé** | Rapports personnalisables avec graphiques et tableaux | Faible |
| **Application Mobile** | Version mobile pour conducteurs (suivi trajet, notifications) | Élevée |

---

## 10. Stack Technologique

### Backend

| Technologie | Version | Usage |
|---|---|---|
| Java | 17 | Langage |
| Spring Boot | 3.2.2 | Framework REST |
| Spring Security + OAuth2 | 6.x | Keycloak |
| Spring Data JPA | 3.x | ORM MySQL |
| MySQL | 8.x | Base de données |
| Keycloak | 22+ | IAM / SSO |
| Lombok | 1.18 | Boilerplate reduction |
| Springdoc OpenAPI | 2.3.0 | Documentation API |
| WebSocket / SSE | — | Temps réel |
| Spring Boot Mail | — | Emails |

### Frontend

| Technologie | Version | Usage |
|---|---|---|
| Angular | 19.1 | Framework |
| Angular Material | 19.1 | UI Components |
| Kendo UI | 23.0.1 | Grid, inputs, i18n |
| Chart.js + ng2-charts | 4.5.1 / 8.0.0 | Graphiques |
| Leaflet | 1.9.4 | Cartes |
| html2canvas + jsPDF | — | Export PDF |
| RxJS | 7.8 | Réactif |

### Simulation & IA

| Technologie | Usage |
|---|---|
| Python 3.10+ | Simulateur GPS, CO₂ |
| OSRM | Routage |
| Ollama + qwen3:8b | Chatbot IA local |
| scikit-learn | Pause AI Service (en cours) |

### DevOps

| Technologie | Usage |
|---|---|
| Docker / Compose | Conteneurisation |
| Maven | Build backend |
| Angular CLI / npm | Build frontend |
| Git | Versioning |

---

> **Document généré le** : 25/06/2026  
> **Projet** : LogiWay — Système Intelligent de Gestion de Flotte et Optimisation Logistique  
> **Statut global** : 🟡 Noyau fonctionnel terminé — Modules IA en cours de finalisation
