-- ============================================
-- MIGRATION: Fallback INSERT policy for profiles table
-- Allows users to create their own profile if trigger fails
-- Safe to run multiple times (IF NOT EXISTS check)
-- ============================================

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'profiles_insert_own'
  ) THEN
    CREATE POLICY profiles_insert_own ON profiles
      FOR INSERT WITH CHECK (auth.uid() = id);
  END IF;
END $$;

