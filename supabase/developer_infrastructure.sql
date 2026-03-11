-- ================================================================
-- PAN AFRICAN EXPRESS — DEVELOPER INFRASTRUCTURE MIGRATION
-- ================================================================

-- 1. API Keys Table for Merchant Integration
CREATE TABLE IF NOT EXISTS public.merchant_api_keys (
  id            UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key_name      TEXT         NOT NULL DEFAULT 'Default Key',
  public_key    TEXT         UNIQUE NOT NULL, -- Starts with pax_pk_
  secret_hash   TEXT         NOT NULL,        -- Hashed secret key
  last_used_at  TIMESTAMPTZ,
  is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Indexing for quick lookup
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON public.merchant_api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_public  ON public.merchant_api_keys(public_key);

-- 2. Webhook Configurations for Real-time tracking updates
CREATE TABLE IF NOT EXISTS public.merchant_webhooks (
  id            UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url           TEXT         NOT NULL,
  secret        TEXT         NOT NULL, -- For signing payload
  events        TEXT[]       NOT NULL DEFAULT '{shipment.created, shipment.updated}',
  is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- RLS for Developer Resources
ALTER TABLE public.merchant_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_webhooks ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'merchant_api_keys' AND policyname = 'Users can manage own API keys') THEN
    CREATE POLICY "Users can manage own API keys"
      ON public.merchant_api_keys FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'merchant_webhooks' AND policyname = 'Users can manage own Webhooks') THEN
    CREATE POLICY "Users can manage own Webhooks"
      ON public.merchant_webhooks FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;
