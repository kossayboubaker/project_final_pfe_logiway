# ===========================================
# Pause AI Service - Machine Learning
# RandomForest Model pour prédiction pauses
# ===========================================
FROM python:3.11-slim

# Métadonnées
LABEL maintainer="LogiWay Team"
LABEL description="Pause AI ML Service - RandomForest Predictions"
LABEL version="1.0.0"
LABEL port="5000"

WORKDIR /app

# ===========================================
# 1. Installation dépendances système
# ===========================================
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    g++ \
    libgomp1 \
    curl \
    wget \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# ===========================================
# 2. Création utilisateur non-root
# ===========================================
RUN groupadd -r pauseai && useradd -r -g pauseai pauseai

# ===========================================
# 3. Installation des dépendances Python
# ===========================================
COPY requirements.txt .

RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# ===========================================
# 4. Copie du code source
# ===========================================
COPY --chown=pauseai:pauseai . .

# ===========================================
# 5. Vérification de l'installation
# ===========================================
RUN python -c "import sklearn; import numpy; import pandas; import flask; print('All packages installed successfully')"

# ===========================================
# 6. Configuration
# ===========================================
ENV FLASK_APP=app.py
ENV FLASK_ENV=production
ENV PYTHONUNBUFFERED=1
ENV WORKERS=2
ENV TIMEOUT=120

# Port exposé
EXPOSE 5000

# Health check pour monitoring
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

# Switch vers utilisateur non-root
USER pauseai

# ===========================================
# 7. Démarrage avec Gunicorn (production)
# ===========================================
CMD ["sh", "-c", "gunicorn --bind 0.0.0.0:5000 --workers ${WORKERS} --timeout ${TIMEOUT} --log-level info --access-logfile - --error-logfile - app:app"]