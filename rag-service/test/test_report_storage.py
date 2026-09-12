"""Tests unitaires du gestionnaire de stockage des rapports (app/report_storage.py)."""
import os
import pytest
from unittest.mock import patch, MagicMock
from datetime import datetime

from app.report_storage import ReportStorageManager


@pytest.fixture(autouse=True)
def mock_engine():
    """Patche app.report_storage.engine et y cède le mock."""
    with patch("app.report_storage.engine") as engine:
        yield engine


def make_row(**kwargs):
    return MagicMock(_mapping=kwargs)


@pytest.fixture()
def mgr(mock_engine, tmp_path):
    return ReportStorageManager(reports_dir=str(tmp_path / "reports"))


def conn(mock_engine):
    return mock_engine.connect.return_value.__enter__.return_value


# ----------------------------------------------------------------------------
# __init__ / table de métadonnées
# ----------------------------------------------------------------------------
def test_init_creates_dir_and_metadata_table(mgr, mock_engine):
    c = conn(mock_engine)
    c.execute.assert_called()
    create_sql = c.execute.call_args[0][0]
    assert "CREATE TABLE IF NOT EXISTS rapports_metadata" in str(create_sql)


def test_init_engine_error_is_swallowed(mock_engine, tmp_path):
    mock_engine.connect.side_effect = RuntimeError("db down")
    # pas d'exception malgré l'échec DB
    m = ReportStorageManager(reports_dir=str(tmp_path / "reports"))
    assert m.reports_dir.exists()


# ----------------------------------------------------------------------------
# generate_report_id / get_file_path
# ----------------------------------------------------------------------------
def test_generate_report_id_unique(mgr):
    ids = {mgr.generate_report_id() for _ in range(20)}
    assert len(ids) == 20
    for rid in ids:
        assert rid.startswith("RPT_")


def test_get_file_path(mgr, tmp_path):
    path = mgr.get_file_path("RPT_123", "PDF")
    assert path.endswith(os.path.join(str(tmp_path / "reports"), "RPT_123.pdf"))
    assert mgr.get_file_path("RPT_1", "csv").endswith(".csv")


# ----------------------------------------------------------------------------
# save_metadata
# ----------------------------------------------------------------------------
def test_save_metadata_success(mgr, mock_engine, tmp_path):
    fichier = tmp_path / "r.pdf"
    fichier.write_bytes(b"%PDF")
    ok = mgr.save_metadata("RPT_1", "Titre", "PDF", "vehicules",
                           "user1", None, str(fichier), 10, 500)
    assert ok is True
    c = conn(mock_engine)
    c.commit.assert_called()
    insert_sql = c.execute.call_args[0][0]
    assert "INSERT INTO rapports_metadata" in str(insert_sql)


def test_save_metadata_engine_error(mgr, mock_engine, tmp_path):
    conn(mock_engine).execute.side_effect = RuntimeError("fail")
    ok = mgr.save_metadata("RPT_1", "Titre", "CSV", "trajets", "u", None,
                           "x.csv", 3, 10, datetime(2026, 1, 1), datetime(2026, 1, 2))
    assert ok is False


# ----------------------------------------------------------------------------
# get_reports_list
# ----------------------------------------------------------------------------
def test_get_reports_list(mgr, mock_engine):
    conn(mock_engine).execute.return_value = [make_row(report_id="A"), make_row(report_id="B")]
    rows = mgr.get_reports_list()
    assert len(rows) == 2
    assert rows[0]["report_id"] == "A"
    assert rows[1]["report_id"] == "B"


def test_get_reports_list_with_filters(mgr, mock_engine):
    c = conn(mock_engine)
    c.execute.return_value = []
    rows = mgr.get_reports_list(user_id="u1", domaine="vehicules", limit=10)
    assert rows == []
    query, params = c.execute.call_args[0]
    assert "user_id = :user_id" in str(query)
    assert "domaine = :domaine" in str(query)
    assert params["user_id"] == "u1"


def test_get_reports_list_error(mgr, mock_engine):
    conn(mock_engine).execute.side_effect = RuntimeError("boom")
    assert mgr.get_reports_list() == []


# ----------------------------------------------------------------------------
# get_report_by_id
# ----------------------------------------------------------------------------
def test_get_report_by_id_found(mgr, mock_engine):
    conn(mock_engine).execute.return_value.fetchone.return_value = make_row(report_id="RPT_X", titre="T")
    report = mgr.get_report_by_id("RPT_X")
    assert report["report_id"] == "RPT_X"


def test_get_report_by_id_not_found(mgr, mock_engine):
    conn(mock_engine).execute.return_value.fetchone.return_value = None
    assert mgr.get_report_by_id("ABSENT") is None


def test_get_report_by_id_error(mgr, mock_engine):
    conn(mock_engine).execute.side_effect = RuntimeError("boom")
    assert mgr.get_report_by_id("RPT_X") is None


# ----------------------------------------------------------------------------
# delete_report
# ----------------------------------------------------------------------------
def test_delete_report_not_found(mgr, mock_engine):
    conn(mock_engine).execute.return_value.fetchone.return_value = None
    assert mgr.delete_report("ABSENT") is False


def test_delete_report_success(mgr, mock_engine, tmp_path):
    fichier = tmp_path / "rapport.pdf"
    fichier.write_bytes(b"PDF data")
    c = conn(mock_engine)
    c.execute.return_value.fetchone.return_value = make_row(
        report_id="RPT_1", fichier_path=str(fichier))
    ok = mgr.delete_report("RPT_1")
    assert ok is True
    assert not fichier.exists()
    delete_sql = c.execute.call_args[0][0]
    assert "DELETE FROM rapports_metadata" in str(delete_sql)


def test_delete_report_file_missing_still_ok(mgr, mock_engine, tmp_path):
    # fichier inexistant -> suppression métadonnées quand même -> True
    c = conn(mock_engine)
    c.execute.return_value.fetchone.return_value = make_row(
        report_id="RPT_1", fichier_path=str(tmp_path / "absent.pdf"))
    assert mgr.delete_report("RPT_1") is True


def test_delete_report_metadata_error(mgr, mock_engine, tmp_path):
    c = conn(mock_engine)
    # 1er execute (get_report_by_id) renvoie un rapport ; 2e (DELETE) lève
    c.execute.side_effect = [
        MagicMock(fetchone=MagicMock(return_value=make_row(report_id="RPT_1", fichier_path=None))),
        RuntimeError("boom"),
    ]
    assert mgr.delete_report("RPT_1") is False
