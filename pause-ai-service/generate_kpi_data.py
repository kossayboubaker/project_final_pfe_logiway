"""
Script de génération des données KPI pour l'entraînement du modèle IA de pauses.

Ce script génère un dataset synthétique basé sur les règles métier (KPI) :
- Fatigue liée au temps de conduite et à l'heure
- Accessibilité des points d'intérêt (distance, équipements)
- Contexte (heure de repas, mi-parcours, proximité départ)

Usage :
    python generate_kpi_data.py                          # 10000 échantillons, sortie CSV
    python generate_kpi_data.py --samples 50000           # 50000 échantillons
    python generate_kpi_data.py --samples 20000 --output data/mon_dataset.csv
    python generate_kpi_data.py --format json             # Sortie JSON aussi
    python generate_kpi_data.py --plot                    # Affiche les distributions
"""
import argparse
import json
import os
import sys

try:
    import pandas as pd
    import matplotlib.pyplot as plt
    HAS_PLOT = True
except ImportError:
    HAS_PLOT = False

from data_generator import generate_dataset, get_feature_columns


KPI_REFERENCE = """
┌─────────────────────────────────────────────────────────────────────────────┐
│                  KPI RULES FOR TRAINING DATA GENERATION                     │
├─────────────────────────────────────────────────────────────────────────────┤
│ FATIGUE SCORE (poids 40%)                                                   │
│  • > 4.5h de conduite  → +60                                               │
│  • > 3.5h de conduite  → +45                                               │
│  • > 2.5h de conduite  → +28                                               │
│  • Conduite nocturne (2h-6h) → +25                                         │
│  • Creux postprandial (13h-15h) → +12                                      │
│  • Dernier quart du trajet → +10                                           │
│                                                                             │
│ ACCESSIBILITY SCORE (poids 35%)                                             │
│  • Distance perpendiculaire < 100m → +15                                   │
│  • Distance perpendiculaire < 300m → +5                                    │
│  • Distance perpendiculaire > 600m → -20                                   │
│  • Aire officielle (services/rest_area) → +25                              │
│  • Station-service → +20                                                   │
│  • Accès PL certifié (hgv=yes) → +20                                       │
│  • Interdit PL (maxweight < 3.5t) → -40                                    │
│  • Ouvert 24/7 → +10                                                       │
│  • Douche → +5                                                             │
│  • Sanitaires → +8                                                         │
│                                                                             │
│ CONTEXT SCORE (poids 25%)                                                   │
│  • POI repas + heure repas → +25                                            │
│  • Station essence à 40-85% du trajet → +15                                │
│  • Centre routier complet (services) → +20                                  │
│  • Trop proche du départ (< 30km) → -25                                    │
│                                                                             │
│ GLOBAL AI SCORE = fatigue * 0.40 + accessibility * 0.35 + context * 0.25   │
└─────────────────────────────────────────────────────────────────────────────┘
"""

def main():
    parser = argparse.ArgumentParser(
        description="Générer les données KPI d'entraînement pour le modèle IA de pauses"
    )
    parser.add_argument("--samples", type=int, default=10000,
                        help="Nombre d'échantillons à générer (défaut: 10000)")
    parser.add_argument("--output", type=str, default=None,
                        help="Chemin du fichier CSV de sortie (défaut: data/training_data.csv)")
    parser.add_argument("--seed", type=int, default=42,
                        help="Seed aléatoire (défaut: 42)")
    parser.add_argument("--format", choices=["csv", "json", "both"], default="csv",
                        help="Format de sortie (défaut: csv)")
    parser.add_argument("--plot", action="store_true",
                        help="Afficher les distributions des features")
    parser.add_argument("--kpi-ref", action="store_true",
                        help="Afficher le tableau des règles KPI")
    args = parser.parse_args()

    if args.kpi_ref:
        print(KPI_REFERENCE)
        return

    print(f"🧪 Génération de {args.samples} échantillons KPI (seed={args.seed})...")
    df = generate_dataset(n_samples=args.samples, seed=args.seed)

    features = get_feature_columns()
    targets = ["fatigue_score", "accessibility_score", "context_score", "global_score"]

    print(f"\n✅ Dataset généré: {len(df)} lignes, {len(features)} features")
    print(f"\n📊 Aperçu des features:")
    print(df[features].describe().to_string())
    print(f"\n🎯 Aperçu des scores (cibles):")
    print(df[targets].describe().to_string())

    print(f"\n📈 Distribution du score global:")
    bins = [0, 20, 40, 60, 80, 100]
    labels = ["0-20", "21-40", "41-60", "61-80", "81-100"]
    df["score_bucket"] = pd.cut(df["global_score"], bins=bins, labels=labels, right=True)
    dist = df["score_bucket"].value_counts().sort_index()
    for label in labels:
        count = dist.get(label, 0)
        bar = "█" * (count // max(1, max(dist) // 40))
        print(f"   {label:>8}: {count:5d} {bar}")

    output_path = args.output or "data/training_data.csv"
    os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)

    if args.format in ("csv", "both"):
        csv_path = output_path.replace(".json", ".csv") if output_path.endswith(".json") else output_path
        df.to_csv(csv_path, index=False)
        print(f"\n💾 Données sauvegardées: {csv_path}")
        file_size = os.path.getsize(csv_path)
        print(f"   Taille: {file_size / 1024:.1f} Ko")

    if args.format in ("json", "both"):
        json_path = output_path.replace(".csv", ".json") if output_path.endswith(".csv") else output_path.replace(".csv", ".json")
        records = df.to_dict(orient="records")
        with open(json_path, "w") as f:
            json.dump(records, f, indent=2, default=str)
        print(f"💾 Données sauvegardées: {json_path}")

    if args.plot and HAS_PLOT:
        fig, axes = plt.subplots(2, 2, figsize=(14, 10))
        axes = axes.flatten()

        axes[0].hist(df["global_score"], bins=30, color="#3b82f6", edgecolor="white")
        axes[0].set_title("Score Global (cible)")
        axes[0].set_xlabel("AI Score")
        axes[0].set_ylabel("Fréquence")

        axes[1].hist(df["fatigue_score"], bins=30, color="#ef4444", edgecolor="white", alpha=0.7)
        axes[1].hist(df["accessibility_score"], bins=30, color="#10b981", edgecolor="white", alpha=0.7)
        axes[1].hist(df["context_score"], bins=30, color="#f59e0b", edgecolor="white", alpha=0.7)
        axes[1].set_title("Scores composants")
        axes[1].set_xlabel("Score")
        axes[1].set_ylabel("Fréquence")
        axes[1].legend(["Fatigue", "Accessibilité", "Contexte"])

        axes[2].scatter(df["dist_along_ratio"] * 100, df["global_score"], alpha=0.1, s=1, c="#3b82f6")
        axes[2].set_title("Score global vs Progression du trajet")
        axes[2].set_xlabel("Progression du trajet (%)")
        axes[2].set_ylabel("Score global")

        corr = df[features + targets].corr()["global_score"].sort_values(ascending=False)
        top_features = corr.head(10)
        axes[3].barh(range(len(top_features)), top_features.values, color="#8b5cf6")
        axes[3].set_yticks(range(len(top_features)))
        axes[3].set_yticklabels(top_features.index)
        axes[3].set_title("Top 10 corrélations avec le score global")
        axes[3].axvline(0, color="gray", linestyle="--", linewidth=0.5)

        plt.tight_layout()
        plt.show()

    print("\n✨ Génération terminée avec succès !")


if __name__ == "__main__":
    main()
