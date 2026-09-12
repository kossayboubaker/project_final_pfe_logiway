"""Tests unitaires du LLM Gemini (app/llm.py)."""
import pytest
from unittest.mock import MagicMock, patch

from app import llm


@pytest.fixture(autouse=True)
def _patch_genai():
    with patch("app.llm.genai") as genai:
        yield genai


@pytest.fixture(autouse=True)
def _reset_settings():
    from app.config import settings
    settings.GOOGLE_API_KEY = "TEST_KEY"
    yield


# ----------------------------------------------------------------------------
# GeminiLLM
# ----------------------------------------------------------------------------
def test_gemini_llm_init():
    with patch("app.llm.genai") as genai:
        model = MagicMock()
        genai.GenerativeModel.return_value = model
        g = llm.GeminiLLM()
        genai.configure.assert_called_once_with(api_key="TEST_KEY")
        genai.GenerativeModel.assert_called_once()
        assert g.model is model


def test_gemini_llm_invoke_success():
    with patch("app.llm.genai") as genai, patch.object(llm.settings, "LLM_TEMPERATURE", 0.1):
        resp = MagicMock()
        resp.text = "Bonjour"
        model = MagicMock()
        model.generate_content.return_value = resp
        genai.GenerativeModel.return_value = model

        g = llm.GeminiLLM()
        assert g.invoke("prompt") == "Bonjour"
        # le prompt est passé en position né en 1er argument
        assert model.generate_content.call_args.args[0] == "prompt"


def test_gemini_llm_invoke_no_text():
    with patch("app.llm.genai") as genai:
        resp = MagicMock()
        resp.text = None
        model = MagicMock()
        model.generate_content.return_value = resp
        genai.GenerativeModel.return_value = model
        g = llm.GeminiLLM()
        assert g.invoke("prompt") == "Pas de réponse générée"


def test_gemini_llm_invoke_exception():
    with patch("app.llm.genai") as genai:
        model = MagicMock()
        model.generate_content.side_effect = RuntimeError("boom")
        genai.GenerativeModel.return_value = model
        g = llm.GeminiLLM()
        assert "Erreur lors de la génération" in g.invoke("prompt")


# ----------------------------------------------------------------------------
# test_gemini_connection
# ----------------------------------------------------------------------------
def test_test_gemini_connection_no_key():
    with patch.object(llm.settings, "GOOGLE_API_KEY", ""):
        assert llm.test_gemini_connection() is False


def test_test_gemini_connection_success():
    with patch("app.llm.genai") as genai:
        resp = MagicMock()
        resp.text = "OK"
        model = MagicMock()
        model.generate_content.return_value = resp
        genai.GenerativeModel.return_value = model
        assert llm.test_gemini_connection() is True


def test_test_gemini_connection_no_response_text():
    with patch("app.llm.genai") as genai:
        resp = MagicMock()
        resp.text = None
        model = MagicMock()
        model.generate_content.return_value = resp
        genai.GenerativeModel.return_value = model
        assert llm.test_gemini_connection() is False


def test_test_gemini_connection_exception():
    with patch("app.llm.genai") as genai:
        genai.GenerativeModel.side_effect = RuntimeError("api down")
        assert llm.test_gemini_connection() is False


# ----------------------------------------------------------------------------
# get_llm / test_llm
# ----------------------------------------------------------------------------
def test_get_llm_returns_gemini():
    with patch("app.llm.genai"):
        g = llm.get_llm()
        assert isinstance(g, llm.GeminiLLM)


def test_test_llm_success():
    with patch("app.llm.get_llm") as get_mock:
        g = MagicMock()
        g.invoke.return_value = "Bonjour"
        get_mock.return_value = g
        assert llm.test_llm() is True
        g.invoke.assert_called_once()


def test_test_llm_failure():
    with patch("app.llm.get_llm") as get_mock:
        get_mock.side_effect = RuntimeError("boom")
        assert llm.test_llm() is False
