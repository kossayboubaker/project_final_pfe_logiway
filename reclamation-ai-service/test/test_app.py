"""Tests unitaires du service Réclamation (app.py).

Couverture : load_models, evaluate_toxicity, evaluate_semantic_relevance,
health, validate — en mocks légers (via conftest), sans modèles IA.
"""
import pytest
from unittest.mock import patch, MagicMock

import app


@pytest.fixture(autouse=True)
def _models_down():
    app.toxicity_classifier = None
    app.semantic_model = None
    app.domain_embedding = None
    yield


# ----------------------------------------------------------------------------
# load_models
# ----------------------------------------------------------------------------
@patch("app.SentenceTransformer")
@patch("app.pipeline")
def test_load_models_ok(mock_pipeline, mock_st):
    """load_models charge les 3 éléments et calcule l'embedding du domaine."""
    mock_classifier = MagicMock()
    mock_pipeline.return_value = mock_classifier
    mock_model = MagicMock()
    mock_st.return_value = mock_model
    mock_model.encode.return_value = [[0.1, 0.2]]

    app.load_models()

    assert app.toxicity_classifier is mock_classifier
    assert app.semantic_model is mock_model
    assert app.domain_embedding == [0.1, 0.2]
    mock_pipeline.assert_called_once()
    mock_model.encode.assert_called_once_with([app.DOMAIN_CONTEXT])


@patch("app.SentenceTransformer", side_effect=RuntimeError("download fail"))
@patch("app.pipeline")
def test_load_models_raises_on_error(mock_pipeline, mock_st):
    """load_models propage l'erreur si un modèle ne peut être chargé."""
    with pytest.raises(RuntimeError):
        app.load_models()


# ----------------------------------------------------------------------------
# evaluate_toxicity
# ----------------------------------------------------------------------------
def test_evaluate_toxicity_no_classifier_returns_zero():
    """Sans classifieur chargé, retourne 0.0 (branche except)."""
    app.toxicity_classifier = None
    assert app.evaluate_toxicity("bonjour") == 0.0


def test_evaluate_toxicity_blocking():
    """Un score >= seuil est retourné tel quel."""
    app.toxicity_classifier = MagicMock()
    app.toxicity_classifier.return_value = [
        [{"label": "non_toxic", "score": 0.1}, {"label": "toxic", "score": 0.87}]
    ]
    assert app.evaluate_toxicity("insulte") == pytest.approx(0.87)


def test_evaluate_toxicity_pass_below_threshold():
    """Un score < seuil est retourné tel quel (PASS)."""
    app.toxicity_classifier = MagicMock()
    app.toxicity_classifier.return_value = [
        [{"label": "non_toxic", "score": 0.95}, {"label": "toxic", "score": 0.05}]
    ]
    assert app.evaluate_toxicity("texte propre") == pytest.approx(0.05)


def test_evaluate_toxicity_no_toxic_label_zero():
    """Pas de label 'toxic' -> score 0.0."""
    app.toxicity_classifier = MagicMock()
    app.toxicity_classifier.return_value = [
        [{"label": "non_toxic", "score": 0.99}]
    ]
    assert app.evaluate_toxicity("texte") == 0.0


def test_evaluate_toxicity_exception_returns_zero():
    """Exception du classifieur -> 0.0."""
    app.toxicity_classifier = MagicMock(side_effect=ValueError("boom"))
    assert app.evaluate_toxicity("texte") == 0.0


# ----------------------------------------------------------------------------
# evaluate_semantic_relevance
# ----------------------------------------------------------------------------
def test_evaluate_semantic_relevance_no_model_zero():
    """Sans modèle sémantique -> 0.0 (branche except)."""
    app.semantic_model = None
    assert app.evaluate_semantic_relevance("véhicule") == 0.0


def _vec():
    """Mock de vecteur possédant une méthode reshape (comme un ndarray)."""
    v = MagicMock()
    v.reshape.return_value = v
    return v


def test_evaluate_semantic_relevance_relevant():
    """Similarité >= seuil -> score retourné."""
    app.semantic_model = MagicMock()
    app.semantic_model.encode.return_value = [_vec()]
    app.domain_embedding = _vec()
    with patch("app.cosine_similarity", return_value=[[0.9]]):
        assert app.evaluate_semantic_relevance("problème moteur camion") == pytest.approx(0.9)


def test_evaluate_semantic_relevance_close_to_zero():
    """Similarité très basse -> retournée (BLOCK)."""
    app.semantic_model = MagicMock()
    app.semantic_model.encode.return_value = [_vec()]
    app.domain_embedding = _vec()
    with patch("app.cosine_similarity", return_value=[[0.02]]):
        assert app.evaluate_semantic_relevance("recette gâteau") == pytest.approx(0.02)


def test_evaluate_semantic_exception_returns_zero():
    """Exception -> 0.0."""
    app.semantic_model = MagicMock(side_effect=RuntimeError("boom"))
    app.domain_embedding = [1.0]
    assert app.evaluate_semantic_relevance("texte") == 0.0


# ----------------------------------------------------------------------------
# health
# ----------------------------------------------------------------------------
def test_health_models_loaded(client):
    app.toxicity_classifier = MagicMock()
    app.semantic_model = MagicMock()
    resp = client.get("/health")
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["status"] == "healthy"
    assert data["models_loaded"] is True


def test_health_models_not_loaded(client):
    app.toxicity_classifier = None
    app.semantic_model = None
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.get_json()["models_loaded"] is False


# ----------------------------------------------------------------------------
# validate
# ----------------------------------------------------------------------------
def test_validate_missing_text_400(client):
    resp = client.post("/validate", json={})
    assert resp.status_code == 400
    assert resp.get_json()["error"] == "Champ 'text' requis"


def test_validate_invalid_json_500(client):
    """JSON invalide -> géré par le except général -> 500."""
    resp = client.post("/validate", data="not json", content_type="application/json")
    assert resp.status_code == 500


def test_validate_empty_text_valid(client):
    app.toxicity_classifier = None
    resp = client.post("/validate", json={"text": "   ", "field": "sujet"})
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["valide"] is True
    assert data["scores"]["toxicite"] == 0.0
    assert data["scores"]["semantique"] == 1.0


@patch("app.evaluate_semantic_relevance")
@patch("app.evaluate_toxicity")
def test_validate_toxic_blocked(mock_tox, mock_sem, client):
    mock_tox.return_value = 0.9
    resp = client.post("/validate", json={"text": "insulte", "field": "sujet"})
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["valide"] is False
    assert data["typeErreur"] == "toxicite"
    assert "inapproprié" in data["message"]
    mock_sem.assert_not_called()


@patch("app.evaluate_semantic_relevance")
@patch("app.evaluate_toxicity")
def test_validate_hors_sujet_sujet(mock_tox, mock_sem, client):
    mock_tox.return_value = 0.1
    mock_sem.return_value = 0.05
    resp = client.post("/validate", json={"text": "recette gâteau", "field": "sujet"})
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["valide"] is False
    assert data["typeErreur"] == "hors_sujet"
    assert "problème lié à un véhicule" in data["message"] or "véhicule, un trajet" in data["message"]


@patch("app.evaluate_semantic_relevance")
@patch("app.evaluate_toxicity")
def test_validate_hors_sujet_description(mock_tox, mock_sem, client):
    mock_tox.return_value = 0.2
    mock_sem.return_value = 0.1
    resp = client.post("/validate", json={"text": "bonjour", "field": "description"})
    data = resp.get_json()
    assert data["valide"] is False
    assert data["typeErreur"] == "hors_sujet"
    assert "Décrivez un problème" in data["message"]


@patch("app.evaluate_semantic_relevance")
@patch("app.evaluate_toxicity")
def test_validate_success(mock_tox, mock_sem, client):
    mock_tox.return_value = 0.1
    mock_sem.return_value = 0.9
    resp = client.post("/validate", json={"text": "panne moteur camion", "field": "description"})
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["valide"] is True
    assert data["typeErreur"] is None
    assert data["scores"]["toxicite"] == pytest.approx(0.1)
    assert data["scores"]["semantique"] == pytest.approx(0.9)


@patch("app.evaluate_toxicity", side_effect=RuntimeError("erreur interne"))
def test_validate_exception_500(mock_tox, client):
    resp = client.post("/validate", json={"text": "texte", "field": "sujet"})
    assert resp.status_code == 500
    assert "error" in resp.get_json()
