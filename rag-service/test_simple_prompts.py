"""
Script de test simplifié pour valider tous les domaines sans filtres restrictifs
"""
import requests
import json

BASE_URL = "http://localhost:5003/api/reports"

# Tests simplifiés sans filtres (pour avoir des données)
SIMPLE_TESTS = [
    {"requete": "Rapport PDF de tous les véhicules", "format": "PDF"},
    {"requete": "Liste CSV de tous les chauffeurs", "format": "CSV"},
    {"requete": "Liste TXT de tous les trajets", "format": "TXT"},
    {"requete": "Rapport PDF de tous les congés", "format": "PDF"},
    {"requete": "Liste CSV de toutes les réclamations", "format": "CSV"},
    {"requete": "Rapport TXT global de la flotte", "format": "TXT"},
]


def test_generation(requete: str, format_prefere: str):
    """Teste la génération"""
    print(f"\n{'='*60}")
    print(f"TEST: {requete}")
    print(f"Format: {format_prefere}")
    print(f"{'='*60}")
    
    payload = {
        "requete_naturelle": requete,
        "format_prefere": format_prefere,
        "user_id": "1",
        "entreprise_id": "1"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/generate", json=payload, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                meta = data.get('metadata', {})
                print(f"✓ SUCCESS!")
                print(f"  ID: {data.get('report_id', 'N/A')}")
                print(f"  Titre: {meta.get('titre', 'N/A')}")
                print(f"  Format: {meta.get('format', 'N/A')}")
                print(f"  Domaine: {meta.get('domaine', 'N/A')}")
                print(f"  Lignes: {meta.get('nb_lignes', 'N/A')}")
                print(f"  Temps: {meta.get('temps_generation_ms', 'N/A')} ms")
                return True
            else:
                print(f"✗ ÉCHEC: {data.get('message', 'Erreur inconnue')}")
                return False
        else:
            print(f"✗ ERREUR HTTP {response.status_code}: {response.text[:200]}")
            return False
            
    except Exception as e:
        print(f"✗ EXCEPTION: {e}")
        return False


def main():
    print(f"\n{'#'*60}")
    print(f"# TEST SIMPLIFIÉ - TOUS DOMAINES ET FORMATS")
    print(f"{'#'*60}")
    
    succes = 0
    echecs = 0
    
    for i, test in enumerate(SIMPLE_TESTS, 1):
        print(f"\n[Test {i}/{len(SIMPLE_TESTS)}]")
        if test_generation(test["requete"], test["format"]):
            succes += 1
        else:
            echecs += 1
    
    print(f"\n{'#'*60}")
    print(f"# RÉSULTATS: {succes} succès, {echecs} échecs")
    print(f"{'#'*60}\n")


if __name__ == "__main__":
    main()
