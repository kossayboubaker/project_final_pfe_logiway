"""Test de connexion à Google Gemini"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.config import settings
from app.llm import test_gemini_connection, get_llm
from app.embeddings import test_embeddings
from app.database import test_connection
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def main():
    """Test complet du système Gemini"""
    print("=" * 50)
    print("🧪 Test du service RAG - Gemini")
    print("=" * 50)
    
    print(f"🔑 API Key configurée: {'✓' if settings.GOOGLE_API_KEY else '✗'}")
    print(f"🤖 Modèle: {settings.GEMINI_MODEL}")
    print()
    
    # 1. Test base de données
    print("1. Test connexion MySQL...")
    if test_connection():
        print("   ✅ MySQL OK")
    else:
        print("   ❌ MySQL ERREUR")
        return
    
    # 2. Test Gemini
    print("\n2. Test connexion Gemini...")
    if test_gemini_connection():
        print("   ✅ Gemini OK")
    else:
        print("   ❌ Gemini ERREUR")
        return
    
    # 3. Test embeddings (factice)
    print("\n3. Test système embeddings...")
    if test_embeddings():
        print("   ✅ Embeddings OK")
    else:
        print("   ❌ Embeddings ERREUR")
    
    # 4. Test LLM complet
    print("\n4. Test LLM complet...")
    try:
        llm = get_llm()
        response = llm.invoke("Explique en une phrase ce qu'est Logiway")
        print(f"   ✅ Réponse: {response.content}")
    except Exception as e:
        print(f"   ❌ Erreur LLM: {e}")
        return
    
    print("\n" + "=" * 50)
    print("✅ Tous les tests sont passés!")
    print("🚀 Le service RAG Gemini est prêt!")
    print("=" * 50)

if __name__ == "__main__":
    main()