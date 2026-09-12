-- Table pour les prédictions IA des pauses réglementaires
CREATE TABLE IF NOT EXISTS pause_ai_predictions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    trajet_id BIGINT NOT NULL,
    timestamp DATETIME NOT NULL,
    hours_driving DOUBLE NOT NULL,
    dist_along_ratio DOUBLE NOT NULL,
    score INT NOT NULL,
    poi_type VARCHAR(50),
    alerte_declenchee BOOLEAN NOT NULL DEFAULT FALSE,
    type_alerte VARCHAR(30),
    latitude_poi DOUBLE,
    longitude_poi DOUBLE,
    nom_poi VARCHAR(255),
    distance_poi_m DOUBLE,
    
    CONSTRAINT fk_pause_ai_trajet FOREIGN KEY (trajet_id) REFERENCES trajets(id) ON DELETE CASCADE,
    INDEX idx_trajet_timestamp (trajet_id, timestamp),
    INDEX idx_timestamp (timestamp),
    INDEX idx_alerte_declenchee (alerte_declenchee)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
