"""
Script de test pour le module de génération de rapports
"""
import requests
import json
import time

BASE_URL = "http://localhost:5003"

def test_generate_report():
    """Test de génération de rapport"""
    print("\n" + "="*60)
    print("TEST: Génération de rapport")
    print("="*60)
    
    payload = {
        "requete_naturelle": "Génère un rapport PDF de tous les véhicules",
        "user_id": "user_test_001",
        "entreprise_id": "ent_001",
        "format_prefere": "PDF"
    }
    
    print(f"\nRequête: {payload['requete_naturelle']}")
    print("En cours...")
    
    start = time.time()
    response = requests.post(f"{BASE_URL}/api/reports/generate", json=payload)
    elapsed = time.time() - start
    
    if response.status_code == 200:
        data = response.json()
        print(f"\n✓ Rapport généré en {elapsed:.2f}s")
        print(f"  - Report ID: {data['report_id']}")
        print(f"  - Message: {data['message']}")
        print(f"  - URL: {data['url_download']}")
        
        if data.get('metadata'):
            meta = data['metadata']
            print(f"\n  Métadonnées:")
            print(f"    - Titre: {meta.get('titre')}")
            print(f"    - Format: {meta.get('format')}")
            print(f"    - Domaine: {meta.get('domaine')}")
            print(f"    - Lignes: {meta.get('nb_lignes')}")
            print(f"    - Taille: {meta.get('taille_fichier_ko')} Ko")
            print(f"    - Temps génération: {meta.get('temps_generation_ms')} ms")
        
        return data['report_id']
    else:
        print(f"\n✗ Erreur {response.status_code}: {response.text}")
        return None


def test_list_reports():
    """Test de listage des rapports"""
    print("\n" + "="*60)
    print("TEST: Liste des rapports")
    print("="*60)
    
    response = requests.get(f"{BASE_URL}/api/reports?limit=10")
    
    if response.status_code == 200:
        data = response.json()
        print(f"\n✓ {data['total']} rapports trouvés")
        
        for i, rapport in enumerate(data['rapports'][:5], 1):
            print(f"\n  [{i}] {rapport['report_id']}")
            print(f"      Titre: {rapport['titre']}")
            print(f"      Format: {rapport['format']} | Domaine: {rapport['domaine']}")
            print(f"      Créé le: {rapport['date_creation']}")
    else:
        print(f"\n✗ Erreur {response.status_code}: {response.text}")


def test_get_report(report_id):
    """Test de récupération d'un rapport"""
    print("\n" + "="*60)
    print("TEST: Récupération métadonnées rapport")
    print("="*60)
    
    response = requests.get(f"{BASE_URL}/api/reports/{report_id}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"\n✓ Rapport trouvé: {data['report_id']}")
        print(f"  - Titre: {data['titre']}")
        print(f"  - Statut: {data['statut']}")
        print(f"  - URL: {data['url_telechargement']}")
    else:
        print(f"\n✗ Erreur {response.status_code}: {response.text}")


def test_download_report(report_id):
    """Test de téléchargement d'un rapport"""
    print("\n" + "="*60)
    print("TEST: Téléchargement rapport")
    print("="*60)
    
    response = requests.get(f"{BASE_URL}/api/reports/download/{report_id}")
    
    if response.status_code == 200:
        print(f"\n✓ Rapport téléchargé")
        print(f"  - Content-Type: {response.headers.get('content-type')}")
        print(f"  - Taille: {len(response.content)} octets")
        
        # Sauvegarder localement pour vérification
        filename = f"test_download_{report_id}.pdf"
        with open(filename, 'wb') as f:
            f.write(response.content)
        print(f"  - Sauvegardé: {filename}")
    else:
        print(f"\n✗ Erreur {response.status_code}: {response.text}")


def test_various_requests():
    """Test de différentes requêtes"""
    print("\n" + "="*60)
    print("TEST: Requêtes variées")
    print("="*60)
    
    requetes = [
        {"requete": "Rapport CSV des chauffeurs actifs", "format": "CSV"},
        {"requete": "Liste TXT des trajets cette semaine", "format": "TXT"},
        {"requete": "Rapport des congés validés ce mois", "format": "PDF"},
    ]
    
    for req in requetes:
        print(f"\n➤ Test: {req['requete']}")
        
        payload = {
            "requete_naturelle": req['requete'],
            "user_id": "user_test_002",
            "format_prefere": req['format']
        }
        
        response = requests.post(f"{BASE_URL}/api/reports/generate", json=payload)
        
        if response.status_code == 200:
            data = response.json()
            print(f"  ✓ {data['message']}")
            print(f"    Report ID: {data['report_id']}")
        else:
            print(f"  ✗ Erreur: {response.status_code}")
        
        time.sleep(1)  # Pause entre les requêtes


def test_health():
    """Test de santé du service"""
    print("\n" + "="*60)
    print("TEST: Health Check")
    print("="*60)
    
    response = requests.get(f"{BASE_URL}/health")
    
    if response.status_code == 200:
        data = response.json()
        print(f"\n✓ Service: {data['status']}")
        print(f"  - Database: {'✓' if data['database_connected'] else '✗'}")
        print(f"  - Gemini: {'✓' if data['ollama_connected'] else '✗'}")
        print(f"  - RAG: {'✓' if data['vectorstore_ready'] else '✗'}")
    else:
        print(f"\n✗ Service non disponible")


if __name__ == "__main__":
    print("\n" + "#"*60)
    print("#  TEST MODULE GÉNÉRATION DE RAPPORTS")
    print("#  RAG Service - Logiway")
    print("#"*60)
    
    # 1. Health check
    test_health()
    
    # 2. Génération d'un rapport
    report_id = test_generate_report()
    
    if report_id:
        time.sleep(1)
        
        # 3. Récupération métadonnées
        test_get_report(report_id)
        
        # 4. Téléchargement
        test_download_report(report_id)
    
    # 5. Liste des rapports
    test_list_reports()
    
    # 6. Tests variés
    test_various_requests()
    
    print("\n" + "#"*60)
    print("#  TESTS TERMINÉS")
    print("#"*60 + "\n")
