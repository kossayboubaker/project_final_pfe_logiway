"""Tests unitaires des endpoints de génération de rapports (app/main.py).

Les endpoints sont des coroutines FastAPI appelées directement via asyncio.run(),
avec les globaux de module mockés via monkeypatch.
"""
import asyncio
import pytest
from unittest.mock import MagicMock, patch
from fastapi import HTTPException
from datetime import datetime

import app.main as main
from app.main import (
    generate_report, list_reports, get_report_metadata, download_report, delete_report,
)
from app.models import GenerateReportRequest


# ----------------------------------------------------------------------------
# Fixtures utilitaires
# ----------------------------------------------------------------------------
@pytest.fixture()
def reports_ready(monkeypatch, tmp_path):
    """Configure les globaux de rapports et retourne les mocks."""
    fake_analyzer = MagicMock()
    fake_extractor = MagicMock()
    fake_storage = MagicMock()
    monkeypatch.setattr(main, "report_analyzer", fake_analyzer)
    monkeypatch.setattr(main, "report_extractor", fake_extractor)
    monkeypatch.setattr(main, "report_storage", fake_storage)
    return fake_analyzer, fake_extractor, fake_storage


@pytest.fixture()
def reports_not_ready(monkeypatch):
    monkeypatch.setattr(main, "report_analyzer", None)
    monkeypatch.setattr(main, "report_extractor", None)
    monkeypatch.setattr(main, "report_storage", None)


ANALYSE = {
    "titre": "Rapport des véhicules",
    "domaine": "vehicules",
    "format": "PDF",
    "periode": {},
    "filtres": {},
    "requete_naturelle": "rapport véhicules",
}


# ----------------------------------------------------------------------------
# generate_report
# ----------------------------------------------------------------------------
def test_generate_report_not_initialized_503(reports_not_ready):
    with pytest.raises(HTTPException) as exc:
        asyncio.run(generate_report(GenerateReportRequest(
            requete_naturelle="rapport", user_id="u1")))
    assert exc.value.status_code == 503


def test_generate_report_success_pdf(reports_ready, tmp_path):
    analyzer, extractor, storage = reports_ready
    analyzer.analyze.return_value = ANALYSE
    extractor.extract.return_value = {
        "data": [{"id": 1, "matricule": "X"}],
        "colonnes": ["id", "matricule"],
        "metadata": {"domaine": "vehicules", "nombre_lignes": 1},
    }
    storage.generate_report_id.return_value = "RPT_1"
    fichier = tmp_path / "RPT_1.pdf"
    fichier.write_bytes(b"%PDF-1.4")
    storage.get_file_path.return_value = str(fichier)
    storage.save_metadata.return_value = True

    with patch("app.main.PDFReportGenerator") as Gen:
        Gen.return_value.generate.return_value = True
        resp = asyncio.run(generate_report(GenerateReportRequest(
            requete_naturelle="rapport véhicules", user_id="u1")))
    assert resp.success is True
    assert resp.report_id == "RPT_1"
    assert resp.metadata.titre == "Rapport des véhicules"
    assert resp.metadata.domaine == "vehicules"
    assert "/api/reports/download/RPT_1" in resp.url_download


def test_generate_report_csv(reports_ready, tmp_path):
    analyzer, extractor, storage = reports_ready
    analyse = dict(ANALYSE, format="CSV")
    analyzer.analyze.return_value = analyse
    extractor.extract.return_value = {"data": [{"a": 1}], "colonnes": ["a"],
                                      "metadata": {}}
    fichier = tmp_path / "RPT_2.csv"
    fichier.write_text("a\n1\n")
    storage.generate_report_id.return_value = "RPT_2"
    storage.get_file_path.return_value = str(fichier)

    with patch("app.main.CSVReportGenerator") as Gen:
        Gen.return_value.generate.return_value = True
        resp = asyncio.run(generate_report(GenerateReportRequest(
            requete_naturelle="rapport", user_id="u1", format_prefere="CSV")))
    assert resp.success is True
    Gen.return_value.generate.assert_called_once()


def test_generate_report_txt(reports_ready, tmp_path):
    analyzer, extractor, storage = reports_ready
    analyzer.analyze.return_value = dict(ANALYSE, format="TXT")
    extractor.extract.return_value = {"data": [{"a": 1}], "colonnes": ["a"],
                                      "metadata": {}}
    fichier = tmp_path / "RPT_3.txt"
    fichier.write_text("a\n")
    storage.generate_report_id.return_value = "RPT_3"
    storage.get_file_path.return_value = str(fichier)

    with patch("app.main.TXTReportGenerator") as Gen:
        Gen.return_value.generate.return_value = True
        resp = asyncio.run(generate_report(GenerateReportRequest(
            requete_naturelle="rapport", user_id="u1", format_prefere="TXT")))
    assert resp.success is True


def test_generate_report_no_data(reports_ready):
    analyzer, extractor, storage = reports_ready
    analyzer.analyze.return_value = ANALYSE
    extractor.extract.return_value = {"data": [], "colonnes": [], "metadata": {}}
    resp = asyncio.run(generate_report(GenerateReportRequest(
        requete_naturelle="rapport", user_id="u1")))
    assert resp.success is False
    assert resp.report_id == ""
    storage.generate_report_id.assert_not_called()


def test_generate_report_generator_failure_500(reports_ready, tmp_path):
    analyzer, extractor, storage = reports_ready
    analyzer.analyze.return_value = ANALYSE
    extractor.extract.return_value = {"data": [{"a": 1}], "colonnes": ["a"],
                                      "metadata": {}}
    storage.generate_report_id.return_value = "RPT_1"
    storage.get_file_path.return_value = str(tmp_path / "RPT_1.pdf")

    with patch("app.main.PDFReportGenerator") as Gen:
        Gen.return_value.generate.return_value = False
        with pytest.raises(HTTPException) as exc:
            asyncio.run(generate_report(GenerateReportRequest(
                requete_naturelle="rapport", user_id="u1")))
        assert exc.value.status_code == 500


def test_generate_report_unsupported_format_500(reports_ready, tmp_path):
    analyzer, extractor, storage = reports_ready
    analyzer.analyze.return_value = dict(ANALYSE, format="DOCX")
    extractor.extract.return_value = {"data": [{"a": 1}], "colonnes": ["a"],
                                      "metadata": {}}
    storage.generate_report_id.return_value = "RPT_1"
    storage.get_file_path.return_value = str(tmp_path / "RPT_1.docx")
    with pytest.raises(HTTPException) as exc:
        asyncio.run(generate_report(GenerateReportRequest(
            requete_naturelle="rapport", user_id="u1")))
    assert exc.value.status_code == 500


def test_generate_report_extractor_error_500(reports_ready):
    analyzer, extractor, storage = reports_ready
    analyzer.analyze.side_effect = RuntimeError("analyse fail")
    with pytest.raises(HTTPException) as exc:
        asyncio.run(generate_report(GenerateReportRequest(
            requete_naturelle="rapport", user_id="u1")))
    assert exc.value.status_code == 500


# ----------------------------------------------------------------------------
# list_reports
# ----------------------------------------------------------------------------
def test_list_reports_not_initialized_503(reports_not_ready):
    with pytest.raises(HTTPException) as exc:
        asyncio.run(list_reports())
    assert exc.value.status_code == 503


def test_list_reports_success(reports_ready):
    analyzer, extractor, storage = reports_ready
    storage.get_reports_list.return_value = [
        {"report_id": "RPT_1", "titre": "T", "format": "PDF", "domaine": "vehicules",
         "statut": "COMPLETED", "user_id": "u1", "date_creation": datetime(2026, 1, 1),
         "entreprise_id": None}
    ]
    resp = asyncio.run(list_reports(user_id="u1", domaine="vehicules", limit=10))
    assert resp.total == 1
    assert resp.rapports[0].report_id == "RPT_1"
    storage.get_reports_list.assert_called_with("u1", "vehicules", 10)


def test_list_reports_error_500(reports_ready):
    analyzer, extractor, storage = reports_ready
    storage.get_reports_list.side_effect = RuntimeError("boom")
    with pytest.raises(HTTPException) as exc:
        asyncio.run(list_reports())
    assert exc.value.status_code == 500


# ----------------------------------------------------------------------------
# get_report_metadata
# ----------------------------------------------------------------------------
def test_get_report_metadata_not_initialized_503(reports_not_ready):
    with pytest.raises(HTTPException) as exc:
        asyncio.run(get_report_metadata("RPT_1"))
    assert exc.value.status_code == 503


def test_get_report_metadata_found(reports_ready):
    analyzer, extractor, storage = reports_ready
    storage.get_report_by_id.return_value = {
        "report_id": "RPT_1", "titre": "T", "format": "PDF", "domaine": "vehicules",
        "statut": "COMPLETED", "user_id": "u1", "date_creation": datetime(2026, 1, 1),
        "entreprise_id": None}
    meta = asyncio.run(get_report_metadata("RPT_1"))
    assert meta.report_id == "RPT_1"
    assert "/api/reports/download/RPT_1" in meta.url_telechargement


def test_get_report_metadata_not_found_404(reports_ready):
    analyzer, extractor, storage = reports_ready
    storage.get_report_by_id.return_value = None
    with pytest.raises(HTTPException) as exc:
        asyncio.run(get_report_metadata("ABSENT"))
    assert exc.value.status_code == 404


def test_get_report_metadata_error_500(reports_ready):
    analyzer, extractor, storage = reports_ready
    storage.get_report_by_id.side_effect = RuntimeError("boom")
    with pytest.raises(HTTPException) as exc:
        asyncio.run(get_report_metadata("RPT_1"))
    assert exc.value.status_code == 500


# ----------------------------------------------------------------------------
# download_report
# ----------------------------------------------------------------------------
def test_download_report_not_initialized_503(reports_not_ready):
    with pytest.raises(HTTPException) as exc:
        asyncio.run(download_report("RPT_1"))
    assert exc.value.status_code == 503


def test_download_report_success(reports_ready, tmp_path):
    analyzer, extractor, storage = reports_ready
    fichier = tmp_path / "rapport.pdf"
    fichier.write_bytes(b"%PDF")
    storage.get_report_by_id.return_value = {
        "report_id": "RPT_1", "fichier_path": str(fichier), "format": "PDF",
        "titre": "Rapport test"}
    resp = asyncio.run(download_report("RPT_1"))
    assert resp.media_type == "application/pdf"
    assert resp.filename.startswith("Rapport_test_")


def test_download_report_not_found_404(reports_ready):
    analyzer, extractor, storage = reports_ready
    storage.get_report_by_id.return_value = None
    with pytest.raises(HTTPException) as exc:
        asyncio.run(download_report("ABSENT"))
    assert exc.value.status_code == 404


def test_download_report_file_missing_404(reports_ready, tmp_path):
    analyzer, extractor, storage = reports_ready
    storage.get_report_by_id.return_value = {
        "report_id": "RPT_1", "fichier_path": str(tmp_path / "absent.pdf"),
        "format": "PDF", "titre": "T"}
    with pytest.raises(HTTPException) as exc:
        asyncio.run(download_report("RPT_1"))
    assert exc.value.status_code == 404


# ----------------------------------------------------------------------------
# delete_report
# ----------------------------------------------------------------------------
def test_delete_report_not_initialized_503(reports_not_ready):
    with pytest.raises(HTTPException) as exc:
        asyncio.run(delete_report("RPT_1"))
    assert exc.value.status_code == 503


def test_delete_report_success(reports_ready):
    analyzer, extractor, storage = reports_ready
    storage.delete_report.return_value = True
    resp = asyncio.run(delete_report("RPT_1"))
    assert resp["success"] is True
    assert "RPT_1" in resp["message"]


def test_delete_report_not_found_404(reports_ready):
    analyzer, extractor, storage = reports_ready
    storage.delete_report.return_value = False
    with pytest.raises(HTTPException) as exc:
        asyncio.run(delete_report("ABSENT"))
    assert exc.value.status_code == 404


def test_delete_report_error_500(reports_ready):
    analyzer, extractor, storage = reports_ready
    storage.delete_report.side_effect = RuntimeError("boom")
    with pytest.raises(HTTPException) as exc:
        asyncio.run(delete_report("RPT_1"))
    assert exc.value.status_code == 500
