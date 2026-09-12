"""
Générateur de rapports CSV
Format tabulaire pour Excel et analyse de données
"""
import logging
import csv
from typing import Dict, List, Any
from datetime import datetime

logger = logging.getLogger(__name__)


class CSVReportGenerator:
    """Génère des rapports CSV exploitables"""
    
    def __init__(self):
        """Initialise le générateur CSV"""
        pass
    
    def generate(self, titre: str, data: List[Dict], colonnes: List[str], 
                 metadata: Dict, output_path: str) -> bool:
        """
        Génère un rapport CSV
        
        Args:
            titre: Titre du rapport
            data: Données (liste de dict)
            colonnes: Liste des colonnes
            metadata: Métadonnées du rapport
            output_path: Chemin du fichier de sortie
            
        Returns:
            True si succès, False sinon
        """
        logger.info(f"Génération CSV: {output_path}")
        
        try:
            with open(output_path, 'w', newline='', encoding='utf-8-sig') as csvfile:
                # Utilisation de utf-8-sig pour compatibilité Excel
                
                # En-tête du rapport
                csvfile.write(f"# {titre}\n")
                csvfile.write(f"# Généré le: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}\n")
                
                if metadata.get("domaine"):
                    csvfile.write(f"# Domaine: {metadata['domaine']}\n")
                if metadata.get("periode"):
                    csvfile.write(f"# Période: {metadata['periode']}\n")
                if metadata.get("nombre_lignes") is not None:
                    csvfile.write(f"# Nombre d'enregistrements: {metadata['nombre_lignes']}\n")
                
                csvfile.write("#\n")  # Ligne vide
                
                # Données tabulaires
                if data and len(data) > 0:
                    # Utiliser les colonnes des données si disponibles
                    if len(data[0]) > 0:
                        colonnes_data = list(data[0].keys())
                    else:
                        colonnes_data = colonnes
                    
                    writer = csv.DictWriter(csvfile, fieldnames=colonnes_data, extrasaction='ignore')
                    writer.writeheader()
                    
                    for row in data:
                        # Formatage des valeurs
                        row_formatted = {}
                        for col in colonnes_data:
                            value = row.get(col, "")
                            if value is None:
                                value = ""
                            elif isinstance(value, datetime):
                                value = value.strftime('%Y-%m-%d %H:%M:%S')
                            elif isinstance(value, (dict, list)):
                                value = str(value)
                            row_formatted[col] = value
                        
                        writer.writerow(row_formatted)
                else:
                    csvfile.write("Aucune donnée disponible\n")
            
            logger.info(f"✓ CSV généré: {output_path}")
            return True
            
        except Exception as e:
            logger.error(f"✗ Erreur génération CSV: {e}")
            return False
