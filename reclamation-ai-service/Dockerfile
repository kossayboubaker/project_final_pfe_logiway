# ===========================================
# Réclamation AI Service - Validation IA
# Système expert bicouche (Toxicité + Sémantique)
# ===========================================
FROM python:3.11-slim

# Métadonnées
LABEL maintainer="LogiWay Team"
LABEL description="Reclamation AI Service - Rule-Based Expert System"
LABEL version="1.0.0"
LABEL port="5001"

WORKDIR /app

# ===========================================
# 1. Installation dépendances système
# ===========================================
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    wget \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# ===========================================
# 2. Création utilisateur non-root
# ===========================================
RUN groupadd -r reclamationai && useradd -r -g reclamationai reclamationai

# ===========================================
# 3. Installation des dépendances Python
# ===========================================
COPY requirements_simple.txt requirements.txt

RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# ===========================================
# 4. Copie du code source
# ===========================================
COPY --chown=reclamationai:reclamationai app_simple.py app.py

# ===========================================
# 5. Vérification de l'installation
# ===========================================
RUN python -c "import flask; import flask_cors; import re; print('All packages installed successfully')"

# ===========================================
# 6. Configuration
# ===========================================
ENV FLASK_APP=app.py
ENV FLASK_ENV=production
ENV PYTHONUNBUFFERED=1
ENV PORT=5001
ENV TOXICITY_THRESHOLD=0.55
ENV SEMANTIC_THRESHOLD=0.25

# Port exposé
EXPOSE 5001

# Health check pour monitoring
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:5001/health || exit 1

# Switch vers utilisateur non-root
USER reclamationai

# ===========================================
# 7. Démarrage avec Gunicorn (production)
# ===========================================
CMD ["gunicorn", "--bind", "0.0.0.0:5001", "--workers", "2", "--timeout", "60", "--log-level", "info", "--access-logfile", "-", "--error-logfile", "-", "app:app"]
