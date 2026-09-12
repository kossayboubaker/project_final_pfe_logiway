"""Tests unitaires du modèle PauseAIModel (model.py)."""
import pytest
from unittest.mock import patch, MagicMock

import model
from config import Config


def _features_dict():
    return {
        "total_distance_km": 100.0,
        "dist_along_ratio": 0.5,
        "perp_distance_m": 50.0,
        "hours_driving": 3.0,
        "arrival_hour": 12,
        "poi_type_encoded": 1,
        "is_meal_poi": 0,
        "is_meal_hour": 1,
        "is_mid_range_fuel": 1,
        "is_too_close": 0,
        "is_highway_service": 0,
        "has_hgv": 1,
        "has_shower": 0,
        "has_toilets": 1,
        "is_24h": 1,
    }


# ----------------------------------------------------------------------------
# __init__ / _load_or_init / is_trained
# ----------------------------------------------------------------------------
@patch("model.os.path.exists", return_value=False)
def test_init_no_model_file(mock_exists):
    m = model.PauseAIModel()
    assert m.model is None
    assert m.is_trained() is False
    assert len(m.feature_columns) == 15


@patch("model.joblib.load", return_value="FakeModel")
@patch("model.os.path.exists", return_value=True)
def test_init_loads_existing_model(mock_exists, mock_load):
    m = model.PauseAIModel()
    assert m.model == "FakeModel"
    assert m.is_trained() is True
    mock_load.assert_called_once()


# ----------------------------------------------------------------------------
# train
# ----------------------------------------------------------------------------
@patch("model.os.makedirs")
@patch("model.joblib.dump")
@patch("model.r2_score", return_value=0.85)
@patch("model.mean_absolute_error", return_value=3.5)
@patch("model.RandomForestRegressor")
@patch("model.train_test_split")
@patch("model.generate_dataset")
def test_train_full_flow(mock_gen, mock_split, mock_rf, mock_mae, mock_r2,
                         mock_dump, mock_makedirs):
    import pandas as pd
    df = pd.DataFrame({
        "global_score": [50, 60],
        "total_distance_km": [10, 20],
        "dist_along_ratio": [0.5, 0.6],
        "perp_distance_m": [0.0, 1.0],
        "hours_driving": [1.0, 2.0],
        "arrival_hour": [6, 7],
        "poi_type_encoded": [0, 1],
        "is_meal_poi": [0, 1],
        "is_meal_hour": [1, 0],
        "is_mid_range_fuel": [0, 1],
        "is_too_close": [0, 0],
        "is_highway_service": [0, 1],
        "has_hgv": [1, 0],
        "has_shower": [0, 0],
        "has_toilets": [1, 1],
        "is_24h": [0, 1],
    })
    mock_gen.return_value = df

    X_train, X_test, y_train, y_test = MagicMock(), MagicMock(), MagicMock(), MagicMock()
    mock_split.return_value = (X_train, X_test, y_train, y_test)

    rf_instance = MagicMock()
    X_test_pred = None

    def fake_predict(X):
        nonlocal X_test_pred
        X_test_pred = X
        return [55.0, 65.0]
    rf_instance.predict.side_effect = fake_predict
    mock_rf.return_value = rf_instance

    m = model.PauseAIModel()
    m.model = MagicMock()  # force "trained" pas nécessaire pour train
    result = m.train(n_samples=42)

    mock_gen.assert_called_once_with(n_samples=42)
    assert mock_split.call_count == 1
    assert result["n_samples"] == 42
    assert result["n_features"] == 15
    assert result["mae"] == pytest.approx(3.5)
    assert result["r2_score"] == pytest.approx(0.85)
    mock_dump.assert_called_once()
    mock_makedirs.assert_called_once()


@patch("model.generate_dataset", side_effect=ValueError("gen fail"))
def test_train_propagates_error(mock_gen):
    m = model.PauseAIModel()
    with pytest.raises(ValueError):
        m.train(n_samples=5)


# ----------------------------------------------------------------------------
# predict
# ----------------------------------------------------------------------------
def test_predict_not_trained_raises():
    m = model.PauseAIModel()
    m.model = None
    with pytest.raises(RuntimeError):
        m.predict(_features_dict())


def test_predict_dict_input():
    m = model.PauseAIModel()
    m.model = MagicMock()
    m.model.predict.return_value = [55.5]
    scores = m.predict(_features_dict())
    assert scores == [56]  # round(55.5) = 56


def test_predict_list_input_and_clamping():
    m = model.PauseAIModel()
    m.model = MagicMock()
    m.model.predict.return_value = [-5.0, 150.0, 42.4]
    scores = m.predict([_features_dict(), _features_dict(), _features_dict()])
    assert scores == [0, 100, 42]


def test_predict_adds_missing_feature_columns():
    m = model.PauseAIModel()
    m.model = MagicMock()
    m.model.predict.return_value = [50.0]
    # on retire des colonnes pour vérifier qu'elles sont complétées à 0
    partial = {k: v for k, v in _features_dict().items()
               if k not in ("has_hgv", "has_shower")}
    scores = m.predict(partial)
    assert scores == [50]
    # vérifier que les NAs complétés sont bien envoyés
    call_df = m.model.predict.call_args[0][0]
    assert "has_hgv" in call_df.columns
    assert call_df["has_hgv"].iloc[0] == 0.0


# ----------------------------------------------------------------------------
# predict_scores / predict_with_components
# ----------------------------------------------------------------------------
def test_predict_scores():
    m = model.PauseAIModel()
    m.model = MagicMock()
    m.model.predict.return_value = [70.0]
    assert m.predict_scores(_features_dict()) == {"ai_score": 70}


def test_predict_with_components():
    m = model.PauseAIModel()
    m.model = MagicMock()
    m.model.predict.return_value = [66.0]
    res = m.predict_with_components(_features_dict())
    assert res["ai_score"] == 66
    assert res["fatigue_score"] is None
    assert res["model_version"] == "v3.0-ml"
    assert res["scoring_model"] == "random_forest_200"
