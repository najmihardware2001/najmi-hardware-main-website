-- Migration 003: RFQ Access Key and Security Token
-- Additive migration: safely ensures access_key exists on rfqs table for guest access and security tokens

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rfqs' AND column_name = 'access_key'
  ) THEN
    ALTER TABLE rfqs ADD COLUMN access_key TEXT;
  END IF;
END $$;

UPDATE rfqs SET access_key = gen_random_uuid()::text WHERE access_key IS NULL;
ALTER TABLE rfqs ALTER COLUMN access_key SET DEFAULT gen_random_uuid()::text;
ALTER TABLE rfqs ALTER COLUMN access_key SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_rfqs_access_key ON rfqs(access_key);
