-- Mark old "running" decisions as failed (anything over 5 minutes old is dead)
UPDATE decisions
SET status = 'failed',
    updated_at = NOW()
WHERE status = 'running'
  AND created_at < NOW() - INTERVAL '5 minutes';

-- Add index for faster status queries
CREATE INDEX IF NOT EXISTS idx_decisions_status_created
ON decisions(status, created_at);

