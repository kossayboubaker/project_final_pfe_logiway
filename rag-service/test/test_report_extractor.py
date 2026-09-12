"""Tests unitaires de l'extracteur de données de rapports (app/report_extractor.py)."""
import pytest
from unittest.mock import patch, MagicMock

from app.report_extractor import ReportDataExtractor


@pytest.fixture()
def extractor():
    return ReportDataExtractor()


# ----------------------------------------------------------------------------
# extract : domaine global
# ----------------------------------------------------------------------------
@patch("app.report_extractor.execute_sql_query")
def test_extract_global(mock_execute):
    mock_execute.return_value = [{"statut": "DISPONIBLE", "count": 5}]
    extractor = ReportDataExtractor()
    result = extractor.extract({"domaine": "global", "periode": {}, "filtres": {}})
    assert result["data"][0]["statistiques"]["vehicules"] == mock_execute.return_value
    assert result["colonnes"] == ["statistiques", "alertes"]
    assert result["metadata"]["domaine"] == "global"
    # 4 requêtes (vehicules, chauffeurs, trajets, reclamations)
    assert mock_execute.call_count == 4


@patch("app.report_extractor.execute_sql_query", side_effect=RuntimeError("db down"))
def test_extract_global_catches_errors(mock_execute):
    extractor = ReportDataExtractor()
    result = extractor.extract({"domaine": "global", "periode": {}, "filtres": {}})
    # statistiques vides mais pas d'exception
    assert result["metadata"]["domaine"] == "global"
    assert result["data"] == [{"statistiques": {}, "alertes": []}]


# ----------------------------------------------------------------------------
# extract : domaine spécifique
# ----------------------------------------------------------------------------
@patch("app.report_extractor.execute_sql_query")
def test_extract_domaine_vehicules(mock_execute):
    mock_execute.return_value = [
        {"id": 1, "matricule": "X", "statut": "DISPONIBLE"},
    ]
    extractor = ReportDataExtractor()
    result = extractor.extract({"domaine": "vehicules", "periode": {}, "filtres": {}})
    assert result["data"] == mock_execute.return_value
    assert result["metadata"]["table_source"] == "vehicules"
    assert result["metadata"]["nombre_lignes"] == 1


@patch("app.report_extractor.execute_sql_query")
def test_extract_domaine_unknown(mock_execute):
    extractor = ReportDataExtractor()
    result = extractor.extract({"domaine": "inconnu", "periode": {}, "filtres": {}})
    assert result == {"data": [], "colonnes": [], "metadata": {}}
    mock_execute.assert_not_called()


@patch("app.report_extractor.execute_sql_query")
def test_extract_domaine_with_period_and_statut(mock_execute):
    from datetime import datetime
    mock_execute.return_value = []
    extractor = ReportDataExtractor()
    result = extractor.extract({
        "domaine": "reclamations",
        "periode": {"date_debut": datetime(2026, 1, 1), "date_fin": datetime(2026, 2, 1),
                    "description": "hier"},
        "filtres": {"statut": ["EN_COURS"]},
    })
    mock_execute.assert_called_once()
    query_sql = mock_execute.call_args[0][0]
    assert "WHERE" in query_sql
    assert "BETWEEN" in query_sql
    assert "statut" in query_sql
    assert "LIMIT 500" in query_sql


@patch("app.report_extractor.execute_sql_query")
def test_extract_domaine_no_period_no_statut(mock_execute):
    mock_execute.return_value = []
    extractor = ReportDataExtractor()
    result = extractor.extract({"domaine": "trajets", "periode": {}, "filtres": {}})
    mock_execute.assert_called_once()
    query_sql = mock_execute.call_args[0][0]
    assert "WHERE" not in query_sql
    assert "ORDER BY trajets.id DESC" in query_sql


@patch("app.report_extractor.execute_sql_query", side_effect=RuntimeError("query fail"))
def test_extract_domaine_execute_error(mock_execute):
    extractor = ReportDataExtractor()
    result = extractor.extract({"domaine": "vehicules", "periode": {}, "filtres": {}})
    assert result["data"] == []
    assert "erreur" in result["metadata"]


def test_extract_domaine_chauffeurs_adds_jointure_columns():
    # vérifier que la jointure utilisateurs est dans la requête
    with patch("app.report_extractor.execute_sql_query", return_value=[]) as mock_execute:
        extractor = ReportDataExtractor()
        extractor.extract({"domaine": "chauffeurs", "periode": {}, "filtres": {}})
        query_sql = mock_execute.call_args[0][0]
        assert "LEFT JOIN utilisateurs" in query_sql
        assert "utilisateurs.nom as nom" in query_sql
        assert "chauffeurs.statut_conducteur" in query_sql


# ----------------------------------------------------------------------------
# _get_date_column
# ----------------------------------------------------------------------------
def test_get_date_column():
    e = ReportDataExtractor()
    assert e._get_date_column("trajets") == "date_depart"
    assert e._get_date_column("conges") == "date_debut"
    assert e._get_date_column("reclamations") == "date_creation"
    assert e._get_date_column("chauffeurs") is None
    assert e._get_date_column("inconnu") is None
