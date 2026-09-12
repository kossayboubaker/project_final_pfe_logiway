"""Tests unitaires des endpoints chatbot RAG (app/main.py).

Les endpoints FastAPI sont des coroutines : on les appelle directement via
asyncio.run() (pas de TestClient -> pas besoin d'httpx).
"""
import asyncio
import pytest
from unittest.mock import MagicMock, patch
from fastapi import HTTPException

from app.main import (
    root, health_check, poser_question, get_stats,
)
from app.models import QuestionRequest


class _Doc:
    def __init__(self, content, metadata=None):
        self.page_content = content
        self.metadata = metadata or {}


# ----------------------------------------------------------------------------
# root
# ----------------------------------------------------------------------------
def test_root():
    out = asyncio.run(root())
    assert out["status"] == "running"
    assert out["service"] == "Logiway RAG Chatbot - Gemini"
    assert out["endpoints"]["question"] == "/api/rag/question"


# ----------------------------------------------------------------------------
# health_check
# ----------------------------------------------------------------------------
@patch("app.main.test_connection", return_value=True)
@patch("app.main.test_gemini_connection", return_value=True)
def test_health_check_healthy(mock_gemini, mock_db):
    import app.main as main
    main.rag_chain = object()
    try:
        resp = asyncio.run(health_check())
    finally:
        main.rag_chain = None
    assert resp.status == "healthy"
    assert resp.database_connected is True
    assert resp.ollama_connected is True
    assert resp.vectorstore_ready is True
    assert resp.timestamp is not None


@patch("app.main.test_connection", return_value=False)
@patch("app.main.test_gemini_connection", return_value=False)
def test_health_check_degraded(mock_gemini, mock_db):
    import app.main as main
    main.rag_chain = None
    try:
        resp = asyncio.run(health_check())
        assert resp.status == "degraded"
        assert resp.database_connected is False
        assert resp.vectorstore_ready is False
    finally:
        main.rag_chain = None


# ----------------------------------------------------------------------------
# poser_question
# ----------------------------------------------------------------------------
def test_poser_question_not_initialized_503():
    import app.main as main
    main.rag_chain = None
    with pytest.raises(HTTPException) as exc:
        asyncio.run(poser_question(QuestionRequest(question="bonjour")))
    assert exc.value.status_code == 503


def test_poser_question_success():
    import app.main as main
    fake_chain = MagicMock()
    fake_chain.return_value = {
        "result": "Il y a 15 véhicules disponibles.",
        "source_documents": [
            _Doc("contenu " + "abc" * 100, {"source": "vehicules", "score": 0.95}),
            _Doc("autre", {"source": "chauffeurs", "score": 0.8}),
        ],
    }
    main.rag_chain = fake_chain
    try:
        resp = asyncio.run(poser_question(QuestionRequest(question="combien de véhicules ?")))
        assert resp.reponse == "Il y a 15 véhicules disponibles."
        assert resp.retrieval_method == "simple_db"
        assert len(resp.sources) == 2  # max 3
        first = resp.sources[0]
        assert first.table == "vehicules"
        assert first.score == 0.95
        assert len(first.content) <= 200
        assert resp.temps_reponse_ms >= 0
        assert resp.model_used
    finally:
        main.rag_chain = None


def test_poser_question_limits_sources_to_3():
    import app.main as main
    fake_chain = MagicMock()
    fake_chain.return_value = {
        "result": "réponse",
        "source_documents": [
            _Doc(f"doc{i}", {"source": f"t{i}", "score": 0.1}) for i in range(5)
        ],
    }
    main.rag_chain = fake_chain
    try:
        resp = asyncio.run(poser_question(QuestionRequest(question="q")))
        assert len(resp.sources) == 3
    finally:
        main.rag_chain = None


def test_poser_question_missing_result_defaults():
    import app.main as main
    fake_chain = MagicMock()
    fake_chain.return_value = {"source_documents": []}
    main.rag_chain = fake_chain
    try:
        resp = asyncio.run(poser_question(QuestionRequest(question="q")))
        assert resp.reponse == "Erreur de génération"
        assert resp.sources == []
    finally:
        main.rag_chain = None


def test_poser_question_exception_500():
    import app.main as main
    fake_chain = MagicMock(side_effect=RuntimeError("boom"))
    main.rag_chain = fake_chain
    try:
        with pytest.raises(HTTPException) as exc:
            asyncio.run(poser_question(QuestionRequest(question="q")))
        assert exc.value.status_code == 500
    finally:
        main.rag_chain = None


# ----------------------------------------------------------------------------
# get_stats
# ----------------------------------------------------------------------------
def test_get_stats_success():
    with patch("app.database.get_table_stats", return_value={"vehicules": 5}):
        resp = asyncio.run(get_stats())
    assert resp["database"]["tables_count"] == 1
    assert resp["database"]["total_rows"] == 5
    assert "config" in resp
    assert resp["config"]["api_provider"] == "Google Gemini"


def test_get_stats_exception_500():
    with patch("app.database.get_table_stats", side_effect=RuntimeError("boom")):
        with pytest.raises(HTTPException) as exc:
            asyncio.run(get_stats())
        assert exc.value.status_code == 500
