# ===========================================
# STAGE 1: Build avec Maven
# ===========================================
FROM maven:3.9.9-eclipse-temurin-17 AS build

WORKDIR /app

# Copie uniquement pom.xml pour cache Docker des dépendances
COPY pom.xml .
RUN mvn -B -q dependency:go-offline

# Copie du code source
COPY src ./src

# Build du JAR (sans tests pour rapidité)
RUN mvn -B -q clean package -DskipTests

# ===========================================
# STAGE 2: Runtime optimisé
# ===========================================
FROM eclipse-temurin:17-jre-alpine

# Métadonnées
LABEL maintainer="LogiWay Team"
LABEL description="Backend Spring Boot - LogiWay Platform"
LABEL version="3.2.2"

# Création utilisateur non-root pour sécurité
RUN addgroup -S logiway && adduser -S logiway -G logiway

WORKDIR /app

# Copie du JAR depuis stage build
COPY --from=build --chown=logiway:logiway /app/target/*.jar app.jar

# Variables d'environnement pour optimisation JVM
ENV JAVA_OPTS="-Xms512m -Xmx1024m -XX:+UseG1GC -XX:MaxGCPauseMillis=200"

# Port exposé
EXPOSE 8080

# Health check pour monitoring
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/actuator/health || exit 1

# Switch vers utilisateur non-root
USER logiway

# Entrypoint avec optimisations JVM
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/app.jar"]
