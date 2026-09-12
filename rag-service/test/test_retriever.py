"""Tests unitaires du retriever RAG (app/retriever.py)."""
import pytest
from unittest.mock import MagicMock, patch

from app.retriever import (
    Document, SimpleDBRetriever, HybridRetriever,
    load_vectorstore, create_retriever,
)


@pytest.fixture(autouse=True)
def _patch_engine():
    """Remplace app.retriever.engine par un mock sans connexion réelle."""
    with patch("app.retriever.engine") as eng:
        yield eng


class _Row:
    def __init__(self, mapping):
        self._mapping = dict(mapping)

    def __getitem__(self, i):
        return list(self._mapping.values())[i]


class _Result:
    def __init__(self, rows=None, scalar_value=None, one=None):
        self._rows = rows or []
        self._scalar_value = scalar_value
        self._one = one

    def scalar(self):
        return self._scalar_value

    def fetchall(self):
        return [r if isinstance(r, _Row) else r for r in self._rows]

    def fetchone(self):
        return self._one

    @property
    def _mapping(self):
        return self

    def __iter__(self):
        return iter(self._rows)


def _engine_with(results):
    """Construit un mock engine dont connect() éxecute en séquence `results`."""
    conn = MagicMock()
    conn.__enter__.return_value = conn
    conn.execute.side_effect = results
    engine = MagicMock()
    engine.connect.return_value = conn
    return engine


# ----------------------------------------------------------------------------
# Document
# ----------------------------------------------------------------------------
def test_document_defaults():
    doc = Document("contenu")
    assert doc.page_content == "contenu"
    assert doc.metadata == {}
    assert "Document('contenu" in repr(doc)


def test_document_with_metadata():
    doc = Document("c", {"source": "s"})
    assert doc.metadata == {"source": "s"}


# ----------------------------------------------------------------------------
# load_vectorstore / create_retriever
# ----------------------------------------------------------------------------
def test_load_vectorstore_simple_mode():
    assert load_vectorstore("anything") is None


def test_create_retriever():
    r = create_retriever(None)
    assert isinstance(r, SimpleDBRetriever)


# ----------------------------------------------------------------------------
# SimpleDBRetriever.retrieve : stats globales (toujours incluses)
# ----------------------------------------------------------------------------
def test_retrieve_always_returns_stats_globales(mock_api_engine=None):
    import app.retriever as ret_mod
    # 6 tables -> 6 résultats scalar
    results = [_Result(scalar_value=i) for i in range(6)]
    ret_mod.engine.connect.return_value.__enter__.return_value.execute.side_effect = results

    ret = SimpleDBRetriever()
    docs, method = ret.retrieve("Bonjour, tout va bien ?")

    assert method == "simple_db"
    assert len(docs) >= 1
    assert docs[0].metadata["source"] == "stats_globales"
    assert "STATISTIQUES" in docs[0].page_content


def test_retrieve_stats_globales_error_doc():
    import app.retriever as ret_mod
    # la connexion échoue elle-même -> texte d'erreur de stats globales
    ret_mod.engine.connect.side_effect = RuntimeError("db down")
    ret = SimpleDBRetriever()
    docs, method = ret.retrieve("autre chose")
    assert docs[0].metadata["source"] == "stats_error"
    assert method == "simple_db"


# ----------------------------------------------------------------------------
# SimpleDBRetriever.retrieve : sélection par mots-clés
# ----------------------------------------------------------------------------
def test_retrieve_chauffeurs_keyword():
    import app.retriever as ret_mod
    # stats(6) puis _chauffeurs: count(1), list(1), by-status(1)
    results = [
        _Result(scalar_value=3) for _ in range(6)
    ] + [
        _Result(scalar_value=3),
        _Result(rows=[_Row({"prenom": "Jean", "nom": "Dupont", "telephone": "06",
                            "statut_conducteur": "DISPONIBLE", "secteur": "Nord"})]),
        _Result(rows=[_Row({"c0": "DISPONIBLE", "c1": 2})]),
    ]
    ret_mod.engine.connect.return_value.__enter__.return_value.execute.side_effect = results

    ret = SimpleDBRetriever()
    docs, method = ret.retrieve("combien de chauffeurs disponibles ?")
    sources = {d.metadata["source"] for d in docs}
    assert "chauffeurs" in sources
    assert "chauffeurs_statut" in sources


def test_retrieve_vehicules_keyword():
    import app.retriever as ret_mod
    results = [_Result(scalar_value=1) for _ in range(6)] + [
        _Result(rows=[_Row({"statut": "DISPONIBLE", "c1": 5})]),
        _Result(rows=[_Row({"marque": "Renault", "modele": "T", "matricule": "X",
                            "statut": "DISPONIBLE", "type_vehicule": "camion"})]),
    ]
    ret_mod.engine.connect.return_value.__enter__.return_value.execute.side_effect = results
    ret = SimpleDBRetriever()
    docs, _ = ret.retrieve("les véhicules de la flotte")
    sources = {d.metadata["source"] for d in docs}
    assert "vehicules_statut" in sources
    assert "vehicules_liste" in sources


def test_retrieve_trajets_keyword():
    import app.retriever as ret_mod
    results = [_Result(scalar_value=1) for _ in range(6)] + [
        _Result(rows=[_Row({"statut": "TERMINE", "c1": 2, "c2": 120.0})]),
        _Result(rows=[_Row({"point_depart": "A", "destination": "B", "statut": "X",
                            "distance_km": 10, "date_depart": "2026-01-01",
                            "prenom": "J", "nom": "D"})]),
    ]
    ret_mod.engine.connect.return_value.__enter__.return_value.execute.side_effect = results
    ret = SimpleDBRetriever()
    docs, _ = ret.retrieve("quels trajets récents ?")
    sources = {d.metadata["source"] for d in docs}
    assert "trajets_statut" in sources
    assert "trajets_recents" in sources


def test_retrieve_conges_keyword():
    import app.retriever as ret_mod
    results = [_Result(scalar_value=1) for _ in range(6)] + [
        _Result(rows=[_Row({"type": "CP", "statut": "VALIDE", "date_debut": "2026-01-01",
                            "date_fin": "2026-01-05", "prenom": "J", "nom": "D"})]),
        _Result(rows=[_Row({"c0": "VALIDE", "c1": 3})]),
    ]
    ret_mod.engine.connect.return_value.__enter__.return_value.execute.side_effect = results
    ret = SimpleDBRetriever()
    docs, _ = ret.retrieve("congés validés cette semaine")
    sources = {d.metadata["source"] for d in docs}
    assert "conges" in sources
    assert "conges_stats" in sources


def test_retrieve_reclamations_keyword():
    import app.retriever as ret_mod
    results = [_Result(scalar_value=1) for _ in range(6)] + [
        _Result(rows=[_Row({"sujet": "Problème moteur", "statut": "EN_COURS",
                            "priorite": "HAUTE", "date_creation": "2026-01-01",
                            "prenom": "J", "nom": "D"})]),
        _Result(rows=[_Row({"c0": "EN_COURS", "c1": 2})]),
    ]
    ret_mod.engine.connect.return_value.__enter__.return_value.execute.side_effect = results
    ret = SimpleDBRetriever()
    docs, _ = ret.retrieve("réclamations ouvertes")
    sources = {d.metadata["source"] for d in docs}
    assert "reclamations" in sources
    assert "reclamations_stats" in sources


def test_retrieve_utilisateurs_keyword():
    import app.retriever as ret_mod
    results = [_Result(scalar_value=1) for _ in range(6)] + [
        _Result(rows=[_Row({"role": "ADMIN", "c1": 2, "c2": 2})]),
    ]
    ret_mod.engine.connect.return_value.__enter__.return_value.execute.side_effect = results
    ret = SimpleDBRetriever()
    docs, _ = ret.retrieve("les comptes utilisateurs managers")
    assert docs[-1].metadata["source"] == "utilisateurs"


def test_retrieve_connection_failure_yields_stats_error():
    """Échec de connexion -> doc d'erreur des stats (méthode simple_db)."""
    import app.retriever as ret_mod
    ret_mod.engine.connect.side_effect = RuntimeError("fail")
    ret = SimpleDBRetriever()
    docs, method = ret.retrieve("une requête")
    assert docs[0].metadata["source"] == "stats_error"
    assert method == "simple_db"


# ----------------------------------------------------------------------------
# HybridRetriever (wrapper de compatibilité)
# ----------------------------------------------------------------------------
def test_hybrid_retriever_delegates():
    import app.retriever as ret_mod
    results = [_Result(scalar_value=1) for _ in range(6)]
    ret_mod.engine.connect.return_value.__enter__.return_value.execute.side_effect = results
    hybrid = HybridRetriever(None, None)
    docs, method = hybrid.retrieve("véhicules")
    assert method == "simple_db"
    assert isinstance(hybrid.simple_retriever, SimpleDBRetriever)
