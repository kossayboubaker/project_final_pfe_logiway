"""
Script de test pour valider tous les prompts et formats
"""
import requests
import json

# URL de base du service RAG
BASE_URL = "http://localhost:5003/api/reports"

# Liste de tous les prompts à tester
TEST_PROMPTS = [
    {
        "requete": "Rapport PDF de tous les véhicules",
        "format": "PDF"
    },
    {
        "requete": "Liste CSV des chauffeurs actifs",
        "format": "CSV"
    },
    {
        "requete": "Rapport des congés validés cette semaine",
        "format": "PDF"
    },
    {
        "requete": "Statistiques TXT des trajets ce mois",
        "format": "TXT"
    },
    {
        "requete": "Réclamations ouvertes en priorité haute",
        "format": "PDF"
    },
    {
        "requete": "Rapport global de la flotte",
        "format": "PDF"
    }
]


def test_generation(requete: str, format_prefere: str):
    """Teste la génération d'un rapport"""
    print(f"\n{'='*80}")
    print(f"TEST: {requete}")
    print(f"Format: {format_prefere}")
    print(f"{'='*80}")
    
    payload = {
        "requete_naturelle": requete,
        "format_prefere": format_prefere,
        "user_id": "1",
        "entreprise_id": "1"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/generate", json=payload, timeout=30)
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✓ SUCCESS: {data.get('message', 'Rapport généré')}")
            print(f"  Report ID: {data.get('report_id', 'N/A')}")
            
            if data.get('metadata'):
                meta = data['metadata']
                print(f"  Titre: {meta.get('titre', 'N/A')}")
                print(f"  Format: {meta.get('format', 'N/A')}")
                print(f"  Domaine: {meta.get('domaine', 'N/A')}")
                print(f"  Nb lignes: {meta.get('nb_lignes', 'N/A')}")
                print(f"  Temps: {meta.get('temps_generation_ms', 'N/A')} ms")
        else:
            print(f"✗ ERREUR: {response.text}")
            
    except Exception as e:
        print(f"✗ EXCEPTION: {e}")


def main():
    """Exécute tous les tests"""
    print(f"\n{'#'*80}")
    print(f"# TEST DE TOUS LES PROMPTS ET FORMATS")
    print(f"{'#'*80}")
    
    for i, test in enumerate(TEST_PROMPTS, 1):
        print(f"\n[Test {i}/{len(TEST_PROMPTS)}]")
        test_generation(test["requete"], test["format"])
    
    print(f"\n{'#'*80}")
    print(f"# TESTS TERMINÉS")
    print(f"{'#'*80}\n")


if __name__ == "__main__":
    main()
