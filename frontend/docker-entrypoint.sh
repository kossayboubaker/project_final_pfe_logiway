#!/bin/sh
# =============================================================
# docker-entrypoint.sh — Substitution des variables runtime
# Remplace les placeholders dans config.json avant de démarrer Nginx
# =============================================================

CONFIG_FILE="/usr/share/nginx/html/assets/config.json"

echo "[entrypoint] Substitution des variables d'environnement dans config.json..."

# Valeurs par défaut si les variables ne sont pas définies
BACKEND_URL="${BACKEND_URL:-http://localhost:8080}"
KEYCLOAK_URL="${KEYCLOAK_URL:-http://localhost:8180}"
KEYCLOAK_REALM="${KEYCLOAK_REALM:-logiway}"
KEYCLOAK_CLIENT_ID="${KEYCLOAK_CLIENT_ID:-logiway}"

# Substitution des placeholders dans config.json
sed -i \
  -e "s|__BACKEND_URL__|${BACKEND_URL}|g" \
  -e "s|__KEYCLOAK_URL__|${KEYCLOAK_URL}|g" \
  -e "s|__KEYCLOAK_REALM__|${KEYCLOAK_REALM}|g" \
  -e "s|__KEYCLOAK_CLIENT_ID__|${KEYCLOAK_CLIENT_ID}|g" \
  "${CONFIG_FILE}"

echo "[entrypoint] config.json mis à jour:"
cat "${CONFIG_FILE}"

echo "[entrypoint] Démarrage de Nginx..."
exec nginx -g "daemon off;"
