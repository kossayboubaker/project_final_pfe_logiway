-- ═══════════════════════════════════════════════════════════════════════════
-- COMMANDES SQL POUR TESTER LE SYSTÈME PAUSE AI
-- ═══════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. DIAGNOSTIC: VOIR L'ÉTAT ACTUEL DES TRAJETS
-- ─────────────────────────────────────────────────────────────────────────────

-- Tous les trajets EN_COURS avec temps de conduite
SELECT 
    t.id,
    t.point_depart,
    t.destination,
    t.distance_km,
    t.date_depart,
    t.statut,
    TIMESTAMPDIFF(MINUTE, t.date_depart, NOW()) AS minutes_conduite,
    ROUND(TIMESTAMPDIFF(MINUTE, t.date_depart, NOW()) / 60.0, 2) AS heures_conduite,
    CASE 
        WHEN TIMESTAMPDIFF(MINUTE, t.date_depart, NOW()) < 180 
        THEN '❌ Trop court (<3h) - Pas de pause'
        WHEN TIMESTAMPDIFF(MINUTE, t.date_depart, NOW()) BETWEEN 180 AND 270 
        THEN '⚠️ Alertes recommandées (3-4.5h)'
        ELSE '🚨 Alerte urgente (>=4.5h)'
    END AS statut_pause
FROM trajet t
WHERE t.statut = 'EN_COURS'
ORDER BY t.date_depart DESC;


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. SIMULATION: CRÉER UN TRAJET DE TEST LONG
-- ─────────────────────────────────────────────────────────────────────────────

-- Méthode 1: Simuler 3h30 de conduite sur un trajet existant
UPDATE trajet 
SET date_depart = DATE_SUB(NOW(), INTERVAL 210 MINUTE)  -- 3h30 = 210 minutes
WHERE id = 1  -- ⚠️ REMPLACEZ PAR VOTRE ID
  AND statut = 'EN_COURS';

-- Méthode 2: Simuler 5h de conduite (alerte urgente)
UPDATE trajet 
SET date_depart = DATE_SUB(NOW(), INTERVAL 300 MINUTE)  -- 5h = 300 minutes
WHERE id = 1  -- ⚠️ REMPLACEZ PAR VOTRE ID
  AND statut = 'EN_COURS';

-- Vérifier le changement
SELECT 
    id,
    point_depart,
    destination,
    date_depart,
    TIMESTAMPDIFF(MINUTE, date_depart, NOW()) / 60.0 AS heures_conduite_simulees
FROM trajet 
WHERE id = 1;  -- ⚠️ REMPLACEZ PAR VOTRE ID


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. VÉRIFICATION: CONSULTER LES PRÉDICTIONS GÉNÉRÉES
-- ─────────────────────────────────────────────────────────────────────────────

-- Toutes les prédictions récentes
SELECT 
    p.id,
    p.trajet_id,
    p.timestamp,
    ROUND(p.hours_driving, 2) AS heures_conduite,
    p.score,
    p.type_alerte,
    p.alerte_declenchee,
    p.nom_poi,
    ROUND(p.distance_poi_m, 0) AS distance_poi_m,
    p.poi_type
FROM pause_ai_prediction p
ORDER BY p.timestamp DESC
LIMIT 20;

-- Prédictions pour un trajet spécifique
SELECT 
    p.id,
    p.timestamp,
    ROUND(p.hours_driving, 2) AS heures_conduite,
    ROUND(p.dist_along_ratio, 2) AS ratio_parcouru,
    p.score,
    p.type_alerte,
    p.alerte_declenchee,
    p.nom_poi
FROM pause_ai_prediction p
WHERE p.trajet_id = 1  -- ⚠️ REMPLACEZ PAR VOTRE ID
ORDER BY p.timestamp ASC;

-- Statistiques par trajet
SELECT 
    p.trajet_id,
    t.point_depart,
    t.destination,
    COUNT(*) AS nb_evaluations,
    ROUND(AVG(p.score), 1) AS score_moyen,
    ROUND(MAX(p.hours_driving), 2) AS heures_max_conduite,
    SUM(CASE WHEN p.alerte_declenchee = 1 THEN 1 ELSE 0 END) AS nb_alertes
FROM pause_ai_prediction p
JOIN trajet t ON t.id = p.trajet_id
GROUP BY p.trajet_id, t.point_depart, t.destination
ORDER BY nb_alertes DESC;


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. ANALYSE: CORRÉLATION PAUSES RÉGLEMENTAIRES VS PRÉDICTIONS IA
-- ─────────────────────────────────────────────────────────────────────────────

-- Voir les pauses réglementaires effectuées
SELECT 
    pr.id,
    pr.trajet_id,
    pr.statut AS statut_pause,
    pr.date_debut,
    pr.date_fin,
    pr.duration_seconds / 60.0 AS duree_minutes,
    pr.latitude,
    pr.longitude
FROM pause_reglementaire pr
WHERE pr.trajet_id = 1  -- ⚠️ REMPLACEZ PAR VOTRE ID
ORDER BY pr.date_debut ASC;

-- Trajets avec alertes IA mais sans pauses effectuées
SELECT 
    p.trajet_id,
    t.point_depart,
    t.destination,
    COUNT(DISTINCT p.id) AS nb_alertes_ia,
    COUNT(DISTINCT pr.id) AS nb_pauses_effectuees,
    COUNT(DISTINCT p.id) - COUNT(DISTINCT pr.id) AS pauses_ignorees
FROM pause_ai_prediction p
JOIN trajet t ON t.id = p.trajet_id
LEFT JOIN pause_reglementaire pr ON pr.trajet_id = p.trajet_id AND pr.statut = 'ATTEINTE'
WHERE p.alerte_declenchee = 1
GROUP BY p.trajet_id, t.point_depart, t.destination
HAVING pauses_ignorees > 0
ORDER BY pauses_ignorees DESC;


-- ─────────────────────────────────────────────────────────────────────────────
-- 5. NETTOYAGE: SUPPRIMER LES DONNÉES DE TEST
-- ─────────────────────────────────────────────────────────────────────────────

-- ⚠️ ATTENTION: Commandes destructives, utilisez avec précaution

-- Supprimer les prédictions d'un trajet de test
DELETE FROM pause_ai_prediction WHERE trajet_id = 999;  -- ⚠️ REMPLACEZ PAR VOTRE ID

-- Supprimer toutes les prédictions anciennes (> 30 jours)
DELETE FROM pause_ai_prediction 
WHERE timestamp < DATE_SUB(NOW(), INTERVAL 30 DAY);

-- Réinitialiser un trajet (remettre à date actuelle)
UPDATE trajet 
SET date_depart = NOW()
WHERE id = 1  -- ⚠️ REMPLACEZ PAR VOTRE ID
  AND statut = 'EN_COURS';


-- ─────────────────────────────────────────────────────────────────────────────
-- 6. DASHBOARD: STATISTIQUES GLOBALES
-- ─────────────────────────────────────────────────────────────────────────────

-- Statistiques globales du système Pause AI
SELECT 
    COUNT(DISTINCT p.trajet_id) AS trajets_evalues,
    COUNT(*) AS total_evaluations,
    SUM(CASE WHEN p.alerte_declenchee = 1 THEN 1 ELSE 0 END) AS total_alertes,
    SUM(CASE WHEN p.type_alerte = 'URGENTE' THEN 1 ELSE 0 END) AS alertes_urgentes,
    SUM(CASE WHEN p.type_alerte = 'RECOMMANDEE' THEN 1 ELSE 0 END) AS alertes_recommandees,
    ROUND(AVG(p.score), 1) AS score_moyen,
    ROUND(AVG(p.hours_driving), 2) AS heures_conduite_moyenne
FROM pause_ai_prediction p;

-- Répartition des alertes par type
SELECT 
    p.type_alerte,
    COUNT(*) AS nombre,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM pause_ai_prediction WHERE alerte_declenchee = 1), 1) AS pourcentage
FROM pause_ai_prediction p
WHERE p.alerte_declenchee = 1
GROUP BY p.type_alerte
ORDER BY nombre DESC;

-- Top 10 des POIs recommandés
SELECT 
    p.nom_poi,
    p.poi_type,
    COUNT(*) AS nb_recommandations,
    ROUND(AVG(p.score), 1) AS score_moyen,
    ROUND(AVG(p.distance_poi_m), 0) AS distance_moyenne_m
FROM pause_ai_prediction p
WHERE p.alerte_declenchee = 1
  AND p.nom_poi IS NOT NULL
GROUP BY p.nom_poi, p.poi_type
ORDER BY nb_recommandations DESC
LIMIT 10;


-- ─────────────────────────────────────────────────────────────────────────────
-- 7. TESTS SPÉCIFIQUES: SCÉNARIOS DE VÉRIFICATION
-- ─────────────────────────────────────────────────────────────────────────────

-- Scénario A: Trajet court (<3h) - DOIT être VIDE
SELECT 
    p.*
FROM pause_ai_prediction p
JOIN trajet t ON t.id = p.trajet_id
WHERE p.hours_driving < 3.0;

-- Résultat attendu: 0 lignes (aucune prédiction ne doit être créée)


-- Scénario B: Trajet 3-4.5h - DOIT contenir RECOMMANDÉES
SELECT 
    p.trajet_id,
    ROUND(p.hours_driving, 2) AS heures,
    p.score,
    p.type_alerte,
    p.alerte_declenchee
FROM pause_ai_prediction p
WHERE p.hours_driving BETWEEN 3.0 AND 4.5;

-- Résultat attendu: lignes avec type_alerte = 'RECOMMANDEE' ou 'AUCUNE'


-- Scénario C: Trajet >=4.5h - DOIT contenir URGENTES
SELECT 
    p.trajet_id,
    ROUND(p.hours_driving, 2) AS heures,
    p.score,
    p.type_alerte,
    p.alerte_declenchee
FROM pause_ai_prediction p
WHERE p.hours_driving >= 4.5;

-- Résultat attendu: lignes avec type_alerte = 'URGENTE' ET alerte_declenchee = 1


-- ─────────────────────────────────────────────────────────────────────────────
-- 8. MONITORING: VÉRIFIER L'ACTIVITÉ DU SCHEDULER
-- ─────────────────────────────────────────────────────────────────────────────

-- Voir les évaluations dans les dernières 24h
SELECT 
    DATE_FORMAT(p.timestamp, '%Y-%m-%d %H:%i') AS heure_evaluation,
    COUNT(*) AS nb_evaluations
FROM pause_ai_prediction p
WHERE p.timestamp >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
GROUP BY DATE_FORMAT(p.timestamp, '%Y-%m-%d %H:%i')
ORDER BY heure_evaluation DESC;

-- Le scheduler évalue toutes les 2 minutes, donc vous devriez voir:
-- - 30 évaluations/heure pour chaque trajet EN_COURS
-- - Intervalles réguliers de 2 minutes


-- ─────────────────────────────────────────────────────────────────────────────
-- 9. AIDE: COMMANDES UTILES RAPIDES
-- ─────────────────────────────────────────────────────────────────────────────

-- 🚀 QUICK START: Simuler un test complet
-- 1. Trouver un trajet EN_COURS
SELECT id, point_depart, destination FROM trajet WHERE statut = 'EN_COURS' LIMIT 1;

-- 2. Copier l'ID et simuler 3h30 de conduite
-- UPDATE trajet SET date_depart = DATE_SUB(NOW(), INTERVAL 210 MINUTE) WHERE id = [ID];

-- 3. Attendre 2 minutes

-- 4. Vérifier les prédictions générées
-- SELECT * FROM pause_ai_prediction WHERE trajet_id = [ID] ORDER BY timestamp DESC;


-- 🔍 DIAGNOSTIC RAPIDE: Pourquoi pas de pauses ?
SELECT 
    t.id,
    t.point_depart,
    t.destination,
    t.statut,
    ROUND(TIMESTAMPDIFF(MINUTE, t.date_depart, NOW()) / 60.0, 2) AS heures_conduite,
    COUNT(p.id) AS nb_predictions,
    CASE 
        WHEN t.statut != 'EN_COURS' 
        THEN '❌ Statut incorrect (doit être EN_COURS)'
        WHEN TIMESTAMPDIFF(MINUTE, t.date_depart, NOW()) < 180 
        THEN '✅ Normal: trajet < 3h (pas de pause)'
        WHEN COUNT(p.id) = 0 
        THEN '⚠️ Problème: aucune évaluation générée'
        ELSE '✅ Évaluations générées'
    END AS diagnostic
FROM trajet t
LEFT JOIN pause_ai_prediction p ON p.trajet_id = t.id
WHERE t.id = 1  -- ⚠️ REMPLACEZ PAR VOTRE ID
GROUP BY t.id, t.point_depart, t.destination, t.statut, t.date_depart;


-- ═══════════════════════════════════════════════════════════════════════════
-- FIN DU SCRIPT - DOCUMENTATION COMPLÈTE: VERIFICATION_SYSTEME_PAUSE_AI.md
-- ═══════════════════════════════════════════════════════════════════════════
