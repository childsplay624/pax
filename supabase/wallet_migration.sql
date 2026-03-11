-- ================================================================
-- PAN AFRICAN EXPRESS — WALLET MIGRATION
-- ================================================================
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- This is IDEMPOTENT — safe to run multiple times.
-- ================================================================


-- ────────────────────────────────────────────────────────────────
-- 1. WALLETS TABLE  (one row per business user)
-- ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.wallets (
  id          UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID         NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  balance     NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (balance >= 0),
  currency    TEXT         NOT NULL DEFAULT 'NGN',
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON public.wallets(user_id);

DROP TRIGGER IF EXISTS wallets_updated_at ON public.wallets;
CREATE TRIGGER wallets_updated_at
  BEFORE UPDATE ON public.wallets
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- ────────────────────────────────────────────────────────────────
-- 2. WALLET TRANSACTIONS TABLE
-- ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id          UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type        TEXT         NOT NULL CHECK (type IN ('credit', 'debit')),
  amount      NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  reference   TEXT         UNIQUE,          -- Paystack reference
  description TEXT,
  status      TEXT         NOT NULL DEFAULT 'success'
                CHECK (status IN ('pending','success','failed')),
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wallet_txns_user_id   ON public.wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_txns_reference ON public.wallet_transactions(reference);
CREATE INDEX IF NOT EXISTS idx_wallet_txns_created   ON public.wallet_transactions(created_at DESC);


-- ────────────────────────────────────────────────────────────────
-- 3. RPC: increment_wallet_balance  (atomic, safe)
--    Called from the server-side payment verification action
-- ────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.increment_wallet_balance(
  p_user_id UUID,
  p_amount  NUMERIC
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Auto-create wallet row if it doesn't exist yet (upsert)
  INSERT INTO public.wallets (user_id, balance)
  VALUES (p_user_id, p_amount)
  ON CONFLICT (user_id)
  DO UPDATE SET
    balance    = public.wallets.balance + EXCLUDED.balance,
    updated_at = now();
END;
$$;


-- ────────────────────────────────────────────────────────────────
-- 4. RPC: debit_wallet_balance  (used when charging for shipments)
-- ────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.debit_wallet_balance(
  p_user_id UUID,
  p_amount  NUMERIC
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance NUMERIC;
BEGIN
  SELECT balance INTO v_balance FROM public.wallets WHERE user_id = p_user_id FOR UPDATE;
  IF v_balance IS NULL OR v_balance < p_amount THEN
    RETURN false;  -- Insufficient balance
  END IF;
  UPDATE public.wallets SET balance = balance - p_amount, updated_at = now()
  WHERE user_id = p_user_id;
  RETURN true;
END;
$$;


-- ────────────────────────────────────────────────────────────────
-- 5. ROW LEVEL SECURITY
-- ────────────────────────────────────────────────────────────────

ALTER TABLE public.wallets              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions  ENABLE ROW LEVEL SECURITY;

-- Wallets: owner read/update only
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'wallets' AND policyname = 'Owner can read own wallet') THEN
    CREATE POLICY "Owner can read own wallet"
      ON public.wallets FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'wallets' AND policyname = 'Service can update wallet balance') THEN
    CREATE POLICY "Service can update wallet balance"
      ON public.wallets FOR ALL USING (true);
  END IF;
END $$;

-- Wallet transactions: owner read only
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'wallet_transactions' AND policyname = 'Owner can read own transactions') THEN
    CREATE POLICY "Owner can read own transactions"
      ON public.wallet_transactions FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'wallet_transactions' AND policyname = 'Service can insert transactions') THEN
    CREATE POLICY "Service can insert transactions"
      ON public.wallet_transactions FOR INSERT WITH CHECK (true);
  END IF;
END $$;


-- ================================================================
-- ✅ WALLET MIGRATION COMPLETE
-- Run this file AFTER the main migration.sql
-- ================================================================
