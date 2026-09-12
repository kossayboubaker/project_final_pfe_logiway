"""
Générateur de rapports TXT
Format texte structuré et lisible
"""
import logging
from typing import Dict, List, Any
from datetime import datetime

logger = logging.getLogger(__name__)


class TXTReportGenerator:
    """Génère des rapports TXT structurés"""
    
    def __init__(self):
        """Initialise le générateur TXT"""
        pass
    
    def generate(self, titre: str, data: List[Dict], colonnes: List[str], 
                 metadata: Dict, output_path: str) -> bool:
        """
        Génère un rapport TXT
        
        Args:
            titre: Titre du rapport
            data: Données (liste de dict)
            colonnes: Liste des colonnes
            metadata: Métadonnées du rapport
            output_path: Chemin du fichier de sortie
            
        Returns:
            True si succès, False sinon
        """
        logger.info(f"Génération TXT: {output_path}")
        
        try:
            with open(output_path, 'w', encoding='utf-8') as txtfile:
                # En-tête
                txtfile.write("=" * 80 + "\n")
                txtfile.write(" " * 20 + "LOGIWAY - RAPPORT\n")
                txtfile.write("=" * 80 + "\n\n")
                
                txtfile.write(f"TITRE: {titre}\n")
                txtfile.write(f"DATE DE GÉNÉRATION: {datetime.now().strftime('%d/%m/%Y à %H:%M:%S')}\n")
                
                # Métadonnées
                if metadata:
                    txtfile.write("\n" + "-" * 80 + "\n")
                    txtfile.write("INFORMATIONS DU RAPPORT\n")
                    txtfile.write("-" * 80 + "\n")
                    
                    if metadata.get("domaine"):
                        txtfile.write(f"Domaine: {metadata['domaine'].upper()}\n")
                    if metadata.get("periode"):
                        txtfile.write(f"Période: {metadata['periode']}\n")
                    if metadata.get("nombre_lignes") is not None:
                        txtfile.write(f"Nombre d'enregistrements: {metadata['nombre_lignes']}\n")
                    if metadata.get("table_source"):
                        txtfile.write(f"Table source: {metadata['table_source']}\n")
                    
                    if metadata.get("filtres_appliques"):
                        filtres = metadata['filtres_appliques']
                        if filtres.get("statut"):
                            txtfile.write(f"Filtres statut: {', '.join(filtres['statut'])}\n")
                
                # Données
                txtfile.write("\n" + "=" * 80 + "\n")
                txtfile.write("DONNÉES\n")
                txtfile.write("=" * 80 + "\n\n")
                
                if data and len(data) > 0:
                    # Affichage en mode liste
                    for idx, row in enumerate(data, 1):
                        txtfile.write(f"[{idx}] " + "-" * 75 + "\n")
                        
                        for col in colonnes:
                            if col in row:
                                value = row[col]
                                if value is None:
                                    value = "N/A"
                                elif isinstance(value, datetime):
                                    value = value.strftime('%d/%m/%Y %H:%M')
                                elif isinstance(value, (dict, list)):
                                    value = str(value)
                                
                                # Formatage colonne: valeur
                                col_display = col.replace('_', ' ').title()
                                txtfile.write(f"  {col_display:.<30} {value}\n")
                        
                        txtfile.write("\n")
                        
                        # Limiter à 50 enregistrements pour TXT
                        if idx >= 50:
                            txtfile.write(f"\n... (Affichage limité aux 50 premiers enregistrements)\n")
                            txtfile.write(f"Total: {len(data)} enregistrements\n\n")
                            break
                else:
                    txtfile.write("Aucune donnée disponible pour cette requête.\n\n")
                
                # Statistiques de résumé
                if data and len(data) > 0:
                    txtfile.write("=" * 80 + "\n")
                    txtfile.write("RÉSUMÉ STATISTIQUE\n")
                    txtfile.write("=" * 80 + "\n")
                    txtfile.write(f"Nombre total d'enregistrements: {len(data)}\n")
                    txtfile.write(f"Nombre de colonnes: {len(colonnes)}\n")
                    
                    # Compter les valeurs nulles
                    null_counts = {}
                    for col in colonnes:
                        null_count = sum(1 for row in data if row.get(col) is None)
                        if null_count > 0:
                            null_counts[col] = null_count
                    
                    if null_counts:
                        txtfile.write("\nColonnes avec valeurs manquantes:\n")
                        for col, count in null_counts.items():
                            txtfile.write(f"  - {col}: {count} valeurs manquantes\n")
                    
                    txtfile.write("\n")
                
                # Pied de page
                txtfile.write("=" * 80 + "\n")
                txtfile.write(" " * 15 + "Généré par Logiway RAG Service\n")
                txtfile.write("=" * 80 + "\n")
            
            logger.info(f"✓ TXT généré: {output_path}")
            return True
            
        except Exception as e:
            logger.error(f"✗ Erreur génération TXT: {e}")
            return False
