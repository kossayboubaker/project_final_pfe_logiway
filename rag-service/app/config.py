"""Configuration de l'application RAG - Version Gemini"""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Configuration de l'application"""
    
    # Base de données
    DB_HOST: str = "localhost"
    DB_PORT: int = 3306
    DB_NAME: str = "logiway_db"
    DB_USER: str = "root"
    DB_PASSWORD: str = ""
    
    # Google Gemini
    GOOGLE_API_KEY: str = "AIzaSyAzSMkHAj_QXYX0lh9ZCFHQpiiq8UNvF2A"
    GEMINI_MODEL: str = "models/gemini-3.1-flash-lite"
    
    # API
    API_HOST: str = "localhost"
    API_PORT: int = 5003
    API_TITLE: str = "Logiway RAG Chatbot - Gemini"
    API_VERSION: str = "2.0.0"
    
    # RAG
    TOP_K_RESULTS: int = 5
    MAX_RESPONSE_TOKENS: int = 500
    LLM_TEMPERATURE: float = 0.1
    
    # Features simplifiées
    USE_OLLAMA_EMBEDDINGS: bool = False
    USE_HYBRID_RETRIEVAL: bool = False
    ENABLE_CACHE: bool = True
    CACHE_SIZE: int = 100
    
    @property
    def DATABASE_URL(self) -> str:
        """URL de connexion MySQL"""
        return f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
    
    model_config = {"env_file": ".env"}


settings = Settings()