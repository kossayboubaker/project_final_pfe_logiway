"""
Script pour ré-entraîner le modèle RandomForest avec la version actuelle de scikit-learn
"""
import sys
import warnings
warnings.filterwarnings('ignore')

print("=" * 80)
print("RÉ-ENTRAÎNEMENT DU MODÈLE PAUSE AI")
print("=" * 80)
print()

# Vérifier la version de scikit-learn
try:
    import sklearn
    print(f"✅ scikit-learn version: {sklearn.__version__}")
except ImportError:
    print("❌ scikit-learn n'est pas installé")
    print("   Installation: pip install scikit-learn")
    sys.exit(1)

# Importer le modèle
try:
    from model import PauseAIModel
    print("✅ Module model importé")
except Exception as e:
    print(f"❌ Erreur import model: {e}")
    sys.exit(1)

# Créer une instance et entraîner
print()
print("-" * 80)
print("ENTRAÎNEMENT DU MODÈLE...")
print("-" * 80)

try:
    ai_model = PauseAIModel()
    print("✅ Instance PauseAIModel créée")
    
    # Entraîner avec 30,000 échantillons (comme avant)
    print("⏳ Génération de 30,000 échantillons d'entraînement...")
    result = ai_model.train(n_samples=30000)
    
    print()
    print("=" * 80)
    print("✅ ENTRAÎNEMENT RÉUSSI")
    print("=" * 80)
    print()
    print("Résultats:")
    for key, value in result.items():
        if isinstance(value, float):
            print(f"  • {key}: {value:.4f}")
        else:
            print(f"  • {key}: {value}")
    
    print()
    print("✅ Le modèle est maintenant compatible avec scikit-learn", sklearn.__version__)
    print("✅ Vous pouvez redémarrer le serveur Flask")
    
except Exception as e:
    print()
    print("=" * 80)
    print("❌ ERREUR LORS DE L'ENTRAÎNEMENT")
    print("=" * 80)
    print(f"Erreur: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
