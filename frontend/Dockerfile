# ===========================================
# STAGE 1: Build Angular avec Node.js
# ===========================================
FROM node:20-alpine AS build

# Métadonnées
LABEL maintainer="LogiWay Team"
LABEL description="Frontend Angular 19 - LogiWay Platform"

WORKDIR /app

# Copie des fichiers de dépendances (cache Docker)
COPY package*.json ./

# Installation des dépendances
RUN npm ci --legacy-peer-deps

# Copie du code source
COPY . .

# Build de production Angular avec optimisations
RUN npm run build -- --configuration production

# ===========================================
# STAGE 2: Serveur Nginx optimisé
# ===========================================
FROM nginx:1.25-alpine

# Métadonnées
LABEL maintainer="LogiWay Team"
LABEL version="19.1"

# Installation de dos2unix pour corriger les fins de ligne Windows
RUN apk add --no-cache dos2unix

# Suppression de la config Nginx par défaut
RUN rm /etc/nginx/conf.d/default.conf

# Copie de la config Nginx personnalisée
COPY nginx.conf /etc/nginx/nginx.conf

# Copie des fichiers buildés depuis stage précédent
COPY --from=build /app/dist/logiway-frontend/browser /usr/share/nginx/html

# Copie du script d'entrypoint
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN dos2unix /docker-entrypoint.sh && chmod +x /docker-entrypoint.sh

# Création utilisateur non-root avec accès en écriture pour config.json
RUN addgroup -S nginx-logiway && adduser -S nginx-logiway -G nginx-logiway && \
    chown -R nginx-logiway:nginx-logiway /usr/share/nginx/html && \
    chown -R nginx-logiway:nginx-logiway /var/cache/nginx && \
    touch /var/run/nginx.pid && \
    chown -R nginx-logiway:nginx-logiway /var/run/nginx.pid

# Port exposé
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

# Switch vers utilisateur non-root
USER nginx-logiway

# Démarrage via entrypoint (substitue les vars d'env puis lance Nginx)
ENTRYPOINT ["/docker-entrypoint.sh"]
