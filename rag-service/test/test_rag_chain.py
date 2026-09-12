"""Tests unitaires de la chaîne RAG (app/rag_chain.py)."""
import pytest
from unittest.mock import MagicMock, patch

from app.rag_chain import SimpleRAGChain, create_rag_chain, format_response, PROMPT_TEMPLATE


class _FakeDoc:
    def __init__(self, content, metadata=None):
        self.page_content = content
        self.metadata = metadata or {}


# ----------------------------------------------------------------------------
# SimpleRAGChain
# ----------------------------------------------------------------------------
def test_chain_call_builds_context_calls_llm():
    retriever = MagicMock()
    retriever.retrieve.return_value = [
        _FakeDoc("doc1", {"source": "s1", "score": 0.9}),
        _FakeDoc("doc2", {"source": "s2"}),
    ], "simple_db"

    llm = MagicMock()
    llm.invoke.return_value = "Réponse générée"

    chain = SimpleRAGChain(retriever, llm)
    result = chain({"query": "Combien de véhicules ?"})

    assert result["result"] == "Réponse générée"
    assert result["retrieval_method"] == "simple_db"
    assert result["source_documents"] == retriever.retrieve.return_value[0]

    # le prompt construit doit contenir le contexte et la question
    prompt = llm.invoke.call_args[0][0]
    assert "doc1" in prompt and "doc2" in prompt
    assert "Combien de véhicules ?" in prompt
    # le format placeholders a disparu (formaté)
    assert "{context}" not in prompt and "{question}" not in prompt


def test_chain_call_empty_context():
    retriever = MagicMock()
    retriever.retrieve.return_value = [], "simple_db"
    llm = MagicMock()
    llm.invoke.return_value = "réponse"

    chain = SimpleRAGChain(retriever, llm)
    result = chain({"query": "Salut"})

    prompt = llm.invoke.call_args[0][0]
    assert "Aucune donnée spécifique trouvée" in prompt
    assert result["retrieval_method"] == "simple_db"


def test_chain_call_no_query_key():
    retriever = MagicMock()
    retriever.retrieve.return_value = [_FakeDoc("c", {"source": "s"})], "simple_db"
    llm = MagicMock()
    llm.invoke.return_value = "x"

    chain = SimpleRAGChain(retriever, llm)
    result = chain({})
    # query vide -> prompt sans question ; ne doit pas lever
    assert result["source_documents"]


# ----------------------------------------------------------------------------
# create_rag_chain
# ----------------------------------------------------------------------------
def test_create_rag_chain():
    retriever = MagicMock()
    llm = MagicMock()
    chain = create_rag_chain(retriever, llm)
    assert isinstance(chain, SimpleRAGChain)
    assert chain.retriever is retriever
    assert chain.llm is llm


# ----------------------------------------------------------------------------
# format_response
# ----------------------------------------------------------------------------
def test_format_response_with_sources():
    result = {
        "result": "La réponse",
        "source_documents": [
            _FakeDoc("contenu " + "x" * 500, {"source": "vehicules", "score": 0.95}),
            _FakeDoc("autre", {"source": "chauffeurs"}),
        ],
    }
    out = format_response(result, "simple_db")
    assert out["reponse"] == "La réponse"
    assert out["retrieval_method"] == "simple_db"
    assert len(out["sources"]) == 2
    # contenu tronqué à 200
    assert len(out["sources"][0]["content"]) == 200
    assert out["sources"][0]["table"] == "vehicules"
    assert out["sources"][0]["score"] == 0.95
    assert out["sources"][1]["table"] == "chauffeurs"


def test_format_response_defaults():
    out = format_response({}, "unknown")
    assert out["reponse"] == "Erreur de génération"
    assert out["sources"] == []
    assert out["retrieval_method"] == "unknown"


def test_format_response_metadata_default_source():
    result = {"result": "r", "source_documents": [_FakeDoc("c", {})]}
    out = format_response(result, "m")
    assert out["sources"][0]["table"] == "unknown"
    assert out["sources"][0]["score"] is None
