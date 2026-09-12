"""Chaîne RAG ultra-simple SANS LangChain"""
from app.retriever import SimpleDBRetriever
from typing import Dict, List
import logging

logger = logging.getLogger(__name__)


# Template de prompt optimisé pour Logiway
PROMPT_TEMPLATE = """Tu es LogiWay Assistant, un expert en gestion de flotte automobile et logistique.

Tu as accès aux données système suivantes pour répondre à la question:

Contexte (données du système):
{context}

Question de l'utilisateur: {question}

Instructions importantes:
- Réponds UNIQUEMENT avec les informations fournies dans le contexte ci-dessus
- Sois concis et précis (maximum 5 lignes)
- Si le contexte ne contient pas l'information nécessaire, dis clairement: "Je n'ai pas cette information dans ma base de connaissances actuelles"
- Utilise un français naturel et professionnel
- Pour les chiffres, donne des statistiques précises quand disponibles
- Structure ta réponse avec des puces si plusieurs éléments

Réponse:"""


class SimpleRAGChain:
    """Chaîne RAG ultra-simple sans LangChain"""
    
    def __init__(self, retriever, llm):
        self.retriever = retriever
        self.llm = llm
        logger.info("✓ Chaîne RAG ultra-simple créée")
    
    def __call__(self, inputs: Dict) -> Dict:
        """Exécute la chaîne RAG"""
        query = inputs.get("query", "")
        
        # 1. Récupération des documents
        documents, method = self.retriever.retrieve(query)
        
        # 2. Construction du contexte
        context = "\n".join([doc.page_content for doc in documents])
        if not context.strip():
            context = "Aucune donnée spécifique trouvée dans la base."
        
        # 3. Construction du prompt
        prompt = PROMPT_TEMPLATE.format(
            context=context,
            question=query
        )
        
        # 4. Génération de la réponse
        response = self.llm.invoke(prompt)
        
        return {
            "result": response,
            "source_documents": documents,
            "retrieval_method": method
        }


def create_rag_chain(retriever, llm):
    """
    Crée la chaîne RAG ultra-simple
    
    Args:
        retriever: Retriever (SimpleDBRetriever)
        llm: Modèle LLM Gemini
    
    Returns:
        Chaîne RAG configurée
    """
    logger.info("Création de la chaîne RAG ultra-simple")
    return SimpleRAGChain(retriever, llm)


def format_response(result: Dict, method_used: str = "unknown") -> Dict:
    """
    Formate la réponse de la chaîne RAG
    
    Args:
        result: Résultat brut de la chaîne
        method_used: Méthode de retrieval utilisée
    
    Returns:
        Réponse formatée
    """
    response = {
        "reponse": result.get("result", "Erreur de génération"),
        "sources": [],
        "retrieval_method": method_used
    }
    
    # Extraction des sources
    source_docs = result.get("source_documents", [])
    for doc in source_docs:
        source = {
            "content": doc.page_content[:200],  # Limiter longueur
            "table": doc.metadata.get("source", "unknown"),
            "score": doc.metadata.get("score")
        }
        response["sources"].append(source)
    
    return response