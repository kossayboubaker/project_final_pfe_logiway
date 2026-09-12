"""Configuration des embeddings - Version ultra-simple SANS embeddings"""
from app.config import settings
import logging

logger = logging.getLogger(__name__)


class NoEmbeddings:
    """Classe factice pour éviter les embeddings"""
    
    def embed_query(self, text: str) -> list[float]:
        """Retourne un vecteur factice"""
        # Vecteur basé sur la longueur du texte (très simple)
        return [float(len(text)), 1.0, 0.5]
    
    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        """Retourne des vecteurs factices pour plusieurs textes"""
        return [self.embed_query(text) for text in texts]


def get_embeddings():
    """
    Retourne un objet factice (pas d'embeddings réels)
    Version ultra-simple qui évite complètement NumPy et PyTorch
    """
    logger.info("Utilisation NoEmbeddings (pas d'embeddings réels)")
    return NoEmbeddings()


def test_embeddings():
    """Test du système d'embeddings factice"""
    try:
        embeddings = get_embeddings()
        test_text = "Combien de véhicules sont disponibles?"
        vector = embeddings.embed_query(test_text)
        logger.info(f"✓ Test embeddings factice réussi (dimension: {len(vector)})")
        return True
    except Exception as e:
        logger.error(f"✗ Erreur test embeddings: {e}")
        return False