"""
Service Local de Validation IA pour Module Réclamation
Fonctionne hors-ligne après le premier téléchargement des modèles
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from transformers import pipeline, AutoTokenizer, AutoModel
from sentence_transformers import SentenceTransformer
import torch
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
import logging
import sys

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - [%(levelname)s] %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Configuration
TOXICITY_THRESHOLD = 0.55
SEMANTIC_THRESHOLD = 0.25

DOMAIN_CONTEXT = """
Cette plateforme concerne la gestion d'une flotte automobile.
Elle permet la gestion des véhicules, camions, chauffeurs, trajets,
livraisons, secteurs, planning, maintenance, incidents et problèmes
administratifs liés au transport.
"""

# Modèles globaux (chargés au démarrage)
toxicity_classifier = None
semantic_model = None
domain_embedding = None


def load_models():
    """Charge les modèles au démarrage de l'application"""
    global toxicity_classifier, semantic_model, domain_embedding
    
    logger.info("=" * 60)
    logger.info("DÉMARRAGE SERVICE IA RÉCLAMATION")
    logger.info("=" * 60)
    
    try:
        # 1. Modèle de détection de toxicité
        logger.info("Chargement modèle toxicité: unitary/toxic-bert")
        toxicity_classifier = pipeline(
            "text-classification",
            model="unitary/toxic-bert",
            top_k=None,
            device=-1  # CPU
        )
        logger.info("✅ Modèle toxicité chargé avec succès")
        
        # 2. Modèle d'embeddings sémantiques
        logger.info("Chargement modèle sémantique: sentence-transformers/all-MiniLM-L6-v2")
        semantic_model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
        logger.info("✅ Modèle sémantique chargé avec succès")
        
        # 3. Pré-calcul de l'embedding du contexte métier
        logger.info("Calcul embedding du contexte métier...")
        domain_embedding = semantic_model.encode([DOMAIN_CONTEXT])[0]
        logger.info("✅ Embedding du domaine pré-calculé")
        
        logger.info("=" * 60)
        logger.info(f"Seuil toxicité: {TOXICITY_THRESHOLD}")
        logger.info(f"Seuil sémantique: {SEMANTIC_THRESHOLD}")
        logger.info("SERVICE PRÊT - Écoute sur http://localhost:5001")
        logger.info("=" * 60)
        
    except Exception as e:
        logger.error(f"❌ ERREUR lors du chargement des modèles: {e}")
        raise


def evaluate_toxicity(text):
    """
    Évalue la toxicité d'un texte
    Retourne un score entre 0.0 et 1.0
    """
    try:
        logger.info(f"[TOXICITY] Analyse: \"{text[:60]}...\"")
        
        results = toxicity_classifier(text)[0]
        
        # Trouver le score pour le label 'toxic'
        toxic_score = 0.0
        for result in results:
            if result['label'].lower() == 'toxic':
                toxic_score = result['score']
                break
        
        decision = "BLOCK" if toxic_score >= TOXICITY_THRESHOLD else "PASS"
        logger.info(f"[TOXICITY] Score: {toxic_score:.2f} | Seuil: {TOXICITY_THRESHOLD} | Décision: {decision}")
        
        return toxic_score
        
    except Exception as e:
        logger.error(f"[TOXICITY] Erreur: {e}")
        return 0.0


def evaluate_semantic_relevance(text):
    """
    Évalue la pertinence sémantique d'un texte par rapport au domaine
    Retourne un score de similarité cosinus entre 0.0 et 1.0
    """
    try:
        logger.info(f"[SEMANTIC] Analyse: \"{text[:60]}...\"")
        
        # Encoder le texte utilisateur
        text_embedding = semantic_model.encode([text])[0]
        
        # Calculer la similarité cosinus avec le domaine
        similarity = cosine_similarity(
            text_embedding.reshape(1, -1),
            domain_embedding.reshape(1, -1)
        )[0][0]
        
        # Convertir en float standard Python
        similarity = float(similarity)
        
        decision = "BLOCK" if similarity < SEMANTIC_THRESHOLD else "PASS"
        logger.info(f"[SEMANTIC] Score: {similarity:.2f} | Seuil: {SEMANTIC_THRESHOLD} | Décision: {decision}")
        
        return similarity
        
    except Exception as e:
        logger.error(f"[SEMANTIC] Erreur: {e}")
        return 0.0


@app.route('/health', methods=['GET'])
def health():
    """Endpoint de santé"""
    return jsonify({
        "status": "healthy",
        "service": "reclamation-ai-validation",
        "models_loaded": toxicity_classifier is not None and semantic_model is not None
    })


@app.route('/validate', methods=['POST'])
def validate():
    """
    Valide un texte (toxicité + pertinence sémantique)
    
    Body JSON:
    {
        "text": "texte à valider",
        "field": "sujet" ou "description"
    }
    
    Retour JSON:
    {
        "valide": true/false,
        "typeErreur": "toxicite" | "hors_sujet" | null,
        "message": "message d'erreur" | null,
        "scores": {
            "toxicite": 0.15,
            "semantique": 0.78
        }
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'text' not in data:
            return jsonify({"error": "Champ 'text' requis"}), 400
        
        text = data['text'].strip()
        field = data.get('field', 'texte')
        
        if not text:
            return jsonify({
                "valide": True,
                "typeErreur": None,
                "message": None,
                "scores": {"toxicite": 0.0, "semantique": 1.0}
            })
        
        logger.info(f"[VALIDATE] Validation du champ '{field}'")
        
        # 1. Vérifier la toxicité
        toxicity_score = evaluate_toxicity(text)
        
        if toxicity_score >= TOXICITY_THRESHOLD:
            message = f"Votre {field} contient un langage inapproprié ou offensant. Veuillez reformuler de manière professionnelle."
            return jsonify({
                "valide": False,
                "typeErreur": "toxicite",
                "message": message,
                "scores": {
                    "toxicite": round(toxicity_score, 2),
                    "semantique": None
                }
            })
        
        # 2. Vérifier la pertinence sémantique
        semantic_score = evaluate_semantic_relevance(text)
        
        if semantic_score < SEMANTIC_THRESHOLD:
            message = f"Votre {field} ne correspond pas au domaine de la gestion de flotte. "
            if field == "sujet":
                message += "Il doit décrire un problème lié à un véhicule, un trajet, un chauffeur, un secteur ou un planning."
            else:
                message += "Décrivez un problème lié à un véhicule, un trajet, un chauffeur, un secteur ou un planning."
            
            return jsonify({
                "valide": False,
                "typeErreur": "hors_sujet",
                "message": message,
                "scores": {
                    "toxicite": round(toxicity_score, 2),
                    "semantique": round(semantic_score, 2)
                }
            })
        
        # 3. Validation réussie
        logger.info(f"[VALIDATE] ✅ Validation réussie pour le champ '{field}'")
        return jsonify({
            "valide": True,
            "typeErreur": None,
            "message": None,
            "scores": {
                "toxicite": round(toxicity_score, 2),
                "semantique": round(semantic_score, 2)
            }
        })
        
    except Exception as e:
        logger.error(f"[VALIDATE] Erreur: {e}")
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    # Charger les modèles au démarrage
    load_models()
    
    # Démarrer le serveur Flask
    app.run(host='0.0.0.0', port=5001, debug=False)
