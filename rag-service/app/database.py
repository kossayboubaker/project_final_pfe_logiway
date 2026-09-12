"""Connexion et extraction de données MySQL"""
from sqlalchemy import create_engine, text, inspect
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import SQLAlchemyError
from app.config import settings
from typing import List, Dict, Optional
import logging

logger = logging.getLogger(__name__)

# Engine SQLAlchemy
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=3600,
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    """Générateur de session DB"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def test_connection() -> bool:
    """Test de connexion à la base MySQL"""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info("✓ Connexion MySQL réussie")
        return True
    except SQLAlchemyError as e:
        logger.error(f"✗ Erreur connexion MySQL: {e}")
        return False


def get_all_tables() -> List[str]:
    """Liste toutes les tables de la base"""
    try:
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        logger.info(f"Tables trouvées: {len(tables)}")
        return tables
    except SQLAlchemyError as e:
        logger.error(f"Erreur récupération tables: {e}")
        return []


def extract_table_data(table_name: str, limit: int = 5000, offset: int = 0) -> List[Dict]:
    """
    Extrait les données d'une table MySQL
    
    Args:
        table_name: Nom de la table
        limit: Nombre max de lignes
        offset: Décalage pour pagination
    
    Returns:
        Liste de dictionnaires (lignes)
    """
    try:
        with engine.connect() as conn:
            query = text(f"SELECT * FROM {table_name} LIMIT :limit OFFSET :offset")
            result = conn.execute(query, {"limit": limit, "offset": offset})
            rows = [dict(row._mapping) for row in result]
            logger.info(f"✓ Extrait {len(rows)} lignes de {table_name}")
            return rows
    except SQLAlchemyError as e:
        logger.error(f"✗ Erreur extraction {table_name}: {e}")
        return []


def execute_sql_query(query: str, params: Optional[Dict] = None) -> List[Dict]:
    """
    Exécute une requête SQL SELECT
    
    Args:
        query: Requête SQL (SELECT uniquement)
        params: Paramètres de la requête
    
    Returns:
        Résultats de la requête
    """
    # Sécurité: autoriser uniquement les SELECT
    if not query.strip().upper().startswith("SELECT"):
        logger.warning(f"Requête non-SELECT refusée: {query[:50]}")
        return []
    
    try:
        with engine.connect() as conn:
            result = conn.execute(text(query), params or {})
            rows = [dict(row._mapping) for row in result]
            logger.info(f"✓ Requête exécutée: {len(rows)} résultats")
            return rows
    except SQLAlchemyError as e:
        logger.error(f"✗ Erreur exécution SQL: {e}")
        return []


def get_table_stats() -> Dict[str, int]:
    """Récupère les statistiques de toutes les tables"""
    stats = {}
    tables = get_all_tables()
    
    for table in tables:
        try:
            with engine.connect() as conn:
                result = conn.execute(text(f"SELECT COUNT(*) as count FROM {table}"))
                count = result.scalar()
                stats[table] = count
        except SQLAlchemyError:
            stats[table] = 0
    
    return stats


# Mapping des tables pertinentes pour le RAG
TABLES_CONFIG = {
    "vehicules": {
        "description": "Véhicules de la flotte",
        "priority": 1,
        "limit": 5000
    },
    "chauffeurs": {
        "description": "Chauffeurs et conducteurs",
        "priority": 1,
        "limit": 5000
    },
    "trajets": {
        "description": "Trajets et livraisons",
        "priority": 2,
        "limit": 10000
    },
    "conges": {
        "description": "Congés et absences",
        "priority": 2,
        "limit": 5000
    },
    "reclamations": {
        "description": "Réclamations clients",
        "priority": 1,
        "limit": 5000
    },
    "utilisateurs": {
        "description": "Utilisateurs du système",
        "priority": 1,
        "limit": 5000
    },
    "entreprises": {
        "description": "Entreprises clientes",
        "priority": 1,
        "limit": 1000
    },
    "secteurs": {
        "description": "Secteurs géographiques",
        "priority": 3,
        "limit": 1000
    },
    "pauses_reglementaires": {
        "description": "Pauses réglementaires",
        "priority": 2,
        "limit": 5000
    },
    "pause_ai_predictions": {
        "description": "Prédictions IA de pauses",
        "priority": 3,
        "limit": 5000
    },
    "notifications": {
        "description": "Notifications système",
        "priority": 3,
        "limit": 5000
    },
    "managers": {
        "description": "Gestionnaires de flotte",
        "priority": 2,
        "limit": 1000
    }
}


def get_priority_tables() -> List[str]:
    """Retourne les tables par ordre de priorité"""
    sorted_tables = sorted(
        TABLES_CONFIG.items(),
        key=lambda x: x[1]["priority"]
    )
    return [table for table, _ in sorted_tables]
