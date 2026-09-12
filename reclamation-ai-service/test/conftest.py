"""
Config pytest pour le service Réclamation.

Mocke les dépendances lourdes (torch, transformers, sentence-transformers,
sklearn) avant l'import de `app.py` afin de pouvoir tester la logique pure
sans télécharger/charger les modèles IA ni dépendre de torch/transformers.
Ne modifie AUCUN fichier du service.
"""
import sys
import types
from unittest.mock import MagicMock

import pytest


def _install_heavy_mocks():
    # numpy est disponible dans l'environnement global, on le garde réel
    import numpy  # noqa: F401

    # sklearn.metrics.pairwise.cosine_similarity
    sklearn = types.ModuleType("sklearn")
    sklearn_metrics = types.ModuleType("sklearn.metrics")
    sklearn_metrics_pairwise = types.ModuleType("sklearn.metrics.pairwise")
    sklearn_metrics_pairwise.cosine_similarity = MagicMock(return_value=0.5)
    sklearn_metrics.pairwise = sklearn_metrics_pairwise
    sklearn.metrics = sklearn_metrics
    sys.modules["sklearn"] = sklearn
    sys.modules["sklearn.metrics"] = sklearn_metrics
    sys.modules["sklearn.metrics.pairwise"] = sklearn_metrics_pairwise

    # torch
    sys.modules["torch"] = types.ModuleType("torch")

    # transformers
    transformers = types.ModuleType("transformers")
    transformers.pipeline = MagicMock(return_value=MagicMock())
    transformers.AutoTokenizer = MagicMock()
    transformers.AutoModel = MagicMock()
    sys.modules["transformers"] = transformers

    # sentence_transformers
    st = types.ModuleType("sentence_transformers")
    st.SentenceTransformer = MagicMock(return_value=MagicMock())
    sys.modules["sentence_transformers"] = st


_install_heavy_mocks()

import app  # noqa: E402


@pytest.fixture()
def client():
    """Client Flask de test sur app.app"""
    app.app.config["TESTING"] = True
    return app.app.test_client()


@pytest.fixture(autouse=True)
def _reset_model_globals():
    """Réinitialise les modèles/globales entre chaque test."""
    app.toxicity_classifier = None
    app.semantic_model = None
    app.domain_embedding = None
    yield
