"""
Service Local de Validation IA pour Module Réclamation - Version Simplifiée
Utilise des règles simples pour tester rapidement sans dépendances lourdes
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
import sys
import re
import os

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - [%(levelname)s] %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# CORS dynamique depuis variable d'environnement
cors_origins = os.getenv('CORS_ALLOWED_ORIGINS', '*')
if cors_origins == '*':
    CORS(app)
else:
    CORS(app, origins=[o.strip() for o in cors_origins.split(',')])

# Configuration depuis variables d'environnement
TOXICITY_THRESHOLD = float(os.getenv('TOXICITY_THRESHOLD', '0.55'))
SEMANTIC_THRESHOLD = float(os.getenv('SEMANTIC_THRESHOLD', '0.25'))

# Mots toxiques pour validation simple
TOXIC_WORDS = [
    "fuck", "shit", "ass", "bitch", "pussy", "dick", "cunt", "bastard",
    "damn", "hell", "piss", "slut", "whore", "retard",
    "putain", "merde", "connard", "salope", "enculé", "con", "pute", 
    "bordel", "chier", "couille", "bite", "cul", "pd", "taré", "débile"
]

# Mots-clés du domaine flotte
DOMAIN_KEYWORDS = [
    "véhicule", "vehicle", "camion", "truck", "voiture", "car",
    "chauffeur", "driver", "conducteur", "livraison", "delivery",
    "trajet", "route", "itinéraire", "secteur", "zone", "planning",
    "maintenance", "panne", "réparation", "incident", "accident",
    "carburant", "fuel", "essence", "diesel", "pneu", "tire",
    "frein", "brake", "moteur", "engine", "kilomètre", "km",
    "gps", "localisation", "pause", "repos", "break", "horaire",
    "retard", "delay", "colis", "package", "client", "customer",
    "entrepôt", "warehouse", "chargement", "loading", "déchargement"
]

def evaluate_toxicity_simple(text):
    """Validation toxicité simple par mots-clés (mots entiers uniquement)"""
    import re
    text_lower = text.lower()
    
    for toxic_word in TOXIC_WORDS:
        # Utiliser regex pour détecter les mots entiers seulement
        pattern = r'\b' + re.escape(toxic_word) + r'\b'
        if re.search(pattern, text_lower):
            logger.info(f"[SIMPLE-TOXICITY] Mot toxique détecté: {toxic_word}")
            return 1.0  # Score toxique maximal
    
    return 0.0  # Pas de toxicité détectée

def evaluate_semantic_simple(text):
    """Validation sémantique simple par mots-clés (mots entiers uniquement)"""
    import re
    text_lower = text.lower()
    matches = 0
    
    for keyword in DOMAIN_KEYWORDS:
        # Utiliser regex pour détecter les mots entiers seulement
        pattern = r'\b' + re.escape(keyword.lower()) + r'\b'
        if re.search(pattern, text_lower):
            matches += 1
            logger.info(f"[SIMPLE-SEMANTIC] Mot-clé détecté: {keyword}")
    
    # Score = ratio de mots-clés trouvés
    score = min(1.0, matches / 2.0)  # Au moins 2 mots-clés pour être pertinent
    return score

@app.route('/health', methods=['GET'])
def health():
    """Endpoint de santé"""
    return jsonify({
        "status": "healthy",
        "service": "reclamation-ai-validation-simple",
        "models_loaded": True,
        "version": "simple"
    })

@app.route('/validate', methods=['POST'])
def validate():
    """Valide un texte avec des règles simples"""
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
        
        logger.info(f"[VALIDATE] Validation simple du champ '{field}': {text[:50]}...")
        
        # 1. Vérifier la toxicité
        toxicity_score = evaluate_toxicity_simple(text)
        logger.info(f"[SIMPLE-TOXICITY] Score: {toxicity_score} | Seuil: {TOXICITY_THRESHOLD}")
        
        if toxicity_score >= TOXICITY_THRESHOLD:
            message = f"Votre {field} contient un langage inapproprié ou offensant. Veuillez reformuler de manière professionnelle."
            return jsonify({
                "valide": False,
                "typeErreur": "toxicite",
                "message": message,
                "scores": {"toxicite": toxicity_score, "semantique": None}
            })
        
        # 2. Vérifier la pertinence sémantique
        semantic_score = evaluate_semantic_simple(text)
        logger.info(f"[SIMPLE-SEMANTIC] Score: {semantic_score} | Seuil: {SEMANTIC_THRESHOLD}")
        
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
                "scores": {"toxicite": toxicity_score, "semantique": semantic_score}
            })
        
        # 3. Validation réussie
        logger.info(f"[VALIDATE] ✅ Validation réussie pour '{field}'")
        return jsonify({
            "valide": True,
            "typeErreur": None,
            "message": None,
            "scores": {"toxicite": toxicity_score, "semantique": semantic_score}
        })
        
    except Exception as e:
        logger.error(f"[VALIDATE] Erreur: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', '5001'))
    logger.info("=" * 60)
    logger.info("SERVICE IA RÉCLAMATION - VERSION SIMPLIFIÉE")
    logger.info(f"Port: {port}")
    logger.info("Validation: Règles simples (pas de modèles lourds)")
    logger.info("=" * 60)
    
    app.run(host='0.0.0.0', port=port, debug=False)