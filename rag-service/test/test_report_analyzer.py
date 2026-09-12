"""Tests unitaires de l'analyseur de requêtes de rapports (app/report_analyzer.py)."""
import pytest
from unittest.mock import MagicMock, patch

from app.report_analyzer import ReportRequestAnalyzer


@pytest.fixture()
def analyzer():
    with patch("app.report_analyzer.get_llm", return_value=MagicMock()):
        return ReportRequestAnalyzer()


# ----------------------------------------------------------------------------
# _detect_format
# ----------------------------------------------------------------------------
def test_detect_format_pdf_keyword(analyzer):
    assert analyzer._detect_format("rapport pdf des congés", "PDF") == "PDF"


def test_detect_format_csv_keyword(analyzer):
    assert analyzer._detect_format("tableur excel des trajets", "PDF") == "CSV"


def test_detect_format_txt_keyword(analyzer):
    assert analyzer._detect_format("fichier texte", "PDF") == "TXT"


def test_detect_format_default(analyzer):
    assert analyzer._detect_format("rapport des congés", "PDF") == "PDF"


# ----------------------------------------------------------------------------
# _detect_domain
# ----------------------------------------------------------------------------
def test_detect_domain_reclamations(analyzer):
    assert analyzer._detect_domain("les réclamations ouvertes") == "reclamations"


def test_detect_domain_vehicules(analyzer):
    assert analyzer._detect_domain("la flotte de véhicules") == "vehicules"


def test_detect_domain_chauffeurs(analyzer):
    assert analyzer._detect_domain("les chauffeurs actifs") == "chauffeurs"


def test_detect_domain_default_global(analyzer):
    assert analyzer._detect_domain("rien de pertinent ici") == "global"


# ----------------------------------------------------------------------------
# _detect_period
# ----------------------------------------------------------------------------
def test_detect_period_current(analyzer):
    p = analyzer._detect_period("rapport pour aujourd'hui")
    assert p["description"] == "aujourd'hui"
    assert p["date_fin"] is not None
    assert p["date_debut"] is not None


def test_detect_period_last_week(analyzer):
    p = analyzer._detect_period("semaine dernière")
    assert p["description"] == "semaine dernière"
    assert p["date_debut"] <= p["date_fin"]


def test_detect_period_default_all(analyzer):
    p = analyzer._detect_period("toutes les données")
    assert p["description"] == "Toutes périodes"
    assert p["date_debut"] is None
    assert p["date_fin"] is None


# ----------------------------------------------------------------------------
# _extract_filters_gemini
# ----------------------------------------------------------------------------
def test_extract_filters_with_statut(analyzer):
    f = analyzer._extract_filters_gemini("chauffeurs actifs", "chauffeurs")
    assert "DISPONIBLE" in f["statut"] or "ACTIF" in f["statut"]
    assert f["tri"] == "date"


def test_extract_filters_no_statut(analyzer):
    f = analyzer._extract_filters_gemini("les trajets", "trajets")
    assert f["statut"] == []


def test_extract_filters_valide_conges(analyzer):
    f = analyzer._extract_filters_gemini("congés validés", "conges")
    assert "VALIDE" in f["statut"]


# ----------------------------------------------------------------------------
# _generate_title
# ----------------------------------------------------------------------------
def test_generate_title_with_statut(analyzer):
    titre = analyzer._generate_title("reclamations",
                                     {"description": "hier"},
                                     {"statut": ["HAUTE"]})
    assert "Rapport Reclamations - hier" in titre
    assert "statut HAUTE" in titre


def test_generate_title_without_filters(analyzer):
    titre = analyzer._generate_title("vehicules",
                                     {"description": "Toutes périodes"},
                                     {"statut": []})
    assert titre == "Rapport Vehicules - Toutes périodes"


# ----------------------------------------------------------------------------
# analyze (end-to-end sans Gemini réel)
# ----------------------------------------------------------------------------
def test_analyze_end_to_end(analyzer):
    result = analyzer.analyze("rapport PDF des réclamations ouvertes cette semaine")
    assert result["format"] == "PDF"
    assert result["domaine"] == "reclamations"
    assert result["periode"]["description"] == "cette semaine"
    assert result["requete_originale"] == "rapport PDF des réclamations ouvertes cette semaine"
    assert "Rapport" in result["titre"]
