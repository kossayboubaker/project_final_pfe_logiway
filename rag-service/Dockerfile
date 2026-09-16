# ===========================================
# RAG Service - Chatbot + Génération Rapports
# LangChain + Google Gemini 1.5 Flash
# ===========================================
FROM python:3.13-slim

# Métadonnées
LABEL maintainer="LogiWay Team"
LABEL description="RAG Service - Chatbot & Report Generation with Gemini"
LABEL version="1.0.0"
LABEL port="8001"

WORKDIR /app

# ===========================================
# 1. Installation dépendances système
# ===========================================
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    curl \
    wget \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# ===========================================
# 2. Création utilisateur non-root
# ===========================================
RUN groupadd -r ragservice && useradd -r -g ragservice ragservice

# ===========================================
# 3. Installation des dépendances Python
# ===========================================
COPY requirements.txt .

RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# ===========================================
# 4. Copie du code source
# ===========================================
COPY --chown=ragservice:ragservice . .

# ===========================================
# 5. Création des répertoires nécessaires
# ===========================================
RUN mkdir -p /app/reports /app/vectorstore /app/logs && \
    chown -R ragservice:ragservice /app/reports /app/vectorstore /app/logs

# ===========================================
# 6. Vérification de l'installation
# ===========================================
RUN python -c "import fastapi; import google.generativeai; import sqlalchemy; import reportlab; print('All packages installed successfully')"

# ===========================================
# 7. Configuration
# ===========================================
ENV PYTHONUNBUFFERED=1
ENV PORT=8001
ENV WORKERS=2
ENV LOG_LEVEL=info

# Variables d'environnement à fournir au runtime
# ENV GEMINI_API_KEY=your_key_here
# ENV MYSQL_HOST=mysql
# ENV MYSQL_PORT=3306
# ENV MYSQL_DATABASE=logiway
# ENV MYSQL_USER=root
# ENV MYSQL_PASSWORD=password

# Port exposé
EXPOSE 8001

# Health check pour monitoring
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8001/health || exit 1

# Switch vers utilisateur non-root
USER ragservice

# ===========================================
# 8. Démarrage avec Uvicorn (FastAPI)
# ===========================================
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT} --workers ${WORKERS} --log-level ${LOG_LEVEL}"]
