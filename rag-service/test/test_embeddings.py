"""Tests unitaires des embeddings factices (app/embeddings.py)."""
import pytest
from unittest.mock import patch

from app.embeddings import NoEmbeddings, get_embeddings, test_embeddings


def test_no_embeddings_embed_query():
    emb = NoEmbeddings()
    vec = emb.embed_query("bonjour")
    assert vec[0] == float(len("bonjour"))
    assert vec[1:] == [1.0, 0.5]


def test_no_embeddings_embed_documents():
    emb = NoEmbeddings()
    vecs = emb.embed_documents(["a", "bb", "ccc"])
    assert len(vecs) == 3
    assert [v[0] for v in vecs] == [1.0, 2.0, 3.0]


def test_get_embeddings():
    emb = get_embeddings()
    assert isinstance(emb, NoEmbeddings)


def test_test_embeddings_success():
    assert test_embeddings() is True


def test_test_embeddings_failure():
    with patch("app.embeddings.get_embeddings", side_effect=RuntimeError("boom")):
        assert test_embeddings() is False
