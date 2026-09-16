"""Configuration de l'application RAG - Version Gemini"""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Configuration de l'application"""
    
    # Base de données (supporte les noms MYSQL_* et DB_*)
    DB_HOST: str = "localhost"
    DB_PORT: int = 3306
    DB_NAME: str = "logiway"
    DB_USER: str = "root"
    DB_PASSWORD: str = ""
    
    MYSQL_HOST: Optional[str] = None
    MYSQL_PORT: Optional[int] = None
    MYSQL_DATABASE: Optional[str] = None
    MYSQL_USER: Optional[str] = None
    MYSQL_PASSWORD: Optional[str] = None
    
    # Google Gemini API Key & Model
    GOOGLE_API_KEY: str = ""
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-2.5-flash"
    
    # API
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8001
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

    def model_post_init(self, __context):
        if self.MYSQL_HOST:
            self.DB_HOST = self.MYSQL_HOST
        if self.MYSQL_PORT:
            self.DB_PORT = self.MYSQL_PORT
        if self.MYSQL_DATABASE:
            self.DB_NAME = self.MYSQL_DATABASE
        if self.MYSQL_USER:
            self.DB_USER = self.MYSQL_USER
        if self.MYSQL_PASSWORD is not None:
            self.DB_PASSWORD = self.MYSQL_PASSWORD
        if self.GEMINI_API_KEY:
            self.GOOGLE_API_KEY = self.GEMINI_API_KEY
    
    @property
    def DATABASE_URL(self) -> str:
        """URL de connexion MySQL"""
        return f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
    
    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()