#!/usr/bin/env python3
"""Test simple de connexion Gemini - Version minimale"""

import google.generativeai as genai
from app.config import settings

def test_gemini_only():
    """Test simple de Gemini sans dépendances"""
    print("=" * 50)
    print("🧪 Test GEMINI SEULEMENT")
    print("=" * 50)
    
    # Configuration
    print(f"🔑 API Key: {settings.GOOGLE_API_KEY[:20]}...")
    print(f"🤖 Modèle: {settings.GEMINI_MODEL}")
    
    try:
        # Connexion
        genai.configure(api_key=settings.GOOGLE_API_KEY)
        model = genai.GenerativeModel(settings.GEMINI_MODEL)
        
        # Test simple
        print("\n📤 Test de génération...")
        response = model.generate_content("Réponds juste: Bonjour!")
        
        if response.text:
            print(f"✅ SUCCÈS: {response.text}")
            return True
        else:
            print("❌ ÉCHEC: Pas de réponse")
            return False
            
    except Exception as e:
        print(f"❌ ERREUR: {e}")
        return False

if __name__ == "__main__":
    success = test_gemini_only()
    print("\n" + "=" * 50)
    if success:
        print("🎉 GEMINI FONCTIONNE!")
        print("✅ LangChain n'était PAS nécessaire")
        print("✅ Solution: API Google Gemini directe")
        print("✅ Modèle: gemini-1.5-flash-8b (Flash Lite)")
    else:
        print("💥 GEMINI ÉCHOUE")
    print("=" * 50)