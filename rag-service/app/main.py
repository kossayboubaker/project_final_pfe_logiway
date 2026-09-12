"""
API FastAPI pour le service RAG Chatbot Logiway - Version Gemini
Port: 5003
"""
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from app.models import (
    QuestionRequest, QuestionResponse, HealthResponse, SourceDocument,
    GenerateReportRequest, GenerateReportResponse, ReportMetadata, ReportListResponse
)
from app.config import settings
from app.database import test_connection
from app.llm import get_llm, test_gemini_connection
from app.embeddings import get_embeddings
from app.retriever import load_vectorstore, create_retriever, SimpleDBRetriever
from app.rag_chain import create_rag_chain, format_response
from app.report_analyzer import ReportRequestAnalyzer
from app.report_extractor import ReportDataExtractor
from app.report_storage import ReportStorageManager
from app.generators.pdf_generator import PDFReportGenerator
from app.generators.csv_generator import CSVReportGenerator
from app.generators.txt_generator import TXTReportGenerator
from functools import lru_cache
import logging
import time
from datetime import datetime
import os

# Configuration logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Création de l'application FastAPI
app = FastAPI(
    title=settings.API_TITLE,
    version=settings.API_VERSION,
    description="Service RAG (Retrieval-Augmented Generation) pour questions sur Logiway - Powered by Gemini"
)

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200", "http://localhost:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Variables globales pour le pipeline RAG (chargées au démarrage)
rag_chain = None
retriever_instance = None

# Gestionnaires de rapports
report_analyzer = None
report_extractor = None
report_storage = None


@app.on_event("startup")
async def startup_event():
    """Initialisation au démarrage du service"""
    global rag_chain, retriever_instance, report_analyzer, report_extractor, report_storage
    
    logger.info("=" * 60)
    logger.info("🚀 Démarrage du service RAG Chatbot Logiway - Gemini")
    logger.info("=" * 60)
    
    try:
        # 1. Test connexion DB
        logger.info("Vérification connexion MySQL...")
        if not test_connection():
            logger.error("✗ Connexion MySQL échouée")
            raise RuntimeError("Impossible de se connecter à MySQL")
        
        # 2. Test connexion Gemini
        logger.info("Vérification connexion Gemini...")
        if not test_gemini_connection():
            logger.error("✗ Connexion Gemini échouée")
            raise RuntimeError("Impossible de se connecter à Gemini")
        
        # 3. Chargement embeddings (factice)
        logger.info("Chargement système d'embeddings...")
        embeddings = get_embeddings()
        
        # 4. Pas de vector store (version simple)
        logger.info("Mode simple: pas de vector store")
        vectorstore = None
        
        # 5. Création retriever simple
        logger.info("Création retriever...")
        retriever_instance = create_retriever(vectorstore)
        
        # 6. Chargement LLM
        logger.info("Chargement modèle LLM...")
        llm = get_llm()
        
        # 7. Création chaîne RAG
        logger.info("Création chaîne RAG...")
        rag_chain = create_rag_chain(retriever_instance, llm)
        
        # 8. Initialisation modules de rapports
        logger.info("Initialisation module génération de rapports...")
        report_analyzer = ReportRequestAnalyzer()
        report_extractor = ReportDataExtractor()
        report_storage = ReportStorageManager()
        
        logger.info("=" * 60)
        logger.info("✓ Service RAG prêt avec Gemini!")
        logger.info("✓ Module de génération de rapports activé!")
        logger.info(f"✓ API disponible sur http://{settings.API_HOST}:{settings.API_PORT}")
        logger.info(f"✓ Documentation: http://localhost:{settings.API_PORT}/docs")
        logger.info("=" * 60)
        
    except Exception as e:
        logger.error(f"✗ Erreur lors du démarrage: {e}")
        raise


@app.get("/", tags=["Root"])
async def root():
    """Endpoint racine"""
    return {
        "service": "Logiway RAG Chatbot - Gemini",
        "version": settings.API_VERSION,
        "status": "running",
        "model": settings.GEMINI_MODEL,
        "endpoints": {
            "health": "/health",
            "question": "/api/rag/question",
            "docs": "/docs"
        }
    }


@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """Healthcheck du service"""
    db_ok = test_connection()
    gemini_ok = test_gemini_connection()
    rag_ok = rag_chain is not None
    
    return HealthResponse(
        status="healthy" if (db_ok and gemini_ok and rag_ok) else "degraded",
        database_connected=db_ok,
        ollama_connected=gemini_ok,  # Réutilise le champ pour Gemini
        vectorstore_ready=rag_ok,
        timestamp=datetime.now()
    )


@app.post("/api/rag/question", response_model=QuestionResponse, tags=["RAG"])
async def poser_question(request: QuestionRequest):
    """
    Pose une question au chatbot RAG Gemini
    
    - **question**: Question en langage naturel
    - **user_id**: ID de l'utilisateur (optionnel)
    - **entreprise_id**: ID de l'entreprise (optionnel)
    """
    if rag_chain is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Service RAG non initialisé. Attendez le démarrage complet."
        )
    
    logger.info(f"Question reçue: {request.question[:100]}")
    start_time = time.time()
    
    try:
        # Exécution de la chaîne RAG
        result = rag_chain({"query": request.question})
        
        # Récupération de la méthode de retrieval utilisée
        method_used = "simple_db"  # Version simple uniquement
        
        # Calcul du temps de réponse
        elapsed_ms = int((time.time() - start_time) * 1000)
        
        # Formatage de la réponse
        reponse_text = result.get("result", "Erreur de génération")
        sources = []
        
        for doc in result.get("source_documents", [])[:3]:  # Max 3 sources
            sources.append(SourceDocument(
                content=doc.page_content[:200],
                table=doc.metadata.get("source", "unknown"),
                score=doc.metadata.get("score")
            ))
        
        logger.info(f"✓ Réponse générée en {elapsed_ms}ms ({method_used}) - Gemini")
        
        return QuestionResponse(
            reponse=reponse_text,
            sources=sources,
            temps_reponse_ms=elapsed_ms,
            model_used=settings.GEMINI_MODEL,
            retrieval_method=method_used
        )
        
    except Exception as e:
        logger.error(f"✗ Erreur traitement question: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors du traitement: {str(e)}"
        )


@app.get("/api/rag/stats", tags=["RAG"])
async def get_stats():
    """Statistiques du service RAG"""
    from app.database import get_table_stats
    
    try:
        table_stats = get_table_stats()
        
        return {
            "database": {
                "tables_count": len(table_stats),
                "total_rows": sum(table_stats.values()),
                "tables": table_stats
            },
            "config": {
                "model": settings.GEMINI_MODEL,
                "api_provider": "Google Gemini",
                "top_k": settings.TOP_K_RESULTS,
                "max_tokens": settings.MAX_RESPONSE_TOKENS,
                "temperature": settings.LLM_TEMPERATURE,
                "hybrid_retrieval": settings.USE_HYBRID_RETRIEVAL
            }
        }
    except Exception as e:
        logger.error(f"Erreur récupération stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# ==================== ENDPOINTS GÉNÉRATION DE RAPPORTS ====================

@app.post("/api/reports/generate", response_model=GenerateReportResponse, tags=["Reports"])
async def generate_report(request: GenerateReportRequest):
    """
    Génère un rapport basé sur une requête en langage naturel
    
    - **requete_naturelle**: Demande en français (ex: "Rapport PDF des congés cette semaine")
    - **user_id**: ID de l'utilisateur demandeur
    - **entreprise_id**: ID de l'entreprise (optionnel)
    - **format_prefere**: Format souhaité (PDF, CSV, TXT)
    """
    if not all([report_analyzer, report_extractor, report_storage]):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Service de génération de rapports non initialisé"
        )
    
    logger.info(f"Demande de rapport: {request.requete_naturelle[:100]}")
    start_time = time.time()
    
    try:
        # 1. Analyse de la requête
        analyse = report_analyzer.analyze(
            request.requete_naturelle,
            request.format_prefere or "PDF"
        )
        logger.info(f"Analyse: {analyse}")
        
        # 2. Extraction des données
        extraction_result = report_extractor.extract(analyse)
        data = extraction_result["data"]
        colonnes = extraction_result["colonnes"]
        metadata = extraction_result["metadata"]
        
        logger.info(f"Données extraites: {len(data)} lignes")
        
        if len(data) == 0:
            return GenerateReportResponse(
                success=False,
                report_id="",
                message="Aucune donnée correspondant aux critères de recherche",
                metadata=None,
                url_download=None
            )
        
        # 3. Génération du rapport
        report_id = report_storage.generate_report_id()
        format_rapport = analyse["format"]
        file_path = report_storage.get_file_path(report_id, format_rapport)
        
        # Sélection du générateur
        if format_rapport == "PDF":
            generator = PDFReportGenerator()
        elif format_rapport == "CSV":
            generator = CSVReportGenerator()
        elif format_rapport == "TXT":
            generator = TXTReportGenerator()
        else:
            raise ValueError(f"Format non supporté: {format_rapport}")
        
        # Génération
        success = generator.generate(
            titre=analyse["titre"],
            data=data,
            colonnes=colonnes,
            metadata=metadata,
            output_path=file_path
        )
        
        if not success:
            raise RuntimeError("Échec de la génération du fichier")
        
        # 4. Sauvegarde des métadonnées
        temps_generation_ms = int((time.time() - start_time) * 1000)
        
        report_storage.save_metadata(
            report_id=report_id,
            titre=analyse["titre"],
            format=format_rapport,
            domaine=analyse["domaine"],
            user_id=request.user_id,
            entreprise_id=request.entreprise_id,
            file_path=file_path,
            nb_lignes=len(data),
            temps_generation_ms=temps_generation_ms,
            date_debut=analyse["periode"].get("date_debut"),
            date_fin=analyse["periode"].get("date_fin")
        )
        
        # 5. Construction de la réponse
        url_download = f"http://{settings.API_HOST}:{settings.API_PORT}/api/reports/download/{report_id}"
        
        logger.info(f"✓ Rapport généré: {report_id} en {temps_generation_ms}ms")
        
        return GenerateReportResponse(
            success=True,
            report_id=report_id,
            message=f"Rapport {format_rapport} généré avec succès ({len(data)} enregistrements)",
            metadata=ReportMetadata(
                report_id=report_id,
                titre=analyse["titre"],
                format=format_rapport,
                domaine=analyse["domaine"],
                statut="COMPLETED",
                user_id=request.user_id,
                entreprise_id=request.entreprise_id,
                date_creation=datetime.now(),
                date_debut_donnees=analyse["periode"].get("date_debut"),
                date_fin_donnees=analyse["periode"].get("date_fin"),
                taille_fichier_ko=os.path.getsize(file_path) // 1024,
                url_telechargement=url_download,
                nb_lignes=len(data),
                temps_generation_ms=temps_generation_ms,
                erreur=None
            ),
            url_download=url_download
        )
        
    except Exception as e:
        logger.error(f"✗ Erreur génération rapport: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la génération: {str(e)}"
        )


@app.get("/api/reports", response_model=ReportListResponse, tags=["Reports"])
async def list_reports(user_id: str = None, domaine: str = None, limit: int = 50):
    """
    Liste les rapports générés
    
    - **user_id**: Filtrer par utilisateur (optionnel)
    - **domaine**: Filtrer par domaine (optionnel)
    - **limit**: Nombre max de résultats (défaut: 50)
    """
    if not report_storage:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Service de stockage non initialisé"
        )
    
    try:
        rapports = report_storage.get_reports_list(user_id, domaine, limit)
        
        # Conversion en ReportMetadata
        rapports_meta = []
        for r in rapports:
            url_download = f"http://{settings.API_HOST}:{settings.API_PORT}/api/reports/download/{r['report_id']}"
            rapports_meta.append(ReportMetadata(
                report_id=r["report_id"],
                titre=r["titre"],
                format=r["format"],
                domaine=r["domaine"],
                statut=r["statut"],
                user_id=r["user_id"],
                entreprise_id=r.get("entreprise_id"),
                date_creation=r["date_creation"],
                date_debut_donnees=r.get("date_debut_donnees"),
                date_fin_donnees=r.get("date_fin_donnees"),
                taille_fichier_ko=r.get("taille_fichier_ko"),
                url_telechargement=url_download,
                nb_lignes=r.get("nb_lignes"),
                temps_generation_ms=r.get("temps_generation_ms"),
                erreur=r.get("erreur")
            ))
        
        return ReportListResponse(
            total=len(rapports_meta),
            rapports=rapports_meta
        )
        
    except Exception as e:
        logger.error(f"✗ Erreur récupération rapports: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@app.get("/api/reports/{report_id}", response_model=ReportMetadata, tags=["Reports"])
async def get_report_metadata(report_id: str):
    """Récupère les métadonnées d'un rapport spécifique"""
    if not report_storage:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Service de stockage non initialisé"
        )
    
    try:
        rapport = report_storage.get_report_by_id(report_id)
        
        if not rapport:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Rapport {report_id} non trouvé"
            )
        
        url_download = f"http://{settings.API_HOST}:{settings.API_PORT}/api/reports/download/{report_id}"
        
        return ReportMetadata(
            report_id=rapport["report_id"],
            titre=rapport["titre"],
            format=rapport["format"],
            domaine=rapport["domaine"],
            statut=rapport["statut"],
            user_id=rapport["user_id"],
            entreprise_id=rapport.get("entreprise_id"),
            date_creation=rapport["date_creation"],
            date_debut_donnees=rapport.get("date_debut_donnees"),
            date_fin_donnees=rapport.get("date_fin_donnees"),
            taille_fichier_ko=rapport.get("taille_fichier_ko"),
            url_telechargement=url_download,
            nb_lignes=rapport.get("nb_lignes"),
            temps_generation_ms=rapport.get("temps_generation_ms"),
            erreur=rapport.get("erreur")
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"✗ Erreur récupération métadonnées: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@app.get("/api/reports/download/{report_id}", tags=["Reports"])
async def download_report(report_id: str):
    """Télécharge un rapport généré"""
    if not report_storage:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Service de stockage non initialisé"
        )
    
    try:
        rapport = report_storage.get_report_by_id(report_id)
        
        if not rapport:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Rapport {report_id} non trouvé"
            )
        
        file_path = rapport["fichier_path"]
        
        if not os.path.exists(file_path):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Fichier rapport introuvable"
            )
        
        # Déterminer le type MIME
        format_rapport = rapport["format"]
        media_types = {
            "PDF": "application/pdf",
            "CSV": "text/csv",
            "TXT": "text/plain"
        }
        media_type = media_types.get(format_rapport, "application/octet-stream")
        
        # Nom du fichier pour le téléchargement
        filename = f"{rapport['titre'].replace(' ', '_')}_{report_id}.{format_rapport.lower()}"
        
        return FileResponse(
            path=file_path,
            media_type=media_type,
            filename=filename
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"✗ Erreur téléchargement rapport: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@app.delete("/api/reports/{report_id}", tags=["Reports"])
async def delete_report(report_id: str):
    """Supprime un rapport (fichier + métadonnées)"""
    if not report_storage:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Service de stockage non initialisé"
        )
    
    try:
        success = report_storage.delete_report(report_id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Rapport {report_id} non trouvé"
            )
        
        return {"success": True, "message": f"Rapport {report_id} supprimé"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"✗ Erreur suppression rapport: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=True,
        log_level="info"
    )
