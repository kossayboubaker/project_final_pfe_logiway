#!/usr/bin/env python3
"""Liste tous les modèles Gemini disponibles"""

import google.generativeai as genai
from app.config import settings

genai.configure(api_key=settings.GOOGLE_API_KEY)

print("=" * 60)
print("📋 Modèles Gemini disponibles:")
print("=" * 60)

try:
    for model in genai.list_models():
        if 'generateContent' in model.supported_generation_methods:
            print(f"✓ {model.name}")
            print(f"  Description: {model.display_name}")
            print()
except Exception as e:
    print(f"❌ Erreur: {e}")
