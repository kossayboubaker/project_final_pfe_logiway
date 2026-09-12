# 🚀 Guide de Déploiement - Service IA Réclamations

## 📋 Résumé

Le **Module Réclamation avec Validation IA** est maintenant opérationnel avec un service local Python qui valide la toxicité et la pertinence sémantique des textes en temps réel.

---

## 🎯 Architecture Déployée

```
Frontend Angular (port 4200)
    ↓ Validation temps réel (debounce 600ms)
    ↓
Backend Spring Boot (port 8080) 
    ↓ API REST calls
    ↓
Service IA Python Flask (port 5001)
    ↓ Validation par règles simples
    ↓ Résultat : VALIDE/TOXIQUE/HORS_SUJET
```

---

## ⚡ Démarrage Rapide

### 1. Service IA (Obligatoire - Démarrer en PREMIER)
```bash
cd reclamation-ai-service
.\start_simple.bat
```
✅ **Service lancé sur http://localhost:5001**

### 2. Backend Spring Boot
```bash
cd backend
mvn spring-boot:run
```
✅ **Backend lancé sur http://localhost:8080**

### 3. Frontend Angular
```bash
cd frontend  
ng serve
```
✅ **Frontend lancé sur http://localhost:4200**

---

## 🔍 Tests de Validation

### Test automatique complet :
```bash
cd reclamation-ai-service
.\test_integration.bat
```

### Tests manuels :

#### ✅ **Texte VALIDE** (accepté)
- *"Le véhicule a une panne moteur sur le trajet"*
- *"Problème de livraison avec le chauffeur"*
- *"Maintenance urgente nécessaire sur le camion"*

#### ❌ **Texte TOXIQUE** (bloqué)  
- *"fuck you"* → *"Langage inapproprié détecté"*
- *"connard"* → *"Reformulez de manière professionnelle"*

#### ❌ **Texte HORS SUJET** (bloqué)
- *"Je veux apprendre à cuisiner"* → *"Ne correspond pas au domaine de la gestion de flotte"*

---

## 🏗️ Architecture Technique

### Service IA Simplifié (`app_simple.py`)
- **Validation Toxicité** : Détection par mots-clés (regex mots entiers)
- **Validation Sémantique** : Score basé sur mots-clés métier
- **Seuils** : Toxicité 0.55 | Sémantique 0.25
- **Pas de dépendances lourdes** (PyTorch, Transformers)

### Backend Spring Boot
- **Endpoint** : `POST /api/reclamations/validate`
- **Service** : `ReclamationServiceImpl.validateField()`
- **Configuration** : `reclamation.ai.local-service-url=http://localhost:5001`

### Frontend Angular
- **Composant** : `reclamation-create-dialog.component.ts`
- **Service** : `reclamation.service.ts`
- **Validation temps réel** avec debounce 600ms

---

## 🔧 Configuration

### Ports utilisés :
- **5001** : Service IA Réclamations 
- **5000** : Service IA Pauses (séparé)
- **8080** : Backend Spring Boot
- **4200** : Frontend Angular

### Variables d'environnement (`application.yml`) :
```yaml
reclamation:
  ai:
    local-service-url: ${RECLAMATION_AI_URL:http://localhost:5001}
```

---

## 📂 Fichiers Créés/Modifiés

### Nouveau Service IA :
- `reclamation-ai-service/app_simple.py` ⭐
- `reclamation-ai-service/requirements_simple.txt`
- `reclamation-ai-service/start_simple.bat`
- `reclamation-ai-service/test_integration.bat`

### Backend modifié :
- `ReclamationServiceImpl.java` → Appels service local
- `application.yml` → Configuration port 5001

### Frontend existant :
- Validation temps réel déjà configurée ✅
- Interface utilisateur opérationnelle ✅

---

## 🚨 Résolution de Problèmes

### Service IA ne démarre pas ?
```bash
cd reclamation-ai-service
python -m venv venv-reclamation
.\venv-reclamation\Scripts\activate
pip install flask==3.0.0 flask-cors==4.0.0
python app_simple.py
```

### Backend ne trouve pas le service IA ?
1. Vérifier que le service IA est lancé : `http://localhost:5001/health`
2. Vérifier les logs du backend Spring Boot
3. Vérifier la configuration dans `application.yml`

### Faux positifs toxicité ?
- Le service utilise des **mots entiers** (regex `\b`)
- Exemple : "véhicule" ne déclenche plus "cul" ✅

---

## 🎯 Prochaines Étapes (Roadmap MLOps)

### Phase 1 : Service de Base ✅ **TERMINÉ**
- [x] Service Python local fonctionnel
- [x] Validation par règles simples
- [x] Intégration backend Spring Boot

### Phase 2 : Amélioration Progressive
- [ ] Modèles NLP avancés (toxic-bert, sentence-transformers)
- [ ] Fine-tuning sur données métier flotte
- [ ] Pipeline de labellisation avec validation humaine

### Phase 3 : MLOps Complet  
- [ ] Apprentissage contrastif contextuel
- [ ] Versionning et shadow testing
- [ ] Monitoring drift et amélioration continue

---

## ✅ État Actuel

| Composant | Statut | Fonctionnalité |
|-----------|--------|----------------|
| Service IA | 🟢 OPÉRATIONNEL | Validation toxicité + sémantique |
| Backend Spring | 🟢 OPÉRATIONNEL | Appels API service local |
| Frontend Angular | 🟢 OPÉRATIONNEL | Validation temps réel |
| Intégration E2E | 🟢 TESTÉE | Pipeline complet fonctionnel |

**🎉 Le Module Réclamation avec IA est maintenant OPÉRATIONNEL !**

---

*Dernière mise à jour : 10 juillet 2026*