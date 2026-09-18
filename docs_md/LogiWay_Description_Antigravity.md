# 📋 LogiWay — Description Technique pour Antigravity
## Tâche : Finalisation Docker — Variables Dynamiques + Cross-Origin

**Projet :** LogiWay — Plateforme Intelligente de Gestion de Flotte  
**Étudiant :** Kossay Boubaker  
**Entreprise :** ExypnoTech Engineering Services — Monastir, Tunisie  
**Formation :** Ingénieur Data & AI — ESPRIT Tunis 2025/2026  
**Phase :** Finalisation Docker local → Préparation CI/CD GitHub Actions → Déploiement

---

# 🇫🇷 VERSION FRANÇAISE

---

## 🏗️ PRÉSENTATION DU PROJET

LogiWay est une plateforme web complète de gestion intelligente de flottes
de véhicules poids lourds. Elle repose sur une architecture composée de
plusieurs services indépendants qui doivent tous communiquer ensemble :

- **Frontend Angular 17** — Interface utilisateur servie par Nginx
- **Backend Spring Boot 3.x / Java 21** — API REST principale
- **Keycloak 24.x** — Authentification OAuth2/JWT (obligatoire, sans lui le site est inaccessible)
- **MySQL 8.0** — Base de données principale
- **Service IA Réclamations** — Python Flask sur le port 5001
- **Service ML Pauses** — Python Flask + RandomForest sur le port 5000
- **Service Chatbot RAG** — Python FastAPI + LangChain + Gemini sur le port 5003

Tous ces services sont conteneurisés avec Docker et orchestrés via
un fichier `docker-compose.yml` à la racine du projet.

---

## ❓ RÉPONSE À LA QUESTION PRINCIPALE

### "Est-ce que les modifications demandées vont casser les fonctionnalités ?"

**Non, absolument pas.** Les modifications demandées concernent uniquement
la couche de **configuration** du projet, pas la couche **logique**.

Concrètement, cela signifie que toutes les fonctionnalités suivantes
restent intactes et ne doivent pas être touchées :

- La logique métier complète du backend Spring Boot
- Le modèle Machine Learning RandomForest (prédiction des pauses réglementaires)
- Le chatbot RAG (LangChain + Google Gemini)
- Le système de validation IA des réclamations (Flask, règles regex)
- Le suivi GPS temps réel, OSRM, Leaflet, pauses CE 561/2006
- Les dashboards KPI, notifications SSE, messagerie WebSocket
- Keycloak OAuth2/JWT et tout le système d'authentification
- Toutes les gestions (congés, réclamations, véhicules, secteurs, trajets...)

**Ce qui change :** uniquement les valeurs de configuration qui sont
actuellement écrites en dur dans le code source (URLs, mots de passe,
noms d'hôtes) seront transformées en variables lisibles depuis
l'environnement. La logique, les méthodes, les algorithmes et les
fonctionnalités ne bougent pas d'un seul caractère.

---

## 🔍 ANALYSE DE L'ÉTAT ACTUEL

### Problème 1 — Valeurs hardcodées dans le code source

Actuellement, dans les différents services du projet, des valeurs
comme les adresses de la base de données, les mots de passe, les URLs
des services entre eux, et les clés API sont écrites directement dans
le code source. Cela crée deux problèmes majeurs :

**Problème de sécurité :** les mots de passe et clés API sont visibles
dans le code sur GitHub.

**Problème de portabilité :** si le projet est cloné et lancé sur une
autre machine, ces valeurs pointent toujours vers `localhost` ou vers
des adresses qui n'existent pas sur la nouvelle machine, ce qui fait
échouer tous les services au démarrage.

### Problème 2 — Accès depuis une autre machine

Quand le projet tourne sur une machine A et qu'on essaie d'y accéder
depuis une machine B (ou depuis un autre appareil sur le réseau), le
navigateur bloque toutes les requêtes entre le frontend et le backend.

La cause est que les services backend et les services Python autorisent
uniquement les requêtes provenant de `localhost`. Quand Angular tourne
sur une adresse IP réelle (par exemple `192.168.1.50`), cette adresse
n'est pas reconnue comme autorisée par les services, et le navigateur
affiche une erreur bloquante.

### Problème 3 — Keycloak indispensable

Keycloak est le serveur d'authentification du projet. Sans lui, la page
de login ne fonctionne pas et personne ne peut accéder à la plateforme.
Il doit absolument être présent dans le Docker Compose avec son port
`8180` exposé. De plus, Keycloak a deux URLs qui doivent être
configurées séparément : une URL interne utilisée par Spring Boot
(à l'intérieur du réseau Docker) et une URL externe utilisée par le
navigateur Angular (accessible depuis l'extérieur de Docker).
Ne pas faire cette distinction est la cause la plus fréquente d'échec
d'authentification en déploiement Docker.

---

## ✅ DESCRIPTION DES TÂCHES À RÉALISER

### Tâche 1 — Créer un fichier de configuration centralisé

À la racine du projet, créer un fichier `.env` qui contient toutes
les valeurs de configuration du projet : identifiants de base de données,
mots de passe, URLs des services, clé API Gemini, noms de realm Keycloak,
ports des services, origines autorisées pour le cross-origin. Ce fichier
doit regrouper en un seul endroit toutes les valeurs qui varient selon
l'environnement (développement local, machine d'un collègue, serveur
de production).

Créer également un fichier `.env.example` qui a la même structure mais
avec des valeurs génériques à la place des vraies valeurs. Ce fichier
peut être commité sur GitHub car il ne contient aucune information
sensible. Il sert de documentation pour toute personne qui clone le projet.

Le fichier `.env` lui-même ne doit jamais être commité sur GitHub. Il
doit être ajouté au fichier `.gitignore` si ce n'est pas déjà le cas.

---

### Tâche 2 — Backend Spring Boot

Le backend doit être modifié pour lire toutes ses valeurs de
configuration depuis des variables d'environnement au lieu de les
avoir écrites en dur. Cela concerne :

- L'URL de connexion à la base de données MySQL
- Le nom d'utilisateur et le mot de passe MySQL
- L'URL interne de Keycloak (pour la validation des tokens JWT)
- Le nom du realm Keycloak
- Les URLs des trois services Python IA (réclamations, pauses ML, chatbot)
- La liste des origines autorisées pour le cross-origin
- Le port d'écoute du serveur

**Point important :** Spring Boot supporte nativement la lecture des
variables d'environnement. Le fichier de configuration principal
(`application.yml` ou `application.properties`) doit utiliser la
syntaxe de référence aux variables d'environnement avec une valeur
par défaut (pour que le projet continue à fonctionner en développement
local sans Docker). Aucune logique métier ne doit être modifiée.

La configuration du cross-origin dans Spring Boot doit également être
rendue dynamique : la liste des origines autorisées doit être lue depuis
une variable d'environnement, permettant ainsi d'ajouter facilement
de nouvelles origines sans modifier le code.

---

### Tâche 3 — Service IA Réclamations (Flask, port 5001)

Ce service Python doit lire depuis l'environnement toutes ses valeurs
de configuration. Cela concerne les coordonnées de connexion MySQL,
l'URL du backend Spring Boot (utilisée pour certains appels internes),
le port d'écoute du service, et la liste des origines autorisées pour
le cross-origin Flask.

**Ce qui ne doit pas être touché :** toute la logique de détection de
toxicité, les expressions régulières, le dictionnaire de mots interdits,
la logique de validation sémantique, les seuils de décision, et
l'ensemble du flux de traitement des réclamations.

---

### Tâche 4 — Service ML Pauses (Flask, port 5000)

Ce service Python qui héberge le modèle RandomForest doit également
lire sa configuration depuis l'environnement : connexion MySQL, URL
du backend, port d'écoute, origines cross-origin autorisées.

**Ce qui ne doit pas être touché :** le modèle RandomForest lui-même,
les 15 features utilisées, le processus d'entraînement, le calcul des
scores de pauses, la logique CE 561/2006, le scheduler de vérification,
et toute la logique de prédiction et de scoring des POI.

---

### Tâche 5 — Service Chatbot RAG (FastAPI, port 5003)

Ce service doit lire depuis l'environnement : les coordonnées MySQL,
l'URL du backend, le port d'écoute, les origines cross-origin, et
surtout **la clé API Google Gemini** qui est actuellement probablement
écrite en dur et qui ne doit en aucun cas apparaître dans le code
commité sur GitHub.

**Ce qui ne doit pas être touché :** toute la logique LangChain,
les outils de récupération de données, la logique de génération de
rapports PDF/CSV/TXT, les requêtes SQL sécurisées, et le flux complet
de traitement des questions en langage naturel.

---

### Tâche 6 — Frontend Angular

Angular présente une spécificité importante : les fichiers
`environment.ts` sont compilés au moment de la construction de l'image
Docker (au moment du `npm run build`). Cela signifie que si une URL
est écrite dans ces fichiers, elle sera gravée dans l'image et ne
pourra plus être changée sans reconstruire l'image.

La solution est d'utiliser un fichier de configuration JSON placé
dans le dossier `assets` du frontend, qui sera chargé dynamiquement
par l'application au démarrage dans le navigateur. Ce fichier contiendra
des valeurs génériques (des placeholders) qui seront remplacées au
moment du démarrage du container Nginx par les vraies valeurs provenant
des variables d'environnement.

Pour que cette substitution se produise automatiquement, le container
Nginx doit être configuré pour exécuter un script au démarrage qui
effectue ce remplacement avant de lancer Nginx. Le `Dockerfile` du
frontend doit être adapté en conséquence pour utiliser ce script comme
point d'entrée plutôt que de démarrer Nginx directement.

**Ce qui ne doit pas être touché :** tous les composants Angular,
les services HTTP, les guards d'authentification, les intercepteurs JWT,
la carte Leaflet, les dashboards, et l'ensemble de l'interface utilisateur.

---

### Tâche 7 — Docker Compose

Le fichier `docker-compose.yml` doit être revu pour que toutes les
valeurs dans les blocs `environment:` de chaque service référencent
les variables du fichier `.env` plutôt que d'avoir des valeurs écrites
en dur. Cela s'applique à tous les services : MySQL, Keycloak, Spring
Boot, les trois services Python, et le frontend.

**Concernant Keycloak spécifiquement :** il doit rester présent dans
le Docker Compose avec son port `8180` exposé. Deux URLs doivent être
configurées distinctement via des variables d'environnement : l'URL
interne (utilisée par Spring Boot à l'intérieur du réseau Docker, de
la forme `http://keycloak:8080`) et l'URL externe (utilisée par Angular
dans le navigateur, de la forme `http://IP_MACHINE:8180`). La confusion
entre ces deux URLs est la source la plus courante de dysfonctionnement
de l'authentification en environnement Docker.

---

### Tâche 8 — GitHub Actions (CI/CD)

Le pipeline GitHub Actions qui construit et pousse les images Docker
doit utiliser les **GitHub Secrets** pour les valeurs sensibles. Aucun
mot de passe, clé API ou credential ne doit apparaître dans le fichier
de workflow. Les secrets doivent être configurés dans les paramètres du
repository GitHub et référencés dans le workflow via la syntaxe des
secrets GitHub.

---

## ⚙️ COMPORTEMENT ATTENDU APRÈS LES MODIFICATIONS

Une fois toutes ces tâches réalisées, le comportement attendu est le
suivant :

**En développement local :** un développeur qui clone le projet pour
la première fois copie le fichier `.env.example` en `.env`, remplit
ses propres valeurs, et lance `docker compose up -d`. Tous les services
démarrent et communiquent correctement.

**Sur une autre machine du réseau :** en remplaçant les adresses
`localhost` dans le `.env` par l'adresse IP réelle de la machine hôte,
n'importe quel autre appareil sur le même réseau peut accéder à la
plateforme depuis son navigateur sans aucune erreur de cross-origin.

**En CI/CD (GitHub Actions) :** le pipeline construit les images Docker
en utilisant les secrets GitHub, pousse les images sur le registry, et
ces images peuvent être déployées sur n'importe quel serveur.

**En production :** le fichier `.env` de production contient les URLs
réelles du domaine, les mots de passe forts, et la vraie clé API Gemini.
Aucune modification du code source n'est nécessaire.

---

## 📂 LISTE COMPLÈTE DES FICHIERS CONCERNÉS

Les fichiers suivants doivent être analysés et modifiés selon le besoin.
Antigravity doit d'abord analyser chaque fichier pour identifier ce qui
existe déjà et ce qui manque, afin de ne compléter que les parties
absentes sans toucher à ce qui fonctionne déjà.

| Fichier | Nature de la modification |
|---|---|
| `.env` (à créer) | Nouveau fichier — toutes les variables centralisées |
| `.env.example` (à créer) | Nouveau fichier — version sans valeurs sensibles |
| `.gitignore` | Vérifier que `.env` y figure, l'ajouter si absent |
| `docker-compose.yml` | Remplacer les valeurs statiques par des références `${VAR}` |
| `backend/src/main/resources/application.yml` | Remplacer les valeurs par des références aux variables d'env |
| Configuration CORS dans Spring Boot | Rendre la liste d'origines dynamique |
| `ai-service/app_simple.py` | Lire la configuration depuis `os.getenv()` |
| `ai-service/pause_model.py` | Lire la configuration depuis `os.getenv()` |
| `ai-service/chatbot_rag.py` (ou équivalent) | Lire la configuration + clé Gemini depuis `os.getenv()` |
| `frontend/src/assets/config.json` (à créer) | Fichier de configuration runtime pour Angular |
| `frontend/docker-entrypoint.sh` (à créer) | Script de substitution des valeurs au démarrage Nginx |
| `frontend/Dockerfile` | Utiliser le script d'entrée pour le démarrage |
| Fichier workflow GitHub Actions | Utiliser les GitHub Secrets |

---

## 🚨 POINTS D'ATTENTION CRITIQUES

**Ne jamais toucher :** la logique métier, les algorithmes, les
méthodes de traitement, les endpoints API, les modèles ML, et les
fonctionnalités existantes.

**Keycloak est obligatoire** dans le Docker Compose. Sans lui, la
page de connexion ne s'affiche pas et l'accès à toute la plateforme
est bloqué.

**La clé API Gemini** ne doit en aucun cas être commitée sur GitHub.
Elle doit être uniquement dans le `.env` local et dans les GitHub
Secrets pour le CI/CD.

**Angular compile au build**, pas au runtime. Les URLs Angular ne
peuvent pas être changées après la construction de l'image sans
utiliser la solution du fichier `config.json` avec substitution au
démarrage Nginx.

**Deux URLs Keycloak** distinctes sont nécessaires : une pour Spring
Boot (réseau interne Docker) et une pour Angular (navigateur externe).

---

## 📋 ORDRE D'EXÉCUTION RECOMMANDÉ

1. Analyser le projet existant pour identifier ce qui est déjà dynamique
   et ce qui est encore hardcodé dans chaque service
2. Créer le fichier `.env` avec toutes les variables identifiées
3. Créer le fichier `.env.example` correspondant
4. Modifier le `docker-compose.yml` pour référencer le `.env`
5. Modifier le backend Spring Boot (configuration + CORS)
6. Modifier les trois services Python IA
7. Créer la solution Angular runtime (config.json + script Nginx)
8. Tester le projet complet avec `docker compose up -d` en local
9. Tester depuis une autre machine sur le même réseau
10. Vérifier que toutes les fonctionnalités fonctionnent (login,
    GPS, ML, chatbot, dashboards, notifications, messagerie)
11. Configurer les GitHub Secrets et mettre à jour le workflow CI/CD

---

