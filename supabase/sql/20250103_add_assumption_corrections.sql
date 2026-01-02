-- Per-decision assumption corrections storage
ALTER TABLE public.decisions
ADD COLUMN IF NOT EXISTS assumption_corrections JSONB;

