import os
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score

from data_generator import generate_dataset, get_feature_columns
from config import Config


class PauseAIModel:
    def __init__(self):
        self.model: RandomForestRegressor | None = None
        self.feature_columns = get_feature_columns()
        self._load_or_init()

    def _load_or_init(self):
        if os.path.exists(Config.MODEL_PATH):
            self.model = joblib.load(Config.MODEL_PATH)
        else:
            self.model = None

    def is_trained(self) -> bool:
        return self.model is not None

    def train(self, n_samples: int = None):
        n = n_samples or Config.TRAINING_SAMPLES
        df = generate_dataset(n_samples=n)

        X = df[self.feature_columns]
        y = df["global_score"]

        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

        # Slightly constrained depth to avoid overfitting the improved dataset
        self.model = RandomForestRegressor(
            n_estimators=200,
            max_depth=12,
            min_samples_leaf=8,
            max_features="sqrt",
            random_state=42,
            n_jobs=-1,
        )
        self.model.fit(X_train, y_train)

        y_pred = self.model.predict(X_test)
        mae = mean_absolute_error(y_test, y_pred)
        r2 = r2_score(y_test, y_pred)

        os.makedirs(os.path.dirname(Config.MODEL_PATH), exist_ok=True)
        joblib.dump(self.model, Config.MODEL_PATH)

        df.to_csv(Config.TRAINING_DATA_PATH, index=False)

        return {
            "n_samples": n,
            "n_features": len(self.feature_columns),
            "mae": round(mae, 2),
            "r2_score": round(r2, 3),
            "model_path": Config.MODEL_PATH,
            "data_path": Config.TRAINING_DATA_PATH,
        }

    def predict(self, features: dict | list[dict]) -> list[float]:
        if not self.is_trained():
            raise RuntimeError("Model not trained yet. Call /api/train first.")

        if isinstance(features, dict):
            features = [features]

        df = pd.DataFrame(features)
        for col in self.feature_columns:
            if col not in df.columns:
                df[col] = 0.0

        X = df[self.feature_columns]
        scores = self.model.predict(X)
        return [max(0, min(100, int(round(s)))) for s in scores]

    def predict_scores(self, features: dict) -> dict:
        global_score = self.predict(features)[0]
        return {"ai_score": global_score}

    def predict_with_components(self, features: dict) -> dict:
        global_score = self.predict(features)[0]

        feature_vec = features.copy()
        feature_vec["is_fatigue_mode"] = 1
        feature_vec["is_accessibility_mode"] = 0
        feature_vec["is_context_mode"] = 0

        return {
            "ai_score": global_score,
            "fatigue_score": None,
            "accessibility_score": None,
            "context_score": None,
            "model_version": "v3.0-ml",
            "scoring_model": "random_forest_200",
        }
