# Rapport Analytics & Tableau de Bord KPIs — Plateforme LogiWay

**Module :** Dashboard Analytique & Indicateurs de Performance  
**Version :** LogiWay v3.1  
**Accès :** SUPERADMIN (complet) · MANAGER (lecture entreprise)  
**Technologie de visualisation :** Chart.js · Angular 19 · ng2-charts

---

## Introduction

Le module Analytics de LogiWay offre une vision globale et en temps réel de l'ensemble des opérations logistiques. Il centralise les données provenant de tous les modules de la plateforme — trajets, véhicules, réclamations, congés, utilisateurs — pour les présenter sous forme d'indicateurs clés et de graphiques interactifs.

L'objectif est de permettre aux décideurs (SUPERADMIN et MANAGER) de :
- Détecter rapidement les anomalies opérationnelles
- Mesurer la performance de la flotte et des chauffeurs
- Anticiper les problèmes réglementaires (pauses CE 561/2006)
- Prendre des décisions basées sur des données réelles et actualisées

---

## 1. Interface Analytics — Dashboard SUPERADMIN / MANAGER

### Accès et périmètre

| Rôle | Périmètre des données |
|---|---|
| SUPERADMIN | Toutes les entreprises, tous les chauffeurs, toutes les flottes |
| MANAGER | Uniquement les données de son entreprise |
| DRIVER | Pas d'accès — dispose de son propre Cockpit personnel |

---

## 2. Section A — KPI Cards (8 indicateurs principaux)

Les KPI Cards sont affichées en haut du dashboard. Chacune présente un indicateur synthétique avec des sous-valeurs de détail. Elles permettent une lecture rapide de l'état opérationnel sans avoir à analyser les graphiques.

---

### KPI 1 — Chauffeurs Actifs

**Objectif :** Connaître immédiatement la disponibilité humaine de la flotte.

**Indicateurs affichés :**
- Nombre de chauffeurs actifs en service
- Nombre total de chauffeurs enregistrés
- Pourcentage de disponibilité

**Utilité :** Un manager ou superadmin peut identifier en un coup d'œil si l'effectif est suffisant pour couvrir les missions du jour. Un taux faible signale un besoin de recrutement ou un problème d'absences.

---

### KPI 2 — Véhicules en Service

**Objectif :** Suivre l'état de la flotte de véhicules en temps réel.

**Indicateurs affichés :**
- Nombre de véhicules EN_SERVICE (opérationnels)
- Nombre de véhicules EN_MAINTENANCE (immobilisés temporairement)
- Nombre de véhicules HORS_SERVICE (indisponibles)
- Total de la flotte

**Utilité :** Détecter les immobilisations imprévues, anticiper les maintenances planifiées, et s'assurer que la capacité de la flotte correspond aux besoins opérationnels du jour.

---

### KPI 3 — Missions en Cours

**Objectif :** Avoir une vue instantanée de l'activité logistique en temps réel.

**Indicateurs affichés :**
- Nombre total de missions(trajets) en cours
- Missions à l'heure (respectant l'ETA prévu)
- Missions en retard (dépassant l'ETA prévu)
- Total des missions terminées (historique)

**Utilité :** Identifier immédiatement les livraisons problématiques pour intervenir (contacter le chauffeur, alerter le client, réorganiser les tournées).

---

### KPI 4 — Taux de Ponctualité

**Objectif :** Mesurer la qualité de service globale de la flotte.

**Indicateurs affichés :**
- Pourcentage de missions livrées à l'heure
- Représentation visuelle par jauge de progression

**Calcul :** (missions à l'heure / total missions en cours) × 100

**Utilité :** Indicateur de performance clé pour évaluer la fiabilité du service. Un taux en baisse déclenche une analyse des causes (trafic, planification insuffisante, pauses non respectées).

---

### KPI 5 — Congés en Attente

**Objectif :** Gérer les ressources humaines et anticiper les absences.

**Indicateurs affichés :**
- Nombre de demandes de congé EN_ATTENTE de validation
- Nombre de congés APPROUVÉS en cours ou à venir
- Nombre de demandes REFUSÉES

**Utilité :** Permettre au MANAGER , SUPERADMIN de ne pas oublier les demandes en attente qui bloquent les chauffeurs dans l'incertitude. Un nombre élevé de demandes en attente signale un retard dans la gestion RH.

---

### KPI 6 — Réclamations Ouvertes

**Objectif :** Suivre la qualité du service interne et la résolution des problèmes.

**Indicateurs affichés :**
- Nombre de réclamations EN_COURS (non résolues)
- Nombre de réclamations RÉSOLUES
- Total général des réclamations

**Utilité :** Un nombre élevé de réclamations ouvertes sans traitement signale un dysfonctionnement dans le suivi. Combiné avec la priorité (URGENT, HAUTE), cet indicateur aide à prioriser les actions du SUPERADMIN.

---

### KPI 7 — Utilisateurs Actifs

**Objectif :** Avoir une vue de la composition humaine de la plateforme.

**Indicateurs affichés :**
- Nombre d'administrateurs (SUPERADMIN)
- Nombre de managers (MANAGER)
- Nombre de chauffeurs (DRIVER)

**Utilité :** Suivi de la croissance de la plateforme et vérification de l'équilibre des rôles (ex. : ratio manager/chauffeur optimal pour la supervision).

---

### KPI 8 — Global Score Flotte

**Objectif :** Fournir un score synthétique unique représentant la santé globale de l'opération.

**Indicateurs affichés :**
- Score global sur 100 points (calculé par algorithme pondéré)

**Calcul pondéré :**
- Ponctualité globale : 35%
- Taux de disponibilité des véhicules : 25%
- Taux de missions réussies : 20%
- Score carburant (efficacité) : 10%
- Score incidents : 10%

**Utilité :** Indicateur de synthèse permettant de comparer les performances d'une période à l'autre, ou entre entreprises (vue SUPERADMIN). Un score en baisse déclenche une investigation sur les dimensions les plus dégradées.

---

## 3. Section B — Graphiques Analytiques (7 visualisations)

Les graphiques offrent une analyse temporelle et comparative des données. Ils sont interactifs — clic sur une légende pour masquer/afficher une série, survol pour les valeurs précises.

---

### Graphique 1 — Ponctualité des 12 derniers mois

**Type de graphique :** Stacked Bar Chart (barres empilées) + Line Chart (courbe de tendance)

**Objectif :** Analyser l'évolution de la ponctualité mois par mois sur une année complète.

**Données représentées :**
- Barres empilées : missions à l'heure / retard < 30min / retard > 30min
- Courbe superposée : pourcentage de ponctualité mensuel

**Utilité :**
Identifier les mois problématiques (pic de retards en été ? en hiver ?), détecter les tendances d'amélioration ou de dégradation, corréler avec des événements externes (vacances scolaires, travaux routiers). C'est l'indicateur de qualité de service le plus important du dashboard.

---

### Graphique 2 — Flux des Missions (Tendance)

**Type de graphique :** Area Chart (graphique en aires)

**Objectif :** Visualiser le volume d'activité et son évolution dans le temps.

**Données représentées :**
- Aire 1 : Missions terminées (volume réussi)
- Aire 2 : Missions en retard (volume problématique)

**Utilité :**
Identifier les pics d'activité qui ont pu saturer la flotte et provoquer des retards. Aider à la planification des ressources pour les périodes de forte activité anticipées. Mesurer si les améliorations opérationnelles ont un impact réel sur le volume traité.

---

### Graphique 3 — Incidents du Mois

**Type de graphique :** Donut Chart (graphique en anneau)

**Objectif :** Comprendre la nature et la répartition des incidents survenus dans le mois.

**Catégories représentées :**
- Accidents
- Pannes mécaniques
- Embouteillages et problèmes de trafic
- Contrôles routiers
- Autres incidents

**Utilité :**
Identifier le type d'incident le plus fréquent pour cibler les actions correctives. Si les pannes dominent → renforcer la maintenance préventive. Si les embouteillages dominent → optimiser les itinéraires ou horaires de départ. Ce graphique alimente directement la prise de décision opérationnelle.

---

### Graphique 4 — Consommation Carburant

**Type de graphique :** Gauge Chart (jauge demi-cercle)

**Objectif :** Mesurer l'efficacité énergétique de la flotte par rapport à un objectif cible.

**Données représentées :**
- Consommation moyenne mesurée (L/100km)
- Cible de consommation définie (L/100km)
- Écart entre réel et cible
- Nombre de véhicules avec alerte de carburant bas

**Utilité :**
Contrôler les coûts opérationnels liés au carburant et détecter les véhicules anormalement consommateurs (problème mécanique, surcharge). Les alertes de niveau bas préviennent les pannes en mission. Indicateur directement lié à la rentabilité de l'entreprise.

---

### Graphique 5 — Capacité de Charge par Type de Véhicule

**Type de graphique :** Donut Chart (graphique en anneau)

**Objectif :** Analyser l'utilisation de la capacité de chargement selon les catégories de véhicules.

**Catégories de véhicules :**
- Poids lourd (capacité ≥ 7,5 tonnes)
- Van (3,5 à 7,5 tonnes)
- Petit véhicule (< 3,5 tonnes)

**Données représentées :**
- Taux de remplissage minimum, moyen et maximum par catégorie

**Utilité :**
Identifier si les véhicules sont sous-utilisés (tournées non optimisées, trop de véhicules pour peu de marchandise) ou sur-utilisés (risque de surcharge légale). Optimiser la répartition des missions selon la capacité réelle des véhicules disponibles. Indicateur clé pour la rentabilité et la conformité réglementaire.

---

### Graphique 6 — Répartition des Rôles Utilisateurs

**Type de graphique :** Donut Chart (graphique en anneau)

**Objectif :** Visualiser la composition de la communauté d'utilisateurs de la plateforme.

**Données représentées :**
- Proportion SUPERADMIN / MANAGER / DRIVER
- Statut actif pour chaque rôle

**Utilité :**
Suivre la croissance de la plateforme, s'assurer d'un ratio équilibré entre encadrants (managers) et chauffeurs, et identifier les besoins en recrutement par rôle. Vue particulièrement pertinente pour le SUPERADMIN qui gère plusieurs entreprises.

---

### Graphique 7 — Congés par Statut

**Type de graphique :** Horizontal Bar Chart (barres horizontales)

**Objectif :** Visualiser la distribution des demandes de congé selon leur état de traitement.

**Statuts représentés :**
- EN_ATTENTE (demandes non encore traitées)
- APPROUVÉ (congés validés)
- REFUSÉ (demandes rejetées)
- ANNULÉ (demandes annulées par le demandeur)

**Utilité :**
Mesurer le backlog RH (demandes en attente) et la politique d'approbation (ratio approuvé/refusé). Un nombre élevé de demandes EN_ATTENTE indique un retard de traitement qui impacte la planification des missions. Ce graphique aide le MANAGER à prioriser ses tâches administratives.

---

## 4. Section C — Classement des Chauffeurs (Top 10)

### Objectif

Identifier et récompenser les chauffeurs les plus performants, et détecter ceux qui nécessitent un accompagnement. Le classement est calculé par un algorithme de scoring multi-critères.

### Indicateurs par chauffeur

| Indicateur | Description |
|---|---|
| Rang | Position dans le classement (1 à 10) |
| Score de performance | Note globale sur 100 points |
| Missions complétées | Nombre de livraisons terminées dans la période |
| Taux de ponctualité | % de livraisons effectuées dans les délais |
| Heures de conduite | Total d'heures de conduite calculé sur les trajets |
| Score de disponibilité | Disponibilité effective vs potentielle |
| Nombre d'incidents | Incidents signalés (malus sur le score) |
| Badge de performance | Étiquette qualitative selon le score |

### Badges de performance

| Badge | Seuil de score | Signification |
|---|---|---|
| Excellent | > 85 / 100 | Chauffeur exemplaire, modèle à valoriser |
| Bon | 70 – 85 / 100 | Performance satisfaisante, quelques axes d'amélioration |
| Normal | 50 – 70 / 100 | Performance dans la moyenne, suivi recommandé |
| À améliorer | < 50 / 100 | Difficultés identifiées, accompagnement nécessaire |

### Composition du score (pondération)

| Critère | Poids |
|---|---|
| Ponctualité des livraisons | 35% |
| Volume de missions complétées | 20% |
| Heures de conduite effectuées | 15% |
| Disponibilité et assiduité | 15% |
| Expérience (ancienneté) | 15% |
| Malus incidents | -3 pts par incident |

### Utilité

Ce classement permet de mettre en place une politique de reconnaissance des chauffeurs performants et d'identifier rapidement les situations nécessitant un suivi RH ou une formation. Les médailles (or, argent, bronze) pour les 3 premiers renforcent la dimension gamification et motivation.

---

## 5. Section D — Tableaux de Statistiques Détaillées

### Tableau Réclamations par Statut

**Objectif :** Synthèse rapide de l'état du traitement des réclamations.

| Statut | Description |
|---|---|
| EN_COURS | Réclamations soumises et en attente de traitement |
| RÉSOLU | Réclamations traitées avec succès |

**Utilité :** Mesurer l'efficacité du processus de modération et identifier les bottlenecks dans le traitement des réclamations. Un ratio EN_COURS/RÉSOLU élevé signale un manque de ressources ou de priorités dans la gestion des réclamations.

---

### Tableau Congés par Statut

**Objectif :** Vue synthétique de la politique de gestion des congés.

| Statut | Description |
|---|---|
| EN_ATTENTE | Demandes soumises, en attente de décision |
| APPROUVÉ | Congés validés par le manager |
| REFUSÉ | Demandes rejetées avec justification |

**Utilité :** Complémente le Graphique 7 avec des valeurs précises. Permet au manager de voir son backlog en un coup d'œil et de prioriser les demandes les plus anciennes.

---

## 6. Conclusion

Le module Analytics de LogiWay constitue la couche d'intelligence décisionnelle de la plateforme. En agrégeant les données de l'ensemble des modules — gestion de flotte, trajets, réclamations, congés, utilisateurs — il transforme les données opérationnelles brutes en indicateurs actionnables.

**Points forts du module :**

- **Couverture complète :** 8 KPI Cards + 7 graphiques + classement chauffeurs + 2 tableaux de synthèse, soit plus de 18 vues analytiques différentes sur une seule interface
- **Différenciation par rôle :** Le SUPERADMIN a une vue multi-entreprises globale, le MANAGER est centré sur son périmètre — même interface, données filtrées selon le rôle
- **Visualisations adaptées :** Chaque type de donnée utilise le type de graphique le plus adapté à sa nature (tendance temporelle → Area/Bar, répartition → Donut, niveau → Gauge)
- **Scoring objectif :** L'algorithme de classement des chauffeurs est transparent et pondéré sur des critères métier réels, évitant le subjectivisme dans l'évaluation des performances
- **Données temps réel :** Les KPI Cards reflètent l'état actuel de la plateforme — tout changement dans les modules (nouveau trajet, réclamation, congé) est visible immédiatement dans le dashboard

**Lien avec les autres modules :**

Le Dashboard Analytics est le module terminal qui consomme et valorise les données produites par tous les autres modules de LogiWay. Il ne fonctionne pleinement qu'une fois les modules Trajets, Pauses ML, Réclamations, Congés et Gestion de Flotte opérationnels — ce qui justifie sa position en Sprint 5 dans l'organisation du projet.
