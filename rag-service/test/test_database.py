"""Tests unitaires des helpers de base de données (app/database.py)."""
import pytest
from unittest.mock import MagicMock, patch

import app.database as db
from sqlalchemy.exc import SQLAlchemyError


@pytest.fixture(autouse=True)
def mock_engine():
    with patch("app.database.engine") as engine:
        engine.connect.return_value.__enter__.return_value = engine.connect.return_value
        yield engine


# ----------------------------------------------------------------------------
# test_connection
# ----------------------------------------------------------------------------
def test_test_connection_success(mock_engine):
    conn = mock_engine.connect.return_value
    mock_engine.test_connection = None
    # test_connection utilise engine.connect() et execute
    assert db.test_connection() is True


def test_test_connection_failure():
    with patch("app.database.engine") as engine:
        def boom(*a, **k):
            raise SQLAlchemyError("down")
        engine.connect.return_value.__enter__.return_value.execute.side_effect = boom
        assert db.test_connection() is False


# ----------------------------------------------------------------------------
# get_all_tables
# ----------------------------------------------------------------------------
def test_get_all_tables_success(mock_engine):
    inspector = MagicMock()
    inspector.get_table_names.return_value = ["vehicules", "chauffeurs"]
    with patch("app.database.inspect", return_value=inspector):
        assert db.get_all_tables() == ["vehicules", "chauffeurs"]


def test_get_all_tables_failure():
    with patch("app.database.inspect", side_effect=SQLAlchemyError("down")):
        assert db.get_all_tables() == []


# ----------------------------------------------------------------------------
# extract_table_data
# ----------------------------------------------------------------------------
def test_extract_table_data_success(mock_engine):
    conn = mock_engine.connect.return_value
    result = MagicMock()
    row = MagicMock()
    row._mapping = {"id": 1, "statut": "X"}
    result.__iter__ = lambda s: iter([row])
    conn.execute.return_value = result

    rows = db.extract_table_data("vehicules", limit=3, offset=0)
    assert rows == [{"id": 1, "statut": "X"}]
    conn.execute.assert_called_once()


def test_extract_table_data_failure():
    with patch("app.database.engine") as engine:
        def boom(*a, **k):
            raise SQLAlchemyError("down")
        engine.connect.return_value.__enter__.return_value.execute.side_effect = boom
        assert db.extract_table_data("vehicules") == []


# ----------------------------------------------------------------------------
# execute_sql_query
# ----------------------------------------------------------------------------
def test_execute_sql_query_rejects_non_select(mock_engine):
    assert db.execute_sql_query("DELETE FROM vehicules") == []
    mock_engine.execute.assert_not_called()


def test_execute_sql_query_success(mock_engine):
    conn = mock_engine.connect.return_value
    result = MagicMock()
    row = MagicMock()
    row._mapping = {"a": 1}
    result.__iter__ = lambda s: iter([row])
    conn.execute.return_value = result
    rows = db.execute_sql_query("SELECT * FROM vehicules")
    assert rows == [{"a": 1}]


def test_execute_sql_query_failure():
    with patch("app.database.engine") as engine:
        def boom(*a, **k):
            raise SQLAlchemyError("down")
        engine.connect.return_value.__enter__.return_value.execute.side_effect = boom
        assert db.execute_sql_query("SELECT * FROM x") == []


# ----------------------------------------------------------------------------
# get_table_stats
# ----------------------------------------------------------------------------
def test_get_table_stats(mock_engine):
    with patch("app.database.get_all_tables", return_value=["a", "b"]):
        conn = mock_engine.connect.return_value
        result = MagicMock()
        result.scalar.return_value = 5
        conn.execute.return_value = result
        stats = db.get_table_stats()
        assert stats == {"a": 5, "b": 5}


# ----------------------------------------------------------------------------
# get_db
# ----------------------------------------------------------------------------
def test_get_db_yields_and_closes():
    session = MagicMock()
    with patch("app.database.SessionLocal", return_value=session):
        gen = db.get_db()
        s = next(gen)
        assert s is session
        gen.close()
        session.close.assert_called_once()


# ----------------------------------------------------------------------------
# get_priority_tables / TABLES_CONFIG
# ----------------------------------------------------------------------------
def test_get_priority_tables_sorted():
    priority = db.get_priority_tables()
    # la liste doit être triée par priorité croissante
    prios = [db.TABLES_CONFIG[t]["priority"] for t in priority]
    assert prios == sorted(prios)


def test_tables_config_has_required_tables():
    for t in ["vehicules", "chauffeurs", "trajets", "conges", "reclamations",
              "utilisateurs", "entreprises", "secteurs", "pauses_reglementaires",
              "pause_ai_predictions", "notifications", "managers"]:
        assert t in db.TABLES_CONFIG
