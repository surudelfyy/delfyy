-- Delfyy v2.3 Supabase Schema
-- Run this in Supabase SQL Editor or via migrations

-- =============================================================================
-- A) TABLES
-- =============================================================================

-- 1) profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2) user_contexts
CREATE TABLE IF NOT EXISTS public.user_contexts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
  stage TEXT,
  traction TEXT,
  goal TEXT,
  constraints TEXT[],
  risk_tolerance TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3) decisions
CREATE TABLE IF NOT EXISTS public.decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
  status TEXT NOT NULL DEFAULT 'running',
  question TEXT NOT NULL,
  input_context JSONB NOT NULL,
  classifier_output JSONB,
  lens_outputs JSONB,
  governor_output JSONB,
  decision_card_internal JSONB,
  decision_card JSONB,
  decision_memo JSONB,
  decision_card_text TEXT,
  confidence_tier TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Column comment for decision_card_internal
COMMENT ON COLUMN public.decisions.decision_card_internal IS 'Structured internal schema from Synthesiser. Display schema in decision_card.';

-- =============================================================================
-- B) INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS decisions_user_id_idx ON public.decisions(user_id);
CREATE INDEX IF NOT EXISTS decisions_created_at_idx ON public.decisions(created_at DESC);
CREATE INDEX IF NOT EXISTS decisions_status_idx ON public.decisions(status);
CREATE INDEX IF NOT EXISTS decisions_fts_idx ON public.decisions USING GIN (to_tsvector('english', coalesce(question, '') || ' ' || coalesce(decision_card_text, '')));

-- =============================================================================
-- C) TRIGGER: Create profiles row on auth.users insert
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$;

-- Drop trigger if exists, then create
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- D) RLS + POLICIES
-- =============================================================================

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_contexts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decisions ENABLE ROW LEVEL SECURITY;

-- profiles policies
DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
CREATE POLICY profiles_select_own ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- user_contexts policies
DROP POLICY IF EXISTS user_contexts_select_own ON public.user_contexts;
CREATE POLICY user_contexts_select_own ON public.user_contexts
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS user_contexts_insert_own ON public.user_contexts;
CREATE POLICY user_contexts_insert_own ON public.user_contexts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS user_contexts_update_own ON public.user_contexts;
CREATE POLICY user_contexts_update_own ON public.user_contexts
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS user_contexts_delete_own ON public.user_contexts;
CREATE POLICY user_contexts_delete_own ON public.user_contexts
  FOR DELETE USING (auth.uid() = user_id);

-- decisions policies
DROP POLICY IF EXISTS decisions_select_own ON public.decisions;
CREATE POLICY decisions_select_own ON public.decisions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS decisions_insert_own ON public.decisions;
CREATE POLICY decisions_insert_own ON public.decisions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS decisions_update_own ON public.decisions;
CREATE POLICY decisions_update_own ON public.decisions
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS decisions_delete_own ON public.decisions;
CREATE POLICY decisions_delete_own ON public.decisions
  FOR DELETE USING (auth.uid() = user_id);

