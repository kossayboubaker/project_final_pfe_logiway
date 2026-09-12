"""
Modèles Pydantic pour l'API RAG
Compatible avec Pydantic v2.x
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import datetime


class QuestionRequest(BaseModel):
    """Requête de question au chatbot"""
    question: str = Field(..., description="Question à poser au chatbot")
    user_id: Optional[str] = Field(None, description="ID de l'utilisateur")
    entreprise_id: Optional[str] = Field(None, description="ID de l'entreprise")
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "question": "Combien de véhicules sont disponibles aujourd'hui?",
                "user_id": "user123",
                "entreprise_id": "ent456"
            }
        }
    )


class SourceDocument(BaseModel):
    """Document source utilisé pour la réponse"""
    content: str = Field(..., description="Contenu du document")
    table: str = Field(..., description="Table source")
    score: Optional[float] = Field(None, description="Score de pertinence")


class QuestionResponse(BaseModel):
    """Réponse du chatbot"""
    reponse: str = Field(..., description="Réponse générée")
    sources: List[SourceDocument] = Field(..., description="Documents sources")
    temps_reponse_ms: int = Field(..., description="Temps de réponse en ms")
    model_used: str = Field(..., description="Modèle utilisé")
    retrieval_method: str = Field(..., description="Méthode de récupération")
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "reponse": "Il y a actuellement 15 véhicules disponibles.",
                "sources": [
                    {
                        "content": "Données véhicules: 15 disponibles, 3 en maintenance",
                        "table": "vehicules",
                        "score": 0.95
                    }
                ],
                "temps_reponse_ms": 1250,
                "model_used": "gemini-3.1-flash-lite",
                "retrieval_method": "hybrid"
            }
        }
    )


class HealthResponse(BaseModel):
    """Réponse du healthcheck"""
    status: str = Field(..., description="Statut global du service")
    database_connected: bool = Field(..., description="Connexion DB active")
    ollama_connected: bool = Field(..., description="Connexion Gemini active")
    vectorstore_ready: bool = Field(..., description="Vector store prêt")
    timestamp: datetime = Field(..., description="Horodatage du check")
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "status": "healthy",
                "database_connected": True,
                "ollama_connected": True,
                "vectorstore_ready": True,
                "timestamp": "2026-07-17T10:30:00Z"
            }
        }
    )


# ==================== REPORT GENERATION MODELS ====================

class ReportFormat(str):
    """Formats de rapport supportés"""
    PDF = "PDF"
    CSV = "CSV"
    TXT = "TXT"


class ReportDomain(str):
    """Domaines de rapport disponibles"""
    VEHICULES = "vehicules"
    CHAUFFEURS = "chauffeurs"
    TRAJETS = "trajets"
    CONGES = "conges"
    RECLAMATIONS = "reclamations"
    MANAGERS = "managers"
    GLOBAL = "global"


class ReportStatus(str):
    """Statuts de génération de rapport"""
    PENDING = "pending"
    GENERATING = "generating"
    COMPLETED = "completed"
    ERROR = "error"


class GenerateReportRequest(BaseModel):
    """Requête de génération de rapport"""
    requete_naturelle: str = Field(..., description="Requête en langage naturel")
    user_id: str = Field(..., description="ID de l'utilisateur demandeur")
    entreprise_id: Optional[str] = Field(None, description="ID de l'entreprise")
    format_prefere: Optional[str] = Field("PDF", description="Format préféré: PDF, CSV, TXT")
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "requete_naturelle": "Génère un rapport PDF des congés validés cette semaine",
                "user_id": "user123",
                "entreprise_id": "ent456",
                "format_prefere": "PDF"
            }
        }
    )


class ReportMetadata(BaseModel):
    """Métadonnées d'un rapport généré"""
    report_id: str = Field(..., description="ID unique du rapport")
    titre: str = Field(..., description="Titre du rapport")
    format: str = Field(..., description="Format du fichier")
    domaine: str = Field(..., description="Domaine concerné")
    statut: str = Field(..., description="Statut de génération")
    user_id: str = Field(..., description="ID demandeur")
    entreprise_id: Optional[str] = Field(None, description="ID entreprise")
    date_creation: datetime = Field(..., description="Date de création")
    date_debut_donnees: Optional[datetime] = Field(None, description="Début période analysée")
    date_fin_donnees: Optional[datetime] = Field(None, description="Fin période analysée")
    taille_fichier_ko: Optional[int] = Field(None, description="Taille fichier en Ko")
    url_telechargement: Optional[str] = Field(None, description="URL de téléchargement")
    nb_lignes: Optional[int] = Field(None, description="Nombre de lignes de données")
    temps_generation_ms: Optional[int] = Field(None, description="Temps de génération en ms")
    erreur: Optional[str] = Field(None, description="Message d'erreur si échec")


class GenerateReportResponse(BaseModel):
    """Réponse de génération de rapport"""
    success: bool = Field(..., description="Succès de la génération")
    report_id: str = Field(..., description="ID unique du rapport")
    message: str = Field(..., description="Message descriptif")
    metadata: Optional[ReportMetadata] = Field(None, description="Métadonnées du rapport")
    url_download: Optional[str] = Field(None, description="URL de téléchargement")
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "success": True,
                "report_id": "RPT_20260717_103045_ABC123",
                "message": "Rapport généré avec succès",
                "url_download": "http://localhost:5003/api/reports/download/RPT_20260717_103045_ABC123"
            }
        }
    )


class ReportListResponse(BaseModel):
    """Liste de rapports"""
    total: int = Field(..., description="Nombre total de rapports")
    rapports: List[ReportMetadata] = Field(..., description="Liste des rapports")