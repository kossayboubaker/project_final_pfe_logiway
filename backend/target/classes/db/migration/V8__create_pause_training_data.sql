-- V8 : Table de stockage des données d'entraînement du modèle IA des pauses
-- Cette table stocke les features et les scores générés (KPI) utilisés
-- pour entraîner le modèle RandomForest du service pause-ai.
-- 
-- Le modèle peut aussi requêter cette table en production pour retrouver
-- des cas similaires à un trajet donné (approche hybride ML + règles).
--
-- Les données sont générées par :
--   1. La commande : python generate_kpi_data.py --samples 100000
--   2. L'API Flask : POST /api/train
--   3. Cette migration fournit un seed initial représentatif (~50 lignes)

CREATE TABLE IF NOT EXISTS pause_training_data (
    id                    BIGINT          NOT NULL AUTO_INCREMENT,

    -- Features d'entrée
    total_distance_km     DOUBLE          NOT NULL COMMENT 'Distance totale du trajet en km',
    dist_along_km         DOUBLE          NOT NULL COMMENT 'Distance parcourue jusqu''au point candidat en km',
    dist_along_ratio      DOUBLE          NOT NULL COMMENT 'Ratio de progression (0.0-1.0)',
    perp_distance_m       DOUBLE          NOT NULL COMMENT 'Distance perpendiculaire au tracé en mètres',
    hours_driving         DOUBLE          NOT NULL COMMENT 'Heures de conduite jusqu''au point',
    arrival_hour          INT             NOT NULL COMMENT 'Heure d''arrivée estimée (0-23)',
    is_night              TINYINT(1)      NOT NULL DEFAULT 0 COMMENT 'Conduite nocturne 2h-6h',
    is_postprandial       TINYINT(1)      NOT NULL DEFAULT 0 COMMENT 'Creux postprandial 13h-15h',
    is_last_quarter       TINYINT(1)      NOT NULL DEFAULT 0 COMMENT 'Dernier quart du trajet',
    poi_type_encoded      INT             NOT NULL DEFAULT 0 COMMENT '0=POI, 1=fuel, 2=restaurant, 3=cafe, 4=rest_area, 5=services',
    is_meal_poi           TINYINT(1)      NOT NULL DEFAULT 0 COMMENT 'POI de type repas',
    is_meal_hour          TINYINT(1)      NOT NULL DEFAULT 0 COMMENT 'Heure de repas',
    is_mid_range_fuel     TINYINT(1)      NOT NULL DEFAULT 0 COMMENT 'Station essence à 40-85% du trajet',
    is_too_close          TINYINT(1)      NOT NULL DEFAULT 0 COMMENT 'Moins de 30km du départ',
    has_hgv               TINYINT(1)      NOT NULL DEFAULT 0 COMMENT 'Accès poids lourds',
    has_shower            TINYINT(1)      NOT NULL DEFAULT 0 COMMENT 'Douche disponible',
    has_toilets           TINYINT(1)      NOT NULL DEFAULT 0 COMMENT 'Sanitaires disponibles',
    is_24h                TINYINT(1)      NOT NULL DEFAULT 0 COMMENT 'Ouvert 24/7',
    is_highway_service    TINYINT(1)      NOT NULL DEFAULT 0 COMMENT 'Aire officielle (rest_area/services)',

    -- Scores cibles (KPI)
    fatigue_score         INT             NOT NULL COMMENT 'Score de fatigue (0-100)',
    accessibility_score   INT             NOT NULL COMMENT "Score d'accessibilité (0-100)",
    context_score         INT             NOT NULL COMMENT 'Score de contexte (0-100)',
    global_score          INT             NOT NULL COMMENT 'Score global IA = fatigue*0.40 + accès*0.35 + contexte*0.25',

    -- Métadonnées
    generated_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    seed_version          VARCHAR(20)     DEFAULT 'v3.0-ml' COMMENT 'Version du générateur',

    PRIMARY KEY (id),
    INDEX idx_global_score (global_score),
    INDEX idx_total_distance (total_distance_km),
    INDEX idx_dist_along_ratio (dist_along_ratio),
    INDEX idx_arrival_hour (arrival_hour),
    INDEX idx_poi_type (poi_type_encoded)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed initial de données représentatives (couvrant les cas limites)
INSERT INTO pause_training_data (total_distance_km, dist_along_km, dist_along_ratio, perp_distance_m, hours_driving, arrival_hour, is_night, is_postprandial, is_last_quarter, poi_type_encoded, is_meal_poi, is_meal_hour, is_mid_range_fuel, is_too_close, has_hgv, has_shower, has_toilets, is_24h, is_highway_service, fatigue_score, accessibility_score, context_score, global_score) VALUES
-- Cas 1: Trajet long, nuit, aire de repos complète → score élevé
(800.0, 400.0, 0.50, 50.0, 8.0, 3, 1, 0, 0, 5, 1, 0, 0, 0, 1, 1, 1, 1, 1, 80, 100, 90, 89),
-- Cas 2: Trajet moyen, postprandial, station-service → score moyen-haut
(350.0, 175.0, 0.50, 80.0, 3.5, 14, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 1, 0, 45, 95, 65, 67),
-- Cas 3: Trajet court, début de trajet, POI éloigné → score bas
(100.0, 15.0, 0.15, 700.0, 0.3, 10, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 65, 25, 28),
-- Cas 4: Fin de trajet, nuit, restaurant → bon score
(600.0, 500.0, 0.83, 120.0, 10.0, 2, 1, 0, 1, 2, 1, 0, 0, 0, 0, 0, 1, 0, 0, 85, 55, 50, 66),
-- Cas 5: Trajet très long, matin, services complets → excellent
(1100.0, 600.0, 0.55, 30.0, 12.0, 9, 0, 0, 0, 5, 1, 1, 0, 0, 1, 1, 1, 1, 1, 85, 100, 95, 92),
-- Cas 6: Mi-parcours, essence, bonne accessibilité
(500.0, 300.0, 0.60, 150.0, 6.0, 16, 0, 0, 0, 1, 0, 0, 1, 0, 1, 1, 1, 0, 0, 60, 75, 65, 66),
-- Cas 7: Départ, trop proche, café
(200.0, 10.0, 0.05, 50.0, 0.2, 8, 0, 0, 0, 3, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 65, 50, 35),
-- Cas 8: Long trajet, soir, rest_area, quart final
(900.0, 750.0, 0.83, 200.0, 15.0, 20, 0, 0, 1, 4, 0, 0, 0, 0, 1, 0, 1, 0, 1, 80, 80, 70, 77),
-- Cas 9: Trajet moyen, nuit, parking PL sans équipement
(400.0, 250.0, 0.63, 400.0, 5.0, 4, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 55, 50, 50, 52),
-- Cas 10: Court trajet, mais dépassement 4h30 (embouteillage)
(200.0, 180.0, 0.90, 30.0, 5.0, 12, 0, 0, 1, 2, 1, 1, 0, 0, 0, 0, 1, 1, 0, 65, 65, 75, 67),
-- Cas 11: Repas de midi, resto en bord de route
(300.0, 150.0, 0.50, 80.0, 3.0, 12, 0, 0, 0, 2, 1, 1, 0, 0, 0, 0, 1, 0, 0, 28, 55, 75, 50),
-- Cas 12: Aire avec douche, 24/7, HGVs
(700.0, 350.0, 0.50, 60.0, 7.0, 15, 0, 1, 0, 5, 1, 0, 0, 0, 1, 1, 1, 1, 1, 72, 100, 70, 80),
-- Cas 13: POI interdit PL (maxweight < 3.5t)
(450.0, 200.0, 0.44, 10.0, 4.0, 11, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 45, 20, 50, 38),
-- Cas 14: Petit matin, fin de trajet, besoin urgent de pause
(550.0, 480.0, 0.87, 250.0, 9.6, 6, 1, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 78, 50, 60, 64),
-- Cas 15: Trajet très court (ne devrait pas générer de pauses)
(60.0, 30.0, 0.50, 100.0, 0.6, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 55, 50, 32),
-- Cas 16: Kiosque/cafe au bord de la route
(250.0, 120.0, 0.48, 200.0, 2.4, 14, 0, 1, 0, 3, 1, 1, 0, 0, 0, 0, 0, 0, 0, 28, 50, 75, 49),
-- Cas 17: Trajet transfrontalier très long, nuit complète
(1500.0, 800.0, 0.53, 400.0, 16.0, 4, 1, 0, 0, 4, 0, 0, 0, 0, 0, 0, 1, 0, 1, 80, 65, 50, 67),
-- Cas 18: Midi, station essence avec tout équipement
(400.0, 250.0, 0.63, 40.0, 5.0, 13, 0, 1, 0, 1, 0, 1, 1, 0, 1, 1, 1, 1, 0, 60, 100, 65, 74),
-- Cas 19: Départ tôt matin
(350.0, 50.0, 0.14, 800.0, 1.0, 7, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 30, 50, 23),
-- Cas 20: Trajet idéal : aire 24/7 avec tout, mi-journée
(500.0, 250.0, 0.50, 20.0, 5.0, 12, 0, 0, 0, 5, 1, 1, 0, 0, 1, 1, 1, 1, 1, 60, 100, 95, 82);
