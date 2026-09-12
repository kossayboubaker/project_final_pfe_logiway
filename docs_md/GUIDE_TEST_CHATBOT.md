# 🤖 Guide de Test du Chatbot LogiWay

## 📋 Pré-requis

### Services à démarrer (dans l'ordre):

1. **MySQL** (Port 3306)
   ```bash
   # Vérifiez que MySQL tourne
   ```

2. **Service RAG Gemini** (Port 5003)
   ```bash
   cd rag-service
   start_gemini.bat
   ```
   ✅ Attendez le message: `✓ Service RAG prêt avec Gemini!`

3. **Backend Spring Boot** (Port 8080)
   ```bash
   cd backend
   mvn spring-boot:run
   ```
   ✅ Attendez: `Tomcat started on port(s): 8080`

4. **Frontend Angular** (Port 4200)
   ```bash
   cd frontend
   npm start
   ```
   ✅ Attendez: `Compiled successfully`

## 🔍 Tests de Vérification

### Test 1: Vérifier les services

Lancez le script automatique:
```bash
TEST_CHATBOT_INTEGRATION.bat
```

Ou vérifiez manuellement:
```bash
# RAG Service
curl http://localhost:5003/health

# Backend
curl http://localhost:8080/actuator/health

# Frontend
curl http://localhost:4200
```

### Test 2: Vérifier l'intégration UI

1. Ouvrez http://localhost:4200
2. Connectez-vous avec vos identifiants
3. Cherchez l'icône de chatbot **flottante** en bas à droite
4. Cliquez pour ouvrir le chatbot

✅ Le chatbot doit afficher:
```
Bonjour ! Je suis LogiWay Assistant, propulsé par Gemini IA.

Posez-moi une question sur vos chauffeurs, véhicules, 
trajets, congés ou réclamations.
```

## 💬 Questions de Test

### Niveau 1: Questions Simples

#### Statistiques Globales
```
Combien de chauffeurs ?
Combien de véhicules ?
Donne-moi un résumé du système
Quelles sont les statistiques générales ?
```

**Réponse attendue**: Statistiques avec émojis et nombres

#### Chauffeurs
```
Quels chauffeurs sont disponibles ?
Liste des chauffeurs actifs
Combien de chauffeurs par secteur ?
```

**Réponse attendue**: Liste des chauffeurs avec statuts

#### Véhicules
```
Combien de véhicules sont disponibles ?
Y a-t-il des véhicules en maintenance ?
Donne-moi le statut des véhicules
```

**Réponse attendue**: Répartition des véhicules par statut

### Niveau 2: Questions Complexes

#### Trajets
```
Quels trajets sont en cours ?
Statistiques des trajets ce mois
Combien de livraisons aujourd'hui ?
```

**Réponse attendue**: Informations sur les trajets récents/en cours

#### Congés
```
Y a-t-il des congés en attente de validation ?
Quels sont les congés de cette semaine ?
Combien d'absences ce mois ?
```

**Réponse attendue**: Liste des congés avec dates et statuts

#### Réclamations
```
Y a-t-il des réclamations ouvertes ?
Combien de réclamations prioritaires ?
Résumé des réclamations
```

**Réponse attendue**: Informations sur les réclamations

### Niveau 3: Questions Analytiques

```
Quel est le taux d'absence des chauffeurs ?
Quelles sont les performances de livraison ?
Y a-t-il des alertes importantes ?
Compare les véhicules disponibles et en maintenance
```

**Réponse attendue**: Analyse contextuelle avec données du système

## 🎯 Validation des Réponses

### ✅ Réponse Correcte
- Texte structuré avec émojis
- Données chiffrées précises
- Formatage clair (listes, bullet points)
- Réponse en < 3 secondes

### ❌ Problèmes Possibles

**"Le service RAG Gemini n'est pas disponible"**
- Solution: Vérifiez que `rag-service` tourne sur le port 5003
- Vérifiez le fichier `.env` avec la clé `GEMINI_API_KEY`

**"Erreur lors du traitement de votre demande"**
- Solution: Vérifiez les logs backend `backend/logs/application.log`
- Vérifiez la connexion MySQL

**"Aucune donnée trouvée"**
- Solution: Vérifiez que la base de données contient des données
- Testez directement via les API REST

**Chatbot ne s'ouvre pas**
- Solution: Ouvrez la console navigateur (F12)
- Vérifiez qu'il n'y a pas d'erreurs JavaScript
- Vérifiez que `ChatbotService` est chargé

## 🔧 Debugging

### Logs à consulter

1. **Service RAG**
   - Terminal où `start_gemini.bat` tourne
   - Cherchez les lignes `Question reçue:` et `Réponse générée`

2. **Backend Java**
   - `backend/logs/application.log`
   - Cherchez `ChatbotController` et `GeminiService`

3. **Frontend**
   - Console navigateur (F12 → Console)
   - Cherchez les requêtes HTTP vers `/api/chat/message`

### Commandes de Debug

```bash
# Voir les logs en temps réel
cd backend
tail -f logs/application.log

# Tester l'API directement
curl -X POST http://localhost:8080/api/chat/message \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"question":"Combien de chauffeurs?"}'

# Tester le service RAG
curl -X POST http://localhost:5003/api/rag/question \
  -H "Content-Type: application/json" \
  -d '{"question":"Statistiques globales"}'
```

## 📊 Métriques de Performance

### Temps de Réponse Attendus
- Question simple: < 2 secondes
- Question complexe: < 4 secondes
- Avec hybrid retrieval: < 3 secondes

### Utilisation Mémoire
- Service RAG: ~200-400 MB
- Backend: ~500 MB - 1 GB
- Frontend: ~100-200 MB

## ✨ Fonctionnalités Avancées

### Suggestions Rapides
Au premier message, 3 boutons de suggestion apparaissent:
- 🚛 Véhicules disponibles
- 👤 Chauffeurs actifs  
- 📊 Trajets du mois

### Animations
- Dots de "typing" pendant le chargement
- Animation smooth des messages
- Pulse du bouton FAB

### Responsive
- Fonctionne sur mobile
- S'adapte aux petits écrans

## 🎓 Exemples de Conversations

### Conversation 1: Inspection Matinale
```
User: Bonjour, donne-moi le statut du système
Bot: [Statistiques globales avec tous les compteurs]

User: Des véhicules en panne ?
Bot: [Liste des véhicules en maintenance]

User: Chauffeurs disponibles ?
Bot: [Liste des chauffeurs disponibles par secteur]
```

### Conversation 2: Gestion des Urgences
```
User: Y a-t-il des réclamations prioritaires ?
Bot: [Liste des réclamations HAUTE priorité]

User: Trajets en retard ?
Bot: [Analyse des trajets avec retards éventuels]
```

## 📚 Ressources

- **Architecture**: `RAG_CHATBOT_ARCHITECTURE.md`
- **Documentation RAG**: `rag-service/README.md`
- **API Backend**: `backend/src/main/java/com/logiway/controllers/ChatbotController.java`
- **Frontend**: `frontend/src/app/core/layout/chatbot/`

---

**Date**: 2026-07-17  
**Version**: 1.0  
**Status**: ✅ Production Ready
