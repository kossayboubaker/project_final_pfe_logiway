"""Retriever pour RAG - Requêtes sur les vraies tables Logiway"""
from app.database import engine
from sqlalchemy import text
from typing import List, Tuple, Dict, Any
import logging
import re

logger = logging.getLogger(__name__)


class Document:
    """Classe simple Document (remplace LangChain Document)"""

    def __init__(self, page_content: str, metadata: Dict[str, Any] = None):
        self.page_content = page_content
        self.metadata = metadata or {}

    def __repr__(self):
        return f"Document('{self.page_content[:60]}...')"


class SimpleDBRetriever:
    """Retriever MySQL sur les vraies tables Logiway"""

    def __init__(self):
        self.engine = engine
        logger.info("SimpleDBRetriever initialisé")

    def retrieve(self, query: str) -> Tuple[List[Document], str]:
        """Récupère des documents pertinents selon la question posée"""
        try:
            q = query.lower()
            documents = []

            # Toujours inclure les stats globales
            documents.extend(self._stats_globales())

            if any(w in q for w in ["chauffeur", "conducteur", "disponible", "actif", "combien"]):
                documents.extend(self._chauffeurs())

            if any(w in q for w in ["véhicule", "vehicule", "voiture", "flotte", "camion", "statut"]):
                documents.extend(self._vehicules())

            if any(w in q for w in ["trajet", "livraison", "transport", "course", "route"]):
                documents.extend(self._trajets())

            if any(w in q for w in ["congé", "conge", "absence", "permission"]):
                documents.extend(self._conges())

            if any(w in q for w in ["réclamation", "reclamation", "plainte"]):
                documents.extend(self._reclamations())

            if any(w in q for w in ["utilisateur", "manager", "gestionnaire", "compte"]):
                documents.extend(self._utilisateurs())

            logger.info(f"Trouvé {len(documents)} documents pour: '{query[:60]}'")
            return documents[:8], "simple_db"

        except Exception as e:
            logger.error(f"Erreur recherche: {e}")
            return [], "error"

    def _stats_globales(self) -> List[Document]:
        """Statistiques globales du système"""
        docs = []
        try:
            with self.engine.connect() as conn:
                # Comptes globaux
                stats = {}
                tables_info = {
                    "chauffeurs": "👤 Chauffeurs",
                    "vehicules": "🚛 Véhicules",
                    "trajets": "🛣️ Trajets",
                    "reclamations": "📝 Réclamations",
                    "conges": "🏖️ Congés",
                    "utilisateurs": "👥 Utilisateurs"
                }
                
                for table, label in tables_info.items():
                    try:
                        r = conn.execute(text(f"SELECT COUNT(*) FROM {table}"))
                        stats[table] = r.scalar() or 0
                    except Exception as e:
                        logger.warning(f"Impossible de compter {table}: {e}")
                        stats[table] = 0

                content = "📊 STATISTIQUES GLOBALES LOGIWAY\n"
                content += "=" * 40 + "\n"
                for table, label in tables_info.items():
                    content += f"{label}: {stats[table]}\n"
                
                docs.append(Document(page_content=content, metadata={"source": "stats_globales"}))
        except Exception as e:
            logger.error(f"Erreur stats globales: {e}", exc_info=True)
            docs.append(Document(
                page_content="⚠️ Impossible de récupérer les statistiques globales.",
                metadata={"source": "stats_error"}
            ))
        return docs

    def _chauffeurs(self) -> List[Document]:
        """Informations sur les chauffeurs"""
        docs = []
        try:
            with self.engine.connect() as conn:
                # Comptage total des chauffeurs
                r_total = conn.execute(text("SELECT COUNT(*) FROM chauffeurs"))
                total_chauffeurs = r_total.scalar()
                
                # Chauffeurs avec leurs infos utilisateurs
                r = conn.execute(text("""
                    SELECT u.prenom, u.nom, u.telephone, c.statut_conducteur,
                           s.nom as secteur
                    FROM chauffeurs c
                    JOIN utilisateurs u ON c.id = u.id
                    LEFT JOIN secteurs s ON c.secteur_id = s.id
                    LIMIT 20
                """))
                rows = r.fetchall()

                if rows:
                    content = f"👤 CHAUFFEURS (Total: {total_chauffeurs})\n"
                    content += f"Liste de {len(rows)} chauffeurs:\n"
                    for row in rows:
                        statut_emoji = "🟢" if row[3] and "DISPONIBLE" in str(row[3]).upper() else "🔴"
                        content += f"{statut_emoji} {row[0]} {row[1]}, Statut: {row[3] or 'N/A'}, Secteur: {row[4] or 'Non assigné'}\n"
                    docs.append(Document(page_content=content, metadata={"source": "chauffeurs"}))

                # Comptage par statut
                r2 = conn.execute(text("""
                    SELECT statut_conducteur, COUNT(*) as nb
                    FROM chauffeurs
                    GROUP BY statut_conducteur
                """))
                rows2 = r2.fetchall()
                if rows2:
                    content2 = "📊 Répartition des chauffeurs par statut:\n"
                    for row in rows2:
                        content2 += f"  • {row[0] or 'Inconnu'}: {row[1]} chauffeur(s)\n"
                    docs.append(Document(page_content=content2, metadata={"source": "chauffeurs_statut"}))

        except Exception as e:
            logger.error(f"Erreur chauffeurs: {e}", exc_info=True)
            docs.append(Document(
                page_content="⚠️ Impossible de récupérer les informations des chauffeurs.",
                metadata={"source": "chauffeurs_error"}
            ))
        return docs

    def _vehicules(self) -> List[Document]:
        """Informations sur les véhicules"""
        docs = []
        try:
            with self.engine.connect() as conn:
                # Véhicules par statut
                r = conn.execute(text("""
                    SELECT statut, COUNT(*) as nb
                    FROM vehicules
                    GROUP BY statut
                """))
                rows = r.fetchall()
                if rows:
                    total = sum(row[1] for row in rows)
                    content = "🚛 VÉHICULES\n"
                    content += f"Total: {total} véhicule(s)\n\n"
                    content += "Par statut:\n"
                    for row in rows:
                        emoji = "✅" if row[0] and "DISPONIBLE" in str(row[0]).upper() else "🔧" if "MAINTENANCE" in str(row[0]).upper() else "📊"
                        content += f"{emoji} {row[0] or 'Inconnu'}: {row[1]} véhicule(s)\n"
                    docs.append(Document(page_content=content, metadata={"source": "vehicules_statut"}))

                # Liste véhicules
                r2 = conn.execute(text("""
                    SELECT marque, modele, matricule, statut, type_vehicule
                    FROM vehicules
                    LIMIT 15
                """))
                rows2 = r2.fetchall()
                if rows2:
                    content2 = f"📋 Liste de {len(rows2)} véhicules:\n"
                    for row in rows2:
                        content2 += f"  • {row[0]} {row[1]} ({row[2]}), Statut: {row[3]}, Type: {row[4] or 'N/A'}\n"
                    docs.append(Document(page_content=content2, metadata={"source": "vehicules_liste"}))

        except Exception as e:
            logger.error(f"Erreur véhicules: {e}", exc_info=True)
            docs.append(Document(
                page_content="⚠️ Impossible de récupérer les informations des véhicules.",
                metadata={"source": "vehicules_error"}
            ))
        return docs

    def _trajets(self) -> List[Document]:
        """Informations sur les trajets"""
        docs = []
        try:
            with self.engine.connect() as conn:
                # Trajets par statut
                r = conn.execute(text("""
                    SELECT statut, COUNT(*) as nb,
                           AVG(distance_km) as dist_moy
                    FROM trajets
                    GROUP BY statut
                """))
                rows = r.fetchall()
                if rows:
                    content = "Statistiques trajets par statut:\n"
                    for row in rows:
                        dist = f"{row[2]:.1f}km" if row[2] else "N/A"
                        content += f"- {row[0] or 'Inconnu'}: {row[1]} trajet(s), distance moy: {dist}\n"
                    docs.append(Document(page_content=content, metadata={"source": "trajets_statut"}))

                # Trajets récents
                r2 = conn.execute(text("""
                    SELECT t.point_depart, t.destination, t.statut,
                           t.distance_km, t.date_depart,
                           u.prenom, u.nom
                    FROM trajets t
                    LEFT JOIN utilisateurs u ON t.chauffeur_id = u.id
                    ORDER BY t.date_depart DESC
                    LIMIT 5
                """))
                rows2 = r2.fetchall()
                if rows2:
                    content2 = "Trajets récents:\n"
                    for row in rows2:
                        chauffeur = f"{row[5]} {row[6]}" if row[5] else "N/A"
                        content2 += f"- {row[0]} → {row[1]}, Statut: {row[2]}, Chauffeur: {chauffeur}\n"
                    docs.append(Document(page_content=content2, metadata={"source": "trajets_recents"}))

        except Exception as e:
            logger.error(f"Erreur trajets: {e}")
        return docs

    def _conges(self) -> List[Document]:
        """Informations sur les congés"""
        docs = []
        try:
            with self.engine.connect() as conn:
                r = conn.execute(text("""
                    SELECT c.type, c.statut, c.date_debut, c.date_fin,
                           u.prenom, u.nom
                    FROM conges c
                    LEFT JOIN utilisateurs u ON c.chauffeur_id = u.id
                    ORDER BY c.date_creation DESC
                    LIMIT 10
                """))
                rows = r.fetchall()
                if rows:
                    content = f"Congés ({len(rows)} enregistrements):\n"
                    for row in rows:
                        nom = f"{row[4]} {row[5]}" if row[4] else "N/A"
                        content += f"- {nom}: {row[0]}, Statut: {row[1]}, Du {row[2]} au {row[3]}\n"
                    docs.append(Document(page_content=content, metadata={"source": "conges"}))

                # Stats congés
                r2 = conn.execute(text("""
                    SELECT statut, COUNT(*) FROM conges GROUP BY statut
                """))
                rows2 = r2.fetchall()
                if rows2:
                    content2 = "Résumé des congés par statut:\n"
                    for row in rows2:
                        content2 += f"- {row[0]}: {row[1]}\n"
                    docs.append(Document(page_content=content2, metadata={"source": "conges_stats"}))

        except Exception as e:
            logger.error(f"Erreur congés: {e}")
        return docs

    def _reclamations(self) -> List[Document]:
        """Informations sur les réclamations"""
        docs = []
        try:
            with self.engine.connect() as conn:
                r = conn.execute(text("""
                    SELECT r.sujet, r.statut, r.priorite, r.date_creation,
                           u.prenom, u.nom
                    FROM reclamations r
                    LEFT JOIN utilisateurs u ON r.utilisateur_id = u.id
                    ORDER BY r.date_creation DESC
                    LIMIT 10
                """))
                rows = r.fetchall()
                if rows:
                    content = f"Réclamations ({len(rows)} enregistrements):\n"
                    for row in rows:
                        nom = f"{row[4]} {row[5]}" if row[4] else "N/A"
                        content += f"- {row[0][:50]}, Statut: {row[1]}, Priorité: {row[2]}, Par: {nom}\n"
                    docs.append(Document(page_content=content, metadata={"source": "reclamations"}))

                r2 = conn.execute(text("""
                    SELECT statut, COUNT(*) FROM reclamations GROUP BY statut
                """))
                rows2 = r2.fetchall()
                if rows2:
                    content2 = "Résumé réclamations par statut:\n"
                    for row in rows2:
                        content2 += f"- {row[0]}: {row[1]}\n"
                    docs.append(Document(page_content=content2, metadata={"source": "reclamations_stats"}))

        except Exception as e:
            logger.error(f"Erreur réclamations: {e}")
        return docs

    def _utilisateurs(self) -> List[Document]:
        """Informations sur les utilisateurs"""
        docs = []
        try:
            with self.engine.connect() as conn:
                r = conn.execute(text("""
                    SELECT role, COUNT(*) as nb, SUM(CASE WHEN est_actif=1 THEN 1 ELSE 0 END) as actifs
                    FROM utilisateurs
                    GROUP BY role
                """))
                rows = r.fetchall()
                if rows:
                    content = "Utilisateurs par rôle:\n"
                    for row in rows:
                        content += f"- {row[0]}: {row[1]} total ({row[2]} actifs)\n"
                    docs.append(Document(page_content=content, metadata={"source": "utilisateurs"}))
        except Exception as e:
            logger.error(f"Erreur utilisateurs: {e}")
        return docs


def load_vectorstore(embeddings):
    logger.info("Mode simple: pas de vector store")
    return None


def create_retriever(vectorstore):
    logger.info("Création SimpleDBRetriever")
    return SimpleDBRetriever()


class HybridRetriever:
    """Wrapper de compatibilité"""
    def __init__(self, vectorstore, connection):
        self.simple_retriever = SimpleDBRetriever()

    def retrieve(self, query: str) -> Tuple[List[Document], str]:
        return self.simple_retriever.retrieve(query)
