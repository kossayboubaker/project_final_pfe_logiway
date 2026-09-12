-- Add AI scoring columns to pauses_reglementaires table
ALTER TABLE pauses_reglementaires
    ADD COLUMN ai_score INTEGER,
    ADD COLUMN fatigue_score INTEGER,
    ADD COLUMN accessibility_score INTEGER,
    ADD COLUMN context_score INTEGER,
    ADD COLUMN reasoning TEXT,
    ADD COLUMN confidence DOUBLE PRECISION;

-- Add comments for documentation
COMMENT ON COLUMN pauses_reglementaires.ai_score IS 'Global AI score (0-100) from intelligent scoring model';
COMMENT ON COLUMN pauses_reglementaires.fatigue_score IS 'Fatigue component (40% weight) of AI scoring';
COMMENT ON COLUMN pauses_reglementaires.accessibility_score IS 'Accessibility component (35% weight) of AI scoring';
COMMENT ON COLUMN pauses_reglementaires.context_score IS 'Context component (25% weight) of AI scoring';
COMMENT ON COLUMN pauses_reglementaires.reasoning IS 'AI reasoning justifications (semicolon-separated)';
COMMENT ON COLUMN pauses_reglementaires.confidence IS 'AI confidence level (0.0-1.0)';
