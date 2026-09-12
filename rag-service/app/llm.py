"""Configuration du modèle LLM Gemini - API moderne (version 0.7.2+)"""
import google.generativeai as genai
from app.config import settings
import logging
import os

logger = logging.getLogger(__name__)


class GeminiLLM:
    """Wrapper simple pour Gemini API (sans LangChain)"""
    
    def __init__(self):
        # Configuration de l'API
        genai.configure(api_key=settings.GOOGLE_API_KEY)
        self.model = genai.GenerativeModel(settings.GEMINI_MODEL)
        logger.info(f"✓ Gemini LLM initialisé: {settings.GEMINI_MODEL}")
    
    def invoke(self, prompt: str) -> str:
        """Génère une réponse avec Gemini"""
        try:
            response = self.model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=settings.LLM_TEMPERATURE,
                    max_output_tokens=settings.MAX_RESPONSE_TOKENS,
                )
            )
            return response.text if response.text else "Pas de réponse générée"
        except Exception as e:
            logger.error(f"Erreur Gemini: {e}")
            return f"Erreur lors de la génération: {str(e)}"


def test_gemini_connection() -> bool:
    """Test de connexion à Gemini"""
    try:
        # Vérifier que l'API key est configurée
        if not settings.GOOGLE_API_KEY:
            logger.error("✗ GOOGLE_API_KEY non configurée")
            return False
        
        # Test simple d'appel
        genai.configure(api_key=settings.GOOGLE_API_KEY)
        model = genai.GenerativeModel(settings.GEMINI_MODEL)
        response = model.generate_content("Dis juste 'OK'")
        
        if response.text:
            logger.info(f"✓ Gemini connecté - Test réussi: {response.text}")
            return True
        else:
            logger.error("✗ Pas de réponse de Gemini")
            return False
            
    except Exception as e:
        logger.error(f"✗ Erreur connexion Gemini: {e}")
        return False


def get_llm():
    """
    Retourne le modèle LLM Gemini configuré
    """
    logger.info(f"Initialisation LLM Gemini: {settings.GEMINI_MODEL}")
    return GeminiLLM()


def test_llm():
    """Test du modèle LLM"""
    try:
        llm = get_llm()
        response = llm.invoke("Réponds en un mot: Bonjour")
        logger.info(f"✓ Test LLM réussi: {response[:50]}")
        return True
    except Exception as e:
        logger.error(f"✗ Erreur test LLM: {e}")
        return False