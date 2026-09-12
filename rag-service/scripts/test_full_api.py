"""Test complet de l'API RAG Gemini"""
import requests
import json
import time

BASE_URL = "http://localhost:5003"

def test_endpoint(endpoint, method="GET", data=None):
    """Test un endpoint de l'API"""
    try:
        url = f"{BASE_URL}{endpoint}"
        
        if method == "GET":
            response = requests.get(url)
        elif method == "POST" and data:
            response = requests.post(url, json=data)
        else:
            return False, f"Méthode {method} non supportée"
        
        return True, response.json()
    except Exception as e:
        return False, str(e)

def main():
    print("=" * 60)
    print("🧪 Test complet du service RAG Chatbot Gemini")
    print("=" * 60)
    
    # 1. Test endpoint racine
    print("\n1. Test endpoint racine...")
    success, result = test_endpoint("/")
    if success:
        print(f"   ✅ {result.get('service')} - v{result.get('version')}")
        print(f"   ✓ Status: {result.get('status')}")
        print(f"   ✓ Modèle: {result.get('model')}")
    else:
        print(f"   ❌ Erreur: {result}")
        return
    
    # 2. Test healthcheck
    print("\n2. Test healthcheck...")
    success, result = test_endpoint("/health")
    if success:
        print(f"   ✅ Status: {result.get('status')}")
        print(f"   ✓ DB connectée: {result.get('database_connected')}")
        print(f"   ✓ Gemini connecté: {result.get('ollama_connected')}")
        print(f"   ✓ Vector store: {result.get('vectorstore_ready')}")
    else:
        print(f"   ❌ Erreur: {result}")
    
    # 3. Test question simple
    print("\n3. Test question simple...")
    question_data = {
        "question": "Combien de véhicules sont disponibles dans le système?",
        "user_id": "test-user-001",
        "entreprise_id": "logiway-001"
    }
    
    success, result = test_endpoint("/api/rag/question", "POST", question_data)
    if success:
        print(f"   ✅ Réponse générée")
        print(f"   ✓ Modèle utilisé: {result.get('model_used')}")
        print(f"   ✓ Méthode retrieval: {result.get('retrieval_method')}")
        print(f"   ✓ Temps réponse: {result.get('temps_reponse_ms')}ms")
        print(f"   ✓ Réponse: {result.get('reponse')[:100]}...")
        print(f"   ✓ Sources: {len(result.get('sources', []))} documents")
    else:
        print(f"   ❌ Erreur: {result}")
    
    # 4. Test question spécifique sur chauffeurs
    print("\n4. Test question sur chauffeurs...")
    question_data = {
        "question": "Quels chauffeurs sont disponibles?",
        "user_id": "test-user-001",
        "entreprise_id": "logiway-001"
    }
    
    success, result = test_endpoint("/api/rag/question", "POST", question_data)
    if success:
        print(f"   ✅ Réponse générée")
        print(f"   ✓ Réponse: {result.get('reponse')[:100]}...")
        print(f"   ✓ Sources: {len(result.get('sources', []))} documents")
    else:
        print(f"   ❌ Erreur: {result}")
    
    # 5. Test statistiques
    print("\n5. Test statistiques...")
    success, result = test_endpoint("/api/rag/stats")
    if success:
        print(f"   ✅ Statistiques récupérées")
        db_info = result.get('database', {})
        print(f"   ✓ Tables dans DB: {db_info.get('tables_count', 0)}")
        print(f"   ✓ Total lignes: {db_info.get('total_rows', 0)}")
        config = result.get('config', {})
        print(f"   ✓ Modèle configuré: {config.get('model')}")
        print(f"   ✓ Provider: {config.get('api_provider')}")
    else:
        print(f"   ❌ Erreur: {result}")
    
    print("\n" + "=" * 60)
    print("✅ Tests complétés - Service RAG Gemini fonctionnel!")
    print("=" * 60)

if __name__ == "__main__":
    main()