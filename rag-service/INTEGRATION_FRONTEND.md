# Intégration du service RAG Chatbot Gemini

## Service RAG fonctionnel avec Google Gemini 3.1 Flash Lite

Le service RAG a été migré avec succès de Ollama vers Google Gemini. Voici les détails techniques :

### Configuration
- **Port**: 5003
- **URL API**: http://localhost:5003
- **Documentation Swagger**: http://localhost:5003/docs
- **Modèle**: `models/gemini-3.1-flash-lite`
- **API Key**: Configuration dans `.env`

### Endpoints disponibles

#### 1. Health Check
```http
GET http://localhost:5003/health
```

**Réponse:**
```json
{
  "status": "healthy",
  "database_connected": true,
  "ollama_connected": true,
  "vectorstore_ready": true,
  "timestamp": "2026-07-17T02:22:38.320144"
}
```

#### 2. Poser une question
```http
POST http://localhost:5003/api/rag/question
Content-Type: application/json

{
  "question": "Combien de véhicules sont disponibles?",
  "user_id": "user123",
  "entreprise_id": "ent456"
}
```

**Réponse:**
```json
{
  "reponse": "Réponse générée par Gemini",
  "sources": [
    {
      "content": "Contenu du document source...",
      "table": "vehicule",
      "score": null
    }
  ],
  "temps_reponse_ms": 450,
  "model_used": "models/gemini-3.1-flash-lite",
  "retrieval_method": "simple_db"
}
```

#### 3. Statistiques
```http
GET http://localhost:5003/api/rag/stats
```

### Intégration avec le frontend Angular

Dans votre service Angular (`chatbot.service.ts`), mettez à jour la configuration :

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChatbotService {
  private readonly RAG_API_URL = 'http://localhost:5003/api/rag/question';
  
  constructor(private http: HttpClient) {}
  
  askQuestion(question: string, userId?: string, entrepriseId?: string): Observable<any> {
    const body = {
      question: question,
      user_id: userId,
      entreprise_id: entrepriseId
    };
    
    return this.http.post(this.RAG_API_URL, body);
  }
  
  getHealth(): Observable<any> {
    return this.http.get('http://localhost:5003/health');
  }
}
```

### Service Java backend (Logiway)

Pour intégrer avec votre backend Java existant, ajoutez dans `ChatbotMCPService.java` :

```java
@Component
public class ChatbotMCPService {
    
    private static final String RAG_API_URL = "http://localhost:5003/api/rag/question";
    
    public String askRagQuestion(String question, String userId, String entrepriseId) {
        try {
            // Création de la requête
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("question", question);
            requestBody.put("user_id", userId);
            requestBody.put("entreprise_id", entrepriseId);
            
            // Appel API REST
            RestTemplate restTemplate = new RestTemplate();
            ResponseEntity<Map> response = restTemplate.postForEntity(
                RAG_API_URL,
                requestBody,
                Map.class
            );
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return (String) response.getBody().get("reponse");
            }
            
        } catch (Exception e) {
            log.error("Erreur lors de l'appel au service RAG: {}", e.getMessage());
        }
        
        return "Désolé, je ne peux pas répondre pour le moment.";
    }
}
```

### Démarrage rapide

1. **Démarrer le service RAG:**
   ```bash
   cd rag-service
   start_rag_service.bat
   ```

2. **Vérifier que le service fonctionne:**
   ```bash
   curl http://localhost:5003/health
   ```

3. **Tester une question:**
   ```bash
   python scripts/test_full_api.py
   ```

### Avantages de la migration vers Gemini

1. **Performance améliorée**: Gemini 3.1 Flash Lite est plus rapide que Ollama local
2. **Fiabilité**: Service cloud géré par Google
3. **Scalabilité**: Pas de limites hardware locales
4. **Compatibilité**: Plus de problèmes d'installation sur Windows
5. **Sans LangChain**: Architecture simplifiée et plus robuste

### Dépannage

#### Problème: "Cannot import name 'get_database_connection'"
**Solution**: Le service a été mis à jour pour utiliser `engine` directement.

#### Problème: "No module named 'langchain'"
**Solution**: LangChain a été complètement supprimé, remplacé par une implémentation simple.

#### Problème: API ne répond pas
**Solution**: Vérifier que le service est démarré:
```bash
netstat -an | findstr :5003
```

### Migration terminée ✅

Le service RAG est maintenant entièrement fonctionnel avec:
- ✅ Google Gemini 3.1 Flash Lite
- ✅ API FastAPI sur port 5003  
- ✅ Connexion MySQL fonctionnelle
- ✅ Sans dépendance LangChain
- ✅ Compatible Python 3.13
- ✅ Tests API complets fonctionnels