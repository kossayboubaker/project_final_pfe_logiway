"""
Gestionnaire de stockage des rapports
Sauvegarde fichiers + métadonnées en base de données
"""
import logging
import os
from typing import Dict, List, Optional
from datetime import datetime
from pathlib import Path
from app.database import engine
from sqlalchemy import text

logger = logging.getLogger(__name__)


class ReportStorageManager:
    """Gère le stockage des rapports et leurs métadonnées"""
    
    def __init__(self, reports_dir: str = "reports"):
        """
        Initialise le gestionnaire de stockage
        
        Args:
            reports_dir: Répertoire de stockage des fichiers
        """
        # Chemin absolu du dossier reports
        self.reports_dir = Path(__file__).parent.parent / reports_dir
        self.reports_dir.mkdir(exist_ok=True)
        
        logger.info(f"Dossier rapports: {self.reports_dir}")
        
        # Créer la table de métadonnées si elle n'existe pas
        self._init_metadata_table()
    
    def _init_metadata_table(self):
        """Crée la table des métadonnées de rapports si elle n'existe pas"""
        create_table_sql = """
        CREATE TABLE IF NOT EXISTS rapports_metadata (
            report_id VARCHAR(100) PRIMARY KEY,
            titre VARCHAR(255) NOT NULL,
            format VARCHAR(10) NOT NULL,
            domaine VARCHAR(50) NOT NULL,
            statut VARCHAR(20) NOT NULL DEFAULT 'COMPLETED',
            user_id VARCHAR(50) NOT NULL,
            entreprise_id VARCHAR(50),
            date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            date_debut_donnees DATE,
            date_fin_donnees DATE,
            taille_fichier_ko INT,
            fichier_path VARCHAR(500),
            nb_lignes INT,
            temps_generation_ms INT,
            erreur TEXT,
            INDEX idx_user (user_id),
            INDEX idx_date (date_creation),
            INDEX idx_domaine (domaine)
        )
        """
        
        try:
            with engine.connect() as conn:
                conn.execute(text(create_table_sql))
                conn.commit()
            logger.info("✓ Table rapports_metadata initialisée")
        except Exception as e:
            logger.error(f"✗ Erreur création table métadonnées: {e}")
    
    def generate_report_id(self) -> str:
        """Génère un ID unique pour un rapport"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        import random
        import string
        random_suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        return f"RPT_{timestamp}_{random_suffix}"
    
    def get_file_path(self, report_id: str, format: str) -> str:
        """
        Construit le chemin du fichier rapport
        
        Args:
            report_id: ID du rapport
            format: Format (PDF, CSV, TXT)
            
        Returns:
            Chemin complet du fichier
        """
        extension = format.lower()
        filename = f"{report_id}.{extension}"
        return str(self.reports_dir / filename)
    
    def save_metadata(self, report_id: str, titre: str, format: str, domaine: str,
                     user_id: str, entreprise_id: Optional[str], file_path: str,
                     nb_lignes: int, temps_generation_ms: int,
                     date_debut: Optional[datetime] = None,
                     date_fin: Optional[datetime] = None) -> bool:
        """
        Sauvegarde les métadonnées d'un rapport en base
        
        Args:
            report_id: ID unique du rapport
            titre: Titre du rapport
            format: Format (PDF, CSV, TXT)
            domaine: Domaine concerné
            user_id: ID utilisateur
            entreprise_id: ID entreprise (optionnel)
            file_path: Chemin du fichier
            nb_lignes: Nombre de lignes de données
            temps_generation_ms: Temps de génération
            date_debut: Date début période
            date_fin: Date fin période
            
        Returns:
            True si succès
        """
        # Calculer la taille du fichier
        try:
            file_size_ko = os.path.getsize(file_path) // 1024
        except:
            file_size_ko = 0
        
        insert_sql = """
        INSERT INTO rapports_metadata 
        (report_id, titre, format, domaine, statut, user_id, entreprise_id, 
         date_debut_donnees, date_fin_donnees, taille_fichier_ko, fichier_path, 
         nb_lignes, temps_generation_ms)
        VALUES 
        (:report_id, :titre, :format, :domaine, 'COMPLETED', :user_id, :entreprise_id,
         :date_debut, :date_fin, :taille_fichier_ko, :fichier_path, 
         :nb_lignes, :temps_generation_ms)
        """
        
        try:
            with engine.connect() as conn:
                conn.execute(text(insert_sql), {
                    "report_id": report_id,
                    "titre": titre,
                    "format": format,
                    "domaine": domaine,
                    "user_id": user_id,
                    "entreprise_id": entreprise_id,
                    "date_debut": date_debut,
                    "date_fin": date_fin,
                    "taille_fichier_ko": file_size_ko,
                    "fichier_path": file_path,
                    "nb_lignes": nb_lignes,
                    "temps_generation_ms": temps_generation_ms
                })
                conn.commit()
            
            logger.info(f"✓ Métadonnées sauvegardées: {report_id}")
            return True
            
        except Exception as e:
            logger.error(f"✗ Erreur sauvegarde métadonnées: {e}")
            return False
    
    def get_reports_list(self, user_id: Optional[str] = None, 
                        domaine: Optional[str] = None,
                        limit: int = 50) -> List[Dict]:
        """
        Récupère la liste des rapports
        
        Args:
            user_id: Filtrer par utilisateur (optionnel)
            domaine: Filtrer par domaine (optionnel)
            limit: Nombre max de résultats
            
        Returns:
            Liste des métadonnées de rapports
        """
        query = "SELECT * FROM rapports_metadata WHERE 1=1"
        params = {}
        
        if user_id:
            query += " AND user_id = :user_id"
            params["user_id"] = user_id
        
        if domaine:
            query += " AND domaine = :domaine"
            params["domaine"] = domaine
        
        query += " ORDER BY date_creation DESC LIMIT :limit"
        params["limit"] = limit
        
        try:
            with engine.connect() as conn:
                result = conn.execute(text(query), params)
                rows = [dict(row._mapping) for row in result]
            
            logger.info(f"✓ {len(rows)} rapports récupérés")
            return rows
            
        except Exception as e:
            logger.error(f"✗ Erreur récupération rapports: {e}")
            return []
    
    def get_report_by_id(self, report_id: str) -> Optional[Dict]:
        """
        Récupère un rapport par son ID
        
        Args:
            report_id: ID du rapport
            
        Returns:
            Métadonnées du rapport ou None
        """
        query = "SELECT * FROM rapports_metadata WHERE report_id = :report_id"
        
        try:
            with engine.connect() as conn:
                result = conn.execute(text(query), {"report_id": report_id})
                row = result.fetchone()
                
                if row:
                    return dict(row._mapping)
                return None
                
        except Exception as e:
            logger.error(f"✗ Erreur récupération rapport {report_id}: {e}")
            return None
    
    def delete_report(self, report_id: str) -> bool:
        """
        Supprime un rapport (fichier + métadonnées)
        
        Args:
            report_id: ID du rapport
            
        Returns:
            True si succès
        """
        # Récupérer les infos pour avoir le chemin du fichier
        report_meta = self.get_report_by_id(report_id)
        
        if not report_meta:
            logger.warning(f"Rapport {report_id} non trouvé")
            return False
        
        # Supprimer le fichier
        try:
            file_path = report_meta.get("fichier_path")
            if file_path and os.path.exists(file_path):
                os.remove(file_path)
                logger.info(f"✓ Fichier supprimé: {file_path}")
        except Exception as e:
            logger.error(f"✗ Erreur suppression fichier: {e}")
        
        # Supprimer les métadonnées
        try:
            with engine.connect() as conn:
                conn.execute(
                    text("DELETE FROM rapports_metadata WHERE report_id = :report_id"),
                    {"report_id": report_id}
                )
                conn.commit()
            
            logger.info(f"✓ Métadonnées supprimées: {report_id}")
            return True
            
        except Exception as e:
            logger.error(f"✗ Erreur suppression métadonnées: {e}")
            return False
