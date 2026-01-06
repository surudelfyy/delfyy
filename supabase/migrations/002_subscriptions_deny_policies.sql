-- ============================================
-- MIGRATION: Explicit deny policies for subscriptions table
-- Writes are only allowed via service client (Stripe webhooks)
-- Safe to run multiple times (IF NOT EXISTS checks)
-- ============================================

-- Document the table's access pattern
COMMENT ON TABLE subscriptions IS 
  'Managed exclusively by Stripe webhooks via service client. No direct user writes permitted.';

-- Deny all user-level writes
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'subscriptions' 
    AND policyname = 'subscriptions_deny_insert'
  ) THEN
    CREATE POLICY subscriptions_deny_insert ON subscriptions
      FOR INSERT WITH CHECK (false);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'subscriptions' 
    AND policyname = 'subscriptions_deny_update'
  ) THEN
    CREATE POLICY subscriptions_deny_update ON subscriptions
      FOR UPDATE USING (false);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'subscriptions' 
    AND policyname = 'subscriptions_deny_delete'
  ) THEN
    CREATE POLICY subscriptions_deny_delete ON subscriptions
      FOR DELETE USING (false);
  END IF;
END $$;

