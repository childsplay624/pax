-- ================================================================
-- PAN AFRICAN EXPRESS — FINANCIAL SOPHISTICATION MIGRATION
-- ================================================================

-- 1. Add Metadata to Transactions for Tax Breakdowns
ALTER TABLE public.wallet_transactions ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- 2. Create Settlements Table for Partner Payouts
CREATE TABLE IF NOT EXISTS public.settlements (
  id            UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount        NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  bank_name     TEXT,
  account_number TEXT,
  account_name  TEXT,
  status        TEXT         NOT NULL DEFAULT 'pending' 
                  CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  reference     TEXT         UNIQUE,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_settlements_user_id ON public.settlements(user_id);
CREATE INDEX IF NOT EXISTS idx_settlements_status  ON public.settlements(status);

-- RLS for Settlements
ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'settlements' AND policyname = 'Users can view own settlements') THEN
    CREATE POLICY "Users can view own settlements"
      ON public.settlements FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'settlements' AND policyname = 'Users can create settlement requests') THEN
    CREATE POLICY "Users can create settlement requests"
      ON public.settlements FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- 3. Enhance Profiles with KYC/Company details if missing
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_reg_number TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS vat_number TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS kyc_status TEXT DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'verified', 'rejected'));

-- Update handle_updated_at trigger for settlements
DROP TRIGGER IF EXISTS settlements_updated_at ON public.settlements;
CREATE TRIGGER settlements_updated_at
  BEFORE UPDATE ON public.settlements
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
