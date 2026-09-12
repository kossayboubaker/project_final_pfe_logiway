"""
Analyseur NLU pour comprendre les requêtes de génération de rapports
Utilise Gemini pour parser les intentions et paramètres
"""
import logging
from typing import Dict, Optional, List
from datetime import datetime, timedelta
import re
from app.llm import get_llm

logger = logging.getLogger(__name__)


class ReportRequestAnalyzer:
    """Analyse les requêtes de rapport en langage naturel"""
    
    # Domaines supportés - ajout de plus de mots-clés avec priorité
    DOMAINES = {
        "reclamations": ["réclamation", "réclamations", "plainte", "plaintes", "problème", "problèmes", "ouvert", "ouverte", "ouvertes", "priorité"],
        "vehicules": ["véhicule", "véhicules", "flotte", "camion", "camions", "voiture", "voitures", "matric"],
        "chauffeurs": ["chauffeur", "chauffeurs", "conducteur", "conducteurs", "employé", "employés", "actif", "actifs"],
        "trajets": ["trajet", "trajets", "livraison", "livraisons", "itinéraire", "course", "courses"],
        "conges": ["congé", "congés", "absence", "absences", "vacances", "validé", "validés"],
        "managers": ["manager", "managers", "gestionnaire", "superviseur"],
        "global": ["global", "complet", "général", "ensemble"]  # Réduit pour éviter faux positifs
    }
    
    # Formats
    FORMATS = {
        "PDF": ["pdf"],
        "CSV": ["csv", "excel", "tableur"],
        "TXT": ["txt", "texte", "text"]
    }
    
    # Périodes temporelles
    PERIODES = {
        "aujourd'hui": 0,
        "hier": 1,
        "cette semaine": 7,
        "semaine dernière": 14,
        "ce mois": 30,
        "mois dernier": 60,
        "cette année": 365,
    }
    
    def __init__(self):
        """Initialise l'analyseur avec Gemini"""
        self.llm = get_llm()
    
    def analyze(self, requete: str, format_prefere: str = "PDF") -> Dict:
        """
        Analyse une requête naturelle et extrait les paramètres
        
        Args:
            requete: Requête en français naturel
            format_prefere: Format par défaut si non spécifié
            
        Returns:
            Dict avec: format, domaine, periode, filtres, titre
        """
        logger.info(f"Analyse requête: {requete}")
        
        # 1. Détection du format
        format_rapport = self._detect_format(requete, format_prefere)
        
        # 2. Détection du domaine
        domaine = self._detect_domain(requete)
        
        # 3. Détection de la période
        periode = self._detect_period(requete)
        
        # 4. Extraction des filtres via Gemini
        filtres = self._extract_filters_gemini(requete, domaine)
        
        # 5. Génération du titre
        titre = self._generate_title(domaine, periode, filtres)
        
        result = {
            "format": format_rapport,
            "domaine": domaine,
            "periode": periode,
            "filtres": filtres,
            "titre": titre,
            "requete_originale": requete
        }
        
        logger.info(f"Analyse terminée: {result}")
        return result
    
    def _detect_format(self, requete: str, default: str) -> str:
        """Détecte le format demandé dans la requête"""
        requete_lower = requete.lower()
        
        for format_name, keywords in self.FORMATS.items():
            for keyword in keywords:
                if keyword in requete_lower:
                    return format_name
        
        return default
    
    def _detect_domain(self, requete: str) -> str:
        """Détecte le domaine concerné par la requête"""
        requete_lower = requete.lower()
        
        # Comptage des occurrences par domaine
        scores = {}
        for domaine, keywords in self.DOMAINES.items():
            score = sum(requete_lower.count(kw) for kw in keywords)  # Compte le nombre de fois
            if score > 0:
                scores[domaine] = score
        
        if not scores:
            logger.info("Aucun domaine détecté - utilisation domaine 'global'")
            return "global"  # Par défaut
        
        # Retourne le domaine avec le plus d'occurrences
        domaine_detecte = max(scores, key=scores.get)
        logger.info(f"✓ Domaine détecté: {domaine_detecte} (score: {scores[domaine_detecte]})")
        return domaine_detecte
    
    def _detect_period(self, requete: str) -> Dict:
        """
        Détecte la période temporelle dans la requête
        
        Returns:
            Dict avec date_debut et date_fin
        """
        requete_lower = requete.lower()
        now = datetime.now()
        
        for periode_str, days_back in self.PERIODES.items():
            if periode_str in requete_lower:
                if "dernière" in periode_str or "dernier" in periode_str:
                    # Période passée
                    date_fin = now - timedelta(days=days_back//2)
                    date_debut = date_fin - timedelta(days=days_back//2)
                else:
                    # Période en cours
                    date_debut = now - timedelta(days=days_back)
                    date_fin = now
                
                return {
                    "date_debut": date_debut,
                    "date_fin": date_fin,
                    "description": periode_str
                }
        
        # Par défaut: PAS de filtre temporel pour récupérer TOUTES les données
        logger.info("Aucune période détectée - récupération de TOUTES les données historiques")
        return {
            "date_debut": None,
            "date_fin": None,
            "description": "Toutes périodes"
        }
    
    def _extract_filters_gemini(self, requete: str, domaine: str) -> Dict:
        """
        Utilise Gemini pour extraire les filtres et critères complexes
        
        Args:
            requete: Requête naturelle
            domaine: Domaine détecté
            
        Returns:
            Dict avec les filtres SQL-ready
        """
        # Détection simple de filtres critiques dans la requête
        filtres_simples = {
            "statut": [],
            "avec_details": True,
            "colonnes_importantes": [],
            "tri": "date",
            "limite": None,
            "grouper_par": None
        }
        
        requete_lower = requete.lower()
        
        # Détection de statuts explicites (correspondant aux vraies valeurs de BD)
        statut_keywords = {
            "actif": ["ACTIF", "DISPONIBLE", "LIBRE"],  # chauffeurs: LIBRE
            "validé": ["VALIDE"],  # congés: VALIDE
            "ouvert": ["EN_COURS", "OUVERTE"],  # trajets/réclamations: EN_COURS
            "priorité haute": ["HAUTE"]  # réclamations
        }
        
        for keyword, valeurs in statut_keywords.items():
            if keyword in requete_lower:
                filtres_simples["statut"].extend(valeurs)
        
        # Si pas de filtre statut explicite, NE PAS en ajouter (= tous les statuts)
        if not filtres_simples["statut"]:
            logger.info("Aucun filtre statut explicite - tous les statuts seront inclus")
        
        logger.info(f"Filtres simples extraits: {filtres_simples}")
        return filtres_simples
    
    def _generate_title(self, domaine: str, periode: Dict, filtres: Dict) -> str:
        """Génère un titre descriptif pour le rapport"""
        # Capitalisation du domaine
        domaine_titre = domaine.capitalize()
        
        # Description de la période
        periode_desc = periode.get("description", "période récente")
        
        # Ajout des filtres importants
        filtres_desc = []
        if filtres.get("statut"):
            filtres_desc.append(f"statut {', '.join(filtres['statut'])}")
        if filtres.get("zone"):
            filtres_desc.append(f"zone {filtres['zone']}")
        
        # Construction du titre
        titre = f"Rapport {domaine_titre} - {periode_desc}"
        if filtres_desc:
            titre += f" ({', '.join(filtres_desc)})"
        
        return titre
