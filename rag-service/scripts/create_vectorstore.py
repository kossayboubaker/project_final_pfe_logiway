"""
Script de création du Vector Store Chroma
Lit les documents du cache JSON et crée les embeddings
"""
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.embeddings import get_embeddings
from app.config import settings
from langchain_community.vectorstores import Chroma
from langchain.schema import Document
from langchain.text_splitter import RecursiveCharacterTextSplitter
import json
import logging
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def load_documents_from_cache() -> list[Document]:
    """Charge les documents depuis le cache JSON"""
    cache_file = "./data/documents/cache.json"
    
    if not os.path.exists(cache_file):
        logger.error(f"✗ Cache non trouvé: {cache_file}")
        logger.info("Exécutez d'abord: python scripts/ingest_data.py")
        return []
    
    logger.info(f"Chargement documents depuis: {cache_file}")
    
    with open(cache_file, "r", encoding="utf-8") as f:
        cache_data = json.load(f)
    
    documents = []
    for doc_data in cache_data["documents"]:
        doc = Document(
            page_content=doc_data["content"],
            metadata=doc_data["metadata"]
        )
        documents.append(doc)
    
    logger.info(f"✓ {len(documents)} documents chargés")
    return documents


def split_documents(documents: list[Document]) -> list[Document]:
    """
    Split les documents en chunks plus petits
    (optionnel, utile si documents très longs)
    """
    logger.info("Splitting des documents...")
    
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        length_function=len,
        separators=["\n\n", "\n", " ", ""]
    )
    
    split_docs = text_splitter.split_documents(documents)
    logger.info(f"✓ {len(split_docs)} chunks créés (depuis {len(documents)} documents)")
    
    return split_docs


def create_vectorstore():
    """Crée le vector store Chroma avec embeddings"""
    
    logger.info("=" * 60)
    logger.info("Création du Vector Store Chroma")
    logger.info("=" * 60)
    
    # 1. Charger documents
    documents = load_documents_from_cache()
    if not documents:
        logger.error("✗ Aucun document à vectoriser")
        return False
    
    # 2. Split documents (optionnel)
    # documents = split_documents(documents)
    
    # 3. Charger modèle embeddings
    logger.info("\nChargement modèle embeddings...")
    embeddings = get_embeddings()
    
    # 4. Créer vector store
    vectorstore_path = settings.VECTOR_STORE_PATH
    os.makedirs(vectorstore_path, exist_ok=True)
    
    logger.info(f"\nCréation vector store: {vectorstore_path}")
    logger.info(f"Collection: {settings.COLLECTION_NAME}")
    logger.info("⏳ Génération des embeddings (peut prendre 2-5 minutes)...")
    
    start_time = datetime.now()
    
    try:
        vectorstore = Chroma.from_documents(
            documents=documents,
            embedding=embeddings,
            persist_directory=vectorstore_path,
            collection_name=settings.COLLECTION_NAME
        )
        
        # Vérification
        collection = vectorstore._collection
        count = collection.count()
        
        elapsed = (datetime.now() - start_time).total_seconds()
        
        logger.info("\n" + "=" * 60)
        logger.info(f"✓ Vector store créé avec succès!")
        logger.info(f"  - Documents vectorisés: {count}")
        logger.info(f"  - Temps: {elapsed:.1f}s")
        logger.info(f"  - Localisation: {vectorstore_path}")
        logger.info("=" * 60)
        
        # Test de recherche
        logger.info("\nTest de recherche...")
        results = vectorstore.similarity_search("véhicules disponibles", k=2)
        logger.info(f"✓ Test réussi - {len(results)} résultats trouvés")
        
        return True
        
    except Exception as e:
        logger.error(f"\n✗ Erreur création vector store: {e}")
        return False


if __name__ == "__main__":
    try:
        success = create_vectorstore()
        if success:
            logger.info("\n✓ Vector store prêt!")
            logger.info("Démarrez le service: start.bat")
        else:
            logger.error("\n✗ Échec création vector store")
            sys.exit(1)
    except Exception as e:
        logger.error(f"\n✗ Erreur fatale: {e}")
        sys.exit(1)
