"""Tests unitaires des générateurs de rapports (app/generators/*)."""
import os
import pytest
from unittest.mock import patch, MagicMock
from datetime import datetime

from app.generators.csv_generator import CSVReportGenerator
from app.generators.txt_generator import TXTReportGenerator
from app.generators.pdf_generator import PDFReportGenerator, REPORTLAB_AVAILABLE


DATA = [
    {"id": 1, "matricule": "ABC-123", "statut": "DISPONIBLE", "date": datetime(2026, 1, 1)},
    {"id": 2, "matricule": None, "statut": "EN_COURS", "tags": ["a", "b"]},
]

METADATA = {
    "domaine": "vehicules",
    "periode": "January 2026",
    "nombre_lignes": 2,
    "table_source": "vehicules",
    "filtres_appliques": {"statut": ["DISPONIBLE", "EN_COURS"]},
}


# ----------------------------------------------------------------------------
# CSV
# ----------------------------------------------------------------------------
def test_csv_generate_success(tmp_path):
    out = str(tmp_path / "r.csv")
    ok = CSVReportGenerator().generate("Rapport", DATA, ["id", "matricule"], METADATA, out)
    assert ok is True
    content = open(out, encoding="utf-8-sig").read()
    assert "# Rapport" in content
    assert "id,matricule" in content or "matricule" in content
    assert "ABC-123" in content


def test_csv_generate_no_data(tmp_path):
    out = str(tmp_path / "r2.csv")
    ok = CSVReportGenerator().generate("T", [], ["a"], {}, out)
    assert ok is True
    assert "Aucune donnée disponible" in open(out, encoding="utf-8-sig").read()


def test_csv_generate_error(tmp_path):
    with patch("builtins.open", side_effect=OSError("disk full")):
        ok = CSVReportGenerator().generate("T", DATA, ["id"], {}, str(tmp_path / "x.csv"))
    assert ok is False


# ----------------------------------------------------------------------------
# TXT
# ----------------------------------------------------------------------------
def test_txt_generate_success_with_data(tmp_path):
    out = str(tmp_path / "r.txt")
    ok = TXTReportGenerator().generate("Rapport", DATA, ["id", "matricule", "date"], METADATA, out)
    assert ok is True
    content = open(out, encoding="utf-8").read()
    assert "LOGIWAY - RAPPORT" in content
    assert "Domaine: VEHICULES" in content
    assert "Filtres statut: DISPONIBLE, EN_COURS" in content
    assert "ABC-123" in content
    assert "N/A" in content  # matricule None -> N/A
    assert "RÉSUMÉ STATISTIQUE" in content
    assert "valeur manquante" in content or "manquantes" in content


def test_txt_generate_no_data(tmp_path):
    out = str(tmp_path / "r.txt")
    ok = TXTReportGenerator().generate("T", [], ["a"], {}, out)
    assert ok is True
    assert "Aucune donnée disponible" in open(out, encoding="utf-8").read()


def test_txt_generate_error(tmp_path):
    with patch("builtins.open", side_effect=OSError("fail")):
        ok = TXTReportGenerator().generate("T", DATA, ["id"], METADATA, str(tmp_path / "x.txt"))
    assert ok is False


def test_txt_generate_limited_to_50_and_no_null(tmp_path):
    # 60 lignes -> troncature à 50, et aucune valeur nulle -> pas de section nulls
    many = [{"id": i, "nom": "n"} for i in range(60)]
    out = str(tmp_path / "r.txt")
    ok = TXTReportGenerator().generate("T", many, ["id", "nom"], {}, out)
    assert ok is True
    content = open(out, encoding="utf-8").read()
    assert "Affichage limité aux 50 premiers" in content
    assert "Colonnes avec valeurs manquantes" not in content


# ----------------------------------------------------------------------------
# PDF
# ----------------------------------------------------------------------------
@pytest.mark.skipif(not REPORTLAB_AVAILABLE, reason="ReportLab non disponible")
def test_pdf_generate_success(tmp_path):
    out = str(tmp_path / "r.pdf")
    ok = PDFReportGenerator().generate("Rapport", DATA, ["id", "matricule"], METADATA, out)
    assert ok is True
    assert os.path.getsize(out) > 0
    with open(out, "rb") as f:
        header = f.read(5)
    assert header == b"%PDF-"


@pytest.mark.skipif(not REPORTLAB_AVAILABLE, reason="ReportLab non disponible")
def test_pdf_generate_no_data(tmp_path):
    out = str(tmp_path / "r.pdf")
    ok = PDFReportGenerator().generate("T", [], ["id"], {}, out)
    assert ok is True
    assert os.path.getsize(out) > 0
    with open(out, "rb") as f:
        assert f.read(5) == b"%PDF-"


@pytest.mark.skipif(not REPORTLAB_AVAILABLE, reason="ReportLab non disponible")
def test_pdf_generate_more_than_100_rows(tmp_path):
    # plus de 100 lignes -> génération réussie (fichier PDF valide)
    many = [{"id": i, "nom": "n"} for i in range(120)]
    out = str(tmp_path / "r.pdf")
    ok = PDFReportGenerator().generate("T", many, ["id", "nom"], {}, out)
    assert ok is True
    assert os.path.getsize(out) > 0


@pytest.mark.skipif(not REPORTLAB_AVAILABLE, reason="ReportLab non disponible")
def test_pdf_generate_error(tmp_path):
    # une valeur de données non sérialisable dans une cellule -> exception -> False
    weird = [{"id": 1, "x": {"nested": {"deep": object()}}}]
    out = str(tmp_path / "r.pdf")
    with patch("app.generators.pdf_generator.SimpleDocTemplate") as sdt:
        sdt.side_effect = RuntimeError("no template")
        ok = PDFReportGenerator().generate("T", weird, ["id", "x"], {}, out)
    assert ok is False


def test_pdf_format_metadata(tmp_path):
    gen = PDFReportGenerator()
    lines = gen._format_metadata({"domaine": "vehicules", "periode": "Jan",
                                  "nombre_lignes": 5})
    assert any("Domaine:" in l for l in lines)
    assert any("Période:" in l for l in lines)
    assert any("Nombre" in l for l in lines)
