ALTER TABLE vehicules
    ADD COLUMN latitude_actuelle DOUBLE NULL,
    ADD COLUMN longitude_actuelle DOUBLE NULL,
    ADD COLUMN derniere_position_maj DATETIME NULL,
    ADD COLUMN vitesse_actuelle DOUBLE NULL,
    ADD COLUMN niveau_carburant DOUBLE NULL,
    ADD COLUMN type_vehicule VARCHAR(30) NULL,
    ADD COLUMN capacite_charge DOUBLE NULL,
    ADD COLUMN couleur VARCHAR(40) NULL;

ALTER TABLE trajets
    ADD COLUMN latitude_depart DOUBLE NULL,
    ADD COLUMN longitude_depart DOUBLE NULL,
    ADD COLUMN latitude_arrivee DOUBLE NULL,
    ADD COLUMN longitude_arrivee DOUBLE NULL,
    ADD COLUMN distance_km DOUBLE NULL,
    ADD COLUMN duree_estimee_minutes INT NULL,
    ADD COLUMN geometrie_itineraire LONGTEXT NULL,
    ADD COLUMN charge_kg DOUBLE NULL,
    ADD COLUMN priorite VARCHAR(30) NULL,
    ADD COLUMN notes VARCHAR(500) NULL,
    ADD COLUMN date_arrivee_reelle DATETIME NULL;