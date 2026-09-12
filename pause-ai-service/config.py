import os


class Config:
    MODEL_PATH = os.getenv("MODEL_PATH", "data/pause_model.joblib")
    TRAINING_DATA_PATH = os.getenv("TRAINING_DATA_PATH", "data/training_data.csv")
    OSRM_URL = os.getenv("OSRM_URL", "https://router.project-osrm.org")
    API_PORT = int(os.getenv("API_PORT", "5000"))
    DEBUG = os.getenv("DEBUG", "false").lower() == "true"
    TRAINING_SAMPLES = int(os.getenv("TRAINING_SAMPLES", "10000"))
