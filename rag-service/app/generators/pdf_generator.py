"""
Générateur de rapports PDF professionnel
Utilise ReportLab pour créer des PDFs structurés
"""
import logging
from typing import Dict, List, Any
from datetime import datetime
import io

logger = logging.getLogger(__name__)

# Import conditionnel de reportlab (sera installé via requirements)
try:
    from reportlab.lib.pagesizes import A4, letter
    from reportlab.lib import colors
    from reportlab.lib.units import inch
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False
    logger.warning("ReportLab non disponible - génération PDF désactivée")


class PDFReportGenerator:
    """Génère des rapports PDF professionnels"""
    
    def __init__(self):
        """Initialise le générateur PDF"""
        if not REPORTLAB_AVAILABLE:
            raise ImportError("ReportLab n'est pas installé. Installez-le avec: pip install reportlab")
    
    def generate(self, titre: str, data: List[Dict], colonnes: List[str], 
                 metadata: Dict, output_path: str) -> bool:
        """
        Génère un rapport PDF
        
        Args:
            titre: Titre du rapport
            data: Données (liste de dict)
            colonnes: Liste des colonnes
            metadata: Métadonnées du rapport
            output_path: Chemin du fichier de sortie
            
        Returns:
            True si succès, False sinon
        """
        logger.info(f"Génération PDF: {output_path}")
        
        try:
            # Création du document
            doc = SimpleDocTemplate(
                output_path,
                pagesize=A4,
                rightMargin=50,
                leftMargin=50,
                topMargin=50,
                bottomMargin=50
            )
            
            # Styles
            styles = getSampleStyleSheet()
            
            # Style titre
            style_titre = ParagraphStyle(
                'CustomTitle',
                parent=styles['Heading1'],
                fontSize=18,
                textColor=colors.HexColor('#1976D2'),
                spaceAfter=30,
                alignment=TA_CENTER,
                fontName='Helvetica-Bold'
            )
            
            # Style sous-titre
            style_subtitle = ParagraphStyle(
                'CustomSubtitle',
                parent=styles['Normal'],
                fontSize=10,
                textColor=colors.grey,
                spaceAfter=20,
                alignment=TA_CENTER
            )
            
            # Construction du contenu
            story = []
            
            # En-tête
            story.append(Paragraph("LOGIWAY - PLATEFORME DE GESTION", style_subtitle))
            story.append(Paragraph(titre, style_titre))
            story.append(Paragraph(f"Généré le {datetime.now().strftime('%d/%m/%Y à %H:%M')}", style_subtitle))
            story.append(Spacer(1, 20))
            
            # Métadonnées
            if metadata:
                meta_text = self._format_metadata(metadata)
                for line in meta_text:
                    story.append(Paragraph(line, styles['Normal']))
                story.append(Spacer(1, 20))
            
            # Données - Tableau
            if data and len(data) > 0:
                story.append(Paragraph(f"<b>Données ({len(data)} enregistrements)</b>", styles['Heading2']))
                story.append(Spacer(1, 10))
                
                # Limiter les colonnes affichées (max 6 pour lisibilité)
                colonnes_display = colonnes[:6] if len(colonnes) > 6 else colonnes
                
                # Préparer les données du tableau
                table_data = [colonnes_display]  # En-tête
                
                for row in data[:100]:  # Max 100 lignes pour le PDF
                    table_row = []
                    for col in colonnes_display:
                        value = row.get(col, "")
                        # Formatage des valeurs
                        if value is None:
                            value = "-"
                        elif isinstance(value, datetime):
                            value = value.strftime('%d/%m/%Y')
                        else:
                            value = str(value)[:50]  # Tronquer si trop long
                        table_row.append(value)
                    table_data.append(table_row)
                
                # Création du tableau
                table = Table(table_data, repeatRows=1)
                
                # Style du tableau
                table.setStyle(TableStyle([
                    # En-tête
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1976D2')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, 0), 10),
                    ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                    
                    # Corps du tableau
                    ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                    ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
                    ('ALIGN', (0, 1), (-1, -1), 'LEFT'),
                    ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                    ('FONTSIZE', (0, 1), (-1, -1), 8),
                    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey]),
                    
                    # Grille
                    ('GRID', (0, 0), (-1, -1), 1, colors.grey),
                    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ]))
                
                story.append(table)
                
                # Note si données tronquées
                if len(data) > 100:
                    story.append(Spacer(1, 10))
                    story.append(Paragraph(
                        f"<i>Note: Affichage limité aux 100 premières lignes (total: {len(data)} lignes)</i>",
                        styles['Normal']
                    ))
            else:
                story.append(Paragraph("Aucune donnée disponible pour cette période.", styles['Normal']))
            
            # Pied de page
            story.append(Spacer(1, 30))
            story.append(Paragraph(
                "<i>Généré automatiquement par Logiway RAG Service</i>",
                style_subtitle
            ))
            
            # Construction du PDF
            doc.build(story)
            
            logger.info(f"✓ PDF généré: {output_path}")
            return True
            
        except Exception as e:
            logger.error(f"✗ Erreur génération PDF: {e}")
            return False
    
    def _format_metadata(self, metadata: Dict) -> List[str]:
        """Formate les métadonnées pour l'affichage"""
        lines = []
        
        if metadata.get("domaine"):
            lines.append(f"<b>Domaine:</b> {metadata['domaine'].capitalize()}")
        
        if metadata.get("periode"):
            lines.append(f"<b>Période:</b> {metadata['periode']}")
        
        if metadata.get("nombre_lignes") is not None:
            lines.append(f"<b>Nombre d'enregistrements:</b> {metadata['nombre_lignes']}")
        
        if metadata.get("filtres_appliques"):
            filtres = metadata['filtres_appliques']
            if filtres.get("statut"):
                lines.append(f"<b>Statuts filtrés:</b> {', '.join(filtres['statut'])}")
        
        return lines
