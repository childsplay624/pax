-- ================================================================
-- 🛡️ PAN AFRICAN EXPRESS — RATE LIMITING INFRASTRUCTURE
-- ================================================================
-- Implements a "Token Bucket" algorithm for server-side rate limiting.
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- ================================================================

-- Create the storage table for buckets
CREATE TABLE IF NOT EXISTS public.rate_limits (
    key          TEXT PRIMARY KEY,  -- e.g. "sms:12345" or "login:user@email.com"
    tokens       INTEGER NOT NULL,
    last_updated TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS but don't allow ANY public access (Server/RPC Only)
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- ─── TOKEN BUCKET RPC ──────────────────────────────────────────
-- p_key: Unique identifier for the bucket
-- p_max_tokens: The capacity of the bucket
-- p_refill_rate_seconds: How many seconds it takes to refill 1 token
-- ────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.check_rate_limit(
    p_key TEXT, 
    p_max_tokens INTEGER, 
    p_refill_rate_seconds INTEGER
) 
RETURNS BOOLEAN 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_tokens INTEGER;
    v_last_updated TIMESTAMPTZ;
    v_refill_amount INTEGER;
BEGIN
    -- 1. Get the current bucket state
    SELECT tokens, last_updated INTO v_tokens, v_last_updated
    FROM public.rate_limits WHERE key = p_key;

    -- 2. If first visit, create the bucket
    IF NOT FOUND THEN
        INSERT INTO public.rate_limits (key, tokens, last_updated)
        VALUES (p_key, p_max_tokens - 1, now());
        RETURN TRUE;
    END IF;

    -- 3. Calculate how many tokens have been refilled since last visit
    -- extract(epoch from ...) gives the time difference in seconds
    v_refill_amount := floor(extract(epoch from (now() - v_last_updated)) / p_refill_rate_seconds);
    
    -- 4. Refill tokens (don't exceed bucket capacity)
    v_tokens := least(p_max_tokens, v_tokens + v_refill_amount);

    -- 5. Decision: Is there at least 1 token available?
    IF v_tokens > 0 THEN
        UPDATE public.rate_limits 
        SET tokens = v_tokens - 1, 
            last_updated = CASE WHEN v_refill_amount > 0 THEN now() ELSE last_updated END
        WHERE key = p_key;
        RETURN TRUE;
    ELSE
        -- No tokens available - Rate limited!
        RETURN FALSE;
    END IF;
END;
$$;

-- Cleanup Cron (Optional but recommended to keep table small)
-- Requires pg_cron extension or a manual trigger occasionally
DELETE FROM public.rate_limits WHERE last_updated < now() - interval '24 hours';
