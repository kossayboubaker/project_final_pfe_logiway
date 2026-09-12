"""
Model Evaluation Script
=======================
Loads the trained RandomForest model and runs a full diagnostic:
  - Regression metrics (MAE, RMSE, R²)
  - Residual analysis
  - Feature importance
  - Prediction distribution
  - Cross-validation
  - Edge case / sanity checks
"""

import numpy as np
import pandas as pd
import joblib
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec
from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score,
)
from sklearn.model_selection import cross_val_score, KFold
from sklearn.inspection import permutation_importance

from data_generator import generate_dataset, get_feature_columns
from config import Config

# ─────────────────────────────────────────────
# 1. Load model & generate a fresh test dataset
# ─────────────────────────────────────────────
print("=" * 60)
print("  PAUSE AI MODEL — FULL EVALUATION")
print("=" * 60)

model = joblib.load(Config.MODEL_PATH)
FEATURES = get_feature_columns()

print(f"\n[1] Model loaded from: {Config.MODEL_PATH}")
print(f"    Estimators : {model.n_estimators}")
print(f"    Max depth  : {model.max_depth}")
print(f"    N features : {model.n_features_in_}")

# Generate fresh data with a different seed so it's truly unseen
print("\n[2] Generating 5000 fresh test samples (seed=99, unseen during training)...")
df_test = generate_dataset(n_samples=5000, seed=99)

X_test = df_test[FEATURES]
y_test = df_test["global_score"]
y_pred = model.predict(X_test)
y_pred_clipped = np.clip(np.round(y_pred), 0, 100)

# ─────────────────────────────────────────────
# 2. Core regression metrics
# ─────────────────────────────────────────────
mae  = mean_absolute_error(y_test, y_pred_clipped)
rmse = np.sqrt(mean_squared_error(y_test, y_pred_clipped))
r2   = r2_score(y_test, y_pred_clipped)
residuals = y_test.values - y_pred_clipped

print("\n[3] ── REGRESSION METRICS (on 5000 unseen samples) ──────────────")
print(f"    MAE  (Mean Absolute Error)      : {mae:.2f}  pts")
print(f"    RMSE (Root Mean Squared Error)  : {rmse:.2f} pts")
print(f"    R²   (Coefficient of Det.)      : {r2:.4f}")

# Interpretation helper
def interpret_r2(r2):
    if r2 >= 0.95: return "Excellent"
    if r2 >= 0.85: return "Good"
    if r2 >= 0.70: return "Acceptable"
    if r2 >= 0.50: return "Mediocre"
    return "Poor"

def interpret_mae(mae):
    if mae <= 2:  return "Excellent (< 2 pts on 0-100 scale)"
    if mae <= 5:  return "Good (< 5 pts)"
    if mae <= 10: return "Acceptable (< 10 pts)"
    return "Poor (> 10 pts)"

print(f"\n    → R²  verdict : {interpret_r2(r2)}")
print(f"    → MAE verdict : {interpret_mae(mae)}")

# ─────────────────────────────────────────────
# 3. Cross-validation (on training data)
# ─────────────────────────────────────────────
print("\n[4] ── CROSS-VALIDATION (5-fold, on training data) ──────────────")
df_train = generate_dataset(n_samples=5000, seed=42)
X_cv = df_train[FEATURES]
y_cv = df_train["global_score"]

kf = KFold(n_splits=5, shuffle=True, random_state=42)
cv_r2  = cross_val_score(model, X_cv, y_cv, cv=kf, scoring="r2")
cv_mae = cross_val_score(model, X_cv, y_cv, cv=kf, scoring="neg_mean_absolute_error")

print(f"    R²  per fold : {[round(v, 4) for v in cv_r2]}")
print(f"    R²  mean ± std : {cv_r2.mean():.4f} ± {cv_r2.std():.4f}")
print(f"    MAE per fold : {[round(-v, 2) for v in cv_mae]}")
print(f"    MAE mean ± std : {-cv_mae.mean():.2f} ± {cv_mae.std():.2f}")

if cv_r2.std() > 0.05:
    print("    ⚠️  High variance across folds — possible instability")
else:
    print("    ✅  Stable across folds")

# ─────────────────────────────────────────────
# 4. Overfitting check
# ─────────────────────────────────────────────
print("\n[5] ── OVERFITTING CHECK ─────────────────────────────────────────")
y_train_pred = model.predict(X_cv)
train_r2  = r2_score(y_cv, y_train_pred)
train_mae = mean_absolute_error(y_cv, y_train_pred)
print(f"    Train R²  : {train_r2:.4f}  |  Test R²  : {r2:.4f}  |  Gap: {train_r2 - r2:.4f}")
print(f"    Train MAE : {train_mae:.2f}   |  Test MAE : {mae:.2f}")

gap = train_r2 - r2
if gap > 0.10:
    print("    ⚠️  Significant overfitting detected (gap > 0.10)")
elif gap > 0.05:
    print("    ⚠️  Mild overfitting (gap > 0.05)")
else:
    print("    ✅  No significant overfitting")

# ─────────────────────────────────────────────
# 5. Residual analysis
# ─────────────────────────────────────────────
print("\n[6] ── RESIDUAL ANALYSIS ─────────────────────────────────────────")
print(f"    Mean residual   : {residuals.mean():.2f}  (bias, ideally ~0)")
print(f"    Std  residual   : {residuals.std():.2f}")
print(f"    Max over-pred   : {residuals.min():.1f} pts")
print(f"    Max under-pred  : {residuals.max():.1f} pts")
within_5  = np.mean(np.abs(residuals) <= 5)  * 100
within_10 = np.mean(np.abs(residuals) <= 10) * 100
print(f"    Within ±5 pts   : {within_5:.1f}%")
print(f"    Within ±10 pts  : {within_10:.1f}%")

# ─────────────────────────────────────────────
# 6. Feature importance
# ─────────────────────────────────────────────
print("\n[7] ── FEATURE IMPORTANCE (built-in) ────────────────────────────")
importances = pd.Series(model.feature_importances_, index=FEATURES).sort_values(ascending=False)
for feat, val in importances.items():
    bar = "█" * int(val * 200)
    print(f"    {feat:<25} {val:.4f}  {bar}")

# ─────────────────────────────────────────────
# 7. Edge case / sanity checks
# ─────────────────────────────────────────────
print("\n[8] ── SANITY / EDGE CASE CHECKS ────────────────────────────────")

def make_sample(**overrides):
    base = {
        "total_distance_km": 500, "dist_along_km": 250, "dist_along_ratio": 0.5,
        "perp_distance_m": 50, "hours_driving": 3.0, "arrival_hour": 12,
        "is_night": 0, "is_postprandial": 0, "is_last_quarter": 0,
        "poi_type_encoded": 5, "is_meal_poi": 1, "is_meal_hour": 1,
        "is_mid_range_fuel": 0, "is_too_close": 0, "has_hgv": 1,
        "has_shower": 1, "has_toilets": 1, "is_24h": 1, "is_highway_service": 1,
    }
    base.update(overrides)
    return pd.DataFrame([base])[FEATURES]

cases = [
    ("Ideal rest area (midway, lunchtime, 3h driving)",
     make_sample()),
    ("Too close to start (< 30km)",
     make_sample(dist_along_km=10, dist_along_ratio=0.02, is_too_close=1, hours_driving=0.3)),
    ("Very tired driver (5h+ driving, night)",
     make_sample(hours_driving=5.5, is_night=1, arrival_hour=3)),
    ("Bad POI (far from road, no facilities)",
     make_sample(perp_distance_m=900, has_hgv=0, has_shower=0, has_toilets=0, is_24h=0, is_highway_service=0, poi_type_encoded=0)),
    ("Gas station at 60% of trip",
     make_sample(poi_type_encoded=1, is_mid_range_fuel=1, is_meal_poi=0, is_meal_hour=0, dist_along_ratio=0.6)),
]

for label, sample in cases:
    score = int(round(np.clip(model.predict(sample)[0], 0, 100)))
    print(f"    [{score:>3}/100] {label}")

# ─────────────────────────────────────────────
# 8. Plots
# ─────────────────────────────────────────────
print("\n[9] Generating plots → model_evaluation.png ...")

fig = plt.figure(figsize=(18, 14))
fig.suptitle("Pause AI Model — Full Evaluation", fontsize=16, fontweight="bold")
gs = gridspec.GridSpec(3, 3, figure=fig, hspace=0.45, wspace=0.35)

# (a) Predicted vs Actual
ax1 = fig.add_subplot(gs[0, 0])
ax1.scatter(y_test, y_pred_clipped, alpha=0.15, s=4, color="#3b82f6")
ax1.plot([0, 100], [0, 100], "r--", linewidth=1.5, label="Perfect fit")
ax1.set_xlabel("Actual Score")
ax1.set_ylabel("Predicted Score")
ax1.set_title(f"Predicted vs Actual\nR²={r2:.4f}")
ax1.legend(fontsize=8)

# (b) Residuals distribution
ax2 = fig.add_subplot(gs[0, 1])
ax2.hist(residuals, bins=50, color="#10b981", edgecolor="white")
ax2.axvline(0, color="red", linestyle="--", linewidth=1.5)
ax2.set_xlabel("Residual (Actual - Predicted)")
ax2.set_ylabel("Count")
ax2.set_title(f"Residuals Distribution\nMean={residuals.mean():.2f}, Std={residuals.std():.2f}")

# (c) Residuals vs Predicted
ax3 = fig.add_subplot(gs[0, 2])
ax3.scatter(y_pred_clipped, residuals, alpha=0.15, s=4, color="#f59e0b")
ax3.axhline(0, color="red", linestyle="--", linewidth=1.5)
ax3.set_xlabel("Predicted Score")
ax3.set_ylabel("Residual")
ax3.set_title("Residuals vs Predicted\n(should be random scatter)")

# (d) Feature importances
ax4 = fig.add_subplot(gs[1, :2])
importances_sorted = importances.sort_values()
colors = ["#ef4444" if v > 0.1 else "#3b82f6" for v in importances_sorted]
ax4.barh(importances_sorted.index, importances_sorted.values, color=colors)
ax4.set_xlabel("Importance")
ax4.set_title("Feature Importances (red = top features)")
ax4.axvline(1/len(FEATURES), color="gray", linestyle="--", linewidth=1, label="Uniform baseline")
ax4.legend(fontsize=8)

# (e) Score distribution: actual vs predicted
ax5 = fig.add_subplot(gs[1, 2])
ax5.hist(y_test, bins=30, alpha=0.6, color="#3b82f6", label="Actual", edgecolor="white")
ax5.hist(y_pred_clipped, bins=30, alpha=0.6, color="#ef4444", label="Predicted", edgecolor="white")
ax5.set_xlabel("Score")
ax5.set_ylabel("Count")
ax5.set_title("Score Distribution\nActual vs Predicted")
ax5.legend()

# (f) Cross-validation R² per fold
ax6 = fig.add_subplot(gs[2, 0])
ax6.bar(range(1, 6), cv_r2, color="#8b5cf6", edgecolor="white")
ax6.axhline(cv_r2.mean(), color="red", linestyle="--", linewidth=1.5, label=f"Mean={cv_r2.mean():.4f}")
ax6.set_xlabel("Fold")
ax6.set_ylabel("R²")
ax6.set_title("Cross-Validation R² per Fold")
ax6.set_ylim(max(0, cv_r2.min() - 0.05), 1.0)
ax6.legend(fontsize=8)

# (g) MAE by score bucket
ax7 = fig.add_subplot(gs[2, 1])
df_eval = pd.DataFrame({"actual": y_test.values, "pred": y_pred_clipped, "residual": np.abs(residuals)})
df_eval["bucket"] = pd.cut(df_eval["actual"], bins=[0,20,40,60,80,100], labels=["0-20","21-40","41-60","61-80","81-100"])
mae_by_bucket = df_eval.groupby("bucket", observed=True)["residual"].mean()
ax7.bar(mae_by_bucket.index, mae_by_bucket.values, color="#06b6d4", edgecolor="white")
ax7.set_xlabel("Actual Score Range")
ax7.set_ylabel("Mean Absolute Error")
ax7.set_title("MAE by Score Bucket\n(where does model struggle?)")

# (h) Prediction error CDF
ax8 = fig.add_subplot(gs[2, 2])
sorted_abs_err = np.sort(np.abs(residuals))
cdf = np.arange(1, len(sorted_abs_err) + 1) / len(sorted_abs_err)
ax8.plot(sorted_abs_err, cdf, color="#f43f5e", linewidth=2)
ax8.axvline(5,  color="gray",  linestyle="--", linewidth=1, label="5 pts")
ax8.axvline(10, color="black", linestyle="--", linewidth=1, label="10 pts")
ax8.set_xlabel("Absolute Error (pts)")
ax8.set_ylabel("Cumulative %")
ax8.set_title("Error CDF\n(% of predictions within X pts)")
ax8.legend(fontsize=8)
ax8.set_xlim(0, 30)

plt.savefig("model_evaluation.png", dpi=150, bbox_inches="tight")
plt.close()
print("    Saved: model_evaluation.png")

# ─────────────────────────────────────────────
# 9. Final verdict
# ─────────────────────────────────────────────
print("\n" + "=" * 60)
print("  FINAL VERDICT")
print("=" * 60)
print(f"  R²   : {r2:.4f}  → {interpret_r2(r2)}")
print(f"  MAE  : {mae:.2f}  → {interpret_mae(mae)}")
print(f"  RMSE : {rmse:.2f} pts")
print(f"  Overfit gap : {gap:.4f}")
print()

issues = []
if r2 < 0.85:
    issues.append("R² is below 0.85 — model may not generalize well")
if mae > 5:
    issues.append("MAE > 5 pts — predictions can be off by quite a bit")
if gap > 0.05:
    issues.append("Overfitting detected — model memorizes training data")
if cv_r2.std() > 0.05:
    issues.append("High cross-validation variance — unstable model")
if abs(residuals.mean()) > 2:
    issues.append(f"Systematic bias: model consistently {'over' if residuals.mean() < 0 else 'under'}-predicts by {abs(residuals.mean()):.1f} pts")

if issues:
    print("  ⚠️  Issues found:")
    for issue in issues:
        print(f"     • {issue}")
else:
    print("  ✅  Model looks healthy — no major issues found")

print("\n  ⚠️  IMPORTANT CAVEAT:")
print("  The model is trained on SYNTHETIC data generated by the same")
print("  KPI rules it's trying to learn. High R² here does NOT mean")
print("  the model works well in real-world conditions — it just means")
print("  it learned the formula well. Real validation would require")
print("  actual driver behavior data.")
print("=" * 60)
