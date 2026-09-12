"""
Script d'ingestion des données MySQL → Documents JSON
Extrait toutes les tables pertinentes pour le RAG
"""
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.database import extract_table_data, TABLES_CONFIG, test_connection, get_table_stats
from langchain.schema import Document
import json
import logging
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def format_row_to_text(table_name: str, row: dict, description: str) -> str:
    """Convertit une ligne de table en texte structuré lisible"""
    
    # Format spécifique par table pour meilleure lisibilité
    if table_name == "vehicules":
        return f"""Véhicule {row.get('matricule', 'N/A')}:
- Marque: {row.get('marque', 'N/A')}
- Modèle: {row.get('modele', 'N/A')}
- Année: {row.get('annee', 'N/A')}
- Statut: {row.get('statut', 'N/A')}
- Kilométrage: {row.get('kilometrage', 'N/A')} km
- Entreprise ID: {row.get('entreprise_id', 'N/A')}"""
    
    elif table_name == "chauffeurs":
        return f"""Chauffeur {row.get('prenom', '')} {row.get('nom', '')}:
- Email: {row.get('email', 'N/A')}
- Téléphone: {row.get('telephone', 'N/A')}
- Statut: {row.get('statut_conducteur', 'N/A')}
- Secteur ID: {row.get('secteur_id', 'N/A')}
- Véhicule actuel: {row.get('vehicule_actuel_id', 'N/A')}
- Entreprise ID: {row.get('entreprise_id', 'N/A')}"""
    
    elif table_name == "trajets":
        return f"""Trajet ID {row.get('id', 'N/A')}:
- Départ: {row.get('point_depart', 'N/A')}
- Destination: {row.get('destination', 'N/A')}
- Date départ: {row.get('date_depart', 'N/A')}
- Statut: {row.get('statut', 'N/A')}
- Distance: {row.get('distance_km', 'N/A')} km
- Chauffeur ID: {row.get('chauffeur_id', 'N/A')}
- Véhicule ID: {row.get('vehicule_id', 'N/A')}"""
    
    elif table_name == "reclamations":
        return f"""Réclamation ID {row.get('id', 'N/A')}:
- Sujet: {row.get('sujet', 'N/A')}
- Description: {row.get('description', 'N/A')[:200]}
- Priorité: {row.get('priorite', 'N/A')}
- Statut: {row.get('statut', 'N/A')}
- Date: {row.get('date_creation', 'N/A')}
- Utilisateur ID: {row.get('utilisateur_id', 'N/A')}"""
    
    elif table_name == "conges":
        return f"""Congé ID {row.get('id', 'N/A')}:
- Type: {row.get('type', 'N/A')}
- Du: {row.get('date_debut', 'N/A')} au {row.get('date_fin', 'N/A')}
- Motif: {row.get('motif', 'N/A')}
- Statut: {row.get('statut', 'N/A')}
- Chauffeur ID: {row.get('chauffeur_id', 'N/A')}"""
    
    else:
        # Format générique pour autres tables
        text_parts = [f"{description} ID {row.get('id', 'N/A')}:"]
        for key, value in row.items():
            if key != 'id' and value is not None:
                text_parts.append(f"- {key}: {value}")
        return "\n".join(text_parts)


def ingest_all_data():
    """Extrait toutes les tables et crée les documents"""
    
    logger.info("=" * 60)
    logger.info("Début ingestion des données MySQL")
    logger.info("=" * 60)
    
    # Test connexion
    if not test_connection():
        logger.error("✗ Connexion MySQL échouée. Vérifiez XAMPP.")
        return False
    
    # Statistiques des tables
    table_stats = get_table_stats()
    logger.info(f"\nStatistiques des tables:")
    for table, count in table_stats.items():
        logger.info(f"  - {table}: {count} lignes")
    
    documents = []
    ingestion_stats = {
        "total_documents": 0,
        "tables_processed": 0,
        "tables_failed": 0,
        "start_time": datetime.now().isoformat()
    }
    
    # Extraction par table
    for table_name, config in TABLES_CONFIG.items():
        description = config["description"]
        limit = config["limit"]
        
        logger.info(f"\n→ Extraction de '{table_name}' ({description})...")
        
        try:
            rows = extract_table_data(table_name, limit=limit)
            
            if not rows:
                logger.warning(f"  ⚠ Aucune donnée dans {table_name}")
                continue
            
            # Conversion en documents
            for row in rows:
                # Texte structuré lisible
                doc_text = format_row_to_text(table_name, row, description)
                
                # Métadonnées
                metadata = {
                    "source": table_name,
                    "id": row.get("id"),
                    "type": "database_record",
                    "description": description,
                    "extraction_date": datetime.now().isoformat()
                }
                
                documents.append(Document(
                    page_content=doc_text,
                    metadata=metadata
                ))
            
            logger.info(f"  ✓ {len(rows)} documents créés depuis {table_name}")
            ingestion_stats["tables_processed"] += 1
            
        except Exception as e:
            logger.error(f"  ✗ Erreur extraction {table_name}: {e}")
            ingestion_stats["tables_failed"] += 1
    
    ingestion_stats["total_documents"] = len(documents)
    ingestion_stats["end_time"] = datetime.now().isoformat()
    
    logger.info("\n" + "=" * 60)
    logger.info(f"✓ Ingestion terminée:")
    logger.info(f"  - Documents créés: {ingestion_stats['total_documents']}")
    logger.info(f"  - Tables traitées: {ingestion_stats['tables_processed']}")
    logger.info(f"  - Tables en erreur: {ingestion_stats['tables_failed']}")
    logger.info("=" * 60)
    
    # Sauvegarde en JSON (cache)
    cache_dir = "./data/documents"
    os.makedirs(cache_dir, exist_ok=True)
    cache_file = os.path.join(cache_dir, "cache.json")
    
    logger.info(f"\nSauvegarde cache JSON: {cache_file}")
    cache_data = {
        "stats": ingestion_stats,
        "documents": [
            {
                "content": doc.page_content,
                "metadata": doc.metadata
            }
            for doc in documents
        ]
    }
    
    with open(cache_file, "w", encoding="utf-8") as f:
        json.dump(cache_data, f, ensure_ascii=False, indent=2, default=str)
    
    logger.info(f"✓ Cache sauvegardé: {len(documents)} documents")
    
    return documents


if __name__ == "__main__":
    try:
        documents = ingest_all_data()
        if documents:
            logger.info("\n✓ Ingestion réussie!")
            logger.info(f"Prochaine étape: python scripts/create_vectorstore.py")
        else:
            logger.error("\n✗ Ingestion échouée - aucun document créé")
            sys.exit(1)
    except Exception as e:
        logger.error(f"\n✗ Erreur fatale: {e}")
        sys.exit(1)
