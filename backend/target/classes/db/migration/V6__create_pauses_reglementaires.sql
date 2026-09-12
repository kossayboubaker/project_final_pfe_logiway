-- V6 : Création de la table pauses_reglementaires (Sprint B)
-- Ne supprime jamais de colonnes ou de tables existantes.

CREATE TABLE IF NOT EXISTS pauses_reglementaires (
    id                    BIGINT         NOT NULL AUTO_INCREMENT,
    trajet_id             BIGINT         NOT NULL,
    type                  VARCHAR(30)    NOT NULL,
    longitude             DOUBLE         NOT NULL,
    latitude              DOUBLE         NOT NULL,
    distance_along_route_m DOUBLE,
    heure_arrivee_planifiee DATETIME(6),
    duration_seconds      INT,
    heure_reprise_estimee DATETIME(6),
    statut                VARCHAR(30)    NOT NULL DEFAULT 'PLANIFIEE',
    nom_lieu              VARCHAR(255),
    PRIMARY KEY (id),
    CONSTRAINT fk_pause_trajet
        FOREIGN KEY (trajet_id) REFERENCES trajets (id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_pause_trajet_id ON pauses_reglementaires (trajet_id);
