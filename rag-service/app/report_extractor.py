"""
Extracteur de données dynamique pour la génération de rapports
Construit des requêtes SQL basées sur l'analyse NLU
"""
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime
from app.database import execute_sql_query, engine
from sqlalchemy import text

logger = logging.getLogger(__name__)


class ReportDataExtractor:
    """Extrait les données de la base selon les paramètres analysés"""
    
    # Mapping domaine -> table principale
    DOMAINE_TABLES = {
        "vehicules": {
            "table": "vehicules",
            "colonnes": ["id", "matricule", "marque", "modele", "type_vehicule", "statut", 
                        "kilometrage", "capacite", "capacite_charge", "niveau_carburant"],
            "jointures": []
        },
        "chauffeurs": {
            "table": "chauffeurs",
            "colonnes": ["id", "statut_conducteur", "manager_id"],
            "jointures": [
                {"table": "utilisateurs", "on": "chauffeurs.id = utilisateurs.id"}
            ]
        },
        "trajets": {
            "table": "trajets",
            "colonnes": ["id", "vehicule_id", "chauffeur_id", "date_depart", "date_arrivee",
                        "point_depart", "destination", "distance_km", "statut"],
            "jointures": []
        },
        "conges": {
            "table": "conges",
            "colonnes": ["id", "chauffeur_id", "type", "date_debut", "date_fin", 
                        "statut", "motif", "periode"],
            "jointures": []
        },
        "reclamations": {
            "table": "reclamations",
            "colonnes": ["id", "sujet", "description", "statut", "priorite",
                        "date_creation", "date_mise_a_jour", "utilisateur_id"],
            "jointures": []
        },
        "managers": {
            "table": "managers",
            "colonnes": ["id", "secteur_id"],
            "jointures": [
                {"table": "utilisateurs", "on": "managers.id = utilisateurs.id"}
            ]
        }
    }
    
    def __init__(self):
        """Initialise l'extracteur"""
        pass
    
    def extract(self, analyse: Dict) -> Dict[str, Any]:
        """
        Extrait les données selon l'analyse NLU
        
        Args:
            analyse: Résultat de ReportRequestAnalyzer.analyze()
            
        Returns:
            Dict avec: data (rows), colonnes, metadata
        """
        domaine = analyse.get("domaine", "global")
        periode = analyse.get("periode", {})
        filtres = analyse.get("filtres", {})
        
        logger.info(f"Extraction données pour domaine: {domaine}")
        
        if domaine == "global":
            return self._extract_global(periode, filtres)
        else:
            return self._extract_domaine(domaine, periode, filtres)
    
    def _extract_domaine(self, domaine: str, periode: Dict, filtres: Dict) -> Dict[str, Any]:
        """Extrait les données d'un domaine spécifique"""
        if domaine not in self.DOMAINE_TABLES:
            logger.error(f"Domaine inconnu: {domaine}")
            return {"data": [], "colonnes": [], "metadata": {}}
        
        config = self.DOMAINE_TABLES[domaine]
        table = config["table"]
        colonnes = config["colonnes"]
        
        # Construction de la requête SQL
        query_parts = [f"SELECT {', '.join([f'{table}.{col}' for col in colonnes])}"]
        
        # Ajout des colonnes des jointures
        for jointure in config.get("jointures", []):
            join_table = jointure["table"]
            if join_table == "vehicules":
                query_parts[0] += ", vehicules.matricule as vehicule_matricule"
            elif join_table == "chauffeurs":
                query_parts[0] += ", utilisateurs.nom as chauffeur_nom, utilisateurs.prenom as chauffeur_prenom"
            elif join_table == "utilisateurs":
                query_parts[0] += ", utilisateurs.nom as nom, utilisateurs.prenom as prenom, utilisateurs.email as email"
        
        query_parts.append(f"FROM {table}")
        
        # Jointures
        for jointure in config.get("jointures", []):
            query_parts.append(f"LEFT JOIN {jointure['table']} ON {jointure['on']}")
        
        # Filtres WHERE
        where_clauses = []
        params = {}
        
        # Filtre période UNIQUEMENT si explicitement demandé
        date_col = self._get_date_column(table)
        if date_col and periode.get("date_debut") is not None and periode.get("date_fin") is not None:
            # L'utilisateur a demandé une période spécifique
            where_clauses.append(f"{table}.{date_col} BETWEEN :date_debut AND :date_fin")
            params["date_debut"] = periode["date_debut"]
            params["date_fin"] = periode["date_fin"]
            logger.info(f"✓ Filtre période appliqué: {params['date_debut']} -> {params['date_fin']}")
        else:
            # Pas de filtre période = récupère TOUTES les données
            logger.info(f"✓ Pas de filtre période - extraction de TOUTES les données de la table {table}")
        
        # Filtre statut UNIQUEMENT si explicitement demandé
        # IMPORTANT: Pour chauffeurs, la colonne s'appelle statut_conducteur
        statut_col = "statut_conducteur" if table == "chauffeurs" else "statut"
        
        if filtres.get("statut") and len(filtres["statut"]) > 0:
            placeholders = ", ".join([f":statut_{i}" for i in range(len(filtres["statut"]))])
            where_clauses.append(f"{table}.{statut_col} IN ({placeholders})")
            for i, statut in enumerate(filtres["statut"]):
                params[f"statut_{i}"] = statut
            logger.info(f"✓ Filtre statut appliqué: {filtres['statut']}")
        else:
            logger.info(f"✓ Pas de filtre statut - tous les statuts inclus")
        
        # NOTE: Filtre zone retiré car la colonne n'existe pas dans les tables
        
        # Assemblage WHERE
        if where_clauses:
            query_parts.append("WHERE " + " AND ".join(where_clauses))
        
        # Tri - toujours trier pour avoir un ordre cohérent
        tri = filtres.get("tri", "id")
        order_col = None
        if tri and tri in colonnes:
            order_col = tri
        elif tri == "date" and date_col:
            order_col = date_col
        else:
            order_col = "id"  # Fallback par défaut
        
        query_parts.append(f"ORDER BY {table}.{order_col} DESC")
        
        # Limite - par défaut 500 lignes pour avoir assez de données
        limite = filtres.get("limite")
        if limite and isinstance(limite, int) and limite > 0:
            query_parts.append(f"LIMIT {min(limite, 10000)}")  # Max 10000 lignes
        else:
            query_parts.append("LIMIT 500")  # Limite par défaut augmentée à 500
        
        # Exécution de la requête
        query_sql = " ".join(query_parts)
        logger.info(f"Exécution requête: {query_sql[:200]}...")
        
        try:
            data = execute_sql_query(query_sql, params)
            
            # Extraction des noms de colonnes
            if data and len(data) > 0:
                colonnes_result = list(data[0].keys())
            else:
                colonnes_result = colonnes
            
            metadata = {
                "nombre_lignes": len(data),
                "domaine": domaine,
                "table_source": table,
                "periode": periode.get("description", ""),
                "filtres_appliques": filtres
            }
            
            logger.info(f"✓ Extraction réussie: {len(data)} lignes")
            
            return {
                "data": data,
                "colonnes": colonnes_result,
                "metadata": metadata
            }
            
        except Exception as e:
            logger.error(f"✗ Erreur extraction: {e}")
            return {
                "data": [],
                "colonnes": [],
                "metadata": {"erreur": str(e)}
            }
    
    def _extract_global(self, periode: Dict, filtres: Dict) -> Dict[str, Any]:
        """
        Extrait un rapport global multi-domaines
        """
        logger.info("Extraction rapport global")
        
        data_global = {
            "statistiques": {},
            "alertes": []
        }
        
        # Statistiques véhicules
        try:
            vehicules_query = "SELECT statut, COUNT(*) as count FROM vehicules GROUP BY statut"
            vehicules_stats = execute_sql_query(vehicules_query)
            data_global["statistiques"]["vehicules"] = vehicules_stats
        except Exception as e:
            logger.error(f"Erreur stats véhicules: {e}")
        
        # Statistiques chauffeurs
        try:
            chauffeurs_query = "SELECT statut, COUNT(*) as count FROM chauffeurs GROUP BY statut"
            chauffeurs_stats = execute_sql_query(chauffeurs_query)
            data_global["statistiques"]["chauffeurs"] = chauffeurs_stats
        except Exception as e:
            logger.error(f"Erreur stats chauffeurs: {e}")
        
        # Statistiques trajets (derniers 30 jours)
        try:
            trajets_query = """
                SELECT statut, COUNT(*) as count, SUM(distance_km) as distance_totale
                FROM trajets
                WHERE date_depart >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                GROUP BY statut
            """
            trajets_stats = execute_sql_query(trajets_query)
            data_global["statistiques"]["trajets"] = trajets_stats
        except Exception as e:
            logger.error(f"Erreur stats trajets: {e}")
        
        # Réclamations ouvertes
        try:
            reclamations_query = """
                SELECT COUNT(*) as count, priorite
                FROM reclamations
                WHERE statut = 'EN_COURS'
                GROUP BY priorite
            """
            reclamations_stats = execute_sql_query(reclamations_query)
            data_global["statistiques"]["reclamations"] = reclamations_stats
        except Exception as e:
            logger.error(f"Erreur stats réclamations: {e}")
        
        return {
            "data": [data_global],  # Encapsulé dans une liste
            "colonnes": ["statistiques", "alertes"],
            "metadata": {
                "nombre_lignes": 1,
                "domaine": "global",
                "type": "rapport_synthetique"
            }
        }
    
    def _get_date_column(self, table: str) -> Optional[str]:
        """Retourne le nom de la colonne date principale pour une table"""
        date_columns = {
            "vehicules": "derniere_position_maj",
            "chauffeurs": None,  # Pas de colonne date dans chauffeurs
            "trajets": "date_depart",
            "conges": "date_debut",
            "reclamations": "date_creation",
            "managers": None  # Pas de colonne date dans managers
        }
        return date_columns.get(table)
