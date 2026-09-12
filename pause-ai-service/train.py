"""
Script d'entraînement du modèle IA de pauses réglementaires.

Usage:
    python train.py                    # Entraîne avec les paramètres par défaut (10000 échantillons)
    python train.py --samples 50000    # Entraîne avec 50000 échantillons
    python train.py --samples 20000 --seed 123

Le modèle entraîné est sauvegardé dans data/pause_model.joblib
Les données générées sont sauvegardées dans data/training_data.csv
"""
import argparse
from model import PauseAIModel


def main():
    parser = argparse.ArgumentParser(description="Entraîner le modèle IA de pauses")
    parser.add_argument("--samples", type=int, default=10000,
                        help="Nombre d'échantillons d'entraînement à générer")
    parser.add_argument("--seed", type=int, default=42,
                        help="Seed aléatoire pour la reproductibilité")
    args = parser.parse_args()

    print(f"🧠 Entraînement du modèle IA de pauses réglementaires")
    print(f"   Échantillons: {args.samples}")
    print(f"   Seed: {args.seed}")

    model = PauseAIModel()
    result = model.train(n_samples=args.samples)

    print(f"✅ Entraînement terminé !")
    print(f"   Échantillons: {result['n_samples']}")
    print(f"   Features: {result['n_features']}")
    print(f"   MAE: {result['mae']}")
    print(f"   R²: {result['r2_score']}")
    print(f"   Modèle: {result['model_path']}")
    print(f"   Données: {result['data_path']}")


if __name__ == "__main__":
    main()
